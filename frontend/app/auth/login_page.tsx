import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomLoginSubtitles } from '../../components/randomSubtitles';
import BackEnd from '../../components/backend';
import { useAccount } from '@/components/accountContext';
import { Ionicons } from '@expo/vector-icons';

export const styles = StyleSheet.create({
  safeView: {
    flex: 1,
    backgroundColor: "#fffff",
  },
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff',
  },
  inner: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 25,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 15,
    alignSelf: 'center'
  },
  title: { 
    fontSize: 30, 
    fontFamily: 'RobotoSlab-Bold',
    alignSelf: 'center',
    textAlign: "center",
  },
  subtitle: { 
    fontSize: 20, 
    color: '#666', 
    marginBottom: 30,
    alignSelf: 'center',
    fontFamily: 'RobotoSlab-Regular',
    textAlign: "center",
  },
  form: { 
    gap: 10, 
    fontFamily: 'RobotoSlab-Regular'
  },
  input: {
    width: 250,
    margin: 1,
    borderWidth: 1,
    borderColor: '#707070',
    backgroundColor: '#e6e6e6',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    alignSelf: 'center',
    fontFamily: 'RobotoSlab-Regular',
    opacity: 0.67,
  },
  inputError: { 
    borderColor: '#e53e3e' 
  },
  error: { 
    color: '#e53e3e', 
    fontSize: 15, 
    margin: 10,
    alignSelf: 'center',
    fontFamily: 'RobotoSlab-Regular' 
  },
  link: { 
    color: '#2f5ae9', 
    fontSize: 14, 
    fontFamily: 'RobotoSlab-Bold' 
  },
  button: {
    backgroundColor: '#2f5ae9',
    maxWidth: '50%',
    maxHeight: '20%',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    alignSelf: 'center'
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontFamily: 'RobotoSlab-Bold' 
  },
  signup: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
  },
  signupText: { 
    color: '#666',
    fontFamily: 'RobotoSlab-Regular'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff"
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
  }
})

export default function LoginPage() {
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [subtitle] = useState(() => randomLoginSubtitles());
  const { reloadProfile } = useAccount();
  
  // Initial loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])


  // User account must meet requirements
  const validate = () => {
    if (username.trim().length < 3) return "Please enter a valid username.";
    if (password.length < 8) return "Password must be at least 8 characters long.";
    return null; // No errors
  }

  // Check if requirements are met
  const handleLogin = async () => {
    const err = validate();
    if (err) return setError(err);

    setError('');
    setLoading(true);

    try {

      const response = await BackEnd.login(username, password);
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (response.success) {
        const sessionToken = response.sessionToken;
        const userUUID = response.userUuid;

        await AsyncStorage.setItem("session_token", sessionToken);
        await AsyncStorage.setItem("username", username);
        await AsyncStorage.setItem("user_uuid", userUUID);
        reloadProfile()

        router.replace('/');

      } else {
        console.log("Invalid backend link.");
        setError(response.message || "Login failed, try again.");
      }
    } catch (error) {
      console.log("Error:", err);
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2f5ae9"
        />
      </View>
    )
  }

  // Login Page UI
  return (
  <SafeAreaView style={styles.safeView}>
    <TouchableOpacity style={styles.closeButton} onPress={ () => router.replace("/")}>
      <Ionicons name="close" size={32} color="#5c5c5c" />
    </TouchableOpacity>

    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Image style={styles.logo} source={require('../../assets/images/message_logo.png')} />
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={(v) => { setUsername(v); setError('') }}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={(v) => { setPassword(v); setError('') }}
            secureTextEntry
          />
        </View>

        <Text style={styles.error}>{error || ' '}</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Login</Text>
          }
        </TouchableOpacity>

        <View style={styles.signup}>
          <Text style={styles.signupText}>New to the service? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/signup_page')}>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  )
}