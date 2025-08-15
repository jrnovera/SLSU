import React from 'react';

function StatCard({ icon, number, label, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-[#4c93c7] text-white rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#3b7ea4] transition duration-200 shadow-md"
    >
      <img src={icon} alt={label} className="w-8 h-8 mb-2" />
      <div className="text-2xl font-bold">{number}</div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
}

export default StatCard;
