const statusConfig = {
  pending: { label: 'Pending', color: 'yellow', icon: '⏳' },
  assigned: { label: 'Assigned', color: 'purple', icon: '👤' },
  in_progress: { label: 'In Progress', color: 'orange', icon: '🚛' },
  completed: { label: 'Completed', color: 'green', icon: '✅' },
  cancelled: { label: 'Cancelled', color: 'red', icon: '❌' }
};

const wasteTypeLabels = {
  household: 'Household Waste',
  recyclable: 'Recyclables',
  ewaste: 'E-Waste',
  organic: 'Organic Waste',
  hazardous: 'Hazardous',
  mixed: 'Mixed Waste'
};

const ReportsList = ({ reports, activeTab, onTabChange, onCancel, pagination, onPageChange }) => {
  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' }
  ];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="reports-list-container">
      <div className="reports-header">
        <h2 className="section-title">My Garbage Reports</h2>
      </div>

      {/* Tabs */}
      <div className="reports-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No reports found</p>
            <span className="empty-hint">Submit a garbage report to see it here</span>
          </div>
        ) : (
          reports.map(report => (
            <div key={report._id} className="report-card">
              <div className="report-main">
                <div className="report-header">
                  <h3 className="report-title">{report.title}</h3>
                  <span className={`status-badge status-${statusConfig[report.status]?.color}`}>
                    {statusConfig[report.status]?.icon} {statusConfig[report.status]?.label}
                  </span>
                </div>
                <p className="report-description">{report.description}</p>
                <div className="report-meta">
                  <span className="meta-item">
                    <span className="meta-icon">🗑️</span>
                    {wasteTypeLabels[report.wasteType]}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">📍</span>
                    {report.location?.address}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">📅</span>
                    {formatDate(report.createdAt)}
                  </span>
                </div>
                {report.assignedCollector && (
                  <div className="collector-info">
                    <span className="collector-label">Assigned to:</span>
                    <span className="collector-name">{report.assignedCollector.name}</span>
                    <span className="collector-phone">📱 {report.assignedCollector.phone}</span>
                  </div>
                )}
                {report.rewardPointsEarned > 0 && (
                  <div className="reward-earned">
                    <span>🏆 +{report.rewardPointsEarned} points earned</span>
                  </div>
                )}
              </div>
              
              {['pending', 'assigned'].includes(report.status) && (
                <div className="report-actions">
                  <button 
                    className="btn btn-small btn-outline btn-danger"
                    onClick={() => onCancel(report._id)}
                  >
                    Cancel Report
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="pagination-btn"
            disabled={pagination.page === pagination.pages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsList;
