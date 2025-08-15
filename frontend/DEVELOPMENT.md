# Development Configuration Guide

## Switching Between Local and Production Environments

This application is configured to easily switch between local development and production environments.

### For Local Development

1. **Start your local backend server** (should be running on `localhost:5000`)
2. **Set environment to local** by editing `src/config/environment.js`:
   ```javascript
   export const ENVIRONMENT = 'local';
   ```
3. **Start the frontend**:
   ```bash
   npm start
   ```

### For Production

1. **Set environment to production** by editing `src/config/environment.js`:
   ```javascript
   export const ENVIRONMENT = 'production';
   ```
2. **Build the frontend**:
   ```bash
   npm run build
   ```

### Configuration Files

- `src/config/environment.js` - Main environment configuration
- `src/config/api.js` - API endpoints configuration

### API Endpoints

- **Local**: `http://localhost:5000/api`
- **Production**: `https://oops-checkmate-web.onrender.com/api`

### Quick Switch Commands

You can also use these commands to quickly switch environments:

**For Local Development:**
```bash
# Edit environment.js to set ENVIRONMENT = 'local'
npm start
```

**For Production:**
```bash
# Edit environment.js to set ENVIRONMENT = 'production'
npm run build
```

### Troubleshooting

1. **CORS Issues**: Make sure your local backend has CORS configured for `http://localhost:3000`
2. **Port Conflicts**: Ensure your backend is running on port 5000
3. **Environment Not Updating**: Clear browser cache and restart the development server

### Backend Configuration

Make sure your local backend (`app.py`) has the correct CORS configuration:

```python
CORS(app, origins=["https://oops-checkmate-web-1.onrender.com", "http://localhost:3000"])
```

The backend should be running on `localhost:5000` for local development. 