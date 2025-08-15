import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/config';

// Import icons from assets
import totalIcon from '../assets/icons/total.png';
import maleIcon from '../assets/icons/male.png';
import femaleIcon from '../assets/icons/female.png';
import studentIcon from '../assets/icons/student.png';
import unemployedIcon from '../assets/icons/unemployed.png';
import healthIcon from '../assets/icons/health.png';

function CommunityStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { icon: totalIcon, number: '0', label: 'Total Population', link: '/total-population', category: null },
    { icon: maleIcon, number: '0', label: 'Male', link: '/total-male', category: 'male' },
    { icon: femaleIcon, number: '0', label: 'Female', link: '/total-female', category: 'female' },
    { icon: studentIcon, number: '0', label: 'Students', link: '/total-students', category: 'students' },
    { icon: unemployedIcon, number: '0', label: 'Unemployed', link: '/total-unemployed', category: 'unemployed' },
    { icon: healthIcon, number: '0', label: 'Health Condition', link: '/total-health-condition', category: 'health' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, 'indigenousPeople'));
        const querySnapshot = await getDocs(q);
        const ipData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const totalCount = ipData.length;
        const maleCount = ipData.filter(person => person.gender === 'Male').length;
        const femaleCount = ipData.filter(person => person.gender === 'Female').length;
        const studentsCount = ipData.filter(person =>
          person.occupation && person.occupation.toLowerCase().includes('student')
        ).length;
        const unemployedCount = ipData.filter(person =>
          person.occupation && person.occupation.toLowerCase().includes('unemployed')
        ).length;
        const healthConditionCount = ipData.filter(person =>
          person.healthCondition && person.healthCondition.trim() !== ''
        ).length;

        setStats([
          { icon: totalIcon, number: totalCount.toString(), label: 'Total Population', link: '/total-population', category: null },
          { icon: maleIcon, number: maleCount.toString(), label: 'Male', link: '/total-male', category: 'male' },
          { icon: femaleIcon, number: femaleCount.toString(), label: 'Female', link: '/total-female', category: 'female' },
          { icon: studentIcon, number: studentsCount.toString(), label: 'Students', link: '/total-students', category: 'students' },
          { icon: unemployedIcon, number: unemployedCount.toString(), label: 'Unemployed', link: '/total-unemployed', category: 'unemployed' },
          { icon: healthIcon, number: healthConditionCount.toString(), label: 'Health Condition', link: '/total-health-condition', category: 'health' }
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          number={stat.number}
          label={stat.label}
          onClick={() => navigate(`${stat.link}?category=${stat.category || ''}`)}
        />
      ))}
    </div>
  );
}

export default CommunityStats;
