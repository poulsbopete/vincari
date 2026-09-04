# Surgical CAPD × Elastic healthcare demo

Unaffiliated demo of **Surgical CAPD** (computer-assisted physician documentation for the OR) in **Microsoft Cloud for Healthcare**, mapped onto **Elastic** solutions on the **otel-demo** Serverless Observability project.

Not a Microsoft, Nuance, or Vincari product. Surgical CAPD is the current name for this capability. Vincari was the original product, acquired by Nuance (2019) and folded into Microsoft Cloud for Healthcare after Microsoft acquired Nuance (2022).

## Capability map

| Microsoft capability | Demo route | Elastic solutions | `service.name` |
| --- | --- | --- | --- |
| Patient Engagement | `/engagement` | Observability SLOs/APM, Security, Search | `vincari-portal` |
| Virtual Health | `/telehealth` | Observability traces/logs (Teams join path) | `vincari-telehealth` |
| Clinical Insights | `/insights` | Observability + ES\|QL, Search (FHIR/AHDS) | `vincari-fhir` |
| AI Assistance (Surgical CAPD) | `/or` | LLM observability + CAPD/EHR/Fabric logs | `vincari-capd` |

App: https://healthcare-capd.vercel.app

Kibana: https://otel-demo-a5630c.kb.us-east-1.aws.elastic.cloud/

Vega dashboard: https://otel-demo-a5630c.kb.us-east-1.aws.elastic.cloud/app/dashboards#/view/36a7f722-bd87-4802-8a5d-b18d59c0275d?_g=(time:(from:now-24h,to:now))

Specs live in `kibana/vega/`. Logs: `logs-vincari.healthcare-default`. Query `FROM logs-*`.

APM traces for `vincari-portal`, `vincari-telehealth`, `vincari-fhir`, and `vincari-capd` are sent via OTLP on every demo action, every 45s while the app is open, and every minute from a Vercel cron (`/api/apm`).

## Other routes

| Route | Purpose |
| --- | --- |
| `/` | Capability map |
| `/cases/[id]` | Surgical CAPD operative note; **Sign & file** |
| `/ops` | Fleet telemetry + Kibana deep links |
| `/about` | Lineage and Elastic mapping |

## Local

Copy `.env.example` to `.env.local` and set `ES_API_KEY`. Then `npm install && npm run dev`.
