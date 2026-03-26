import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collectorAPI } from '../../services/api';
import './CollectorDashboard.css';

const CollectorDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending (assigned/in_progress) or completed
  const [selectedTask, setSelectedTask] = useState(null);
  const [completionModal, setCompletionModal] = useState(null);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const status = filter === 'pending' ? null : 'completed';
      const response = await collectorAPI.getTasks({ status });
      setTasks(response.data.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMap = (location) => {
    if (!location?.coordinates?.lat) return;
    const { lat, lng } = location.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleCompleteClick = (task) => {
    setCompletionModal(task);
    setFile(null);
    setNote('');
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const submitCompletion = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please upload a proof photo');
      return;
    }

    setSubmitting(true);
    try {
      await collectorAPI.completeTask(completionModal._id, {
        proof: file,
        note
      });
      setCompletionModal(null);
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      alert(error.response?.data?.message || 'Error completing task');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColors = {
    assigned: 'purple',
    in_progress: 'orange',
    completed: 'green',
    cancelled: 'red'
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
    <div className="collector-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Collector Dashboard</h1>
          <p>Welcome back, <span className="highlight">{user?.name}</span></p>
        </div>
        <div className="header-badge collector">
          <span className="badge-icon">🚛</span>
          Waste Collector
        </div>
      </div>

      {/* Stats Summary (Placeholder for now, could be real API data) */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon pickups">📦</div>
          <div className="stat-info">
            <h3>Active Tasks</h3>
            <p className="stat-value">{tasks.filter(t => t.status !== 'completed').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon waste">🏆</div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p className="stat-value">{tasks.filter(t => t.status === 'completed').length}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="section-card full-width">
          <div className="section-header">
            <h2>My Tasks</h2>
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Active
              </button>
              <button 
                className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="task-list">
            {loading ? (
              <div className="loading-state">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✅</span>
                <p>No {filter} tasks found</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task._id} className={`task-card ${task.status}`}>
                  <div className="task-header">
                    <span className="waste-badge">{wasteTypeLabels[task.wasteType]}</span>
                    <span className={`status-badge status-${statusColors[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="task-body">
                    <h3 className="task-title">{task.title}</h3>
                    <p className="task-address">📍 {task.location.address}</p>
                    <p className="task-desc">{task.description}</p>
                    <div className="task-meta">
                      <span>⚖️ {task.estimatedWeight.replace(/_/g, ' ')}</span>
                      <span>📅 {formatDate(task.createdAt)}</span>
                    </div>
                  </div>

                  <div className="task-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={() => handleOpenMap(task.location)}
                      disabled={!task.location?.coordinates?.lat}
                    >
                      🗺️ Navigate
                    </button>
                    {task.status !== 'completed' && (
                      <button 
                        className="btn btn-success"
                        onClick={() => handleCompleteClick(task)}
                      >
                        ✅ Complete
                      </button>
                    )}
                    {task.status === 'completed' && task.completionProof && (
                      <a 
                        href={task.completionProof} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                      >
                        📷 View Proof
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {completionModal && (
        <div className="modal-overlay" onClick={() => !submitting && setCompletionModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complete Task</h2>
              <button 
                className="modal-close" 
                onClick={() => !submitting && setCompletionModal(null)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={submitCompletion} className="completion-form">
              <div className="form-group">
                <label>Upload Proof Photo (Required)</label>
                {!file ? (
                  <div className="upload-trigger-group">
                    <div 
                      className="file-upload-box upload-trigger"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="upload-placeholder">
                        <span className="upload-icon">📤</span>
                        <span>Upload from device</span>
                        <span className="upload-hint">JPEG, PNG, GIF, WebP • Max 5MB</span>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                    </div>
                    <div 
                      className="file-upload-box capture-trigger"
                      onClick={() => cameraInputRef.current?.click()}
                    >
                      <div className="upload-placeholder">
                        <span className="upload-icon">📸</span>
                        <span>Capture photo</span>
                        <span className="upload-hint">Use device camera directly</span>
                      </div>
                      <input
                        type="file"
                        ref={cameraInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="file-upload-box">
                    <div className="file-preview">
                      <img src={URL.createObjectURL(file)} alt="Preview" />
                      <span>{file.name}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Completion Note (Optional)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any notes about the pickup..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setCompletionModal(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting || !file}
                >
                  {submitting ? 'Uploading...' : 'Confirm Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
