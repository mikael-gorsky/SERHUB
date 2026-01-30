import React, { useState, useEffect, useMemo } from 'react';
import { Folder, FileText, Globe, ChevronRight, Users, LayoutDashboard } from 'lucide-react';
import { Section } from '../types';
import { useSections } from '../contexts/SectionsContext';

interface SectionTreeProps {
  selectedSectionId: string | null;
  onSelectSection: (section: Section) => void;
}

const SectionTree: React.FC<SectionTreeProps> = ({ selectedSectionId, onSelectSection }) => {
  // Use pre-loaded sections from context
  const { sections, totalProgress, loading } = useSections();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Helper to check if a section is the Organizational Tasks section
  const isOrgSection = (section: Section) =>
    section.number === 'Org' || section.title.toLowerCase().includes('organizational');

  // Sort sections: Org first, then by number
  const sortedSections = useMemo(() => {
    return [...sections].sort((a, b) => {
      const aIsOrg = isOrgSection(a);
      const bIsOrg = isOrgSection(b);
      if (aIsOrg && !bIsOrg) return -1;
      if (!aIsOrg && bIsOrg) return 1;
      // For numeric sections, sort by number
      const aNum = parseInt(a.number.replace(/[^0-9]/g, '')) || 0;
      const bNum = parseInt(b.number.replace(/[^0-9]/g, '')) || 0;
      return aNum - bNum;
    });
  }, [sections]);

  // Expand all sections when they load
  useEffect(() => {
    if (sections.length > 0 && expandedIds.size === 0) {
      const expanded = new Set<string>();
      const expandAll = (sects: Section[]) => {
        sects.forEach(s => {
          expanded.add(s.id);
          if (s.children) expandAll(s.children);
        });
      };
      expandAll(sections);
      setExpandedIds(expanded);
    }
  }, [sections]);

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
    if (isOrgSection(section)) {
      return <Users size={18} className={isSelected ? 'text-white' : 'text-purple-600'} />;
    }
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
    const isLevel1 = depth === 0;  // Top-level: 0, 1, 2, 3, 4, 5
    const isLevel2 = depth === 1;  // First-level: 1.1, 2.1, etc.
    const isLevel3 = depth === 2;  // Second-level: 3.1.1, etc.

    // Get text styling based on level
    // Top-level: largest (base), First-level: -1 (sm/14px), Second-level: -2 (xs/12px)
    const isOrg = isOrgSection(section);
    const getTextStyle = () => {
      if (isSelected) return 'font-bold text-white text-base';
      if (isOrg) return 'font-bold text-purple-700 text-base uppercase tracking-wide';
      if (isLevel1) return 'font-bold text-green-800 text-base uppercase tracking-wide';
      if (isLevel2) return 'font-bold text-teal-600 text-sm';
      return 'font-medium text-gray-600 text-xs';
    };

    // Get display title - rename "Org Organizational tasks" to "Organizational Tasks"
    const getDisplayTitle = () => {
      if (isOrg) {
        return 'ORGANIZATIONAL TASKS';
      }
      return isLevel1 ? section.title.toUpperCase() : section.title;
    };

    // Get display number - hide number for Org section
    const getDisplayNumber = () => {
      if (isOrg) return '';
      return section.number;
    };

    return (
      <div key={section.id}>
        <div
          className={`flex items-center gap-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
            isSelected
              ? 'bg-teal-600 text-white px-3'
              : isLevel2
                ? 'hover:bg-teal-50 px-3 bg-gray-100/50'
                : 'hover:bg-gray-100'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => {
            onSelectSection(section);
            if (hasChildren) toggleExpand(section.id);
          }}
        >
          {getIcon(section, isSelected)}

          <span className={`flex-1 ${getTextStyle()}`}>
            {getDisplayNumber()}{getDisplayNumber() ? ' ' : ''}{getDisplayTitle()}
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
    <div className="w-[40%] min-w-[360px] bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Info Block Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <LayoutDashboard size={20} className="text-teal-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">SER Report</h2>
            <p className="text-xs text-gray-500">
              Sections and deliverables
            </p>
          </div>
        </div>
      </div>

      {/* Section Tree */}
      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="space-y-1">
          {sortedSections.map(section => renderSection(section))}
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
  );
};

export default SectionTree;
