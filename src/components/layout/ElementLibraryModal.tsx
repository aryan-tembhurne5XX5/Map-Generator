import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ElementType } from '@/types/land';

interface ElementLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddElement: (type: ElementType, name: string, nameHi: string) => void;
  elementTypes: Array<{ value: ElementType; label: string; labelHi: string }>;
}

const ElementLibraryModal: React.FC<ElementLibraryModalProps> = ({ isOpen, onClose, onAddElement, elementTypes }) => {
  const [filter, setFilter] = useState<string>('all');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="modal-content" style={{
        background: '#fff', borderRadius: 8, width: 800, maxWidth: '90vw',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Element Asset Library</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 8, overflowX: 'auto' }}>
          {['all', 'Buildings', 'Nature', 'Utilities', 'Land Use'].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-secondary'}`}>
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        <div style={{ padding: 24, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
          {elementTypes.map(et => (
            <div key={et.value} 
              style={{
                border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s'
              }}
              className="element-card"
              onClick={() => {
                onAddElement(et.value, et.label, et.labelHi);
                onClose();
              }}
            >
              <div style={{ width: 64, height: 64, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={`/assets/elements/${et.value}.png`} alt={et.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={(e: any) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%2394a3b8">No Asset</text></svg>'; }}
                />
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>{et.label}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>{et.labelHi}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ElementLibraryModal;
