# Mealwise

Mealwise is a small, calm, open-data meal logger designed as a GitHub-ready alternative to heavier nutrition trackers.

## What is included

- Fixed meal order: **Pre workout → Breakfast → Lunch → Snack → Dinner**
- Product search backed by the Open Food Facts API
- Nutrition calculation for logged grams
- Persistent local storage in the browser
- Consolidated shopping list generated from products logged across all meals
- Printable shopping list
- Responsive layout for desktop and mobile
- No account, server, analytics, or database required for the starter app
- Aesthetic low-to-medium contrast UI with readable typography

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

Create a production build with:

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This is a static Vite app. You can deploy the `dist` directory with GitHub Pages, or use a GitHub Pages action that runs `npm ci && npm run build` and publishes `dist`.

For a repository named `mealwise`, Vite may need a `base` value if you deploy under `https://USERNAME.github.io/mealwise/`. Add this to `vite.config.js` if needed:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/mealwise/"
});
```

## Data source

Product search uses Open Food Facts. Their current documentation identifies API v3 as the current API for new integrations, while the documented v2 search endpoint remains the available structured-search route; this app uses v2 search because the current documentation specifically documents product search there.

Open Food Facts data is open data under the ODbL. Review the current Open Food Facts terms and attribution requirements before redistributing a production deployment.

The app does **not** copy Nutripédia's proprietary software or database. The web search performed while preparing this repository did not identify an open-source Nutripédia product database/API that could be safely incorporated. Nutripédia.pt states that its software is protected intellectual property and that reuse of its software requires explicit permission. Use Open Food Facts as the open-data product source unless you have a separate license for another dataset.

## Important product-data note

Nutrition values are only as complete as the source product record. Missing nutrients are treated as zero for display calculations, so this starter should not be used for medical or clinical decisions without additional validation.

## License

MIT for the original Mealwise source code in this repository. Third-party data and services retain their own licenses and terms.

## Suggested next steps

1. Add barcode scanning with the device camera.
2. Add a small backend if you want accounts and sync across devices.
3. Add recipe support that expands ingredients into the shopping list.
4. Add household quantities/units (packs, bottles, tins) rather than grams only.
5. Add Open Prices only if you want store-aware price estimates; check its API and licensing requirements first.
