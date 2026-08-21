import Link from "next/link";
import { vendors } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";

export default function VendorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">{vendors.length} vendors registered</p>
        </div>
        <Link
          href="/vendors/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          + Register Vendor
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Annual Spend</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract Expiry</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/vendors/${vendor.id}`} className="font-medium text-blue-700 hover:underline">
                    {vendor.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{vendor.contactEmail}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{vendor.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{vendor.country}</td>
                <td className="px-6 py-4"><StatusBadge status={vendor.status} /></td>
                <td className="px-6 py-4"><RiskBadge level={vendor.riskLevel} /></td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(vendor.annualSpend)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{vendor.contractExpiry}</td>
                <td className="px-6 py-4">
                  <Link href={`/vendors/${vendor.id}`} className="text-blue-600 hover:underline text-sm">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
