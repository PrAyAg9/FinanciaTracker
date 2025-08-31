# 💰 Finance Dashboard

A modern, AI-powered personal finance tracking application built with React, TypeScript, Node.js, and MongoDB.

## ✨ Features

- **🔐 Google OAuth Authentication** - Secure login with Google
- **🤖 AI-Powered Transaction Parsing** - Describe transactions in natural language
- **📊 Beautiful Analytics** - Interactive charts and insights
- **💳 Smart Transaction Management** - Easy categorization and filtering
- **📱 Responsive Design** - Works on all devices
- **🔒 Secure & Private** - Your data is encrypted and protected

## 🏗️ Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls

### Backend

- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Google OAuth 2.0**
- **OpenAI API** for AI features (optional)
- **Express Rate Limiting** for security

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ installed
- **MongoDB** installed and running
- **Google OAuth** credentials
- **OpenAI API** key (optional)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd FinanceDashboard
```

### 2. Environment Setup

Copy the environment file and configure it:

```bash
cp .env.example .env
```

**Backend environment** (`backend/.env`):

```bash
cp .env.example backend/.env
```

**Frontend environment** (`frontend/.env`):

```bash
cp frontend/.env.example frontend/.env
```

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **"Credentials"** section
5. Create **"OAuth 2.0 Client IDs"**
6. Set authorized origins:
   - `http://localhost:5173` (frontend)
   - `http://localhost:3000` (backend)
7. Set authorized redirect URI:
   - `http://localhost:3000/auth/google/callback`
8. Copy **Client ID** and **Client Secret** to your `.env` files

### 4. Install Dependencies

**Backend:**

```bash
cd backend
npm install
```

**Frontend:**

```bash
cd frontend
npm install
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if installed as service)
net start MongoDB

# macOS (with homebrew)
brew services start mongodb/brew/mongodb-community

# Linux
sudo systemctl start mongod

# Or run directly
mongod --dbpath /path/to/your/db
```

### 6. Start the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## 📱 Usage

### 1. Authentication

- Click **"Sign in with Google"** on the landing page
- Complete Google OAuth flow
- You'll be redirected to the dashboard

### 2. Adding Transactions

**Smart Input (AI-Powered):**

```
"Lunch at McDonald's $12.50"
"Gas at Shell station $45"
"Salary deposit $3000"
```

**Manual Input:**

- Click "Add Transaction"
- Fill in details manually

### 3. Dashboard Features

- **Summary Cards**: View income, expenses, and net worth
- **Category Breakdown**: Pie chart of spending by category
- **Trends Chart**: Line chart showing financial trends over time
- **Recent Transactions**: Quick view of latest transactions

### 4. Transactions Page

- View all transactions
- Filter by category, date, type
- Search transactions
- Edit or delete transactions

## 🔧 Configuration

### Environment Variables

**Backend (`backend/.env`):**

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/finance-dashboard
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-api-key
```

**Frontend (`frontend/.env`):**

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## 📊 API Endpoints

### Authentication

- `GET /auth/google` - Start Google OAuth flow
- `POST /auth/google/callback` - Handle OAuth callback
- `GET /auth/profile` - Get user profile
- `POST /auth/logout` - Logout user

### Transactions

- `GET /api/transactions` - Get transactions (with filtering)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/parse` - Parse natural language input

### Analytics

- `GET /api/analytics/summary` - Financial summary
- `GET /api/analytics/categories` - Category breakdown
- `GET /api/analytics/trends` - Trends over time
- `GET /api/analytics/insights` - AI insights

## 🔒 Security Features

- **JWT Authentication** with secure tokens
- **Rate Limiting** to prevent abuse
- **CORS** protection
- **Helmet** for security headers
- **Input Validation** on all endpoints
- **MongoDB Injection** protection

## 🧪 Development

### Backend Development

```bash
cd backend
npm run dev  # Runs with nodemon for auto-restart
```

### Frontend Development

```bash
cd frontend
npm run dev  # Runs with Vite dev server
```

### Building for Production

**Backend:**

```bash
cd backend
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
npm run preview
```

## 📁 Project Structure

```
FinanceDashboard/
├── README.md
├── .env.example
├── backend/
│   ├── src/
│   │   ├── server.js          # Main server file
│   │   ├── middleware/        # Auth & error handling
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API routes
│   │   └── services/         # Business logic
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── .env.example
└── docs/                    # Documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## � Deployment

### Deploy to Vercel

This guide will help you deploy both the frontend and backend to Vercel, with MongoDB Atlas as the database.

#### Prerequisites for Deployment

- [Vercel Account](https://vercel.com)
- [MongoDB Atlas Account](https://cloud.mongodb.com)
- [Google Cloud Console](https://console.cloud.google.com) project
- [Google AI Studio](https://makersuite.google.com/app/apikey) for Gemini API key

#### Step 1: Prepare MongoDB Atlas

1. Create a MongoDB Atlas cluster
2. Create a database user with read/write permissions
3. Get your connection string (replace `<password>` with actual password)
4. Whitelist all IPs (0.0.0.0/0) for Vercel deployment

#### Step 2: Backend Deployment

1. **Fork/Clone this repository to your GitHub**

2. **Deploy Backend to Vercel:**
   ```bash
   # In your local repository
   cd backend
   
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   ```

3. **Configure Backend Environment Variables in Vercel:**
   
   Go to your Vercel dashboard → Your backend project → Settings → Environment Variables
   
   Add these variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/finance_tracker
   JWT_SECRET=your-super-secure-jwt-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GEMINI_API_KEY=your-gemini-api-key
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```

