import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  Linking,
  Modal,
  Platform,
  Dimensions
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, ClipboardList, MapPin, Clock, ChevronRight } from 'lucide-react-native';
import client from '../../api/client';
import { logout } from '../../redux/authSlice';
import { COLORS } from '../../utils/constants';
import { useRealtime } from '../../context/RealtimeContext';

const { width } = Dimensions.get('window');

const CollectorDashboard = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewTask, setPreviewTask] = useState(null);
  const [previewCoords, setPreviewCoords] = useState(null);
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const { revision } = useRealtime();

  const fetchTasks = async () => {
    try {
      const res = await client.get('/collector/tasks');
      if (res.data.success) {
        setTasks(res.data.data.tasks);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (revision > 0) {
      fetchTasks();
    }
  }, [revision]);

  const resolveTaskCoordinates = (task) => {
    const location = task?.location || {};
    const coordinates = location.coordinates || {};

    const latCandidate = coordinates.lat ?? location.latitude ?? location.lat;
    const lngCandidate = coordinates.lng ?? location.longitude ?? location.lng;

    const lat = Number(latCandidate);
    const lng = Number(lngCandidate);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    if (lat === 0 && lng === 0) {
      return null;
    }

    return { lat, lng };
  };

  const openNavigation = async (coords) => {
    if (!coords) {
      Alert.alert('Location Missing', 'This task does not have valid coordinates for navigation.');
      return;
    }

    const { lat, lng } = coords;
    const primaryUrl = Platform.OS === 'android'
      ? `google.navigation:q=${lat},${lng}`
      : `http://maps.apple.com/?daddr=${lat},${lng}`;
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    try {
      const canOpenPrimary = await Linking.canOpenURL(primaryUrl);
      await Linking.openURL(canOpenPrimary ? primaryUrl : fallbackUrl);
    } catch (error) {
      console.error('Navigation launch error:', error);
      Alert.alert('Navigation Error', 'Unable to open map navigation right now.');
    }
  };

  const openPreview = (task) => {
    const coords = resolveTaskCoordinates(task);

    if (!coords) {
      Alert.alert('Location Missing', 'This task does not have valid coordinates for navigation.');
      return;
    }

    setPreviewTask(task);
    setPreviewCoords(coords);
  };

  const closePreview = () => {
    setPreviewTask(null);
    setPreviewCoords(null);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('TaskDetail', { task: item })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.taskIcon}>
          <ClipboardList size={22} color={COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <DisplayStatus status={item.status} />
        </View>
      </View>
      
      <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <MapPin size={14} color="#94A3B8" />
          <Text style={styles.infoText} numberOfLines={1}>{item.location?.address || 'View on Map'}</Text>
        </View>
        <TouchableOpacity
          style={styles.navigateBtn}
          onPress={() => openPreview(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.navigateBtnText}>Preview</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#064E3B', '#10B981']} style={styles.topBar}>
        <SafeAreaView>
          <View style={styles.topContent}>
            <View>
              <Text style={styles.greeting}>Collector Portal</Text>
              <Text style={styles.userName}>{user?.name || 'Collector'}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
              <LogOut size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assigned Tasks</Text>
          <Text style={styles.taskCount}>{tasks.length} Active</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={tasks}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={fetchTasks}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ClipboardList size={60} color="#E2E8F0" />
                <Text style={styles.empty}>No tasks assigned</Text>
                <Text style={styles.emptySub}>Check back later for new duties.</Text>
              </View>
            }
          />
        )}
      </View>

      <Modal
        visible={!!previewTask && !!previewCoords}
        transparent
        animationType="slide"
        onRequestClose={closePreview}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Route Preview</Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>
              {previewTask?.location?.address || 'Selected destination'}
            </Text>

            {previewCoords && (
              <MapView
                style={styles.previewMap}
                initialRegion={{
                  latitude: previewCoords.lat,
                  longitude: previewCoords.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01
                }}
              >
                <Marker
                  coordinate={{
                    latitude: previewCoords.lat,
                    longitude: previewCoords.lng
                  }}
                  title={previewTask?.title || 'Destination'}
                  description={previewTask?.location?.address || 'Task destination'}
                />
              </MapView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnOutline} onPress={closePreview}>
                <Text style={styles.modalBtnOutlineText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={async () => {
                  await openNavigation(previewCoords);
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>Open in Google Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DisplayStatus = ({ status }) => {
  const isDone = status === 'completed';
  const color = isDone ? '#10B981' : status === 'in_progress' ? '#F59E0B' : '#64748B';
  return (
    <View style={[styles.badge, { backgroundColor: color + '15' }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{status.replace('_', ' ').toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { paddingHorizontal: 25, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  topContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  greeting: { fontSize: 14, fontFamily: 'Outfit_400Regular', color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: '#fff' },
  logoutBtn: { width: 45, height: 45, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 25, marginTop: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: '#1E293B' },
  taskCount: { fontSize: 13, fontFamily: 'Outfit_600SemiBold', color: COLORS.primary, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  list: { paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  taskIcon: { width: 45, height: 45, backgroundColor: '#F0FDF4', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  headerText: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 17, fontFamily: 'Outfit_700Bold', color: '#1E293B', flex: 1, marginRight: 10 },
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#64748B', marginBottom: 15, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  infoText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#94A3B8' },
  navigateBtn: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  navigateBtnText: { color: '#047857', fontSize: 11, fontFamily: 'Outfit_700Bold' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 10 },
  modalTitle: { fontSize: 18, color: '#0F172A', fontFamily: 'Outfit_700Bold' },
  modalSubtitle: { marginTop: 4, marginBottom: 12, color: '#64748B', fontSize: 13, fontFamily: 'Inter_400Regular' },
  previewMap: { width: '100%', height: 220, borderRadius: 14, overflow: 'hidden' },
  modalActions: { marginTop: 14, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  modalBtnOutline: { flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  modalBtnOutlineText: { color: '#334155', fontSize: 13, fontFamily: 'Outfit_600SemiBold' },
  modalBtnPrimary: { flex: 1.4, backgroundColor: '#059669', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  modalBtnPrimaryText: { color: '#fff', fontSize: 13, fontFamily: 'Outfit_700Bold' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 5 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontFamily: 'Outfit_700Bold' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#64748B', marginTop: 20 },
  emptySub: { fontSize: 14, color: '#94A3B8', marginTop: 5 }
});

export default CollectorDashboard;
