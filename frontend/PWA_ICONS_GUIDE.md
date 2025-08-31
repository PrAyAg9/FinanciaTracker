# PWA Icon Generation Guide

To create proper PWA icons for your Finance Dashboard app, you'll need to create the following icons and place them in the `public/icons/` directory:

## Required Icons:
- icon-72x72.png
- icon-96x96.png  
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Quick Icon Generation Steps:

1. Create a base 512x512 icon with your app logo/branding
2. Use an online tool like https://realfavicongenerator.net/ or https://app-manifest.firebaseapp.com/
3. Or use ImageMagick to resize:

```bash
# Install ImageMagick first
# Create all sizes from a base 512x512 image
convert icon-512x512.png -resize 72x72 icon-72x72.png
convert icon-512x512.png -resize 96x96 icon-96x96.png
convert icon-512x512.png -resize 128x128 icon-128x128.png
convert icon-512x512.png -resize 144x144 icon-144x144.png
convert icon-512x512.png -resize 152x152 icon-152x152.png
convert icon-512x512.png -resize 192x192 icon-192x192.png
convert icon-512x512.png -resize 384x384 icon-384x384.png
```

## Recommended Design:
- Use your app's primary color (#3b82f6 - blue)
- Include a financial/money symbol (dollar sign, credit card, chart)
- Keep it simple and recognizable at small sizes
- Use a white or transparent background
- Ensure good contrast for visibility

## Alternative: Use Favicon Generator
Visit https://favicon.io/favicon-generator/ to create a complete icon set from text or an image.

Place all generated icons in: `/public/icons/`
