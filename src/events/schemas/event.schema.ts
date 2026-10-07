import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<EventRecord>;
export type EventStatus = 'pending' | 'processing' | 'processed';

@Schema({ collection: 'events', timestamps: true, versionKey: false })
export class EventRecord {
  @Prop({ required: true, unique: true, index: true }) eventKey!: string;
  @Prop({ required: true, index: true }) patientId!: string;
  @Prop({ required: true }) type!: string;
  @Prop({ required: true, type: Object }) data!: Record<string, unknown>;
  @Prop({ required: true, index: true }) ts!: Date;
  @Prop({ required: true, enum: ['pending','processing','processed'], default: 'pending', index: true }) status!: EventStatus;
  @Prop() processingStartedAt?: Date;
  @Prop() processedAt?: Date;
  @Prop({ type: Object, default: null }) result?: Record<string, unknown> | null;
}
export const EventSchema = SchemaFactory.createForClass(EventRecord);
EventSchema.index({ patientId: 1, ts: 1, status: 1 });
