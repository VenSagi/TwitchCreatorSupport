import { Module } from '@nestjs/common';
import { FulfillmentService } from './fulfillment.service';
import { FulfillmentQueueService } from './fulfillment-queue.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  providers: [FulfillmentService, FulfillmentQueueService],
  exports: [FulfillmentService, FulfillmentQueueService],
})
export class FulfillmentModule {}
