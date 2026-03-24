import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  Camera, 
  MapPin, 
  Award, 
  LogOut,
  TrendingUp
} from 'lucide-react-native';
import { logout } from '../../redux/authSlice';
import { COLORS } from '../../utils/constants';
import client from '../../api/client';

const UserDashboard = ({ navigation }) => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await client.get('/dashboard');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const stats = [
    { label: 'Reports', value: dashboardData?.stats?.total || '0', icon: Camera, color: '#10B981' },
    { label: 'Rank', value: `#${dashboardData?.leaderboard?.position || '-'}`, icon: Award, color: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <LinearGradient
          colors={['#064E3B', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        >
          <SafeAreaView>
            <View style={styles.topNav}>
              <View>
                <Text style={styles.greeting}>Good Morning,</Text>
                <Text style={styles.userName}>{dashboardData?.user?.name || user?.name || 'User'}</Text>
              </View>
              <View style={styles.topActions}>
                <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Notifications')}>
                  <Bell size={22} color="#fff" />
                  {dashboardData?.unreadCount > 0 && <View style={styles.badge} />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.pointsCard}>
              <View style={styles.pointsInfo}>
                <Text style={styles.pointsTitle}>Your Balance</Text>
                <View style={styles.pointsRow}>
                  <Text style={styles.pointsValue}>{dashboardData?.user?.rewardPoints || 0}</Text>
                  <Text style={styles.pointsUnit}> Points</Text>
                </View>
                <TouchableOpacity style={styles.redeemBtn} onPress={() => navigation.navigate('Rewards')}>
                  <Text style={styles.redeemText}>Earn more ➔</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chartPlaceholder}>
                <TrendingUp size={60} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.statsRow}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <stat.icon size={20} color={stat.color} />
              </View>
              <View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: '#ECFDF5' }]} 
              onPress={() => navigation.navigate('Report')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                <Camera size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Report Waste</Text>
              <Text style={styles.actionDesc}>Upload photo & location</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: '#EFF6FF' }]} 
              onPress={() => navigation.navigate('Map')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
                <MapPin size={24} color="#fff" />
              </View>
              <Text style={styles.actionText}>Find Bins</Text>
              <Text style={styles.actionDesc}>View nearby dustbins</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Rewards')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {dashboardData?.recentActivity?.length > 0 ? (
            dashboardData.recentActivity.map((activity, i) => (
              <TouchableOpacity key={i} style={styles.historyRow} onPress={() => navigation.navigate('Rewards')}>
                <View style={styles.historyIcon}>
                  <Award size={20} color="#10B981" />
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyName}>{activity.description}</Text>
                  <Text style={styles.historyDate}>{new Date(activity.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.historyPoints}>{activity.amount > 0 ? '+' : ''}{activity.amount}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyText}>No recent activity found.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => dispatch(logout())}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  headerBackground: { paddingHorizontal: 25, paddingBottom: 60, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 30 },
  greeting: { fontSize: 16, fontFamily: 'Outfit_400Regular', color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: '#fff' },
  topActions: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 45, height: 45, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 4, borderWidth: 2, borderColor: '#10B981' },
  pointsCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 25, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  pointsInfo: { flex: 1 },
  pointsTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'Inter_400Regular' },
  pointsRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 5 },
  pointsValue: { color: '#fff', fontSize: 32, fontFamily: 'Outfit_700Bold' },
  pointsUnit: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontFamily: 'Outfit_600SemiBold' },
  redeemBtn: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginTop: 15 },
  redeemText: { color: '#064E3B', fontSize: 12, fontFamily: 'Outfit_700Bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 25, marginTop: -30, gap: 15 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#1E293B' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B' },
  section: { paddingHorizontal: 25, marginTop: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: '#1E293B', marginBottom: 15 },
  viewAll: { color: '#10B981', fontFamily: 'Outfit_600SemiBold' },
  actionGrid: { flexDirection: 'row', gap: 15 },
  actionCard: { flex: 1, padding: 20, borderRadius: 25, elevation: 2 },
  actionIcon: { width: 50, height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  actionText: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#1E293B' },
  actionDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 4 },
  historyRow: { backgroundColor: '#fff', padding: 15, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1 },
  historyIcon: { width: 40, height: 40, backgroundColor: '#F0FDF4', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  historyContent: { flex: 1 },
  historyName: { fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: '#1E293B' },
  historyDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  historyPoints: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#10B981' },
  emptyActivity: { padding: 30, alignItems: 'center', backgroundColor: '#fff', borderRadius: 20 },
  emptyText: { color: '#94A3B8', fontFamily: 'Inter_400Regular' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 8, paddingBottom: 20 },
  logoutText: { color: '#EF4444', fontFamily: 'Outfit_700Bold', fontSize: 16 },
});

export default UserDashboard;
