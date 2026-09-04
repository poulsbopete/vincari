export type CaseStatus =
  | "pre-op"
  | "in-or"
  | "documenting"
  | "coding-hold"
  | "filed";

export type CapdSuggestion = {
  id: string;
  severity: "required" | "quality" | "reimbursement";
  title: string;
  detail: string;
  insertText: string;
};

export type SurgicalCase = {
  id: string;
  mrn: string;
  patient: string;
  age: number;
  sex: "F" | "M";
  procedure: string;
  cptHint: string;
  laterality?: "left" | "right" | "bilateral";
  surgeon: string;
  or: string;
  start: string;
  status: CaseStatus;
  completeness: number;
  note: string;
  suggestions: CapdSuggestion[];
};

export const CASES: SurgicalCase[] = [
  {
    id: "OR-4412",
    mrn: "SYN-104882",
    patient: "Rivera, Ana",
    age: 67,
    sex: "F",
    procedure: "Primary total knee arthroplasty",
    cptHint: "27447",
    laterality: "left",
    surgeon: "Elena Vargas, MD",
    or: "OR 3",
    start: "07:30",
    status: "documenting",
    completeness: 62,
    note: `OPERATIVE NOTE — DRAFT
Surgeon: Elena Vargas, MD
Procedure: Total knee arthroplasty
Indication: End-stage osteoarthritis with failed conservative therapy.

Findings: Tricompartmental degenerative change. Patella resurfaced. Cemented components placed. Tourniquet time 64 minutes. Estimated blood loss 150 mL. No intraoperative complications.

Disposition: PACU, weight bearing as tolerated per protocol.`,
    suggestions: [
      {
        id: "lat",
        severity: "required",
        title: "Laterality not stated in procedure line",
        detail:
          "CPT 27447 is laterality-sensitive. CAPD detected “left” in the consent and laterality field but not in the procedure statement.",
        insertText:
          "Procedure: Primary total knee arthroplasty, left knee (CPT 27447).",
      },
      {
        id: "implant",
        severity: "reimbursement",
        title: "Implant identifiers missing",
        detail:
          "UDI / catalog numbers are required for implant registry and appropriate device billing.",
        insertText:
          "Implants: femoral component cat. TKA-F-62, tibial tray TKA-T-5, polyethylene insert 11 mm, patellar button 32 mm. All lots recorded in the implant log.",
      },
      {
        id: "asa",
        severity: "quality",
        title: "ASA class and anesthesia type omitted",
        detail: "Quality reporting and anesthesia billing expect ASA and modality.",
        insertText:
          "Anesthesia: spinal with sedation. ASA III (HTN, T2DM, BMI 34).",
      },
    ],
  },
  {
    id: "OR-4418",
    mrn: "SYN-110204",
    patient: "Chen, Marcus",
    age: 54,
    sex: "M",
    procedure: "Laparoscopic cholecystectomy",
    cptHint: "47562",
    surgeon: "Priya Nair, MD",
    or: "OR 1",
    start: "09:15",
    status: "in-or",
    completeness: 28,
    note: `OPERATIVE NOTE — DRAFT
Procedure: Laparoscopic cholecystectomy
Indication: Symptomatic cholelithiasis, failed medical management.

Ports placed. Critical view of safety obtained. Cystic duct and artery clipped and divided. Gallbladder removed via umbilical port. No bile leak. Counts correct.`,
    suggestions: [
      {
        id: "cholangiogram",
        severity: "reimbursement",
        title: "Intraoperative cholangiogram not addressed",
        detail:
          "If IOC was not performed, a brief statement prevents downcoding disputes.",
        insertText:
          "Intraoperative cholangiogram was not indicated; anatomy was clear after critical view of safety.",
      },
      {
        id: "stone",
        severity: "quality",
        title: "Specimen findings incomplete",
        detail: "Document stone burden and bile appearance for the path correlation.",
        insertText:
          "Specimen: gallbladder with multiple mixed stones, largest 12 mm. Bile non-purulent.",
      },
    ],
  },
  {
    id: "OR-4421",
    mrn: "SYN-098331",
    patient: "Okafor, Tessa",
    age: 61,
    sex: "F",
    procedure: "ACDF C5–C6",
    cptHint: "22551",
    surgeon: "James Okonkwo, MD",
    or: "OR 5",
    start: "11:00",
    status: "coding-hold",
    completeness: 74,
    note: `OPERATIVE NOTE — DRAFT
Procedure: Anterior cervical discectomy and fusion C5–C6
Indication: C5–C6 spondylosis with radiculopathy refractory to 12 weeks of conservative care.

Left-sided Smith-Robinson approach. Diskectomy, foraminotomy, interbody cage and plate. Neuromonitoring stable. Wound closed in layers.`,
    suggestions: [
      {
        id: "levels",
        severity: "required",
        title: "Confirm single vs additional level",
        detail:
          "Additional level (22552) is a common missed add-on. Imaging shows only C5–C6.",
        insertText:
          "This was a single-level ACDF at C5–C6. No additional levels were decompressed or fused.",
      },
      {
        id: "graft",
        severity: "reimbursement",
        title: "Graft / cage type unspecified",
        detail: "Allograft vs autograft vs PEEK cage changes implant and graft codes.",
        insertText:
          "Interbody: PEEK cage packed with local autograft and cancellous allograft. Anterior plate with four screws.",
      },
    ],
  },
  {
    id: "OR-4404",
    mrn: "SYN-121009",
    patient: "Patel, Ravi",
    age: 72,
    sex: "M",
    procedure: "Phacoemulsification with IOL, right eye",
    cptHint: "66984",
    laterality: "right",
    surgeon: "Sofia Almeida, MD",
    or: "ASC 2",
    start: "08:00",
    status: "filed",
    completeness: 96,
    note: `OPERATIVE NOTE
Procedure: Phacoemulsification with posterior chamber IOL, right eye (CPT 66984).
Indication: Visually significant nuclear sclerotic cataract, right.

Clear corneal incision. Capsulorhexis. Nucleus emulsified. Cortex irrigated. Foldable acrylic IOL placed in the bag. Wounds Seidel negative. Antibiotic/steroid given.

Disposition: Home with shield. Follow-up tomorrow.`,
    suggestions: [],
  },
  {
    id: "OR-4430",
    mrn: "SYN-117550",
    patient: "Brooks, Helen",
    age: 58,
    sex: "F",
    procedure: "Robotic-assisted radical prostatectomy",
    cptHint: "55866",
    surgeon: "Gregory House, MD",
    or: "OR 6",
    start: "13:30",
    status: "pre-op",
    completeness: 12,
    note: `OPERATIVE NOTE — PRE-OP TEMPLATE
Procedure: Robotic-assisted laparoscopic radical prostatectomy
Indication: Localized prostate adenocarcinoma, Gleason 3+4, PSA 7.2.

Consent reviewed. Nerve-sparing intent: bilateral if planes permit.`,
    suggestions: [
      {
        id: "nerve",
        severity: "quality",
        title: "Nerve-sparing outcome will need intra-op confirmation",
        detail:
          "CAPD will prompt after console time to record laterality of nerve spare and anastomosis leak test.",
        insertText:
          "Pending intra-operative confirmation of nerve-sparing and vesicourethral anastomosis leak test.",
      },
    ],
  },
];

export function getCase(id: string) {
  return CASES.find((c) => c.id === id);
}

export const STATUS_LABEL: Record<CaseStatus, string> = {
  "pre-op": "Pre-op",
  "in-or": "In OR",
  documenting: "Documenting",
  "coding-hold": "Coding hold",
  filed: "Filed",
};
