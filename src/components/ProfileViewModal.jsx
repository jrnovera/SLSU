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

const InfoSection = ({ title, rows = [] }) => (
  <div className="rounded-lg border border-gray-200 bg-white/70 p-4">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
      {title}
    </h3>
    <dl className="space-y-1 text-sm text-gray-700">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between gap-3">
          <dt className="font-semibold text-gray-600">{label}</dt>
          <dd className="text-right text-gray-900 flex-1">{value ?? 'N/A'}</dd>
        </div>
      ))}
    </dl>
  </div>
);

const ProfileViewModal = ({ isOpen, onClose, person }) => {
  if (!isOpen || !person) return null;

  const {
    firstName,
    lastName,
    middleName,
    dateOfBirth,
    age,
    gender,
    barangay,
    address,
    municipality,
    province,
    occupation,
    healthCondition,
    healthConditionDetails,
    householdMembers,
    civilStatus,
    isStudent,
    educationLevel,
    schoolName,
    isEmployed,
    contactNumber,
    familyTree = {},
    photoURL,
    image, // legacy field fallback
  } = person;

  const fullName = `${firstName || ''} ${middleName || ''} ${lastName || ''}`.replace(/\s+/g, ' ').trim() || 'N/A';
  const avatarSrc = photoURL || image || profileImg; // ✅ choose best available
  const studentStatus =
    isStudent === 'Student' ? 'Student'
    : isStudent === 'Not Student' ? 'Not Student'
    : isStudent || 'N/A';

  const employmentStatus =
    typeof isEmployed === 'boolean'
      ? (isEmployed ? 'Employed' : 'Unemployed')
      : 'N/A';

  const occupationLabel =
    person?.isEmployed === true
      ? (occupation || 'N/A')
      : person?.isEmployed === false
        ? 'Unemployed'
        : (occupation && occupation.trim() &&
          !['n/a', 'na', 'none', '-', 'wala'].includes(occupation.toLowerCase()))
          ? occupation
          : 'Unemployed';

  const healthSummary =
    healthCondition === 'Not Healthy'
      ? 'With medical condition'
      : healthCondition === 'Healthy'
        ? 'No known medical condition'
        : (healthCondition || 'N/A');

  const father = familyTree.father || person.father || 'N/A';
  const mother = familyTree.mother || person.mother || 'N/A';
  const spouse = familyTree.spouse || person.spouse || 'N/A';
  const siblings = toArray(familyTree.siblings || person.siblings);
  const children = toArray(familyTree.children || person.children);
  const contactLabel = contactNumber || 'N/A';
  const addressLabel = address || 'N/A';

  // Family Tree variables - COMMENTED OUT FOR NOW
  // const father = familyTree.father || person.father || 'N/A';
  // const mother = familyTree.mother || person.mother || 'N/A';
  // const spouse = familyTree.spouse || person.spouse || 'N/A';
  // const parsedSiblings = toArray(familyTree.siblings || person.siblings);
  // const parsedChildren = toArray(familyTree.children || person.children);

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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Detailed Profile */}
        <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2 space-y-4">
          <div className="flex flex-col items-center text-center space-y-3">
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
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">Full Name</p>
              <h2 className="text-2xl font-semibold text-gray-900">{fullName}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <InfoSection
              title="Personal Details"
              rows={[
                { label: 'Date of Birth', value: formatDOB(dateOfBirth) },
                { label: 'Age', value: age ?? 'N/A' },
                { label: 'Gender', value: gender || 'N/A' },
                { label: 'Civil Status', value: civilStatus || 'N/A' },
              ]}
            />

            <InfoSection
              title="Address & Contact"
              rows={[
                { label: 'Barangay', value: barangay || 'N/A' },
                { label: 'Street / Sitio', value: addressLabel },
                { label: 'Municipality', value: municipality || 'N/A' },
                { label: 'Province', value: province || 'N/A' },
                { label: 'Contact No.', value: contactLabel },
              ]}
            />

            <InfoSection
              title="Education & Work"
              rows={[
                { label: 'Student Status', value: studentStatus },
                { label: 'Education Level', value: educationLevel || 'N/A' },
                { label: 'School Name', value: schoolName || 'N/A' },
                { label: 'Employment Status', value: employmentStatus },
                { label: 'Occupation', value: occupationLabel },
              ]}
            />

            <InfoSection
              title="Health & Household"
              rows={[
                { label: 'Health Condition', value: healthSummary },
                {
                  label: 'Health Details',
                  value:
                    healthCondition === 'Not Healthy'
                      ? (healthConditionDetails || 'Not provided')
                      : (healthConditionDetails || 'N/A'),
                },
                { label: 'Household Members', value: householdMembers || 'N/A' },
              ]}
            />
          </div>
        </div>

        {/* Tribe card */}
        <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-center text-gray-800 border-b border-gray-200 pb-3 w-full">
            Tribe
          </h2>

          <div className="flex flex-col items-center justify-center mt-8 space-y-4">
            <div className="w-32 h-32">
              <CircularProgressbar
                value={100}
                text="100%"
                styles={{
                  path: { stroke: '#f59e0b' },
                  trail: { stroke: '#e5e7eb' },
                  text: { fill: '#1f2937', fontSize: '16px', fontWeight: 600 },
                }}
              />
            </div>
            <p className="text-lg font-semibold text-gray-800 text-center">
              {person?.lineage || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Family details */}
        {/* <div className="bg-gray-50 rounded-lg p-6 space-y-4 lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-800">Family Members</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <p><span className="font-semibold text-gray-600">Father:</span> {father || 'N/A'}</p>
            <p><span className="font-semibold text-gray-600">Mother:</span> {mother || 'N/A'}</p>
            <p><span className="font-semibold text-gray-600">Spouse:</span> {spouse || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Siblings</h3>
            {siblings.length ? (
              <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                {siblings.map((s, idx) => (
                  <li key={`sibling-${idx}`}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No siblings recorded.</p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Children</h3>
            {children.length ? (
              <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
                {children.map((c, idx) => (
                  <li key={`child-${idx}`}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No children recorded.</p>
            )}
          </div>
        </div> */}
      </div>
    </Modal>
  );
};

export default ProfileViewModal;
