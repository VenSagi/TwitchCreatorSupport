import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(campaignId: string, take = 50) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const items = await this.prisma.activityFeedItem.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return items;
  }

  async getLeaderboard(campaignId: string, take = 20) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const rows = await this.prisma.leaderboardSnapshot.findMany({
      where: { campaignId },
      orderBy: { rank: 'asc' },
      take,
    });
    const viewerIds = rows.map((r) => r.viewerId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: viewerIds } },
    });
    const nameById = new Map(
      users.map((u) => [u.id, u.displayName ?? u.username ?? 'Supporter']),
    );
    return rows.map((r) => ({
      ...r,
      displayName: nameById.get(r.viewerId) ?? 'Supporter',
    }));
  }

  async getStats(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        _count: { select: { supportEvents: true } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const progressPercent =
      campaign.goalAmount > 0
        ? Math.min(100, Math.round((campaign.currentAmount / campaign.goalAmount) * 100))
        : 0;

    return {
      campaignId: campaign.id,
      goalAmount: campaign.goalAmount,
      currentAmount: campaign.currentAmount,
      currency: campaign.currency,
      progressPercent,
      supportEventCount: campaign._count.supportEvents,
      status: campaign.status,
    };
  }
}
