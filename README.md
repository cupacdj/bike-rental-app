# Bike Rental App

A bike rental system with mobile app (React Native) and admin web panel.

## System Overview

- **Mobile App**: Users can browse bikes, rent them via QR code, track active rentals, and report issues
- **Admin Panel**: Web dashboard for managing bikes, parking zones, rentals, and user issues
- **Backend**: Express server with file-based storage (JSON)

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go
- Java 17 (for Android builds)

## Installation

```bash
# Install server dependencies
cd admin-web
npm install

# Install admin client dependencies
cd admin-web/client
npm install

# Install mobile app dependencies
cd ../..
npm install
```

## Running the Admin Panel

```bash
cd admin-web

# Development mode (runs both server and client)
npm run dev

# Or run separately:
npm run server:watch    # Server on http://localhost:5000
npm run client          # Client on http://localhost:3000
```

**Default admin login:**
- Username: `admin`
- Password: `admin123`

## Running the Mobile App

```bash
# Start Metro bundler
npm start

```

**Configure server URL:**
- Edit mobile app sync settings to point to your server IP (e.g., `http://192.168.1.100:5000`)

