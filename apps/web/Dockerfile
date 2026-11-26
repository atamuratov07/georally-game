FROM node:24-alpine AS deps
RUN corepack enable
WORKDIR /app


COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/game-domain/package.json packages/game-domain/package.json
COPY packages/game-protocol/package.json packages/game-protocol/package.json
COPY packages/country-catalog/package.json packages/country-catalog/package.json
COPY packages/mastery/package.json packages/mastery/package.json
RUN pnpm ci

FROM deps AS build
COPY apps/web apps/web
COPY packages/game-domain packages/game-domain
COPY packages/game-protocol packages/game-protocol
COPY packages/country-catalog packages/country-catalog
COPY packages/mastery packages/mastery

RUN pnpm --filter @georally/web... build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1

EXPOSE 80
