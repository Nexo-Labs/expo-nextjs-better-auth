import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/lib/auth';

function AuthLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // No hagas nada mientras se carga el estado de auth
    }

    const isAuthenticated = !!user;
    
    // El usuario está en una pantalla de la app (ej: /dashboard) si el primer segmento es 'dashboard'.
    const inApp = segments[0] === 'dashboard';

    if (isAuthenticated && !inApp) {
      // Si el usuario está logueado pero NO está en la app (está en el index/login),
      // lo mandamos al dashboard.
      router.replace('/dashboard');
    } else if (!isAuthenticated && inApp) {
      // Si el usuario NO está logueado pero intenta acceder al dashboard,
      // lo mandamos al index/login.
      router.replace('/');
    }
  }, [isLoading, user, segments, router]); // Dependencias correctas

  // Mientras carga, es buena idea mostrar un spinner para evitar parpadeos
  if (isLoading) {
    // Puedes poner un spinner aquí si quieres
    return null; 
  }
  
  // El Stack ya no necesita declarar las pantallas que existen como ficheros
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthLayout />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
