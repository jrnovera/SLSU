import React, { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebase/config';
import {
  collection,
  query,
  getDocs,
  orderBy,
  startAt,
  endAt,
  limit,
  where,
  doc,
  getDoc,
} from 'firebase/firestore';
import searchIcon from '../assets/icons/search.png';
import ProfileViewModal from './ProfileViewModal';
import userIcon from '../assets/icons/user.png';

const SUGGESTION_LIMIT = 8;
const FALLBACK_SCAN_LIMIT = 120; // scan a small window if index/fields missing

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);

  const term = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);
  const isNumeric = useMemo(() => /^\d+$/.test(term), [term]);

  useEffect(() => {
    let cancelled = false;

    const fetchSuggestions = async () => {
      if (term === '') {
        setSuggestions([]);
        setActiveIndex(-1);
        return;
      }

      setLoading(true);
      try {
        const peopleRef = collection(db, 'indigenousPeople');

        // Preferred: use lower-cased fields if they exist
        const qFirst = query(
          peopleRef,
          orderBy('firstNameLower'),
          startAt(term),
          endAt(term + '\uf8ff'),
          limit(SUGGESTION_LIMIT)
        );
        const qLast = query(
          peopleRef,
          orderBy('lastNameLower'),
          startAt(term),
          endAt(term + '\uf8ff'),
          limit(SUGGESTION_LIMIT)
        );
        const qBrgy = query(
          peopleRef,
          orderBy('barangayLower'),
          startAt(term),
          endAt(term + '\uf8ff'),
          limit(SUGGESTION_LIMIT)
        );
        // Add tribe/lineage search functionality
        const qLineage = query(
          peopleRef,
          orderBy('lineage'),
          startAt(term),
          endAt(term + '\uf8ff'),
          limit(SUGGESTION_LIMIT)
        );

        const queries = [getDocs(qFirst), getDocs(qLast), getDocs(qBrgy), getDocs(qLineage)];
        if (isNumeric) {
          const qAge = query(peopleRef, where('age', '==', Number(term)), limit(SUGGESTION_LIMIT));
          queries.push(getDocs(qAge));
        }

        let snaps;
        try {
          snaps = await Promise.all(queries);
        } catch {
          // if any index error -> fallback scan
          const allSnap = await getDocs(query(peopleRef, limit(FALLBACK_SCAN_LIMIT)));
          snaps = [allSnap];
        }

        // Merge results
        const mergedMap = new Map();
        snaps.forEach((snap) => {
          snap.forEach((d) => mergedMap.set(d.id, { id: d.id, ...d.data() }));
        });
        let merged = Array.from(mergedMap.values());

        // 🔁 If no hits (likely because *Lower fields don't exist), do a fallback scan + client filter
        if (merged.length === 0) {
          const allSnap = await getDocs(query(peopleRef, limit(FALLBACK_SCAN_LIMIT)));
          const scanned = allSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          merged = scanned.filter((p) => {
            const fn = (p.firstName || '').toLowerCase();
            const ln = (p.lastName || '').toLowerCase();
            const br = (p.barangay || '').toLowerCase();
            const lineage = (p.lineage || '').toLowerCase();
            const ageOk = isNumeric ? Number(p.age) === Number(term) : false;
            return (
              fn.startsWith(term) ||
              ln.startsWith(term) ||
              br.startsWith(term) ||
              lineage.startsWith(term) ||
              ageOk
            );
          });
        }

        // Dedupe + cap
        const unique = [];
        const seen = new Set();
        for (const p of merged) {
          if (!seen.has(p.id)) {
            unique.push(p);
            seen.add(p.id);
          }
          if (unique.length >= SUGGESTION_LIMIT) break;
        }

        if (!cancelled) {
          setSuggestions(unique);
          setActiveIndex(unique.length ? 0 : -1);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(fetchSuggestions, 220); // debounce
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [term, isNumeric]);

  const openModalWithFullDoc = async (personLite) => {
    try {
      const ref = doc(db, 'indigenousPeople', personLite.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSelectedPerson({ id: snap.id, ...snap.data() });
        setIsModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to fetch full person document:', e);
    } finally {
      setSearchTerm('');
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  const onKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) openModalWithFullDoc(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  const highlight = (text) => {
    const t = (text || '').toString();
    if (!term) return t;
    const i = t.toLowerCase().indexOf(term);
    if (i === -1) return t;
    return (
      <>
        {t.slice(0, i)}
        <mark className="rounded bg-yellow-100 px-0.5">{t.slice(i, i + term.length)}</mark>
        {t.slice(i + term.length)}
      </>
    );
  };

  return (
    <div className="relative w-full">
      {/* Input */}
      <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-md w-full">
        <input
          type="text"
          className="flex-1 outline-none bg-transparent text-sm placeholder-gray-400"
          placeholder="Search name, tribe, barangay, or age…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={suggestions.length > 0}
        />
        <img src={searchIcon} alt="Search" className="w-5 h-5 ml-2 opacity-70" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute left-0 mt-2 w-full bg-white text-sm text-gray-500 px-4 py-2 shadow rounded-md z-10">
          Loading…
        </div>
      )}

      {/* Suggestions */}
      {!loading && (suggestions.length > 0 || term) && (
        <ul
          id="search-suggestions"
          ref={listRef}
          className="absolute left-0 mt-2 w-full bg-white shadow-md rounded-md z-10 overflow-hidden"
          role="listbox"
        >
          {suggestions.length === 0 ? (
            <li className="px-4 py-2 text-sm text-gray-500">No matches</li>
          ) : (
            suggestions.map((person, idx) => {
              const fullName = `${person.firstName || ''} ${person.lastName || ''}`.trim();
              return (
                <li
                  key={person.id}
                  role="option"
                  aria-selected={idx === activeIndex}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => openModalWithFullDoc(person)}
                  className={`px-0.5- py-2 cursor-pointer text-sm flex items-center gap-3 ${
                    idx === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Icon */}
                  <img
                    src={userIcon}
                    alt="User"
                    className="w-8 h-8 block flex-shrink-0 rounded-full object-cover"
                  />

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {highlight(fullName || 'Unnamed')}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      Tribe: {highlight(person.lineage || '—')} · Barangay: {highlight(person.barangay || '—')} · Age: {person.age ?? '—'}
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}

      {/* Modal */}
      {isModalOpen && selectedPerson && (
        <ProfileViewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          person={selectedPerson}
        />
      )}
    </div>
  );
}

export default SearchBar;
