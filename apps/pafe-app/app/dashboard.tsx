import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/lib/auth';
import { Image } from 'expo-image';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      // Añade un log de error para saber si algo ha fallado
      console.error('Error during sign out:', error);
    }
  };
  
  // Esta guarda previene errores si la pantalla se renderiza antes de la redirección
  if (!user) {
    return null; // O un spinner
  }

  return (
    <ThemedView>
      <ScrollView>
        {/* ... */}
        <ThemedText>Bienvenido, {user.name}!</ThemedText>
        <ThemedText>Email: {user.email}</ThemedText>
        <Pressable onPress={handleSignOut}>
            <ThemedText>Cerrar Sesión</ThemedText>
        </Pressable>
        {/* ... */}
      </ScrollView>
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    marginBottom: 10,
  },
  subtitle: {
    opacity: 0.8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    marginBottom: 30,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    marginBottom: 4,
  },
  userEmail: {
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionContent: {
    lineHeight: 20,
    opacity: 0.8,
  },
  signOutButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
  },
});