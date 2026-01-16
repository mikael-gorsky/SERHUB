// Knowledge Service
// TODO: Add serhub_knowledge table to database schema if needed

export interface KnowledgeItem {
  id: string;
  title: string;
  type: 'Guideline' | 'History' | 'Source' | 'Template';
  summary: string;
  tags: string[];
  link: string;
}

// Placeholder knowledge items - can be moved to database later
const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 'k1',
    title: 'CHE Evaluation Handbook 2024',
    type: 'Guideline',
    summary: 'Official Council for Higher Education guidelines for institutional self-evaluation.',
    tags: ['all'],
    link: 'https://che.org.il/guidelines'
  },
  {
    id: 'k2',
    title: 'Previous SER Template',
    type: 'Template',
    summary: 'Template document from previous successful submission.',
    tags: ['all'],
    link: '#'
  },
  {
    id: 'k3',
    title: 'Data Collection Guidelines',
    type: 'Guideline',
    summary: 'Guidelines for collecting and presenting quantitative data in the SER.',
    tags: ['3.3', '3.4'],
    link: '#'
  }
];

export const KnowledgeService = {
  getAll: async (): Promise<KnowledgeItem[]> => {
    // Return static knowledge items for now
    return Promise.resolve(KNOWLEDGE_ITEMS);
  },

  getBySectionId: async (sectionNumber: string): Promise<KnowledgeItem[]> => {
    // Filter by section number or return all if 'all' tag
    return Promise.resolve(
      KNOWLEDGE_ITEMS.filter(k =>
        k.tags.includes('all') || k.tags.includes(sectionNumber)
      )
    );
  },

  getByType: async (type: KnowledgeItem['type']): Promise<KnowledgeItem[]> => {
    return Promise.resolve(
      KNOWLEDGE_ITEMS.filter(k => k.type === type)
    );
  }
};
