import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackEnd from '../../components/backend';
import { useAccount } from '@/components/accountContext';
import { Ionicons } from '@expo/vector-icons';

export const styles = StyleSheet.create({
  safeView: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    alignSelf: 'center',
    fontFamily: 'RobotoSlab-Bold'
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
    gap: 10
  },
  input: {
    width: 250,
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
  login: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
  },
  loginText: { 
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

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
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
    if (username.length < 3) return 'Username must be at least 3 characters.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null; // No errors
  }

  const handleSignup = async () => {
    const err = validate();
    if (err) return setError(err);
    setError('');
    setLoading(true);

    try {
      const signupResponse = await BackEnd.createUser(username,password);

      if (!signupResponse.success) {
        setError(signupResponse.message || "Signup failed.");
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (signupResponse.success) {
        console.log("Backend connected.");
        await AsyncStorage.setItem("session_token", signupResponse.sessionToken);
        await AsyncStorage.setItem("user_uuid", signupResponse.userUuid);
        await AsyncStorage.setItem("username", username);
        reloadProfile();

        router.replace("/");
      } else {
        console.log("Invalid backend link.");
        setError("Signup successful, but login failed. Please login manually.");
        router.replace("/auth/login_page");
      }

    } catch (error) {
      console.log("Error:", err);
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  // Initial loading screen
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

  // Signup Page UI
  return (
  <SafeAreaView style={styles.safeView}>

    <TouchableOpacity style={styles.closeButton} onPress={ () => router.replace("/")}>
      <Ionicons name="close" size={32} color="#5c5c5c" />
    </TouchableOpacity>

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Image style={styles.logo} source={require('../../assets/images/message_logo.png')} />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up today to join the communities!</Text>
        

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
          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setError('') }}
            secureTextEntry
          />
        </View>

        <Text style={styles.error}>{error || ' '}</Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign Up</Text>
          }
        </TouchableOpacity>

        <View style={styles.login}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login_page')}>
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
  )
}
