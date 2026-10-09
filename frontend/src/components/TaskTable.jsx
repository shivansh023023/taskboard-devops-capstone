import React from 'react';
import { Edit2, Trash2, Calendar, User, AlertCircle, Plus } from 'lucide-react';

export default function TaskTable({
  tasks,
  loading,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  onEditTask,
  onDeleteTask,
  onOpenCreateModal,
}) {
  const statusOptions = [
    { value: 'all', label: 'All Tasks' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent Priority' },
  ];

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="table-card">
      {/* Table Toolbar & Filters */}
      <div className="table-toolbar">
        {/* Status Filter Tabs */}
        <div className="status-tabs">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              className={`status-tab ${statusFilter === opt.value ? 'active' : ''}`}
              onClick={() => onStatusFilterChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Priority Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            className="priority-select"
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Body / Loading / Empty States */}
      {loading ? (
        <div style={{ padding: '16px 0' }}>
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div style={{ 
            width: 54, 
            height: 54, 
            borderRadius: '50%', 
            background: 'rgba(99, 102, 241, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#818cf8',
            marginBottom: 8 
          }}>
            <AlertCircle size={28} />
          </div>
          <h3>No tasks found</h3>
          <p style={{ maxWidth: 360, fontSize: '0.88rem' }}>
            {statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No tasks match the active filters. Try resetting the filters or add a new task.'
              : 'Your task list is empty. Create your first task to start tracking your DevOps milestones.'}
          </p>
          <button 
            className="btn-primary" 
            onClick={onOpenCreateModal} 
            style={{ marginTop: 12 }}
          >
            <Plus size={16} />
            <span>Create First Task</span>
          </button>
        </div>
      ) : (
        <div className="task-table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Task Details</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  {/* Title & Description */}
                  <td>
                    <div className="task-title-cell">
                      <span className="task-title">{task.title}</span>
                      {task.description && (
                        <span className="task-desc" title={task.description}>
                          {task.description}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td>
                    <span className={`badge badge-status-${task.status}`}>
                      <span style={{ 
                        width: 6, 
                        height: 6, 
                        borderRadius: '50%', 
                        background: task.status === 'done' ? '#10b981' : task.status === 'in_progress' ? '#6366f1' : '#9ca3af' 
                      }} />
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Priority Badge */}
                  <td>
                    <span className={`badge badge-priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  </td>

                  {/* Assignee */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      <User size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{task.assignee || 'Unassigned'}</span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{formatDate(task.due_date)}</span>
                    </div>
                  </td>

                  {/* Row Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="icon-btn"
                        title="Edit task"
                        onClick={() => onEditTask(task)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        title="Delete task"
                        onClick={() => onDeleteTask(task)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
