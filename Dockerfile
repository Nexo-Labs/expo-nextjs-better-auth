FROM node:20-alpine

# Instalamos dependencias necesarias
RUN apk add --no-cache libc6-compat netcat-openbsd

# Configuramos el usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Establecemos el directorio de trabajo
WORKDIR /app

# Instalamos pnpm globalmente como root
RUN corepack enable pnpm

# Copiamos los archivos de configuración necesarios
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Copiamos el código fuente (respetando .dockerignore)
COPY . .

# Preparamos directorios para volúmenes y establecemos permisos
RUN mkdir -p /app/node_modules /app/apps/web/.next /app/apps/web/public && \
    touch /app/apps/web/.env && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

# Configuramos variables de entorno
ENV NODE_ENV=production
ENV PAYLOAD_CONFIG_PATH=payload.config.js
ENV PORT=3000

# Copiamos y configuramos el script de entrada
COPY scripts/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    chown nextjs:nodejs /entrypoint.sh

# Cambiamos al usuario no-root
USER nextjs

# Volúmenes para persistencia delegada
VOLUME ["/app/node_modules", "/app/apps/web/.next"]

# Exponemos el puerto
EXPOSE 3000

# Configuramos el entrypoint y comando por defecto
ENTRYPOINT ["/entrypoint.sh"]
CMD ["pnpm", "start:web"]
