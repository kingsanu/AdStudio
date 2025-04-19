#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print section header
section() {
  echo -e "\n${GREEN}==== $1 ====${NC}\n"
}

# Print info message
info() {
  echo -e "${BLUE}INFO:${NC} $1"
}

# Print warning message
warning() {
  echo -e "${YELLOW}WARNING:${NC} $1"
}

# Print error message
error() {
  echo -e "${RED}ERROR:${NC} $1"
  exit 1
}

# Check if PM2 is installed
check_pm2() {
  if ! command -v pm2 &> /dev/null; then
    error "PM2 is not installed. Please install it with: npm install -g pm2"
  fi
}

# Get the absolute path of the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Default ports
FRONTEND_PORT=3030
API_PORT=4000

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --frontend-port)
      FRONTEND_PORT="$2"
      shift 2
      ;;
    --api-port)
      API_PORT="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options] [command]"
      echo ""
      echo "Options:"
      echo "  --frontend-port PORT  Set frontend port (default: 3000)"
      echo "  --api-port PORT       Set API port (default: 4000)"
      echo ""
      echo "Commands:"
      echo "  start                 Start both frontend and API servers (default)"
      echo "  stop                  Stop both servers"
      echo "  restart               Restart both servers"
      echo "  status                Show status of both servers"
      echo "  logs                  Show logs for both servers"
      echo "  delete                Delete both servers from PM2"
      echo "  frontend              Manage only the frontend server"
      echo "  api                   Manage only the API server"
      echo "  save                  Save the current PM2 configuration"
      echo "  startup               Generate startup script for PM2"
      echo "  help                  Show this help message"
      exit 0
      ;;
    start|stop|restart|status|logs|delete|frontend|api|save|startup)
      COMMAND="$1"
      shift
      ;;
    *)
      warning "Unknown argument: $1"
      shift
      ;;
  esac
done

# Default command is start
COMMAND=${COMMAND:-start}

# Check if PM2 is installed
check_pm2

# Function to start the frontend server
start_frontend() {
  section "Starting Frontend Server"
  
  # Check if frontend is already running
  if pm2 list | grep -q "adstudio-frontend"; then
    info "Frontend server is already running. Use 'restart' to restart it."
    return
  fi
  
  info "Starting frontend server on port $FRONTEND_PORT..."
  cd "$SCRIPT_DIR"
  
  # Start the frontend server with PM2
  pm2 start npm --name "adstudio-frontend" -- run preview -- --port $FRONTEND_PORT || error "Failed to start frontend server"
  
  info "Frontend server started successfully on port $FRONTEND_PORT"
}

# Function to start the API server
start_api() {
  section "Starting API Server"
  
  # Check if API is already running
  if pm2 list | grep -q "adstudio-api"; then
    info "API server is already running. Use 'restart' to restart it."
    return
  fi
  
  info "Starting API server on port $API_PORT..."
  cd "$SCRIPT_DIR/api"
  
  # Update the PORT in .env file if needed
  if grep -q "PORT=" .env; then
    sed -i "s/PORT=.*/PORT=$API_PORT/" .env
  else
    echo "PORT=$API_PORT" >> .env
  fi
  
  # Start the API server with PM2
  pm2 start app.js --name "adstudio-api" || error "Failed to start API server"
  
  info "API server started successfully on port $API_PORT"
}

# Function to stop servers
stop_servers() {
  section "Stopping Servers"
  
  if [[ "$1" == "frontend" || "$1" == "all" ]]; then
    info "Stopping frontend server..."
    pm2 stop adstudio-frontend 2>/dev/null || warning "Frontend server is not running"
  fi
  
  if [[ "$1" == "api" || "$1" == "all" ]]; then
    info "Stopping API server..."
    pm2 stop adstudio-api 2>/dev/null || warning "API server is not running"
  fi
}

