import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './ProfileCard.css';

const ProfileCard = ({ user, leaderboard }) => {
  const navigate = useNavigate();
  const { changePassword, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  if (!user) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });

    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatus({ type: 'error', message: 'Please fill in all password fields.' });
      return;
    }

    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(oldPassword, newPassword);
      setStatus({ type: 'success', message: 'Password updated. Please sign in again.' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      logout();
      navigate('/login');
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to change password.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} />
          ) : (
            <span>{user.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p className="profile-email">{user.email}</p>
          <span className="member-since">Member since {formatDate(user.memberSince)}</span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat reward-points">
          <div className="stat-icon-wrapper">
            <span>🏆</span>
          </div>
          <div className="stat-details">
            <span className="stat-label">Reward Points</span>
            <span className="stat-number">{user.rewardPoints?.toLocaleString() || 0}</span>
          </div>
        </div>

        <div className="profile-stat leaderboard-rank">
          <div className="stat-icon-wrapper">
            <span>📊</span>
          </div>
          <div className="stat-details">
            <span className="stat-label">Leaderboard Rank</span>
            <span className="stat-number">#{leaderboard?.position || '-'}</span>
          </div>
        </div>

        <div className="profile-stat percentile">
          <div className="stat-icon-wrapper">
            <span>⭐</span>
          </div>
          <div className="stat-details">
            <span className="stat-label">Top Percentile</span>
            <span className="stat-number">{leaderboard?.percentile || 0}%</span>
          </div>
        </div>
      </div>

      <div className="profile-contact">
        <div className="contact-item">
          <span className="contact-icon">📱</span>
          <span>{user.phone}</span>
        </div>
        {user.address && (
          <div className="contact-item">
            <span className="contact-icon">📍</span>
            <span>{user.address}</span>
          </div>
        )}
      </div>

      <div className="password-section">
        <h3>Change Password</h3>
        <p className="password-help">Use your current password to set a new one.</p>
        <form className="password-change-form" onSubmit={handlePasswordChange}>
          <div className="password-field">
            <label htmlFor={`oldPassword-${user.id || user.email}`}>Old Password</label>
            <input
              id={`oldPassword-${user.id || user.email}`}
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="password-field">
            <label htmlFor={`newPassword-${user.id || user.email}`}>New Password</label>
            <input
              id={`newPassword-${user.id || user.email}`}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="password-field">
            <label htmlFor={`confirmPassword-${user.id || user.email}`}>Confirm New Password</label>
            <input
              id={`confirmPassword-${user.id || user.email}`}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="password-actions">
            <span className={`password-feedback ${status.type}`}>{status.message}</span>
            <button type="submit" className="btn btn-primary password-submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCard;
