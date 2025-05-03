#!/bin/bash

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print section header
section() {
  echo -e "\n${GREEN}==== $1 ====${NC}\n"
}

# Print info message
info() {
  echo -e "${YELLOW}$1${NC}"
}

# Print error message
error() {
  echo -e "${RED}ERROR: $1${NC}"
  exit 1
}

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
  error "This script must be run as root. Try 'sudo ./deploy-vps-cloud-mongodb.sh'"
fi

# Get domain name
read -p "Enter your domain name (e.g., example.com): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
  error "Domain name cannot be empty"
fi

# Get application directory
read -p "Enter application directory (default: /var/www/canva-editor): " APP_DIR
APP_DIR=${APP_DIR:-/var/www/canva-editor}

# Get repository URL
read -p "Enter git repository URL (leave empty to skip git clone): " REPO_URL

section "Updating System Packages"
apt update
apt upgrade -y || error "Failed to update system packages"

section "Installing Node.js"
if ! command -v node &> /dev/null; then
  info "Node.js not found, installing..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs || error "Failed to install Node.js"
else
  info "Node.js is already installed: $(node -v)"
fi

section "Installing PM2"
if ! command -v pm2 &> /dev/null; then
  info "PM2 not found, installing..."
  npm install -g pm2 || error "Failed to install PM2"
else
  info "PM2 is already installed: $(pm2 -v)"
fi

section "Installing Nginx"
if ! command -v nginx &> /dev/null; then
  info "Nginx not found, installing..."
  apt install -y nginx || error "Failed to install Nginx"
else
  info "Nginx is already installed: $(nginx -v 2>&1 | head -n 1)"
fi

section "Setting Up Application Directory"
mkdir -p $APP_DIR || error "Failed to create application directory"

if [ -n "$REPO_URL" ]; then
  info "Cloning repository..."
  if [ -d "$APP_DIR/.git" ]; then
    info "Git repository already exists, pulling latest changes..."
    cd $APP_DIR
    git pull || error "Failed to pull latest changes"
  else
    git clone $REPO_URL $APP_DIR || error "Failed to clone repository"
    cd $APP_DIR
  fi
else
  info "Skipping git clone, assuming code is already in $APP_DIR"
  cd $APP_DIR
fi

section "Installing Dependencies and Building Frontend"
npm install || error "Failed to install dependencies"
npm run build || error "Failed to build frontend"

section "Setting Up API"
cd $APP_DIR/api
npm install || error "Failed to install API dependencies"

info "Using existing MongoDB connection from .env file"
# Note: We're not modifying the .env file as it already contains the MongoDB connection

section "Setting Up PM2 Configuration"
cat > $APP_DIR/ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'canva-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: '$APP_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'canva-api',
      script: 'app.js',
      cwd: '$APP_DIR/api',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
EOL

info "Created PM2 ecosystem.config.js"

section "Starting Applications with PM2"
cd $APP_DIR
pm2 start ecosystem.config.js || error "Failed to start applications with PM2"
pm2 save || error "Failed to save PM2 configuration"

# Get the PM2 startup command and execute it
PM2_STARTUP=$(pm2 startup | grep "sudo" | tail -n 1)
if [ -n "$PM2_STARTUP" ]; then
  eval $PM2_STARTUP || error "Failed to set up PM2 startup"
  info "PM2 startup configured"
else
  error "Failed to get PM2 startup command"
fi

section "Configuring Nginx"
cat > /etc/nginx/sites-available/canva-editor << EOL
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

info "Created Nginx configuration"

# Enable the site
ln -sf /etc/nginx/sites-available/canva-editor /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t || error "Nginx configuration test failed"

# Restart Nginx
systemctl restart nginx || error "Failed to restart Nginx"

section "Setting Up SSL with Let's Encrypt"
read -p "Do you want to set up SSL with Let's Encrypt? (y/n): " SETUP_SSL
if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
  info "Installing Certbot..."
  apt install -y certbot python3-certbot-nginx || error "Failed to install Certbot"
  
  info "Obtaining SSL certificate..."
  certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME || error "Failed to obtain SSL certificate"
  
  info "SSL certificate installed successfully"
else
  info "Skipping SSL setup"
fi

section "Creating Deployment Script"
cat > $APP_DIR/deploy.sh << EOL
#!/bin/bash
cd $APP_DIR
git pull
npm install
npm run build
cd api
npm install
cd ..
pm2 restart all
EOL

chmod +x $APP_DIR/deploy.sh
info "Created deployment script at $APP_DIR/deploy.sh"

section "Deployment Complete"
echo -e "${GREEN}Your application has been successfully deployed!${NC}"
echo -e "Frontend URL: http://$DOMAIN_NAME"
echo -e "API URL: http://$DOMAIN_NAME/api"
echo -e "\nTo update your application in the future, run: $APP_DIR/deploy.sh"
