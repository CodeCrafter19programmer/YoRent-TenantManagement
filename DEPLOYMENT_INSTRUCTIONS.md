# Deployment Instructions

## Current Live Deployment

**Production URL:** https://yorent.netlify.app

## Updating GitHub Repository Settings

The URL shown in the GitHub repository's "About" section needs to be manually updated:

1. Go to your GitHub repository: https://github.com/CodeCrafter19programmer/YoRent-Fresh
2. Click the ⚙️ (gear icon) next to "About" on the right side
3. In the "Website" field, enter: `https://yorent.netlify.app`
4. Save changes

## Deployment Platform

This project is deployed on **Netlify**, not Vercel.

- **Platform:** Netlify
- **Live URL:** https://yorent.netlify.app
- **Deployment Source:** GitHub repository `YoRent-Fresh`

## Netlify Configuration

The project auto-deploys from the `main` branch on every push to GitHub.

### Build Settings
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Framework:** Vite

### Environment Variables Required

Make sure these are set in your Netlify dashboard under Site settings → Environment variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAIL=admin@yorent.com
```

## Manual Deployment

To manually trigger a deployment:

1. Go to https://app.netlify.com/sites/yorent/deploys
2. Click "Trigger deploy" → "Deploy site"

Or push changes to the main branch, which will auto-deploy.
