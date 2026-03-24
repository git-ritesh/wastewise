const ProfileCard = ({ user, leaderboard }) => {
  if (!user) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
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
    </div>
  );
};

export default ProfileCard;
