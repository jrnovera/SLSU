import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import AboutContent from "./about/AboutContent";
import { FaUserCircle } from "react-icons/fa";

const menuItems = [
  { key: "who-we-are", label: "Who We Are" },
  { key: "mission", label: "Our Mission" },
  { key: "what-we-do", label: "What We Do" },
  { key: "why-it-matters", label: "Why It Matters" },
  { key: "values", label: "Our Values" },
  { key: "team", label: "Our Team" },
  { key: "join-us", label: "Join Us" },
];

function AboutSidePanel({ isOpen, onClose }) {
  const [activePage, setActivePage] = useState("who-we-are");
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isOpen) setShowContent(false);
  }, [isOpen]);

  const handleMenuClick = (page) => {
    setActivePage(page);
    setShowContent(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 pt-20 flex bg-black/30">
      {/* Side Panel */}
      <div className="w-[320px] bg-gradient-to-br from-[#dce1e6] to-[#f5f5f5] h-full flex flex-col shadow-lg relative">
        {/* Header */}
        <div className="flex items-center justify-start gap-3 bg-[#6e91b9] text-white px-4 py-3 shadow-md relative">
          <FaUserCircle className="text-3xl" />
          <h2 className="text-lg font-bold tracking-wide uppercase">About Us</h2>
          <button
            onClick={onClose}
            className="ml-auto text-2xl hover:text-gray-200"
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* Menu List */}
        <nav className="flex flex-col p-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.key} className="relative">
              <button
                onClick={() => handleMenuClick(item.key)}
                className={`w-full text-left px-4 py-2 rounded-full font-semibold text-sm transition ${
                  activePage === item.key
                    ? "bg-[#6e91b9] text-white"
                    : "text-[#123645] hover:bg-gray-300"
                }`}
              >
                {item.label}
              </button>
              {activePage === item.key && (
                <div className="absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[10px] border-l-[#6e91b9]"></div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right Content Area */}
      <div
        className="w-[85%] h-[100%] bg-white/90 p-4 overflow-y-auto rounded-tl-[50px] rounder- rounded-tr-[50px] rounded-bl-[50px] rounded-br-[50px] shadow-xl border border-gray-200 "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-4xl mx-auto">
          <AboutContent activePage={activePage} />
        </div>
      </div>
    </div>
  );
}

AboutSidePanel.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};

AboutSidePanel.defaultProps = {
  isOpen: false,
  onClose: () => {},
};

export default AboutSidePanel;
