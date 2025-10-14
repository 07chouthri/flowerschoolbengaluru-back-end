# Deployment Guide - Hostinger VPS

## 📋 Prerequisites

1. **Hostinger VPS Account** with Ubuntu/Debian Linux
2. **Domain Name** (optional but recommended)
3. **SSH Access** to your VPS
4. **Git Repository** with your backend code

## 🚀 Step-by-Step Deployment

### Step 1: Access Your VPS

```bash
ssh root@your-server-ip
# or
ssh username@your-server-ip
```

### Step 2: Upload Your Code

**Option A: Using Git (Recommended)**
```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

**Option B: Using SCP/SFTP**
```bash
# From your local machine
scp -r ./BACK-END root@your-server-ip:/var/www/ecommerce-backend
```

### Step 3: Run the Deployment Script

```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

### Step 4: Configure Environment Variables

Edit the `.env` file with your production values:
```bash
nano .env
```

### Step 5: Database Setup

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE ecommerce_db;
CREATE USER ecommerce_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ecommerce_db TO ecommerce_user;
\q
```

Update your `.env` file:
```
DATABASE_URL="postgresql://ecommerce_user:your_secure_password@localhost:5432/ecommerce_db"
```

### Step 6: Start the Application

```bash
npm run build
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

## 🔧 Configuration Details

### Environment Variables (.env)

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
# ... other variables
```

### PM2 Process Management

```bash
# Check status
pm2 status

# View logs
pm2 logs ecommerce-backend

# Restart application
pm2 restart ecommerce-backend

# Stop application
pm2 stop ecommerce-backend

# Monitor real-time
pm2 monit
```

### Nginx Configuration (Optional)

For production, use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔒 Security Checklist

- [ ] Change default SSH port
- [ ] Disable root login
- [ ] Set up firewall (UFW)
- [ ] Use SSL certificates
- [ ] Regular security updates
- [ ] Strong database passwords
- [ ] Environment variable security

## 📊 Monitoring & Maintenance

### Log Files
```bash
# Application logs
tail -f /var/www/ecommerce-backend/logs/combined.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
tail -f /var/log/syslog
```

### Performance Monitoring
```bash
# CPU and Memory usage
htop

# Disk usage
df -h

# PM2 monitoring
pm2 monit
```

## 🔄 Updates & Deployment

### Automated Deployment Script

Create `update.sh`:
```bash
#!/bin/bash
git pull origin main
npm install --production
npm run build
pm2 restart ecommerce-backend
```

### Manual Update Process
```bash
cd /var/www/ecommerce-backend
git pull origin main
npm install --production
npm run build
pm2 restart ecommerce-backend
```

## 🆘 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   sudo systemctl status postgresql
   sudo systemctl restart postgresql
   ```

3. **Permission Issues**
   ```bash
   sudo chown -R $USER:$USER /var/www/ecommerce-backend
   chmod +x deploy.sh
   ```

4. **Firewall Issues**
   ```bash
   sudo ufw status
   sudo ufw allow 5000
   ```

### Useful Commands

```bash
# Check if app is running
curl http://localhost:5000/health

# Check system resources
free -h
df -h
top

# Check network connections
netstat -tlnp | grep :5000
```

## 📞 Support

- **PM2 Documentation**: https://pm2.keymetrics.io/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Hostinger Support**: https://support.hostinger.com/

## 🎯 Next Steps

1. Set up domain DNS
2. Configure SSL certificate
3. Set up monitoring (optional: New Relic, DataDog)
4. Configure automated backups
5. Set up CI/CD pipeline (GitHub Actions)