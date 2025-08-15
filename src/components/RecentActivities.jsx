import React, { useEffect, useMemo, useState } from "react";
import profileImg from "../assets/icons/user.png";
import { db } from "../firebase/config";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

function RecentActivities() {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  // helper: compute age if only dateOfBirth is present (YYYY-MM-DD or Timestamp-compatible)
  const computeAge = (dob) => {
    if (!dob) return null;
    const dateVal =
      typeof dob === "string" ? new Date(dob) : dob.toDate ? dob.toDate() : new Date(dob);
    if (isNaN(dateVal.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dateVal.getFullYear();
    const m = today.getMonth() - dateVal.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateVal.getDate())) age--;
    return age;
  };

  useEffect(() => {
    // Listen to the most recently created document
    const q = query(
      collection(db, "indigenousPeople"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setLatest(docs[0] || null);
        setLoading(false);
      },
      (err) => {
        console.error("RecentActivities subscribe error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const viewHref = useMemo(() => {
    // adjust to your routing if needed
    return latest?.id ? `/indigenous/${latest.id}` : "#";
  }, [latest]);

  const fullName = useMemo(() => {
    if (!latest) return "";
    const ln = latest.lastName || "";
    const fn = latest.firstName || "";
    const mid = latest.middleName ? ` ${latest.middleName}` : "";
    // Match your original display: "Dela Cruz, Juan"
    return `${ln}${ln ? "," : ""} ${fn}${mid}`;
  }, [latest]);

  const displayAge = useMemo(() => {
    if (!latest) return "";
    if (typeof latest.age === "number") return latest.age;
    return computeAge(latest.dateOfBirth) ?? "";
  }, [latest]);

  const gender = latest?.gender || "";
  const barangay = latest?.barangay || "";
  const level = latest?.educationLevel || "";

  return (
    <div className="bg-white rounded-[30px] p-2 space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-black">Latest Data Entry</h3>
        <p className="text-sm text-gray-500 -mt-1">recent demographic record</p>
      </div>

      {/* Content Row */}
      <div className="flex items-start gap-4">
        {/* Profile Image */}
        <img
          src={profileImg}
          alt="Profile"
          className="w-[60px] h-[60px] object-cover rounded-full"
        />

        {/* Text Info */}
        <div className="space-y-1">
          {loading ? (
            <p className="font-semibold text-black">Loading…</p>
          ) : latest ? (
            <>
              <p className="font-semibold text-black">
                {fullName || "Unknown"} <span className="text-gray-600">added</span>
              </p>
              <p className="text-sm text-gray-600">
                {displayAge ? `Age ${displayAge}, ` : ""}
                {gender ? `${gender}, ` : ""}
                {barangay ? `Brgy. ${barangay}, ` : ""}
                {level ? `Level: ${level}` : ""}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-black">
                No recent entries <span className="text-gray-600">yet</span>
              </p>
              <p className="text-sm text-gray-600">
                Add a new Indigenous Person to see it here.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <div>
        <a
          href={viewHref}
          className="text-sm font-semibold text-black hover:underline underline-offset-4"
        >
          View Entry
        </a>
      </div>
    </div>
  );
}

export default RecentActivities;
