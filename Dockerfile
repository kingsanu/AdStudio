# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (only for frontend and internal packages)
COPY package.json package-lock.json ./
COPY index.html ./
COPY components.json ./
COPY packages ./packages
COPY public ./public
COPY src ./src
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.mjs ./
COPY postcss.config.mjs ./

RUN npm install --legacy-peer-deps
RUN npm run build

# Stage 2: Serve
FROM node:22-alpine AS runner

WORKDIR /app

# Only copy the built output and necessary files
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY package-lock.json ./

# Install only production dependencies (if any)
RUN npm install --production --legacy-peer-deps

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
