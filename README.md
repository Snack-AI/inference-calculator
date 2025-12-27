# Snack Inference Calculator

A cost comparison calculator for LLM inference providers.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2: GitHub + Vercel Dashboard

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project
3. Import your GitHub repo
4. Vercel auto-detects Vite — just click Deploy

### Option 3: Drag & Drop

```bash
npm run build
```

Then drag the `dist` folder to vercel.com/new

## Custom Domain

After deploying, go to your Vercel project settings → Domains to add:
- `calculator.snack.com` (subdomain)
- or any custom domain

## Updating Pricing Data

Edit `src/App.jsx` and update the `providerData` object (around line 22).

## Connecting Forms

The waitlist and lead capture forms currently log to console. To connect to your backend:

1. **Airtable**: Replace `console.log` in `handleWaitlistSubmit` and `handleUploadSubmit` with fetch calls to Airtable API
2. **Zapier**: Create a webhook and POST form data to it
3. **Your own API**: Replace with your endpoint

Example:
```javascript
const handleWaitlistSubmit = async (e) => {
  e.preventDefault();
  await fetch('https://your-api.com/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  setWaitlistSubmitted(true);
};
```
