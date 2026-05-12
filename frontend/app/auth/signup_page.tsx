import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native'
import { Stack, router } from 'expo-router'

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
    marginBottom: 10,
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
    fontWeight: '600',
    fontFamily: 'RobotoSlab-Regular' 
  },
  button: {
    backgroundColor: '#2f5ae9',
    maxWidth: '50%',
    maxHeight: '20%',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 15,
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
  login: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
  },
  loginText: { 
    color: '#666',
    fontFamily: 'RobotoSlab-Regular'
  },
})

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User account must meet requirements
  const validate = () => {
    if (username.length < 3) return 'Username must be at least 3 characters.';
    if (!email.includes('@')) return 'Please enter a valid e-mail address.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null; // No errors
  }

  // Check if account exists
  const handleSignup = () => {
    const err = validate();
    if (err) return setError(err);

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      router.push('/')
    }, 1000);
  }

  

  // Signup Page UI
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
        <Image style={styles.logo} source={require('../../assets/images/react-logo.png')} /> {/*Temporary logo*/}
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
            placeholder="E-mail"
            value={email}
            onChangeText={(v) => { setEmail(v); setError('') }}
            keyboardType="email-address"
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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Sign Up</Text>
          }
        </Pressable>

        <View style={styles.login}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/auth/login_page')}>
            <Text style={styles.link}>Login</Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  </>
  )
}
