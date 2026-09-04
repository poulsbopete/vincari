import { DEFAULT_KIBANA_URL } from "./config";
import {
  kibanaApmServiceUrl,
  kibanaApmServicesUrl,
  kibanaDiscoverUrl,
  kibanaSloUrl,
  kibanaStreamsUrl,
} from "./deep-links";

export type CapabilityId =
  | "engagement"
  | "virtual-health"
  | "clinical-insights"
  | "ai-assistance";

export type ElasticProduct =
  | "Observability"
  | "Search"
  | "Security"
  | "LLM observability";

export type Capability = {
  id: CapabilityId;
  msTitle: string;
  msSummary: string;
  href: string;
  serviceName: string;
  elasticProducts: ElasticProduct[];
  elasticHow: string;
  signals: string[];
  demoAction: string;
  layers: {
    product: ElasticProduct;
    onScreen: string;
    inElastic: string;
  }[];
};

export const HEALTHCARE_SERVICES = [
  "vincari-portal",
  "vincari-telehealth",
  "vincari-fhir",
  "vincari-capd",
] as const;

export const SERVICE_KUERY = HEALTHCARE_SERVICES.map(
  (name) => `service.name : "${name}"`,
).join(" or ");

export const CAPABILITIES: Capability[] = [
  {
    id: "engagement",
    msTitle: "Patient Engagement",
    msSummary:
      "Personalized care plans and a secure self-service portal for appointment booking and health records.",
    href: "/engagement",
    serviceName: "vincari-portal",
    elasticProducts: ["Observability", "Security", "Search"],
    elasticHow:
      "Elastic Observability SLOs and APM watch booking and portal APIs. Logs show care-plan render and record-fetch failures. Elastic Security spots unusual record access; Search powers portal lookup without scanning the EHR on every click.",
    signals: [
      "appointment.book p95",
      "careplan.render errors",
      "records.fetch timeouts",
      "auth.anomaly (SIEM)",
    ],
    demoAction: "Book follow-up and open care plan",
    layers: [
      {
        product: "Search",
        onScreen: "Discharge summary, implant card, and med list lookup",
        inElastic:
          "Elasticsearch answers portal search from an index, not a full EHR scan on every click.",
      },
      {
        product: "Observability",
        onScreen: "Book follow-up writes logs, APM traces, and SLO samples",
        inElastic:
          "APM and SLOs watch booking and care-plan APIs; Discover shows care-plan render and record-fetch failures.",
      },
      {
        product: "Security",
        onScreen: "This chart is a patient-scoped session, not a bulk EHR pull",
        inElastic:
          "Elastic Security flags unusual record access — for example billing.svc reading FHIR Patients and CAPD notes.",
      },
    ],
  },
  {
    id: "virtual-health",
    msTitle: "Virtual Health",
    msSummary:
      "Secure video consultations and telehealth visits (Microsoft Teams in Cloud for Healthcare).",
    href: "/telehealth",
    serviceName: "vincari-telehealth",
    elasticProducts: ["Observability"],
    elasticHow:
      "Treat the Teams/Graph join path as a distributed transaction: join latency, session setup errors, and QoS warnings land in logs and traces. Discover + APM show whether the visit failed in identity, Graph, or media.",
    signals: [
      "telehealth.join duration",
      "teams.graph errors",
      "session.qos warnings",
    ],
    demoAction: "Start a Teams consult",
    layers: [
      {
        product: "Observability",
        onScreen: "Start visit writes the identity → Graph → media join path",
        inElastic:
          "Join latency, Graph errors, and QoS warnings land in the same APM trace family.",
      },
    ],
  },
  {
    id: "clinical-insights",
    msTitle: "Clinical Insights",
    msSummary:
      "Unify data from different systems into one patient view using Azure Health Data Services and FHIR.",
    href: "/insights",
    serviceName: "vincari-fhir",
    elasticProducts: ["Observability", "Search", "Security"],
    elasticHow:
      "ES|QL correlates FHIR Patient, Encounter, and DocumentReference pipeline health from AHDS and the EHR. Observability traces bundle assemble latency; Elasticsearch can search clinical documents sitting beside the FHIR store. Elastic Security watches who is reading those Patients — a billing service account pulling the OR board is a SIEM finding, not an APM timeout.",
    signals: [
      "fhir.patient.read",
      "fhir.bundle.assemble",
      "ahds.export lag",
      "document.search",
      "unusual EHR access (SIEM)",
    ],
    demoAction: "Assemble unified FHIR view",
    layers: [
      {
        product: "Search",
        onScreen: "DocumentReference lookup beside the FHIR store",
        inElastic:
          "Elasticsearch searches clinical documents without walking every FHIR resource.",
      },
      {
        product: "Observability",
        onScreen: "Assemble bundle is a traced pipeline",
        inElastic:
          "ES|QL and APM correlate Patient, Encounter, and DocumentReference assemble latency.",
      },
      {
        product: "Security",
        onScreen: "Who is allowed to read this Patient bundle",
        inElastic:
          "A billing service account pulling the OR board is a SIEM finding, not an APM timeout.",
      },
    ],
  },
  {
    id: "ai-assistance",
    msTitle: "AI Assistance",
    msSummary:
      "Streamline clinical notes and tasks with Surgical CAPD, Dragon Copilot, and Microsoft Fabric.",
    href: "/or",
    serviceName: "vincari-capd",
    elasticProducts: ["LLM observability", "Observability"],
    elasticHow:
      "LLM observability (EDOT / gen_ai spans) tracks note-draft tokens, model, and latency. CAPD suggestions, EHR pulls, and Fabric job completions are the same trace family in Serverless Observability.",
    signals: [
      "gen_ai note.draft tokens",
      "capd.suggest",
      "ehr.pull errors",
      "fabric.pipeline",
    ],
    demoAction: "Sign a Surgical CAPD operative note",
    layers: [
      {
        product: "LLM observability",
        onScreen: "Note draft tokens, model, and latency",
        inElastic:
          "gen_ai spans on the same CAPD trace as EHR pulls and Fabric jobs.",
      },
      {
        product: "Observability",
        onScreen: "Sign & file writes logs plus the APM waterfall",
        inElastic:
          "CAPD suggestions, EHR pulls, and note.signed share one trace.id in Serverless Observability.",
      },
    ],
  },
];

