export type RiskLevel = "low" | "medium" | "high" | "critical";
export type VendorStatus = "active" | "inactive" | "under_review" | "terminated";
export type ComplianceStatus = "compliant" | "non_compliant" | "pending" | "not_applicable";

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  address: string;
  country: string;
  status: VendorStatus;
  riskLevel: RiskLevel;
  onboardedAt: string;
  contractExpiry: string;
  annualSpend: number;
  description: string;
  compliance: ComplianceItem[];
  tags: string[];
}

export interface ComplianceItem {
  id: string;
  name: string;
  status: ComplianceStatus;
  dueDate: string;
  notes: string;
}

export interface RiskAssessment {
  vendorId: string;
  assessedAt: string;
  assessedBy: string;
  overallRisk: RiskLevel;
  financialRisk: RiskLevel;
  operationalRisk: RiskLevel;
  reputationalRisk: RiskLevel;
  cyberSecurityRisk: RiskLevel;
  notes: string;
}
