import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignGateway } from '../realtime/campaign.gateway';
import { CampaignStatus, SupportEventStatus } from '@prisma/client';

@Injectable()
export class FulfillmentService {
  private readonly logger = new Logger(FulfillmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: CampaignGateway,
  ) {}

  async fulfillSupportEvent(supportEventId: string) {
    const event = await this.prisma.supportEvent.findUnique({
      where: { id: supportEventId },
      include: {
        campaign: true,
        viewer: true,
        product: true,
      },
    });

    if (!event) {
      this.logger.warn(`Support event ${supportEventId} not found`);
      return;
    }
    if (event.status !== SupportEventStatus.paid) {
      this.logger.warn(`Support event ${supportEventId} not in paid state`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.supportEvent.findUnique({ where: { id: supportEventId } });
      if (!fresh || fresh.status === SupportEventStatus.fulfilled) {
        return;
      }

      await tx.campaign.update({
        where: { id: event.campaignId },
        data: { currentAmount: { increment: event.amount } },
      });

      await tx.supportEvent.update({
        where: { id: supportEventId },
        data: { status: SupportEventStatus.fulfilled },
      });

      await tx.activityFeedItem.create({
        data: {
          creatorId: event.creatorId,
          campaignId: event.campaignId,
          eventType: 'tip',
          payload: {
            amount: event.amount,
            currency: event.currency,
            supporterDisplayName: event.viewer?.displayName ?? 'Supporter',
            message: event.message,
            supportEventId: event.id,
          },
        },
      });

      if (event.viewerId) {
        await tx.leaderboardSnapshot.upsert({
          where: {
            campaignId_viewerId: {
              campaignId: event.campaignId,
              viewerId: event.viewerId,
            },
          },
          create: {
            creatorId: event.creatorId,
            campaignId: event.campaignId,
            viewerId: event.viewerId,
            totalContribution: event.amount,
            rank: 0,
          },
          update: {
            totalContribution: { increment: event.amount },
          },
        });
      }
    });

    await this.recomputeRanks(event.campaignId);

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: event.campaignId },
    });
    if (!campaign) return;

    const progressPercent =
      campaign.goalAmount > 0
        ? Math.min(100, Math.round((campaign.currentAmount / campaign.goalAmount) * 100))
        : 0;

    this.gateway.emitCampaignProgress(event.campaignId, {
      campaignId: event.campaignId,
      currentAmount: campaign.currentAmount,
      goalAmount: campaign.goalAmount,
      progressPercent,
    });

    this.gateway.emitNewSupport(event.campaignId, {
      campaignId: event.campaignId,
      eventId: event.id,
      amount: event.amount,
      currency: event.currency,
      supporterDisplayName: event.viewer?.displayName ?? 'Supporter',
      message: event.message,
      createdAt: new Date().toISOString(),
    });

    const leaderboardRows = await this.prisma.leaderboardSnapshot.findMany({
      where: { campaignId: event.campaignId },
      orderBy: { rank: 'asc' },
      take: 20,
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: leaderboardRows.map((r) => r.viewerId) } },
    });
    const nameById = new Map(users.map((u) => [u.id, u.displayName ?? u.username ?? 'Supporter']));

    this.gateway.emitLeaderboard(event.campaignId, {
      campaignId: event.campaignId,
      entries: leaderboardRows.map((r) => ({
        viewerId: r.viewerId,
        displayName: nameById.get(r.viewerId) ?? 'Supporter',
        totalContribution: r.totalContribution,
        rank: r.rank,
      })),
    });

    if (
      campaign.currentAmount >= campaign.goalAmount &&
      campaign.status === CampaignStatus.active
    ) {
      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'completed' },
      });
    }
  }

  private async recomputeRanks(campaignId: string) {
    const rows = await this.prisma.leaderboardSnapshot.findMany({
      where: { campaignId },
      orderBy: { totalContribution: 'desc' },
    });
    for (let i = 0; i < rows.length; i++) {
      await this.prisma.leaderboardSnapshot.update({
        where: { id: rows[i].id },
        data: { rank: i + 1 },
      });
    }
  }
}
