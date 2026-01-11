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
    <div className="fixed inset-0 z-40 pt-20 flex bg-black/20">
      {/* Side Panel */}
      <div className="w-[300px] h-full flex flex-col shadow-lg relative bg-[#dc837d] text-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-[#9d1d2c]">
          <FaUserCircle className="text-3xl text-white" />
          <h2 className="text-lg font-black tracking-wide uppercase">About Us</h2>
          <button
            onClick={onClose}
            className="ml-auto text-2xl hover:text-white/80"
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* Menu List */}
        <nav className="flex flex-col p-4 space-y-3">
          {menuItems.map((item) => (
            <div key={item.key} className="relative">
              <button
                onClick={() => handleMenuClick(item.key)}
                className={`w-full text-left px-4 py-3 rounded-full font-black text-base uppercase tracking-tight transition ${
                  activePage === item.key
                    ? "bg-[#9d1d2c] text-white"
                    : "bg-transparent text-[#2b0c0c] hover:bg-[#c44a4a] hover:text-white"
                }`}
              >
                {item.label}
              </button>
              {activePage === item.key && (
                <div className="absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[10px] border-l-[#9d1d2c]"></div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right Content Area */}
      <div
        className="flex-1 h-full bg-[#f2eeee]/90 p-6 overflow-y-auto rounded-tl-[40px] rounded-bl-[40px] shadow-xl border border-[#e2d9d5]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-5xl mx-auto">
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
