import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 32 },
  form: { gap: 12, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  inputError: { borderColor: '#e53e3e' },
  error: { color: '#e53e3e', fontSize: 13, marginBottom: 8 },
  link: { color: '#4f46e5', fontSize: 14, fontWeight: '500' },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#666', fontSize: 14 },
})

export const SignupPage = () => {
  const navigation = useNavigation()

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User account must meet requirements
  const validate = () => {
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (!email.includes('@')) return 'Enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null; // No errors
  }

  const handleSignup = () => {
    const err = validate();
    if (err) return setError(err);

    setError('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Main')
    }, 1000);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      //behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join the conversation</Text>

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
            placeholder="Email"
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
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Sign in</Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  )
}