import { RiskLevel, VendorStatus, ComplianceStatus } from "./types";

export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "critical":
      return "bg-red-100 text-red-800";
  }
}

export function vendorStatusColor(status: VendorStatus): string {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-gray-100 text-gray-700";
    case "under_review":
      return "bg-blue-100 text-blue-800";
    case "terminated":
      return "bg-red-100 text-red-800";
  }
}

export function complianceStatusColor(status: ComplianceStatus): string {
  switch (status) {
    case "compliant":
      return "bg-green-100 text-green-800";
    case "non_compliant":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "not_applicable":
      return "bg-gray-100 text-gray-700";
  }
}

export function formatLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
