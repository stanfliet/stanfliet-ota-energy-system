# Stanfliet OTA Energy System

Over-The-Air Prepaid Electricity Management with Integrated Fraud Detection, GPS Tracking, and Peer-to-Peer Credit Transfer.

## Architecture

- Backend: Node.js + Express + PostgreSQL
- Frontend: React + Vite + Leaflet Maps
- Mobile: React Native (Expo)
- Firmware: STM32F407 + FreeRTOS
- MQTT: HiveMQ Cloud Free
- CI/CD: GitHub Actions

## Features

- Over-the-air prepaid electricity management
- NERSA tariff error prevention (10-check pipeline)
- Real-time fraud detection with ML
- GPS tracking with geofencing
- Peer-to-peer credit transfer
- Smart meter firmware OTA updates
- Inspector dispatch and routing
- Multi-channel alert system

## Quick Start

1. `npm install`
2. Copy `.env.example` to `.env` and configure
3. `docker-compose up -d`
4. `npm run dev`
5. Open http://localhost:5173

## Deployment

- Frontend: Vercel (free)
- Backend: Render (free)
- Database: Render PostgreSQL (free)
- MQTT: HiveMQ Cloud (free)
- CI/CD: GitHub Actions (free)
