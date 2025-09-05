import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaSort, FaSortUp, FaSortDown, FaFilter } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { allBarangays } from '../components/Brgylist';
import ProfileViewModal from '../components/ProfileViewModal';
import {
  collection,
  getDocs,
  doc,
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });


  // Profile modal
  const [showProfileView, setShowProfileView] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

 

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

  

  const handleCloseForm = () => {
    setShowProfileView(false);
    setProfileData(null);
  };



  // 🔴 Open confirmation modal instead of window.confirm
 
 


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
    let filtered = ipList;
    
    // Apply search filter
    if (t) {
      filtered = filtered.filter((ip) => {
        const n = (ip.name || '').toLowerCase();
        const b = (ip.barangay || '').toLowerCase();
        const l = (ip.lineage || '').toLowerCase();
        return n.includes(t) || b.includes(t) || l.includes(t);
      });
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = (a[sortConfig.key] || '').toLowerCase();
        const bValue = (b[sortConfig.key] || '').toLowerCase();
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [ipList, searchTerm, sortConfig]);

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
    
  // Handle column sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      key = null;
      direction = null;
    }
    setSortConfig({ key, direction });
  };
  
  // Get sort icon based on current sort state
  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <FaSort className="inline ml-1 text-gray-400" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <FaSortUp className="inline ml-1 text-blue-600" /> : 
      <FaSortDown className="inline ml-1 text-blue-600" />;
  };

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
                <table className="w-full border-collapse bg-white shadow-sm" style={{ borderSpacing: 0, borderWidth: '1px 0 0 1px', borderStyle: 'solid', borderColor: '#d1d1d1' }}>
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-sm text-[#194d62] border border-[#c0c0c0] cursor-pointer select-none">
                        Suggestions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map((s, i) => (
                      <tr key={`${s.type}-${s.label}-${i}`}>
                        <td className="px-4 py-2 text-center border border-[#d1d1d1]">
                          <span className="truncate">{s.label}</span>
                          <span className="ml-3 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">
                            {s.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl mb-4 overflow-hidden bg-white shadow-md border-2 border-[#c0c0c0]">
          {/* Header */}
          <div className="px-6 py-4 border-b-2 border-[#c0c0c0] bg-[#f0f0f0]">
            <h2 style={{ color: '#194d62' }} className="text-lg font-bold">{headerTitle}</h2>
            {hasSearch && (
              <p className="mt-1 text-sm text-gray-500">
                {filteredList.length} {filteredList.length === 1 ? 'result' : 'results'}
              </p>
            )}
          </div>

          {/* Results */}
          <div className="overflow-x-auto">
            {loading ? (
              <p className="px-6 py-4 text-gray-500">Loading...</p>
            ) : filteredList.length === 0 ? (
              <p className="px-6 py-4 text-gray-400 italic">
                No records found
                {selectedBarangay ? ` in ${selectedBarangay.name}` : ''}.
              </p>
            ) : (
              <table className="w-full border-collapse" style={{ borderSpacing: 0 }}>
                <thead className="bg-[#e9ecef]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-[#194d62] border-2 border-[#c0c0c0] cursor-pointer select-none">
                      <div className="flex items-center">
                        # <FaFilter className="ml-1 text-gray-400" />
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('name')} 
                      className="px-4 py-3 text-left font-semibold text-sm text-[#194d62] border-2 border-[#c0c0c0] cursor-pointer select-none hover:bg-[#d9e1f2]"
                    >
                      <div className="flex items-center">
                        Name {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('barangay')} 
                      className="px-4 py-3 text-left font-semibold text-sm text-[#194d62] border-2 border-[#c0c0c0] cursor-pointer select-none hover:bg-[#d9e1f2]"
                    >
                      <div className="flex items-center">
                        Barangay {getSortIcon('barangay')}
                      </div>
                    </th>
                    <th 
                      onClick={() => requestSort('lineage')} 
                      className="px-4 py-3 text-left font-semibold text-sm text-[#194d62] border-2 border-[#c0c0c0] cursor-pointer select-none hover:bg-[#d9e1f2]"
                    >
                      <div className="flex items-center">
                        Lineage {getSortIcon('lineage')}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-sm text-[#194d62] border-2 border-[#c0c0c0] cursor-pointer select-none">
                      <div className="flex items-center justify-center">
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((ip, index) => (
                    <tr 
                      key={ip.id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'} hover:bg-[#e8f4f9]`}
                      style={{ transition: 'background-color 0.2s' }}
                    >
                      <td className="px-4 py-2 text-center border-2 border-[#c0c0c0]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border-2 border-[#c0c0c0]">
                        <span 
                          onClick={() => handleViewProfile(ip)} 
                          className="text-gray-800 font-medium cursor-pointer hover:underline hover:text-blue-600"
                        >
                          {ip.name}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-2 border-[#c0c0c0]">
                        {ip.barangay || 'N/A'}
                      </td>
                      <td className="px-4 py-2 border-2 border-[#c0c0c0]">
                        {ip.lineage || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-center border-2 border-[#c0c0c0]">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleViewProfile(ip)}
                            className="bg-[#6998ab] text-white text-sm px-3 py-1 rounded border border-[#5a849a] hover:bg-[#194d62] transition-colors"
                          >
                            View
                          </button>
                        
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}

      <ProfileViewModal
        isOpen={showProfileView && !!profileData}
        onClose={handleCloseForm}
        person={profileData}
      />

    
    </div>
  );
}

export default SuperAdminDashboard;
