import React, { useEffect, useRef, useState } from "react";
import healthIcon from "../assets/icons/healthcondition.png";
import noHealthIcon from "../assets/icons/nohealthcondition.png";
import returnIcon from "../assets/icons/return.png"; // back icon

/** Theme tokens (maroon) */
const PRIMARY = "#b6222e";
const TILE_GRAY = "#f1e4e4";
const TEXT_PRIMARY = "#1a0e0e";

export default function HealthCategoryModal({
  open,
  onClose,
  counts = { pwd: 0, notPwd: 0 },
  onSelect,
}) {
  const [selected, setSelected] = useState(null);
  const scrollYRef = useRef(0);

  // ESC to close + scroll lock
  useEffect(() => {
    if (!open) return;

    // lock scroll (robust: preserves position)
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
      // restore scroll + styles
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
      {/* Overlay (click to close) */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-category-title"
        className="relative w-[600px] rounded-[32px] bg-white shadow-[0_24px_60px_rgba(0,0,0,.18)] border border-[#b16a6a]"
      >
        {/* Header */}
        <div className="flex items-center px-6 pt-6">
          <button onClick={onClose} aria-label="Back" className="p-1">
            <img src={returnIcon} alt="Back" className="h-6 w-6 object-contain" />
          </button>

          <h3
            id="health-category-title"
            className="mx-auto text-lg font-bold"
            style={{ color: TEXT_PRIMARY }}
          >
            Select Health Status
          </h3>

          <span className="w-6" /> {/* spacer */}
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-6">
          <div className="space-y-3">
            <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#b6222e] bg-white shadow-sm cursor-pointer hover:bg-[#f9e6e5]">
              <input
                type="checkbox"
                checked={selected === "pwd"}
                onChange={() => setSelected((prev) => (prev === "pwd" ? null : "pwd"))}
                className="h-5 w-5 accent-[#b6222e] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-[#1a0e0e]">PWD</span>
                <span className="text-sm text-[#5a2b2b]">Total: {counts.pwd}</span>
              </div>
            </label>

            <label className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#b6222e] bg-white shadow-sm cursor-pointer hover:bg-[#f9e6e5]">
              <input
                type="checkbox"
                checked={selected === "not_pwd"}
                onChange={() => setSelected((prev) => (prev === "not_pwd" ? null : "not_pwd"))}
                className="h-5 w-5 accent-[#b6222e] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-[#1a0e0e]">Not PWD</span>
                <span className="text-sm text-[#5a2b2b]">Total: {counts.notPwd}</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
