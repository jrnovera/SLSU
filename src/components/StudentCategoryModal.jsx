import React, { useEffect, useRef } from "react";
import studentIcon from "../assets/icons/student.png";
import notAttendingIcon from "../assets/icons/not-attending.png";
import returnIcon from "../assets/icons/return.png";

/** Figma tokens */
const BLUE = "#7cafca";
const TILE_GRAY = "#c6c6c6";
const TEXT_BLUE = "#194d62";

export default function StudentCategoryModal({
  open,
  onClose,
  counts = { students: 0, notAttending25Below: 0 },
  onSelect,
}) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    // scroll lock
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

    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.position = original.position;
      document.body.style.top = original.top;
      document.body.style.left = original.left;
      document.body.style.right = original.right;
      document.body.style.overflow = original.overflow;
      document.body.style.width = original.width;
      window.scrollTo(0, scrollYRef.current);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-category-title"
        className="relative w-[600px] rounded-[32px] bg-white shadow-[0_24px_60px_rgba(0,0,0,.18)]"
      >
        {/* Header */}
        <div className="flex items-center px-6 pt-6">
          <button onClick={onClose} aria-label="Back" className="p-1">
            <img src={returnIcon} alt="Back" className="h-6 w-6 object-contain" />
          </button>

          <h3
            id="student-category-title"
            className="mx-auto text-lg font-bold"
            style={{ color: TEXT_BLUE }}
          >
            Select Category
          </h3>

          <span className="w-6" />
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* STUDENTS */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.("students")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.("students")}
              className="flex flex-col items-center justify-center rounded-[24px] px-6 py-8 cursor-pointer transition-transform hover:-translate-y-[2px]"
              style={{ backgroundColor: BLUE, boxShadow: "0 8px 20px rgba(43,120,198,.25)" }}
            >
              <img src={studentIcon} alt="" className="h-12 w-12 object-contain" />
              <div className="mt-3 text-sm font-semibold text-black">STUDENTS</div>
              <div className="mt-2 text-2xl font-bold text-black">{counts.students}</div>
            </div>

            {/* NOT ATTENDING SCHOOL (≤25) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.("not_attending_25_below")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.("not_attending_25_below")}
              className="flex flex-col items-center justify-center rounded-[24px] px-6 py-8 cursor-pointer transition-transform hover:-translate-y-[2px]"
              style={{ backgroundColor: TILE_GRAY, boxShadow: "0 8px 20px rgba(16,24,40,.08)" }}
            >
              <img
                src={notAttendingIcon}
                alt=""
                className="h-12 w-12 object-contain opacity-80"
                style={{ filter: "grayscale(1)" }}
              />
              <div className="mt-3 text-[12px] font-semibold text-center text-black" style={{ lineHeight: 1.1 }}>
                NOT ATTENDING SCHOOL
                <br />
                (25 years old below)
              </div>
              <div className="mt-2 text-2xl font-bold text-black">
                {counts.notAttending25Below}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