export function capabilityById(id: CapabilityId) {
  return CAPABILITIES.find((item) => item.id === id);
}

export function capabilityDiscoverQuery(serviceName: string) {
  return [
    "FROM logs-*",
    `| WHERE service.name == "${serviceName}"`,
    "| SORT @timestamp DESC",
    "| KEEP @timestamp, log.level, message, event.action, service.name, trace.id, event.duration",
    "| LIMIT 50",
  ].join(" ");
}

export function fleetDiscoverQuery() {
  const list = HEALTHCARE_SERVICES.map((name) => `"${name}"`).join(", ");
  return [
    "FROM logs-*",
    `| WHERE service.name IN (${list})`,
    "| SORT @timestamp DESC",
    "| KEEP @timestamp, log.level, message, event.action, service.name, trace.id, event.duration",
    "| LIMIT 50",
  ].join(" ");
}

export function capabilityLinks(
  kibanaUrl = DEFAULT_KIBANA_URL,
  serviceName?: string,
) {
  const service = serviceName ?? "vincari-capd";
  return {
    discover: kibanaDiscoverUrl(kibanaUrl, {
      query: capabilityDiscoverQuery(service),
    }),
    fleet: kibanaDiscoverUrl(kibanaUrl, { query: fleetDiscoverQuery() }),
    apmService: kibanaApmServiceUrl(kibanaUrl, service),
    apmFleet: kibanaApmServicesUrl(kibanaUrl),
    slos: kibanaSloUrl(kibanaUrl),
    streams: kibanaStreamsUrl(kibanaUrl),
  };
}
