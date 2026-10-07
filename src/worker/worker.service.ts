import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventRecord } from '../events/schemas/event.schema';

const sleep = (ms:number) => new Promise(r => setTimeout(r, ms));
@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private running = true;
  constructor(@InjectModel(EventRecord.name) private readonly events: Model<EventRecord>) {}
  onModuleInit() { void this.loop(); }
  onModuleDestroy() { this.running = false; }

  private async loop() {
    await this.recoverAbandonedWork();
    while (this.running) {
      const job = await this.claimNextSafeEvent();
      if (!job) { await sleep(Number(process.env.WORKER_POLL_MS ?? 250)); continue; }
      try {
        await sleep(Number(process.env.PROCESSING_DELAY_MS ?? 5000));
        await this.events.updateOne({ _id: job._id, status: 'processing' }, { $set: { status: 'processed', processedAt: new Date(), result: { processed: true } } });
      } catch (error) {
        this.logger.error(error);
        await this.events.updateOne({ _id: job._id }, { $set: { status: 'pending' }, $unset: { processingStartedAt: 1 } });
      }
    }
  }

  private async recoverAbandonedWork() {
    await this.events.updateMany({ status: 'processing' }, { $set: { status: 'pending' }, $unset: { processingStartedAt: 1 } });
  }

  private async claimNextSafeEvent() {
    const candidates = await this.events.find({ status: 'pending' }).sort({ ts: 1, _id: 1 }).limit(25).lean();
    for (const candidate of candidates) {
      const earlier = await this.events.exists({ patientId: candidate.patientId, status: { $ne: 'processed' }, $or: [{ ts: { $lt: candidate.ts } }, { ts: candidate.ts, _id: { $lt: candidate._id } }] });
      if (earlier) continue;
      const claimed = await this.events.findOneAndUpdate({ _id: candidate._id, status: 'pending' }, { $set: { status: 'processing', processingStartedAt: new Date() } }, { new: true }).lean();
      if (claimed) return claimed;
    }
    return null;
  }
}
