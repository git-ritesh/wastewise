import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI } from '../../services/api';
import ProfileCard from '../../components/dashboard/ProfileCard';
import StatsGrid from '../../components/dashboard/StatsGrid';
import ReportsList from '../../components/dashboard/ReportsList';
import Leaderboard from '../../components/dashboard/Leaderboard';
import CreateReportModal from '../../components/dashboard/CreateReportModal';
import './Dashboard.css';

const UserDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [reports, setReports] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchDashboardData();
    fetchReports();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    fetchReports(activeTab);
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchReports = async (status = 'all', page = 1) => {
    try {
      const response = await dashboardAPI.getReports({ status, page, limit: 5 });
      setReports(response.data.data.reports);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await dashboardAPI.getLeaderboard(10);
      setLeaderboard(response.data.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleCreateReport = async (reportData) => {
    try {
      await dashboardAPI.createReport(reportData);
      setShowCreateModal(false);
      fetchReports(activeTab);
      fetchDashboardData();
    } catch (error) {
      throw error;
    }
  };

  const handleCancelReport = async (reportId) => {
    try {
      await dashboardAPI.cancelReport(reportId);
      fetchReports(activeTab);
      fetchDashboardData();
    } catch (error) {
      console.error('Error cancelling report:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader-large"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, <span className="highlight">{user?.name}</span>! 👋</h1>
          <p>Track your waste reports and earn rewards for keeping the environment clean.</p>
        </div>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => setShowCreateModal(true)}
        >
          <span>📝</span> Report Garbage
        </button>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid-layout">
        {/* Left Column */}
        <div className="dashboard-left">
          <ProfileCard 
            user={dashboardData?.user} 
            leaderboard={dashboardData?.leaderboard} 
          />
          <Leaderboard 
            data={leaderboard} 
            currentUserId={user?.id} 
          />
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          <StatsGrid stats={dashboardData?.stats} />
          <ReportsList 
            reports={reports}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onCancel={handleCancelReport}
            pagination={pagination}
            onPageChange={(page) => fetchReports(activeTab, page)}
          />
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateModal && (
        <CreateReportModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateReport}
        />
      )}
    </div>
  );
};

export default UserDashboard;
