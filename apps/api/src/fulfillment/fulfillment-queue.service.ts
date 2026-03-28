import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { FulfillmentService } from './fulfillment.service';

const QUEUE_NAME = 'fulfillment';

@Injectable()
export class FulfillmentQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FulfillmentQueueService.name);
  private connection!: IORedis;
  private queue!: Queue;
  private worker!: Worker;

  constructor(
    private readonly config: ConfigService,
    private readonly fulfillment: FulfillmentService,
  ) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
    this.connection = new IORedis(url, { maxRetriesPerRequest: null });

    this.queue = new Queue(QUEUE_NAME, { connection: this.connection });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const supportEventId = job.data?.supportEventId as string;
        if (!supportEventId) return;
        await this.fulfillment.fulfillSupportEvent(supportEventId);
      },
      { connection: this.connection.duplicate() },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Job ${job?.id} failed after ${job?.attemptsMade} attempts`,
        err?.stack,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }

  async enqueueFulfillment(supportEventId: string) {
    await this.queue.add(
      'fulfill',
      { supportEventId },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
