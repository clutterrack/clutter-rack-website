# Clutter Rack Website

Modern static site for Clutter Rack garage storage systems.

## Features
- TCPA-compliant lead forms with clear consent language
- Chat widget that creates leads in Clutter Rack OS
- Attribution capture (gclid, fbclid, UTMs) for ad campaigns
- Privacy Policy and Terms & Conditions
- Ready for GitHub Pages

## Setup
1. Update `LEAD_WEBHOOK_URL` in `script.js` to your real Clutter Rack OS endpoint.
2. Push to GitHub and enable GitHub Pages (Settings → Pages → Deploy from branch main).
3. Point your domain DNS (GoDaddy) to GitHub Pages:
   - A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   - Or CNAME to clutterrack.github.io

## Lead Integration
Form and chat submissions POST JSON to the webhook with:
- Contact info
- TCPA consent flag + timestamp
- Full attribution data
- Source type (quote_request or chat_start)
