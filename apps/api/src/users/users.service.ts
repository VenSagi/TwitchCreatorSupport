import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async syncMe(clerkUserId: string) {
    return this.prisma.user.upsert({
      where: { clerkUserId },
      create: {
        clerkUserId,
        role: UserRole.viewer,
      },
      update: {},
      include: { creatorProfile: true },
    });
  }

  async findByClerkId(clerkUserId: string) {
    return this.prisma.user.findUnique({
      where: { clerkUserId },
      include: { creatorProfile: true },
    });
  }
}
