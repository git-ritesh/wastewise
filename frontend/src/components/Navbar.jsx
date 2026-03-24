import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const { user, isAuthenticated, logout, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🌿</span>
          <span className="brand-text">WasteWise</span>
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to={getDashboardPath(user?.role)} className="nav-link">
                Dashboard
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin/iot" className="nav-link">
                  IoT Monitor
                </Link>
              )}
              {user?.role === 'user' && (
                <Link to="/user/rewards" className="nav-link">
                  Rewards
                </Link>
              )}
              <NotificationCenter />
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className={`role-badge role-${user?.role}`}>
                  {user?.role}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
