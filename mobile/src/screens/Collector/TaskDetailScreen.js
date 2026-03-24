import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, MapPin, CheckCircle2 } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

const TaskDetailScreen = ({ route, navigation }) => {
  const { task } = route.params;
  const [image, setImage] = useState(null);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);

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
      const res = await client.post(`/collector/tasks/${task._id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
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
          <View style={[styles.statusBadge, { backgroundColor: task.status === 'completed' ? '#ECFDF5' : '#FEF3C7' }]}>
            <View style={[styles.statusDot, { backgroundColor: task.status === 'completed' ? '#10B981' : '#F59E0B' }]} />
            <Text style={[styles.statusText, { color: task.status === 'completed' ? '#10B981' : '#B45309' }]}>
              {task.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDesc}>{task.description}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoIconBg}>
              <MapPin size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{task.location?.address || 'Near Downtown'}</Text>
            </View>
          </View>
        </View>

        {task.status !== 'completed' && (
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
