#!/bin/sh
# Definir la ruta absoluta donde debe ejecutarse el script

# No necesitamos crear el archivo .env, ya lo creamos en el Dockerfile
# y establecimos los permisos correctos

# Iterar sobre todas las variables de entorno y guardarlas en el archivo .env
echo "Guardando variables de entorno en .env..."
: > /app/apps/web/.env # Limpiar el archivo .env
for var in $(printenv)
do
  # Formato esperado: VAR_NAME=value
  # Filtrar la variable para evitar que algunas variables sensibles de Docker se guarden.
  if echo "$var" | grep -q -v '^PWD=\|^SHLVL=\|^_=.\|^OLDPWD=\|^HOME=\|^HOSTNAME=\|^PATH=\|^TERM='; then
    echo "$var" >> /app/apps/web/.env
  fi
done
# Instalamos dependencias si no existen
echo "Verificando dependencias..."
if [ ! -d "/app/node_modules/react" ]; then
  echo "Instalando dependencias con pnpm..."
  cd /app
  # No necesitamos ejecutar corepack enable pnpm
  # ya lo hicimos en el Dockerfile como root
  
  # Usamos --frozen-lockfile para asegurar consistencia con lo definido en el lockfile
  # Instalamos todas las dependencias, incluyendo las de desarrollo para el build
  pnpm i --frozen-lockfile
  echo "Dependencias instaladas correctamente."
else
  echo "Dependencias ya instaladas, omitiendo instalación."
fi

# Verificar si las variables de conexión a la base de datos están definidas
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL no está definida. No se puede continuar."
  exit 1
fi


# Ejecutar el build
cd /app
echo "Ejecutando build del proyecto..."
pnpm build:web

# Verificar si el build fue exitoso
BUILD_STATUS=$?
if [ $BUILD_STATUS -ne 0 ]; then
  echo "Error: El build falló. Revisa los logs para más detalles."
  exit 1
fi

# Si estamos en producción, podemos reinstalar solo dependencias de producción
if [ "$NODE_ENV" = "production" ]; then
  echo "Entorno de producción detectado. Optimizando dependencias..."
  # Guardamos los artefactos del build en el volumen montado
  # No necesitamos copiarlos porque ya estamos usando un volumen para .next
  
  # Reinstalamos solo con dependencias de producción
  cd /app
  pnpm i --frozen-lockfile --prod
  echo "Optimización completada."
fi

echo "Build completado con éxito. Iniciando la aplicación..."

# Ejecutar el comando proporcionado
exec "$@"
