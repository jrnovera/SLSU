import React from 'react';

function StatCard({ icon, iconElement, number, label, onClick, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#b52234] text-[#f5f0e8] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#8b4040] transition duration-200 shadow-md border border-[#4a2020] h-full min-h-[150px] ${className}`}
    >
      {iconElement ? (
        <div className="w-14 h-14 mb-2 flex items-center justify-center text-white text-3xl">
          {iconElement}
        </div>
      ) : (
        <img
          src={icon}
          alt={label}
          className="w-14 h-14 mb-2"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      )}
      <div className="text-xl font-bold text-white">{number}</div>
      <div className="text-xs mt-1 text-white/90 uppercase font-semibold">{label}</div>
    </div>
  );
}

export default StatCard;
