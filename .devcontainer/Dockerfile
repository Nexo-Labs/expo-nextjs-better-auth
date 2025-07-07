FROM node:20-slim

# Instalar dependencias necesarias
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Establecer el directorio de trabajo
WORKDIR /workspace

# Configurar el shell por defecto
SHELL ["/bin/bash", "-c"]

# Comando por defecto
CMD ["sleep", "infinity"] 