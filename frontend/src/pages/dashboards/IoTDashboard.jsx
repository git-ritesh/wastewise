import React, { useState, useEffect } from 'react';
import  iotAPI  from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import './IoTDashboard.css';

const IoTDashboard = () => {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useNotification();

  useEffect(() => {
    fetchBins();

    // Listen for real-time updates
    if (socket) {
      socket.on('bin_update', (updatedBin) => {
        setBins(prevBins => {
          const exists = prevBins.find(b => b.binId === updatedBin.binId);
          if (exists) {
            return prevBins.map(b => b.binId === updatedBin.binId ? updatedBin : b);
          } else {
            return [...prevBins, updatedBin];
          }
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('bin_update');
      }
    };
  }, [socket]);

  const fetchBins = async () => {
    try {
      const res = await iotAPI.getBins();
      setBins(res.data.data);
    } catch (error) {
      console.error('Error fetching bins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return '#ef4444'; // Red
    if (percentage >= 70) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const getFillHeight = (percentage) => {
    return `${Math.min(100, Math.max(0, percentage))}%`;
  };

  return (
    <div className="iot-dashboard">
      <div className="iot-header">
        <h1>Smart Bin Monitoring</h1>
        <p>Real-time fill levels and status of IoT-enabled dustbins.</p>
        <div className="iot-stats">
          <div className="stat-item">
            <span className="stat-value">{bins.length}</span>
            <span className="stat-label">Total Bins</span>
          </div>
          <div className="stat-item">
            <span className="stat-value error">
              {bins.filter(b => b.fillLevel >= 90).length}
            </span>
            <span className="stat-label">Critical</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading IoT Data...</div>
      ) : (
        <div className="bins-grid">
          {bins.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📡</span>
              <p>No active smart bins found.</p>
            </div>
          ) : (
            bins.map(bin => (
              <div key={bin.binId} className={`bin-card ${bin.fillLevel >= 90 ? 'critical' : ''}`}>
                <div className="bin-header">
                  <h3>{bin.binId}</h3>
                  <span className={`status-dot ${bin.status}`}></span>
                </div>
                
                <div className="bin-viz-container">
                  <div className="bin-graphic">
                    <div 
                      className="bin-fill" 
                      style={{ 
                        height: getFillHeight(bin.fillLevel),
                        backgroundColor: getStatusColor(bin.fillLevel)
                      }}
                    ></div>
                    <div className="bin-lines">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                  <div className="bin-percentage">
                    {bin.fillLevel}%
                  </div>
                </div>

                <div className="bin-details">
                  <p className="location">📍 {bin.location?.address || 'Startiot, Unknown'}</p>
                  <p className="last-updated">
                    🕒 {new Date(bin.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>

                <div className="bin-actions">
                  <button className="btn-locate">View on Map</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default IoTDashboard;
