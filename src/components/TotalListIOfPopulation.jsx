import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProfileViewModal from './ProfileViewModal';
import { allBarangays } from './Brgylist';

/* small debounce hook */
function useDebouncedValue(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function TotalListIOfPopulation({ populationData = [], category = null }) {
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebouncedValue(searchTerm, 220);

  const [selectedBarangay, setSelectedBarangay] = useState('All Barangay');
  const [filteredData, setFilteredData] = useState([]);
  const [pageTitle, setPageTitle] = useState('Total Population');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  // suggestions state (like SuperAdminDashboard)
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const sugRef = useRef(null);
  const inputRef = useRef(null);

  const allBarangayOptions = useMemo(
    () => ['All Barangay', ...allBarangays.map((b) => b.name)],
    []
  );

  useEffect(() => {
    setLoading(false);
  }, [populationData]);

  useEffect(() => {
    if (!category) return;
    let title = 'Total Population';
    if (category === 'male') title = 'Total Male Population';
    else if (category === 'female') title = 'Total Female Population';
    else if (category === 'student') title = 'Total Students';
    else if (category === 'unemployed') title = 'Total Unemployed';
    else if (category === 'health_condition') title = 'With Health Condition';
    setPageTitle(title);
  }, [category]);

  // Preselect barangay from URL (?barangay=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brgyFromUrl = params.get('barangay');
    if (brgyFromUrl && allBarangayOptions.includes(brgyFromUrl)) {
      setSelectedBarangay(brgyFromUrl);
    }
  }, [location.search, allBarangayOptions]);

  // ---------- FILTERING (name + barangay + age if numeric) ----------
  useEffect(() => {
    let filtered = [...populationData];

    if (category) {
      if (category === 'male') filtered = filtered.filter((p) => p.gender === 'Male');
      else if (category === 'female') filtered = filtered.filter((p) => p.gender === 'Female');
      else if (category === 'student') filtered = filtered.filter((p) => p.occupation === 'Student');
      else if (category === 'unemployed') filtered = filtered.filter((p) => p.occupation === 'Unemployed');
      else if (category === 'health_condition')
        filtered = filtered.filter((p) => p.healthCondition && p.healthCondition !== 'None');
    }

    const term = searchTerm.trim().toLowerCase();
    const isNumeric = /^\d+$/.test(term);

    if (term) {
      filtered = filtered.filter((p) => {
        const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase();
        const brgy = (p.barangay ?? '').toLowerCase();
        const ageMatch = isNumeric ? String(p.age ?? '') === term : false;
        return name.includes(term) || brgy.includes(term) || ageMatch;
      });
    }

    if (selectedBarangay !== 'All Barangay') {
      filtered = filtered.filter((p) => p.barangay === selectedBarangay);
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedBarangay, populationData, category]);

  // ---------- SUGGESTIONS (names + barangays) ----------
  useEffect(() => {
    const t = debouncedTerm.trim().toLowerCase();
    if (!t) {
      setSuggestions([]);
      setShowSug(false);
      setActiveIndex(-1);
      return;
    }

    // build name display from current dataset
    const nameSugs = Array.from(
      new Set(
        populationData
          .map((p) => `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim())
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
  }, [debouncedTerm, populationData]);

  const selectSuggestion = (item) => {
    if (!item) return;
    if (item.type === 'barangay') {
      setSelectedBarangay(item.label);
      setSearchTerm(''); // clear text when choosing barangay
    } else {
      setSearchTerm(item.label); // set exact name
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

  // close suggestions on outside click
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

  const openModal = (person) => {
    setSelectedPerson(person);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedPerson(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedBarangay('All Barangay');
  };

  // ---------- Dynamic header like SuperAdminDashboard ----------
  const hasSearch = searchTerm.trim().length > 0;
  const headerTitle = hasSearch ? `Results for "${searchTerm.trim()}"` : pageTitle;

  return (
    <div className="mx-auto mt-28 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-800">
            {headerTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredData.length.toLocaleString()} {filteredData.length === 1 ? 'result' : 'results'}
            {selectedBarangay !== 'All Barangay' && !hasSearch && (
              <> · <span className="font-medium text-slate-700">{selectedBarangay}</span></>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {/* Search + suggestions */}
          <div className="relative flex-1 sm:w-72" ref={sugRef}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search name, barangay, or age…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowSug(true); }}
              onFocus={() => suggestions.length && setShowSug(true)}
              onKeyDown={onKeyDown}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}

            {/* Suggestion list */}
            {showSug && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md max-h-72 overflow-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={`${s.type}-${s.label}-${i}`}
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
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

          {/* Barangay select */}
          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 sm:w-56"
          >
            {allBarangayOptions.map((barangay, index) => (
              <option key={index} value={barangay}>
                {barangay}
              </option>
            ))}
          </select>

          {(searchTerm || selectedBarangay !== 'All Barangay') && (
            <button
              onClick={clearFilters}
              className="rounded-xl bg-[#2b78c6] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1a5c9e]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-sm text-slate-700">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[14%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[20%]" />
              <col className="w-[8%]" />
            </colgroup>

            <thead className="bg-slate-50/60 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Birthdate</th>
                <th className="px-5 py-3 font-medium">Age</th>
                <th className="px-5 py-3 font-medium">Gender</th>
                <th className="px-5 py-3 font-medium">Health</th>
                <th className="px-5 py-3 font-medium">Barangay</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-5 py-3 align-middle"><div className="h-3 w-40 rounded bg-slate-200" /></td>
                    <td className="px-5 py-3 align-middle"><div className="h-3 w-24 rounded bg-slate-200" /></td>
                    <td className="px-5 py-3 align-middle"><div className="h-3 w-10 rounded bg-slate-200" /></td>
                    <td className="px-5 py-3 align-middle"><div className="h-3 w-16 rounded bg-slate-200" /></td>
                    <td className="px-5 py-3 align-middle"><div className="h-3 w-24 rounded bg-slate-200" /></td>
                    <td className="px-5 py-3 align-middle"><div className="h-3 w-28 rounded bg-slate-200" /></td>
                    <td className="px-5 py-3 align-middle"><div className="h-8 w-24 rounded-lg bg-slate-200" /></td>
                  </tr>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 align-middle">
                      <div className="max-w-[240px] truncate font-medium text-slate-800">
                        {(person.firstName || '') + ' ' + (person.lastName || '')}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle whitespace-nowrap">
                      {person.dateOfBirth || 'N/A'}
                    </td>
                    <td className="px-5 py-3 align-middle whitespace-nowrap">
                      {person.age || 'N/A'}
                    </td>
                    <td className="px-5 py-3 align-middle whitespace-nowrap">
                      {person.gender || 'N/A'}
                    </td>
                    <td className="px-5 py-3 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                        {person.healthCondition || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className="max-w-[240px] truncate">
                        {person.barangay || 'N/A'}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <button
                        onClick={() => openModal(person)}
                        className="rounded-lg bg-[#2b78c6] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#1a5c9e]"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-3 h-10 w-10 rounded-full bg-slate-100" />
                      <p className="text-sm font-medium text-slate-700">No data found</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Try adjusting your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ProfileViewModal isOpen={modalIsOpen} onClose={closeModal} person={selectedPerson} />
    </div>
  );
}

export default TotalListIOfPopulation;
