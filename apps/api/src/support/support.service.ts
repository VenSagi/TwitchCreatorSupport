import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CampaignStatus, SupportEventStatus, SupportProductType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async createCheckout(dto: CheckoutDto, clerkUserId: string) {
    const user = await this.users.syncMe(clerkUserId);

    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: dto.campaignId,
        creatorId: dto.creatorId,
        status: CampaignStatus.active,
      },
    });
    if (!campaign) {
      throw new NotFoundException('Active campaign not found for this creator');
    }

    const product = await this.prisma.supportProduct.findFirst({
      where: {
        id: dto.productId,
        creatorId: dto.creatorId,
        isActive: true,
        type: SupportProductType.tip,
      },
    });
    if (!product) {
      throw new NotFoundException('Tip product not found');
    }

    const existing = await this.prisma.supportEvent.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      if (existing.stripeSessionId && existing.status === SupportEventStatus.pending) {
        const session = await this.stripe.client.checkout.sessions.retrieve(
          existing.stripeSessionId,
        );
        if (session.url) {
          return {
            checkoutUrl: session.url,
            paymentSessionId: session.id,
            supportEventId: existing.id,
          };
        }
      }
      throw new BadRequestException('This idempotency key was already used');
    }

    const supportEvent = await this.prisma.supportEvent.create({
      data: {
        campaignId: campaign.id,
        creatorId: dto.creatorId,
        viewerId: user.id,
        productId: product.id,
        amount: product.price,
        currency: product.currency,
        message: dto.message,
        idempotencyKey: dto.idempotencyKey,
        status: SupportEventStatus.pending,
      },
    });

    const webBase = this.config.get<string>('WEB_APP_URL') ?? 'http://localhost:3000';

    const session = await this.stripe.client.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: product.currency,
            unit_amount: product.price,
            product_data: {
              name: product.name,
              description: product.description ?? undefined,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${webBase}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${webBase}/creators/${dto.creatorId}`,
      metadata: {
        supportEventId: supportEvent.id,
        campaignId: campaign.id,
        creatorId: dto.creatorId,
        productId: product.id,
        idempotencyKey: dto.idempotencyKey,
      },
    });

    await this.prisma.supportEvent.update({
      where: { id: supportEvent.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      throw new BadRequestException('Stripe did not return a checkout URL');
    }

    return {
      checkoutUrl: session.url,
      paymentSessionId: session.id,
      supportEventId: supportEvent.id,
    };
  }
}
