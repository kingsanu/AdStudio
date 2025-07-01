# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (only for frontend and internal packages)
COPY package.json yarn.lock ./
COPY packages ./packages
COPY public ./public
COPY src ./src
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.mjs ./
COPY postcss.config.mjs ./
COPY tailwind.config.js ./
COPY tailwind.config.cjs ./
COPY .npmrc ./

RUN yarn install --frozen-lockfile
RUN yarn build

# Stage 2: Serve
FROM node:22-alpine AS runner

WORKDIR /app

# Only copy the built output and necessary files
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Install only production dependencies (if any)
RUN yarn install --production --frozen-lockfile

EXPOSE 4173

CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "4173"]
