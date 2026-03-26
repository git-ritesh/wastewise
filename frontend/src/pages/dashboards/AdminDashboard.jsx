import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showAddCollector, setShowAddCollector] = useState(false);
  const [collectorForm, setCollectorForm] = useState({ name: '', email: '', phone: '' });
  const [collectorLoading, setCollectorLoading] = useState(false);
  const [collectorMessage, setCollectorMessage] = useState({ type: '', text: '' });
  const [createdPassword, setCreatedPassword] = useState('');
  const [filters, setFilters] = useState({
    status: 'pending',
    search: '',
    page: 1
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchStats();
    fetchCollectors();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filters.status, filters.page]);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getReports({
        status: filters.status,
        search: filters.search,
        page: filters.page,
        limit: 10
      });
      setReports(response.data.data.reports);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectors = async () => {
    try {
      const response = await adminAPI.getCollectors();
      setCollectors(response.data.data);
    } catch (error) {
      console.error('Error fetching collectors:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAssign = async (reportId, collectorId) => {
    setActionLoading(reportId);
    try {
      await adminAPI.updateReportStatus(reportId, { status: 'assigned', collectorId });
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Error assigning:', error);
      alert(error.response?.data?.message || 'Error assigning collector');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reportId) => {
    const reason = prompt('Enter rejection reason (optional):');
    setActionLoading(reportId);
    try {
      await adminAPI.rejectReport(reportId, reason);
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting:', error);
      alert(error.response?.data?.message || 'Error rejecting report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    setActionLoading(reportId);
    try {
      await adminAPI.updateReportStatus(reportId, { status: newStatus });
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    const confirmed = window.confirm(`Delete user ${name}? This action cannot be undone.`);
    if (!confirmed) return;

    setActionLoading(userId);
    try {
      await adminAPI.deleteUser(userId);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Error deleting user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddCollector = async (e) => {
    e.preventDefault();
    setCollectorLoading(true);
    setCollectorMessage({ type: '', text: '' });
    setCreatedPassword('');
    try {
      const response = await adminAPI.createCollector(collectorForm);
      setCollectorMessage({ type: 'success', text: response.data.message });
      setCreatedPassword(response.data.data.generatedPassword);
      setCollectorForm({ name: '', email: '', phone: '' });
      fetchCollectors();
      fetchStats();
    } catch (error) {
      setCollectorMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error creating collector'
      });
    } finally {
      setCollectorLoading(false);
    }
  };

  const closeAddCollectorModal = () => {
    setShowAddCollector(false);
    setCollectorForm({ name: '', email: '', phone: '' });
    setCollectorMessage({ type: '', text: '' });
    setCreatedPassword('');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusConfig = {
    pending: { label: 'Pending', color: 'yellow', icon: '⏳' },
    assigned: { label: 'Assigned', color: 'purple', icon: '👤' },
    in_progress: { label: 'In Progress', color: 'orange', icon: '🚛' },
    completed: { label: 'Completed', color: 'green', icon: '✅' },
    cancelled: { label: 'Cancelled', color: 'red', icon: '❌' }
  };

  const wasteTypeLabels = {
    household: '🏠 Household',
    recyclable: '♻️ Recyclables',
    ewaste: '💻 E-Waste',
    organic: '🌿 Organic',
    hazardous: '☢️ Hazardous',
    mixed: '🗑️ Mixed'
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage garbage reports and collector assignments</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-primary btn-add-collector" onClick={() => setShowAddCollector(true)}>
            ➕ Add Collector
          </button>
          <div className="admin-welcome">
            Welcome, <strong>{user?.name}</strong>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card stat-total">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <span className="stat-value">{stats.reports.total}</span>
              <span className="stat-label">Total Reports</span>
            </div>
          </div>
          <div className="admin-stat-card stat-pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <span className="stat-value">{stats.reports.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="admin-stat-card stat-assigned">
            <div className="stat-icon">👤</div>
            <div className="stat-content">
              <span className="stat-value">{stats.reports.assigned + stats.reports.in_progress}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
          <div className="admin-stat-card stat-completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-value">{stats.reports.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="admin-stat-card stat-users">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <span className="stat-value">{stats.users.total}</span>
              <span className="stat-label">Total Users</span>
            </div>
          </div>
          <div className="admin-stat-card stat-rewards">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <span className="stat-value">{stats.rewardsDistributed?.toLocaleString() || 0}</span>
              <span className="stat-label">Points Distributed</span>
            </div>
          </div>
        </div>
      )}

      {/* Reports Section */}
      <div className="reports-section">
        <div className="section-header">
          <h2>Garbage Reports</h2>
          <div className="filter-tabs">
            {['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'all'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filters.status === status ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, status, page: 1 }))}
              >
                {status === 'all' ? 'All' : statusConfig[status]?.label || status}
              </button>
            ))}
          </div>
        </div>

        {/* Reports Table */}
        <div className="reports-table-container">
          {loading ? (
            <div className="loading-state">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>No reports found</p>
            </div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => (
                  <tr key={report._id} className={actionLoading === report._id ? 'row-loading' : ''}>
                    <td className="report-cell">
                      <div className="report-title">{report.title}</div>
                      <div className="report-address">{report.location?.address?.substring(0, 50)}...</div>
                      {report.images?.length > 0 && (
                        <button 
                          className="view-images-btn"
                          onClick={() => setImagePreview(report.images)}
                        >
                          📷 {report.images.length} image(s)
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="user-info">
                        <span className="user-name">{report.user?.name}</span>
                        <span className="user-email">{report.user?.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="waste-type-badge">
                        {wasteTypeLabels[report.wasteType]}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${statusConfig[report.status]?.color}`}>
                        {statusConfig[report.status]?.icon} {statusConfig[report.status]?.label}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(report.createdAt)}</td>
                    <td className="actions-cell">
                      {report.status === 'pending' && (
                        <>
                          <select
                            className="collector-select"
                            onChange={(e) => e.target.value && handleAssign(report._id, e.target.value)}
                            defaultValue=""
                            disabled={actionLoading === report._id}
                          >
                            <option value="">Assign to...</option>
                            {collectors.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.activeAssignments} active)
                              </option>
                            ))}
                          </select>
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleReject(report._id)}
                            disabled={actionLoading === report._id}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {report.status === 'assigned' && (
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => handleStatusChange(report._id, 'in_progress')}
                          disabled={actionLoading === report._id}
                        >
                          Start Progress
                        </button>
                      )}
                      {report.status === 'in_progress' && (
                        <button
                          className="btn btn-small btn-success"
                          onClick={() => handleStatusChange(report._id, 'completed')}
                          disabled={actionLoading === report._id}
                        >
                          Mark Complete
                        </button>
                      )}
                      <button
                        className="btn btn-small btn-outline"
                        onClick={() => setSelectedReport(report)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="table-pagination">
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                ← Previous
              </button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Users Management */}
      <div className="reports-section users-section" style={{ marginTop: '2rem' }}>
        <div className="section-header">
          <h2>Users Management</h2>
          <span className="user-count-badge">Total: {users.length}</span>
        </div>

        <div className="reports-table-container">
          {users.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <p>No users found</p>
            </div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(appUser => (
                  <tr key={appUser._id} className={actionLoading === appUser._id ? 'row-loading' : ''}>
                    <td>{appUser.name}</td>
                    <td>{appUser.email}</td>
                    <td>
                      <span className="waste-type-badge">{appUser.role}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${appUser.isVerified ? 'status-green' : 'status-red'}`}>
                        {appUser.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(appUser.createdAt)}</td>
                    <td>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteUser(appUser._id, appUser.name)}
                        disabled={actionLoading === appUser._id || appUser._id === user?.id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="modal-overlay" onClick={() => setImagePreview(null)}>
          <div className="image-preview-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setImagePreview(null)}>×</button>
            <h3>Report Images</h3>
            <div className="image-gallery">
              {imagePreview.map((img, index) => (
                <div key={index} className="gallery-image">
                  <img src={img} alt={`Report image ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="report-details-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedReport(null)}>×</button>
            <h3>Report Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Title</label>
                <p>{selectedReport.title}</p>
              </div>
              <div className="detail-item">
                <label>Description</label>
                <p>{selectedReport.description}</p>
              </div>
              <div className="detail-item">
                <label>Waste Type</label>
                <p>{wasteTypeLabels[selectedReport.wasteType]}</p>
              </div>
              <div className="detail-item">
                <label>Estimated Weight</label>
                <p>{selectedReport.estimatedWeight?.replace(/_/g, ' ')}</p>
              </div>
              <div className="detail-item">
                <label>Location</label>
                <p>{selectedReport.location?.address}</p>
                {selectedReport.location?.coordinates?.lat && (
                  <p className="coordinates">
                    📍 {selectedReport.location.coordinates.lat.toFixed(6)}, 
                    {selectedReport.location.coordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
              <div className="detail-item">
                <label>Submitted By</label>
                <p>{selectedReport.user?.name} ({selectedReport.user?.email})</p>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <span className={`status-badge status-${statusConfig[selectedReport.status]?.color}`}>
                  {statusConfig[selectedReport.status]?.icon} {statusConfig[selectedReport.status]?.label}
                </span>
              </div>
              {selectedReport.assignedCollector && (
                <div className="detail-item">
                  <label>Assigned Collector</label>
                  <p>{selectedReport.assignedCollector.name} ({selectedReport.assignedCollector.phone})</p>
                </div>
              )}
              {selectedReport.rewardPointsEarned > 0 && (
                <div className="detail-item">
                  <label>Reward Points</label>
                  <p className="reward-badge">🏆 {selectedReport.rewardPointsEarned} points</p>
                </div>
              )}
            </div>
            {selectedReport.images?.length > 0 && (
              <div className="detail-images">
                <label>Attached Images</label>
                <div className="image-gallery small">
                  {selectedReport.images.map((img, index) => (
                    <img key={index} src={img} alt={`Image ${index + 1}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Collector Modal */}
      {showAddCollector && (
        <div className="modal-overlay" onClick={closeAddCollectorModal}>
          <div className="report-details-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeAddCollectorModal}>×</button>
            <h3>➕ Add New Collector</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              Create a new waste collector account. Login credentials will be automatically generated and emailed to the collector.
            </p>

            {collectorMessage.text && (
              <div className={`collector-alert collector-alert-${collectorMessage.type}`}>
                {collectorMessage.type === 'success' ? '✅' : '⚠️'} {collectorMessage.text}
              </div>
            )}

            {createdPassword && (
              <div className="collector-password-box">
                <div className="password-label">Generated Password (shown once):</div>
                <div className="password-value">{createdPassword}</div>
                <div className="password-note">This password has been emailed to the collector.</div>
              </div>
            )}

            {!createdPassword && (
              <form onSubmit={handleAddCollector}>
                <div className="collector-form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={collectorForm.name}
                    onChange={e => setCollectorForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter collector's name"
                    required
                  />
                </div>
                <div className="collector-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={collectorForm.email}
                    onChange={e => setCollectorForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter collector's email"
                    required
                  />
                </div>
                <div className="collector-form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={collectorForm.phone}
                    onChange={e => setCollectorForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="10-digit phone number"
                    pattern="[0-9]{7,15}"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={collectorLoading}
                  style={{ marginTop: '15px' }}
                >
                  {collectorLoading ? 'Creating...' : 'Create Collector Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
