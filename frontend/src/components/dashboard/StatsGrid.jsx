const StatsGrid = ({ stats }) => {
  const statsConfig = [
    {
      key: 'total',
      label: 'Total Reports',
      icon: '📋',
      color: 'blue'
    },
    {
      key: 'pending',
      label: 'Pending',
      icon: '⏳',
      color: 'yellow'
    },
    {
      key: 'assigned',
      label: 'Assigned',
      icon: '👤',
      color: 'purple'
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      icon: '🚛',
      color: 'orange'
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: '✅',
      color: 'green'
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      icon: '❌',
      color: 'red'
    }
  ];

  return (
    <div className="stats-grid">
      <h2 className="section-title">Report Statistics</h2>
      <div className="stats-container">
        {statsConfig.map(stat => (
          <div key={stat.key} className={`stat-card stat-${stat.color}`}>
            <div className="stat-card-icon">{stat.icon}</div>
            <div className="stat-card-content">
              <span className="stat-card-value">{stats?.[stat.key] || 0}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;
