# MythicStats Frontend Implementation

This project implements a Mythic+ DPS ranking page using React, Vite, and Tailwind CSS.

## Project Structure

- `client/`: React frontend source code
- `server.js`: Node.js backend serving the frontend and API

## How to Run

1. **Install Dependencies**:
   ```bash
   cd client
   npm install
   ```

2. **Start Development Server** (Frontend only):
   ```bash
   cd client
   npm run dev
   ```
   Access at `http://localhost:5173`

3. **Build for Production**:
   ```bash
   cd client
   npm run build
   ```
   The built files will be in `client/dist`.

4. **Run Full Stack**:
   Start the backend which serves the built frontend:
   ```bash
   node server.js
   ```
   Access at `http://localhost:14514`

## Features

- **Dark Mode UI**: Replicates the MythicStats dark aesthetic.
- **Class Colors**: Dynamic coloring based on WoW class.
- **Tier System**: S/A/B/C/D/F tier indicators.
- **Dual-Layer Bars**: Visualizes Average vs Top 5% DPS.
- **Mock Data**: API endpoint `/api/dps` provides ranking data.

## Technology Stack

- React 18
- Vite 7
- Tailwind CSS 3.4
- Axios
- Node.js/Express