# Function to restart servers
restart_servers() {
  section "Restarting Servers"
  
  if [[ "$1" == "frontend" || "$1" == "all" ]]; then
    info "Restarting frontend server..."
    pm2 restart adstudio-frontend 2>/dev/null || warning "Frontend server is not running, starting it now..." && start_frontend
  fi
  
  if [[ "$1" == "api" || "$1" == "all" ]]; then
    info "Restarting API server..."
    pm2 restart adstudio-api 2>/dev/null || warning "API server is not running, starting it now..." && start_api
  fi
}

# Function to show server status
show_status() {
  section "Server Status"
  pm2 list | grep -E "adstudio-frontend|adstudio-api" || info "No AdStudio servers are running"
}

# Function to show logs
show_logs() {
  section "Server Logs"
  
  if [[ "$1" == "frontend" ]]; then
    pm2 logs adstudio-frontend
  elif [[ "$1" == "api" ]]; then
    pm2 logs adstudio-api
  else
    pm2 logs adstudio-frontend adstudio-api
  fi
}

# Function to delete servers from PM2
delete_servers() {
  section "Deleting Servers from PM2"
  
  if [[ "$1" == "frontend" || "$1" == "all" ]]; then
    info "Deleting frontend server..."
    pm2 delete adstudio-frontend 2>/dev/null || warning "Frontend server is not running"
  fi
  
  if [[ "$1" == "api" || "$1" == "all" ]]; then
    info "Deleting API server..."
    pm2 delete adstudio-api 2>/dev/null || warning "API server is not running"
  fi
}

# Function to save PM2 configuration
save_pm2() {
  section "Saving PM2 Configuration"
  pm2 save || error "Failed to save PM2 configuration"
  info "PM2 configuration saved successfully"
}

# Function to generate PM2 startup script
generate_startup() {
  section "Generating PM2 Startup Script"
  pm2 startup || error "Failed to generate PM2 startup script"
  info "Follow the instructions above to set up PM2 to start on system boot"
}

# Execute the command
case $COMMAND in
  start)
    start_frontend
    start_api
    ;;
  stop)
    stop_servers "all"
    ;;
  restart)
    restart_servers "all"
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs
    ;;
  delete)
    delete_servers "all"
    ;;
  frontend)
    if [[ "$1" == "start" ]]; then
      start_frontend
    elif [[ "$1" == "stop" ]]; then
      stop_servers "frontend"
    elif [[ "$1" == "restart" ]]; then
      restart_servers "frontend"
    elif [[ "$1" == "logs" ]]; then
      show_logs "frontend"
    elif [[ "$1" == "delete" ]]; then
      delete_servers "frontend"
    else
      error "Unknown frontend command: $1. Use start, stop, restart, logs, or delete."
    fi
    ;;
  api)
    if [[ "$1" == "start" ]]; then
      start_api
    elif [[ "$1" == "stop" ]]; then
      stop_servers "api"
    elif [[ "$1" == "restart" ]]; then
      restart_servers "api"
    elif [[ "$1" == "logs" ]]; then
      show_logs "api"
    elif [[ "$1" == "delete" ]]; then
      delete_servers "api"
    else
      error "Unknown API command: $1. Use start, stop, restart, logs, or delete."
    fi
    ;;
  save)
    save_pm2
    ;;
  startup)
    generate_startup
    ;;
  *)
    error "Unknown command: $COMMAND. Use start, stop, restart, status, logs, delete, frontend, api, save, or startup."
    ;;
esac

# Show status after command execution
if [[ "$COMMAND" != "logs" && "$COMMAND" != "status" ]]; then
  show_status
fi

section "Done"
echo -e "Frontend URL: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "API URL: ${GREEN}http://localhost:$API_PORT${NC}"
echo -e "\nUse '${YELLOW}./start-adstudio.sh logs${NC}' to view logs"
echo -e "Use '${YELLOW}./start-adstudio.sh stop${NC}' to stop servers"
