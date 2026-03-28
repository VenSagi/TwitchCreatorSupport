import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import type Stripe from 'stripe';
import { SupportEventStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { FulfillmentQueueService } from '../fulfillment/fulfillment-queue.service';
import { Public } from '../auth/public.decorator';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(
    private readonly stripe: StripeService,
    private readonly prisma: PrismaService,
    private readonly queue: FulfillmentQueueService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @SkipThrottle()
  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string | undefined,
  ) {
    const whSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!whSecret || !sig) {
      throw new BadRequestException('Missing webhook configuration');
    }

    const raw = req.rawBody;
    if (!raw) {
      throw new BadRequestException('Missing raw body for Stripe');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.client.webhooks.constructEvent(raw, sig, whSecret);
    } catch {
      throw new BadRequestException('Invalid Stripe signature');
    }

    const seen = await this.prisma.stripeWebhookEvent.findUnique({
      where: { stripeId: event.id },
    });
    if (seen) {
      return { received: true, duplicate: true };
    }

    await this.prisma.stripeWebhookEvent.create({
      data: { stripeId: event.id, type: event.type, processed: false },
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const supportEventId = session.metadata?.supportEventId;
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      if (supportEventId && paymentIntentId) {
        const existing = await this.prisma.supportEvent.findUnique({
          where: { id: supportEventId },
        });
        if (existing && existing.status === SupportEventStatus.pending) {
          await this.prisma.supportEvent.update({
            where: { id: supportEventId },
            data: {
              status: SupportEventStatus.paid,
              paymentIntentId,
              stripeSessionId: session.id,
            },
          });
          await this.queue.enqueueFulfillment(supportEventId);
        } else if (existing?.status === SupportEventStatus.paid) {
          await this.queue.enqueueFulfillment(supportEventId);
        }
      }
    }

    await this.prisma.stripeWebhookEvent.update({
      where: { stripeId: event.id },
      data: { processed: true },
    });

    return { received: true };
  }
}
