import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [sent, setSent] = useState(false);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email' });
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await forgotPassword(email);
      setSent(true);
      setMessage({ type: 'success', text: 'Password reset OTP sent to your email!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🔑</div>
          <h1>Forgot Password?</h1>
          <p>No worries, we'll send you reset instructions</p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            <span className="alert-icon">{message.type === 'error' ? '⚠️' : '✅'}</span>
            {message.text}
          </div>
        )}

        {!sent ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : 'Send Reset OTP'}
            </button>
          </form>
        ) : (
          <div className="success-action">
            <Link to="/reset-password" state={{ email }} className="btn btn-primary btn-full">
              Enter Reset OTP
            </Link>
          </div>
        )}

        <div className="auth-footer">
          <p><Link to="/login">← Back to Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
