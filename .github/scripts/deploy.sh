#!/bin/bash

# Exit on any error
set -e

# Configuration
APP_NAME="thebeltwaytimes"
APP_DIR="/opt/$APP_NAME"
BACKUP_DIR="/opt/backups"
SERVICE_NAME="$APP_NAME"
DEPLOYMENT_FILE="/tmp/deployment.tar.gz"
NODE_VERSION="20" # Explicitly set the Node.js version to match your GitHub Action

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

# Install nvm and Node.js
export NVM_DIR="$HOME/.nvm"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    log "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
fi
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

log "Installing and using Node.js v$NODE_VERSION"
nvm install $NODE_VERSION
nvm use $NODE_VERSION

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
npm run db:up:prod || warn "Database migration failed, continuing..."

# Create or update systemd service file
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
log "Creating/updating systemd service file"
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=The Beltway Times News Application
After=network.target mysql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=$HOME/.nvm/versions/node/v$NODE_VERSION/bin/node dist/server.js
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

# Start the service
log "Starting $SERVICE_NAME service"
sudo systemctl start "$SERVICE_NAME"

# Wait for the service to be ready
log "Waiting for application to start..."
MAX_WAIT=30
INTERVAL=2
ELAPSED=0
HEALTH_URL="http://localhost:3000/health"

while ! curl -s --fail "$HEALTH_URL"; do
    if [ $ELAPSED -ge $MAX_WAIT ]; then
        error "Application failed to start within $MAX_WAIT seconds."
        # Grab the last 50 lines of the service logs for debugging
        sudo journalctl -u $SERVICE_NAME -n 50
        break
    fi
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

# Check if service is running
if systemctl is-active --quiet "$SERVICE_NAME"; then
    log "✅ Deployment successful! $SERVICE_NAME is running"
else
    error "❌ Deployment failed! $SERVICE_NAME is not running. Initiating rollback..."
    
    # ROLLBACK PROCEDURE
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/"$APP_NAME"_*.tar.gz | head -n 1)
    
    if [ -f "$LATEST_BACKUP" ]; then
        log "Restoring from backup: $LATEST_BACKUP"
        sudo rm -rf "$APP_DIR"/*
        sudo tar -xzf "$LATEST_BACKUP" -C "$APP_DIR"
        
        if [ -f "/tmp/.env.backup" ]; then
            log "Restoring .env file"
            sudo cp /tmp/.env.backup "$APP_DIR/.env"
        fi
        
        log "Re-installing dependencies for rolled-back version"
        cd "$APP_DIR"
        npm ci --only=production
        
        log "Restarting $SERVICE_NAME service with rolled-back version"
        sudo systemctl start "$SERVICE_NAME"
        
        sleep 5
        
        if systemctl is-active --quiet "$SERVICE_NAME"; then
            warn "✅ Rollback successful! The previous version has been restored."
        else
            error "❌ Rollback failed! The application is in a failed state."
        fi
    else
        error "❌ No backup found to restore. The application is in a failed state."
    fi
    exit 1
fi

# Clean up deployment file
rm -f "$DEPLOYMENT_FILE"

log "Deployment completed successfully!"