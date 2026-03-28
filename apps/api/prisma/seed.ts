import { PrismaClient, UserRole, CampaignStatus, SupportProductType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const creatorUser = await prisma.user.upsert({
    where: { clerkUserId: 'seed_clerk_creator' },
    create: {
      clerkUserId: 'seed_clerk_creator',
      email: 'ava@example.com',
      username: 'avalive',
      displayName: 'AvaLive',
      role: UserRole.creator,
    },
    update: {},
  });

  const creator = await prisma.creatorProfile.upsert({
    where: { userId: creatorUser.id },
    create: {
      id: 'seed_creator_avalive',
      userId: creatorUser.id,
      channelName: 'AvaLive',
      bio: 'Building HypeForge — thanks for the support!',
      isLiveMock: true,
    },
    update: { isLiveMock: true },
  });

  const campaign = await prisma.campaign.upsert({
    where: { id: 'seed_campaign_emote' },
    create: {
      id: 'seed_campaign_emote',
      creatorId: creator.id,
      title: 'New emote pack',
      description: '$100 goal for a fresh emote pack drop.',
      goalAmount: 100_00,
      currentAmount: 62_00,
      currency: 'usd',
      status: CampaignStatus.active,
    },
    update: {},
  });

  await prisma.supportProduct.upsert({
    where: { id: 'seed_product_tip' },
    create: {
      id: 'seed_product_tip',
      creatorId: creator.id,
      name: 'Tip',
      description: 'Support the stream',
      type: SupportProductType.tip,
      price: 5_00,
      currency: 'usd',
      isActive: true,
    },
    update: {},
  });

  console.log('Seed OK:', { creatorId: creator.id, campaignId: campaign.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
