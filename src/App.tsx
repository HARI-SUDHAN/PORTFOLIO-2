import { useState, useCallback } from 'react';
import AmbientCanvas from './components/AmbientCanvas';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsPanel from './components/StatsPanel';
import ProjectsSection from './components/ProjectsSection';
import AboutSection from './components/AboutSection';
import SkillsSection from './components/SkillsSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ProjectModal from './components/ProjectModal';
import { PROJECTS, type ProjectItem } from './data/portfolioData';

export default function App() {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const handleSelectProject = useCallback((project: ProjectItem) => {
    setSelectedProject(project);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProject(null);
  }, []);

  const handleNavigateModal = useCallback(
    (direction: -1 | 1) => {
      if (!selectedProject) return;
      const idx = PROJECTS.findIndex((p) => p.id === selectedProject.id);
      if (idx === -1) return;
      const nextIdx = (idx + direction + PROJECTS.length) % PROJECTS.length;
      setSelectedProject(PROJECTS[nextIdx]);
    },
    [selectedProject]
  );

  const handleInquireFromModal = useCallback(() => {
    setSelectedProject(null);
    const contactEl = document.getElementById('contact');
    contactEl?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="relative isolate min-h-screen bg-[#07070a] text-gray-100 flex flex-col selection:bg-[#d81e2f] selection:text-white">
      <AmbientCanvas />
      <Navbar />

      <main className="relative z-10 w-full flex-1">
        <Hero />
        <StatsPanel />
        <ProjectsSection onSelectProject={handleSelectProject} />
        <AboutSection />
        <SkillsSection />
        <ContactSection />
      </main>

      <Footer />

      <ProjectModal
        project={selectedProject}
        onClose={handleCloseModal}
        onNavigate={handleNavigateModal}
        onInquire={handleInquireFromModal}
      />
    </div>
  );
}
