#!/bin/bash

# Application Deployment Script for Hostinger VPS
# Run this AFTER the initial server setup

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
BACKEND_DIR="/var/www/backend"
ECOMMERCE_DIR="/var/www/ecommerce-frontend"
FLOWER_DIR="/var/www/flower-frontend"
BACKUP_DIR="/var/backups/$(date +%Y%m%d-%H%M%S)"

# Function to backup existing deployments
backup_existing() {
    if [ -d "$BACKEND_DIR" ] || [ -d "$ECOMMERCE_DIR" ] || [ -d "$FLOWER_DIR" ]; then
        echo "📦 Creating backup of existing deployments..."
        mkdir -p "$BACKUP_DIR"
        
        [ -d "$BACKEND_DIR" ] && cp -r "$BACKEND_DIR" "$BACKUP_DIR/backend"
        [ -d "$ECOMMERCE_DIR" ] && cp -r "$ECOMMERCE_DIR" "$BACKUP_DIR/ecommerce-frontend"
        [ -d "$FLOWER_DIR" ] && cp -r "$FLOWER_DIR" "$BACKUP_DIR/flower-frontend"
        
        print_success "Backup created at $BACKUP_DIR"
    fi
}

# Function to deploy backend
deploy_backend() {
    echo "🚀 Deploying Backend API..."
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found at $BACKEND_DIR"
        echo "Please upload your BACK-END code to $BACKEND_DIR first"
        return 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    echo "📦 Installing backend dependencies..."
    npm install --production
    
    # Build if build script exists
    if npm run | grep -q "build"; then
        echo "🔨 Building backend..."
        npm run build
    fi
    
    # Check for environment file
    if [ ! -f ".env" ]; then
        print_warning "No .env file found. Creating from template..."
        if [ -f "/var/www/.env.template" ]; then
            cp /var/www/.env.template .env
            print_warning "Please edit .env file with your actual values before starting the application"
        else
            print_error "No .env template found. Please create .env file manually."
            return 1
        fi
    fi
    
    # Start/restart with PM2
    if pm2 list | grep -q "backend"; then
        echo "🔄 Restarting existing backend process..."
        pm2 restart backend
    else
        echo "▶️  Starting backend with PM2..."
        if [ -f "ecosystem.config.json" ]; then
            pm2 start ecosystem.config.json
        else
            pm2 start index.ts --name "backend" --interpreter ts-node
        fi
    fi
    
    pm2 save
    print_success "Backend deployed and running"
}

