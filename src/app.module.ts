import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsModule } from './events/events.module';
import { WorkerModule } from './worker/worker.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ingest'),
    EventsModule,
    WorkerModule,
  ],
})
export class AppModule {}
