# Installation Guide

This document covers the prerequisites and steps required to get AgentStats up and running.

## 📋 Prerequisites

- **Node.js**: Version >= 22.0.0 is required.
- **Redis**: Optional but highly recommended for high-concurrency scenarios and caching performance metrics.

## 📥 Installation

1. **Install Root and Server Dependencies**:
   ```bash
   npm install
   ```

2. **Install Client Dependencies**:
   ```bash
   cd client && npm install
   ```

## ⚙️ Configuration

- **Client-side**: Configuration options are located in `client/src/config.js`. You can modify API endpoints and feature flags here.
- **Server-side**: The backend runs on port `14514` by default.

## 🚀 Running the Application

To build the project and start the production server:

```bash
npm run build
node server.js
```

The application will be accessible at `http://localhost:14514`.
