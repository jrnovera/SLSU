import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FaUser } from 'react-icons/fa';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import profileImg from '../assets/icons/user.png'; // ✅ default avatar

function formatDOB(dateOfBirth) {
  if (!dateOfBirth) return 'N/A';
  if (typeof dateOfBirth === 'object' && dateOfBirth?.seconds) {
    const d = new Date(dateOfBirth.seconds * 1000);
    return d.toISOString().slice(0, 10);
  }
  try {
    const d = new Date(dateOfBirth);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch (e) {}
  return String(dateOfBirth);
}

const toArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string')
    return val.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
};

const ProfileViewModal = ({ isOpen, onClose, person }) => {
  const [tribeStats, setTribeStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  // Fetch tribe statistics when modal opens
  useEffect(() => {
    if (!isOpen) return;
    
    let cancelled = false;
    const fetchTribeStats = async () => {
      setStatsLoading(true);
      setStatsError('');
      try {
        const snap = await getDocs(collection(db, 'indigenousPeople'));
        const counts = {};
        let total = 0;
        
        snap.forEach((doc) => {
          const data = doc.data() || {};
          let lineage = (data.lineage || '').toString().trim();
          if (!lineage) lineage = 'Unknown';
          counts[lineage] = (counts[lineage] || 0) + 1;
          total += 1;
        });
        
        // Convert to array with percentages, sorted by count
        const statsArray = Object.entries(counts)
          .map(([name, count]) => ({
            name,
            count,
            percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6); // Show top 6 tribes
        
        if (!cancelled) {
          setTribeStats(statsArray);
        }
      } catch (error) {
        console.error('Failed to fetch tribe statistics:', error);
        if (!cancelled) {
          setStatsError('Failed to load statistics');
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };
    
    fetchTribeStats();
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen || !person) return null;

  const {
    firstName,
    lastName,
    dateOfBirth,
    age,
    gender,
    barangay,
    occupation,
    healthCondition,
    householdMembers,
    civilStatus,
    familyTree = {},
    photoURL,
    image, // legacy field fallback
  } = person;

  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'N/A';
  const avatarSrc = photoURL || image || profileImg; // ✅ choose best available

  // Accept nested familyTree OR flat fields if you ever move them to root
  const father = familyTree.father || person.father || 'N/A';
  const mother = familyTree.mother || person.mother || 'N/A';
  const spouse = familyTree.spouse || person.spouse || 'N/A';
  const parsedSiblings = toArray(familyTree.siblings || person.siblings);
  const parsedChildren = toArray(familyTree.children || person.children);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="IP Profile"
      appElement={document.getElementById('root')}
      className="w-[95%] max-w-6xl bg-white rounded-xl shadow-lg p-6 outline-none max-h-[90vh] overflow-y-auto relative"
      overlayClassName="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-3 text-gray-400 hover:text-gray-600 text-2xl leading-none"
      >
        &times;
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Profile Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col items-center text-center space-y-3 mb-4">
            {/* ✅ Avatar with graceful fallback to user.png */}
            <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-gray-200 bg-gray-100 flex items-center justify-center">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={fullName || 'Profile photo'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = profileImg;
                  }}
                />
              ) : (
                <FaUser className="text-gray-500" size={48} />
              )}
            </div>
            <h2 className="text-xl font-semibold">{fullName}</h2>
          </div>

          <div className="space-y-1 text-sm text-gray-700">
            <p><span className="font-semibold">Date of Birth:</span> {formatDOB(dateOfBirth)}</p>
            <p><span className="font-semibold">Gender:</span> {gender || 'N/A'}</p>
            <p><span className="font-semibold">Age:</span> {age ?? 'N/A'}</p>
            <p><span className="font-semibold">Civil Status:</span> {civilStatus || 'N/A'}</p>
            <p><span className="font-semibold">Barangay:</span> {barangay || 'N/A'}</p>
            <p><span className="font-semibold">Occupation:</span> {occupation || 'N/A'}</p>
            <p><span className="font-semibold">Health Condition:</span> {healthCondition || 'N/A'}</p>
            <p><span className="font-semibold">Household Members:</span> {householdMembers || 'N/A'}</p>
          </div>
        </div>

        {/* Column 2: Tribe Statistics */}
        <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center shadow-sm">
          <h2 className="text-lg font-semibold text-center text-gray-800 border-b border-gray-200 pb-3 w-full">
            Tribe Distribution
          </h2>

          {statsLoading ? (
            <div className="flex items-center justify-center mt-6">
              <p className="text-sm text-gray-500">Loading statistics...</p>
            </div>
          ) : statsError ? (
            <div className="flex items-center justify-center mt-6">
              <p className="text-sm text-red-500">{statsError}</p>
            </div>
          ) : tribeStats.length === 0 ? (
            <div className="flex items-center justify-center mt-6">
              <p className="text-sm text-gray-500">No data available</p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6 mt-6">
              {tribeStats.map((tribe, index) => {
                // Color palette for different tribes
                const colors = [
                  '#f59e0b', // amber
                  '#3b82f6', // blue
                  '#10b981', // emerald
                  '#ef4444', // red
                  '#8b5cf6', // violet
                  '#f97316', // orange
                ];
                const color = colors[index % colors.length];
                
                return (
                  <div key={tribe.name} className="flex flex-col items-center space-y-2">
                    <div className="w-20 h-20">
                      <CircularProgressbar
                        value={parseFloat(tribe.percentage)}
                        text={`${tribe.percentage}%`}
                        styles={{
                          path: { stroke: color },
                          trail: { stroke: '#e5e7eb' },
                          text: { fill: '#1f2937', fontSize: '14px', fontWeight: 600 },
                        }}
                      />
                    </div>
                    <p className="text-xs font-medium text-gray-600 text-center max-w-20 truncate" title={tribe.name}>
                      {tribe.name}
                    </p>
                    <p className="text-xs text-gray-500">({tribe.count})</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Column 3: Family Tree */}
        <div className="bg-white rounded-lg p-8 w-full max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Family Tree</h2>

          <div className="flex flex-col items-center space-y-16">
            {/* Parents */}
            <div className="relative flex flex-col items-center w-full pb-8">
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-40 h-1 bg-yellow-400 z-0" />
              <div className="absolute top-12 left-1/2 -translate-x-1/2 w-1 h-14 bg-yellow-400 z-0" />

              <div className="flex justify-center gap-16 md:gap-24 relative z-10">
                <div className="flex flex-col items-center space-y-2">
                  <FaUser className="text-gray-700" size={50} />
                  <span className="font-semibold text-gray-800 text-center max-w-24 text-sm">{father}</span>
                  <small className="text-xs text-gray-500">(Father)</small>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <FaUser className="text-gray-700" size={50} />
                  <span className="font-semibold text-gray-800 text-center max-w-24 text-sm">{mother}</span>
                  <small className="text-xs text-gray-500">(Mother)</small>
                </div>
              </div>
            </div>

            {/* Middle Level: Siblings + You + Spouse */}
            <div className="relative w-full">
              {/* connecting bar behind */}
              <div className="absolute top-10 left-0 right-0 h-1 bg-yellow-400 z-0" />
              <div className="absolute top-10 left-1/2 -translate-x-1/2 h-16 w-1 bg-yellow-400 z-0" />

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 items-start gap-8 md:gap-16 mt-6">
                {/* Siblings on the left */}
                <div className="flex flex-wrap justify-center md:justify-end gap-6">
                  {parsedSiblings.map((sibling, idx) => (
                    <div key={`sibling-${idx}`} className="flex flex-col items-center space-y-2 min-w-[96px]">
                      <FaUser className="text-gray-700" size={45} />
                      <span className="font-semibold text-gray-800 text-center max-w-24 text-sm">{sibling}</span>
                      <small className="text-xs text-gray-500">(Sibling)</small>
                    </div>
                  ))}
                  {parsedSiblings.length === 0 && (
                    <div className="text-xs text-gray-400 md:text-right">No siblings</div>
                  )}
                </div>

                {/* YOU in the center */}
                <div className="flex flex-col items-center space-y-2">
                  <FaUser className="text-red-500" size={48} />
                  <span className="font-semibold text-red-500 text-center max-w-28 text-sm">{fullName}</span>
                  <small className="text-xs text-red-400">(You)</small>
                </div>

                {/* Spouse on the right */}
                <div className="flex flex-col items-center md:items-start space-y-2">
                  <FaUser className="text-gray-700" size={45} />
                  <span className="font-semibold text-gray-800 text-center md:text-left max-w-28 text-sm">{spouse}</span>
                  <small className="text-xs text-gray-500">(Spouse)</small>
                </div>
              </div>
            </div>

            {/* Children */}
            <div className="relative w-full mt-6">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-4 w-1 bg-yellow-400 z-0" />
              <div className="relative z-10 flex justify-center gap-8 flex-wrap mt-2">
                {parsedChildren.map((child, idx) => (
                  <div key={`child-${idx}`} className="flex flex-col items-center space-y-2 min-w-[88px]">
                    <FaUser className="text-gray-700" size={40} />
                    <span className="font-semibold text-gray-800 text-center max-w-24 text-sm">{child}</span>
                    <small className="text-xs text-gray-500">(Child)</small>
                  </div>
                ))}
                {parsedChildren.length === 0 && (
                  <div className="text-xs text-gray-400">No children</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileViewModal;
