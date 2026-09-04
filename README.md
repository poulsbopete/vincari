# Vincari surgical CAPD demo

Unaffiliated **surgical computer-assisted physician documentation (CAPD)** demo for surgeons’ OR workflow. The UI is a Vincari-style worklist; the backend writes workflow logs into an **Elastic Cloud Serverless Observability** project and exposes **Kibana deep links** (Discover ES|QL, APM services, Streams).

This is not a Microsoft, Nuance, or Vincari product. Vincari’s CAPD tools were acquired by Nuance (2019) and became part of Microsoft Cloud for Healthcare after Microsoft acquired Nuance (2022).

## App surfaces

| Route | Purpose |
| --- | --- |
| `/` | Today’s OR board |
| `/cases/[id]` | Operative note + CAPD gaps; **Sign & file** ingests a log with `trace.id` |
| `/ops` | Live events from Elasticsearch + Kibana deep links |
| `/about` | Acquisition lineage and demo disclaimer |

## Elastic

Uses the shared **otel-demo** serverless project by default (`ES_URL` / `KIBANA_URL`). Logs land on `logs-vincari.capd-default` with `service.name: vincari-capd`.

Copy `.env.example` to `.env.local` and set:

- `ES_URL` or `ELASTICSEARCH_URL`
- `ES_API_KEY` or `ELASTICSEARCH_API_KEY`
- `KIBANA_URL` (used to build deep links)

Then:

```bash
npm install
npm run dev
```

On `/ops`, click **Seed 80 workflow events**, or sign a note from a case.

## Deploy

Vercel (this repo). Add the same env vars for Production / Preview / Development. Never commit `.env.local`.
