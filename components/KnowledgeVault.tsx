import React, { useState, useEffect } from 'react';
import { Search, FileText, Bookmark, ExternalLink, Loader2 } from 'lucide-react';
import { KnowledgeService } from '../services/KnowledgeService';
import { KnowledgeItem } from '../types';

const KnowledgeVault = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await KnowledgeService.getAll();
        setKnowledgeItems(data);
      } catch (error) {
        console.error("Error fetching knowledge base:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredKnowledge = knowledgeItems.filter(k => 
    k.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    k.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-hit-blue">
        <Loader2 className="animate-spin mr-2" />
        <span>Loading Knowledge Base...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search Header */}
      <div className="p-8 border-b border-gray-200 bg-gray-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Knowledge Vault</h2>
        <p className="text-gray-500 mb-6">Search guidelines, past reports, and institutional policies.</p>
        <div className="relative w-full max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search for 'faculty ratios', 'CHE guidelines', etc..." 
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-hit-blue focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 p-8 bg-gray-50/30 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKnowledge.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    item.type === 'Guideline' ? 'bg-purple-100 text-purple-700' :
                    item.type === 'History' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {item.type}
                </span>
                <button className="text-gray-400 hover:text-hit-accent">
                  <Bookmark size={18} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{item.summary}</p>
              
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {item.tags.map(tag => (
                   <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                     Section {tag.replace('s', '')}
                   </span>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <a href={item.link} className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-gray-50 text-gray-700 font-medium text-sm hover:bg-hit-blue hover:text-white transition-colors">
                  <ExternalLink size={16} /> Open Resource
                </a>
              </div>
            </div>
          ))}
          {filteredKnowledge.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No results found for "{searchTerm}"</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeVault;