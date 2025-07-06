# Configuración de OAuth 2.0 con Google en Expo

## Configuración de Variables de Entorno

Crea un archivo `.env.local` en la carpeta `apps/expo` con las siguientes variables:

```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=tu-google-client-id

# Backend API URL
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Configuración en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ (Google+ API)
4. Ve a "Credenciales" y crea un "ID de cliente OAuth 2.0"
5. Configura los siguientes URIs de redirección:
   - `yourprojectsname://` (para desarrollo)
   - `yourprojectsname://auth` (opcional)
   - `exp://` seguido de tu IP local si usas Expo Go

## Configuración del Backend

Asegúrate de que tu backend de Next.js tenga las siguientes variables de entorno:

```env
GOOGLE_CLIENT_ID=mismo-client-id
GOOGLE_CLIENT_SECRET=tu-client-secret
JWT_SECRET=una-clave-secreta-segura
```

## Uso

1. La aplicación mostrará un botón de "Iniciar sesión" en la pantalla principal
2. Al presionarlo, se abrirá la pantalla de autenticación
3. Al presionar "Continuar con Google", se abrirá el navegador para autenticarse
4. Después de autenticarse, la app recibirá el código y lo intercambiará por tokens
5. Los tokens se almacenan de forma segura en el dispositivo

## Flujo de Autenticación

1. Usuario presiona "Continuar con Google"
2. Se abre el navegador con la página de Google
3. Usuario autoriza la aplicación
4. Google redirige a `yourprojectsname://` con un código
5. La app envía el código al backend (`/api/auth/mobile/signin`)
6. El backend intercambia el código por tokens con Google
7. El backend crea un JWT personalizado y lo devuelve a la app
8. La app almacena el JWT de forma segura usando SecureStore

## Seguridad

- PKCE se implementa automáticamente por expo-auth-session
- Los tokens se almacenan usando expo-secure-store (Keychain en iOS, SharedPreferences encriptadas en Android)
- El client_secret nunca se expone en la aplicación móvil
- Todos los intercambios de tokens ocurren en el backend
