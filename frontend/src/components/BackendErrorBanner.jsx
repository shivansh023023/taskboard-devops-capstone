import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

export default function BackendErrorBanner({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className="error-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AlertOctagon size={22} style={{ color: '#f43f5e', flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#fff' }}>Backend Connection Error: </strong>
          <span>{error}</span>
          <div style={{ fontSize: '0.8rem', color: '#fda4af', marginTop: 2 }}>
            Ensure the FastAPI server is running on port 8000 and PostgreSQL is healthy.
          </div>
        </div>
      </div>
      <button 
        className="btn-secondary" 
        onClick={onRetry} 
        style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fff' }}
      >
        <RotateCw size={15} />
        <span>Retry Connection</span>
      </button>
    </div>
  );
}
