# Deployment Guide for The Beltway Times

This guide explains how to set up automated deployment from GitHub to an EC2 instance using GitHub Actions.

## Prerequisites

1. An EC2 instance running Ubuntu (recommended: t3.medium or larger)
2. A GitHub repository with your code
3. AWS credentials with EC2 access
4. SSH key pair for EC2 access

## Step 1: EC2 Instance Setup

### 1.1 Launch EC2 Instance
- Launch an Ubuntu 22.04 LTS instance
- Choose an appropriate instance type (t3.medium recommended)
- Configure security groups to allow:
  - SSH (port 22) from your IP
  - HTTP (port 80) from anywhere
  - HTTPS (port 443) from anywhere (if using SSL)

### 1.2 Run Setup Script
Connect to your EC2 instance and run the setup script:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/yourusername/thebeltwaytimes/main/.github/scripts/setup-ec2.sh | bash
```

Or manually copy and run the setup script from `.github/scripts/setup-ec2.sh`.

### 1.3 Configure Database
After the setup script completes, create your MySQL database:

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE thebeltwaytimes;
CREATE USER 'beltway_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON thebeltwaytimes.* TO 'beltway_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.4 Create Environment File
Create the production environment file:

```bash
sudo cp /opt/thebeltwaytimes/.env.example /opt/thebeltwaytimes/.env
sudo nano /opt/thebeltwaytimes/.env
```

Update the file with your actual database credentials:

```env
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
```

## Step 2: GitHub Repository Setup

### 2.1 Add GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions, and add the following secrets:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: Your AWS region (e.g., us-east-1)
- `EC2_HOST`: Your EC2 instance public IP or domain
- `EC2_USER`: SSH user (usually `ubuntu`)
- `EC2_SSH_KEY`: Your private SSH key content

### 2.2 SSH Key Setup
Generate an SSH key pair if you haven't already:

```bash
ssh-keygen -t rsa -b 4096 -C "github-actions"
```

Add the public key to your EC2 instance:

```bash
# On your local machine
cat ~/.ssh/id_rsa.pub

# On EC2 instance
echo "your_public_key_content" >> ~/.ssh/authorized_keys
```

Add the private key content to the `EC2_SSH_KEY` GitHub secret.

## Step 3: GitHub Actions Workflow

The workflow is already configured in `.github/workflows/deploy.yml`. It will:

1. **Test Job**: Run tests with MySQL in a container
2. **Deploy Job**: Build and deploy to EC2 (only on main/master branch)

### Workflow Features:
- ✅ Runs tests before deployment
- ✅ Linting and code quality checks
- ✅ Automatic backup of previous deployment
- ✅ Zero-downtime deployment
- ✅ Automatic service restart
- ✅ Database migration handling
- ✅ Comprehensive logging

## Step 4: First Deployment

1. Push your code to the main branch:
```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

2. Monitor the deployment in GitHub Actions:
   - Go to your repository → Actions tab
   - Watch the "Deploy to EC2" workflow

3. Check the deployment on your EC2 instance:
```bash
# Check service status
sudo systemctl status thebeltwaytimes

# View logs
sudo journalctl -u thebeltwaytimes -f

# Check if the application is responding
curl http://localhost:3000
```

## Step 5: Domain and SSL Setup (Optional)

### 5.1 Configure Domain
If you have a domain, update your DNS to point to your EC2 instance's public IP.

### 5.2 SSL Certificate with Let's Encrypt
Install Certbot and get a free SSL certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 5.3 Update Nginx Configuration
The setup script creates a basic nginx configuration. For production, you might want to customize it further.

## Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   sudo systemctl status thebeltwaytimes
   sudo journalctl -u thebeltwaytimes -n 50
   ```

2. **Database connection issues**
   - Check MySQL is running: `sudo systemctl status mysql`
   - Verify credentials in `.env` file
   - Test connection: `mysql -u beltway_user -p`

3. **Permission issues**
   ```bash
   sudo chown -R ubuntu:ubuntu /opt/thebeltwaytimes
   sudo chmod -R 755 /opt/thebeltwaytimes
   ```

4. **Port conflicts**
   ```bash
   sudo netstat -tlnp | grep :3000
   sudo lsof -i :3000
   ```

### Rollback Deployment
If a deployment fails, you can rollback to the previous version:

```bash
# List backups
ls -la /opt/backups/

# Restore from backup
sudo systemctl stop thebeltwaytimes
sudo rm -rf /opt/thebeltwaytimes/*
sudo tar -xzf /opt/backups/thebeltwaytimes_YYYYMMDD_HHMMSS.tar.gz -C /opt/thebeltwaytimes/
sudo systemctl start thebeltwaytimes
```

## Monitoring and Maintenance

### Log Monitoring
```bash
# Real-time logs
sudo journalctl -u thebeltwaytimes -f

# Recent logs
sudo journalctl -u thebeltwaytimes --since "1 hour ago"
```

### Performance Monitoring
```bash
# Check resource usage
htop
df -h
free -h

# Check application health
curl http://localhost:3000/health
```

### Regular Maintenance
- Keep the system updated: `sudo apt update && sudo apt upgrade`
- Monitor disk space: `df -h`
- Check for security updates: `sudo unattended-upgrades --dry-run`

## Security Considerations

1. **Firewall**: The setup script configures UFW firewall
2. **SSH**: Use key-based authentication only
3. **Database**: Use strong passwords and limit access
4. **Environment Variables**: Never commit sensitive data to git
5. **Updates**: Keep the system and dependencies updated

## Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Review the EC2 instance logs
3. Verify all secrets are correctly configured
4. Ensure the EC2 instance has proper permissions 