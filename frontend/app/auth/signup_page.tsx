import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native'
import { router } from 'expo-router'

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff',
  },
  inner: { 
    flex: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 24,

  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 24,
    alignSelf: 'center'
  },
  title: { 
    fontSize: 30, 
    fontWeight: '700', 
    marginBottom: 4,
    alignSelf: 'center'
  },
  subtitle: { 
    fontSize: 15, 
    color: '#666', 
    marginBottom: 32,
    alignSelf: 'center'
  },
  form: { 
    gap: 12, 
    marginBottom: 12,
  
  },
  input: {
    maxWidth: '30%',
    maxHeight: '20%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    alignSelf: 'center',
  },
  inputError: { 
    borderColor: '#e53e3e' 
  },
  error: { 
    color: '#e53e3e', 
    fontSize: 13, 
    marginBottom: 8,
    alignSelf: 'center'
  },
  link: { 
    color: '#4f46e5', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  button: {
    backgroundColor: '#4f46e5',
    maxWidth: '30%',
    maxHeight: '20%',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 24 
  },
  footerText: { 
    color: '#666', 
    fontSize: 14 
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

  // Check if requirements are met
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
    <KeyboardAvoidingView
      style={styles.container}
      //behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Image style={styles.logo} source={require('../../assets/images/react-logo.png')} /> {/*Temporary logo*/}
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>An account is required to interact with threads.</Text>
        

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={(v) => { setUsername(v); setError('') }}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={(v) => { setEmail(v); setError('') }}
            autoCapitalize="none"
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
            : <Text style={styles.buttonText}>Create account</Text>
          }
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/auth/login_page')}>
            <Text style={styles.link}>Log in</Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  )
}
