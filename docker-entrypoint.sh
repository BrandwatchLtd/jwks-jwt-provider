#!/bin/ash

set -e

mkdir -p /etc/jwks-jwt/certs
mkdir -p /etc/jwks-jwt/data
mkdir -p /etc/jwks-jwt/keys

openssl req \
	-x509 \
	-newkey rsa:4096 -nodes \
	-subj "/CN=JZ" \
	-keyout /etc/jwks-jwt/keys/private.key \
   	-out /etc/jwks-jwt/certs/public.crt

jwks4jwt -certdir /etc/jwks-jwt/certs > /etc/jwks-jwt/data/jwks.json

exec "$@"
