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
