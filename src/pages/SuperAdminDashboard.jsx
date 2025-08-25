import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { allBarangays } from '../components/Brgylist';
import IPFormModal from '../components/IPFormModal';
import ProfileViewModal from '../components/ProfileViewModal';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import searchIcon from '../assets/icons/search.png';

/* simple debounce */
function useDebouncedValue(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function SuperAdminDashboard() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebouncedValue(searchTerm, 200);

  const [ipList, setIpList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedIp, setSelectedIp] = useState(null);

  // Profile modal
  const [showProfileView, setShowProfileView] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // 🔴 Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ipToDelete, setIpToDelete] = useState(null);

  /* suggestions */
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const sugRef = useRef(null);

  const fetchIPs = async (barangayFilter = null) => {
    try {
      setLoading(true);
      let ipsQuery = barangayFilter
        ? query(collection(db, 'indigenousPeople'), where('barangay', '==', barangayFilter))
        : collection(db, 'indigenousPeople');

      const ipsSnapshot = await getDocs(ipsQuery);
      const ipsList = ipsSnapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ...d,
          name: `${d.lastName || ''}, ${d.firstName || ''} ${d.middleName || ''}`
            .replace(/\s+/g, ' ')
            .trim(),
        };
      });

      setIpList(ipsList);
    } catch (error) {
      console.error('Error fetching IPs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPs(selectedBarangay?.name || null);
  }, [selectedBarangay?.name]);

  const handleBarangayChange = (e) => {
    const barangayName = e.target.value;
    const selectedBrgy = allBarangays.find((brgy) => brgy.name === barangayName) || null;
    setSelectedBarangay(barangayName === '' ? null : selectedBrgy);
    fetchIPs(barangayName === '' ? null : barangayName);
  };

  const handleAdd = () => {
  if (!currentUser) {
    console.warn('Auth not ready yet; please wait a second.');
    return;
  }
  setShowAddForm(true);
};

  const handleAddSubmit = async (formData) => {
    try {
      await addDoc(collection(db, 'indigenousPeople'), formData);
      fetchIPs(selectedBarangay?.name || null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding IP:', error);
    }
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setShowUpdateForm(false);
    setShowProfileView(false);
    setProfileData(null);
  };

  const handleUpdate = (ip) => {
    setSelectedIp(ip);
    setShowUpdateForm(true);
  };

  const handleUpdateSubmit = async (formData) => {
    if (!selectedIp) return;
    try {
      const ipRef = doc(db, 'indigenousPeople', selectedIp.id);
      await updateDoc(ipRef, formData);
      fetchIPs(selectedBarangay?.name || null);
      setShowUpdateForm(false);
      setSelectedIp(null);
    } catch (error) {
      console.error('Error updating IP:', error);
    }
  };

  // 🔴 Open confirmation modal instead of window.confirm
  const requestDelete = (ip) => {
    setIpToDelete(ip);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!ipToDelete) return;
    try {
      await deleteDoc(doc(db, 'indigenousPeople', ipToDelete.id));
      setIpList((prev) => prev.filter((item) => item.id !== ipToDelete.id));
      if (showProfileView && profileData?.id === ipToDelete.id) {
        setShowProfileView(false);
        setProfileData(null);
      }
    } catch (error) {
      console.error('Error deleting IP:', error);
    } finally {
      setShowDeleteModal(false);
      setIpToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setIpToDelete(null);
  };

  // View profile
  const handleViewProfile = async (ip) => {
    try {
      setLoadingProfile(true);
      const ipRef = doc(db, 'indigenousPeople', ip.id);
      const ipSnap = await getDoc(ipRef);

      if (ipSnap.exists()) {
        const data = ipSnap.data();
        setProfileData({ id: ip.id, ...data });
        setShowProfileView(true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  /* filtering (case-insensitive, name or barangay) */
  const filteredList = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return ipList;
    return ipList.filter((ip) => {
      const n = (ip.name || '').toLowerCase();
      const b = (ip.barangay || '').toLowerCase();
      return n.includes(t) || b.includes(t);
    });
  }, [ipList, searchTerm]);

  /* suggestions (names + barangays) */
  useEffect(() => {
    const t = debouncedTerm.trim().toLowerCase();
    if (!t) {
      setSuggestions([]);
      setShowSug(false);
      setActiveIndex(-1);
      return;
    }

    const nameSugs = Array.from(
      new Set(
        ipList
          .map((ip) => ip.name || '')
          .filter((n) => n && n.toLowerCase().includes(t))
      )
    ).slice(0, 6);

    const brgySugs = allBarangays
      .map((b) => b.name)
      .filter((b) => b.toLowerCase().includes(t))
      .slice(0, 4);

    const sug = [
      ...nameSugs.map((label) => ({ type: 'name', label })),
      ...brgySugs.map((label) => ({ type: 'barangay', label })),
    ];

    setSuggestions(sug);
    setShowSug(sug.length > 0);
    setActiveIndex(sug.length ? 0 : -1);
  }, [debouncedTerm, ipList]);

  const selectSuggestion = (item) => {
    if (!item) return;
    if (item.type === 'barangay') {
      const selectedBrgy = allBarangays.find((b) => b.name === item.label) || null;
      setSelectedBarangay(selectedBrgy);
      setSearchTerm('');
    } else {
      setSearchTerm(item.label);
    }
    setShowSug(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e) => {
    if (!showSug || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) selectSuggestion(suggestions[activeIndex]);
      setShowSug(false);
    } else if (e.key === 'Escape') {
      setShowSug(false);
    }
  };

  // close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (!sugRef.current) return;
      if (!sugRef.current.contains(e.target) && e.target !== inputRef.current) {
        setShowSug(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ---------- dynamic header ---------- */
  const hasSearch = searchTerm.trim().length > 0;
  const headerTitle = hasSearch
    ? `Results for "${searchTerm.trim()}"`
    : selectedBarangay
    ? `Barangay ${selectedBarangay.name} - List of IPs`
    : 'All Indigenous People in Catanauan, Quezon';

  return (
    <div className="min-h-screen bg-[#dcdcdc] mt-20 ">
      <Navbar />
      <div className="w-full px-6 py-8">
        {/* Top Controls */}
        <div className="bg-white px-6 py-4 rounded-md shadow mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Title + Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 style={{ color: '#194d62' }} className="text-xl font-extrabold">
                {selectedBarangay ? `Barangay ${selectedBarangay.name}` : 'All Barangays'}
              </h2>

              <select
                value={selectedBarangay ? selectedBarangay.name : ''}
                onChange={handleBarangayChange}
                className="px-4 py-2 border border-black text-sm rounded-sm focus:outline-none w-[220px]"
              >
                <option value="">All Barangays</option>
                {allBarangays.map((brgy) => (
                  <option key={brgy.id} value={brgy.name}>
                    {brgy.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleAdd}
                className="bg-[#194d62] text-white font-bold text-sm px-6 py-2 rounded-sm hover:bg-[#3497da] transition"
              >
                Add IP
              </button>
            </div>

            {/* Right: Search with suggestions */}
            <div className="relative w-full lg:w-[320px]" ref={sugRef}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search name or barangay…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSug(true);
                }}
                onFocus={() => suggestions.length && setShowSug(true)}
                onKeyDown={onKeyDown}
                className="w-full pl-4 pr-10 py-2 rounded-full bg-[#F9F9F9] text-sm focus:outline-none border border-gray-200"
              />
              <img
                src={searchIcon}
                alt="Search"
                className="w-4 h-4 absolute top-2.5 right-4 opacity-60"
              />

              {/* Suggestion list */}
              {showSug && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md max-h-72 overflow-auto">
                  {suggestions.map((s, i) => (
                    <li
                      key={`${s.type}-${s.label}-${i}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectSuggestion(s);
                      }}
                      className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${
                        i === activeIndex ? 'bg-gray-100' : 'bg-white'
                      }`}
                    >
                      <span className="truncate">{s.label}</span>
                      <span className="ml-3 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                        {s.type}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl mb-4 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4">
            <h2 style={{ color: '#194d62' }} className="text-lg font-bold">{headerTitle}</h2>
            {hasSearch && (
              <p className="mt-1 text-sm text-gray-500">
                {filteredList.length} {filteredList.length === 1 ? 'result' : 'results'}
              </p>
            )}
          </div>

          {/* Results */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <p className="px-6 py-4 text-gray-500">Loading...</p>
            ) : filteredList.length === 0 ? (
              <p className="px-6 py-4 text-gray-400 italic">
                No records found
                {selectedBarangay ? ` in ${selectedBarangay.name}` : ''}.
              </p>
            ) : (
              <ol>
                {filteredList.map((ip, index) => (
                  <li
                    key={ip.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <span
                      onClick={() => handleViewProfile(ip)}
                      className="text-gray-800 font-medium cursor-pointer hover:underline"
                    >
                      {index + 1}. {ip.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewProfile(ip)}
                        className="bg-[#6998ab] text-white text-sm px-3 py-1 rounded hover:bg-[#194d62]"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleUpdate(ip)}
                        className="bg-[#6998ab] text-sm px-3 py-1 text-white rounded hover:bg-[#194d62]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => requestDelete(ip)} // 🔴 open modal
                        className="bg-[#6998ab] text-white text-sm px-3 py-1 rounded hover:bg-[#194d62]"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <IPFormModal
        isOpen={showAddForm}
        onClose={handleCloseForm}
        onSubmit={handleAddSubmit}
        selectedBarangay={selectedBarangay}
      />
      <IPFormModal
        isOpen={showUpdateForm}
        onClose={handleCloseForm}
        onSubmit={handleUpdateSubmit}
        initialData={selectedIp}
        isEditing={true}
      />

      <ProfileViewModal
        isOpen={showProfileView && !!profileData}
        onClose={handleCloseForm}
        person={profileData}
      />

      {/* 🔴 Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[#123645] pb-4 leading-snug">
              Are you sure you want to delete{' '}
              <span className="whitespace-nowrap">
                {ipToDelete?.name ||
                  `${ipToDelete?.lastName || ''}, ${ipToDelete?.firstName || ''} ${ipToDelete?.middleName || ''}`}
              </span>
              ?
            </h3>

            <div className="flex justify-center gap-4">
              <button
                onClick={cancelDelete}
                className="bg-gray-300 text-[#123645] font-semibold px-6 py-2.5 rounded-full hover:bg-gray-400 transition duration-200 w-24"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="bg-[#2c526b] text-white font-semibold px-6 py-2.5 rounded-full hover:bg-[#1e3b50] transition duration-200 w-24"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;
