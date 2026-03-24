import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Lock, Phone, ArrowLeft } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../utils/constants';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert('Missing Fields', 'Please fill in all fields to continue.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/auth/register', { 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        password, 
        phone: phone.trim(), 
        role: 'user' 
      });

      if (res.data.success) {
        Alert.alert(
          '🎉 Account Created!',
          'We\'ve sent a 6-digit OTP to your email. Please verify to activate your account.',
          [{ 
            text: 'Verify Now', 
            onPress: () => navigation.navigate('OTPVerify', { 
              email: email.trim().toLowerCase(),
              userId: res.data.data?.userId
            }) 
          }]
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#059669', '#064E3B']}
        style={styles.background}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>♻️</Text>
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join the mission for a cleaner planet</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Sign Up</Text>

              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <User size={20} color={COLORS.primary} />
                </View>
                <TextInput 
                  style={styles.input} 
                  placeholder="Full Name" 
                  value={name} 
                  onChangeText={setName} 
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Mail size={20} color={COLORS.primary} />
                </View>
                <TextInput 
                  style={styles.input} 
                  placeholder="Email Address" 
                  value={email} 
                  onChangeText={setEmail} 
                  autoCapitalize="none" 
                  keyboardType="email-address" 
                  placeholderTextColor="#94A3B8"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Phone size={20} color={COLORS.primary} />
                </View>
                <TextInput 
                  style={styles.input} 
                  placeholder="Phone Number" 
                  value={phone} 
                  onChangeText={setPhone} 
                  keyboardType="phone-pad" 
                  placeholderTextColor="#94A3B8"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.iconContainer}>
                  <Lock size={20} color={COLORS.primary} />
                </View>
                <TextInput 
                  style={styles.input} 
                  placeholder="Password (min. 6 characters)" 
                  value={password} 
                  onChangeText={setPassword} 
                  secureTextEntry 
                  placeholderTextColor="#94A3B8"
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleRegister} 
                disabled={loading} 
                activeOpacity={0.8}
              >
                {loading 
                  ? <ActivityIndicator color="#fff" /> 
                  : <Text style={styles.buttonText}>Create Account</Text>
                }
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  backButton: { 
    marginLeft: 20, marginTop: 10, width: 45, height: 45, 
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, 
    justifyContent: 'center', alignItems: 'center' 
  },
  header: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  logoContainer: { 
    width: 70, height: 70, backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 22, justifyContent: 'center', alignItems: 'center', 
    marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' 
  },
  logoEmoji: { fontSize: 36 },
  title: { fontSize: 30, fontFamily: 'Outfit_700Bold', color: '#fff' },
  subtitle: { 
    fontSize: 15, color: 'rgba(255,255,255,0.8)', fontFamily: 'Outfit_400Regular', 
    marginTop: 5, textAlign: 'center', paddingHorizontal: 40 
  },
  formCard: { 
    backgroundColor: '#fff', marginHorizontal: 25, padding: 30, borderRadius: 35, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 
  },
  formTitle: { 
    fontSize: 22, fontFamily: 'Outfit_600SemiBold', color: '#064E3B', 
    marginBottom: 20, textAlign: 'center' 
  },
  inputWrapper: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', 
    borderRadius: 18, marginBottom: 12, paddingHorizontal: 15, 
    borderWidth: 1, borderColor: '#E2E8F0' 
  },
  iconContainer: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: '#1E293B', fontFamily: 'Inter_400Regular' },
  button: { 
    backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 18, marginTop: 10, 
    alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { color: '#64748B', fontFamily: 'Inter_400Regular', fontSize: 15 },
  link: { color: '#10B981', fontFamily: 'Outfit_700Bold', fontSize: 15 },
});

export default RegisterScreen;
