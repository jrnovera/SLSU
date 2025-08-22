import React from 'react';
import Modal from 'react-modal';
import { FaUser } from 'react-icons/fa';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
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

        {/* Column 2: Statistics (placeholder) */}
        <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center shadow-sm">
          <h2 className="text-lg font-semibold text-center text-gray-800 border-b border-gray-200 pb-3 w-full">
            Statistics
          </h2>

          <div className="flex flex-wrap justify-center gap-8 mt-6">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24">
                <CircularProgressbar
                  value={70}
                  text="70%"
                  styles={{
                    path: { stroke: '#f59e0b' },
                    trail: { stroke: '#e5e7eb' },
                    text: { fill: '#1f2937', fontSize: '16px', fontWeight: 600 },
                  }}
                />
              </div>
              <p className="text-sm font-medium text-gray-600">Aeta</p>
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-24 h-24">
                <CircularProgressbar
                  value={30}
                  text="30%"
                  styles={{
                    path: { stroke: '#3b82f6' },
                    trail: { stroke: '#e5e7eb' },
                    text: { fill: '#1f2937', fontSize: '16px', fontWeight: 600 },
                  }}
                />
              </div>
              <p className="text-sm font-medium text-gray-600">Cebuano</p>
            </div>
          </div>
        </div>

        {/* Column 3: Family Tree */}
        <div className="bg-white rounded-lg p-8 w-full max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Family Tree</h2>

          <div className="flex flex-col items-center space-y-16">
            {/* Parents */}
            <div className="relative flex flex-col items-center w-full">
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-32 h-1 bg-yellow-400 z-0" />
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-1 h-12 bg-yellow-400 z-0" />

              <div className="flex justify-center gap-24 relative z-10">
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
            <div className="relative w-full flex flex-col items-center">
              <div className="relative w-full max-w-4xl h-16 flex items-center justify-center">
                <div className="absolute top-8 left-0 right-0 h-1 bg-yellow-400 z-0" />
                <div className="absolute top-8 left-1/2 -translate-x-1/2 h-12 w-1 bg-yellow-400 z-0" />

                <div className="flex justify-center gap-12 z-10 relative flex-wrap">
                  {parsedSiblings.map((sibling, idx) => (
                    <div key={`sibling-${idx}`} className="flex flex-col items-center space-y-2">
                      <FaUser className="text-gray-700" size={45} />
                      <span className="font-semibold text-gray-800 text-center max-w-24 text-sm">{sibling}</span>
                      <small className="text-xs text-gray-500">(Sibling)</small>
                    </div>
                  ))}
                  {/* YOU */}
                  <div className="flex flex-col items-center space-y-2">
                    <FaUser className="text-red-500" size={45} />
                    <span className="font-semibold text-red-500 text-center max-w-24 text-sm">{fullName}</span>
                    <small className="text-xs text-red-400">(You)</small>
                  </div>
                  {/* SPOUSE */}
                  <div className="flex flex-col items-center space-y-2">
                    <FaUser className="text-gray-700" size={45} />
                    <span className="font-semibold text-gray-800 text-center max-w-24 text-sm">{spouse}</span>
                    <small className="text-xs text-gray-500">(Spouse)</small>
                  </div>
                </div>
              </div>

              {/* Children Section */}
              {parsedChildren.length > 0 && (
                <div className="relative w-full mt-16 flex flex-col items-center">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-12 bg-yellow-400 z-0" />
                  {parsedChildren.length > 1 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-64 h-1 bg-yellow-400 z-0" />
                  )}

                  <div className="flex justify-center gap-12 flex-wrap relative z-10 mt-12">
                    {parsedChildren.map((child, idx) => (
                      <div key={`child-${idx}`} className="flex flex-col items-center space-y-2">
                        <FaUser className="text-gray-700" size={40} />
                        <span className="font-semibold text-gray-800 text-center max-w-24 text-sm">{child}</span>
                        <small className="text-xs text-gray-500">(Child)</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
};

export default ProfileViewModal;
