import React from 'react';
import WhoWeAre from './WhoWeAre';
import OurMission from './OurMission';
import JoinUs from './JoinUs';
import WhatWeDo from './WhatWeDo';
import WhatMatters from './WhatMatters';
import OurCoreValues from './OurCoreValues';
import OurTeam from './OurTeam';

function AboutContent({ activePage }) {
  const renderContent = () => {
    switch (activePage) {
      case 'who-we-are':
        return <WhoWeAre />;
      case 'mission':
        return <OurMission />;
      case 'what-we-do':
        return <WhatWeDo />;
      case 'why-it-matters':
        return <WhatMatters />;
      case 'values':
        return <OurCoreValues />;
      case 'team':
        return <OurTeam />;
      case 'join-us':
        return <JoinUs />;
      default:
        return <WhoWeAre />;
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center px-4 py-5 lg:py-20">
      <div className="rounded-[30px] px-8 md:px-12 py-10 max-w-4xl w-full">
        {/* Stylized Header */}
        <div className="relative text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#123645] inline-block border-b-4 border-[#219EBC] px-6 pb-2 rounded-md">
            {activePage === 'who-we-are'
              ? 'Who We Are'
              : activePage === 'mission'
              ? 'Our Mission'
              : activePage === 'what-we-do'
              ? 'What We Do'
              : activePage === 'why-it-matters'
              ? 'Why It Matters'
              : activePage === 'values'
              ? 'Our Values'
              : activePage === 'team'
              ? 'Our Team'
              : activePage === 'join-us'
              ? 'Join Us'
              : 'Who We Are'}
          </h2>
        </div>

        {/* Page Content */}
        <div className="text-center text-[#333] text-lg md:text-xl leading-relaxed font-medium">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AboutContent;
