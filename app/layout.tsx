import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Vendor Governance Portal",
  description: "Manage vendor relationships, compliance, and risk assessments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-blue-900 text-blue-300 text-xs text-center py-3 mt-auto">
          © {new Date().getFullYear()} Vendor Governance Portal
        </footer>
      </body>
    </html>
  );
}
