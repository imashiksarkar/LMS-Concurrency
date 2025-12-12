# Stage 1: Install dependencies
FROM node:22.16.0-alpine AS deps

WORKDIR /usr/app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm@8 \
  && pnpm install

# Stage 2: Remove dev dependencies
FROM deps AS prod-deps

WORKDIR /usr/app

RUN pnpm prune --prod

# Stage 3: Build the application
FROM deps AS builder

WORKDIR /usr/app

COPY . .

RUN pnpm run build

# Stage 4: Run the application
FROM node:22.16.0-alpine AS runner

WORKDIR /usr/app

COPY --from=prod-deps /usr/app/node_modules ./node_modules
COPY --from=deps /usr/app/package.json ./package.json
COPY --from=builder /usr/app/dist ./dist

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "--run", "start"]
