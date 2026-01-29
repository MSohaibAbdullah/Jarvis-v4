import React, { useRef, useState } from 'react';
import { FileDoc } from '../types';
import { generateId } from '../services/storageService';

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: FileDoc[]) => void;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({ isOpen, onClose, onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProcessing(true);
      const newFiles: FileDoc[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const text = await readFileAsText(file);
        newFiles.push({
          id: generateId(),
          name: file.name,
          type: file.type,
          content: text,
          timestamp: Date.now()
        });
      }
      
      onUpload(newFiles);
      setProcessing(false);
      onClose();
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-gray-100 relative overflow-hidden">
        
        <h2 className="text-xl font-bold text-black mb-2">Ingest Knowledge</h2>
        
        <p className="text-gray-500 mb-8 text-sm">
          Upload technical documents to establish ground truth for this node.
          Supported formats: TXT, CSV, CODE.
        </p>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 hover:border-black hover:bg-gray-50 transition-all duration-300 h-32 flex flex-col items-center justify-center cursor-pointer mb-6 rounded-xl"
        >
          <span className="text-3xl mb-2 text-gray-400">📄</span>
          <span className="text-sm text-gray-600 font-medium">{processing ? "Processing..." : "Click to Upload Files"}</span>
        </div>

        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept=".txt,.md,.json,.csv,.js,.ts,.tsx,.py,.html,.css"
        />

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};