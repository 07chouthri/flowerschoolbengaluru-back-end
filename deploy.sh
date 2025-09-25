#!/bin/bash

# Hostinger VPS Deployment Script for E-commerce Backend
# Make sure to run this script with sudo privileges

echo "🚀 Starting deployment process..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
echo "📥 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js and npm installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install PM2 globally for process management
echo "🔧 Installing PM2..."
sudo npm install -g pm2

# Install PostgreSQL (if not already installed)
echo "🗄️ Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Create application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /var/www/ecommerce-backend
sudo chown -R $USER:$USER /var/www/ecommerce-backend
cd /var/www/ecommerce-backend

# Clone your repository (replace with your actual repository URL)
echo "📥 Cloning repository..."
# git clone https://github.com/yourusername/your-repo.git .

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building application..."
npm run build

# Create logs directory
mkdir -p logs

# Set up environment variables
echo "⚙️ Setting up environment variables..."
cp .env.production .env

# Set up PostgreSQL database
echo "🗄️ Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE ecommerce_db;"
sudo -u postgres psql -c "CREATE USER ecommerce_user WITH ENCRYPTED PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;"

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 5000  # Your application port
sudo ufw --force enable

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.json
pm2 save
pm2 startup

# Install and configure Nginx (optional reverse proxy)
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/ecommerce-backend << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
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

# Enable the Nginx site
sudo ln -s /etc/nginx/sites-available/ecommerce-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate with Let's Encrypt (optional)
echo "🔒 Installing SSL certificate..."
sudo apt install -y certbot python3-certbot-nginx
# sudo certbot --nginx -d your-domain.com -d www.your-domain.com

echo "✅ Deployment completed successfully!"
echo "🌐 Your backend is running on: http://your-server-ip:5000"
echo "📊 Monitor with: pm2 monit"
echo "📋 Check logs with: pm2 logs ecommerce-backend"
echo "🔄 Restart with: pm2 restart ecommerce-backend"