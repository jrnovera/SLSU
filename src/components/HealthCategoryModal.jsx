import React, { useEffect, useRef } from "react";
import healthIcon from "../assets/icons/healthcondition.png";
import noHealthIcon from "../assets/icons/nohealthcondition.png";
import returnIcon from "../assets/icons/return.png"; // back icon

/** Figma tokens */
const BLUE = "#7cafca";      // primary blue
const TILE_GRAY = "#c6c6c6"; // muted right tile bg
const TEXT_BLUE = "#194d62";

export default function HealthCategoryModal({
  open,
  onClose,
  counts = { withHealth: 0, noHealth: 0 },
  onSelect,
}) {
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
        className="relative w-[600px] rounded-[32px] bg-white shadow-[0_24px_60px_rgba(0,0,0,.18)]"
      >
        {/* Header */}
        <div className="flex items-center px-6 pt-6">
          <button onClick={onClose} aria-label="Back" className="p-1">
            <img src={returnIcon} alt="Back" className="h-6 w-6 object-contain" />
          </button>

        <h3
            id="health-category-title"
            className="mx-auto text-lg font-bold"
            style={{ color: TEXT_BLUE }}
          >
            Select Category
          </h3>

          <span className="w-6" /> {/* spacer */}
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* WITH HEALTH CONDITION */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.("with_health")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.("with_health")}
              className="flex flex-col items-center justify-center rounded-[24px] px-6 py-8 cursor-pointer transition-transform hover:-translate-y-[2px]"
              style={{
                backgroundColor: BLUE,
                boxShadow: "0 8px 20px rgba(43,120,198,.25)",
              }}
            >
              <img src={healthIcon} alt="" className="h-12 w-12 object-contain" />
              <div className="mt-3 text-sm font-semibold text-black">
                With Health Condition
              </div>
              <div className="mt-2 text-2xl font-bold text-black">
                {counts.withHealth}
              </div>
            </div>

            {/* NO HEALTH CONDITION */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.("no_health")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect?.("no_health")}
              className="flex flex-col items-center justify-center rounded-[24px] px-6 py-8 cursor-pointer transition-transform hover:-translate-y-[2px]"
              style={{
                backgroundColor: TILE_GRAY,
                boxShadow: "0 8px 20px rgba(16,24,40,.08)",
              }}
            >
              <img src={noHealthIcon} alt="" className="h-12 w-12 object-contain opacity-80" />
              <div className="mt-3 text-sm font-semibold text-black">
                No Health Condition
              </div>
              <div className="mt-2 text-2xl font-bold text-black">
                {counts.noHealth}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
