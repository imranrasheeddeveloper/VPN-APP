import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { login } from '../../src/services/auth';
import { setToken } from '../../src/storage/token';
import { colors } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 LOGIN ATTEMPT', { email });
      const res = await login(email, password);

      if (!res?.token) {
        throw new Error('Token missing in response');
      }

      await setToken(res.token);
      // Replace ensures user can't "Go Back" into the login screen after success
      router.replace('/screens/ServersScreen');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Unknown error';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to access premium servers</Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#9AA6C3"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9AA6C3"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity 
          style={[styles.primary, loading && { opacity: 0.7 }]} 
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Login'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/screens/RegisterScreen')} style={styles.footerLink}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.link}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050712', // Matches ConnectScreen
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#EAF0FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9AA6C3',
    marginBottom: 32,
  },
  input: {
    backgroundColor: 'rgba(120,140,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(120,140,255,0.2)',
    borderRadius: 16,
    padding: 16,
    color: '#EAF0FF',
    marginBottom: 16,
    fontSize: 16,
  },
  primary: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 18,
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  footerLink: {
    marginTop: 24,
  },
  footerText: {
    color: '#9AA6C3',
    textAlign: 'center',
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
});