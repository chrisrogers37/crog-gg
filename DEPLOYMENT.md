# Deployment Instructions

This document outlines the steps to deploy changes to the crog.gg website and its backend API.

## Frontend Server (crog.gg)

1. SSH into the frontend server:
```bash
ssh crog-frontend
```

2. Navigate to the frontend repository:
```bash
cd /var/www/crog.gg
```

3. Update the code:
```bash
git fetch origin
git reset --hard origin/main
```

4. Build the frontend:
```bash
cd frontend
npm install
npm run build
```

5. Restart nginx:
```bash
sudo systemctl restart nginx
```

## Backend Server (api.crog.gg)

1. SSH into the backend server:
```bash
ssh crog-backend
```

2. Navigate to the backend repository:
```bash
cd /var/www/api.crog.gg
```

3. Update the code:
```bash
git fetch origin
git reset --hard origin/main
```

4. Restart the Gunicorn service:
```bash
pkill -f gunicorn
/var/www/api.crog.gg/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5001 backend.app:app &
```

## One-Line Commands

For quick deployment, you can use these one-line commands:

### Frontend:
```bash
ssh crog-frontend "cd /var/www/crog.gg && git fetch origin && git reset --hard origin/main && cd frontend && npm install && npm run build && sudo systemctl restart nginx"
```

### Backend:
```bash
ssh crog-backend "cd /var/www/api.crog.gg && git fetch origin && git reset --hard origin/main && pkill -f gunicorn && /var/www/api.crog.gg/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5001 backend.app:app &"
```

## Verification

After deployment, you can verify the services are running:

### Frontend:
```bash
ssh crog-frontend "systemctl status nginx"
```

### Backend:
```bash
ssh crog-backend "ps aux | grep gunicorn"
```

## Troubleshooting

If you encounter a 500 error:
1. Check nginx error logs:
```bash
ssh crog-frontend "tail -n 50 /var/log/nginx/error.log"
```

2. Verify the dist directory exists:
```bash
ssh crog-frontend "ls -la /var/www/crog.gg/frontend/dist"
```

3. Check the build output:
```bash
ssh crog-frontend "cd /var/www/crog.gg/frontend && npm run build 2>&1"
``` 