# California Itinerary — Three Website Designs

All three versions use the same final itinerary, booking details, flights, SUV shortlist, lodging choices, route links, trip checks, budget, and downloadable Excel workbook. Only the visual experience changes.

## Hosted Version

The Cinematic Editorial version is published at <https://kaushik27.github.io/california-itinerary-plans/>. Pushes to `main` that change `01-cinematic-editorial` automatically rebuild and deploy it through GitHub Pages.

## 01 — Cinematic Editorial

- Full-screen California panorama and travel-story presentation
- Best for showing the trip to family and friends
- Local preview: http://localhost:3101/
- Folder: `01-cinematic-editorial`

## 02 — Interactive Road Atlas

- Route-first map, day narrative, and horizontal trip timeline
- Best for understanding where you are going and how the trip flows
- Local preview: http://localhost:3102/
- Folder: `02-road-atlas`

## 03 — Quiet-Luxury Journey Dossier

- Refined editorial typography, photographic filmstrip, and chapter layout
- Best for a polished, personal anniversary-travel presentation
- Local preview: http://localhost:3103/
- Folder: `03-journey-dossier`

Each folder includes its own source, local image assets, production build, browser QA report, and the Excel itinerary download.

## Running Locally

Each design is a separate app. Use Node.js 22.13 or newer.

```bash
cd 01-cinematic-editorial
npm ci
npm run dev
```

Then open the local URL shown in the terminal. Repeat the same commands inside `02-road-atlas` or `03-journey-dossier` to view the other versions.

## Suggested GitHub Layout

Keep this repository private until after the trip, because the source includes your future route, lodging, flight, rental, and itinerary details.

- `01-cinematic-editorial`: presentation-style version for family and friends
- `02-road-atlas`: route-first version for understanding the drive
- `03-journey-dossier`: polished editorial version
