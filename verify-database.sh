#!/bin/bash

# Database verification script for EC2 instance

set -e

echo "🔍 Verifying database configuration..."

# Check if .env file exists
if [ ! -f "/opt/thebeltwaytimes/.env" ]; then
    echo "❌ .env file not found at /opt/thebeltwaytimes/.env"
    echo "Creating .env file..."
    sudo tee /opt/thebeltwaytimes/.env > /dev/null <<EOF
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
    sudo chown ubuntu:ubuntu /opt/thebeltwaytimes/.env
    sudo chmod 600 /opt/thebeltwaytimes/.env
    echo "✅ Created .env file. Please edit it with your actual credentials."
else
    echo "✅ .env file exists"
    echo "Current database configuration:"
    grep -E "DB_HOST|DB_USER|DB_NAME" /opt/thebeltwaytimes/.env
fi

# Check MySQL status
echo ""
echo "🗄️ Checking MySQL status..."
if systemctl is-active --quiet mysql; then
    echo "✅ MySQL is running"
else
    echo "❌ MySQL is not running. Starting..."
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

# Check if database exists
echo ""
echo "🔍 Checking database..."
DB_NAME=$(grep DB_NAME /opt/thebeltwaytimes/.env | cut -d'=' -f2)
DB_USER=$(grep DB_USER /opt/thebeltwaytimes/.env | cut -d'=' -f2)

if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo "❌ Database name or user not found in .env"
    exit 1
fi

echo "Database name: $DB_NAME"
echo "Database user: $DB_USER"

# Test database connection
echo ""
echo "🔗 Testing database connection..."
if mysql -u root -e "USE $DB_NAME;" 2>/dev/null; then
    echo "✅ Database '$DB_NAME' exists"
else
    echo "❌ Database '$DB_NAME' does not exist"
    echo "Creating database and user..."
    sudo mysql -u root -e "
    CREATE DATABASE IF NOT EXISTS $DB_NAME;
    CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY 'your_secure_password';
    GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
    FLUSH PRIVILEGES;
    "
    echo "✅ Database and user created"
fi

# Test application connection
echo ""
echo "🧪 Testing application database connection..."
cd /opt/thebeltwaytimes
node -e "
require('dotenv').config();
const mysql = require('mysql2/promise');
async function test() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✅ Application database connection successful!');
    await connection.end();
  } catch (error) {
    console.log('❌ Application database connection failed:', error.message);
  }
}
test();
"

echo ""
echo "🎯 Database verification complete!"
echo ""
echo "Next steps:"
echo "1. Edit /opt/thebeltwaytimes/.env with your actual database password"
echo "2. Run: sudo systemctl restart thebeltwaytimes"
echo "3. Check status: sudo systemctl status thebeltwaytimes" 