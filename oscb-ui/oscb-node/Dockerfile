FROM node:18

WORKDIR /usr/src/app

COPY oscb-ui/oscb-node/package*.json ./
# Reproducible dependency installation with a lockfile; preserve npm install
# as the fallback for older repositories that have no package-lock.json.
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    else npm install --no-audit --no-fund; fi

COPY oscb-ui/oscb-node/ ./
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN mkdir -p uploads \
    && chmod +x deploy.sh deploy_companion.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
EXPOSE 3001 3020
# Keep legacy two-script lifecycle until their actual source is available for review.
CMD ["sh", "-c", "./deploy.sh & ./deploy_companion.sh"]
