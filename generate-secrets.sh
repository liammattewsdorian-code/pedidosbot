#!/bin/bash

# This script generates secure random secrets using openssl.

# Generating AUTH_SECRET
AUTH_SECRET=$(openssl rand -base64 32)
echo "AUTH_SECRET: $AUTH_SECRET"

# Generating BOT_API_SECRET
BOT_API_SECRET=$(openssl rand -base64 32)
echo "BOT_API_SECRET: $BOT_API_SECRET"

# Generating META_WEBHOOK_VERIFY_TOKEN
META_WEBHOOK_VERIFY_TOKEN=$(openssl rand -base64 32)
echo "META_WEBHOOK_VERIFY_TOKEN: $META_WEBHOOK_VERIFY_TOKEN"

# The generated secrets are printed to standard output. You can save them for use in your application.