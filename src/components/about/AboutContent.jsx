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
    <div className="about-content-container relative flex flex-col items-center justify-center px-4 py-5 lg:py-20">
      <div className="about-content px-6 md:px-10 py-8 max-w-4xl w-full text-center">
        {/* Stylized Header */}
        <div className="relative text-center bg-[#dc837d] rounded-2xl mb-8">
          <h2 className="about-content-title inline-block px-4 py-3 text-2xl md:text-3xl font-black uppercase tracking-wide">
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
        <div className="about-content-text text-center text-[#1f1f1f] text-lg md:text-xl leading-relaxed font-medium">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AboutContent;
