import React, { useEffect, useMemo, useRef, useState } from "react";
import profileImg from "../assets/icons/user.png";
import { db } from "../firebase/config";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import ProfileViewModal from "./ProfileViewModal";

function RecentActivities() {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewOpen, setViewOpen] = useState(false);

  // keep scroll position to restore after closing the modal
  const scrollYRef = useRef(0);

  // 🔒 Lock body scroll when the modal is open
  useEffect(() => {
    if (!viewOpen) return;

    scrollYRef.current = window.scrollY || window.pageYOffset || 0;
    const original = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      overflow: document.body.style.overflow,
      width: document.body.style.width,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    const onEsc = (e) => e.key === "Escape" && setViewOpen(false);
    window.addEventListener("keydown", onEsc);

    return () => {
      document.body.style.position = original.position;
      document.body.style.top = original.top;
      document.body.style.left = original.left;
      document.body.style.right = original.right;
      document.body.style.overflow = original.overflow;
      document.body.style.width = original.width;
      window.scrollTo(0, scrollYRef.current);
      window.removeEventListener("keydown", onEsc);
    };
  }, [viewOpen]);

  // helper: compute age if only dateOfBirth is present
  const computeAge = (dob) => {
    if (!dob) return null;
    const dateVal =
      typeof dob === "string" ? new Date(dob) : dob?.toDate ? dob.toDate() : new Date(dob);
    if (isNaN(dateVal.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dateVal.getFullYear();
    const m = today.getMonth() - dateVal.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateVal.getDate())) age--;
    return age;
  };

  useEffect(() => {
    // Query with orderBy createdAt descending - this will get the most recent document
    const q = query(
      collection(db, "indigenousPeople"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        console.log("RecentActivities: Snapshot received, doc count:", snap.docs.length);

        if (snap.docs.length > 0) {
          const latestDoc = snap.docs[0];
          const data = latestDoc.data();

          // Convert Firestore timestamp to readable date for debugging
          const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : null;

          console.log("Latest document:", {
            id: latestDoc.id,
            createdAt: createdAtDate ? createdAtDate.toISOString() : "null",
            createdAtTimestamp: data.createdAt,
            firstName: data.firstName,
            lastName: data.lastName
          });
          console.log("Full document data:", JSON.stringify(data, null, 2));

          setLatest({ id: latestDoc.id, ...data });
        } else {
          console.log("No documents found");
          setLatest(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("RecentActivities subscribe error:", err);
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);

        // If the error is due to missing index, log a helpful message
        if (err.code === 'failed-precondition' || err.message?.includes('index')) {
          console.error("⚠️ Firestore index required! Please create an index for 'indigenousPeople' collection ordering by 'createdAt' desc");
          console.error("The error message should contain a link to create the index automatically.");
        }

        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const fullName = useMemo(() => {
    if (!latest) return "";
    const ln = latest.lastName || "";
    const fn = latest.firstName || "";
    const mid = latest.middleName ? ` ${latest.middleName}` : "";
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

  // ✅ Prefer uploaded image (photoURL from IPFormModal). Fallback to legacy "image" or default icon.
  const avatarSrc = latest?.photoURL || latest?.image || profileImg;

  return (
    <div className="bg-[#f0eee2] rounded-[30px] p-2 space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-[#062937]">Latest Data Entry</h3>
        <p className="text-sm text-[#062937] -mt-1">recent demographic record</p>
      </div>

      {/* Content Row */}
      <div className="flex items-start gap-4">
        <img
          src={avatarSrc}
          alt="Profile"
          className="w-[60px] h-[60px] object-cover rounded-full ring-1 ring-[#d9d7cb]"
          onError={(e) => {
            // fallback if the stored URL is broken
            e.currentTarget.onerror = null;
            e.currentTarget.src = profileImg;
          }}
        />
        <div className="space-y-1">
          {loading ? (
            <p className="font-semibold text-black">Loading…</p>
          ) : latest ? (
            <>
              <p className="font-semibold text-[#062937]">
                {fullName || "Unknown"} <span className="text-gray-600">added</span>
              </p>
              <p className="text-sm text-[#062937]">
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
              <p className="text-sm text-[#062937]">Add a new Indigenous Person to see it here.</p>
            </>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div>
        <button
          type="button"
          disabled={!latest}
          onClick={() => latest && setViewOpen(true)}
          className={`text-sm font-semibold underline-offset-4 ${
            latest ? "text-[#062937] hover:underline" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          View Entry
        </button>
      </div>

      {/* Profile modal */}
      <ProfileViewModal isOpen={viewOpen} onClose={() => setViewOpen(false)} person={latest} />
    </div>
  );
}

export default RecentActivities;
