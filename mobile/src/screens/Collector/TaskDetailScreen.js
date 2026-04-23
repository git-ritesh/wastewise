import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Linking,
  Platform,
  Dimensions
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, MapPin, CheckCircle2 } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../utils/constants';
import { useRealtime } from '../../context/RealtimeContext';

const { width } = Dimensions.get('window');

const TaskDetailScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const [taskState, setTaskState] = useState(task);
  const [image, setImage] = useState(null);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [trackingDistanceKm, setTrackingDistanceKm] = useState(null);
  const { revision } = useRealtime();

  const refreshTaskState = async () => {
    try {
      const res = await client.get('/collector/tasks');
      if (res.data.success) {
        const latestTask = (res.data?.data?.tasks || []).find((item) => item._id === task._id);
        if (latestTask) {
          setTaskState(latestTask);
        }
      }
    } catch (error) {
      console.error('Refresh task state error:', error);
    }
  };

  useEffect(() => {
    if (revision > 0) {
      refreshTaskState();
    }
  }, [revision]);

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const completeTask = async () => {
    if (!image) {
      Alert.alert('Proof Required', 'Please take a photo required for completion proof.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('proof', {
      uri: image,
      name: 'proof.jpg',
      type: 'image/jpeg',
    });
    formData.append('note', note);

    try {
      const res = await client.post(`/collector/tasks/${taskState._id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setTaskState(res.data.data);
        Alert.alert('Success', 'Task marked as completed!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update task.');
    } finally {
      setUploading(false);
    }
  };

  const resolveTaskCoordinates = () => {
    const location = taskState?.location || {};
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

  const calculateDistanceKm = (origin, destination) => {
    if (!origin || !destination) return null;

    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latDelta = toRadians(destination.lat - origin.lat);
    const lngDelta = toRadians(destination.lng - origin.lng);

    const a =
      Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
      Math.cos(toRadians(origin.lat)) *
        Math.cos(toRadians(destination.lat)) *
        Math.sin(lngDelta / 2) *
        Math.sin(lngDelta / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  };

  useEffect(() => {
    let locationSubscription;

    const startTracking = async () => {
      const destination = resolveTaskCoordinates();
      if (!destination) {
        setTrackingError('Destination coordinates are missing for this task.');
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setTrackingError('Location permission is required for live map tracking.');
        return;
      }

      setTrackingError('');
      setIsTracking(true);

      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const initialPoint = {
        lat: initialLocation.coords.latitude,
        lng: initialLocation.coords.longitude,
      };
      setCurrentPosition(initialPoint);
      setTrackingDistanceKm(calculateDistanceKm(initialPoint, destination));

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (position) => {
          const point = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setCurrentPosition(point);
          setTrackingDistanceKm(calculateDistanceKm(point, destination));
        }
      );
    };

    startTracking().catch((error) => {
      console.error('Live tracking error:', error);
      setTrackingError('Unable to start live tracking right now.');
      setIsTracking(false);
    });

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      setIsTracking(false);
    };
  }, [taskState._id]);

  const handleNavigate = async () => {
    const coords = resolveTaskCoordinates();

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

  const destinationCoords = resolveTaskCoordinates();

  const trackingPoints = [];
  if (currentPosition) {
    trackingPoints.push({
      latitude: currentPosition.lat,
      longitude: currentPosition.lng,
    });
  }
  if (destinationCoords) {
    trackingPoints.push({
      latitude: destinationCoords.lat,
      longitude: destinationCoords.lng,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: taskState.status === 'completed' ? '#ECFDF5' : '#FEF3C7' }]}>
            <View style={[styles.statusDot, { backgroundColor: taskState.status === 'completed' ? '#10B981' : '#F59E0B' }]} />
            <Text style={[styles.statusText, { color: taskState.status === 'completed' ? '#10B981' : '#B45309' }]}>
              {taskState.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.taskTitle}>{taskState.title}</Text>
          <Text style={styles.taskDesc}>{taskState.description}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoIconBg}>
              <MapPin size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{taskState.location?.address || 'Near Downtown'}</Text>
            </View>
          </View>

          <Text style={styles.navSectionTitle}>Navigation</Text>
          <View style={styles.navActionRow}>
            <TouchableOpacity style={styles.googleMapsButton} onPress={handleNavigate} activeOpacity={0.85}>
              <Text style={styles.googleMapsButtonText}>Google Maps</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.liveMapSection}>
            <Text style={styles.liveMapTitle}>Live Map Tracking</Text>
            <Text style={styles.liveMapMeta}>
              {destinationCoords
                ? taskState.location?.address || 'Task destination'
                : 'Location unavailable for this task'}
            </Text>

            {trackingError ? <Text style={styles.trackingErrorText}>{trackingError}</Text> : null}

            <View style={styles.trackingInfoRow}>
              <View style={styles.trackingBadge}>
                <Text style={styles.trackingBadgeLabel}>Tracking</Text>
                <Text style={styles.trackingBadgeValue}>{isTracking ? 'LIVE' : 'OFF'}</Text>
              </View>
              <View style={styles.trackingBadge}>
                <Text style={styles.trackingBadgeLabel}>Distance</Text>
                <Text style={styles.trackingBadgeValue}>
                  {trackingDistanceKm != null ? `${trackingDistanceKm.toFixed(2)} km` : '--'}
                </Text>
              </View>
            </View>

            {destinationCoords ? (
              <MapView
                style={styles.inlineMap}
                initialRegion={{
                  latitude: destinationCoords.lat,
                  longitude: destinationCoords.lng,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }}
                showsUserLocation
                showsMyLocationButton
              >
                <Marker
                  coordinate={{
                    latitude: destinationCoords.lat,
                    longitude: destinationCoords.lng,
                  }}
                  title={taskState.title || 'Destination'}
                  description={taskState.location?.address || 'Task destination'}
                />

                {currentPosition ? (
                  <Marker
                    coordinate={{
                      latitude: currentPosition.lat,
                      longitude: currentPosition.lng,
                    }}
                    pinColor="#10B981"
                    title="Current position"
                    description="Collector live location"
                  />
                ) : null}

                {trackingPoints.length === 2 ? (
                  <Polyline
                    coordinates={trackingPoints}
                    strokeColor="#22C55E"
                    strokeWidth={4}
                  />
                ) : null}
              </MapView>
            ) : (
              <View style={styles.mapFallbackBox}>
                <Text style={styles.mapFallbackText}>Unable to load map preview for this task.</Text>
              </View>
            )}
          </View>
        </View>

        {taskState.status !== 'completed' && (
          <View style={styles.completionSection}>
            <Text style={styles.sectionTitle}>Submit Proof</Text>
            
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.preview} />
              ) : (
                <View style={styles.placeholder}>
                  <View style={styles.cameraCircle}>
                    <Camera size={32} color={COLORS.primary} />
                  </View>
                  <Text style={styles.placeholderText}>Take photo of cleaned area</Text>
                  <Text style={styles.placeholderSub}>Evidence is required for verification</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Add a closing note (optional)..."
                value={note}
                onChangeText={setNote}
                multiline
                placeholderTextColor="#94A3B8"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, uploading && styles.disabled]} 
              onPress={completeTask}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnContent}>
                  <CheckCircle2 size={22} color="#fff" />
                  <Text style={styles.btnText}>Mark Task as Completed</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: '#1E293B' },
  backBtn: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  statusSection: { paddingHorizontal: 25, marginTop: 10, alignItems: 'flex-start' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: 'Outfit_700Bold' },
  card: { backgroundColor: '#fff', margin: 25, borderRadius: 30, padding: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  taskTitle: { fontSize: 22, fontFamily: 'Outfit_700Bold', color: '#1E293B', marginBottom: 10 },
  taskDesc: { fontSize: 15, fontFamily: 'Inter_400Regular', color: '#475569', lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoIconBg: { width: 45, height: 45, backgroundColor: '#F0FDF4', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#94A3B8', fontFamily: 'Inter_400Regular', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1E293B', fontFamily: 'Outfit_600SemiBold' },
  navSectionTitle: { marginTop: 16, marginBottom: 10, fontSize: 13, color: '#94A3B8', fontFamily: 'Outfit_600SemiBold' },
  navActionRow: { flexDirection: 'row', gap: 10 },
  googleMapsButton: { flex: 1, backgroundColor: '#EEF2FF', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  googleMapsButtonText: { fontSize: 13, color: '#3730A3', fontFamily: 'Outfit_700Bold' },
  liveMapSection: { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  liveMapTitle: { fontSize: 16, color: '#0F172A', fontFamily: 'Outfit_700Bold' },
  liveMapMeta: { marginTop: 4, marginBottom: 10, color: '#64748B', fontSize: 13, fontFamily: 'Inter_400Regular' },
  trackingInfoRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  trackingBadge: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  trackingBadgeLabel: { fontSize: 11, color: '#64748B', fontFamily: 'Inter_400Regular' },
  trackingBadgeValue: { marginTop: 2, fontSize: 13, color: '#0F172A', fontFamily: 'Outfit_700Bold' },
  trackingErrorText: { marginBottom: 10, color: '#B91C1C', fontSize: 12, fontFamily: 'Inter_400Regular' },
  inlineMap: { width: '100%', height: 230, borderRadius: 14, overflow: 'hidden' },
  mapFallbackBox: { height: 120, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  mapFallbackText: { color: '#64748B', fontSize: 13, fontFamily: 'Inter_400Regular' },
  completionSection: { paddingHorizontal: 25 },
  sectionTitle: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#1E293B', marginBottom: 15 },
  imagePicker: { height: 240, backgroundColor: '#fff', borderRadius: 30, overflow: 'hidden', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', marginBottom: 20 },
  preview: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cameraCircle: { width: 60, height: 60, backgroundColor: '#F8FAFC', borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 2 },
  placeholderText: { fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#1E293B' },
  placeholderSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#94A3B8', marginTop: 4 },
  inputWrapper: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 15, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 25 },
  input: { fontSize: 15, color: '#1E293B', fontFamily: 'Inter_400Regular', height: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 20, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold' },
  disabled: { opacity: 0.7 }
});

export default TaskDetailScreen;
