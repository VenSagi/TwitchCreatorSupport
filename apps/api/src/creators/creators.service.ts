import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CreatorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(creatorId: string) {
    const profile = await this.prisma.creatorProfile.findUnique({
      where: { id: creatorId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Creator not found');
    return {
      id: profile.id,
      channelName: profile.channelName,
      bio: profile.bio,
      bannerUrl: profile.bannerUrl,
      isLiveMock: profile.isLiveMock,
      displayName: profile.user.displayName ?? profile.channelName,
      username: profile.user.username,
      avatarUrl: profile.user.avatarUrl,
    };
  }

  async listCampaigns(creatorId: string) {
    return this.prisma.campaign.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listProducts(creatorId: string) {
    return this.prisma.supportProduct.findMany({
      where: { creatorId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
