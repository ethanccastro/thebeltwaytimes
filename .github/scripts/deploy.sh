#!/bin/bash

# Exit on any error
set -e

# Configuration
APP_NAME="thebeltwaytimes"
APP_DIR="/opt/$APP_NAME"
BACKUP_DIR="/opt/backups"
SERVICE_NAME="$APP_NAME"
DEPLOYMENT_FILE="/tmp/deployment.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if deployment file exists
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    error "Deployment file not found: $DEPLOYMENT_FILE"
    exit 1
fi

log "Starting deployment for $APP_NAME"

# Create directories if they don't exist
sudo mkdir -p "$APP_DIR"
sudo mkdir -p "$BACKUP_DIR"

# Stop the service if it's running
if systemctl is-active --quiet "$SERVICE_NAME"; then
    log "Stopping $SERVICE_NAME service"
    sudo systemctl stop "$SERVICE_NAME"
fi

# Create backup of current deployment
if [ -d "$APP_DIR" ] && [ "$(ls -A $APP_DIR)" ]; then
    log "Creating backup of current deployment"
    BACKUP_FILE="$BACKUP_DIR/${APP_NAME}_$(date +%Y%m%d_%H%M%S).tar.gz"
    sudo tar -czf "$BACKUP_FILE" -C "$APP_DIR" .
    log "Backup created: $BACKUP_FILE"
fi

# Backup .env file if it exists
if [ -f "$APP_DIR/.env" ]; then
    log "Backing up existing .env file"
    sudo cp "$APP_DIR/.env" /tmp/.env.backup
fi

# Clean the app directory
log "Cleaning application directory"
sudo rm -rf "$APP_DIR"/*

# Extract new deployment
log "Extracting new deployment"
sudo tar -xzf "$DEPLOYMENT_FILE" -C "$APP_DIR"

# Set proper permissions
log "Setting permissions"
sudo chown -R $USER:$USER "$APP_DIR"
sudo chmod -R 755 "$APP_DIR"

# Restore .env file if it was backed up
if [ -f "/tmp/.env.backup" ]; then
    log "Restoring .env file"
    sudo cp /tmp/.env.backup "$APP_DIR/.env"
    sudo chown $USER:$USER "$APP_DIR/.env"
    sudo chmod 600 "$APP_DIR/.env"
    sudo rm /tmp/.env.backup
else
    log "No .env file found to restore"
fi

# Install dependencies
log "Installing dependencies"
cd "$APP_DIR"
npm ci --only=production

# Run database migrations
log "Running database migrations"
npm run db:up || warn "Database migration failed, continuing..."

# Create systemd service file if it doesn't exist
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
if [ ! -f "$SERVICE_FILE" ]; then
    log "Creating systemd service file"
    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=The Beltway Times News Application
After=network.target mysql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    sudo systemctl daemon-reload
    sudo systemctl enable "$SERVICE_NAME"
fi

# Start the service
log "Starting $SERVICE_NAME service"
sudo systemctl start "$SERVICE_NAME"

# Wait a moment for the service to start
sleep 5

# Check if service is running
if systemctl is-active --quiet "$SERVICE_NAME"; then
    log "✅ Deployment successful! $SERVICE_NAME is running"
    
    # Get service status
    sudo systemctl status "$SERVICE_NAME" --no-pager -l
    
    # Show recent logs
    log "Recent service logs:"
    sudo journalctl -u "$SERVICE_NAME" --no-pager -n 20
else
    error "❌ Deployment failed! $SERVICE_NAME is not running"
    log "Service status:"
    sudo systemctl status "$SERVICE_NAME" --no-pager -l
    log "Recent service logs:"
    sudo journalctl -u "$SERVICE_NAME" --no-pager -n 30
    log "Application directory contents:"
    ls -la "$APP_DIR"
    log "Checking if .env file exists:"
    if [ -f "$APP_DIR/.env" ]; then
        log "✅ .env file exists"
        log "Database configuration:"
        grep -E "DB_HOST|DB_USER|DB_NAME" "$APP_DIR/.env" || log "No database config found in .env"
    else
        log "❌ .env file missing"
    fi
    log "Trying to start application manually for debugging:"
    cd "$APP_DIR"
    timeout 10s node dist/index.js || log "Manual start failed (expected if no .env)"
    exit 1
fi

# Clean up deployment file
rm -f "$DEPLOYMENT_FILE"

log "Deployment completed successfully!" 