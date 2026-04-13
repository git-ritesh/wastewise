import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import {
  CircleAlert,
  CircleCheck,
  Clock3,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  Trophy,
  UserRound,
  Users,
  Wrench,
  FileWarning
} from 'lucide-react-native';

import client from '../../api/client';
import { logout } from '../../redux/authSlice';
import { COLORS } from '../../utils/constants';

const REPORT_STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' }
];

const ADMIN_SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'Users' },
  { key: 'collectors', label: 'Collectors' },
  { key: 'reports', label: 'Reports' },
  { key: 'leaderboards', label: 'Leaderboards' }
];

const statusColorMap = {
  pending: '#F59E0B',
  assigned: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#10B981',
  cancelled: '#EF4444'
};

const AdminDashboard = () => {
  const dispatch = useDispatch();

  const [section, setSection] = useState('overview');
  const [reportFilter, setReportFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [reports, setReports] = useState([]);
  const [completedReports, setCompletedReports] = useState([]);

  const [selectedReport, setSelectedReport] = useState(null);

  const [newCollectorName, setNewCollectorName] = useState('');
  const [newCollectorEmail, setNewCollectorEmail] = useState('');
  const [newCollectorPhone, setNewCollectorPhone] = useState('');
  const [creatingCollector, setCreatingCollector] = useState(false);

  const fetchAdminStats = async () => {
    const res = await client.get('/admin/stats');
    setStats(res.data?.data || null);
  };

  const fetchUsers = async () => {
    const res = await client.get('/admin/users?role=user');
    setUsers(res.data?.data || []);
  };

  const fetchCollectors = async () => {
    const res = await client.get('/admin/collectors');
    setCollectors(res.data?.data || []);
  };

  const fetchReports = async (status = reportFilter) => {
    const statusQuery = status && status !== 'all' ? `status=${status}&` : '';
    const res = await client.get(`/admin/reports?${statusQuery}limit=100&page=1&sortBy=createdAt&order=desc`);
    setReports(res.data?.data?.reports || []);
  };

  const fetchCompletedReportsForLeaderboard = async () => {
    const res = await client.get('/admin/reports?status=completed&limit=200&page=1&sortBy=createdAt&order=desc');
    setCompletedReports(res.data?.data?.reports || []);
  };

  const fetchAll = async (status = reportFilter) => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(),
        fetchCollectors(),
        fetchReports(status),
        fetchCompletedReportsForLeaderboard()
      ]);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll(reportFilter);
  };

  const onChangeReportFilter = async (status) => {
    setReportFilter(status);
    try {
      setLoading(true);
      await fetchReports(status);
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const onDeleteUser = (userId, userName) => {
    Alert.alert('Delete User', `Delete ${userName}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/admin/users/${userId}`);
            setUsers((prev) => prev.filter((u) => u._id !== userId && u.id !== userId));
          } catch (error) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to delete user');
          }
        }
      }
    ]);
  };

  const onCreateCollector = async () => {
    if (!newCollectorName.trim() || !newCollectorEmail.trim() || !newCollectorPhone.trim()) {
      Alert.alert('Missing fields', 'Name, email, and phone are required.');
      return;
    }

    try {
      setCreatingCollector(true);
      const res = await client.post('/admin/collectors', {
        name: newCollectorName.trim(),
        email: newCollectorEmail.trim().toLowerCase(),
        phone: newCollectorPhone.trim()
      });

      const password = res.data?.data?.generatedPassword;
      Alert.alert(
        'Collector created',
        password
          ? `Collector created successfully. Temporary password: ${password}`
          : 'Collector created successfully.'
      );

      setNewCollectorName('');
      setNewCollectorEmail('');
      setNewCollectorPhone('');

      await fetchCollectors();
      await fetchUsers();
      await fetchAdminStats();
    } catch (error) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create collector');
    } finally {
      setCreatingCollector(false);
    }
  };

  const userLeaderboard = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.rewardPoints || 0) - (a.rewardPoints || 0))
      .slice(0, 10)
      .map((u, index) => ({ ...u, rank: index + 1 }));
  }, [users]);

  const collectorLeaderboard = useMemo(() => {
    const byCollector = {};

    completedReports
      .filter((r) => r.status === 'completed' && r.assignedCollector)
      .forEach((r) => {
        const id = r.assignedCollector?._id || r.assignedCollector?.id;
        if (!id) return;

        if (!byCollector[id]) {
          byCollector[id] = {
            id,
            name: r.assignedCollector?.name || 'Collector',
            completedCount: 0,
            pointsHandled: 0
          };
        }

        byCollector[id].completedCount += 1;
        byCollector[id].pointsHandled += r.rewardPointsEarned || 0;
      });

    return Object.values(byCollector)
      .sort((a, b) => {
        if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
        return b.pointsHandled - a.pointsHandled;
      })
      .slice(0, 10)
      .map((c, index) => ({ ...c, rank: index + 1 }));
  }, [completedReports]);

  const overviewCards = [
    {
      key: 'total',
      label: 'Total Reports',
      value: stats?.reports?.total || 0,
      icon: FileWarning,
      color: '#0EA5E9'
    },
    {
      key: 'pending',
      label: 'Pending',
      value: stats?.reports?.pending || 0,
      icon: Clock3,
      color: '#F59E0B'
    },
    {
      key: 'progress',
      label: 'In Progress',
      value: stats?.reports?.in_progress || 0,
      icon: RefreshCw,
      color: '#8B5CF6'
    },
    {
      key: 'completed',
      label: 'Completed',
      value: stats?.reports?.completed || 0,
      icon: CircleCheck,
      color: '#10B981'
    },
    {
      key: 'points',
      label: 'Points Distributed',
      value: stats?.rewardsDistributed || 0,
      icon: Trophy,
      color: '#16A34A'
    },
    {
      key: 'users',
      label: 'Total Users',
      value: stats?.users?.total || 0,
      icon: Users,
      color: '#2563EB'
    }
  ];

  const renderOverview = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Admin Snapshot</Text>
      <View style={styles.cardsGrid}>
        {overviewCards.map((item) => (
          <View key={item.key} style={styles.statCard}>
            <View style={[styles.cardIcon, { backgroundColor: `${item.color}20` }]}>
              <item.icon size={18} color={item.color} />
            </View>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>User Management</Text>
      {users.length === 0 ? (
        <Text style={styles.emptyText}>No users found.</Text>
      ) : (
        users.map((item) => {
          const id = item._id || item.id;
          return (
            <View key={id} style={styles.listCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{item.name}</Text>
                <Text style={styles.listSubtitle}>{item.email}</Text>
                <Text style={styles.metaText}>Points: {item.rewardPoints || 0}</Text>
              </View>
              <TouchableOpacity style={styles.dangerBtn} onPress={() => onDeleteUser(id, item.name)}>
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </View>
  );

  const renderCollectors = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Collector Feature</Text>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Add Collector</Text>
        <TextInput
          value={newCollectorName}
          onChangeText={setNewCollectorName}
          placeholder="Collector Name"
          style={styles.input}
        />
        <TextInput
          value={newCollectorEmail}
          onChangeText={setNewCollectorEmail}
          placeholder="Collector Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={newCollectorPhone}
          onChangeText={setNewCollectorPhone}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={onCreateCollector} disabled={creatingCollector}>
          {creatingCollector ? <ActivityIndicator color="#fff" /> : <Plus size={18} color="#fff" />}
          <Text style={styles.primaryBtnText}>{creatingCollector ? 'Creating...' : 'Create Collector'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subTitle}>Existing Collectors</Text>
      {collectors.length === 0 ? (
        <Text style={styles.emptyText}>No collectors found.</Text>
      ) : (
        collectors.map((collector) => (
          <View key={collector.id || collector._id} style={styles.listCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>{collector.name}</Text>
              <Text style={styles.listSubtitle}>{collector.email}</Text>
              <Text style={styles.metaText}>Active assignments: {collector.activeAssignments || 0}</Text>
            </View>
            <View style={styles.softBadge}>
              <Wrench size={14} color={COLORS.primary} />
              <Text style={styles.softBadgeText}>Collector</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderReports = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Garbage Reports</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {REPORT_STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, reportFilter === f.key && styles.filterChipActive]}
            onPress={() => onChangeReportFilter(f.key)}
          >
            <Text style={[styles.filterText, reportFilter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {reports.length === 0 ? (
        <Text style={styles.emptyText}>No reports for this status.</Text>
      ) : (
        reports.map((report) => {
          const reportId = report._id || report.id;
          const statusColor = statusColorMap[report.status] || '#64748B';
          return (
            <TouchableOpacity key={reportId} style={styles.listCard} onPress={() => setSelectedReport(report)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{report.title}</Text>
                <Text style={styles.listSubtitle}>{report.location?.address || 'No address'}</Text>
                <Text style={styles.metaText}>Reporter: {report.user?.name || 'Unknown'}</Text>
                <Text style={styles.metaText}>Collector: {report.assignedCollector?.name || 'Unassigned'}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {(report.status || '').replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  const renderLeaderboards = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Leaderboard of Users</Text>
      {userLeaderboard.length === 0 ? (
        <Text style={styles.emptyText}>No user leaderboard data yet.</Text>
      ) : (
        userLeaderboard.map((item) => (
          <View key={item._id || item.id} style={styles.leaderCard}>
            <Text style={styles.rankText}>#{item.rank}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>{item.name}</Text>
              <Text style={styles.listSubtitle}>{item.email}</Text>
            </View>
            <Text style={styles.pointsText}>{item.rewardPoints || 0} pts</Text>
          </View>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: 26 }]}>Collector Leaderboard</Text>
      {collectorLeaderboard.length === 0 ? (
        <Text style={styles.emptyText}>No completed collector tasks yet.</Text>
      ) : (
        collectorLeaderboard.map((item) => (
          <View key={item.id} style={styles.leaderCard}>
            <Text style={styles.rankText}>#{item.rank}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>{item.name}</Text>
              <Text style={styles.listSubtitle}>{item.completedCount} completed tasks</Text>
            </View>
            <Text style={styles.pointsText}>{item.pointsHandled} pts</Text>
          </View>
        ))
      )}
    </View>
  );

  const renderSectionContent = () => {
    if (section === 'overview') return renderOverview();
    if (section === 'users') return renderUsers();
    if (section === 'collectors') return renderCollectors();
    if (section === 'reports') return renderReports();
    return renderLeaderboards();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>Admin Dashboard</Text>
            <Text style={styles.headerTitle}>WasteWise Control Center</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
            <LogOut size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          contentContainerStyle={{ paddingBottom: 36 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabs}>
            {ADMIN_SECTIONS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.tabBtn, section === item.key && styles.tabBtnActive]}
                onPress={() => setSection(item.key)}
              >
                <Text style={[styles.tabBtnText, section === item.key && styles.tabBtnTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            renderSectionContent()
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={!!selectedReport} transparent animationType="slide" onRequestClose={() => setSelectedReport(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedReport?.title}</Text>
            <Text style={styles.modalText}>Status: {(selectedReport?.status || '').replace('_', ' ')}</Text>
            <Text style={styles.modalText}>Reporter: {selectedReport?.user?.name || 'Unknown'}</Text>
            <Text style={styles.modalText}>Collector: {selectedReport?.assignedCollector?.name || 'Unassigned'}</Text>
            <Text style={styles.modalText}>Location: {selectedReport?.location?.address || 'Not provided'}</Text>
            <Text style={styles.modalText}>Points: {selectedReport?.rewardPointsEarned || 0}</Text>
            <Text style={styles.modalDescription}>{selectedReport?.description || 'No description'}</Text>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedReport(null)}>
              <CircleAlert size={16} color="#fff" />
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1, paddingHorizontal: 16 },
  header: {
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerEyebrow: { color: '#64748B', fontFamily: 'Inter_500Medium', fontSize: 12 },
  headerTitle: { color: '#0F172A', fontFamily: 'Outfit_700Bold', fontSize: 22 },
  logoutBtn: {
    backgroundColor: '#0F766E',
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTabs: { paddingVertical: 6, gap: 8 },
  tabBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12
  },
  tabBtnActive: { backgroundColor: '#064E3B' },
  tabBtnText: { color: '#1F2937', fontFamily: 'Outfit_600SemiBold' },
  tabBtnTextActive: { color: '#fff' },
  loaderWrap: { marginTop: 40, alignItems: 'center' },

  sectionContainer: { marginTop: 12 },
  sectionTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#0F172A', marginBottom: 12 },
  subTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 17, color: '#1E293B', marginBottom: 10 },

  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  statValue: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#0F172A' },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B' },

  listCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  listTitle: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#0F172A' },
  listSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#475569' },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', marginTop: 4 },
  emptyText: { fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 4 },

  dangerBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2'
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14
  },
  formTitle: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#0F172A', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontFamily: 'Inter_400Regular'
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#065F46',
    borderRadius: 10,
    paddingVertical: 10
  },
  primaryBtnText: { color: '#fff', fontFamily: 'Outfit_700Bold' },

  softBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  softBadgeText: { color: '#065F46', fontFamily: 'Outfit_600SemiBold', fontSize: 12 },

  filterRow: { gap: 8, paddingBottom: 8 },
  filterChip: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  filterChipActive: { backgroundColor: '#065F46' },
  filterText: { color: '#334155', fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  filterTextActive: { color: '#fff' },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start'
  },
  statusText: { fontFamily: 'Outfit_700Bold', fontSize: 10 },

  leaderCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  rankText: { width: 36, fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#0F172A' },
  pointsText: { fontFamily: 'Outfit_700Bold', color: '#047857' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    minHeight: 280
  },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#0F172A', marginBottom: 10 },
  modalText: { fontFamily: 'Inter_400Regular', color: '#334155', marginBottom: 6 },
  modalDescription: {
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    color: '#334155',
    fontFamily: 'Inter_400Regular'
  },
  modalCloseBtn: {
    marginTop: 16,
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  modalCloseText: { color: '#fff', fontFamily: 'Outfit_700Bold' }
});

export default AdminDashboard;
