# California Anniversary Road Trip

A responsive, client-side itinerary website generated from `california_master_itinerary_final_static_overview.xlsx`.

## Included

- Interactive ten-stop route map and 17-day story mode
- Searchable, filterable day-by-day itinerary
- Workbook Google Maps route previews and direct route links
- Budget, comfort, and premium lodging choices for ten bases
- Low/high trip-budget scenarios
- Twelve flight options and fifteen airport-SUV choices
- Device-local readiness checklist for road, weather, tide, and park gates
- Booking and conditions directory
- Printable one-page overview and original Excel download
- Light/dark themes, mobile navigation, share, and print controls

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/`.

## Validate

```bash
npm run build
node --test tests/rendered-html.test.mjs
```

Prices and availability are planning snapshots checked July 11, 2026, not reservations.
