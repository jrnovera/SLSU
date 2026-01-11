import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AboutSidePanel from "./AboutSidePanel";
import { useAuth } from "../contexts/AuthContext";
import logoIcon from "../assets/icons/logoIcon.png";
import logoPNG from "../assets/icons/logoPNG.png";

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
      // Clear all localStorage data
      localStorage.clear();
      
      // Clear browser form data
      const forms = document.querySelectorAll('form');
      forms.forEach(form => form.reset());
      
      // Create a hidden form with the same field names as login/signup forms and reset it
      // This tricks the browser into forgetting saved values
      const resetForm = document.createElement('form');
      resetForm.style.display = 'none';
      resetForm.innerHTML = `
        <input type="email" name="email" />
        <input type="password" name="password" />
        <input type="text" name="displayName" />
        <input type="password" name="confirmPassword" />
        <select name="role"></select>
      `;
      document.body.appendChild(resetForm);
      resetForm.reset();
      document.body.removeChild(resetForm);
      
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
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="likha-nav-brand text-[#800000] inline-flex flex-row items-center gap-1 whitespace-nowrap">
            <img src={logoIcon} alt="LIKHA Icon" className="w-12 h-12 inline-block" />
            <img src={logoPNG} alt="LIKHA Logo" className="h-10 inline-block object-contain" />
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="px-4 py-2 font-medium text-black transition-all duration-200 rounded-full hover:bg-[#dc837d] hover:text-white"
            >
              Home
            </Link>

            <a
              href="#"
              onClick={toggleAboutPanel}
              className="px-4 py-2 font-medium text-black transition-all duration-200 no-un rounded-full hover:bg-[#dc837d] hover:text-white"
            >
              About Us
            </a>

            {currentUser ? (
              <a
                href="#"
                onClick={() => setShowLogoutModal(true)}
                className="px-4 py-2 font-medium text-black transition-all duration-200 rounded-full hover:bg-[#dc837d] hover:text-white"
              >
                Log Out
              </a>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 font-medium text-black transition-all duration-200 rounded-full border border-[#1f1f1f]/40 hover:bg-[#dc837d] hover:text-white"
              >
                Login
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-[#f4cfcf] rounded-2xl shadow-lg w-full max-w-sm p-6 sm:p-8 text-center border-4 border-[#9d1d2c]">
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#1f1f1f] pb-6 leading-snug">
              Are you sure you want to Log Out?
            </h3>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-[#c48783] text-[#1f1f1f] font-bold px-6 py-2 rounded-sm transition duration-150 w-24 hover:bg-[#9d1d2c] hover:text-white"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="bg-[#c48783] text-[#1f1f1f] font-bold px-6 py-2 rounded-sm transition duration-150 w-24 hover:bg-[#9d1d2c]/90  hover:text-white"
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
