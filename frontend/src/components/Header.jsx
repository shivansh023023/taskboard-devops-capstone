import React from 'react';
import { Search, Plus, Menu, RotateCw } from 'lucide-react';

export default function Header({ 
  searchQuery, 
  onSearchChange, 
  onOpenCreateModal, 
  onRefresh, 
  isRefreshing,
  onToggleMobile 
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button 
          className="mobile-menu-btn" 
          onClick={onToggleMobile} 
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>
        <div>
          <h2 className="header-title">Sprint Overview</h2>
          <p className="header-subtitle">Real-time TaskBoard orchestration & cloud tracking</p>
        </div>
      </div>

      <div className="header-right">
        {/* Search Field */}
        <div className="search-box">
          <Search className="search-icon" size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks, assignees..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Refresh Button */}
        <button 
          className="btn-secondary" 
          onClick={onRefresh} 
          title="Refresh Data"
          disabled={isRefreshing}
        >
          <RotateCw size={16} className={isRefreshing ? 'spin-animation' : ''} />
          <span>Refresh</span>
        </button>

        {/* Create Task Button */}
        <button className="btn-primary" onClick={onOpenCreateModal}>
          <Plus size={18} />
          <span>Create Task</span>
        </button>
      </div>
    </header>
  );
}
