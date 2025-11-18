# React + Express TypeScript App

A full-stack application with React frontend and Express TypeScript backend.

## Project Structure

```
api_demo/
├── client/              # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── tsconfig.json
│   └── tsconfig.node.json
├── src/
│   └── server.ts       # Express backend
├── vite.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

## How to Use

### Development Mode

Run the frontend and backend separately for hot-reloading during development:

**Terminal 1 - Backend:**
```bash
npm run dev
```
This starts the Express server on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
npm run dev:client
```
This starts the Vite dev server on `http://localhost:5173` with Hot Module Replacement (HMR)

During development, the Vite dev server proxies API calls to the Express backend.

### Production Build

Build both the client and server:

```bash
npm run build
```

This will:
1. Build the React app and output to `dist/public`
2. Compile TypeScript server code to `dist`

### Running Production Build

```bash
npm start
```

This runs the production server which serves the built React app and handles API requests on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start Express server in development mode with nodemon
- `npm run dev:client` - Start Vite dev server for React frontend
- `npm run build` - Build both client and server for production
- `npm run build:client` - Build only the React frontend
- `npm run build:server` - Build only the Express backend
- `npm start` - Run the production server

## API Endpoints

- `GET /api` - Example API endpoint that returns a JSON message
- `GET *` - All other routes serve the React application

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite (build tool)

### Backend
- Node.js
- Express
- TypeScript

## License

ISC

## ChangeLog
- initial commit, setup express server with react and typescript
