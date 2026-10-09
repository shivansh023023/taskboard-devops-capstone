import React from 'react';
import { CheckCircle2, Clock, ListTodo, AlertTriangle, Layers } from 'lucide-react';

export default function KpiCards({ stats }) {
  const total = stats?.total ?? 0;
  const todo = stats?.todo ?? 0;
  const inProgress = stats?.in_progress ?? 0;
  const done = stats?.done ?? 0;

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const urgentCount = stats?.by_priority?.urgent ?? 0;

  return (
    <section className="kpi-grid">
      {/* Total Tasks Card */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Total Tasks</span>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Layers size={20} />
          </div>
        </div>
        <div className="kpi-value">{total}</div>
        <div className="kpi-subtext">
          <span>Active sprint workload</span>
        </div>
      </div>

      {/* In Progress Card */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">In Progress</span>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
            <Clock size={20} />
          </div>
        </div>
        <div className="kpi-value">{inProgress}</div>
        <div className="kpi-subtext">
          <span>Tasks currently underway</span>
        </div>
      </div>

      {/* Done / Completed Card */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Completed</span>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={20} />
          </div>
        </div>
        <div className="kpi-value">{done}</div>
        <div className="kpi-subtext">
          <span style={{ color: '#34d399', fontWeight: 600 }}>{completionRate}%</span>
          <span>completion rate</span>
        </div>
      </div>

      {/* Pending / To-Do Card */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">To Do / Backlog</span>
          <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <ListTodo size={20} />
          </div>
        </div>
        <div className="kpi-value">{todo}</div>
        <div className="kpi-subtext">
          {urgentCount > 0 ? (
            <span style={{ color: '#fb7185', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={14} /> {urgentCount} urgent item{urgentCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span>Ready for pickup</span>
          )}
        </div>
      </div>
    </section>
  );
}
