#!/bin/sh
set -e

# Génère le certificat SSL au démarrage s'il n'existe pas
if [ ! -f /etc/nginx/ssl/transcendence.crt ]; then
    mkdir -p /etc/nginx/ssl
    cd /etc/nginx/ssl
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout transcendence.key \
        -out transcendence.crt \
        -subj "/C=FR/ST=France/L=Paris/O=42/OU=Transcendence/CN=${DOMAIN_NAME:-localhost}"
    
    chmod 600 transcendence.key
    chmod 644 transcendence.crt
fi

# Lance nginx au premier plan
exec nginx -g "daemon off;"