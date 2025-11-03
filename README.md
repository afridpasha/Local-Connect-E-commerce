# Local Connect E-commerce Platform

A full-stack e-commerce platform connecting local services and products.

## Project Structure

```
Local-Connect-Ecommerce/
├── Frontend/          # React.js frontend application
├── Backend/           # Express.js API server
├── Stripe/           # Stripe payment processing server
└── README.md         # This file
```

## Development Setup

### 1. Frontend (React App)
```bash
cd Frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### 2. Backend (API Server)
```bash
cd Backend
npm install
npm start
# Runs on http://localhost:5003
```

### 3. Stripe (Payment Server)
```bash
cd Stripe
npm install
npm start
# Runs on http://localhost:5000
```

## Deployment on Render

Create 3 separate services:

### Frontend Service
- **Root Directory**: `Frontend`
- **Build Command**: `npm install; npm run build`
- **Start Command**: `npm run preview`

### Backend Service
- **Root Directory**: `Backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Stripe Service
- **Root Directory**: `Stripe`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## Environment Variables

Each service has its own `.env` file with appropriate configurations.

## Technologies Used

- **Frontend**: React, Vite, React Router, Axios
- **Backend**: Express.js, MongoDB, MySQL, JWT, Multer
- **Payment**: Stripe API
- **Deployment**: Render