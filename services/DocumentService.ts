// Document Service
// TODO: Add serhub_documents table to database schema if needed
// Could integrate with Supabase Storage for file uploads

export interface Document {
  id: string;
  name: string;
  type: 'PDF' | 'DOC' | 'XLS' | 'PPT' | 'Other';
  url: string;
  section_id?: string;
  uploaded_by?: string;
  last_updated: string;
  status: 'Missing' | 'Uploaded' | 'Outdated' | 'Approved';
}

export const DocumentService = {
  getAll: async (): Promise<Document[]> => {
    // Placeholder - return empty array until document storage is implemented
    return Promise.resolve([]);
  },

  getBySectionId: async (sectionId: string): Promise<Document[]> => {
    // Placeholder - return empty array until document storage is implemented
    return Promise.resolve([]);
  },

  // Future methods for document management
  // upload: async (file: File, sectionId: string): Promise<Document> => { ... }
  // delete: async (documentId: string): Promise<boolean> => { ... }
  // updateStatus: async (documentId: string, status: Document['status']): Promise<Document> => { ... }
};
