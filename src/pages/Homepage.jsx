import React from 'react';
import Navbar from '../components/Navbar';
import CommunityStats from '../components/CommunityStats';
import RecentActivities from '../components/RecentActivities';
import SearchBar from '../components/SearchBar';
import Brgylist from '../components/Brgylist';
import LocationMap from '../components/LocationMap';

function Homepage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] pt-20 text-[#1f1f1f]">
      <div className="relative z-10">
        <Navbar />

        {/* Main Section */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Side: Stats + Recent Activities */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-wide text-[#1f1f1f]">Community Statistics</h2>
                <div className="rounded-[26px] p-6 shadow-lg bg-[#dc837d]">
                  <CommunityStats />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-wide text-[#1f1f1f]">Recent Activities</h2>
                <div className="rounded-[18px] p-5 shadow-md bg-[#dba09f]">
                  <RecentActivities />
                </div>
              </div>
            </div>

            {/* Right Side: Search + Barangays + Map */}
            <div className="space-y-5">
              <div className="rounded-full border border-[#1f1f1f] bg-white px-4 py-3 shadow-sm">
                <SearchBar />
              </div>
              <div className="rounded-[18px] bg-[#fff] p-4  shadow-md">
                <Brgylist />
              </div>
              <div className="rounded-[18px] overflow-hidden shadow-md border border-[#d6c7bf] bg-white">
                {/* Keep map design as-is */}
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
