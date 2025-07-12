#!/bin/bash

# Quick EC2 setup script for The Beltway Times deployment

set -e

echo "🚀 Setting up EC2 instance for deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
echo "🗄️ Installing MySQL..."
sudo apt install -y mysql-server

# Start and enable MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Create application directories
echo "📁 Creating application directories..."
sudo mkdir -p /opt/thebeltwaytimes
sudo mkdir -p /opt/backups
sudo chown -R $USER:$USER /opt/thebeltwaytimes
sudo chown -R $USER:$USER /opt/backups

# Install nginx
echo "🌐 Installing nginx..."
sudo apt install -y nginx

# Configure nginx
sudo tee /etc/nginx/sites-available/thebeltwaytimes > /dev/null <<EOF
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
sudo ln -sf /etc/nginx/sites-available/thebeltwaytimes /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Create environment file template
echo "⚙️ Creating environment file template..."
sudo tee /opt/thebeltwaytimes/.env.example > /dev/null <<EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=beltway_user
DB_PASSWORD=your_secure_password
DB_NAME=thebeltwaytimes

# Application Configuration
PORT=3000
NODE_ENV=production

# Session Secret
SESSION_SECRET=your-super-secure-session-secret
EOF

sudo chown $USER:$USER /opt/thebeltwaytimes/.env.example

echo "✅ EC2 setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Create your database: sudo mysql -u root -p"
echo "2. Create .env file: cp /opt/thebeltwaytimes/.env.example /opt/thebeltwaytimes/.env"
echo "3. Edit .env with your actual database credentials"
echo "4. Add GitHub secrets and push to trigger deployment" 