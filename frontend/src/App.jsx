import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import TaskTable from './components/TaskTable';
import TaskModal from './components/TaskModal';
import ActivityFeed from './components/ActivityFeed';
import BackendErrorBanner from './components/BackendErrorBanner';
import { 
  fetchTasks, 
  fetchTaskStats, 
  createTask, 
  updateTask, 
  deleteTask, 
  checkSystemHealth 
} from './services/api';

const INITIAL_ACTIVITIES = [
  {
    id: 1,
    type: 'system',
    message: 'PostgreSQL database container initialized with Alembic migrations.',
    timestamp: 'Day 1 Launch',
  },
  {
    id: 2,
    type: 'system',
    message: 'FastAPI backend engine started with Prometheus metrics instrumentation.',
    timestamp: 'Day 1 Launch',
  },
];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // System Health
  const [systemStatus, setSystemStatus] = useState({ healthy: true, ready: true });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Real-time recorded activity feed
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('taskboard_activities');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  const recordActivity = (activity) => {
    setActivities((prev) => {
      const updated = [activity, ...prev].slice(0, 15);
      try {
        localStorage.setItem('taskboard_activities', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save activities:', e);
      }
      return updated;
    });
  };

  // Fetch tasks, stats, and health status
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      // Check health and readiness probes
      const healthInfo = await checkSystemHealth();
      setSystemStatus({ healthy: healthInfo.healthy, ready: healthInfo.ready });

      // Load tasks and statistics in parallel
      const [tasksData, statsData] = await Promise.all([
        fetchTasks({
          search: searchQuery,
          status: statusFilter,
          priority: priorityFilter,
        }),
        fetchTaskStats(),
      ]);

      setTasks(tasksData);
      setStats(statsData);
      setBackendError(null);
    } catch (err) {
      console.error('API Error:', err);
      setBackendError(err.message || 'Unable to connect to backend service.');
      setSystemStatus({ healthy: false, ready: false });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, statusFilter, priorityFilter]);

  // Initial load and filter reaction
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic health ping every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const healthInfo = await checkSystemHealth();
      setSystemStatus({ healthy: healthInfo.healthy, ready: healthInfo.ready });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Save Task (Create or Update)
  const handleSaveTask = async (taskPayload) => {
    if (editingTask) {
      // Update
      const updated = await updateTask(editingTask.id, taskPayload);
      recordActivity({
        id: Date.now(),
        type: 'update',
        action: 'updated task',
        taskTitle: updated.title,
        timestamp: 'Just now',
      });
    } else {
      // Create
      const created = await createTask(taskPayload);
      recordActivity({
        id: Date.now(),
        type: 'create',
        action: 'created task',
        taskTitle: created.title,
        timestamp: 'Just now',
      });
    }
    await loadData(true);
  };

  // Delete Task
  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete task "${task.title}"?`
    );
    if (!confirmed) return;

    try {
      await deleteTask(task.id);
      recordActivity({
        id: Date.now(),
        type: 'delete',
        action: 'deleted task',
        taskTitle: task.title,
        timestamp: 'Just now',
      });
      await loadData(true);
    } catch (err) {
      alert(`Error deleting task: ${err.message}`);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Dark Sidebar */}
      <Sidebar 
        systemStatus={systemStatus} 
        mobileOpen={mobileOpen} 
        onCloseMobile={() => setMobileOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="main-layout">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenCreateModal={handleOpenCreateModal}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {/* Content Body */}
        <main className="content-area">
          {/* Backend Error Banner if unready/failed */}
          <BackendErrorBanner 
            error={backendError} 
            onRetry={() => loadData(true)} 
          />

          {/* KPI Summary Cards */}
          <KpiCards stats={stats} />

          {/* Main Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Task Management Table */}
            <TaskTable
              tasks={tasks}
              loading={loading}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              priorityFilter={priorityFilter}
              onPriorityFilterChange={setPriorityFilter}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onOpenCreateModal={handleOpenCreateModal}
            />

            {/* Real-time Activity Feed */}
            <ActivityFeed activities={activities} />
          </div>
        </main>
      </div>

      {/* Create / Edit Modal Dialog */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
      />
    </div>
  );
}
