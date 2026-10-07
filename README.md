# Ingest Service

A small production-minded implementation of the **Ingest Service test assignment** using NestJS, TypeScript and MongoDB.

## Architecture

`POST /events` validates the payload, derives a deterministic event key, and durably inserts the event into the single `events` MongoDB collection. It immediately returns **202 Accepted**; slow processing is intentionally not performed on the HTTP request path.

A background worker polls persisted pending events, claims work atomically, simulates the ~5 second external call, and marks the record processed. The database is therefore the durable hand-off between ingestion and processing: a process restart after HTTP acknowledgement does not lose the event.

### Important decisions

- **Immediate acknowledgement:** HTTP only performs validation + durable persistence.
- **Idempotent ingestion:** a SHA-256 key over the canonical event payload has a unique MongoDB index. Identical retries converge on one stored record.
- **Per-patient ordering:** before claiming an event, the worker verifies that no earlier unprocessed event exists for the same patient. Different patients may progress independently.
- **Crash recovery:** records left in `processing` are returned to `pending` at worker startup. This gives at-least-once execution of the external operation while preventing the event itself from being counted twice in MongoDB.
- **Single collection:** intake state, processing state and result all live in `events`, matching the assignment constraint.

## Important trade-offs

The input contract has no upstream `eventId`, so exact semantic deduplication is impossible. This implementation treats byte-equivalent logical payloads (including timestamp) as the same event. In a real integration I would strongly prefer a sender-provided immutable event ID/idempotency key.

The simulated external call has no idempotency contract. A crash after that call succeeds but before MongoDB is updated can cause the external operation to execute again. Exactly-once side effects require cooperation from the downstream system (an idempotency key) or a transactional/outbox-style protocol. The service does not pretend a local database flag can solve that distributed-systems boundary.

The worker is intentionally modest for a 4–8 hour exercise. At 1,000 events/minute with 5 seconds of work, sustained throughput requires roughly 84 concurrent processing slots before headroom. This sample worker processes one event per instance; production would use bounded concurrency and horizontal worker replicas, while preserving per-patient serialization. MongoDB is used as the durable queue here to respect the requested local footprint; at larger scale I would consider a dedicated durable broker/queue.

Ordering is based on the event's `ts`. Because late events can arrive after a newer event has already been processed, strict event-time ordering cannot be guaranteed without an explicit lateness/watermark policy or upstream sequence number. The implementation orders all events that are currently known and documents this unavoidable limitation.

## Run locally

Requirements: Node.js 20+ and Docker.

```bash
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

Send an event:

```bash
curl -i -X POST http://localhost:3000/events \
  -H 'content-type: application/json' \
  -d '{"patientId":"patient-1","type":"heart-rate","data":{"bpm":72},"ts":"2026-10-07T18:00:00Z"}'
```

The response is immediate and returns HTTP 202. Inspect processing state with:

```bash
docker compose exec mongo mongosh ingest --eval 'db.events.find().sort({patientId:1,ts:1}).pretty()'
```

## Tests

```bash
npm test
```

The included unit tests focus on deterministic idempotency-key generation, one of the riskiest correctness boundaries. With more time I would add integration tests using a real ephemeral MongoDB instance covering concurrent duplicate POSTs, crash recovery, and per-patient ordering.

## What I would add with more time

I would add graceful worker leases rather than startup-wide recovery, bounded parallelism, metrics for queue age/processing latency/retries, structured logging and health/readiness endpoints. I would also add integration/load tests demonstrating sustained throughput and restart behavior, and define an explicit dead-letter/retry policy for real downstream failures.
