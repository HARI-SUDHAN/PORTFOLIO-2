import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import type { ProjectItem } from '../data/portfolioData';

interface ProjectModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onInquire: () => void;
}

export default function ProjectModal({
  project,
  onClose,
  onNavigate,
  onInquire,
}: ProjectModalProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [project?.id]);

  useEffect(() => {
    if (!project) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [project, onClose, onNavigate]);

  if (!project) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-strong relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-5 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Controls */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#ff334b]">
            {project.category}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate(-1)}
              aria-label="Previous project"
              className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-200 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate(1)}
              aria-label="Next project"
              className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-200 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="glass-chip inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-200 hover:text-[#ff334b]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* High-Res Project Image */}
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0a0e] mb-6">
          {!imgFailed ? (
            <img
              src={project.poster}
              alt={`${project.title} preview`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#19090d] to-[#07070a]">
              <span className="text-2xl font-black uppercase text-white">{project.title}</span>
            </div>
          )}
        </div>

        {/* Details Content */}
        <div className="flex flex-col gap-5">
          <div>
            <h3
              id="project-modal-title"
              className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase"
            >
              {project.title}
            </h3>
            <p className="mt-1 text-base sm:text-lg font-semibold text-[#ff465a]">
              {project.subtitle}
            </p>
          </div>

          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            {project.description}
          </p>

          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs sm:text-sm font-mono text-gray-400">
              {project.tags.join(' · ')}
            </p>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-red inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white whitespace-nowrap"
              >
                <span>View Live Project</span>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={onInquire}
                className="glass glass-hover inline-flex min-h-[44px] items-center justify-center rounded-full px-6 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-200 hover:text-white whitespace-nowrap"
              >
                Contact Me
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
