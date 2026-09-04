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

Kibana: https://otel-demo-a5630c.kb.us-east-1.aws.elastic.cloud/

Logs: `logs-vincari.healthcare-default`. Query `FROM logs-*`.

## Other routes

| Route | Purpose |
| --- | --- |
| `/` | Capability map |
| `/cases/[id]` | Surgical CAPD operative note; **Sign & file** |
| `/ops` | Fleet telemetry + Kibana deep links |
| `/about` | Lineage and Elastic mapping |

## Local

Copy `.env.example` to `.env.local` and set `ES_API_KEY`. Then `npm install && npm run dev`.
