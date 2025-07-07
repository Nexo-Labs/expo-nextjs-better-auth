import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  // Ya no necesitamos el useState local para isLoading.
  // Usamos el que viene del contexto, que es más preciso.
  const { signIn, isLoading } = useAuth();

  const handleGoogleSignIn = async () => {
    // Ya no necesitamos setIsLoading, el hook se encarga.
    try {
      await signIn();
    } catch (error) {
      Alert.alert('Sign In Error', 'Failed to sign in with Google. Please try again.');
      console.error('Sign in error:', error);
    }
    // Ya no necesitamos el 'finally' block.
  };

  return (
    <ThemedView style={styles.container}>
      {/* ...el resto de tu JSX... */}
        <Pressable
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isLoading} // El botón se deshabilita con el isLoading del contexto
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              Sign in with Google
            </ThemedText>
          )}
        </Pressable>
      {/* ...el resto de tu JSX... */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});