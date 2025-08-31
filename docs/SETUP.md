# Setup Guide - Finance Dashboard

## Prerequisites Installation

### 1. Install MongoDB

**Windows:**

1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. Choose "Install MongoDB as a Service"
4. Install MongoDB Compass (GUI) if desired
5. Add MongoDB to your PATH (usually `C:\Program Files\MongoDB\Server\6.0\bin`)

**Alternative - MongoDB Atlas (Cloud):**

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update `MONGODB_URI` in your `.env` file

### 2. Install Node.js

- Download from https://nodejs.org/ (LTS version recommended)
- Verify installation: `node --version` and `npm --version`

## Environment Setup

### 1. Backend Environment

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3000
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/finance-dashboard

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-123456789
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# OpenAI (Optional)
OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Frontend Environment

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_NODE_ENV=development
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AI_PARSING=true
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

## Google OAuth Setup

1. **Go to Google Cloud Console:**

   - Visit https://console.cloud.google.com/
   - Create new project or select existing

2. **Enable APIs:**

   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth Credentials:**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"

4. **Configure OAuth:**

   - **Authorized JavaScript origins:**

     - `http://localhost:3000`
     - `http://localhost:5173`

   - **Authorized redirect URIs:**
     - `http://localhost:3000/auth/google/callback`

5. **Copy Credentials:**
   - Copy Client ID and Client Secret
   - Update your `.env` files

## Installation Commands

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install
```

## Running the Application

### 1. Start MongoDB (if using local installation)

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod --dbpath /path/to/data/directory
```

### 2. Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

### 3. Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## Testing the Setup

1. **Backend Health Check:**

   ```bash
   curl http://localhost:3000/health
   ```

2. **Frontend Access:**

   - Open http://localhost:5173
   - Should see the landing page

3. **Google OAuth Test:**
   - Click "Sign in with Google"
   - Should redirect to Google OAuth
   - After authorization, should return to dashboard

## Troubleshooting

### MongoDB Issues

```bash
# Check if MongoDB is running
# Windows
sc query MongoDB

# macOS/Linux
sudo systemctl status mongod

# Start MongoDB manually
mongod --dbpath ./data
```

### Port Conflicts

```bash
# Kill processes on ports
npx kill-port 3000
npx kill-port 5173
```

### Dependencies Issues

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables

- Make sure all `.env` files are created
- No spaces around `=` in env files
- Use actual values, not placeholder text

## Development Tips

1. **Use two terminals** - one for backend, one for frontend
2. **Check browser console** for frontend errors
3. **Check terminal logs** for backend errors
4. **Use MongoDB Compass** to view database data
5. **Test API endpoints** with Postman or curl

## Production Deployment

See `DEPLOYMENT.md` for production setup instructions.
