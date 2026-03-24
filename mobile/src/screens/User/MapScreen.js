import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Clock } from 'lucide-react-native';
import { COLORS } from '../../utils/constants';

const MapScreen = ({ navigation }) => {
  return (
    <View style={styles.center}>
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9']}
        style={styles.comingSoonBackground}
      />
      <View style={styles.comingSoonContent}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[COLORS.primary, '#059669']}
            style={styles.iconGradient}
          >
            <Clock size={48} color="#fff" />
          </LinearGradient>
          <View style={styles.pingContainer}>
            <View style={styles.ping} />
          </View>
        </View>
        
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <Text style={styles.comingSoonSubtitle}>Smart Waste Tracking</Text>
        
        <Text style={styles.comingSoonDesc}>
          Our IoT-enabled smart bins are being deployed in your city. 
          Once active, you'll be able to see real-time fill levels and find the nearest available bin.
        </Text>

        <TouchableOpacity 
          style={styles.backButtonLarge} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color="#fff" />
          <Text style={styles.backButtonText}>Go Back Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20 },
  comingSoonBackground: { ...StyleSheet.absoluteFillObject },
  comingSoonContent: { alignItems: 'center', padding: 30, width: '100%' },
  iconContainer: { marginBottom: 30, position: 'relative' },
  iconGradient: { width: 100, height: 100, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 15 },
  pingContainer: { position: 'absolute', top: -5, right: -5 },
  ping: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#10B981', borderWidth: 3, borderColor: '#fff' },
  comingSoonTitle: { fontSize: 32, fontFamily: 'Outfit_700Bold', color: '#1E293B' },
  comingSoonSubtitle: { fontSize: 18, fontFamily: 'Outfit_600SemiBold', color: COLORS.primary, marginBottom: 20 },
  comingSoonDesc: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  backButtonLarge: { backgroundColor: '#1E293B', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 5 },
  backButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Outfit_700Bold' }
});

export default MapScreen;
