# Trafikverket Live Train Board

A polished train arrivals/departures webpage powered by Trafikverket's Open API.

## Features

- Autocomplete station search by name or signature, with click and keyboard selection
- Toggle departures and arrivals
- Live estimated times and delay status
- Track/platform display
- Cancelled-train highlighting
- Favorites saved in the browser
- Auto-refresh every 30 seconds
- Fullscreen station-board mode
- Responsive dark UI
- API key is kept on the server, never in frontend JavaScript

## Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and add your Trafikverket API key:

```bash
TRAFIKVERKET_API_KEY=your_key_here
```

Start the app:

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Notes

Trafikverket station searches use `TrainStation`. Timetable rows use `TrainAnnouncement`.
