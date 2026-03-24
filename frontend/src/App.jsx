import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import CollectorDashboard from './pages/dashboards/CollectorDashboard';
import UserDashboard from './pages/dashboards/UserDashboard';
import RewardsDashboard from './pages/dashboards/RewardsDashboard';
import IoTDashboard from './pages/dashboards/IoTDashboard';
import './App.css';

const App = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader-large"></div>
        <p>Loading WasteWise...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'collector' ? '/collector/dashboard' : '/user/dashboard'} />
              ) : (
                <Login />
              )
            } 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/" /> : <Register />} 
          />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes - Admin */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/iot"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <IoTDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - Collector */}
          <Route
            path="/collector/dashboard"
            element={
              <ProtectedRoute allowedRoles={['collector']}>
                <CollectorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - User */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route 
             path="/user/rewards" 
             element={
               <ProtectedRoute allowedRoles={['user']}>
                 <RewardsDashboard />
               </ProtectedRoute>
             } 
          />

          {/* Root redirect */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'collector' ? '/collector/dashboard' : '/user/dashboard'} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
