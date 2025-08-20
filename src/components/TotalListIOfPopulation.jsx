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

/* ---------- helpers ---------- */
const normalize = (v) => (v ?? '').toString().trim().toLowerCase();
const hasHealthCondition = (health) => {
  const h = normalize(health);
  if (!h) return false;
  return !new Set(['healthy', 'none', 'no health condition', 'no condition', 'n/a', 'na', 'good']).has(h);
};
const isEmptyOccupation = (val) => {
  const s = normalize(val);
  if (!s) return true;
  return ['none', 'n/a', 'na', '-', 'wala'].includes(s);
};
const isStudentOccupation = (val) => {
  if (!val) return false;
  const s = normalize(val);
  const keys = [
    'student','estudyante','pupil','learner',
    'junior high','senior high','jhs','shs',
    'elementary student','college student','university student'
  ];
  return keys.some(k => s.includes(k));
};
const getAge = (p) => {
  if (typeof p?.age === 'number') return p.age;
  if (p?.age && !isNaN(Number(p.age))) return Number(p.age);
  const dob = p?.dateOfBirth || p?.birthDate;
  if (!dob) return null;
  const d = typeof dob === 'object' && dob?.seconds ? new Date(dob.seconds * 1000) : new Date(dob);
  if (isNaN(d)) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
};
const formatDOB = (val) => {
  if (!val) return 'N/A';
  const d = typeof val === 'object' && val?.seconds ? new Date(val.seconds * 1000) : new Date(val);
  if (isNaN(d)) return String(val);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = d.getFullYear();
  return `${mm}/${dd}/${yy}`;
};

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

  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const sugRef = useRef(null);
  const inputRef = useRef(null);

  const allBarangayOptions = useMemo(
    () => ['All Barangay', ...allBarangays.map((b) => b.name)],
    []
  );

  useEffect(() => { setLoading(false); }, [populationData]);

  useEffect(() => {
    if (!category) { setPageTitle('Total Population'); return; }
    let title = 'Total Population';
    if (category === 'male') title = 'Total Male Population';
    else if (category === 'female') title = 'Total Female Population';
    else if (category === 'students' || category === 'student') title = 'Total Students';
    else if (category === 'not_attending_25_below') title = 'Not Attending School (≤25)';
    else if (category === 'unemployed') title = 'Total Unemployed';
    else if (category === 'with_health') title = 'With Health Condition';
    else if (category === 'no_health') title = 'No Health Condition';
    setPageTitle(title);
  }, [category]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brgyFromUrl = params.get('barangay');
    if (brgyFromUrl && allBarangayOptions.includes(brgyFromUrl)) {
      setSelectedBarangay(brgyFromUrl);
    }
  }, [location.search, allBarangayOptions]);

  useEffect(() => {
    let filtered = [...populationData];

    if (category) {
      if (category === 'male') filtered = filtered.filter((p) => p.gender === 'Male');
      else if (category === 'female') filtered = filtered.filter((p) => p.gender === 'Female');
      else if (category === 'students' || category === 'student') filtered = filtered.filter((p) => isStudentOccupation(p.occupation));
      else if (category === 'not_attending_25_below') {
        filtered = filtered.filter((p) => {
          const age = getAge(p);
          return age !== null && age <= 25 && !isStudentOccupation(p.occupation);
        });
      } else if (category === 'unemployed') filtered = filtered.filter((p) => isEmptyOccupation(p.occupation));
      else if (category === 'with_health') filtered = filtered.filter((p) => hasHealthCondition(p.healthCondition));
      else if (category === 'no_health') filtered = filtered.filter((p) => !hasHealthCondition(p.healthCondition));
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

  useEffect(() => {
    const t = debouncedTerm.trim().toLowerCase();
    if (!t) { setSuggestions([]); setShowSug(false); setActiveIndex(-1); return; }

    const nameSugs = Array.from(
      new Set(
        populationData
          .map((p) => `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim())
          .filter((n) => n && n.toLowerCase().includes(t))
      )
    ).slice(0, 6);

    const brgySugs = allBarangays.map((b) => b.name).filter((b) => b.toLowerCase().includes(t)).slice(0, 4);

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
    if (item.type === 'barangay') { setSelectedBarangay(item.label); setSearchTerm(''); }
    else { setSearchTerm(item.label); }
    setShowSug(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e) => {
    if (!showSug || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIndex >= 0) selectSuggestion(suggestions[activeIndex]); setShowSug(false); }
    else if (e.key === 'Escape') { setShowSug(false); }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (!sugRef.current) return;
      if (!sugRef.current.contains(e.target) && e.target !== inputRef.current) setShowSug(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (person) => { setSelectedPerson(person); setModalIsOpen(true); };
  const closeModal = () => { setModalIsOpen(false); setSelectedPerson(null); };
  const clearFilters = () => { setSearchTerm(''); setSelectedBarangay('All Barangay'); };

  const hasSearch = searchTerm.trim().length > 0;
  const headerTitle = hasSearch ? `Results for "${searchTerm.trim()}"` : pageTitle;

  // Excel-ish cell classes (thicker borders)
  const thCls = "px-3 py-2 text-[13px] font-semibold italic text-slate-700 bg-slate-100 border border-slate-500";
  const tdCls = "px-3 py-2 text-[13px] align-middle border border-slate-500";

  return (
    <div className="mx-auto mt-28 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">{headerTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredData.length.toLocaleString()} {filteredData.length === 1 ? 'result' : 'results'}
            {selectedBarangay !== 'All Barangay' && !hasSearch && <> · <span className="font-medium text-slate-700">{selectedBarangay}</span></>}
          </p>
        </div>

        {/* Filters */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <div className="relative flex-1 sm:w-72" ref={sugRef}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search Here…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setShowSug(true); }}
              onFocus={() => suggestions.length && setShowSug(true)}
              onKeyDown={onKeyDown}
              className="w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 pr-9 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100"
                aria-label="Clear search"
              >✕</button>
            )}
            {showSug && suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-md max-h-72 overflow-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={`${s.type}-${s.label}-${i}`}
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                    className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm ${i === activeIndex ? 'bg-gray-100' : 'bg-white'}`}
                  >
                    <span className="truncate">{s.label}</span>
                    <span className="ml-3 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-500">{s.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-slate-200 sm:w-56"
          >
            {allBarangayOptions.map((barangay, index) => (
              <option key={index} value={barangay}>{barangay}</option>
            ))}
          </select>

          {(searchTerm || selectedBarangay !== 'All Barangay') && (
            <button
              onClick={clearFilters}
              className="rounded-full bg-[#2b78c6] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1a5c9e]"
            >Reset</button>
          )}
        </div>
      </div>

      {/* Excel-like grid */}
      <div className="overflow-hidden rounded-xl border-2 border-slate-600 bg-gray-100/60 shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full border-collapse text-slate-900">
            <thead>
              <tr>
                <th className={thCls}>Name</th>
                <th className={thCls}>Birthdate</th>
                <th className={thCls}>Age</th>
                <th className={thCls}>Gender</th>
                <th className={thCls}>Health Condition</th>
                <th className={thCls}>Barangay</th>
                <th className={thCls}></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(12)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="odd:bg-white even:bg-slate-50">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className={tdCls}>
                        <div className="h-3 w-full max-w-[160px] rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((person, idx) => (
                  <tr key={person.id} className="odd:bg-white even:bg-slate-50 hover:bg-slate-100">
                    <td className={tdCls}>
                      <span className="font-medium">
                        {`${idx + 1}. ${person.lastName || ''}, ${person.firstName || ''}`}
                      </span>
                    </td>
                    <td className={tdCls}>{formatDOB(person.dateOfBirth)}</td>
                    <td className={tdCls}>{person.age ?? getAge(person) ?? 'N/A'}</td>
                    <td className={tdCls}>{person.gender || 'N/A'}</td>
                    <td className={tdCls}>{person.healthCondition || 'None'}</td>
                    <td className={tdCls}>{person.barangay || 'N/A'}</td>
                    <td className={tdCls}>
                      <button
                        onClick={() => openModal(person)}
                        className="text-red-600 underline underline-offset-2 hover:text-red-700"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className={`${tdCls} text-center py-10 bg-white`}>
                    No data found — try adjusting your search or filters.
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
