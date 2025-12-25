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
import { login, register } from '../../src/services/auth';
import { setToken } from '../../src/storage/token';
import { colors } from '../../src/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password || !confirm) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      const res = await login(email, password);
      if (res?.token) {
        await setToken(res.token);
      }
      router.replace('/screens/ServersScreen');
    } catch (err: any) {
      Alert.alert('Registration Failed', 'Could not create account at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join SecureNest for private browsing</Text>

        <TextInput 
          style={styles.input} 
          placeholder="Email Address" 
          placeholderTextColor="#9AA6C3" 
          value={email} 
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          placeholderTextColor="#9AA6C3" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Confirm Password" 
          placeholderTextColor="#9AA6C3" 
          secureTextEntry 
          value={confirm} 
          onChangeText={setConfirm} 
        />

        <TouchableOpacity 
          style={[styles.primary, loading && { opacity: 0.7 }]} 
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Creating Account...' : 'Register'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.footerLink}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050712',
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