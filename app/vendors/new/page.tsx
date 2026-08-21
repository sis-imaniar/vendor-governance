"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = [
  "Technology",
  "Financial Services",
  "Cybersecurity",
  "Office Supplies",
  "Data & Analytics",
  "Facilities",
  "Marketing",
  "HR & Recruitment",
  "Legal",
  "Other",
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "India",
  "Japan",
  "Singapore",
  "Other",
];

export default function RegisterVendorPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    address: "",
    country: "",
    description: "",
    annualSpend: "",
    contractExpiry: "",
    riskLevel: "low",
  });

  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function validate() {
    const newErrors: Partial<typeof form> = {};
    if (!form.name.trim()) newErrors.name = "Vendor name is required.";
    if (!form.category) newErrors.category = "Category is required.";
    if (!form.contactName.trim()) newErrors.contactName = "Contact name is required.";
    if (!form.contactEmail.trim()) newErrors.contactEmail = "Contact email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      newErrors.contactEmail = "Enter a valid email address.";
    if (!form.country) newErrors.country = "Country is required.";
    if (!form.contractExpiry) newErrors.contractExpiry = "Contract expiry date is required.";
    return newErrors;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Registered</h2>
        <p className="text-gray-500 mb-6">
          <strong>{form.name}</strong> has been successfully registered for governance review.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/vendors"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            View All Vendors
          </Link>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({
                name: "", category: "", contactName: "", contactEmail: "", contactPhone: "",
                website: "", address: "", country: "", description: "", annualSpend: "",
                contractExpiry: "", riskLevel: "low",
              });
            }}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/vendors" className="hover:underline text-blue-600">Vendors</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Register New Vendor</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Register New Vendor</h1>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <Section title="Vendor Information">
          <Field label="Vendor Name" required error={errors.name}>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              className={inputCls(!!errors.name)}
            />
          </Field>
          <Field label="Category" required error={errors.category}>
            <select name="category" value={form.category} onChange={handleChange} className={inputCls(!!errors.category)}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of the vendor and services provided"
              className={inputCls(false) + " resize-none"}
            />
          </Field>
        </Section>

        <Section title="Contact Details">
          <Field label="Contact Name" required error={errors.contactName}>
            <input type="text" name="contactName" value={form.contactName} onChange={handleChange} placeholder="Full name" className={inputCls(!!errors.contactName)} />
          </Field>
          <Field label="Contact Email" required error={errors.contactEmail}>
            <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} placeholder="email@example.com" className={inputCls(!!errors.contactEmail)} />
          </Field>
          <Field label="Contact Phone">
            <input type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="+1 (555) 000-0000" className={inputCls(false)} />
          </Field>
          <Field label="Website">
            <input type="url" name="website" value={form.website} onChange={handleChange} placeholder="https://example.com" className={inputCls(false)} />
          </Field>
        </Section>

        <Section title="Location">
          <Field label="Address">
            <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Street address" className={inputCls(false)} />
          </Field>
          <Field label="Country" required error={errors.country}>
            <select name="country" value={form.country} onChange={handleChange} className={inputCls(!!errors.country)}>
              <option value="">Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Contract & Risk">
          <Field label="Contract Expiry Date" required error={errors.contractExpiry}>
            <input type="date" name="contractExpiry" value={form.contractExpiry} onChange={handleChange} className={inputCls(!!errors.contractExpiry)} />
          </Field>
          <Field label="Estimated Annual Spend (USD)">
            <input type="number" name="annualSpend" value={form.annualSpend} onChange={handleChange} placeholder="e.g. 50000" min="0" className={inputCls(false)} />
          </Field>
          <Field label="Initial Risk Level">
            <select name="riskLevel" value={form.riskLevel} onChange={handleChange} className={inputCls(false)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </Field>
        </Section>

        <div className="flex items-center justify-end gap-4 pt-2">
          <Link href="/vendors" className="text-sm text-gray-600 hover:text-gray-800">Cancel</Link>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Register Vendor
          </button>
        </div>
      </form>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
    hasError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
  }`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={error ? "col-span-1" : ""}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
