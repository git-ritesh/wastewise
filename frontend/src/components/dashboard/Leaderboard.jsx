const Leaderboard = ({ data, currentUserId }) => {
  if (!data || !data.leaderboard) return null;

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <div className="leaderboard-card">
      <div className="leaderboard-header">
        <h2>🏆 Leaderboard</h2>
        <span className="your-rank">Your Rank: #{data.currentUserRank}</span>
      </div>

      <div className="leaderboard-list">
        {data.leaderboard.map((user, index) => (
          <div 
            key={user.id} 
            className={`leaderboard-item ${user.id === currentUserId ? 'current-user' : ''}`}
          >
            <div className="rank-badge">
              {getRankBadge(user.rank)}
            </div>
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="user-details">
              <span className="user-name">
                {user.name}
                {user.id === currentUserId && <span className="you-badge">You</span>}
              </span>
              <span className="user-points">{user.rewardPoints?.toLocaleString()} points</span>
            </div>
            {index < 3 && (
              <div className="top-badge">
                <span>Top {index + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