4. **Configure `vercel.json` for Backend:**
   
   Create `backend/vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/server.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

#### Step 3: Frontend Deployment

1. **Update Frontend API URL:**
   
   In `frontend/src/services/api.ts`, update the base URL:
   ```typescript
   const API_CONFIG = {
     BASE_URL: process.env.NODE_ENV === 'production' 
       ? 'https://your-backend-domain.vercel.app' 
       : 'http://localhost:3001',
   };
   ```

2. **Deploy Frontend to Vercel:**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Configure Frontend Environment Variables in Vercel:**
   ```
   VITE_API_URL=https://your-backend-domain.vercel.app
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

#### Step 4: Configure Google OAuth

1. **Update Google Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to APIs & Services → Credentials
   - Edit your OAuth 2.0 Client ID
   - Add to Authorized Origins:
     ```
     https://your-frontend-domain.vercel.app
     https://your-backend-domain.vercel.app
     ```
   - Add to Authorized Redirect URIs:
     ```
     https://your-frontend-domain.vercel.app/auth/callback
     https://your-backend-domain.vercel.app/api/auth/google/callback
     ```

#### Step 5: Alternative Deployment Options

##### Deploy Backend to Railway

1. **Connect GitHub to Railway:**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Select the backend folder

2. **Environment Variables in Railway:**
   ```
   NODE_ENV=production
   MONGODB_URI=your-atlas-connection-string
   JWT_SECRET=your-jwt-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GEMINI_API_KEY=your-gemini-api-key
   FRONTEND_URL=your-frontend-url
   PORT=3001
   ```

##### Deploy Backend to Render

1. **Create Web Service on Render:**
   - Connect your GitHub repository
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`

2. **Environment Variables in Render:**
   Same as Railway configuration above

#### Step 6: Verify Deployment

1. **Test Backend Endpoints:**
   ```
   GET https://your-backend-domain.vercel.app/api/health
   GET https://your-backend-domain.vercel.app/api/auth/google
   ```

2. **Test Frontend:**
   - Visit your frontend URL
   - Try Google OAuth login
   - Test transaction creation
   - Verify data persistence

#### Step 7: Domain Configuration (Optional)

1. **Custom Domain for Frontend:**
   - In Vercel dashboard → Your frontend project → Settings → Domains
   - Add your custom domain
   - Update Google OAuth settings with new domain

2. **Custom Domain for Backend:**
   - In Vercel dashboard → Your backend project → Settings → Domains
   - Add your custom API domain
   - Update frontend API configuration

### Environment Variables Reference

#### Backend (.env)
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finance_tracker
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.vercel.app
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

### Post-Deployment Checklist

- [ ] Backend health check endpoint responds
- [ ] Frontend loads without errors
- [ ] Google OAuth login works
- [ ] AI transaction parsing works
- [ ] Manual transaction creation works
- [ ] Data persists in MongoDB Atlas
- [ ] All charts and analytics load
- [ ] Mobile responsive design works
- [ ] CORS is properly configured
- [ ] All environment variables are set

### Troubleshooting Deployment

**Common Deployment Issues:**

1. **CORS Errors:**
   - Verify `FRONTEND_URL` in backend environment
   - Check Google OAuth authorized origins

2. **Database Connection:**
   - Verify MongoDB Atlas connection string
   - Check network access settings (whitelist 0.0.0.0/0)

3. **Environment Variables:**
   - Ensure all required variables are set in Vercel
   - Check for typos in variable names

4. **OAuth Issues:**
   - Update redirect URIs in Google Console
   - Verify client ID matches in both frontend and backend

## �📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**

```bash
# Make sure MongoDB is running
mongod --dbpath /path/to/your/db

# Or check if service is running
sudo systemctl status mongod
```

**2. Google OAuth Error**

- Verify your credentials in `.env`
- Check authorized origins and redirect URIs in Google Console
- Make sure both frontend and backend URLs are correct

**3. CORS Issues**

- Verify `FRONTEND_URL` in backend `.env`
- Check that frontend is running on the correct port

**4. Port Already in Use**

```bash
# Kill process on port 3000
npx kill-port 3000

# Kill process on port 5173
npx kill-port 5173
```

**5. Dependencies Issues**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/finance-dashboard/issues) page
2. Create a new issue with detailed description
3. Include error logs and environment details

---

**Happy tracking! 💰📊**
