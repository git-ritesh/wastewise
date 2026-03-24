import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.data);
        } catch (err) {
          console.error('Failed to load user:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Get dashboard path based on role
  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'collector':
        return '/collector/dashboard';
      case 'user':
      default:
        return '/user/dashboard';
    }
  };

  // Register
  const register = async (userData) => {
    setError(null);
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Login
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: userData } = response.data.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      
      return { user: userData, dashboardPath: getDashboardPath(userData.role) };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    setError(null);
    try {
      const response = await authAPI.verifyOTP({ email, otp });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'OTP verification failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Resend OTP
  const resendOTP = async (email) => {
    setError(null);
    try {
      const response = await authAPI.resendOTP(email);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend OTP';
      setError(message);
      throw new Error(message);
    }
  };

  // Forgot Password
  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await authAPI.forgotPassword(email);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send reset email';
      setError(message);
      throw new Error(message);
    }
  };

  // Reset Password
  const resetPassword = async (email, otp, newPassword) => {
    setError(null);
    try {
      const response = await authAPI.resetPassword({ email, otp, newPassword });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed';
      setError(message);
      throw new Error(message);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    register,
    login,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    logout,
    getDashboardPath,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
