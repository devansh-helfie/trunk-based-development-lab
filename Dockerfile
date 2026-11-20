# Pin the official runtime so a moving base tag cannot silently change this build.
FROM node:24-bookworm-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY src/ ./src/
COPY public/ ./public/
RUN mkdir -p /app/data && chown node:node /app/data

ARG COMMIT_SHA=unknown
ARG BUILD_RUN_ID=unknown
LABEL org.opencontainers.image.source="https://github.com/devansh-helfie/trunk-based-development-lab" \
      org.opencontainers.image.revision="${COMMIT_SHA}"

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    COMMIT_SHA=${COMMIT_SHA} \
    BUILD_RUN_ID=${BUILD_RUN_ID}

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health',{signal:AbortSignal.timeout(2000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
