import { useState, useEffect } from "react";
import { Plus, LogOut, Search, User, Shield, CheckCircle2, XCircle, AlertCircle, Users, Pencil, Trash2, Building2, Lock, Eye, EyeOff, Database, Bell, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import alamtriGeoLogo from "./imports/alamtri.png";
import alamtriGeoLogin from "./imports/alamtri.png";
import { apiUrl } from "./api";

import { Button } from "alamtri-geo-design-system";
import { Field, TextInput } from "alamtri-geo-design-system";
import { Badge } from "alamtri-geo-design-system";
import { Alert, ConfirmDialog } from "alamtri-geo-design-system";
import { Modal } from "alamtri-geo-design-system";
import { COLOR, FONT, RADIUS, SHADOW } from "alamtri-geo-design-system";

import customersRaw from "./data/customers.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Page = "login" | "otp" | "dashboard" | "customers" | "cek" | "hasil" | "change-password" | "activity-log";

interface Account {
  id: number;
  email: string;
  password: string;
  nama: string;
  group: "Administrator" | "Checker";
}

interface UserRecord {
  id: number;
  username: string;
  nama: string;
  email: string;
  perusahaan: string;
  group: "Administrator" | "Checker";
  status: "aktif" | "nonaktif";
}

type UserFormState = Omit<UserRecord, "id">;

interface Customer {
  id?: number;
  code: string;
  nik: string;
  nama: string;
  tglLahir: string;
  jenisKelamin: string;
  alamat: string;
  noHp: string;
  status: string;
}

type AlertType =
  | "match"
  | "not_found"
  | "nama_match_id_mismatch"
  | "nama_only_match"
  | "nama_no_id"
  | "id_match_nama_mismatch"
  | "id_only_match"
  | "hr_needed"
  | "found"
  | null;

interface CekResult {
  nik: string;
  nama: string;
  alertType: AlertType;
  customer: Customer | null;
  customers?: Customer[];
  message?: string;
}

function normalizeGroup(raw?: string): Account["group"] {
  const g = (raw ?? "").trim().toLowerCase();
  if (g === "admin" || g === "administrator" || g === "administrators") {
    return "Administrator";
  }
  return "Checker";
}

// ---------------------------------------------------------------------------
// Shared TopBar
// ---------------------------------------------------------------------------

function TopBar({ onLogout, group, nama }: { onLogout?: () => void; group?: Account["group"]; nama?: string }) {
  const initials = nama
    ? nama.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <div
      style={{
        ...FONT,
        height: 56,
        backgroundColor: "#fff",
        color: COLOR.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: `1px solid ${COLOR.border}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <img src={alamtriGeoLogo} alt="AlamTri geo" style={{ height: 36, width: "auto", objectFit: "contain" }} />

      {/* Right: bell + user */}
      {onLogout && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Bell */}
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: RADIUS.pill,
              border: `1px solid ${COLOR.border}`,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: COLOR.textMuted,
            }}
          >
            <Bell size={16} />
          </button>

          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#E07B39",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ lineHeight: 1.25 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLOR.text }}>{nama || "—"}</div>
              <div style={{ fontSize: 11, color: COLOR.textMuted }}>{group}</div>
            </div>
            {/* Logout chevron */}
            <button
              onClick={onLogout}
              title="Keluar"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: COLOR.textMuted,
                display: "flex",
                alignItems: "center",
                padding: 4,
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar + AppLayout (shared authenticated shell)
// ---------------------------------------------------------------------------

interface NavItem {
  icon: React.ReactNode;
  label: string;
  page: Page | null;
  action: () => void;
  active: boolean;
  adminOnly?: boolean;
}

function Sidebar({
  currentPage,
  onNavigate,
  group,
  collapsed,
  onToggle,
  onAddUser,
}: {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  group: Account["group"];
  collapsed: boolean;
  onToggle: () => void;
  onAddUser: () => void;
}) {
  const isAdmin = normalizeGroup(group) === "Administrator";

  const items: NavItem[] = [
    ...(isAdmin
      ? [{
        icon: <Users size={17} />,
        label: "Manajemen User",
        page: "dashboard" as Page,
        action: () => onNavigate("dashboard"),
        active: currentPage === "dashboard",
        adminOnly: true,
      }]
      : []),
    {
      icon: <Search size={17} />,
      label: "Cek Data",
      page: "cek" as Page,
      action: () => onNavigate("cek"),
      active: currentPage === "cek" || currentPage === "hasil",
    },
    ...(isAdmin
      ? [{
        icon: <Database size={17} />,
        label: "Master Data",
        page: "customers" as Page,
        action: () => onNavigate("customers"),
        active: currentPage === "customers",
        adminOnly: true,
      },
      {
        icon: <Clock size={17} />,
        label: "Activity Log",
        page: "activity-log" as Page,
        action: () => onNavigate("activity-log"),
        active: currentPage === "activity-log",
        adminOnly: true,
      }]
      : []),
    {
      icon: <Lock size={17} />,
      label: "Ubah Password",
      page: "change-password" as Page,
      action: () => onNavigate("change-password"),
      active: currentPage === "change-password",
    },
  ];

  const W = collapsed ? 56 : 228;

  return (
    <div
      style={{
        width: W,
        flexShrink: 0,
        backgroundColor: COLOR.surface,
        borderRight: `1px solid ${COLOR.border}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden",
        position: "sticky",
        top: 56,
        height: "calc(100vh - 56px)",
      }}
    >
      {/* Header row: NAVIGATION label + toggle */}
      <div
        style={{
          height: 48,
          padding: collapsed ? "0 12px" : "0 14px 0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: `1px solid ${COLOR.borderSoft}`,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span style={{ fontSize: 10.5, fontWeight: 700, color: COLOR.textSubtle, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Navigation
          </span>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Perluas menu" : "Kecilkan menu"}
          style={{
            ...FONT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            color: COLOR.textMuted,
            cursor: "pointer",
            padding: 4,
            borderRadius: RADIUS.sm,
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, padding: collapsed ? "0 6px" : "0 8px" }}>
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            title={collapsed ? item.label : undefined}
            style={{
              ...FONT,
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? "center" : "flex-start",
              width: "100%",
              height: 40,
              padding: collapsed ? "0" : "0 10px",
              borderRadius: RADIUS.md,
              border: "none",
              backgroundColor: item.active ? `rgba(1,59,82,0.08)` : "transparent",
              color: item.active ? COLOR.main : COLOR.textMuted,
              fontSize: 13,
              fontWeight: item.active ? 700 : 500,
              cursor: "pointer",
              transition: "background-color 0.15s, color 0.15s",
              boxShadow: item.active ? `inset 3px 0 0 ${COLOR.main}` : "none",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { if (!item.active) e.currentTarget.style.backgroundColor = COLOR.hover; }}
            onMouseLeave={(e) => { if (!item.active) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <span style={{ flexShrink: 0, display: "flex" }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom group badge */}
      {!collapsed && (
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLOR.borderSoft}` }}>
          <div style={{ fontSize: 11, color: COLOR.textSubtle, marginBottom: 4 }}>Login sebagai</div>
          <span
            style={{
              ...FONT,
              fontSize: 11.5,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: RADIUS.pill,
              backgroundColor: isAdmin ? "rgba(1,59,82,0.08)" : COLOR.infoBg,
              color: isAdmin ? COLOR.main : COLOR.blue,
              border: `1px solid ${isAdmin ? COLOR.border : "rgba(0,92,150,0.2)"}`,
            }}
          >
            {group}
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Footer
// ---------------------------------------------------------------------------

function Footer({ variant = "light" }: { variant?: "light" | "dark" }) {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      style={{
        ...FONT,
        textAlign: "center",
        padding: "16px 24px",
        fontSize: 12,
        color: variant === "dark" ? "rgba(255, 255, 255, 0.7)" : COLOR.textMuted,
        backgroundColor: variant === "dark" ? "transparent" : COLOR.surface,
        borderTop: variant === "dark" ? "none" : `1px solid ${COLOR.border}`,
      }}
    >
      &copy; {currentYear} Alamtri Geo - PT Saptaindra Sejati | All Rights Reserved
    </footer>
  );
}



function AppLayout({
  children,
  onLogout,
  group,
  nama,
  currentPage,
  onNavigate,
  sidebarCollapsed,
  onToggleSidebar,
  onAddUser,
}: {
  children: React.ReactNode;
  onLogout: () => void;
  group: Account["group"];
  nama: string;
  currentPage: Page;
  onNavigate: (p: Page) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onAddUser: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: COLOR.bg }}>
      <TopBar onLogout={onLogout} group={group} nama={nama} />
      <div style={{ display: "flex", flex: 1, alignItems: "flex-start" }}>
        <Sidebar
          currentPage={currentPage}
          onNavigate={onNavigate}
          group={group}
          collapsed={sidebarCollapsed}
          onToggle={onToggleSidebar}
          onAddUser={onAddUser}
        />
        <main style={{ flex: 1, minWidth: 0, minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page 1 — Login
// ---------------------------------------------------------------------------

function LoginPage({ onLogin }: { onLogin: (email: string, group: Account["group"], nama: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Email dan password wajib diisi."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login gagal.');
        setLoading(false);
        return;
      }
      setError(null);
      onLogin(data.email, data.group as Account["group"], data.nama);
    } catch (err) {
      setError('Koneksi ke server gagal.');
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(150deg, ${COLOR.main} 0%, #025f7a 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        position: "relative",
      }}
    >
      {/* ── Loading Overlay ── */}
      {loading && (
        <>
          <style>{`
            @keyframes _spin { to { transform: rotate(360deg); } }
            @keyframes _fadein { from { opacity: 0; } to { opacity: 1; } }
            @keyframes _bouncedot {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
              40% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(1, 59, 82, 0.82)",
              backdropFilter: "blur(6px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              animation: "_fadein 0.2s ease",
            }}
          >
            {/* Spinner ring */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "4px solid rgba(255,255,255,0.15)",
                borderTopColor: "#ffffff",
                animation: "_spin 0.8s linear infinite",
              }}
            />
            {/* Text */}
            <div style={{ textAlign: "center" }}>
              <p style={{
                ...FONT,
                color: "#ffffff",
                fontWeight: 700,
                fontSize: 16,
                margin: "0 0 6px",
                letterSpacing: "-0.01em",
              }}>
                Memverifikasi &amp; Mengirim OTP
              </p>
              <p style={{
                ...FONT,
                color: "rgba(255,255,255,0.65)",
                fontSize: 13,
                margin: 0,
              }}>
                Mohon tunggu, kode OTP sedang dikirim ke email Anda…
              </p>
            </div>
            {/* Bouncing dots */}
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.8)",
                    animation: `_bouncedot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        <div
          style={{
            ...FONT,
            backgroundColor: COLOR.surface,
            borderRadius: RADIUS.xl,
            boxShadow: SHADOW.lg,
            width: "100%",
            maxWidth: 420,
            padding: 36,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
            <img src={alamtriGeoLogin} alt="AlamTri geo" style={{ height: 48, width: "auto", objectFit: "contain", marginBottom: 16 }} />
            <h1 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
              Vendor Governance Portal
            </h1>
            <p style={{ fontSize: 13, color: COLOR.textMuted, margin: "4px 0 0", textAlign: "center" }}>
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: 16 }}>
              <Alert tone="error" title={error} onClose={() => setError(null)} />
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Email" required htmlFor="email">
              <TextInput
                id="email"
                type="email"
                placeholder="nama@perusahaan.co.id"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                iconLeft={<User size={15} />}
              />
            </Field>

            <Field label="Password" required htmlFor="password">
              <TextInput
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                iconLeft={<Lock size={15} />}
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "inherit" }}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {/* using <button> instead of <Button variant="link">: need precise right-aligned inline link placement without wrapping in a flex row */}
              <button
                type="button"
                style={{
                  ...FONT,
                  fontSize: 12.5,
                  color: COLOR.ocean,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                {/* Lupa Password? */}
              </button>
            </div>

            <Button variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? "Mengirim OTP..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
      <Footer variant="dark" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page 2 — OTP Verification
// ---------------------------------------------------------------------------

function OtpPage({
  onVerify,
  email,
  group,
}: {
  onVerify: (group: Account["group"], nama: string) => void;
  email: string;
  group: Account["group"];
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDigit(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) {
      (document.getElementById(`otp-${idx + 1}`) as HTMLInputElement)?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      (document.getElementById(`otp-${idx - 1}`) as HTMLInputElement)?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 6) { setError("Lengkapi semua 6 digit kode OTP."); return; }
    try {
      const res = await fetch(apiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: code })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Verifikasi OTP gagal.');
        return;
      }
      setError(null);
      onVerify(data.group as Account["group"], data.nama as string);
    } catch (err) {
      setError('Koneksi ke server gagal.');
    }
  }

  function handleResend() {
    setResent(true);
    setDigits(["", "", "", "", "", ""]);
    setError(null);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(150deg, ${COLOR.main} 0%, #025f7a 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
      }}
    >
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        <div
          style={{
            ...FONT,
            backgroundColor: COLOR.surface,
            borderRadius: RADIUS.xl,
            boxShadow: SHADOW.lg,
            width: "100%",
            maxWidth: 420,
            padding: 36,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: RADIUS.lg,
                backgroundColor: COLOR.infoBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Shield size={26} color={COLOR.blue} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
              Verifikasi OTP
            </h1>
            <p style={{ fontSize: 13, color: COLOR.textMuted, margin: "6px 0 0", textAlign: "center", lineHeight: 1.5 }}>
              Kode verifikasi 6 digit telah dikirim ke{" "}
              <strong style={{ color: COLOR.text }}>{email}</strong>
            </p>
          </div>

          {resent && (
            <div style={{ marginBottom: 16 }}>
              <Alert tone="success" title={`Kode OTP baru telah dikirim ke ${email}.`} />
            </div>
          )}
          {error && (
            <div style={{ marginBottom: 16 }}>
              <Alert tone="error" title={error} onClose={() => setError(null)} />
            </div>
          )}

          <form onSubmit={handleVerify}>
            {/* 6-digit OTP inputs — using raw <input> instead of a kit component: kit has no OTP-specific digit input */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  style={{
                    ...FONT,
                    width: 48,
                    height: 52,
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: COLOR.text,
                    border: `2px solid ${d ? COLOR.ocean : COLOR.border}`,
                    borderRadius: RADIUS.md,
                    outline: "none",
                    backgroundColor: COLOR.surface,
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = COLOR.ocean; e.target.style.boxShadow = "0 0 0 3px rgba(15,130,138,0.18)"; }}
                  onBlur={(e) => { e.target.style.borderColor = d ? COLOR.ocean : COLOR.border; e.target.style.boxShadow = "none"; }}
                />
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Button variant="primary" size="lg" fullWidth>
                Verifikasi
              </Button>
              <Button variant="secondary" size="md" fullWidth onClick={handleResend} type="button">
                Kirim Ulang OTP
              </Button>
            </div>
          </form>
        </div>
      </div>
      <Footer variant="dark" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page 3 — Dashboard / Master User
// ---------------------------------------------------------------------------

const EMPTY_FORM: UserFormState = { username: "", nama: "", email: "", perusahaan: "", group: "Checker", status: "aktif" };

function UserFormFields({
  form,
  onChange,
  error,
  onCloseError,
  idPrefix,
}: {
  form: UserFormState;
  onChange: (f: UserFormState) => void;
  error: boolean;
  onCloseError: () => void;
  idPrefix: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <Alert tone="error" title="Nama Lengkap, Email, dan Perusahaan wajib diisi." onClose={onCloseError} />
      )}
      <Field label="Nama Lengkap" required htmlFor={`${idPrefix}-nama`}>
        <TextInput
          id={`${idPrefix}-nama`}
          placeholder="Nama Lengkap"
          value={form.nama}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, nama: e.target.value })}
        />
      </Field>
      <Field label="Email" required htmlFor={`${idPrefix}-email`}>
        <TextInput
          id={`${idPrefix}-email`}
          type="email"
          placeholder="email@perusahaan.co.id"
          value={form.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, email: e.target.value })}
        />
      </Field>
      <Field label="Nama Perusahaan" required htmlFor={`${idPrefix}-perusahaan`}>
        <TextInput
          id={`${idPrefix}-perusahaan`}
          placeholder="PT Nama Perusahaan"
          value={form.perusahaan}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, perusahaan: e.target.value })}
          iconLeft={<Building2 size={15} />}
        />
      </Field>
      <Field label="Group" htmlFor={`${idPrefix}-group`}>
        {/* using <button> toggles instead of kit Select: need inline 2-option segment for group */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["Administrator", "Checker"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ ...form, group: g })}
              style={{
                ...FONT,
                flex: 1,
                height: 38,
                borderRadius: RADIUS.md,
                border: `1px solid ${form.group === g ? COLOR.main : COLOR.border}`,
                backgroundColor: form.group === g ? COLOR.main : COLOR.surface,
                color: form.group === g ? "#fff" : COLOR.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Status" htmlFor={`${idPrefix}-status`}>
        {/* using <button> toggles instead of kit Select: need inline 2-option segment for status */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["aktif", "nonaktif"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ ...form, status: s })}
              style={{
                ...FONT,
                flex: 1,
                height: 38,
                borderRadius: RADIUS.md,
                border: `1px solid ${form.status === s ? COLOR.main : COLOR.border}`,
                backgroundColor: form.status === s ? COLOR.main : COLOR.surface,
                color: form.status === s ? "#fff" : COLOR.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {s === "aktif" ? "Aktif" : "Non-aktif"}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function DashboardPage({ group, loginEmail, triggerAddUser, onTriggerHandled }: { group: Account["group"]; loginEmail: string; triggerAddUser?: boolean; onTriggerHandled?: () => void }) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userPage, setUserPage] = useState(1);
  const userPageSize = 10;
  const [search, setSearch] = useState("");

  // Fetch users from API
  async function fetchUsers() {
    try {
      const url = search ? `/api/user?search=${encodeURIComponent(search)}` : '/api/user';
      const res = await fetch(apiUrl(url));
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [search]);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);

  // Auto-open add modal when triggered from sidebar
  useEffect(() => {
    if (triggerAddUser) {
      setShowAdd(true);
      onTriggerHandled?.();
    }
  }, [triggerAddUser]);
  const [addForm, setAddForm] = useState<UserFormState>({ ...EMPTY_FORM });
  const [addError, setAddError] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState<UserFormState>({ ...EMPTY_FORM });
  const [editError, setEditError] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);

  // Reset password confirm
  const [resetConfirmTarget, setResetConfirmTarget] = useState<UserRecord | null>(null);

  const [createdUserInfo, setCreatedUserInfo] = useState<{ nama: string; email: string; password: string } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const userTotalPages = Math.ceil(users.length / userPageSize);
  const paginatedUsers = users.slice((userPage - 1) * userPageSize, userPage * userPageSize);

  function openEdit(user: UserRecord) {
    setEditTarget(user);
    setEditForm({ username: user.username, nama: user.nama, email: user.email, perusahaan: user.perusahaan, group: user.group, status: user.status });
    setEditError(false);
  }

  async function handleAdd() {
    if (!addForm.nama || !addForm.email || !addForm.perusahaan) { setAddError(true); return; }
    try {
      const payload = { ...addForm, username: addForm.username || addForm.email, AdminEmail: loginEmail, AdminRole: group };
      const res = await fetch(apiUrl('/api/user'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchUsers();
        setCreatedUserInfo({
          nama: addForm.nama,
          email: addForm.email,
          password: "semangatpagi!!!"
        });
        setAddForm({ ...EMPTY_FORM });
        setAddError(false);
        setShowAdd(false);
      } else {
        const data = await res.json().catch(() => ({ message: 'Gagal menambahkan user' }));
        alert(data.message || 'Gagal menambahkan user');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleEdit() {
    if (!editForm.nama || !editForm.email || !editForm.perusahaan) { setEditError(true); return; }
    try {
      const payload = { ...editForm, username: editForm.username || editForm.email, AdminEmail: loginEmail, AdminRole: group };
      const res = await fetch(apiUrl(`/api/user/${editTarget!.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchUsers();
        setEditTarget(null);
        setEditError(false);
      } else {
        const data = await res.json().catch(() => ({ message: 'Gagal mengubah user' }));
        alert(data.message || 'Gagal mengubah user');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(apiUrl(`/api/user/${deleteTarget!.id}`), {
        method: 'DELETE',
        headers: {
          'X-Admin-Email': loginEmail,
          'X-Admin-Role': group
        }
      });
      if (res.ok) {
        fetchUsers();
        setDeleteTarget(null);
      } else {
        const data = await res.json().catch(() => ({ message: 'Gagal menghapus user' }));
        alert(data.message || 'Gagal menghapus user');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleResetPassword() {
    if (!resetConfirmTarget) return;
    try {
      const res = await fetch(apiUrl(`/api/user/${resetConfirmTarget.id}/reset`), {
        method: 'POST',
        headers: {
          'X-Admin-Email': loginEmail,
          'X-Admin-Role': group
        }
      });
      if (res.ok) {
        alert(`Password untuk user "${resetConfirmTarget.nama}" telah di-reset menjadi "semangatpagi!!!"`);
      } else {
        const data = await res.json().catch(() => ({ message: 'Gagal me-reset password' }));
        alert(data.message || 'Gagal me-reset password');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    } finally {
      setResetConfirmTarget(null);
    }
  }

  // Table columns — action buttons rendered manually outside Table since kit Table doesn't support arbitrary cell renders with closures
  return (
    <>
      <div style={{ ...FONT, maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        {/* Heading */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Users size={18} color={COLOR.main} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
                Manajemen User
              </h2>
            </div>
            <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
              Kelola akun pengguna sistem verifikasi data.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <TextInput
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              iconLeft={<Search size={15} />}
              style={{ width: 240 }}
            />
            <Button variant="primary" size="md" onClick={() => { setAddForm({ ...EMPTY_FORM }); setShowAdd(true); }} iconLeft={<Plus size={14} />}>
              Tambah User
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          {[
            { label: "Total User", value: users.length },
            { label: "User Aktif", value: users.filter((u) => u.status === "aktif").length },
            { label: "User Non-aktif", value: users.filter((u) => u.status === "nonaktif").length },
          ].map((m) => (
            <div key={m.label} style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: RADIUS.lg, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: COLOR.textMuted, fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, marginTop: 4 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Custom table with CRUD action column */}
        <div style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: RADIUS.lg, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, ...FONT }}>
              <thead>
                <tr style={{ backgroundColor: COLOR.bg }}>
                  {["NAMA LENGKAP", "EMAIL", "NAMA PERUSAHAAN", "GROUP", "STATUS", "AKSI"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: COLOR.textMuted,
                        borderBottom: `1px solid ${COLOR.borderSoft}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr
                    key={u.id}
                    style={{ transition: "background-color 0.1s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.hover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >

                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.text }}>{u.nama}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.textMuted }}>{u.email}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.text }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Building2 size={13} color={COLOR.textSubtle} />
                        {u.perusahaan}
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <Badge tone={u.group === "Administrator" ? "brand" : "info"} dot>
                        {u.group}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <Badge tone={u.status === "aktif" ? "success" : "neutral"} dot>
                        {u.status === "aktif" ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          title="Edit user"
                          onClick={() => openEdit(u)}
                          style={{
                            ...FONT,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            height: 30,
                            padding: "0 10px",
                            borderRadius: RADIUS.md,
                            border: `1px solid ${COLOR.border}`,
                            backgroundColor: COLOR.surface,
                            color: COLOR.main,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.hover; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.surface; }}
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                        <button
                          title="Hapus user"
                          onClick={() => setDeleteTarget(u)}
                          style={{
                            ...FONT,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            height: 30,
                            padding: "0 10px",
                            borderRadius: RADIUS.md,
                            border: `1px solid ${COLOR.dangerBg}`,
                            backgroundColor: COLOR.dangerBg,
                            color: COLOR.danger,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(197,52,26,0.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.dangerBg; }}
                        >
                          <Trash2 size={12} />
                          Hapus
                        </button>
                        <button
                          title="Reset password"
                          onClick={() => setResetConfirmTarget(u)}
                          style={{
                            ...FONT,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            height: 30,
                            padding: "0 10px",
                            borderRadius: RADIUS.md,
                            border: `1px solid ${COLOR.warningBg}`,
                            backgroundColor: COLOR.warningBg,
                            color: "#9C6B00",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(156,107,0,0.15)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.warningBg; }}
                        >
                          <Lock size={12} />
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px 24px", textAlign: "center", color: COLOR.textMuted, fontSize: 13 }}>
                      Belum ada data user. Klik "Tambah User" untuk menambahkan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {userTotalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: `1px solid ${COLOR.borderSoft}` }}>
                <span style={{ ...FONT, fontSize: 12, color: COLOR.textMuted }}>
                  Menampilkan {(userPage - 1) * userPageSize + 1}-{Math.min(userPage * userPageSize, users.length)} dari {users.length} user
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    disabled={userPage === 1}
                    style={{
                      ...FONT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: RADIUS.md,
                      border: `1px solid ${COLOR.border}`,
                      backgroundColor: COLOR.surface,
                      color: userPage === 1 ? COLOR.textMuted : COLOR.text,
                      cursor: userPage === 1 ? "not-allowed" : "pointer",
                      opacity: userPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span style={{ ...FONT, fontSize: 12, padding: "0 4px" }}>
                    {userPage}/{userTotalPages}
                  </span>
                  <button
                    onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                    disabled={userPage === userTotalPages}
                    style={{
                      ...FONT,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: RADIUS.md,
                      border: `1px solid ${COLOR.border}`,
                      backgroundColor: COLOR.surface,
                      color: userPage === userTotalPages ? COLOR.textMuted : COLOR.text,
                      cursor: userPage === userTotalPages ? "not-allowed" : "pointer",
                      opacity: userPage === userTotalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setAddError(false); }}
        title="Tambah User Baru"
        description="Isi informasi pengguna baru di bawah ini."
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowAdd(false)}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleAdd}>Simpan User</Button>
          </>
        }
      >
        <UserFormFields form={addForm} onChange={setAddForm} error={addError} onCloseError={() => setAddError(false)} idPrefix="add" />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => { setEditTarget(null); setEditError(false); }}
        title="Edit User"
        description={`Perbarui informasi untuk ${editTarget?.nama ?? ""}`}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setEditTarget(null)}>Batal</Button>
            <Button variant="primary" size="md" onClick={handleEdit}>Simpan Perubahan</Button>
          </>
        }
      >
        <UserFormFields form={editForm} onChange={setEditForm} error={editError} onCloseError={() => setEditError(false)} idPrefix="edit" />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus User"
        description={`Apakah Anda yakin ingin menghapus user "${deleteTarget?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        destructive
      />

      {/* Reset Password Confirm */}
      <ConfirmDialog
        open={!!resetConfirmTarget}
        onClose={() => setResetConfirmTarget(null)}
        onConfirm={handleResetPassword}
        title="Reset Password User"
        description={`Apakah Anda yakin ingin me-reset password untuk user "${resetConfirmTarget?.nama}"? Password akan di-ubah menjadi "semangatpagi!!!"`}
        confirmLabel="Ya, Reset"
      />

      {/* Custom Success Modal for New User */}
      {createdUserInfo && (
        <div
          onClick={() => { setCreatedUserInfo(null); setCopiedPass(false); }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(1, 59, 82, 0.55)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...FONT,
              backgroundColor: COLOR.surface,
              borderRadius: RADIUS.xl,
              boxShadow: SHADOW.lg,
              width: "100%",
              maxWidth: 440,
              padding: 32,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: COLOR.successBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={36} color={COLOR.forest} />
            </div>

            <div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: COLOR.text, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
                User Berhasil Ditambahkan!
              </h3>
              <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0, lineHeight: 1.5 }}>
                Akun untuk <strong style={{ color: COLOR.text }}>{createdUserInfo.nama}</strong> ({createdUserInfo.email}) telah berhasil dibuat dan aktif.
              </p>
            </div>

            <div
              style={{
                width: "100%",
                backgroundColor: COLOR.bg,
                border: `1px solid ${COLOR.border}`,
                borderRadius: RADIUS.lg,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: COLOR.textSubtle, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Password Bawaan (Default Password)
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <code
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: COLOR.main,
                    fontFamily: "monospace",
                    letterSpacing: "0.02em",
                  }}
                >
                  {createdUserInfo.password}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdUserInfo.password);
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 2500);
                  }}
                  style={{
                    ...FONT,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    height: 34,
                    padding: "0 14px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    borderRadius: RADIUS.md,
                    border: `1px solid ${copiedPass ? COLOR.forest : COLOR.border}`,
                    backgroundColor: copiedPass ? COLOR.successBg : COLOR.surface,
                    color: copiedPass ? COLOR.forest : COLOR.text,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {copiedPass ? <CheckCircle2 size={14} color={COLOR.forest} /> : <Lock size={13} />}
                  {copiedPass ? "Tersalin!" : "Salin Password"}
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => { setCreatedUserInfo(null); setCopiedPass(false); }}
            >
              Selesai &amp; Tutup
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
// ---------------------------------------------------------------------------
// Page 4 — Cek Data (NIK & Nama search)
// ---------------------------------------------------------------------------

function CekPage({ onHasil }: { onHasil: (r: CekResult) => void }) {
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [errors, setErrors] = useState<{ nama?: string; nik?: string }>({});
  const [showPopup, setShowPopup] = useState(false);
  const [pendingResult, setPendingResult] = useState<CekResult | null>(null);

  const customers: Customer[] = customersRaw as Customer[];

  const alertConfig: Record<
    NonNullable<AlertType>,
    { tone: "success" | "error" | "warning" | "info"; title: string; description: string; icon: React.ReactNode }
  > = {
    match: {
      tone: "success",
      title: "Full Match",
      description: "Nama dan Nomor Identitas Ada Dalam List.\nTIDAK UNTUK DIDAFTARKAN!!!",
      icon: <CheckCircle2 size={44} color={COLOR.forest} />,
    },
    not_found: {
      tone: "error",
      title: "Not Match",
      description: "Nama dan Nomor Identitas Tidak Ada Dalam List.\nDapat Didaftarkan.",
      icon: <XCircle size={44} color={COLOR.danger} />,
    },
    nama_match_id_mismatch: {
      tone: "warning",
      title: "Partial Match",
      description: "Nama Ada Dalam List.\nPastikan Nomor Identitas Ikut Ditambahkan Dalam Pencarian.",
      icon: <AlertCircle size={44} color="#9C6B00" />,
    },
    nama_only_match: {
      tone: "warning",
      title: "Partial Match",
      description: "Nama Ada Dalam List.\nPastikan Nomor Identitas Ikut Ditambahkan Dalam Pencarian.",
      icon: <AlertCircle size={44} color="#9C6B00" />,
    },
    nama_no_id: {
      tone: "warning",
      title: "Partial Match",
      description: "Nama Ada Dalam List.\nHarap Koordinasikan Lebih Lanjut Dengan Procurement PT ATRI.",
      icon: <AlertCircle size={44} color="#9C6B00" />,
    },
    id_match_nama_mismatch: {
      tone: "warning",
      title: "Partial Match",
      description: "Nomor Identitas Ada Dalam List.\nPastikan Nama Ikut Ditambahkan Dalam Pencarian.",
      icon: <AlertCircle size={44} color="#9C6B00" />,
    },
    id_only_match: {
      tone: "warning",
      title: "Partial Match",
      description: "Nomor Identitas Ada Dalam List.\nPastikan Nama Ikut Ditambahkan Dalam Pencarian.",
      icon: <AlertCircle size={44} color="#9C6B00" />,
    },
    hr_needed: {
      tone: "warning",
      title: "Partial Match",
      description: "Nama Ada Dalam List.\nHarap Koordinasikan Lebih Lanjut Dengan Procurement PT ATRI.",
      icon: <AlertCircle size={44} color="#9C6B00" />,
    },
    found: {
      tone: "warning",
      title: "Partial Match",
      description: "Nama Ada Dalam List.\nPastikan Nomor Identitas Ikut Ditambahkan Dalam Pencarian.",
      icon: <AlertCircle size={44} color="#9C6B00" />,
    },
  };

  function validate(): boolean {
    const e: typeof errors = {};
    const trimmedNama = nama.trim();
    const trimmedNik = nik.trim();

    if (!trimmedNama && !trimmedNik) {
      e.nama = "Nama Lengkap atau NIK wajib diisi";
      e.nik = "Nama Lengkap atau NIK wajib diisi";
    } else if (trimmedNik && trimmedNik.length !== 16) {
      e.nik = "NIK harus 16 digit lengkap";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCek(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      const res = await fetch(apiUrl('/api/customer/check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: "1", nama: nama.trim(), nik: nik.trim() })
      });
      const data: CekResult = await res.json();
      if (res.ok) {
        let evaluatedAlertType: AlertType = data.alertType;
        let matchedCustomer: Customer | null = data.customer;
        const inputNama = nama.trim().toLowerCase();
        const inputNik = nik.trim();

        // If backend returned no customer object (e.g. because original BE code only looked up by NIK when both were provided),
        // query FE search endpoint to find if vendor exists by Name or NIK
        if (!matchedCustomer) {
          if (inputNama) {
            try {
              const searchRes = await fetch(apiUrl(`/api/customer?search=${encodeURIComponent(nama.trim())}`));
              if (searchRes.ok) {
                const searchList: Customer[] = await searchRes.json();
                const foundByName = searchList.find(c => c.nama && c.nama.trim().toLowerCase() === inputNama);
                if (foundByName) {
                  matchedCustomer = foundByName;
                }
              }
            } catch (e) {
              // ignore search error fallback
            }
          }

          if (!matchedCustomer && inputNik && inputNik.length === 16) {
            try {
              const searchRes = await fetch(apiUrl(`/api/customer?search=${encodeURIComponent(nik.trim())}`));
              if (searchRes.ok) {
                const searchList: Customer[] = await searchRes.json();
                const foundByNik = searchList.find(c => c.nik && c.nik.trim() === inputNik);
                if (foundByNik) {
                  matchedCustomer = foundByNik;
                }
              }
            } catch (e) {
              // ignore search error fallback
            }
          }
        }

        if (matchedCustomer) {
          const custNama = (matchedCustomer.nama || "").trim().toLowerCase();
          const custNik = (matchedCustomer.nik || "").trim();

          const namaMatches = Boolean(inputNama && custNama === inputNama);
          const nikMatches = Boolean(inputNik && inputNik.length === 16 && custNik === inputNik);

          if (inputNama && inputNik) {
            if (namaMatches && nikMatches) {
              evaluatedAlertType = "match";
            } else if (namaMatches && !nikMatches) {
              evaluatedAlertType = (!custNik || custNik.startsWith("NONNIK-")) ? "nama_no_id" : "nama_match_id_mismatch";
            } else if (!namaMatches && nikMatches) {
              evaluatedAlertType = "id_match_nama_mismatch";
            }
          } else if (inputNama && !inputNik) {
            evaluatedAlertType = (!custNik || custNik.startsWith("NONNIK-")) ? "nama_no_id" : "nama_only_match";
          } else if (!inputNama && inputNik) {
            evaluatedAlertType = "id_only_match";
          }
        } else {
          evaluatedAlertType = "not_found";
        }

        setPendingResult({ ...data, alertType: evaluatedAlertType, customer: matchedCustomer });
        setShowPopup(true);
      } else {
        alert(data.message || 'Gagal melakukan verifikasi');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  function handleConfirm() {
    if (pendingResult) onHasil(pendingResult);
    setShowPopup(false);
  }

  return (
    <>
      <div style={{ ...FONT, maxWidth: 680, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Search size={18} color={COLOR.main} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
              Pengecekan data
            </h2>
          </div>
          <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
            Masukkan Nama Lengkap dan/atau NIK untuk memvalidasi data.
          </p>
        </div>

        <div
          style={{
            backgroundColor: COLOR.surface,
            border: `1px solid ${COLOR.border}`,
            borderRadius: RADIUS.lg,
            padding: 28,
            boxShadow: SHADOW.sm,
          }}
        >
          <form onSubmit={handleCek} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Field
              label="Nama Lengkap"
              htmlFor="cek-nama"
              status={errors.nama ? "error" : "default"}
              helper={errors.nama}
            >
              <TextInput
                id="cek-nama"
                placeholder="Contoh : Andi Kurniawan"
                value={nama}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNama(e.target.value); setErrors((p) => ({ ...p, nama: undefined })); }}
                status={errors.nama ? "error" : "default"}
                iconLeft={<User size={15} />}
              />
            </Field>

            <Field
              label="NIK (ID Number)"
              htmlFor="cek-nik"
              status={errors.nik ? "error" : "default"}
              helper={errors.nik}
            >
              <TextInput
                id="cek-nik"
                placeholder="16 - Digit NIK"
                maxLength={16}
                value={nik}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setNik(val);
                  setErrors((p) => ({ ...p, nik: undefined }));
                }}
                status={errors.nik ? "error" : "default"}
                iconLeft={<Shield size={15} />}
              />
            </Field>

            <div style={{ paddingTop: 4 }}>
              <Button variant="primary" size="lg" fullWidth iconLeft={<Search size={15} />}>
                Cek Validasi
              </Button>
            </div>
          </form>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: "12px 16px",
            backgroundColor: COLOR.infoBg,
            borderRadius: RADIUS.md,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <AlertCircle size={15} color={COLOR.blue} style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 12.5, color: COLOR.blue, margin: 0, lineHeight: 1.5 }}>
            Harus input Nama Lengkap (Jika singkatan, tambahkan "." contoh: M. Andi Kurniawan) dan/atau NIK.
          </p>
        </div>
      </div>

      {/* Validation result popup */}
      {showPopup && pendingResult?.alertType && (
        <div
          onClick={() => setShowPopup(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(1,59,82,0.45)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...FONT,
              backgroundColor: COLOR.surface,
              borderRadius: RADIUS.lg,
              width: "100%",
              maxWidth: 440,
              padding: 32,
              boxShadow: "0 24px 64px rgba(1,59,82,0.3)",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {alertConfig[pendingResult.alertType].icon}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: COLOR.text, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
              {alertConfig[pendingResult.alertType].title}
            </h3>
            <p style={{ fontSize: 13.5, color: COLOR.textMuted, margin: "0 0 24px", lineHeight: 1.55, whiteSpace: "pre-line" }}>
              {alertConfig[pendingResult.alertType].description}
            </p>
            <div>
              <Button variant="primary" size="md" fullWidth onClick={() => setShowPopup(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page 5 — Hasil Pengecekan
// ---------------------------------------------------------------------------

function HasilPage({ result, onBack }: { result: CekResult; onBack: () => void }) {
  const { alertType, customer, nik, nama } = result;

  const statusConfig: Record<
    NonNullable<AlertType>,
    { tone: "success" | "danger" | "warning" | "info"; label: string }
  > = {
    match: { tone: "success", label: "Full Match" },
    not_found: { tone: "danger", label: "Not Match" },
    nama_match_id_mismatch: { tone: "warning", label: "Partial Match" },
    nama_only_match: { tone: "warning", label: "Partial Match" },
    nama_no_id: { tone: "warning", label: "Partial Match" },
    id_match_nama_mismatch: { tone: "warning", label: "Partial Match" },
    id_only_match: { tone: "warning", label: "Partial Match" },
    hr_needed: { tone: "warning", label: "Partial Match" },
    found: { tone: "warning", label: "Partial Match" },
  };

  const statusDescription: Record<NonNullable<AlertType>, string> = {
    match: "Nama dan Nomor Identitas Ada Dalam List.\nTIDAK UNTUK DIDAFTARKAN!!!",
    not_found: "Nama dan Nomor Identitas Tidak Ada Dalam List.\nDapat Didaftarkan.",
    nama_match_id_mismatch: "Nama Ada Dalam List.\nPastikan Nomor Identitas Ikut Ditambahkan Dalam Pencarian.",
    nama_only_match: "Nama Ada Dalam List.\nPastikan Nomor Identitas Ikut Ditambahkan Dalam Pencarian.",
    nama_no_id: "Nama Ada Dalam List.\nHarap Koordinasikan Lebih Lanjut Dengan Procurement PT ATRI.",
    id_match_nama_mismatch: "Nomor Identitas Ada Dalam List.\nPastikan Nama Ikut Ditambahkan Dalam Pencarian.",
    id_only_match: "Nomor Identitas Ada Dalam List.\nPastikan Nama Ikut Ditambahkan Dalam Pencarian.",
    hr_needed: "Nama Ada Dalam List.\nHarap Koordinasikan Lebih Lanjut Dengan Procurement PT ATRI.",
    found: "Nama Ada Dalam List.\nPastikan Nomor Identitas Ikut Ditambahkan Dalam Pencarian.",
  };

  const cfg = alertType ? statusConfig[alertType] : null;

  return (
    <>
      <div style={{ ...FONT, maxWidth: 720, margin: "0 auto", padding: "36px 24px" }}>
        {/* Back link */}
        {/* using <button> instead of <Button variant="link">: navigational back link needs left-aligned icon+text layout without full-width styling */}
        <button
          onClick={onBack}
          style={{
            ...FONT,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: COLOR.ocean,
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 20,
          }}
        >
          ← Kembali ke Pencarian
        </button>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Hasil Pengecekan Data
          </h2>
          <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
            NIK: <strong>{nik}</strong>
            {nama ? <> · Nama: <strong>{nama.toUpperCase()}</strong></> : null}
          </p>
        </div>

        {/* Status */}
        {cfg && (
          <div
            style={{
              backgroundColor: COLOR.surface,
              border: `1px solid ${COLOR.border}`,
              borderRadius: RADIUS.lg,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
              boxShadow: SHADOW.sm,
              flexWrap: "wrap",
            }}
          >
            <Badge tone={cfg.tone} dot>{cfg.label}</Badge>
            <span style={{ fontSize: 13, color: COLOR.textMuted, whiteSpace: "pre-line" }}>
              {alertType ? statusDescription[alertType] : ""}
            </span>
          </div>
        )}

        {/* Customer detail */}
        {customer ? (
          <div
            style={{
              backgroundColor: COLOR.surface,
              border: `1px solid ${COLOR.border}`,
              borderRadius: RADIUS.lg,
              overflow: "hidden",
              boxShadow: SHADOW.sm,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${COLOR.borderSoft}`,
                backgroundColor: COLOR.bg,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 700, color: COLOR.text }}>Ringkasan data</span>
              <Badge tone="success" dot>Terdaftar</Badge>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <dl style={{ display: "grid", gridTemplateColumns: "180px 1fr", rowGap: 14, columnGap: 16 }}>
                {[
                  { label: "Code", value: customer.code },
                  { label: "Nama Lengkap", value: customer.nama },
                  { label: "NIK (ID Number)", value: customer.nik?.startsWith("NONNIK-") ? "-" : customer.nik },
                ].map((item) => (
                  <div key={item.label} style={{ display: "contents" }}>
                    <dt style={{ fontSize: 13, color: COLOR.textMuted, fontWeight: 500 }}>{item.label}</dt>
                    <dd style={{ fontSize: 13, color: COLOR.text, fontWeight: 600, margin: 0 }}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: COLOR.surface,
              border: `1px dashed ${COLOR.border}`,
              borderRadius: RADIUS.lg,
              padding: "40px 24px",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            <XCircle size={36} color={COLOR.textSubtle} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: COLOR.text }}>Data tidak ditemukan</div>
            <div style={{ fontSize: 13, color: COLOR.textMuted, marginTop: 4 }}>
              Tidak ada data yang cocok dengan NIK dan Nama yang dimasukkan.
            </div>
          </div>
        )}

        {alertType === "hr_needed" && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              tone="info"
              title="Tindakan Diperlukan"
              description="Nama customer ditemukan namun NIK tidak terdaftar. Segera hubungi bagian HR untuk melakukan verifikasi dan pembaruan data."
            />
          </div>
        )}

        <Button variant="secondary" size="md" onClick={onBack} iconLeft={<Search size={14} />}>
          Cek Data Lain
        </Button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page — Data Customer (Admin only CRUD)
// ---------------------------------------------------------------------------

type CustomerFormState = Omit<Customer, "status"> & { status: string };

const EMPTY_CUSTOMER: CustomerFormState = {
  code: "",
  nama: "",
  nik: "",
  tglLahir: "",
  jenisKelamin: "",
  alamat: "",
  noHp: "",
  status: "aktif",
};

function CustomerFormFields({
  form,
  onChange,
  error,
  onCloseError,
  idPrefix,
}: {
  form: CustomerFormState;
  onChange: (f: CustomerFormState) => void;
  error: boolean;
  onCloseError: () => void;
  idPrefix: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && (
        <Alert tone="error" title="Code dan Nama wajib diisi." onClose={onCloseError} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Code" required htmlFor={`${idPrefix}-code`}>
          <TextInput
            id={`${idPrefix}-code`}
            placeholder="Masukkan angka 1 atau 2"
            value={form.code}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, code: e.target.value })}
            iconLeft={<Shield size={15} />}
          />
        </Field>

        <Field label="NIK (ID Number)" htmlFor={`${idPrefix}-nik`}>
          <TextInput
            id={`${idPrefix}-nik`}
            placeholder="16 - Digit NIK (Opsional)"
            maxLength={16}
            value={form.nik}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = e.target.value.replace(/\D/g, "");
              onChange({ ...form, nik: val });
            }}
            iconLeft={<Shield size={15} />}
          />
        </Field>
      </div>

      <Field label="Nama Lengkap" htmlFor={`${idPrefix}-nama`}>
        <TextInput
          id={`${idPrefix}-nama`}
          placeholder="Contoh: TON OMO"
          value={form.nama}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...form, nama: e.target.value })}
          iconLeft={<User size={15} />}
        />
      </Field>

    </div>
  );
}

function CustomerDataPage({ group, loginEmail }: { group: Account["group"]; loginEmail: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const isAdmin = normalizeGroup(group) === "Administrator";

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<CustomerFormState>({ ...EMPTY_CUSTOMER });
  const [addError, setAddError] = useState(false);

  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState<CustomerFormState>({ ...EMPTY_CUSTOMER });
  const [editError, setEditError] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [custPage, setCustPage] = useState(1);
  const custPageSize = 10;

  async function fetchCustomers() {
    try {
      const res = await fetch(apiUrl(`/api/customer?search=${encodeURIComponent(search)}`));
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data)) {
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
      setCustomers([]);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  function openEdit(c: Customer) {
    setEditTarget(c);
    setEditForm({
      code: c.code ?? "",
      nama: c.nama ?? "",
      nik: c.nik ?? "",
      tglLahir: c.tglLahir ?? "",
      jenisKelamin: c.jenisKelamin ?? "",
      alamat: c.alamat ?? "",
      noHp: c.noHp ?? "",
      status: c.status ?? "aktif",
    });
    setEditError(false);
  }

  async function handleAdd() {
    if (!addForm.code || !addForm.nama) { setAddError(true); return; }
    if (addForm.code !== "1" && addForm.code !== "2") {
      alert("Code harus bernilai 1 atau 2.");
      return;
    }
    try {
      const res = await fetch(apiUrl('/api/customer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, AdminEmail: loginEmail, AdminRole: group })
      });
      if (res.ok) {
        fetchCustomers();
        setAddForm({ ...EMPTY_CUSTOMER });
        setAddError(false);
        setShowAdd(false);
      } else {
        const data = await res.json().catch(() => ({ message: 'Gagal menambahkan data' }));
        alert(data.message || 'Gagal menambahkan data');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleEdit() {
    if (!editForm.code || !editForm.nama) { setEditError(true); return; }
    if (editForm.code !== "1" && editForm.code !== "2") {
      alert("Code harus bernilai 1 atau 2.");
      return;
    }
    try {
      const targetId = editTarget!.id ?? editTarget!.nik;
      const res = await fetch(apiUrl(`/api/customer/${targetId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, AdminEmail: loginEmail, AdminRole: group })
      });
      if (res.ok) {
        fetchCustomers();
        setEditTarget(null);
        setEditError(false);
      } else {
        const data = await res.json().catch(() => ({ message: 'Gagal mengubah data' }));
        alert(data.message || 'Gagal mengubah data');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  async function handleDelete() {
    try {
      const targetId = deleteTarget!.id ?? deleteTarget!.nik;
      const res = await fetch(apiUrl(`/api/customer/${targetId}`), {
        method: 'DELETE',
        headers: {
          'X-Admin-Email': loginEmail,
          'X-Admin-Role': group
        }
      });
      if (res.ok) {
        fetchCustomers();
        setDeleteTarget(null);
      } else {
        const data = await res.json().catch(() => ({ message: 'Gagal menghapus data' }));
        alert(data.message || 'Gagal menghapus data');
      }
    } catch (err) {
      alert('Koneksi ke server gagal.');
    }
  }

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const filtered = safeCustomers;
  const custTotalPages = Math.ceil(filtered.length / custPageSize);
  const paginatedFiltered = filtered.slice((custPage - 1) * custPageSize, custPage * custPageSize);

  const cols = ["CODE", "NAMA LENGKAP", "NIK"];
  if (isAdmin) cols.push("AKSI");

  return (
    <>
      <div style={{ ...FONT, maxWidth: 1300, margin: "0 auto", padding: "28px 24px" }}>
        {/* Heading */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Users size={18} color={COLOR.main} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
                Master Data
              </h2>
            </div>
            <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
              {isAdmin
                ? "Kelola master data — tambah, edit, atau hapus entri."
                : "Lihat master data (hanya baca)."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <TextInput
              placeholder="Cari nama, NIK, atau code..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              iconLeft={<Search size={15} />}
              style={{ width: 240 }}
            />
            {isAdmin && (
              <Button
                variant="primary"
                size="md"
                onClick={() => { setAddForm({ ...EMPTY_CUSTOMER }); setShowAdd(true); }}
                iconLeft={<Plus size={14} />}
              >
                Tambah data
              </Button>
            )}
          </div>
        </div>

        {/* Admin-only notice for non-admins */}
        {!isAdmin && (
          <div style={{ marginBottom: 16 }}>
            <Alert
              tone="warning"
              title="Akses Terbatas"
              description="Anda login sebagai Checker. Penambahan, pengeditan, dan penghapusan data hanya dapat dilakukan oleh Administrator."
            />
          </div>
        )}

        {/* Summary metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { label: "Total data", value: safeCustomers.length },
            { label: "Code 1", value: safeCustomers.filter((c) => c && c.code === "1").length },
            { label: "Code 2", value: safeCustomers.filter((c) => c && c.code === "2").length },
          ].map((m) => (
            <div key={m.label} style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: RADIUS.lg, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: COLOR.textMuted, fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: COLOR.text, marginTop: 4 }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: COLOR.surface, border: `1px solid ${COLOR.border}`, borderRadius: RADIUS.lg, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, ...FONT }}>
              <thead>
                <tr style={{ backgroundColor: COLOR.bg }}>
                  {cols.map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: COLOR.textMuted,
                        borderBottom: `1px solid ${COLOR.borderSoft}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedFiltered.map((c, idx) => (
                  <tr
                    key={c?.id ?? c?.nik ?? idx}
                    style={{ transition: "background-color 0.1s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.hover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, fontWeight: 700, color: COLOR.main }}>{c?.code}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, fontWeight: 600, color: COLOR.text }}>{c?.nama}</td>
                    <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}`, color: COLOR.textMuted }}>
                      {c?.nik && !c.nik.startsWith("NONNIK-") ? c.nik : "-"}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: "12px 14px", borderBottom: `1px solid ${COLOR.borderSoft}` }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => openEdit(c)}
                            style={{
                              ...FONT,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              height: 30,
                              padding: "0 10px",
                              borderRadius: RADIUS.md,
                              border: `1px solid ${COLOR.border}`,
                              backgroundColor: COLOR.surface,
                              color: COLOR.main,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLOR.hover; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.surface; }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            style={{
                              ...FONT,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              height: 30,
                              padding: "0 10px",
                              borderRadius: RADIUS.md,
                              border: `1px solid ${COLOR.dangerBg}`,
                              backgroundColor: COLOR.dangerBg,
                              color: COLOR.danger,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(197,52,26,0.15)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = COLOR.dangerBg; }}
                          >
                            <Trash2 size={12} /> Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={cols.length} style={{ padding: "40px 24px", textAlign: "center", color: COLOR.textMuted, fontSize: 13 }}>
                      {search ? "Tidak ada data yang sesuai pencarian." : "Belum ada data."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ ...FONT, fontSize: 12, color: COLOR.textSubtle }}>
            Menampilkan {(custPage - 1) * custPageSize + 1}-{Math.min(custPage * custPageSize, filtered.length)} dari {filtered.length} data
          </span>
          {custTotalPages > 1 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={() => setCustPage(p => Math.max(1, p - 1))}
                disabled={custPage === 1}
                style={{
                  ...FONT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLOR.border}`,
                  backgroundColor: COLOR.surface,
                  color: custPage === 1 ? COLOR.textMuted : COLOR.text,
                  cursor: custPage === 1 ? "not-allowed" : "pointer",
                  opacity: custPage === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ ...FONT, fontSize: 12, padding: "0 4px" }}>
                {custPage}/{custTotalPages}
              </span>
              <button
                onClick={() => setCustPage(p => Math.min(custTotalPages, p + 1))}
                disabled={custPage === custTotalPages}
                style={{
                  ...FONT,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLOR.border}`,
                  backgroundColor: COLOR.surface,
                  color: custPage === custTotalPages ? COLOR.textMuted : COLOR.text,
                  cursor: custPage === custTotalPages ? "not-allowed" : "pointer",
                  opacity: custPage === custTotalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal — Admin only */}
      {isAdmin && (
        <Modal
          open={showAdd}
          onClose={() => { setShowAdd(false); setAddError(false); }}
          title="Tambah Data"
          description="Isi informasi data baru di bawah ini."
          size="md"
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setShowAdd(false)}>Batal</Button>
              <Button variant="primary" size="md" onClick={handleAdd}>Simpan Data</Button>
            </>
          }
        >
          <CustomerFormFields form={addForm} onChange={setAddForm} error={addError} onCloseError={() => setAddError(false)} idPrefix="cadd" />
        </Modal>
      )}

      {/* Edit Modal — Admin only */}
      {isAdmin && (
        <Modal
          open={!!editTarget}
          onClose={() => { setEditTarget(null); setEditError(false); }}
          title="Edit Data"
          description={`Perbarui data untuk ${editTarget?.nama ?? ""}`}
          size="md"
          footer={
            <>
              <Button variant="secondary" size="md" onClick={() => setEditTarget(null)}>Batal</Button>
              <Button variant="primary" size="md" onClick={handleEdit}>Simpan Perubahan</Button>
            </>
          }
        >
          <CustomerFormFields form={editForm} onChange={setEditForm} error={editError} onCloseError={() => setEditError(false)} idPrefix="cedit" />
        </Modal>
      )}

      {/* Delete Confirm — Admin only */}
      {isAdmin && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus data"
          description={`Apakah Anda yakin ingin menghapus data "${deleteTarget?.nama}" (NIK: ${deleteTarget?.nik?.startsWith("NONNIK-") ? "-" : deleteTarget?.nik})? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Ya, Hapus"
          destructive
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page — Change Password (accessible to all authenticated users)
// ---------------------------------------------------------------------------

function ChangePasswordPage({ email, onSuccess }: { email: string; onSuccess?: () => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ old?: string; new?: string; confirm?: string; general?: string }>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!oldPassword) e.old = "Password lama wajib diisi.";
    if (!newPassword) e.new = "Password baru wajib diisi.";
    else if (newPassword.length < 6) e.new = "Password baru minimal 6 karakter.";
    if (!confirmPassword) e.confirm = "Konfirmasi password wajib diisi.";
    else if (newPassword !== confirmPassword) e.confirm = "Password baru dan konfirmasi tidak cocok.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, oldPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.message || 'Gagal mengubah password.' });
        return;
      }
      setSuccess('Password berhasil diubah. Silakan gunakan password baru saat login berikutnya.');
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch (err) {
      setErrors({ general: 'Koneksi ke server gagal.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...FONT, maxWidth: 560, margin: "0 auto", padding: "36px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Lock size={18} color={COLOR.main} />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: COLOR.text, margin: 0, letterSpacing: "-0.02em" }}>
            Ubah Password
          </h2>
        </div>
        <p style={{ fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
          Perbarui password akun Anda untuk keamanan yang lebih baik.
        </p>
      </div>

      <div
        style={{
          backgroundColor: COLOR.surface,
          border: `1px solid ${COLOR.border}`,
          borderRadius: RADIUS.lg,
          padding: 28,
          boxShadow: SHADOW.sm,
        }}
      >
        {success && (
          <div style={{ marginBottom: 16 }}>
            <Alert tone="success" title={success} onClose={() => setSuccess(null)} />
          </div>
        )}
        {errors.general && (
          <div style={{ marginBottom: 16 }}>
            <Alert tone="error" title={errors.general} onClose={() => setErrors((p) => ({ ...p, general: undefined }))} />
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Field
            label="Password Lama"
            required
            htmlFor="old-password"
            status={errors.old ? "error" : "default"}
            helper={errors.old}
          >
            <TextInput
              id="old-password"
              type={showOld ? "text" : "password"}
              placeholder="Masukkan password lama"
              value={oldPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setOldPassword(e.target.value); setErrors((p) => ({ ...p, old: undefined })); }}
              status={errors.old ? "error" : "default"}
              iconLeft={<Lock size={15} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowOld((v) => !v)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "inherit" }}
                  aria-label={showOld ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </Field>

          <Field
            label="Password Baru"
            required
            htmlFor="new-password"
            status={errors.new ? "error" : "default"}
            helper={errors.new}
          >
            <TextInput
              id="new-password"
              type={showNew ? "text" : "password"}
              placeholder="Masukkan password baru"
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, new: undefined })); }}
              status={errors.new ? "error" : "default"}
              iconLeft={<Lock size={15} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "inherit" }}
                  aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </Field>

          <Field
            label="Konfirmasi Password Baru"
            required
            htmlFor="confirm-password"
            status={errors.confirm ? "error" : "default"}
            helper={errors.confirm}
          >
            <TextInput
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="Ulangi password baru"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
              status={errors.confirm ? "error" : "default"}
              iconLeft={<Lock size={15} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, color: "inherit" }}
                  aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </Field>

          <div style={{ paddingTop: 4 }}>
            <Button variant="primary" size="lg" fullWidth disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Log Page
// ---------------------------------------------------------------------------

interface ActivityLog {
  id: number;
  email: string;
  role: string;
  activity: string;
  details: string | null;
  eventDate: string;
}

function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  });
  const [filterRole, setFilterRole] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  async function fetchLogs() {
    setLoading(true);
    setCurrentPage(1);
    try {
      const params = new URLSearchParams();
      params.append("date", filterDate);
      if (filterRole) params.append("role", filterRole);

      const res = await fetch(apiUrl(`/api/activity-logs?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDetails(activity: string, details: string | null): React.ReactNode {
    if (!details) return <span style={{ ...FONT, color: COLOR.textMuted }}>-</span>;
    try {
      const d = JSON.parse(details);
      switch (activity) {
        case "Tambah User":
          return (
            <span style={{ ...FONT, fontSize: 13 }}>
              <b>{d.nama}</b> ({d.email}) - {d.perusahaan} [{d.group}]
            </span>
          );
        case "Edit User":
          const userChanges = [];
          if (d.before) {
            userChanges.push(<div key="target" style={{ ...FONT, fontSize: 13, marginBottom: 2 }}><b>{d.before.targetEmail || d.before.email}</b> ({d.before.targetNama || d.before.nama})</div>);
          }
          if (d.before && d.after) {
            if (d.before.nama !== d.after.nama) userChanges.push(<div key="nama" style={{ ...FONT, fontSize: 13 }}>Nama: "{d.before.nama}" → "{d.after.nama}"</div>);
            if (d.before.email !== d.after.email) userChanges.push(<div key="email" style={{ ...FONT, fontSize: 13 }}>Email: "{d.before.email}" → "{d.after.email}"</div>);
            if (d.before.perusahaan !== d.after.perusahaan) userChanges.push(<div key="perusahaan" style={{ ...FONT, fontSize: 13 }}>Perusahaan: "{d.before.perusahaan}" → "{d.after.perusahaan}"</div>);
            if (d.before.group !== d.after.group) userChanges.push(<div key="group" style={{ ...FONT, fontSize: 13 }}>Group: "{d.before.group}" → "{d.after.group}"</div>);
            if (d.before.status !== d.after.status) userChanges.push(<div key="status" style={{ ...FONT, fontSize: 13 }}>Status: "{d.before.status}" → "{d.after.status}"</div>);
          }
          return userChanges.length > 0
            ? userChanges
            : <span style={{ ...FONT, color: COLOR.textMuted }}>-</span>;
        case "Hapus User":
          return (
            <span style={{ ...FONT, fontSize: 13 }}>
              <b>{d.nama}</b> ({d.email})
            </span>
          );
        case "Reset Password":
          return (
            <span style={{ ...FONT, fontSize: 13 }}>
              <b>{d.targetNama}</b> ({d.targetEmail})
            </span>
          );
        case "Tambah Data":
          return (
            <span style={{ ...FONT, fontSize: 13 }}>
              <b>{d.nama}</b> - NIK: {d.nik || "-"}
            </span>
          );
        case "Edit Data":
          const dataChanges = [];
          if (d.before) {
            dataChanges.push(<div key="target" style={{ ...FONT, fontSize: 13, marginBottom: 2 }}><b>{d.before.targetNama || d.before.nama}</b> (NIK: {d.before.targetNik || d.before.nik || "-"})</div>);
          }
          if (d.before && d.after) {
            if (d.before.nama !== d.after.nama) dataChanges.push(<div key="nama" style={{ ...FONT, fontSize: 13 }}>Nama: "{d.before.nama}" → "{d.after.nama}"</div>);
            if (d.before.nik !== d.after.nik) dataChanges.push(<div key="nik" style={{ ...FONT, fontSize: 13 }}>NIK: "{d.before.nik}" → "{d.after.nik}"</div>);
            if (d.before.code !== d.after.code) dataChanges.push(<div key="code" style={{ ...FONT, fontSize: 13 }}>Code: "{d.before.code}" → "{d.after.code}"</div>);
            if (d.before.status !== d.after.status) dataChanges.push(<div key="status" style={{ ...FONT, fontSize: 13 }}>Status: "{d.before.status}" → "{d.after.status}"</div>);
          }
          return dataChanges.length > 0
            ? dataChanges
            : <span style={{ ...FONT, color: COLOR.textMuted }}>-</span>;
        case "Hapus Data":
          return (
            <span style={{ ...FONT, fontSize: 13 }}>
              <b>{d.nama}</b> - NIK: {d.nik || "-"}
            </span>
          );
        case "Login":
        case "Logout":
          return (
            <span style={{ ...FONT, fontSize: 13 }}>{d.email}</span>
          );
        default:
          return <span style={{ ...FONT, color: COLOR.textMuted }}>-</span>;
      }
    } catch {
      return <span style={{ ...FONT, color: COLOR.textMuted }}>-</span>;
    }
  }

  const totalPages = Math.ceil(logs.length / pageSize);
  const paginatedLogs = logs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ ...FONT, fontSize: 20, fontWeight: 700, color: COLOR.text, margin: "0 0 4px" }}>
          Activity Log
        </h1>
        <p style={{ ...FONT, fontSize: 13, color: COLOR.textMuted, margin: 0 }}>
          Catatan aktivitas pengguna sistem
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "flex-end" }}>
        <div>
          <label style={{ ...FONT, fontSize: 12, fontWeight: 600, color: COLOR.textMuted, display: "block", marginBottom: 4 }}>
            Tanggal
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              ...FONT,
              height: 38,
              padding: "0 12px",
              borderRadius: 8,
              border: `1px solid ${COLOR.border}`,
              backgroundColor: COLOR.surface,
              color: COLOR.text,
              fontSize: 13.5,
              outline: "none",
            }}
          />
        </div>
        <div>
          <label style={{ ...FONT, fontSize: 12, fontWeight: 600, color: COLOR.textMuted, display: "block", marginBottom: 4 }}>
            Role
          </label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              ...FONT,
              height: 38,
              padding: "0 12px",
              borderRadius: 8,
              border: `1px solid ${COLOR.border}`,
              backgroundColor: COLOR.surface,
              color: COLOR.text,
              fontSize: 13.5,
              outline: "none",
              minWidth: 140,
            }}
          >
            <option value="">Semua Role</option>
            <option value="Administrator">Administrator</option>
            <option value="Checker">Checker</option>
          </select>
        </div>
        <Button variant="primary" size="md" onClick={fetchLogs} disabled={loading}>
          {loading ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      <div style={{ borderRadius: RADIUS.lg, border: `1px solid ${COLOR.border}`, overflow: "hidden", backgroundColor: COLOR.surface }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: COLOR.bg }}>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: COLOR.textMuted, borderBottom: `1px solid ${COLOR.border}` }}>Email</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: COLOR.textMuted, borderBottom: `1px solid ${COLOR.border}` }}>Role</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: COLOR.textMuted, borderBottom: `1px solid ${COLOR.border}` }}>Aktivitas</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: COLOR.textMuted, borderBottom: `1px solid ${COLOR.border}` }}>Detail</th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: COLOR.textMuted, borderBottom: `1px solid ${COLOR.border}` }}>Tanggal & Waktu</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "40px 16px", textAlign: "center", color: COLOR.textMuted, fontSize: 13 }}>
                  Tidak ada data aktivitas untuk tanggal ini.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: `1px solid ${COLOR.border}` }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: COLOR.text }}>{log.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      ...FONT,
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 20,
                      backgroundColor: log.role === "Administrator" ? "rgba(1,59,82,0.08)" : "rgba(0,92,150,0.08)",
                      color: log.role === "Administrator" ? COLOR.main : "#005c96",
                    }}>
                      {log.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: COLOR.text }}>{log.activity}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>{formatDetails(log.activity, log.details)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: COLOR.textMuted }}>{formatDate(log.eventDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "0 4px" }}>
          <span style={{ ...FONT, fontSize: 13, color: COLOR.textMuted }}>
            Menampilkan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, logs.length)} dari {logs.length} data
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                ...FONT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: RADIUS.md,
                border: `1px solid ${COLOR.border}`,
                backgroundColor: COLOR.surface,
                color: currentPage === 1 ? COLOR.textMuted : COLOR.text,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ ...FONT, fontSize: 13, padding: "0 8px" }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                ...FONT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: RADIUS.md,
                border: `1px solid ${COLOR.border}`,
                backgroundColor: COLOR.surface,
                color: currentPage === totalPages ? COLOR.textMuted : COLOR.text,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root App — Page Router
