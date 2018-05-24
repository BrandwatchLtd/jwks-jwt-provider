FROM node:8-alpine

RUN apk add --no-cache openssl curl

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

EXPOSE 8088

HEALTHCHECK --start-period=5s --interval=5s CMD curl -sf http://localhost:8088 > /dev/null

CMD ["jwks-jwt"]
