import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SpotlightHero } from './components/SpotlightHero';
import { AboutSection } from './components/AboutSection';
import { ServicesSection } from './components/ServicesSection';
import { InstagramStatsSection } from './components/InstagramStatsSection';
import { SkillsSection } from './components/SkillsSection';
import { PricingSection } from './components/PricingSection';
import { PrinciplesSection } from './components/PrinciplesSection';
import { MarketingCollabSection } from './components/MarketingCollabSection';
import { ContactSection } from './components/ContactSection';
import { SubmissionsInboxModal } from './components/SubmissionsInboxModal';
import { ServiceOrderModal } from './components/ServiceOrderModal';
import { Footer } from './components/Footer';
import { profileData } from './data/portfolioData';
import { getSubmissions, fetchSubmissionsFromServer } from './utils/submissionsStorage';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  // Sync submissions count
  useEffect(() => {
    const updateCount = () => {
      const subs = getSubmissions();
      setSubmissionsCount(subs.filter(s => s.status === 'new').length);
    };
    updateCount();
    fetchSubmissionsFromServer();
    window.addEventListener('submissions_updated', updateCount);
    return () => window.removeEventListener('submissions_updated', updateCount);
  }, []);

  const handleExploreCollab = () => {
    const el = document.getElementById('collaboration');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenServiceOrder = (serviceName: string) => {
    setSelectedService(serviceName);
    setOrderModalOpen(true);
  };

  const handleOpenContactModal = () => {
    setSelectedService('');
    setOrderModalOpen(true);
  };

  // Scroll spy active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'services', 'works', 'skills', 'pricing', 'principles', 'collaboration', 'contact'];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors selection:bg-pink-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeSection={activeSection}
        onOpenInbox={() => setIsInboxOpen(true)}
        onOpenContactModal={handleOpenContactModal}
        submissionsCount={submissionsCount}
      />

      <main>
        {/* 1. Hero Section */}
        <SpotlightHero
          profile={profileData}
          onExploreProjects={handleExploreCollab}
        />

        {/* 2. "Миний тухай" (About Section) */}
        <AboutSection />

        {/* 3. "Services" (Үйлчилгээнүүд) */}
        <ServicesSection onSelectService={handleOpenServiceOrder} />

        {/* 4. "Миний бүтээлүүд" & Инстаграм аккаунтын үзэлт, хандалтын тоо */}
        <InstagramStatsSection />

        {/* 5. "Миний эзэмшсэн ур чадварууд" */}
        <SkillsSection />

        {/* 6. "Хамтын ажиллагааны нөхцөл & Үнийн санал" */}
        <PricingSection />

        {/* 7. "Анхаарах зүйлс & Миний зарчим" */}
        <PrinciplesSection />

        {/* 8. Хамтын ажиллагааны маягт (Marketing Collaboration Form) */}
        <MarketingCollabSection />

        {/* 9. Холбоо барих хэсэг (Contact Section) */}
        <ContactSection />
      </main>

      {/* 10. Footer */}
      <Footer />

      {/* 11. Service Order / Contact Modal */}
      <ServiceOrderModal
        isOpen={orderModalOpen}
        initialService={selectedService}
        onClose={() => setOrderModalOpen(false)}
      />

      {/* 12. Submissions Inbox Modal */}
      <SubmissionsInboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
      />
    </div>
  );
}