// ---------------------------------------------------------------------------

export default function App() {
  {/* MARKER-MAKE-KIT-INVOKED */ }
  {/* MARKER-MAKE-KIT-DISCOVERY-READ */ }
  const [page, setPage] = useState<Page>("login");
  const [hasilData, setHasilData] = useState<CekResult | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginGroup, setLoginGroup] = useState<Account["group"]>("Administrator");
  const [loginNama, setLoginNama] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [addUserTrigger, setAddUserTrigger] = useState(false);

  const isAuthenticated = page !== "login" && page !== "otp";

  function handleLogout() {
    const emailToLog = loginEmail;
    const roleToLog = loginGroup;

    fetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailToLog, role: roleToLog })
    }).catch(() => { });

    setPage("login");
    setHasilData(null);
    setLoginEmail("");
    setLoginGroup("Administrator");
    setLoginNama("");
  }

  function handleNavigate(p: Page) {
    setPage(p);
  }

  return (
    <div>
      {page === "login" && (
        <LoginPage
          onLogin={(email, group, nama) => {
            setLoginEmail(email);
            setLoginGroup(normalizeGroup(group));
            setLoginNama(nama);
            setPage("otp");
          }}
        />
      )}
      {page === "otp" && (
        <OtpPage
          email={loginEmail}
          group={loginGroup}
          onVerify={(group, nama) => {
            const normalizedGroup = normalizeGroup(group);
            setLoginGroup(normalizedGroup);
            if (nama) setLoginNama(nama);
            setPage(normalizedGroup === "Checker" ? "cek" : "dashboard");
          }}
        />
      )}
      {isAuthenticated && (
        <AppLayout
          onLogout={handleLogout}
          group={loginGroup}
          nama={loginNama}
          currentPage={page}
          onNavigate={handleNavigate}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          onAddUser={() => {
            setAddUserTrigger(true);
            setPage("dashboard");
          }}
        >
          {page === "dashboard" && (
            <DashboardPage
              group={loginGroup}
              loginEmail={loginEmail}
              triggerAddUser={addUserTrigger}
              onTriggerHandled={() => setAddUserTrigger(false)}
            />
          )}
          {page === "customers" && normalizeGroup(loginGroup) === "Administrator" && <CustomerDataPage group={loginGroup} loginEmail={loginEmail} />}
          {page === "activity-log" && normalizeGroup(loginGroup) === "Administrator" && <ActivityLogPage />}
          {page === "cek" && (
            <CekPage
              onHasil={(r) => {
                setHasilData(r);
                setPage("hasil");
              }}
            />
          )}
          {page === "hasil" && hasilData && (
            <HasilPage result={hasilData} onBack={() => setPage("cek")} />
          )}
          {page === "change-password" && (
            <ChangePasswordPage email={loginEmail} />
          )}
        </AppLayout>
      )}
    </div>
  );
}
