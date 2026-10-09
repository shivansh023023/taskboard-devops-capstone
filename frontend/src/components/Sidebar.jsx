import React from 'react';
import { 
  LayoutDashboard, 
  Kanban, 
  Database, 
  BarChart3, 
  FileText, 
  Layers, 
  Server, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function Sidebar({ systemStatus, mobileOpen, onCloseMobile }) {
  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Layers size={22} />
        </div>
        <div className="brand-info">
          <h1>TaskBoard</h1>
          <span>DevOps Capstone</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Workspace</div>
        <a className="nav-item active" href="#dashboard" onClick={onCloseMobile}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </a>
        <a className="nav-item" href="#pipeline" onClick={onCloseMobile}>
          <Kanban size={18} />
          <span>Task Pipeline</span>
        </a>
        
        <div className="nav-section-title">Infrastructure & APIs</div>
        <a 
          className="nav-item" 
          href="/docs" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <FileText size={18} />
          <span>FastAPI Docs (/docs)</span>
        </a>
        <a 
          className="nav-item" 
          href="/metrics" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <BarChart3 size={18} />
          <span>Prometheus (/metrics)</span>
        </a>
      </nav>

      {/* Footer System Status */}
      <div className="sidebar-footer">
        <div className="system-status-box">
          <div className="status-row">
            <span style={{ color: 'var(--text-muted)' }}>Backend (API)</span>
            <span className="status-indicator">
              <span className={`status-dot ${systemStatus.healthy ? 'online' : 'offline'}`} />
              <span style={{ fontWeight: 600, color: systemStatus.healthy ? '#10b981' : '#f43f5e' }}>
                {systemStatus.healthy ? 'Healthy' : 'Offline'}
              </span>
            </span>
          </div>

          <div className="status-row">
            <span style={{ color: 'var(--text-muted)' }}>PostgreSQL DB</span>
            <span className="status-indicator">
              <span className={`status-dot ${systemStatus.ready ? 'online' : 'offline'}`} />
              <span style={{ fontWeight: 600, color: systemStatus.ready ? '#10b981' : '#f43f5e' }}>
                {systemStatus.ready ? 'Connected' : 'Disconnected'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
