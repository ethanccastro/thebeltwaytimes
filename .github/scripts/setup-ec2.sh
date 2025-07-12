#!/bin/bash

# Exit on any error
set -e

# Configuration
APP_NAME="thebeltwaytimes"
APP_DIR="/opt/$APP_NAME"
NODE_VERSION="18"

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

log "Setting up EC2 instance for $APP_NAME deployment"

# Update system packages
log "Updating system packages"
sudo apt update && sudo apt upgrade -y

# Install essential packages
log "Installing essential packages"
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js
log "Installing Node.js $NODE_VERSION"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
log "Verifying Node.js installation"
node --version
npm --version

# Install MySQL
log "Installing MySQL"
sudo apt install -y mysql-server

# Secure MySQL installation
log "Securing MySQL installation"
sudo mysql_secure_installation

# Start and enable MySQL
log "Starting and enabling MySQL"
sudo systemctl start mysql
sudo systemctl enable mysql

# Install PM2 (alternative to systemd for process management)
log "Installing PM2 globally"
sudo npm install -g pm2

# Create application directory
log "Creating application directory"
sudo mkdir -p "$APP_DIR"
sudo mkdir -p "/opt/backups"

# Set proper permissions
log "Setting directory permissions"
sudo chown -R $USER:$USER "$APP_DIR"
sudo chown -R $USER:$USER "/opt/backups"

# Install nginx (optional, for reverse proxy)
log "Installing nginx"
sudo apt install -y nginx

# Configure nginx (basic configuration)
log "Configuring nginx"
sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable nginx site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    log "Configuring firewall"
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw --force enable
fi

# Create environment file template
log "Creating environment file template"
sudo tee "$APP_DIR/.env.example" > /dev/null <<EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Application Configuration
PORT=3000
NODE_ENV=production

# Session Secret
SESSION_SECRET=your-session-secret-key
EOF

# Set proper permissions for environment file
sudo chown $USER:$USER "$APP_DIR/.env.example"

log "✅ EC2 setup completed successfully!"
log ""
log "Next steps:"
log "1. Create a .env file in $APP_DIR with your actual database credentials"
log "2. Create a MySQL database and user for your application"
log "3. Add the required GitHub secrets for deployment"
log "4. Push to your main branch to trigger the first deployment"
log ""
log "To create the database and user, run:"
log "sudo mysql -u root -p"
log "CREATE DATABASE your_db_name;"
log "CREATE USER 'your_db_user'@'localhost' IDENTIFIED BY 'your_db_password';"
log "GRANT ALL PRIVILEGES ON your_db_name.* TO 'your_db_user'@'localhost';"
log "FLUSH PRIVILEGES;"
log "EXIT;" 