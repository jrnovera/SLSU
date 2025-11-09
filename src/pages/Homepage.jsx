import React from 'react';
import Navbar from '../components/Navbar';
import CommunityStats from '../components/CommunityStats';
import RecentActivities from '../components/RecentActivities';
import SearchBar from '../components/SearchBar';
import Brgylist from '../components/Brgylist';
import LocationMap from '../components/LocationMap';

function Homepage() {
  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="relative z-10">
      <Navbar />

      {/* Main Section */}
      <div className="max-w-7xl mx-auto px-2 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Stats + Recent Activities */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#5a78aa]">Community Statistics</h2>
            <div className="bg-[#f0eee2] rounded-3xl p-6 shadow-md">
              <CommunityStats />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#5a78aa] mb-2">Recent Activities</h2>
              <div className="bg-[#f0eee2] rounded-3xl p-4 shadow-md">
                <RecentActivities />
              </div>
            </div>
          </div>

          {/* Right Side: Search + Barangays + Map */}
          <div className="space-y-4">
            <SearchBar />
            <Brgylist />
            <div className="bg-white rounded-3xl overflow-hidden shadow-md">
              <LocationMap />
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Homepage;
