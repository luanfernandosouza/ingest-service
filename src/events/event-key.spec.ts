import { eventKey } from './event-key';
describe('eventKey', () => {
  it('is stable across object key ordering', () => {
    const a = { patientId:'p1', type:'vitals', data:{b:2,a:1}, ts:'2026-01-01T00:00:00Z' };
    const b = { patientId:'p1', type:'vitals', data:{a:1,b:2}, ts:'2026-01-01T00:00:00Z' };
    expect(eventKey(a)).toBe(eventKey(b));
  });
  it('changes for a different event', () => {
    const a = { patientId:'p1', type:'vitals', data:{a:1}, ts:'2026-01-01T00:00:00Z' };
    const b = { ...a, ts:'2026-01-01T00:00:01Z' };
    expect(eventKey(a)).not.toBe(eventKey(b));
  });
});
