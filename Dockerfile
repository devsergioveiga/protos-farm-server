FROM node:20-alpine

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Remove devDependencies for smaller production image
RUN npm prune --omit=dev

# Run as non-root user
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001

# RDS usa certificado AWS; Node precisa aceitar para conexão SSL
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

CMD ["node", "dist/index.js"]
