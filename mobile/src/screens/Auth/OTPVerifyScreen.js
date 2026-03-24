import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../utils/constants';

const OTPVerifyScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value, index) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length < 6) {
      Alert.alert('Incomplete OTP', 'Please enter all 6 digits of your OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/auth/verify-otp', {
        email,
        otp: otpString,
      });

      if (res.data.success) {
        Alert.alert(
          '✅ Email Verified!',
          'Your account has been verified successfully. You can now sign in.',
          [{ 
            text: 'Sign In', 
            onPress: () => navigation.navigate('Login') 
          }]
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      Alert.alert('Verification Failed', msg);
      // Clear OTP fields on failure
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      const res = await client.post('/auth/resend-otp', { email });
      if (res.data.success) {
        Alert.alert('OTP Sent', 'A new OTP has been sent to your email.');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      Alert.alert('Error', msg);
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2}).+(@.+)/, '$1***$2')
    : 'your email';

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Mail size={36} color="#10B981" />
            </View>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to
            </Text>
            <Text style={styles.emailText}>{maskedEmail}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter OTP Code</Text>

            {/* OTP Input Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(val, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  maxLength={1}
                  keyboardType="numeric"
                  textAlign="center"
                  selectTextOnFocus
                  caretHidden={false}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>

            {/* Resend Section */}
            <View style={styles.resendSection}>
              {canResend ? (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendOTP}
                  disabled={resending}
                  activeOpacity={0.7}
                >
                  {resending ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  ) : (
                    <View style={styles.resendRow}>
                      <RefreshCw size={16} color={COLORS.primary} />
                      <Text style={styles.resendText}>Resend OTP</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  Resend code in{' '}
                  <Text style={styles.timerCount}>{timer}s</Text>
                </Text>
              )}
            </View>

            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                💡 Check your spam folder if you don't see the email. The OTP expires in 10 minutes.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: '100%' },
  backButton: {
    marginLeft: 20, marginTop: 10, width: 45, height: 45,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  header: { alignItems: 'center', paddingHorizontal: 30, marginTop: 20, marginBottom: 30 },
  iconCircle: {
    width: 80, height: 80, backgroundColor: '#fff', borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  title: { fontSize: 30, fontFamily: 'Outfit_700Bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontFamily: 'Outfit_400Regular' },
  emailText: {
    fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: '#fff',
    marginTop: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
  },
  card: {
    backgroundColor: '#fff', marginHorizontal: 25, padding: 30, borderRadius: 35,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 8,
  },
  cardTitle: {
    fontSize: 18, fontFamily: 'Outfit_600SemiBold', color: '#064E3B',
    textAlign: 'center', marginBottom: 25,
  },
  otpRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30,
  },
  otpInput: {
    width: 48, height: 58, borderRadius: 14, borderWidth: 2,
    borderColor: '#E2E8F0', backgroundColor: '#F8FAFC',
    fontSize: 24, fontFamily: 'Outfit_700Bold', color: '#064E3B',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: '#10B981', backgroundColor: '#F0FDF4',
  },
  verifyButton: {
    backgroundColor: '#10B981', paddingVertical: 18, borderRadius: 18,
    alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  verifyButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Outfit_700Bold' },
  resendSection: { alignItems: 'center', marginTop: 20 },
  resendButton: { paddingVertical: 8, paddingHorizontal: 16 },
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resendText: { color: '#10B981', fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  timerText: { color: '#94A3B8', fontFamily: 'Inter_400Regular', fontSize: 14 },
  timerCount: { color: '#10B981', fontFamily: 'Outfit_700Bold' },
  hintBox: {
    marginTop: 20, backgroundColor: '#F0FDF4', borderRadius: 12,
    padding: 15, borderLeftWidth: 3, borderLeftColor: '#10B981',
  },
  hintText: { color: '#065F46', fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
});

export default OTPVerifyScreen;
