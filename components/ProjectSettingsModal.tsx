import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  project: Project | undefined;
  onClose: () => void;
  onSave: (id: string, name: string, description: string) => void;
  onDelete: (id: string) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ 
  isOpen, 
  project, 
  onClose, 
  onSave, 
  onDelete 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setConfirmDelete(false);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(project.id, name, description);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-gray-100 relative overflow-hidden">
        
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-black">Node Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Project Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-subtle-gray border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-medium"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-subtle-gray border border-gray-200 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none h-24 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-gray-100">
          {!confirmDelete ? (
            <button 
              onClick={() => setConfirmDelete(true)}
              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors px-2 py-1 -ml-2 rounded hover:bg-red-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete Node
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-bold">Are you sure?</span>
              <button 
                onClick={() => onDelete(project.id)}
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
              <button 
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1"
              >
                Cancel
              </button>
            </div>
          )}

          <button 
            onClick={handleSave}
            className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};