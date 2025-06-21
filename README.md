# Choose Your Own Chris

An interactive portfolio website featuring dynamic content generation using OpenAI's GPT-3.5. The site showcases professional experience, projects, and musical endeavors with a unique twist - content can be regenerated on demand for a fresh perspective!

## Features

### Dynamic Content Generation
- **AI-Powered Regeneration**: Uses OpenAI's GPT-3.5 to create unique variations of content while maintaining factual accuracy
- **Fantasy Mode**: Transform professional experiences into epic fantasy narratives
- **Section-Specific Updates**: Ability to regenerate individual sections or the entire portfolio
- **Smooth Transitions**: Elegant animations when content changes

### Professional Sections
- **About Me**: Dynamic biography and professional summary
- **Experience**: Interactive work history with achievements
- **Education**: Academic background and qualifications
- **Skills**: Comprehensive list of technical and professional skills

### Portfolio Integration
- **Technical Projects**: Showcase of development work and side projects
- **Music Portfolio**: Integration with Spotify artist profile
- **Social Links**: Connected profiles and professional networks

### Technical Features
- **Modern Stack**: React + TypeScript frontend, Flask backend
- **Responsive Design**: Mobile-friendly layout with CSS Grid and Flexbox
- **CORS Support**: Secure cross-origin communication between frontend and API
- **Error Handling**: Robust error management for API interactions
- **Rate Limiting**: Token usage tracking and request limiting
- **Smooth Animations**: CSS transitions for content updates

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- CSS Variables for theming
- React Transition Group for animations

### Backend
- Flask
- OpenAI API
- Python 3.10+
- Gunicorn for production serving
- Nginx for reverse proxy

## Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- Python 3.10+
- OpenAI API key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

5. Start the Flask server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file for local development:
   ```
   VITE_API_URL=http://localhost:5001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and visit `http://localhost:5173`

## Production Deployment

### Server Prerequisites
- Ubuntu 20.04 or later
- Nginx
- Python 3.10+
- Node.js 14+
- SSL certificates (Let's Encrypt)

### Systemd Services Setup (Recommended)

For automatic startup after server reboots, deploy the systemd services:

#### Backend Service Setup
1. SSH into the backend server:
   ```bash
   ssh crog-backend
   ```

2. Navigate to the project directory:
   ```bash
   cd /var/www/api.crog.gg
   ```

3. Deploy the systemd service:
   ```bash
   cd systemd
   ./deploy-services.sh backend
   ```

4. Verify the service is running:
   ```bash
   ./deploy-services.sh status
   ```

#### Service Management Commands
- **Check status**: `./systemd/deploy-services.sh status`
- **Restart services**: `./systemd/deploy-services.sh restart`
- **Stop services**: `./systemd/deploy-services.sh stop`

#### Viewing Service Logs
To view service logs:
```bash
# View recent logs
sudo journalctl -u choose-your-own-chris-backend -f

# View logs from today
sudo journalctl -u choose-your-own-chris-backend --since today

# View logs from last hour
sudo journalctl -u choose-your-own-chris-backend --since "1 hour ago"
```

### Manual Deployment Process

#### Frontend Deployment (crog.gg)
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

#### Backend Deployment (api.crog.gg)
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
   cd backend && /var/www/api.crog.gg/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5001 app:app &
   ```

### Quick Deployment Commands

For rapid deployment, you can use these one-line commands:

#### Frontend:
```bash
ssh crog-frontend "cd /var/www/crog.gg && git fetch origin && git reset --hard origin/main && cd frontend && npm install && npm run build && sudo systemctl restart nginx"
```

#### Backend:
```bash
ssh crog-backend "cd /var/www/api.crog.gg && git fetch origin && git reset --hard origin/main && pkill -f gunicorn && cd backend && /var/www/api.crog.gg/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5001 app:app &"
```

### Deployment Verification

After deployment, verify the services are running:

#### Frontend:
```bash
ssh crog-frontend "systemctl status nginx"
```

#### Backend:
```bash
ssh crog-backend "ps aux | grep gunicorn"
```

### Troubleshooting

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

### Common Issues and Solutions
1. **502 Bad Gateway**: Usually indicates the Flask application isn't running or Nginx configuration is incorrect
   - Check Flask service status: `systemctl status flask`
   - Verify Nginx configuration: `nginx -t`
   - Check logs: `journalctl -u flask`

2. **OpenAI API Issues**: 
   - Verify API key in `.env`
   - Check for rate limiting
   - Update OpenAI package if encountering import errors

3. **CORS Issues**:
   - Verify allowed origins in Flask CORS configuration
   - Check Nginx headers
   - Confirm frontend API URL configuration

### Gunicorn Management

#### Checking Gunicorn Status
```bash
ssh crog-backend "ps aux | grep gunicorn"
```

#### Restarting Gunicorn
If the backend is not responding or you need to restart Gunicorn:

1. Kill existing Gunicorn processes:
   ```bash
   ssh crog-backend "pkill -f gunicorn"
   ```

2. Start Gunicorn with debug logging:
   ```bash
   ssh crog-backend "cd /var/www/api.crog.gg && cd backend && /var/www/api.crog.gg/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5001 app:app --log-level debug"
   ```

3. For production deployment (background process):
   ```bash
   ssh crog-backend "cd /var/www/api.crog.gg && cd backend && /var/www/api.crog.gg/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5001 app:app &"
   ```

#### Gunicorn Logs
To check Gunicorn logs:
```bash
ssh crog-backend "tail -f /var/log/gunicorn/error.log"
```

#### Common Gunicorn Issues
1. **Process not starting**: 
   - Check Python virtual environment activation
   - Verify app.py location and imports
   - Check for port conflicts

2. **Workers not responding**:
   - Increase worker timeout
   - Check system resources
   - Verify application code for blocking operations

3. **Memory issues**:
   - Monitor worker memory usage
   - Adjust number of workers based on available RAM
   - Consider using worker recycling

## License

MIT 