// Brgylist.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowIcon from '../assets/icons/arrow-right.png';
import cameraIcon from '../assets/icons/images.png';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Firestore
import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
} from 'firebase/firestore';

export const allBarangays = [
  { id: 1, name: 'Ajos', population: 0 },
  { id: 2, name: 'Anusan', population: 0 },
  { id: 3, name: 'Barangay 1', population: 0 },
  { id: 4, name: 'Barangay 10', population: 0 },
  { id: 5, name: 'Barangay 2', population: 0 },
  { id: 6, name: 'Barangay 3', population: 0 },
  { id: 7, name: 'Barangay 4', population: 0 },
  { id: 8, name: 'Barangay 5', population: 0 },
  { id: 9, name: 'Barangay 6', population: 0 },
  { id: 10, name: 'Barangay 7', population: 0 },
  { id: 11, name: 'Barangay 8', population: 0 },
  { id: 12, name: 'Barangay 9', population: 0 },
  { id: 13, name: 'Bolo', population: 0 },
  { id: 14, name: 'Bulagsong', population: 0 },
  { id: 15, name: 'Camandilison', population: 0 },
  { id: 16, name: 'Canculajao', population: 0 },
  { id: 17, name: 'Catumbo', population: 0 },
  { id: 18, name: 'Cawayanin Ibaba', population: 0 },
  { id: 19, name: 'Cawayanin Ilaya', population: 0 },
  { id: 20, name: 'Cutcutan', population: 0 },
  { id: 21, name: 'Dahican', population: 0 },
  { id: 22, name: 'Doongan Ibaba', population: 0 },
  { id: 23, name: 'Doongan Ilaya', population: 0 },
  { id: 24, name: 'Gatasan', population: 0 },
  { id: 25, name: 'Macpac', population: 0 },
  { id: 26, name: 'Madulao', population: 0 },
  { id: 27, name: 'Matandang Sabang Kanluran', population: 0 },
  { id: 28, name: 'Matandang Sabang Silangan', population: 0 },
  { id: 29, name: 'Milagrosa', population: 0 },
  { id: 30, name: 'Navitas', population: 0 },
  { id: 31, name: 'Pacabit', population: 0 },
  { id: 32, name: 'San Antonio Magkupa', population: 0 },
  { id: 33, name: 'San Antonio Pala', population: 0 },
  { id: 34, name: 'San Isidro', population: 0 },
  { id: 35, name: 'San Jose Anyao', population: 0 },
  { id: 36, name: 'San Pablo', population: 0 },
  { id: 37, name: 'San Roque', population: 0 },
  { id: 38, name: 'San Vicente Kanluran', population: 0 },
  { id: 39, name: 'San Vicente Silangan', population: 0 },
  { id: 40, name: 'Santa Maria', population: 0 },
  { id: 41, name: 'Tagabas Ibaba', population: 0 },
  { id: 42, name: 'Tagabas Ilaya', population: 0 },
  { id: 43, name: 'Tagbacan Ibaba', population: 0 },
  { id: 44, name: 'Tagbacan Ilaya', population: 0 },
  { id: 45, name: 'Tagbacan Silangan', population: 0 },
  { id: 46, name: 'Tuhian', population: 0 },
];

function Brgylist({ onBarangaySelect = null }) {
  const navigate = useNavigate();
  const [barangays, setBarangays] = useState(allBarangays);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 3;

  useEffect(() => {
    let cancelled = false;

    const countForBarangay = async (name) => {
      const peopleCol = collection(db, 'indigenousPeople');
      const q = query(peopleCol, where('barangay', '==', name));

      // Try aggregate first
      try {
        const snap = await getCountFromServer(q);
        return snap.data().count || 0;
      } catch (e) {
        console.warn(`[count] getCountFromServer failed for ${name}`, e);
      }

      // Fallback: manual getDocs().size
      try {
        const docsSnap = await getDocs(q);
        return docsSnap.size;
      } catch (e2) {
        console.error(`[count] getDocs failed for ${name}`, e2);
        return 0;
      }
    };

    const fetchAll = async () => {
      try {
        setLoading(true);

        const results = await Promise.all(
          allBarangays.map(async (b) => {
            const population = await countForBarangay(b.name);
            return { name: b.name, population };
          })
        );

        if (cancelled) return;

        setBarangays((prev) =>
          prev.map((b) => {
            const found = results.find((r) => r.name === b.name);
            return found ? { ...b, population: found.population } : b;
          })
        );
      } catch (e) {
        console.error('Failed to load populations:', e);
        if (!cancelled) setErr('Failed to load populations.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSeeDetails = (barangay) => {
    if (onBarangaySelect) {
      onBarangaySelect(barangay);
    } else {
      navigate(`/total-population?barangay=${encodeURIComponent(barangay.name)}`);
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) setStartIndex((p) => p - 1);
  };
  const handleNext = () => {
    if (startIndex + visibleCount < barangays.length) setStartIndex((p) => p + 1);
  };

  const visibleBarangays = barangays.slice(startIndex, startIndex + visibleCount);

  return (
    <div className="relative w-full px-4 py-2">
      {/* Arrows */}
      <button
        onClick={handlePrev}
        disabled={startIndex === 0}
        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 text-white p-2 disabled:text-white/30"
      >
        <FaChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        disabled={startIndex + visibleCount >= barangays.length}
        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 text-white p-2 disabled:text-white/30"
      >
        <FaChevronRight className="w-5 h-5" />
      </button>

      {/* Status */}
      {err && <div className="text-center text-sm text-red-600 mb-3">{err}</div>}
      {loading && <div className="text-center text-sm text-gray-600 mb-3">Loading populations…</div>}

      {/* Cards */}
      <div className="flex justify-center gap-6 mx-10 transition-all duration-300">
        {visibleBarangays.map((barangay) => (
          <div
            key={barangay.id}
            className="flex flex-col justify-between min-w-[180px] max-w-[180px] min-h-[290px] max-h-[290px] bg-white rounded-[20px] p-4 shadow-md"
          >
            <div className="w-full h-[180px] bg-[#E3E3E3] rounded-[18px] overflow-hidden mb-3">
              <img src={cameraIcon} alt="camera" className="w-full h-full object-cover" />
            </div>

            <div className="mb-2 min-h-[60px]">
              <h6 className="text-[14px] font-bold text-black mb-1 break-words">
                {barangay.name}
              </h6>
              <p className="text-[13px] text-black leading-tight">
                A total population of {barangay.population}
              </p>
            </div>

            <div
              onClick={() => handleSeeDetails(barangay)}
              className="mt-3 flex justify-between items-center bg-[#2b78c6] hover:bg-[#1a5c9e] cursor-pointer rounded-full px-4 py-2 text-white text-[13px] font-semibold transition"
            >
              <span>See Details</span>
              <img src={arrowIcon} alt="arrow" className="w-[14px] h-[14px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Brgylist;
