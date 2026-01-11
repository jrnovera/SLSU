import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { FaUser } from 'react-icons/fa';
import { CircularProgressbar } from 'react-circular-progressbar';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
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
  const lineageLabel = person?.lineage || 'N/A';
  const [lineagePercent, setLineagePercent] = useState(0);
  const [lineageCount, setLineageCount] = useState(0);
  const [lineageTotal, setLineageTotal] = useState(0);
  const [lineageLoading, setLineageLoading] = useState(false);
  const [lineageError, setLineageError] = useState('');
  const [topLineages, setTopLineages] = useState([]);
  const primaryPct = topLineages[0]?.pct ? Number(topLineages[0].pct) : (Number.isFinite(lineagePercent) ? lineagePercent : 0);

  useEffect(() => {
    let cancelled = false;
    const loadLineageStats = async () => {
      if (!lineageLabel || lineageLabel === 'N/A') {
        setLineagePercent(0);
        setLineageCount(0);
        setLineageTotal(0);
        return;
      }
      setLineageLoading(true);
      setLineageError('');
      try {
        const snap = await getDocs(collection(db, 'indigenousPeople'));
        let total = 0;
        let match = 0;
        const counts = {};
        snap.forEach((doc) => {
          const data = doc.data() || {};
          const lin = (data.lineage || '').toString().trim();
          if (!lin) return;
          total += 1;
          counts[lin] = (counts[lin] || 0) + 1;
          if (lin.toLowerCase() === lineageLabel.toLowerCase()) match += 1;
        });
        if (!cancelled) {
          setLineageTotal(total);
          setLineageCount(match);
          const pct = total ? ((match / total) * 100).toFixed(1) : 0;
          setLineagePercent(Number(pct));
          const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({
              name,
              count,
              pct: total ? ((count / total) * 100).toFixed(1) : '0.0',
            }));
          setTopLineages(sorted);
        }
      } catch (e) {
        if (!cancelled) setLineageError('Failed to load tribe stats');
        console.error('Failed to load tribe stats', e);
      } finally {
        if (!cancelled) setLineageLoading(false);
      }
    };
    loadLineageStats();
    return () => { cancelled = true; };
  }, [lineageLabel]);

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
      className="w-[95%] max-w-6xl bg-gradient-to-b from-[#b65959] to-[#b27a7a] rounded-2xl shadow-2xl p-6 outline-none max-h-[90vh] overflow-y-auto relative border-4 border-[#993232]"
      overlayClassName="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
    >
      <div className="flex items-center justify-between bg-[#993232] text-white rounded-xl px-5 py-3 mb-5 shadow-md">
        <h1 className="text-2xl font-semibold tracking-wide">INDIVIDUAL DETAILS</h1>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/40 transition"
        >
          Go Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[#1a0e0e]">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/80 rounded-xl shadow-md border border-[#b16a6a] p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-[#b16a6a] bg-white flex items-center justify-center">
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
                  <FaUser className="text-[#b16a6a]" size={32} />
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-[#5e3232]">Full Name</p>
                <h2 className="text-2xl font-semibold text-[#1a0e0e]">{fullName}</h2>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <InfoSection
                title="Personal Information"
                rows={[
                  { label: 'Age', value: age ?? 'N/A' },
                  { label: 'Gender', value: gender || 'N/A' },
                  { label: 'Date of Birth', value: formatDOB(dateOfBirth) },
                  { label: 'Civil Status', value: civilStatus || 'N/A' },
                  { label: 'Nationality', value: person?.nationality || 'N/A' },
                  { label: 'Religion', value: person?.religion || 'N/A' },
                ]}
              />

              <InfoSection
                title="Cultural & Household"
                rows={[
                  { label: 'Household Members', value: householdMembers || 'N/A' },
                  { label: "Father's Full Name", value: father },
                  { label: "Mother's Full Name", value: mother },
                ]}
              />

              <InfoSection
                title="Address and Contact Information"
                rows={[
                  { label: 'Complete Address', value: addressLabel },
                  { label: 'Barangay', value: barangay || 'N/A' },
                  { label: 'Municipality/City', value: municipality || 'N/A' },
                  { label: 'Province', value: province || 'N/A' },
                  { label: 'Zip Code', value: person?.zipCode || 'N/A' },
                  { label: 'Contact Number', value: contactLabel },
                ]}
              />

              <InfoSection
                title="Education and Occupation"
                rows={[
                  { label: 'Highest Educational Attainment', value: educationLevel || 'N/A' },
                  { label: 'School (if Student)', value: schoolName || 'N/A' },
                  { label: 'Employment Status', value: employmentStatus },
                  { label: 'Occupation', value: occupationLabel },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="bg-white/85 rounded-xl shadow-md border border-[#b16a6a] p-5 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-[#b16a6a] p-4">
            <h3 className="text-center text-lg font-semibold text-[#b6222e] mb-3">Tribe</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32">
                <CircularProgressbar
                  value={primaryPct}
                  text={`${primaryPct}%`}
                  styles={{
                    path: { stroke: '#b6222e', strokeLinecap: 'round' },
                    trail: { stroke: '#f5d2d0' },
                    text: { fill: '#b6222e', fontSize: '18px', fontWeight: 700 },
                  }}
                />
              </div>
              <div className="text-center text-sm text-[#5e3232]">
                {lineageLoading
                  ? 'Calculating tribe share…'
                  : lineageError
                    ? lineageError
                    : lineageTotal
                      ? `${lineageCount} of ${lineageTotal} records`
                      : 'No tribe data'}
              </div>
              <div className="space-y-2 text-center w-full">
                <div className="px-3 py-1 bg-[#b6222e] text-white rounded-full text-sm font-semibold shadow-sm">
                  {topLineages[0]?.pct || primaryPct}% {topLineages[0]?.name || lineageLabel || 'Unknown'}
                </div>
                {topLineages[1] && (
                  <div className="px-3 py-1 bg-[#f5d547] text-[#7a3b00] rounded-full text-sm font-semibold shadow-sm">
                    {topLineages[1].pct}% {topLineages[1].name}
                  </div>
                )}
                {topLineages[2] && (
                  <div className="px-3 py-1 bg-[#ffe89c] text-[#7a3b00] rounded-full text-sm font-semibold shadow-sm">
                    {topLineages[2].pct}% {topLineages[2].name}
                  </div>
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
