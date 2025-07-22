#!/bin/bash
set -e

# Start Nginx in the background
nginx

# Start Node API with PM2
pm2 start ecosystem.config.js

# Show PM2 logs (keeps container running)
pm2 logs
