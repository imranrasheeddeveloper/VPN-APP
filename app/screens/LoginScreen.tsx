import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  Alert,
  DeviceEventEmitter,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { login } from '../../src/services/auth';
import { restoreSubscription } from '../../src/services/subscriptions';
import { getDeviceId } from '../../src/storage/device';
import { setToken } from '../../src/storage/token';
import { colors } from '../../src/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams()
  const GOOGLE_CLIENT_ID =
  '338085040480-qq66hv1mlacgomjnraoq470c53rtge70.apps.googleusercontent.com';
  const targetServer = params.server
  const redirectUri = AuthSession.makeRedirectUri();

  const [googleRequest, googleResponse, promptGoogleLogin] =
  Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
  });
  const submit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 LOGIN ATTEMPT', { email });
      const deviceId = await getDeviceId();

      const res = await login(email, password, deviceId);


      if (!res?.token) {
        throw new Error('Token missing in response');
      }

      await setToken(res.token);
      // Replace ensures user can't "Go Back" into the login screen after success

      const pending = await AsyncStorage.getItem('PENDING_PURCHASE_TOKEN');

      if (pending) {
        await restoreSubscription(pending);
        await AsyncStorage.removeItem('PENDING_PURCHASE_TOKEN');
        DeviceEventEmitter.emit('AUTH_TOKEN_CHANGED');
      }
  
     if (targetServer) {
        router.replace({
          pathname: '/screens/ConnectScreen',
          params: { server: targetServer },
        })
      } else {
        router.replace('/screens/ServersScreen')
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Unknown error';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
  try {
    const result = await promptGoogleLogin();

    if (result.type !== 'success') return;

    const idToken = result.authentication?.idToken;
    if (!idToken) {
      Alert.alert('Google Login Failed', 'No token received');
      return;
    }

    setLoading(true);
    const deviceId = await getDeviceId();

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/auth/google`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, deviceId }),
      }
    ).then(r => r.json());

    if (!res?.token) {
      throw new Error('Token missing in response');
    }

    await setToken(res.token);

    const pending = await AsyncStorage.getItem('PENDING_PURCHASE_TOKEN');
    if (pending) {
      await restoreSubscription(pending);
      await AsyncStorage.removeItem('PENDING_PURCHASE_TOKEN');
      DeviceEventEmitter.emit('AUTH_TOKEN_CHANGED');
    }

    if (targetServer) {
      router.replace({
        pathname: '/screens/ConnectScreen',
        params: { server: targetServer },
      });
    } else {
      router.replace('/screens/ServersScreen');
    }
  } catch (err: any) {
    Alert.alert(
      'Google Login Failed',
      err?.message || 'Unknown error'
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backCircle}>
          <Feather name="chevron-left" size={24} color="#EAF0FF" />
        </Pressable>
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

        {/* <TouchableOpacity
          style={styles.googleBtn}
          onPress={googleLogin}
          disabled={!googleRequest || loading}
        >
         <FontAwesome name="google" size={18} color="#000" />

          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity> */}
        

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
  paddingHorizontal: 20,
  paddingTop: 50,
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

  

backCircle: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(120,140,255,0.1)',
  alignItems: 'center',
  justifyContent: 'center',
},

googleBtn: {
  backgroundColor: '#fff',
  padding: 16,
  borderRadius: 18,
  marginTop: 16,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
googleText: {
  marginLeft: 8,
  fontWeight: '700',
  color: '#000',
},


});