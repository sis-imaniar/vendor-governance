import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-lg font-bold tracking-tight">
              VendorGov
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-blue-200 transition-colors">
                Dashboard
              </Link>
              <Link href="/vendors" className="hover:text-blue-200 transition-colors">
                Vendors
              </Link>
              <Link href="/vendors/new" className="hover:text-blue-200 transition-colors">
                Register Vendor
              </Link>
            </div>
          </div>
          <div className="text-xs text-blue-300">Vendor Governance Portal</div>
        </div>
      </div>
    </nav>
  );
}
