import React from 'react';
import { PlusCircle, Edit3, Trash, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';

export default function ActivityFeed({ activities }) {
  const getIcon = (type) => {
    switch (type) {
      case 'create':
        return <PlusCircle size={15} color="#818cf8" />;
      case 'update':
        return <Edit3 size={15} color="#38bdf8" />;
      case 'delete':
        return <Trash size={15} color="#fb7185" />;
      case 'complete':
        return <CheckCircle2 size={15} color="#34d399" />;
      case 'system':
      default:
        return <ShieldCheck size={15} color="#a78bfa" />;
    }
  };

  return (
    <div className="activity-card">
      <div className="activity-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 className="activity-title">Live Activity</h3>
        </div>
        <span className="activity-badge">Real-time Feed</span>
      </div>

      <div className="activity-list">
        {activities.map((act) => (
          <div key={act.id} className="activity-item">
            <div 
              className="activity-icon" 
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              {getIcon(act.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div className="activity-desc">
                {act.type === 'system' ? (
                  <span>
                    <em>[Initial Milestone]</em> {act.message}
                  </span>
                ) : (
                  <span>
                    <strong>{act.user || 'DevOps Engineer'}</strong> {act.action}{' '}
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      "{act.taskTitle}"
                    </span>
                  </span>
                )}
              </div>
              <div className="activity-time">{act.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
