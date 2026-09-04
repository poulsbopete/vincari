# Vincari × Elastic healthcare demo

Unaffiliated demo of **Microsoft Cloud for Healthcare** core capabilities, mapped onto **Elastic** solutions (Observability, Search, Security, LLM observability) on the **otel-demo** Serverless Observability project.

Not a Microsoft, Nuance, or Vincari product. Vincari CAPD was acquired by Nuance (2019) and became part of Microsoft Cloud for Healthcare after Microsoft acquired Nuance (2022).

## Capability map

| Microsoft capability | Demo route | Elastic solutions | `service.name` |
| --- | --- | --- | --- |
| Patient Engagement | `/engagement` | Observability SLOs/APM, Security, Search | `vincari-portal` |
| Virtual Health | `/telehealth` | Observability traces/logs (Teams join path) | `vincari-telehealth` |
| Clinical Insights | `/insights` | Observability + ES\|QL, Search (FHIR/AHDS) | `vincari-fhir` |
| AI Assistance | `/or` | LLM observability + CAPD/EHR/Fabric logs | `vincari-capd` |

Kibana: https://otel-demo-a5630c.kb.us-east-1.aws.elastic.cloud/

Logs: `logs-vincari.healthcare-default` (plus earlier `logs-vincari.capd-default`). Query `FROM logs-*`.

## Other routes

| Route | Purpose |
| --- | --- |
| `/` | Capability map |
| `/cases/[id]` | Operative note + CAPD; **Sign & file** |
| `/ops` | Fleet telemetry + Kibana deep links |
| `/about` | Lineage and Elastic mapping |

## Local

Copy `.env.example` to `.env.local` and set `ES_API_KEY`. Then `npm install && npm run dev`.
