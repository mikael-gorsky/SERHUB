import React, { useState, useEffect } from 'react';
import { Folder, FileText, Globe, ChevronRight, X, LayoutDashboard, CheckSquare, Calendar, Users, Settings, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Section } from '../types';
import { getSectionsHierarchy, getSectionProgress } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AppLogo from './AppLogo';

interface SectionTreeProps {
  selectedSectionId: string | null;
  onSelectSection: (section: Section) => void;
}

const SectionTree: React.FC<SectionTreeProps> = ({ selectedSectionId, onSelectSection }) => {
  const { currentUser, signOut } = useAuth();
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [totalProgress, setTotalProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: Users, label: 'Team', path: '/team' },
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: HelpCircle, label: 'Help', path: '/help' },
  ];

  useEffect(() => {
    // Only load sections after user is authenticated
    if (currentUser) {
      loadSections();
    }
  }, [currentUser]);

  const loadSections = async () => {
    try {
      console.log('Loading sections...');
      const hierarchy = await getSectionsHierarchy();
      console.log('Sections loaded:', hierarchy);
      setSections(hierarchy);

      // Expand all by default for better UX
      const expanded = new Set<string>();
      const expandAll = (sects: Section[]) => {
        sects.forEach(s => {
          expanded.add(s.id);
          if (s.children) expandAll(s.children);
        });
      };
      expandAll(hierarchy);
      setExpandedIds(expanded);

      // Calculate total progress (average of level 1 sections)
      let totalProg = 0;
      for (const section of hierarchy) {
        const prog = await getSectionProgress(section.id);
        totalProg += prog;
      }
      setTotalProgress(hierarchy.length > 0 ? Math.round(totalProg / hierarchy.length) : 0);
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (sectionId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedIds(newExpanded);
  };

  const getIcon = (section: Section, isSelected: boolean) => {
    const iconClass = isSelected ? 'text-white' : 'text-teal-600';

    // Special icons for specific sections
    if (section.title.toLowerCase().includes('internationalization')) {
      return <Globe size={18} className={iconClass} />;
    }

    // Folder for sections with children, document for leaf sections
    if (section.children && section.children.length > 0) {
      return <Folder size={18} className={iconClass} />;
    }
    return <FileText size={18} className="text-gray-400" />;
  };

  const renderSection = (section: Section, depth: number = 0) => {
    const isExpanded = expandedIds.has(section.id);
    const isSelected = selectedSectionId === section.id;
    const hasChildren = section.children && section.children.length > 0;
    const isLevel1 = depth === 0;
    const isLevel2 = depth === 1;

    return (
      <div key={section.id}>
        <div
          className={`flex items-center gap-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
            isSelected
              ? 'bg-teal-600 text-white px-3'
              : isLevel2
                ? 'text-teal-700 hover:bg-teal-50 px-3 bg-gray-100/50'
                : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => {
            onSelectSection(section);
            if (hasChildren) toggleExpand(section.id);
          }}
        >
          {getIcon(section, isSelected)}

          <span className={`text-sm flex-1 ${
            isSelected ? 'font-semibold text-white' :
            isLevel1 ? 'font-semibold text-gray-800' :
            isLevel2 ? 'font-semibold text-teal-700' :
            'font-medium text-gray-600'
          }`}>
            {section.number} {section.title}
          </span>

          {isSelected && (
            <ChevronRight size={16} className="text-white" />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {section.children!.map(child => renderSection(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-[40%] min-w-[360px] bg-gray-50 border-r border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="space-y-2 mt-8">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hamburger Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-72 bg-white shadow-2xl flex flex-col h-full">
            {/* Menu Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AppLogo size={36} />
                <span className="font-bold text-lg text-teal-700">SERHUB</span>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Menu Footer - Progress */}
            <div className="p-4 border-t border-gray-200">
              <p className="text-xs font-bold text-teal-600 tracking-wider mb-2">PROJECT PROGRESS</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${totalProgress}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700">{totalProgress}%</span>
              </div>
            </div>

            {/* Sign Out */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
          {/* Backdrop */}
          <div className="flex-1 bg-black/30" onClick={() => setMenuOpen(false)} />
        </div>
      )}

      <div className="w-[40%] min-w-[360px] bg-gray-50 border-r border-gray-200 flex flex-col h-full">
        {/* Institutional Header */}
        <div className="p-5 border-b border-gray-200">
          {/* App Logo Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="mb-4 -ml-1 hover:opacity-80 transition-opacity"
          >
            <AppLogo size={36} />
          </button>

          {/* Institution Info */}
          <div className="text-sm text-gray-700 leading-relaxed space-y-0.5">
            <p className="font-bold text-gray-900">HIT Holon Institute of Technology</p>
            <p>Faculty of Science</p>
            <p>School of Computer Science</p>
          </div>

          {/* Project Title */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h2 className="text-base font-bold text-gray-900">Self Evaluation Report for CHE</h2>
            <p className="text-xs text-teal-600 font-bold mt-1 tracking-wide uppercase">
              Academic Year 2024/2025
            </p>
          </div>
        </div>

      {/* Section Tree */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {sections.map(section => renderSection(section))}
        </div>
      </div>

        {/* Progress Card */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-teal-600 tracking-wider mb-3">
              TOTAL SECTION PROGRESS
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700">{totalProgress}%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SectionTree;
