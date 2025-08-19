import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/config';

// Icons
import totalIcon from '../assets/icons/total.png';
import maleIcon from '../assets/icons/male.png';
import femaleIcon from '../assets/icons/female.png';
import studentIcon from '../assets/icons/student.png';
import unemployedIcon from '../assets/icons/unemployed.png';
import healthIcon from '../assets/icons/health.png';

// Modals
import HealthCategoryModal from './HealthCategoryModal';
import StudentCategoryModal from './StudentCategoryModal';

function CommunityStats() {
  const navigate = useNavigate();

  const [stats, setStats] = useState([
    { icon: totalIcon, number: '0', label: 'Total Population', link: '/total-population', category: null },
    { icon: maleIcon, number: '0', label: 'Male', link: '/total-male', category: 'male' },
    { icon: femaleIcon, number: '0', label: 'Female', link: '/total-female', category: 'female' },
    { icon: studentIcon, number: '0', label: 'Students', link: '/total-students', category: 'students' },
    { icon: unemployedIcon, number: '0', label: 'Unemployed', link: '/total-unemployed', category: 'unemployed' },
    { icon: healthIcon, number: '0', label: 'Health Condition', link: '/total-health-condition', category: 'health' },
  ]);

  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthCounts, setHealthCounts] = useState({ withHealth: 0, noHealth: 0 });

  // NEW: Students modal state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentCounts, setStudentCounts] = useState({
    students: 0,
    notAttending25Below: 0,
  });

  // Health classifier
  const classifyHealth = (val) => {
    const s = String(val ?? '').trim().toLowerCase();
    if (!s || s === 'none' || s === 'healthy' || s === 'no health' || s === 'no health condition' || s === 'n/a') {
      return 'no_health';
    }
    return 'with_health';
  };

  // Unemployed = walang occupation (blank/markers)
  const isEmptyOccupation = (val) => {
    const s = String(val ?? '').trim().toLowerCase();
    if (!s) return true;
    return ['none', 'n/a', 'na', '-', 'wala'].includes(s);
  };

  // Student detector (with useful synonyms/variants)
  const isStudentOccupation = (val) => {
    if (!val) return false;
    const s = String(val).toLowerCase();
    const keys = [
      'student', 'estudyante', 'pupil', 'learner',
      'senior high', 'junior high', 'shs', 'jhs',
      'elementary student', 'college student', 'university student'
    ];
    return keys.some(k => s.includes(k));
  };

  // Age resolver: prefer numeric age, else derive from birthDate (ISO or parseable)
  const getAge = (p) => {
    if (typeof p?.age === 'number') return p.age;
    if (p?.age && !isNaN(Number(p.age))) return Number(p.age);
    if (p?.birthDate) {
      const d = new Date(p.birthDate);
      if (!isNaN(d)) {
        const today = new Date();
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
        return age;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'indigenousPeople'));
        const snap = await getDocs(q);
        const ipData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const totalCount = ipData.length;
        const maleCount = ipData.filter((p) => p.gender === 'Male').length;
        const femaleCount = ipData.filter((p) => p.gender === 'Female').length;

        // Students = occupation matches student keywords
        const studentsCount = ipData.filter((p) => isStudentOccupation(p.occupation)).length;

        // Not attending school (≤25) = age <= 25 AND NOT student
        const notAttending25Below = ipData.reduce((acc, p) => {
          const age = getAge(p);
          if (age !== null && age <= 25 && !isStudentOccupation(p.occupation)) return acc + 1;
          return acc;
        }, 0);

        // Unemployed = walang occupation (empty markers)
        const unemployedCount = ipData.filter((p) => isEmptyOccupation(p.occupation)).length;

        // Health buckets
        let withHealth = 0;
        let noHealth = 0;
        for (const p of ipData) {
          const bucket = classifyHealth(p.healthCondition);
          if (bucket === 'with_health') withHealth++;
          else noHealth++;
        }
        const healthTotal = withHealth + noHealth;

        setStats([
          { icon: totalIcon, number: String(totalCount), label: 'Total Population', link: '/total-population', category: null },
          { icon: maleIcon, number: String(maleCount), label: 'Male', link: '/total-male', category: 'male' },
          { icon: femaleIcon, number: String(femaleCount), label: 'Female', link: '/total-female', category: 'female' },
          { icon: studentIcon, number: String(studentsCount), label: 'Students', link: '/total-students', category: 'students' },
          { icon: unemployedIcon, number: String(unemployedCount), label: 'Unemployed', link: '/total-unemployed', category: 'unemployed' },
          { icon: healthIcon, number: String(healthTotal), label: 'Health Condition', link: '/total-health-condition', category: 'health' },
        ]);

        setStudentCounts({ students: studentsCount, notAttending25Below });
        setHealthCounts({ withHealth, noHealth });
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (stat) => {
    if (stat.category === 'health') {
      setHealthModalOpen(true);
      return;
    }
    if (stat.category === 'students') {
      setStudentModalOpen(true);
      return;
    }
    navigate(`${stat.link}?category=${stat.category || ''}`);
  };

  const handleSelectHealthCategory = (value) => {
    setHealthModalOpen(false);
    navigate(`/total-health-condition?category=${value}`); // 'with_health' | 'no_health'
  };

  const handleSelectStudentCategory = (value) => {
    setStudentModalOpen(false);
    // 'students' | 'not_attending_25_below'
    navigate(`/total-students?category=${value}`);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            number={stat.number}
            label={stat.label}
            onClick={() => handleCardClick(stat)}
          />
        ))}
      </div>

      {/* Health modal */}
      <HealthCategoryModal
        open={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        counts={healthCounts}
        onSelect={handleSelectHealthCategory}
      />

      {/* Students modal (like your screenshot) */}
      <StudentCategoryModal
        open={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        counts={studentCounts} 
        onSelect={handleSelectStudentCategory}
      />
    </>
  );
}

export default CommunityStats;
