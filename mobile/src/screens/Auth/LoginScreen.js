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
  Dimensions,
  ImageBackground,
  Alert
} from 'react-native';
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { login } from '../../redux/authSlice';
import { COLORS, BASE_URL } from '../../utils/constants';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await dispatch(login({ email: email.trim().toLowerCase(), password })).unwrap();
    } catch (err) {
      console.log('Login Error Object:', err);
      
      // Handle Network Error specifically
      if (err.message === 'Network Error' || !err.response) {
        Alert.alert(
          '🌐 Network Error',
          `Cannot reach the server at ${BASE_URL}.\n\n1. Ensure your phone is on the SAME Wifi as your PC.\n2. Check if your PC firewall is blocking port 5000.\n3. Make sure the backend server is running.`,
          [{ text: 'Retry' }]
        );
        return;
      }

      // Check if user exists but is not verified
      if (err.needsVerification || err.response?.data?.needsVerification) {
        Alert.alert(
          'Verification Needed',
          'Your email is not verified. Please enter the OTP sent to your email.',
          [{ 
            text: 'Verify Now', 
            onPress: () => navigation.navigate('OTPVerify', { email: email.trim().toLowerCase() }) 
          }]
        );
      } else {
        const msg = err.response?.data?.message || err.message || 'Invalid credentials';
        Alert.alert('Login Failed', msg);
      }
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
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>♻️</Text>
            </View>
            <Text style={styles.title}>WasteWise</Text>
            <Text style={styles.subtitle}>Welcome back to a cleaner future</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            
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
              />
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <Lock size={20} color={COLORS.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
                {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin} 
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Continue</Text>
                  <ArrowRight size={20} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New here?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signUpLink}> Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontFamily: 'Outfit_700Bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Outfit_400Regular',
    marginTop: 5,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 25,
    padding: 30,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#064E3B',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter_400Regular',
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    borderRadius: 18,
    marginTop: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#64748B',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  signUpLink: {
    color: '#10B981',
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
  },
});

export default LoginScreen;
