# 💰 Finance Dashboard

A modern, AI-powered personal finance tracking application built with React, TypeScript, Node.js, and MongoDB.

<img width="1836" height="910" alt="image" src="https://github.com/user-attachments/assets/81d63f76-245f-4f9a-94ef-dec2476bed5e" />


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
---

**Happy tracking! 💰📊**
