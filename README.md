# Oops Checkmate - Chess Web Application

A modern chess application with AI opponents, social features, and real-time chat.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Python 3.7+
- MongoDB (local or cloud)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```bash
   python app.py
   ```
   The server will run on `http://localhost:5000`

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

## 🔧 Environment Configuration

The application now supports easy switching between local development and production environments.

### For Local Development
```bash
# Option 1: Use the dev script (automatically switches to local)
npm run dev

# Option 2: Manual switch
npm run switch:local
npm start
```

### For Production
```bash
# Option 1: Use the prod script (automatically switches to production)
npm run prod

# Option 2: Manual switch
npm run switch:prod
npm run build
```

### Manual Configuration
You can also manually edit `frontend/src/config/environment.js`:
```javascript
// For local development
export const ENVIRONMENT = 'local';

// For production
export const ENVIRONMENT = 'production';
```

## 📡 API Endpoints

- **Local Development**: `http://localhost:5000/api`
- **Production**: `https://oops-checkmate-web.onrender.com/api`

## 🛠️ Development Workflow

1. **Start Local Development**:
   ```bash
   # Terminal 1: Start backend
   cd backend
   python app.py
   
   # Terminal 2: Start frontend (local mode)
   cd frontend
   npm run dev
   ```

2. **Make Changes**: Edit your code while the development server is running

3. **Test Locally**: Your changes will be reflected immediately

4. **Deploy to Production**:
   ```bash
   # Switch to production and build
   npm run prod
   
   # Deploy the build folder to your hosting service
   ```

## 📁 Project Structure

```
oops-checkmate-web/
├── backend/
│   ├── app.py              # Flask backend server
│   ├── requirements.txt    # Python dependencies
│   └── uploads/           # File uploads directory
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── api.js         # API configuration
│   │   │   └── environment.js # Environment settings
│   │   ├── pages/         # React components
│   │   ├── store/         # Redux store
│   │   └── ...
│   ├── package.json
│   ├── switch-env.js      # Environment switcher script
│   └── DEVELOPMENT.md     # Development guide
└── README.md
```

## 🔄 Environment Switching Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Switch to local and start development server |
| `npm run prod` | Switch to production and build |
| `npm run switch:local` | Switch to local environment only |
| `npm run switch:prod` | Switch to production environment only |

## 🐛 Troubleshooting

### CORS Issues
Make sure your backend CORS configuration includes `http://localhost:3000`:
```python
CORS(app, origins=["https://oops-checkmate-web-1.onrender.com", "http://localhost:3000"])
```

### Port Conflicts
- Backend should run on port 5000
- Frontend should run on port 3000
- Check if ports are already in use

### Environment Not Updating
1. Clear browser cache
2. Restart the development server
3. Check the console for environment logs

## 📝 Configuration Files

- `frontend/src/config/environment.js` - Main environment configuration
- `frontend/src/config/api.js` - API endpoints configuration
- `frontend/switch-env.js` - Environment switcher script

## 🚀 Deployment

1. Switch to production environment:
   ```bash
   npm run switch:prod
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Deploy the `build` folder to your hosting service

## 📚 Additional Documentation

- See `frontend/DEVELOPMENT.md` for detailed development instructions
- Check individual component files for specific functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally using `npm run dev`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 