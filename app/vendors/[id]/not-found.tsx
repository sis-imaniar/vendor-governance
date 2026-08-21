import Link from "next/link";

export default function VendorNotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-4xl mb-4">🔍</p>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Not Found</h2>
      <p className="text-gray-500 mb-6">The vendor you are looking for does not exist.</p>
      <Link href="/vendors" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-6 rounded-lg transition-colors">
        Back to Vendors
      </Link>
    </div>
  );
}
