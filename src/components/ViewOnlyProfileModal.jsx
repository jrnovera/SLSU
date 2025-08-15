import React, { useEffect } from "react";
import user from "../assets/icons/user.png";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <dt className="shrink-0 text-xs text-slate-500">{label}</dt>
      <dd className="grow text-right text-sm font-medium text-slate-800 break-words">
        {value || "N/A"}
      </dd>
    </div>
  );
}

/** Convert various date shapes (string, Date, Firestore Timestamp) to a Date */
function toDateAny(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  // Firestore Timestamp
  if (typeof v === "object") {
    if (typeof v.toDate === "function") {
      const d = v.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if ("seconds" in v) {
      const d = new Date(v.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // String/number
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/** Format as "Month Day, Year" (e.g., January 5, 1998) */
function formatDOB(profile) {
  const raw =
    profile?.dateOfBirth ?? profile?.birthdate ?? profile?.dob ?? null;
  if (!raw) return "N/A";
  const d = toDateAny(raw);
  if (!d) return "N/A";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ViewOnlyProfileModal({
  open,
  onClose,
  profile,
  loading = false,
  title = "Indigenous Person Profile",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel (non-scrollable content) */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        {/* Subtle accent bar */}
        <div className="h-1 w-full rounded-t-2xl bg-slate-900/5" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h3 id="profile-modal-title" className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="px-6 pb-6">
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-100" />
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-28 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-24 rounded-lg bg-slate-100" />
            </div>
          </div>
        ) : profile ? (
          <div className="px-6 pb-6">
            {/* Identity */}
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 overflow-hidden">
                <img
                  src={profile.image || user}
                  alt={profile.name || "Profile"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="break-words text-lg font-semibold text-slate-900">
                  {profile.name || "N/A"}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {profile.barangay || "—"}
                  {profile.occupation ? ` · ${profile.occupation}` : ""}
                </p>
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <section className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4">
                <h4 className="mb-2 text-xs font-semibold text-slate-600">Personal</h4>
                <dl>
                  <Row label="Gender" value={profile.gender} />
                  <Row label="Age" value={profile.age} />
                  {/* ✅ Date of Birth formatted as Month Day, Year */}
                  <Row label="Date of Birth" value={formatDOB(profile)} />
                  <Row label="Civil Status" value={profile.civilStatus} />
                  <Row label="Education Level" value={profile.educationLevel} />
                </dl>
              </section>

              <section className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4">
                <h4 className="mb-2 text-xs font-semibold text-slate-600">Other Details</h4>
                <dl>
                  <Row label="Health Condition" value={profile.healthCondition} />
                  <Row label="Barangay" value={profile.barangay} />
                  <Row label="Address" value={profile.address || "—"} />
                  <Row label="Contact Number" value={profile.contactNumber} />
                  <Row label="Tribe" value={profile.tribe} />
                </dl>
              </section>
            </div>
          </div>
        ) : (
          <div className="px-6 pb-8 text-center text-sm text-slate-500">No data.</div>
        )}
      </div>
    </div>
  );
}
