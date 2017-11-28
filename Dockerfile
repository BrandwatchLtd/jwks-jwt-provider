FROM node:6-alpine

RUN apk add --no-cache openssl

WORKDIR /usr/bin

RUN wget https://github.com/BrandwatchLtd/jwks4jwt/releases/download/v0.1.0/jwks4jwt_linux_386 \
     -O jwks4jwt

RUN chmod +x jwks4jwt

COPY docker-entrypoint.sh docker-entrypoint

COPY start.sh jwks-jwt

ENTRYPOINT ["docker-entrypoint"]

WORKDIR /usr/local/jwks-jwt

COPY package.json yarn.lock ./
RUN yarn install --non-interactive && yarn cache clean

COPY index.js ./

CMD ["jwks-jwt"]
