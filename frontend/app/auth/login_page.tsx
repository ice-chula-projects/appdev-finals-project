import { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native'
import { Stack, router } from 'expo-router'
import { randomSubtitles } from '../../components/randomSubtitles'

export const styles = StyleSheet.create({
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
    fontWeight: '700', 
    alignSelf: 'center',
    fontFamily: 'RobotoSlab-Regular'
  },
  subtitle: { 
    fontSize: 20, 
    color: '#666', 
    marginBottom: 30,
    alignSelf: 'center',
    fontFamily: 'RobotoSlab-Regular'
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
    fontWeight: '600',
    fontFamily: 'RobotoSlab-Regular' 
  },
  button: {
    backgroundColor: '#2f5ae9',
    margin: 15,
    maxWidth: '50%',
    maxHeight: '20%',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    alignSelf: 'center'
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600',
    fontFamily: 'RobotoSlab-Regular' 
  },
  signup: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
  },
  signupText: { 
    color: '#666',
    fontFamily: 'RobotoSlab-Regular'
  },
})

export default function LoginPage() {
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subtitle] = useState(() => randomSubtitles())

  // User account must meet requirements
  const validate = () => {
    if (username.trim().length < 3) return "Please enter a valid username.";
    if (password.length < 6) return "Password must be at least 6 characters long.";
    return null; // No errors
  }

  // Dummy accounts for testing before Backend API
  const dummyAccounts = [
  { username: 'john_doe', password: 'password123' },
  { username: 'jane_doe', password: 'password456' },
  ];

  // Check if requirements are met
  const handleLogin = () => {
    const err = validate();
    if (err) return setError(err);

    setError('');
    setLoading(true);

    setTimeout(() => {
      const accountInput = username.trim().toLowerCase();

      const account = dummyAccounts.find(acc => acc.username.toLowerCase() === accountInput);

      // Account does not exist case
      if (!account) {
        setError("No account found with that username, try again.");
        setLoading(false);
        return
      }

      // Incorrect password case
      if (account.password !== password) {
        setError("Incorrect password, try again.");
        setLoading(false);
        return
      }

      // Successful login
      setLoading(false);
      router.push('/')
    }, 1000);
  }

  // Login Page UI
  return (

  <>
    <Stack.Screen
      options={{
        headerTitle: () => (
          <Text
            style={{
              fontSize: 40,
              fontWeight: "bold",
            }}
          >
            Threads
          </Text>
        ),
      }}
    />

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Login</Text>
          }
        </Pressable>

        <View style={styles.signup}>
          <Text style={styles.signupText}>New to the service? </Text>
          <Pressable onPress={() => router.push('/auth/signup_page')}>
            <Text style={styles.link}>Sign Up</Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
    </>
  )
}