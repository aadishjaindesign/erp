import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
      
      {/* Dialog Box */}
      <div className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-rose-100 rounded-2xl shadow-2xl shadow-rose-100/30 p-6 z-10 text-slate-700 ${className}`}>
        <div className="flex justify-between items-center mb-6">
          {title && <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
