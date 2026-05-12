import { useState, useEffect } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native'
import { Stack, router } from 'expo-router'
import { randomSubtitles } from '../../assets/misc/randomSubtitles'

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
    marginBottom: 20,
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
    maxWidth: '70%',
    maxHeight: '20%',
    borderWidth: 1,
    borderColor: '#707070',
    backgroundColor: '#e6e6e6',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 15,
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
    marginBottom: 20,
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
    marginTop: 35,
  },
  loginText: { 
    color: '#666',
    fontFamily: 'RobotoSlab-Regular'
  },
})

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subtitle] = useState(() => randomSubtitles())

  // User account must meet requirements
  const validate = () => {
    return null; // No errors
  }

  // Check if requirements are met
  const handleLogin = () => {
    const err = validate();
    if (err) return setError(err);

    setError('');
    setLoading(true);

    setTimeout(() => {
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
      //behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Image style={styles.logo} source={require('../../assets/images/react-logo.png')} /> {/*Temporary logo*/}
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Username or E-mail"
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

        <View style={styles.login}>
          <Text style={styles.loginText}>New to the service? </Text>
          <Pressable onPress={() => router.push('/auth/signup_page')}>
            <Text style={styles.link}>Sign Up</Text>
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
    </>
  )
}