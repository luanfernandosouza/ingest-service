import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}
  @Post()
  @HttpCode(202)
  create(@Body() dto: CreateEventDto) { return this.service.accept(dto); }
}
