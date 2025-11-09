import React, { useEffect, useMemo, useRef, useState } from 'react';
import profileImg from '../assets/icons/user.png'; // Default profile image
import { useLocation, useNavigate } from 'react-router-dom';
import ProfileViewModal from './ProfileViewModal';
import IPFormModal from './IPFormModal';
import ConfirmationModal from './ConfirmationModal';
import { allBarangays } from './Brgylist';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FaEdit, FaTrash, FaEye, FaPlus, FaArrowLeft, FaDownload } from 'react-icons/fa';
import exportToXlsx from '../utils/exportToXlsx';

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
const hasHealthCondition = (person) => {
  const health = person?.healthCondition;

  // Check if using new format (Healthy/Not Healthy)
  if (health === "Healthy") return false;
  if (health === "Not Healthy") return true;

  // Fallback to legacy healthCondition text values
  const h = normalize(health);
  if (!h || h === 'n/a' || h === 'na' || h === 'none' || h === 'healthy' ||
      h === 'no health condition' || h === 'no condition' || h === 'good' ||
      h === '-' || h === 'normal') {
    return false;
  }
  return true;
};
const isUnemployed = (person) => {
  // Check new isEmployed field first
  if (person && person.isEmployed !== undefined && person.isEmployed !== null && person.isEmployed !== "") {
    return person.isEmployed === false;
  }

  // Fallback to legacy occupation-based check
  const val = person?.occupation;
  const s = normalize(val);
  if (!s) return true;
  return ['none', 'n/a', 'na', '-', 'wala'].includes(s);
};
// Check if person is a student based on isStudent field (new) or occupation (legacy)
const isStudentOccupation = (val, person = null) => {
  // Prioritize the new isStudent field if person object is provided
  if (person && person.isStudent !== undefined && person.isStudent !== "") {
    return person.isStudent === "Student";
  }

  // Fallback to occupation-based check for legacy data
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
const formatName = (person) => {
  if (!person) return 'N/A';
  const last = person.lastName || '';
  const firstMiddle = [person.firstName, person.middleName].filter(Boolean).join(' ').trim();
  const formatted = [last, firstMiddle].filter(Boolean).join(', ');
  return formatted || 'N/A';
};
const cleanField = (value) => {
  if (value === undefined || value === null) return '';
  const str = String(value).trim();
  if (!str) return '';
  if (['n/a', 'na', '-', 'none'].includes(str.toLowerCase())) return '';
  return str;
};
const displayOrNA = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : 'N/A';
  }
  return value ?? 'N/A';
};
const TABLE_SCROLL_HEIGHT = 'calc(100vh - 320px)';
const resolveAgeLabel = (person) => {
  const ageValue = person?.age;
  if (typeof ageValue === 'number' && !Number.isNaN(ageValue)) return ageValue;
  if (typeof ageValue === 'string' && ageValue.trim() !== '' && !Number.isNaN(Number(ageValue))) {
    return Number(ageValue);
  }
  const derived = getAge(person);
  return typeof derived === 'number' && !Number.isNaN(derived) ? derived : 'N/A';
};
const getStudentDisplay = (person) => {
  if (typeof person?.isStudent === 'string' && person.isStudent.trim() !== '') {
    if (person.isStudent === 'Student') return 'Yes';
    if (person.isStudent === 'Not Student') return 'No';
    return displayOrNA(person.isStudent);
  }
  if (!normalize(person?.occupation)) return 'N/A';
  return isStudentOccupation(person.occupation, person) ? 'Yes' : 'No';
};
const getUnemployedDisplay = (person) => {
  if (person?.isEmployed === true) return 'No';
  if (person?.isEmployed === false) return 'Yes';
  if (!normalize(person?.occupation)) return 'N/A';
  return isUnemployed(person) ? 'Yes' : 'No';
};
const getHealthStatusDisplay = (person) => {
  const raw = person?.healthCondition;
  const hasRaw = raw !== undefined && raw !== null && `${raw}`.trim() !== '';
  const hasCondition = hasHealthCondition(person);
  if (!hasRaw && !hasCondition) return 'N/A';
  return hasCondition ? 'Yes' : 'No';
};
const getParentName = (person, type = 'father') => {
  if (!person) return 'N/A';
  const value = cleanField(
    person.familyTree?.[type] ||
    person[type]
  );
  return value || 'N/A';
};
const getNameSortKey = (person) => {
  if (!person) return '';
  const last = (person.lastName || '').toString().toLowerCase();
  const first = (person.firstName || '').toString().toLowerCase();
  const middle = (person.middleName || '').toString().toLowerCase();
  const nameKey = `${last} ${first} ${middle}`.trim();
  return nameKey || (person.displayName || '').toString().toLowerCase();
};
const sortByName = (list) =>
  [...list].sort((a, b) => {
    const nameA = getNameSortKey(a);
    const nameB = getNameSortKey(b);
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

function TotalListIOfPopulation({ populationData = [], category = null, onDataChange }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebouncedValue(searchTerm, 220);

  const [selectedBarangay, setSelectedBarangay] = useState('All Barangay');
  const [selectedFilter, setSelectedFilter] = useState('Show All');
  const [filteredData, setFilteredData] = useState([]);
  const [pageTitle, setPageTitle] = useState('Total Population');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loading, setLoading] = useState(true);

  // CRUD state
  const [selectedForAction, setSelectedForAction] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [personToEdit, setPersonToEdit] = useState(null);
  const [personToDelete, setPersonToDelete] = useState(null);

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
    setFilteredData(sortByName(populationData));
  }, [populationData]);

  useEffect(() => {
    if (!category) { setPageTitle('Master List'); return; }
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
      else if (category === 'students' || category === 'student') filtered = filtered.filter((p) => isStudentOccupation(p.occupation, p));
      else if (category === 'not_attending_25_below') {
        filtered = filtered.filter((p) => {
          const age = getAge(p);
          return age !== null && age <= 25 && p.isStudent === "Not Student";
        });
      } else if (category === 'unemployed') filtered = filtered.filter((p) => isUnemployed(p));
      else if (category === 'with_health') filtered = filtered.filter((p) => hasHealthCondition(p));
      else if (category === 'no_health') filtered = filtered.filter((p) => !hasHealthCondition(p));
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
    // Apply filter
    if (selectedFilter !== 'Show All') {
      if (selectedFilter === 'Male' || selectedFilter === 'Female') {
        filtered = filtered.filter((p) => p.gender === selectedFilter);
      } else if (selectedFilter === 'Student') {
        filtered = filtered.filter((p) => isStudentOccupation(p.occupation, p));
      } else if (selectedFilter === 'Non-Student') {
        filtered = filtered.filter((p) => !isStudentOccupation(p.occupation, p) && !isUnemployed(p));
      } else if (selectedFilter === 'Unemployed') {
        filtered = filtered.filter((p) => isUnemployed(p));
      } else if (selectedFilter === 'PWD') {
        filtered = filtered.filter((p) => hasHealthCondition(p));
      }
    }

    if (selectedBarangay !== 'All Barangay') {
      filtered = filtered.filter((p) => p.barangay === selectedBarangay);
    }
    filtered = sortByName(filtered);
    setFilteredData(filtered);
  }, [searchTerm, selectedBarangay, selectedFilter, populationData, category]);

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
  const clearFilters = () => { setSearchTerm(''); setSelectedBarangay('All Barangay'); setSelectedFilter('Show All'); };
  
  // CRUD handlers
  const handleAdd = () => {
    setShowAddModal(true);
  };

  const handleUpdate = (person) => {
    // Make a deep copy of the person object to avoid reference issues
    const personCopy = JSON.parse(JSON.stringify(person));
    setSelectedForAction(personCopy);
    setPersonToEdit(personCopy);
    setShowEditModal(true);
  };

  const requestDelete = (person) => {
    setSelectedForAction(person);
    setPersonToDelete(person);
    setShowDeleteModal(true);
  };

  const handleCloseForm = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
  };

  const handleAddSubmit = async (formData) => {
    try {
      setIsProcessing(true);
      // Note: formData already contains createdAt from IPFormModal
      const docRef = await addDoc(collection(db, 'indigenousPeople'), formData);
      const newPerson = { id: docRef.id, ...formData };
      
      // Update local data
      const updatedData = [...filteredData, newPerson];
      setFilteredData(updatedData);
      
      // Notify parent component if callback exists
      if (onDataChange) onDataChange(updatedData);
      
      handleCloseForm();
      alert('Person added successfully!');
    } catch (error) {
      console.error('Error adding person:', error);
      alert(`Error adding person: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateSubmit = async (formData) => {
    if (!personToEdit?.id) return;
    
    try {
      setIsProcessing(true);
      
      // Process family tree data (convert comma-separated strings to arrays)
      const processedFamilyTree = { ...formData.familyTree };
      if (typeof processedFamilyTree.siblings === 'string') {
        processedFamilyTree.siblings = processedFamilyTree.siblings
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      if (typeof processedFamilyTree.children === 'string') {
        processedFamilyTree.children = processedFamilyTree.children
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }
      
      const updateData = {
        ...formData,
        familyTree: processedFamilyTree,
        updatedAt: serverTimestamp(),
      };

      const personRef = doc(db, 'indigenousPeople', personToEdit.id);
      await updateDoc(personRef, updateData);
      
      // Update local data with the processed data
      const updatedPerson = { ...personToEdit, ...updateData };
      const updatedData = filteredData.map(p => 
        p.id === personToEdit.id ? updatedPerson : p
      );
      
      setFilteredData(updatedData);
      setSelectedForAction(null);
      
      // Notify parent component if callback exists
      if (onDataChange) onDataChange(updatedData);
      
      handleCloseForm();
      alert('Person updated successfully!');
    } catch (error) {
      console.error('Error updating person:', error);
      alert(`Error updating person: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!personToDelete?.id) return;
    
    try {
      setIsProcessing(true);
      const personRef = doc(db, 'indigenousPeople', personToDelete.id);
      await deleteDoc(personRef);
      
      // Update local data
      const updatedData = filteredData.filter(p => p.id !== personToDelete.id);
      setFilteredData(updatedData);
      setSelectedForAction(null);
      
      // Notify parent component if callback exists
      if (onDataChange) onDataChange(updatedData);
      
      handleCloseForm();
      alert('Person deleted successfully!');
    } catch (error) {
      console.error('Error deleting person:', error);
      alert(`Error deleting person: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasSearch = searchTerm.trim().length > 0;
  const headerTitle = hasSearch ? `Results for "${searchTerm.trim()}"` : pageTitle;

  // Excel-ish cell classes (thicker borders)
  const thCls = "px-3 py-2 text-[13px] font-semibold italic text-slate-700 bg-slate-100 border border-slate-500";
  const tdCls = "px-3 py-2 text-[13px] align-middle border border-slate-500";
  
  // Column width styles
  const colWidths = {
    photo: { width: '60px' },
    name: { width: '180px' },
    birthdate: { width: '100px' },
    age: { width: '60px' },
    gender: { width: '80px' },
    birthplace: { width: '150px' },
    tribe: { width: '120px' },
    father: { width: '150px' },
    mother: { width: '150px' },
    status: { width: '90px' },
    barangay: { width: '120px' },
    action: { width: '85px' },
  };
  const exportColumns = useMemo(() => ([
    { label: '#', value: (_person, index) => index + 1 },
    { label: 'Name', value: (person) => formatName(person) },
    {
      label: 'Birthdate',
      value: (person) => formatDOB(person.dateOfBirth || person.birthDate),
    },
    {
      label: 'Age',
      value: (person) => person.age ?? getAge(person) ?? 'N/A',
    },
    { label: 'Gender', value: (person) => person.gender || 'N/A' },
    {
      label: 'Birthplace',
      value: (person) => person.birthplace || person.address || 'N/A',
    },
    { label: 'Tribe', value: (person) => person.lineage || 'N/A' },
    { label: 'Father', value: (person) => getParentName(person, 'father') },
    { label: 'Mother', value: (person) => getParentName(person, 'mother') },
    {
      label: 'Student',
      value: (person) => (isStudentOccupation(person.occupation, person) ? 'Yes' : 'No'),
    },
    {
      label: 'Unemployed',
      value: (person) => (isUnemployed(person) ? 'Yes' : 'No'),
    },
    {
      label: 'PWD',
      value: (person) => (hasHealthCondition(person) ? 'Yes' : 'No'),
    },
    { label: 'Barangay', value: (person) => person.barangay || 'N/A' },
    {
      label: 'Contact',
      value: (person) => person.contactNumber || person.phoneNumber || person.mobile || 'N/A',
    },
  ]), []);

  const handleExport = () => {
    const today = new Date().toISOString().split('T')[0];
    const safeTitle = pageTitle.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
    exportToXlsx({
      data: filteredData,
      columns: exportColumns,
      filename: `${safeTitle || 'population'}_${today}.xlsx`,
      sheetName: safeTitle?.substring(0, 31) || 'Population',
    });
  };

  return (
    <div className="mx-auto mt-28 w-full max-w-[95%] px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <FaArrowLeft className="text-sm" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">{headerTitle}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredData.length.toLocaleString()} {filteredData.length === 1 ? 'result' : 'results'}
            {selectedBarangay !== 'All Barangay' && !hasSearch && <> · <span className="font-medium text-slate-700">{selectedBarangay}</span></>}
          </p>
        </div>

        {/* Filters and Add Button */}
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row items-center">
          <button
            onClick={handleAdd}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 rounded-full bg-[#2c526b] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-400 disabled:opacity-50"
          >
            <FaPlus size={14} />
            Add New
          </button>
          <button
            onClick={handleExport}
            disabled={!filteredData.length}
            className="flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FaDownload size={14} />
            Export
          </button>
          
          {/* Filter Dropdown */}
          <div className="relative sm:w-36 w-full">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full appearance-none rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="Show All">All Filters</option>
              <optgroup label="Gender">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </optgroup>
              <optgroup label="Status">
                <option value="Student">Student</option>
                <option value="Non-Student">Non-Student</option>
                <option value="Unemployed">Unemployed</option>
                <option value="PWD">PWD</option>
              </optgroup>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
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

          <div className="relative sm:w-56 w-full">
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="w-full appearance-none rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              {allBarangayOptions.map((barangay, index) => (
                <option key={index} value={barangay}>{barangay}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          {(searchTerm || selectedBarangay !== 'All Barangay' || selectedFilter !== 'Show All') && (
            <button
              onClick={clearFilters}
              className="rounded-full bg-[#2b78c6] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1a5c9e]"
            >Reset</button>
          )}
        </div>
      </div>

      {/* Excel-like grid */}
      <div className="overflow-hidden rounded-xl border-2 border-slate-600 bg-gray-100/60 shadow-sm">
        <div className="overflow-x-auto">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: TABLE_SCROLL_HEIGHT }}
          >
            <table className="w-full table-fixed border-collapse text-slate-900" style={{ minWidth: '1500px' }}>
              <thead className="sticky top-0 z-10 bg-[#e9ecef]">
              <tr>
                <th className={thCls} style={colWidths.photo}>Photo</th>
                <th className={thCls} style={colWidths.name}>Name</th>
                <th className={thCls} style={colWidths.birthdate}>Birthdate</th>
                <th className={thCls} style={colWidths.age}>Age</th>
                <th className={thCls} style={colWidths.gender}>Gender</th>
                <th className={thCls} style={colWidths.birthplace}>Birthplace</th>
                <th className={thCls} style={colWidths.tribe}>Tribe</th>
                <th className={thCls} style={colWidths.father}>Father</th>
                <th className={thCls} style={colWidths.mother}>Mother</th>
                <th className={thCls} style={colWidths.status}>STUDENT</th>
                <th className={thCls} style={colWidths.status}>UNEMPLOYED</th>
                <th className={thCls} style={colWidths.status}>PWD</th>
                <th className={thCls} style={colWidths.barangay}>Barangay</th>
                <th className={thCls} style={colWidths.action} colSpan="3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                [...Array(12)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="odd:bg-white even:bg-slate-50">
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className={tdCls}>
                        <div className="h-3 w-full max-w-[160px] rounded bg-slate-200" />
                      </td>
                    ))}
                    {/* Action button placeholders */}
                    {Array.from({ length: 3 }).map((__, j) => (
                      <td key={`action-${j}`} className={tdCls + " text-center"}>
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredData.length > 0 ? (
                filteredData.map((person, idx) => (
                  <tr 
                    key={person.id} 
                    className={`cursor-pointer ${selectedForAction?.id === person.id ? 'bg-blue-100 !important' : 'odd:bg-white even:bg-slate-50 hover:bg-slate-100'}`}
                    onClick={() => setSelectedForAction(person)}
                  >
                    <td className={tdCls} style={colWidths.photo}>
                      <div className="flex justify-center">
                        <img 
                          src={person.photoURL || person.image || profileImg} 
                          alt="" 
                          className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = profileImg;
                          }}
                        />
                      </div>
                    </td>
                    <td className={tdCls} style={colWidths.name}>
                      <span className="font-medium">
                        {`${idx + 1}. ${formatName(person)}`}
                      </span>
                    </td>
                    <td className={tdCls} style={colWidths.birthdate}>{formatDOB(person.dateOfBirth)}</td>
                    <td className={tdCls} style={colWidths.age}>{resolveAgeLabel(person)}</td>
                    <td className={tdCls} style={colWidths.gender}>{displayOrNA(person.gender)}</td>
                    <td className={tdCls} style={colWidths.birthplace}>{displayOrNA(person.birthplace || person.address)}</td>
                    <td className={tdCls} style={colWidths.tribe}>{displayOrNA(person.lineage)}</td>
                    <td className={tdCls} style={colWidths.father}>{getParentName(person, 'father')}</td>
                    <td className={tdCls} style={colWidths.mother}>{getParentName(person, 'mother')}</td>
                    <td className={tdCls} style={colWidths.status}>{getStudentDisplay(person)}</td>
                    <td className={tdCls} style={colWidths.status}>{getUnemployedDisplay(person)}</td>
                    <td className={tdCls} style={colWidths.status}>{getHealthStatusDisplay(person)}</td>
                    <td className={tdCls} style={colWidths.barangay}>{displayOrNA(person.barangay)}</td>
                    <td className={tdCls + " text-center px-4"} style={colWidths.action}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(person);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                        title="View Profile"
                      >
                        <FaEye size={14} />
                      </button>
                    </td>
                    <td className={tdCls + " text-center px-4"} style={colWidths.action}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdate(person);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                        title="Edit"
                        disabled={isProcessing}
                      >
                        <FaEdit size={14} />
                      </button>
                    </td>
                    <td className={tdCls + " text-center px-4"} style={colWidths.action}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDelete(person);
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Delete"
                        disabled={isProcessing}
                      >
                        <FaTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className={`${tdCls} text-center py-10 bg-white`}>
                    No data found — try adjusting your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Modals */}
      <ProfileViewModal isOpen={modalIsOpen} onClose={closeModal} person={selectedPerson} />
      
      {/* Add Person Modal */}
      <IPFormModal
        isOpen={showAddModal}
        onClose={handleCloseForm}
        onSubmit={handleAddSubmit}
        isProcessing={isProcessing}
      />
      
      {/* Edit Person Modal */}
      <IPFormModal
        isOpen={showEditModal}
        onClose={handleCloseForm}
        onSubmit={handleUpdateSubmit}
        initialData={personToEdit}
        isEditing={true}
        isProcessing={isProcessing}
      />
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseForm}
        onConfirm={handleDeleteConfirm}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${personToDelete?.firstName} ${personToDelete?.lastName}?`}
        confirmText="Yes"
        cancelText="No"
        isProcessing={isProcessing}
        personToDelete={personToDelete}
      />
    </div>
  );
}

export default TotalListIOfPopulation;
