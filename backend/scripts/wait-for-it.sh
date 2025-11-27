#!/bin/bash
# wait-for-it.sh - Espera a que un servicio esté disponible
# Uso simplificado: ./wait-for-it.sh hostname port [timeout]

HOST=$1
PORT=$2
TIMEOUT=${3:-60}

echo "Esperando a $HOST:$PORT..."

for i in $(seq 1 $TIMEOUT); do
    if nc -z $HOST $PORT &> /dev/null; then
        echo "$HOST:$PORT está disponible!"
        exit 0
    fi
    sleep 1
done

echo "Timeout: $HOST:$PORT no está disponible después de $TIMEOUT segundos"
exit 1