# Function to deploy e-commerce frontend
deploy_ecommerce() {
    echo "🛒 Deploying E-Commerce Frontend..."
    
    if [ ! -d "$ECOMMERCE_DIR" ]; then
        print_error "E-Commerce directory not found at $ECOMMERCE_DIR"
        echo "Please upload your E-COMMES-CORRECT-SORCE-NO-ERROR-ALL-OK code to $ECOMMERCE_DIR first"
        return 1
    fi
    
    cd "$ECOMMERCE_DIR"
    
    # Install dependencies
    echo "📦 Installing e-commerce dependencies..."
    npm install
    
    # Build for production
    echo "🔨 Building e-commerce frontend..."
    npm run build
    
    # Update Nginx configuration
    echo "🌐 Updating Nginx configuration for main domain..."
    cat > /etc/nginx/sites-available/flowerschoolbengaluru.com << 'EOF'
server {
    listen 80;
    server_name flowerschoolbengaluru.com www.flowerschoolbengaluru.com;
    root /var/www/ecommerce-frontend/client/dist;
    index index.html;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000";
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

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF
    
    nginx -t && systemctl reload nginx
    print_success "E-Commerce frontend deployed"
}

# Function to deploy flower school frontend
deploy_flower_school() {
    echo "🌸 Deploying Flower School Frontend..."
    
    if [ ! -d "$FLOWER_DIR" ]; then
        print_error "Flower School directory not found at $FLOWER_DIR"
        echo "Please upload your FROUNT-END-FLOWER code to $FLOWER_DIR first"
        return 1
    fi
    
    cd "$FLOWER_DIR"
    
    # Install dependencies
    echo "📦 Installing flower school dependencies..."
    npm install
    
    # Build for production
    echo "🔨 Building flower school frontend..."
    npm run build
    
    # Update Nginx configuration
    echo "🌐 Updating Nginx configuration for subdomain..."
    cat > /etc/nginx/sites-available/app.flowerschoolbengaluru.com << 'EOF'
server {
    listen 80;
    server_name app.flowerschoolbengaluru.com;
    root /var/www/flower-frontend/dist;
    index index.html;

    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF
    
    nginx -t && systemctl reload nginx
    print_success "Flower School frontend deployed"
}

# Function to setup SSL
setup_ssl() {
    echo "🔒 Setting up SSL certificates..."
    
    print_warning "Setting up SSL for flowerschoolbengaluru.com..."
    if certbot --nginx -d flowerschoolbengaluru.com -d www.flowerschoolbengaluru.com --non-interactive --agree-tos --email admin@flowerschoolbengaluru.com; then
        print_success "SSL certificate installed for main domain"
    else
        print_warning "SSL setup failed for main domain. You can try manually later."
    fi
    
    print_warning "Setting up SSL for app.flowerschoolbengaluru.com..."
    if certbot --nginx -d app.flowerschoolbengaluru.com --non-interactive --agree-tos --email admin@flowerschoolbengaluru.com; then
        print_success "SSL certificate installed for subdomain"
    else
        print_warning "SSL setup failed for subdomain. You can try manually later."
    fi
}

# Function to set permissions
set_permissions() {
    echo "🔧 Setting proper permissions..."
    chown -R www-data:www-data /var/www/
    chmod -R 755 /var/www/
    print_success "Permissions set"
}

# Function to run tests
run_tests() {
    echo "🧪 Running deployment tests..."
    
    # Test backend
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        print_success "Backend API is responding"
    else
        print_warning "Backend API test failed - check PM2 logs"
    fi
    
    # Test frontend files
    if [ -f "/var/www/ecommerce-frontend/client/dist/index.html" ]; then
        print_success "E-Commerce frontend built successfully"
    else
        print_warning "E-Commerce frontend build files not found"
    fi
    
    if [ -f "/var/www/flower-frontend/dist/index.html" ]; then
        print_success "Flower School frontend built successfully"
    else
        print_warning "Flower School frontend build files not found"
    fi
    
    # Test Nginx
    if nginx -t >/dev/null 2>&1; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration has errors"
    fi
}

# Function to show status
show_status() {
    echo ""
    echo "📊 Deployment Status:"
    echo "===================="
    
    echo ""
    echo "🔧 PM2 Processes:"
    pm2 status
    
    echo ""
    echo "🌐 Nginx Status:"
    systemctl status nginx --no-pager -l
    
    echo ""
    echo "🔗 Your Applications:"
    echo "Main E-Commerce: https://flowerschoolbengaluru.com"
    echo "Flower School: https://app.flowerschoolbengaluru.com"
    echo "API Endpoints: https://flowerschoolbengaluru.com/api/*"
    
    echo ""
    echo "📝 Useful Commands:"
    echo "pm2 logs           # View application logs"
    echo "pm2 restart all    # Restart all applications"
    echo "nginx -t           # Test Nginx configuration"
    echo "systemctl reload nginx  # Reload Nginx"
    
    print_success "Deployment completed!"
}

# Main function
main() {
    echo "🚀 Starting Application Deployment..."
    echo "====================================="
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
    
    # Confirmation
    echo "This will deploy your applications to:"
    echo "- Backend: $BACKEND_DIR"
    echo "- E-Commerce: $ECOMMERCE_DIR"  
    echo "- Flower School: $FLOWER_DIR"
    echo ""
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
    
    # Create backup
    backup_existing
    
    # Deploy applications
    deploy_backend
    deploy_ecommerce
    deploy_flower_school
    
    # Set permissions
    set_permissions
    
    # Run tests
    run_tests
    
    # Setup SSL (optional)
    read -p "Setup SSL certificates now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    fi
    
    # Show final status
    show_status
}

# Run main function
main "$@"