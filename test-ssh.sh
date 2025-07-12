#!/bin/bash

# Test SSH key format and connection
echo "🔍 Testing SSH key setup..."

# Create test directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Test if you have the key locally (replace with your actual key path)
if [ -f ~/.ssh/id_rsa ]; then
    echo "✅ Found local SSH key"
    cp ~/.ssh/id_rsa ~/.ssh/test_key
    chmod 600 ~/.ssh/test_key
    
    # Test connection (replace with your EC2 details)
    echo "🔗 Testing SSH connection..."
    ssh -i ~/.ssh/test_key -o StrictHostKeyChecking=no ubuntu@YOUR_EC2_IP "echo 'SSH connection successful!'"
else
    echo "❌ No local SSH key found at ~/.ssh/id_rsa"
    echo "Please generate an SSH key pair:"
    echo "ssh-keygen -t rsa -b 4096 -C 'github-actions'"
fi 