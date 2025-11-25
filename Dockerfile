FROM node:20-bullseye

# Install dependencies first
RUN apt-get update && apt-get install -y \
    python3 \
    python3-dev \
    python3-pip \
    ca-certificates \
    curl \
    gnupg \
    nginx \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

## Change loop:registry with your private npm registry if needed

ARG NPM_AUTH_TOKEN
RUN echo "registry=https://registry.npmjs.org/" > /root/.npmrc && \
    echo "@authlance:registry=https://npm.pkg.github.com/" >> /root/.npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_AUTH_TOKEN}" >> /root/.npmrc && \
    echo "always-auth=true" >> /root/.npmrc

COPY package.json lerna.json yarn.lock tsconfig.json ./
COPY examples/browser/package.json examples/browser/package.json
COPY scripts ./scripts
COPY configs ./configs
COPY ./deployment/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./deployment/nginx/duna.conf /etc/nginx/sites-enabled/duna.conf
COPY deployment/startup/start-loop.sh /app/start-loop.sh
COPY packages ./packages
COPY examples ./examples

RUN rm -f examples/browser/.env && mv examples/browser/.env-production examples/browser/.env && rm -rf deployment
RUN sed -i.bak 's/--mode development/--mode production/' examples/browser/package.json

# ensure frontend is built in a minified way
RUN yarn install --frozen-lockfile

RUN cd examples/browser && \
  mkdir -p lib/styles && \
  npx tailwindcss -i ./src/styles/index.css \
    -o ./lib/styles/output.css \
    --content "./src-gen/frontend/**/*.{js,ts,jsx,tsx}" \
    --content "../../node_modules/@authlance/**/*.{js,ts,jsx,tsx}" \
    --content "../../node_modules/@loop/**/*.{js,ts,jsx,tsx}" && \
  rm -f lib/styles/index.css && \
  mv lib/styles/output.css lib/styles/index.css && \
  rm -f ./lib/*.js.map ./lib/*.js.map.gz ./lib/*.css.map ./lib/*.css.map.gz

RUN yarn run build:prod

RUN cd examples/browser && \
  rm -f ./lib/*.js.map ./lib/*.js.map.gz ./lib/*.css.map ./lib/*.css.map.gz

RUN rm /root/.npmrc && rm -rf /app/configs

RUN chmod +x /app/start-loop.sh

RUN groupadd -g 102 nginx && \
    useradd -r -u 101 -g 102 -s /sbin/nologin -d /var/cache/nginx nginx

EXPOSE 3000

# Start command
CMD ["/app/start-loop.sh"]
