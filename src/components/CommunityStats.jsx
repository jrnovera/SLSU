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
import seniorIcon from '../assets/icons/senior.png';
import pwdIcon from '../assets/icons/pwd.png';

// Modals
import HealthCategoryModal from './HealthCategoryModal';
import StudentCategoryModal from './StudentCategoryModal';

function CommunityStats() {
  const navigate = useNavigate();

  const [stats, setStats] = useState([
    { icon: totalIcon, number: '0', label: 'MASTERLIST', link: '/total-population', category: null, className: 'row-span-2 h-full col-start-1' },
    { icon: maleIcon, number: '0', label: 'MALE', link: '/total-male', category: 'male', className: 'col-start-2 row-start-1' },
    { icon: femaleIcon, number: '0', label: 'FEMALE', link: '/total-female', category: 'female', className: 'col-start-3 row-start-1' },
    { icon: seniorIcon, number: '0', label: 'SENIOR CITIZEN', link: '/total-seniors', category: 'seniors', className: 'col-start-4 row-start-1' },
    { icon: studentIcon, number: '0', label: 'STUDENT', link: '/total-students', category: 'students', className: 'col-start-2 row-start-2' },
    { icon: unemployedIcon, number: '0', label: 'UNEMPLOYED', link: '/total-unemployed', category: 'unemployed', className: 'col-start-3 row-start-2' },
    { icon: pwdIcon, number: '0', label: 'PWD STATUS', link: '/total-pwd', category: 'pwd', className: 'col-start-4 row-start-2' },
  ]);

  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthCounts, setHealthCounts] = useState({ pwd: 0, notPwd: 0 });

  // NEW: Students modal state
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentCounts, setStudentCounts] = useState({
    students: 0,
    notAttending25Below: 0,
  });

  // PWD checker
  const isPWD = (person) => {
    if (person?.isPWD === true || person?.pwd === true) return true;
    const disability = String(person?.disability ?? '').trim().toLowerCase();
    if (disability && disability !== 'none' && disability !== 'n/a' && disability !== 'na') return true;
    const health = String(person?.healthCondition ?? '').toLowerCase();
    if (health.includes('pwd')) return true;
    return false;
  };

  // Unemployed checker
  const isUnemployed = (person) => {
    // Check new isEmployed field first
    if (person && person.isEmployed !== undefined && person.isEmployed !== null && person.isEmployed !== "") {
      return person.isEmployed === false;
    }

    // Fallback to legacy occupation-based check
    const val = person?.occupation;
    const s = String(val ?? '').trim().toLowerCase();
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

        // Students = based on isStudent field (or occupation for legacy)
        const studentsCount = ipData.filter((p) => isStudentOccupation(p.occupation, p)).length;

        // Not attending school (≤25) = age <= 25 AND isStudent === "Not Student"
        const notAttending25Below = ipData.reduce((acc, p) => {
          const age = getAge(p);
          if (age !== null && age <= 25 && p.isStudent === "Not Student") return acc + 1;
          return acc;
        }, 0);

        // Unemployed = based on isEmployed field or occupation for legacy
        const unemployedCount = ipData.filter((p) => isUnemployed(p)).length;

        // Seniors = age >= 60
        const seniorCount = ipData.filter((p) => {
          const age = getAge(p);
          return age !== null && age >= 60;
        }).length;

        // PWD detection
        const pwdCount = ipData.filter((p) => isPWD(p)).length;

        const notPwdCount = ipData.filter((p) => !isPWD(p)).length;

        setStats([
          { icon: totalIcon, number: String(totalCount), label: 'MASTERLIST', link: '/total-population', category: null, className: 'row-span-2 h-full col-start-1' },
          { icon: maleIcon, number: String(maleCount), label: 'MALE', link: '/total-male', category: 'male', className: 'col-start-2 row-start-1' },
          { icon: femaleIcon, number: String(femaleCount), label: 'FEMALE', link: '/total-female', category: 'female', className: 'col-start-3 row-start-1' },
          { icon: seniorIcon, number: String(seniorCount), label: 'SENIOR CITIZEN', link: '/total-seniors', category: 'seniors', className: 'col-start-4 row-start-1' },
          { icon: studentIcon, number: String(studentsCount), label: 'STUDENT', link: '/total-students', category: 'students', className: 'col-start-2 row-start-2' },
          { icon: unemployedIcon, number: String(unemployedCount), label: 'UNEMPLOYED', link: '/total-unemployed', category: 'unemployed', className: 'col-start-3 row-start-2' },
          { icon: pwdIcon, number: String(pwdCount), label: 'PWD STATUS', link: '/total-pwd', category: 'health', className: 'col-start-4 row-start-2' },
        ]);

        setStudentCounts({ students: studentsCount, notAttending25Below });
        setHealthCounts({ pwd: pwdCount, notPwd: notPwdCount });
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (stat) => {
    if (stat.category === 'students') {
      setStudentModalOpen(true);
      return;
    }
    navigate(`${stat.link}?category=${stat.category || ''}`);
  };

  const handleSelectHealthCategory = (value) => {
    setHealthModalOpen(false);
    if (value === 'pwd') {
      navigate('/total-pwd?category=pwd');
    } else if (value === 'not_pwd') {
      navigate('/total-population?category=not_pwd');
    }
  };

  const handleSelectStudentCategory = (value) => {
    setStudentModalOpen(false);
    // 'students' | 'not_attending_25_below'
    navigate(`/total-students?category=${value}`);
  };

  return (
    <>
      <div className="bg-transparent rounded-[20px] p-4">
        <div className="grid grid-cols-4 grid-rows-2 gap-3">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              number={stat.number}
              label={stat.label}
              onClick={() => handleCardClick(stat)}
              className={stat.className || ''}
            />
          ))}
        </div>
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
