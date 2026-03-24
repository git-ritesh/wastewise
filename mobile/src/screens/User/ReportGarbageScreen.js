import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera as CameraIcon, MapPin, Info, CheckCircle2 } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

const ReportGarbageScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraView, setCameraView] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wasteType, setWasteType] = useState('household');
  const [weight, setWeight] = useState('less_than_5kg');

  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      // Request location permission
      let locStatus = await Location.requestForegroundPermissionsAsync();
      if (locStatus.status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to report garbage.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  const handleOpenCamera = async () => {
    if (!permission) {
      // Camera permissions are still loading
      return;
    }
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }
    }
    setCameraView(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const pic = await cameraRef.current.takePictureAsync({ 
          quality: 0.5,
          base64: false,
          exif: false
        });
        setPhoto(pic.uri);
        setCameraView(false);
      } catch (err) {
        console.error('Take picture error:', err);
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const handleSubmit = async () => {
    if (!photo || !title || !description) {
      Alert.alert('Missing Fields', 'Please fill all fields and take a photo.');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('wasteType', wasteType);
    formData.append('estimatedWeight', weight);
    formData.append('location', JSON.stringify({
      latitude: location?.latitude || 0,
      longitude: location?.longitude || 0,
      address: 'Pinned Location'
    }));
    
    // Append the photo
    const uriParts = photo.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('images', {
      uri: photo,
      name: `report.${fileType}`,
      type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
    });

    try {
      const res = await client.post('/dashboard/reports', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Essential for FormData in some axios versions
      });
      if (res.data.success) {
        Alert.alert('Success', 'Report submitted successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Upload Error:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to submit report. ' + (error.response?.data?.message || 'Check connection'));
    } finally {
      setLoading(false);
    }
  };

  if (cameraView) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView 
          style={styles.camera} 
          ref={cameraRef}
          facing="back"
        >
          <SafeAreaView style={styles.cameraUI}>
            <TouchableOpacity style={styles.closeCamera} onPress={() => setCameraView(false)}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
              <View style={styles.captureOuter}>
                <View style={styles.captureInner} />
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Garbage</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.imagePicker} onPress={handleOpenCamera}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.preview} />
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.cameraIconBg}>
                <CameraIcon size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.placeholderText}>Tap to Capture Evidence</Text>
              <Text style={styles.placeholderSubText}>Make sure the garbage is clearly visible</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.label}>Report Title</Text>
          <View style={styles.inputWrapper}>
            <TextInput 
              style={styles.input} 
              value={title} 
              onChangeText={setTitle} 
              placeholder="e.g. Overflowing Bin near Main Street" 
              placeholderTextColor="#94A3B8"
            />
          </View>

          <Text style={styles.label}>Description</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={description} 
              onChangeText={setDescription} 
              placeholder="Provide more details about the situation..." 
              multiline 
              placeholderTextColor="#94A3B8"
            />
          </View>

          <Text style={styles.label}>Waste Category</Text>
          <View style={styles.chipRow}>
            {['household', 'recyclable', 'hazardous'].map((type) => (
              <TouchableOpacity 
                key={type} 
                style={[styles.chip, wasteType === type && styles.activeChip]} 
                onPress={() => setWasteType(type)}
              >
                <Text style={[styles.chipText, wasteType === type && styles.activeChipText]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Estimated Weight</Text>
          <View style={styles.chipRow}>
            {['less_than_5kg', '5_to_10kg', 'more_than_20kg'].map((w) => (
              <TouchableOpacity 
                key={w} 
                style={[styles.chip, weight === w && styles.activeChip]} 
                onPress={() => setWeight(w)}
              >
                <Text style={[styles.chipText, weight === w && styles.activeChipText]}>
                  {w.replace(/_/g, ' ').replace('kg', ' kg')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.locationCard}>
            <MapPin size={20} color={COLORS.primary} />
            <Text style={styles.locationText}>
              {location ? `Location Tagged: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Fetching location...'}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.disabled]} 
            onPress={handleSubmit} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnContent}>
                <CheckCircle2 size={22} color="#fff" />
                <Text style={styles.btnText}>Submit Report</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontFamily: 'Outfit_700Bold', color: '#1E293B' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1 },
  cameraUI: { flex: 1, justifyContent: 'space-between', padding: 20 },
  closeCamera: { width: 50, height: 50, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  captureBtn: { alignSelf: 'center', marginBottom: 30 },
  captureOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  scrollContent: { paddingBottom: 40 },
  imagePicker: { height: 260, backgroundColor: '#F1F5F9', margin: 20, borderRadius: 30, overflow: 'hidden', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' },
  preview: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cameraIconBg: { width: 70, height: 70, backgroundColor: '#fff', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 4 },
  placeholderText: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: '#1E293B' },
  placeholderSubText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: '#94A3B8', marginTop: 5 },
  form: { paddingHorizontal: 20 },
  label: { fontSize: 15, fontFamily: 'Outfit_600SemiBold', color: '#1E293B', marginTop: 20, marginBottom: 8 },
  inputWrapper: { backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { paddingVertical: 15, fontSize: 16, color: '#1E293B', fontFamily: 'Inter_400Regular' },
  textAreaWrapper: { paddingVertical: 5 },
  textArea: { height: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
  activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: '#64748B', fontSize: 13, fontFamily: 'Outfit_600SemiBold' },
  activeChipText: { color: '#fff' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 15, borderRadius: 15, marginTop: 20 },
  locationText: { marginLeft: 10, color: '#166534', fontSize: 13, fontFamily: 'Inter_400Regular' },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 20, alignItems: 'center', marginTop: 30, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold' },
  disabled: { opacity: 0.7 }
});

export default ReportGarbageScreen;
