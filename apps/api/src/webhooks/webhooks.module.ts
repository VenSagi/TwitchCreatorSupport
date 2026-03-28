import { Module } from '@nestjs/common';
import { StripeWebhookController } from './stripe-webhook.controller';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';

@Module({
  imports: [FulfillmentModule],
  controllers: [StripeWebhookController],
})
export class WebhooksModule {}
