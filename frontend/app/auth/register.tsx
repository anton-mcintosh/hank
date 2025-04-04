// frontend/app/auth/register.tsx
import React, { useState, useContext } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';

export default function RegisterScreen() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const { register, isLoading, isError, errorMessage } = useContext(AuthContext);

  const handleRegister = async (): Promise<void> => {
    if (username.trim() === '' || email.trim() === '' || password === '') {
      alert('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    await register(username, email, password);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Create Account</ThemedText>
      
      {isError && (
        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!isLoading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!isLoading}
      />
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>Register</ThemedText>
        )}
      </TouchableOpacity>
      
      <View style={styles.loginContainer}>
        <ThemedText>Already have an account?</ThemedText>
        <TouchableOpacity onPress={() => router.replace('/auth/login')}>
          <ThemedText style={styles.loginLink}>Log In</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0a7ea4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginLink: {
    color: '#0a7ea4',
    fontWeight: '600',
    marginLeft: 5,
  },
});
