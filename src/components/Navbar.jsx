import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AboutSidePanel from "./AboutSidePanel";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const [showAboutPanel, setShowAboutPanel] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // new
  const [error, setError] = useState("");
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleAboutPanel = (e) => {
    e.preventDefault();
    setShowAboutPanel(!showAboutPanel);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await logout();
      setShowLogoutModal(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to log out");
    }
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && showAboutPanel) {
        setShowAboutPanel(false);
      }
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [showAboutPanel]);

  useEffect(() => {
    document.body.style.overflow = showAboutPanel ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showAboutPanel]);

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="text-2xl font-bold text-black">Katutubo IS</div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="relative px-3 py-1.5 font-medium text-black transition-all duration-200 hover:bg-[#6998ab] hover:text-white rounded-full group"
            >
              Home
              <span className="absolute left-1/2 -bottom-1.5 w-3/5 h-0.5 bg-[#6998ab] rounded-full transform -translate-x-1/2 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center"></span>
            </Link>

            <a
              href="#"
              onClick={toggleAboutPanel}
              className="relative px-3 py-1.5 font-medium text-black transition-all duration-200 no-un hover:bg-[#6998ab] hover:text-white rounded-full group"
            >
              About Us
              <span className="absolute left-1/2 -bottom-1.5 w-3/5 h-0.5 bg-[#6998ab] rounded-full transform -translate-x-1/2 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center"></span>
            </a>

            {currentUser ? (
              <a
                href="#"
                onClick={() => setShowLogoutModal(true)}
                className="relative px-3 py-1.5 font-medium text-black transition-all duration-200 hover:bg-[#6998ab] hover:text-white rounded-full group"
              >
                Log Out
                <span className="absolute left-1/2 -bottom-1.5 w-3/5 h-0.5 bg-[#6998ab] rounded-full transform -translate-x-1/2 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center"></span>
              </a>
            ) : (
              <Link
                to="/login"
                className="relative px-5 py-1.5 font-medium text-black transition-all duration-200 hover:bg-[#6998ab] hover:text-white rounded-full group"
              >
                Login
                <span className="absolute left-1/2 -bottom-1.5 w-3/5 h-0.5 bg-[#6998ab] rounded-full transform -translate-x-1/2 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center"></span>
              </Link>
            )}
          </nav>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center mt-1">{error}</div>
        )}
      </header>

      {/* About Side Panel */}
      <AboutSidePanel
        isOpen={showAboutPanel}
        onClose={() => setShowAboutPanel(false)}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[#123645] pb-4 leading-snug">
              Are you sure you want to Log Out?
            </h3>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-300 text-[#123645] font-semibold px-6 py-2.5 rounded-full hover:bg-gray-400 transition duration-200 w-24"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#2c526b] text-white font-semibold px-6 py-2.5 rounded-full hover:bg-[#1e3b50] transition duration-200 w-24"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
