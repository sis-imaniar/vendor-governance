import Link from "next/link";
import { vendors } from "@/lib/data";
import { formatCurrency, formatLabel } from "@/lib/utils";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";

export default function DashboardPage() {
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.status === "active").length;
  const highRiskVendors = vendors.filter(
    (v) => v.riskLevel === "high" || v.riskLevel === "critical"
  ).length;
  const nonCompliantVendors = vendors.filter((v) =>
    v.compliance.some((c) => c.status === "non_compliant")
  ).length;
  const totalSpend = vendors.reduce((sum, v) => sum + v.annualSpend, 0);

  const recentVendors = [...vendors]
    .sort((a, b) => new Date(b.onboardedAt).getTime() - new Date(a.onboardedAt).getTime())
    .slice(0, 5);

  const riskDistribution = {
    low: vendors.filter((v) => v.riskLevel === "low").length,
    medium: vendors.filter((v) => v.riskLevel === "medium").length,
    high: vendors.filter((v) => v.riskLevel === "high").length,
    critical: vendors.filter((v) => v.riskLevel === "critical").length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of vendor relationships, compliance, and risk posture.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <SummaryCard title="Total Vendors" value={totalVendors} description={`${activeVendors} active`} color="blue" />
        <SummaryCard title="Annual Spend" value={formatCurrency(totalSpend)} description="across all vendors" color="purple" />
        <SummaryCard title="High / Critical Risk" value={highRiskVendors} description="vendors require attention" color="orange" />
        <SummaryCard title="Non-Compliant" value={nonCompliantVendors} description="vendors with issues" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Recent Vendors</h2>
            <Link href="/vendors" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/vendors/${vendor.id}`} className="font-medium text-blue-700 hover:underline">{vendor.name}</Link>
                    <p className="text-xs text-gray-400">{vendor.category}</p>
                  </td>
                  <td className="px-6 py-3"><StatusBadge status={vendor.status} /></td>
                  <td className="px-6 py-3"><RiskBadge level={vendor.riskLevel} /></td>
                  <td className="px-6 py-3 text-sm text-gray-600">{formatCurrency(vendor.annualSpend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Risk Distribution</h2>
          <div className="space-y-3">
            {(["critical", "high", "medium", "low"] as const).map((level) => {
              const count = riskDistribution[level];
              const pct = totalVendors > 0 ? Math.round((count / totalVendors) * 100) : 0;
              return (
                <div key={level}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize font-medium text-gray-700">{formatLabel(level)}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        level === "critical" ? "bg-red-500" : level === "high" ? "bg-orange-400" : level === "medium" ? "bg-yellow-400" : "bg-green-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Link href="/vendors/new" className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors">
              + Register New Vendor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  color: "blue" | "purple" | "orange" | "red";
}

function SummaryCard({ title, value, description, color }: SummaryCardProps) {
  const colorClasses = {
    blue: "bg-blue-600",
    purple: "bg-purple-600",
    orange: "bg-orange-500",
    red: "bg-red-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${colorClasses[color]} mb-4`} />
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
  );
}
