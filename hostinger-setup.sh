#!/bin/bash

# Hostinger VPS Deployment Script
# Run this script on your Hostinger VPS server

set -e  # Exit on any error

echo "🚀 Starting Hostinger VPS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is recommended for initial setup."
    else
        print_warning "Not running as root. Some commands may require sudo."
    fi
}

# Function to update system
update_system() {
    echo "📦 Updating system packages..."
    apt update && apt upgrade -y
    print_success "System updated"
}

# Function to install Node.js
install_nodejs() {
    echo "📦 Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    print_success "Node.js installed: $node_version, npm: $npm_version"
}

# Function to install essential packages
install_packages() {
    echo "📦 Installing essential packages..."
    apt install -y git nginx postgresql postgresql-contrib certbot python3-certbot-nginx curl wget unzip htop
    print_success "Essential packages installed"
}

# Function to install PM2
install_pm2() {
    echo "📦 Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
}

# Function to setup firewall
setup_firewall() {
    echo "🔥 Setting up firewall..."
    ufw --force enable
    ufw allow ssh
    ufw allow 80
    ufw allow 443
    ufw allow 5000
    print_success "Firewall configured"
}

# Function to setup PostgreSQL
setup_database() {
    echo "🗄️  Setting up PostgreSQL..."
    systemctl start postgresql
    systemctl enable postgresql
    
    # Check if database exists
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw bouquetbar; then
        print_warning "Database 'bouquetbar' already exists"
    else
        print_warning "Creating database. You'll need to set a password for 'bouquetuser'"
        read -s -p "Enter password for database user 'bouquetuser': " db_password
        echo
        
        sudo -u postgres psql << EOF
CREATE DATABASE bouquetbar;
CREATE USER bouquetuser WITH ENCRYPTED PASSWORD '$db_password';
GRANT ALL PRIVILEGES ON DATABASE bouquetbar TO bouquetuser;
ALTER USER bouquetuser CREATEDB;
EOF
        print_success "Database 'bouquetbar' created with user 'bouquetuser'"
        
        # Save database URL for later use
        echo "DATABASE_URL=\"postgresql://bouquetuser:$db_password@localhost:5432/bouquetbar\"" > /tmp/db_config
    fi
}

# Function to create directory structure
setup_directories() {
    echo "📁 Setting up directory structure..."
    mkdir -p /var/www
    print_success "Directories created"
}

# Function to setup Nginx basic configuration
setup_nginx() {
    echo "🌐 Setting up Nginx..."
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Create basic config for flowerschoolbengaluru.com
    cat > /etc/nginx/sites-available/flowerschoolbengaluru.com << 'EOF'
server {
    listen 80;
    server_name flowerschoolbengaluru.com www.flowerschoolbengaluru.com;
    
    # Temporary redirect to show setup is working
    location / {
        return 200 'Backend API is running! Deploy your frontend here.';
        add_header Content-Type text/plain;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
EOF

    # Create basic config for app.flowerschoolbengaluru.com
    cat > /etc/nginx/sites-available/app.flowerschoolbengaluru.com << 'EOF'
server {
    listen 80;
    server_name app.flowerschoolbengaluru.com;
    
    # Temporary redirect to show setup is working
    location / {
        return 200 'Flower School Frontend will be deployed here!';
        add_header Content-Type text/plain;
    }
}
EOF

    # Enable sites
    ln -sf /etc/nginx/sites-available/flowerschoolbengaluru.com /etc/nginx/sites-enabled/
    ln -sf /etc/nginx/sites-available/app.flowerschoolbengaluru.com /etc/nginx/sites-enabled/
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    print_success "Nginx configured"
}

# Function to create environment file template
create_env_template() {
    echo "⚙️  Creating environment template..."
    
    cat > /var/www/.env.template << 'EOF'
# Production Environment Variables for Hostinger VPS
NODE_ENV=production

# Database Configuration (Update with your actual database URL)
DATABASE_URL="postgresql://bouquetuser:YOUR_PASSWORD@localhost:5432/bouquetbar"

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Twilio Configuration (Replace with your production credentials)
TWILIO_ACCOUNT_SID=your_production_twilio_account_sid
TWILIO_AUTH_TOKEN=your_production_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_production_verify_service_sid
TWILIO_PHONE_NUMBER=your_production_twilio_phone_number
TWILIO_WHATSAPP_NUMBER=your_production_whatsapp_number

# Admin Configuration
ADMIN_PHONE=+919042358932
ADMIN_EMAILS=admin@bouquetbar.com,support@bouquetbar.com,vasuchouthri811@gmail.com

# CORS Configuration
CORS_ORIGINS=https://flowerschoolbengaluru.com,https://app.flowerschoolbengaluru.com

# Session Secret (Generate a strong secret)
SESSION_SECRET=your_super_secure_session_secret_here_make_it_very_long_and_random

# SSL Configuration
USE_SSL=false
EOF
    
    print_success "Environment template created at /var/www/.env.template"
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo "🎉 Basic server setup complete!"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "1. Upload your code to /var/www/"
    echo "   - Backend goes to: /var/www/backend/"
    echo "   - E-COMMES goes to: /var/www/ecommerce-frontend/"
    echo "   - FROUNT-END-FLOWER goes to: /var/www/flower-frontend/"
    echo ""
    echo "2. Configure environment variables:"
    echo "   - Copy /var/www/.env.template to your backend directory"
    echo "   - Update with your actual values"
    echo ""
    echo "3. Install dependencies and build your applications"
    echo ""
    echo "4. Setup SSL certificates:"
    echo "   certbot --nginx -d flowerschoolbengaluru.com -d www.flowerschoolbengaluru.com"
    echo "   certbot --nginx -d app.flowerschoolbengaluru.com"
    echo ""
    echo "5. Start your backend with PM2"
    echo ""
    echo "🔗 Useful commands:"
    echo "   pm2 status          # Check running processes"
    echo "   nginx -t            # Test Nginx configuration"
    echo "   systemctl status nginx  # Check Nginx status"
    echo "   tail -f /var/log/nginx/error.log  # Check Nginx errors"
    echo ""
    print_success "Setup complete! Follow the deployment guide for detailed steps."
}

# Main execution
main() {
    check_root
    
    echo "This script will set up your Hostinger VPS for deployment."
    echo "It will install Node.js, PostgreSQL, Nginx, and other essentials."
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
    
    update_system
    install_nodejs
    install_packages
    install_pm2
    setup_firewall
    setup_database
    setup_directories
    setup_nginx
    create_env_template
    show_next_steps
}

# Run main function
main "$@"