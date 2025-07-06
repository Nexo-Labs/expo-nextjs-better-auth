import { HomeScreen } from 'app/features/home/screen'
import { Stack } from 'expo-router'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuth } from './contexts/AuthContext'
import { useRouter } from 'expo-router'

export default function Screen() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Home',
        }}
      />
      <View style={styles.container}>
        <HomeScreen />

        <View style={styles.authSection}>
          {user ? (
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>¡Hola, {user.name}!</Text>
              <Text style={styles.emailText}>{user.email}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.authButton} onPress={() => router.push('/auth')}>
              <Text style={styles.authButtonText}>Iniciar sesión</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  userInfo: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
  },
  authButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
