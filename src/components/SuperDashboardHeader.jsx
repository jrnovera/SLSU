import searchIcon from '../assets/icons/search.png'
import { allBarangays } from './Brgylist';

function DashboardHeader({
  selectedBarangay,
  allBarangays,
  searchTerm,
  onSearchChange,
  onBarangayChange,
  onAddClick,
  onClearBarangay
}) {
  return (
    <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-md shadow mb-6">
      <h1 className="text-xl lg:text-2xl font-extrabold text-black mb-4 lg:mb-0">
        {selectedBarangay ? `Barangay ${selectedBarangay.name}` : 'All Barangays'}
      </h1>

      <div className="flex items-center gap-4 w-full lg:w-auto">
        <select
          value={selectedBarangay ? selectedBarangay.name : ""}
          onChange={onBarangayChange}
          className="px-4 py-2 border border-black text-sm rounded-sm focus:outline-none w-[220px]"
        >
          <option value="">All Barangays</option>
          {allBarangays.map(brgy => (
            <option key={brgy.id} value={brgy.name}>{brgy.name}</option>
          ))}
        </select>

        {selectedBarangay && (
          <button
            onClick={onClearBarangay}
            className="text-xs text-red-600 hover:underline"
          >
            Clear Filter
          </button>
        )}

        <button
          onClick={onAddClick}
          className="bg-[#40A2E3] text-white font-bold text-sm px-6 py-2 rounded-sm hover:bg-[#3497da] transition"
        >
          Add IP
        </button>

        <div className="relative w-full lg:w-[260px]">
          <input
            type="text"
            placeholder="Search Here..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-full bg-[#F9F9F9] text-sm focus:outline-none border border-gray-200"
          />
          <img
            src={searchIcon}
            alt="Search"
            className="absolute top-2.5 right-4 w-4 h-4"
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardHeader;
