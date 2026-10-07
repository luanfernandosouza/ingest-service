import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { eventKey } from './event-key';
import { EventRecord } from './schemas/event.schema';

@Injectable()
export class EventsService {
  constructor(@InjectModel(EventRecord.name) private readonly events: Model<EventRecord>) {}

  async accept(dto: CreateEventDto) {
    const key = eventKey(dto);
    const doc = await this.events.findOneAndUpdate(
      { eventKey: key },
      { $setOnInsert: { eventKey: key, patientId: dto.patientId, type: dto.type, data: dto.data, ts: new Date(dto.ts), status: 'pending' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return { id: String(doc!._id), status: doc!.status };
  }
}
