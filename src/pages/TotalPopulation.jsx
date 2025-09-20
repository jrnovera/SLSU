import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TotalListIOfPopulation from '../components/TotalListIOfPopulation';
import { useLocation, useParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

function TotalPopulation() {
  const { category } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('category') || category;

  const [populationData, setPopulationData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, 'indigenousPeople'));

        const data = snap.docs.map((doc) => {
          const d = doc.data();

          // Normalize dateOfBirth (supports Firestore Timestamp)
          let dob = d.dateOfBirth ?? d.birthdate ?? null;
          if (dob && typeof dob === 'object' && dob.seconds) {
            const dt = new Date(dob.seconds * 1000);
            dob = dt.toISOString().slice(0, 10);
          }

          return {
            id: doc.id,
            ...d,
            firstName: d.firstName ?? '',
            lastName: d.lastName ?? '',
            gender: d.gender ?? 'N/A',
            barangay: d.barangay ?? 'N/A',
            occupation: d.occupation ?? 'N/A',
            healthCondition: d.healthCondition ?? 'N/A',
            age: d.age ?? 'N/A',
            dateOfBirth: dob ?? 'N/A',
            familyTree: d.familyTree || {},
          };
        });

        if (!cancelled) setPopulationData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (!cancelled) setPopulationData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Navbar />
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading…</div>
      ) : (
        <TotalListIOfPopulation
          populationData={populationData}
          category={categoryParam}
        />
      )}
    </>
  );
}

export default TotalPopulation;
