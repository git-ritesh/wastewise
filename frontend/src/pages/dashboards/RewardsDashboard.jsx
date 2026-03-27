import { useEffect, useState } from 'react';
import { rewardAPI } from '../../services/api';
import './RewardsDashboard.css';

const RewardsDashboard = () => {
  const [history, setHistory] = useState([]);
  const [balance, setBalance] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [catalog, setCatalog] = useState([]); // New state for catalog
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('store'); // Default to store now
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Selected item for redemption
  
  // Redemption Form State
  const [redeemAmount, setRedeemAmount] = useState(100);
  const [paymentInfo, setPaymentInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [historyRes, leaderboardRes, catalogRes] = await Promise.all([
        rewardAPI.getHistory(),
        rewardAPI.getLeaderboard(10),
        rewardAPI.getCatalog()
      ]);

      setHistory(historyRes.data.data.history);
      setBalance(historyRes.data.data.pointsBalance);
      setLeaderboard(leaderboardRes.data.data.leaderboard);
      setUserRank(leaderboardRes.data.data.userRank);
      setCatalog(catalogRes.data.data);
    } catch (error) {
      console.error('Error fetching rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setRedeemAmount(item.pointsCost); // Set amount to item cost
    setShowRedeemModal(true);
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // If redeeming a specific item, pass its details
      const redemptionData = {
        amount: selectedItem ? selectedItem.pointsCost : parseInt(redeemAmount),
        method: selectedItem ? selectedItem.category : 'custom',
        paymentInfo: `Item: ${selectedItem ? selectedItem.name : 'Custom Redemption'} | ${paymentInfo}`
      };

      await rewardAPI.redeemPoints(redemptionData);
      
      alert('Redemption request submitted successfully!');
      setShowRedeemModal(false);
      setSelectedItem(null);
      setPaymentInfo('');
      fetchData();
    } catch (error) {
      console.error('Redemption error:', error);
      alert(error.response?.data?.message || 'Error processing redemption');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="rewards-dashboard">
      <div className="rewards-header">
        <div className="header-content">
          <h1>Rewards Store</h1>
          <p>Redeem your hard-earned points for exciting rewards!</p>
        </div>
        <div className="points-balance-card">
          <span className="balance-label">Your Balance</span>
          <div className="balance-value">
            <span className="coin-icon">🪙</span>
            {balance}
          </div>
        </div>
      </div>

      <div className="rewards-content">
        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            Store
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <div className="tab-content">
            {activeTab === 'store' && (
              <div className="store-grid">
                {catalog.map(item => (
                  <div key={item._id} className="reward-card">
                    <div className="reward-image">
                      <img src={item.image} alt={item.name} />
                      <span className="reward-cost">{item.pointsCost} pts</span>
                    </div>
                    <div className="reward-info">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <button 
                        className="btn btn-primary full-width"
                        onClick={() => handleItemClick(item)}
                        disabled={balance < item.pointsCost}
                      >
                        {balance < item.pointsCost ? 'Insufficient Points' : 'Redeem'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="history-list">
                {/* ... existing history code ... */}
                {history.length === 0 ? (
                  <div className="empty-state">No history yet</div>
                ) : (
                  history.map(item => (
                    <div key={item._id} className="history-item">
                       <span className={`points-amount ${item.type}`}>
                          {item.type === 'earned' ? '+' : ''}{item.amount}
                        </span>
                        <div className="history-details">
                          <h4>{item.description}</h4>
                          <span className="history-date">{formatDate(item.createdAt)}</span>
                        </div>
                        <span className={`status-badge ${item.status}`}>{item.status}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'leaderboard' && (
               <div className="leaderboard-list">
                 {/* ... existing leaderboard code ... */}
                  {leaderboard.map((u, i) => (
                    <div key={u._id} className="leaderboard-item">
                      <span>#{i+1} {u.name}</span>
                      <span>{u.rewardPoints} pts</span>
                    </div>
                  ))}
               </div>
            )}
          </div>
        )}
      </div>

      {/* Redemption Modal */}
      {showRedeemModal && (
        <div className="modal-overlay" onClick={() => setShowRedeemModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedItem ? 'Confirm Redemption' : 'Redeem Points'}</h2>
              <button className="modal-close" onClick={() => setShowRedeemModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleRedeem} className="redeem-form">
              {selectedItem && (
                <div className="selected-item-preview">
                  <img src={selectedItem.image} alt={selectedItem.name} height="50" />
                  <div>
                    <h4>{selectedItem.name}</h4>
                    <p>{selectedItem.pointsCost} Points</p>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Details (Email/UPI/Address)</label>
                <textarea
                  value={paymentInfo}
                  onChange={e => setPaymentInfo(e.target.value)}
                  placeholder="Enter where to send the reward..."
                  required
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <p className="balance-check">
                  Remaining after: {balance - (selectedItem?.pointsCost || redeemAmount)}
                </p>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsDashboard;
