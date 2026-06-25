{
  "name": "trafikverket-train-board",
  "version": "1.0.0",
  "description": "A live arrivals and departures board using Trafikverket's open API.",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "helmet": "^8.0.0"
  },
  "engines": {
    "node": ">=18"
  }
}
