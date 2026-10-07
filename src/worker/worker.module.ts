import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventRecord, EventSchema } from '../events/schemas/event.schema';
import { WorkerService } from './worker.service';
@Module({ imports:[MongooseModule.forFeature([{name:EventRecord.name,schema:EventSchema}])], providers:[WorkerService] })
export class WorkerModule {}
