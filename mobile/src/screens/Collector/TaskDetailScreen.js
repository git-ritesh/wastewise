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
  Modal,
  Platform,
  Dimensions
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
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
  const [showMapPreview, setShowMapPreview] = useState(false);
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

  const handleOpenPreview = () => {
    const coords = resolveTaskCoordinates();
    if (!coords) {
      Alert.alert('Location Missing', 'This task does not have valid coordinates for navigation.');
      return;
    }
    setShowMapPreview(true);
  };

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

          <TouchableOpacity style={styles.navigateButton} onPress={handleOpenPreview} activeOpacity={0.8}>
            <Text style={styles.navigateButtonText}>Preview Route</Text>
          </TouchableOpacity>
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

      <Modal
        visible={showMapPreview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMapPreview(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Route Preview</Text>
            <Text style={styles.modalSubtitle} numberOfLines={2}>
              {taskState.location?.address || 'Selected destination'}
            </Text>

            {(() => {
              const coords = resolveTaskCoordinates();
              if (!coords) return null;

              return (
                <MapView
                  style={styles.previewMap}
                  initialRegion={{
                    latitude: coords.lat,
                    longitude: coords.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01
                  }}
                >
                  <Marker
                    coordinate={{ latitude: coords.lat, longitude: coords.lng }}
                    title={taskState.title || 'Destination'}
                    description={taskState.location?.address || 'Task destination'}
                  />
                </MapView>
              );
            })()}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnOutline} onPress={() => setShowMapPreview(false)}>
                <Text style={styles.modalBtnOutlineText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={async () => {
                  await handleNavigate();
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>Open in Google Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  navigateButton: { marginTop: 16, backgroundColor: '#ECFDF5', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  navigateButtonText: { fontSize: 14, color: '#047857', fontFamily: 'Outfit_700Bold' },
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
