import { createHash } from 'crypto';
import { CreateEventDto } from './dto/create-event.dto';

function stable(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
}
export const eventKey = (event: CreateEventDto) => createHash('sha256').update(stable(event)).digest('hex');
