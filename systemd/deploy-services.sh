#!/bin/bash

# Deploy systemd services for Choose Your Own Chris
# This script should be run on the respective servers

set -e

echo "Deploying systemd services for Choose Your Own Chris..."

# Function to deploy backend service
deploy_backend() {
    echo "Deploying backend service..."
    
    # Copy service file
    sudo cp choose-your-own-chris-backend.service /etc/systemd/system/
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable service (start on boot)
    sudo systemctl enable choose-your-own-chris-backend
    
    # Stop any existing Gunicorn processes
    sudo pkill -f gunicorn || true
    
    # Start the service
    sudo systemctl start choose-your-own-chris-backend
    
    # Check status
    sudo systemctl status choose-your-own-chris-backend --no-pager
    
    echo "Backend service deployed successfully!"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [backend|status|restart|stop]"
    echo ""
    echo "Commands:"
    echo "  backend  - Deploy backend service"
    echo "  status   - Show service status"
    echo "  restart  - Restart all services"
    echo "  stop     - Stop all services"
    echo ""
}

# Main script logic
case "$1" in
    "backend")
        deploy_backend
        ;;
    "status")
        echo "Backend service status:"
        sudo systemctl status choose-your-own-chris-backend --no-pager || echo "Service not found"
        ;;
    "restart")
        echo "Restarting services..."
        sudo systemctl restart choose-your-own-chris-backend || echo "Backend service not found"
        ;;
    "stop")
        echo "Stopping services..."
        sudo systemctl stop choose-your-own-chris-backend || echo "Backend service not found"
        sudo pkill -f gunicorn || echo "No Gunicorn processes found"
        ;;
    *)
        show_usage
        exit 1
        ;;
esac 