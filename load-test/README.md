# Load Testing (k6)

This folder contains k6 scripts to validate performance characteristics of the Palmonas Admin CRM API.

## Prerequisites

- k6 installed (`brew install k6` on macOS)
- API running locally (via Docker Compose or manual run)

## Scenarios

- **Normal load**: ~20 VUs, validates p95 < 500ms
- **Peak load**: ramp up to 100 VUs
- **Stress test**: ramp arrival rate up to find breaking point

## Run

```bash
cd /Users/kartikey/Desktop/task2/load-test

# Normal + peak + stress combined
k6 run k6-orders.js --env BASE_URL=http://localhost:4000
```

Use k6 output (and optional HTML / JSON reports) to document:

- p95 / p99 latency
- Error rates
- Throughput

