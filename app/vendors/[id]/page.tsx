import { notFound } from "next/navigation";
import Link from "next/link";
import { getVendorById, getRiskAssessmentByVendorId } from "@/lib/data";
import { formatCurrency, formatLabel, complianceStatusColor } from "@/lib/utils";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";

interface VendorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { id } = await params;
  const vendor = getVendorById(id);
  if (!vendor) notFound();
  const assessment = getRiskAssessmentByVendorId(id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/vendors" className="hover:underline text-blue-600">Vendors</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{vendor.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
            <p className="text-gray-500 mt-1">{vendor.category} · {vendor.country}</p>
            <p className="text-gray-600 mt-2 max-w-xl">{vendor.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {vendor.tags.map((tag) => (
                <span key={tag} className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
            <StatusBadge status={vendor.status} />
            <RiskBadge level={vendor.riskLevel} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Contact & Contract</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <DetailItem label="Contact Name" value={vendor.contactName} />
              <DetailItem label="Email" value={vendor.contactEmail} />
              <DetailItem label="Phone" value={vendor.contactPhone} />
              <DetailItem label="Website" value={vendor.website} />
              <DetailItem label="Address" value={vendor.address} />
              <DetailItem label="Country" value={vendor.country} />
              <DetailItem label="Onboarded" value={vendor.onboardedAt} />
              <DetailItem label="Contract Expiry" value={vendor.contractExpiry} />
              <DetailItem label="Annual Spend" value={formatCurrency(vendor.annualSpend)} />
            </dl>
          </div>

          {/* Compliance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Compliance Checklist</h2>
            {vendor.compliance.length === 0 ? (
              <p className="text-gray-400 text-sm">No compliance items.</p>
            ) : (
              <div className="space-y-3">
                {vendor.compliance.map((item) => (
                  <div key={item.id} className="flex items-start justify-between border border-gray-100 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Due: {item.dueDate}</p>
                      {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${complianceStatusColor(item.status)}`}>
                      {formatLabel(item.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Risk Assessment</h2>
            {assessment ? (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  Assessed by {assessment.assessedBy} on {assessment.assessedAt}
                </p>
                <div className="space-y-2">
                  {([
                    ["Overall", assessment.overallRisk],
                    ["Financial", assessment.financialRisk],
                    ["Operational", assessment.operationalRisk],
                    ["Reputational", assessment.reputationalRisk],
                    ["Cyber Security", assessment.cyberSecurityRisk],
                  ] as const).map(([label, level]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{label}</span>
                      <RiskBadge level={level} />
                    </div>
                  ))}
                </div>
                {assessment.notes && (
                  <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">{assessment.notes}</p>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-sm">No risk assessment on record.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-700">{value}</dd>
    </div>
  );
}
