import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventRecord, EventSchema } from './schemas/event.schema';
@Module({ imports:[MongooseModule.forFeature([{ name: EventRecord.name, schema: EventSchema }])], controllers:[EventsController], providers:[EventsService], exports:[MongooseModule] })
export class EventsModule {}
