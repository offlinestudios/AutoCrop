# Deployment Guide - Passport Photo Cropper

## Quick Start

This is a static website that can be deployed to any web hosting service that supports HTML/CSS/JavaScript.

### Local Development
```bash
# Clone the repository
git clone <your-repository-url>
cd passport-photo-cropper

# Start local server (Python 3)
python3 -m http.server 8000

# Or use Node.js
npx http-server -p 8000

# Open browser to http://localhost:8000
```

## Deployment Options

### 1. GitHub Pages
1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Select source: Deploy from a branch
4. Choose branch: master
5. Your site will be available at: `https://yourusername.github.io/passport-photo-cropper`

### 2. Netlify
1. Connect your Git repository to Netlify
2. Build settings:
   - Build command: (leave empty)
   - Publish directory: `/` (root)
3. Deploy automatically on Git push

### 3. Vercel
1. Import your Git repository to Vercel
2. Framework preset: Other
3. Build and output settings: (leave default)
4. Deploy automatically

### 4. Traditional Web Hosting
1. Upload all files to your web server's public directory
2. Ensure the web server serves static files
3. No server-side processing required

### 5. AWS S3 + CloudFront
1. Create S3 bucket with static website hosting
2. Upload all files to the bucket
3. Configure CloudFront for global CDN
4. Set up custom domain if needed

## File Structure
```
passport-photo-cropper/
├── index.html              # Main HTML file
├── css/
│   ├── main.css            # Core styles and layout
│   ├── components.css      # UI component styles
│   └── responsive.css      # Mobile and responsive styles
├── js/
│   ├── app.js              # Main application logic
│   ├── photo-processor.js  # Photo processing functionality
│   ├── presets.js          # Preset management
│   ├── utils.js            # Utility functions
│   └── advanced-features.js # Advanced features and batch processing
├── data/
│   └── presets.json        # Country and document type presets
├── README.md               # Project documentation
├── DEPLOYMENT.md           # This deployment guide
└── testing-results.md      # Testing documentation
```

## Configuration

### Adding New Countries/Presets
Edit `data/presets.json` to add new countries or document types:

```json
{
  "countries": [
    {
      "code": "XX",
      "name": "New Country",
      "flag": "🏳️"
    }
  ],
  "presets": [
    {
      "id": "xx_passport",
      "country": "XX",
      "document_type": "passport",
      "name": "New Country Passport",
      "photo_size_mm": {
        "width": 35,
        "height": 45
      },
      "head_height_range_mm": {
        "min": 25,
        "max": 30
      },
      "dpi": 300
    }
  ]
}
```

### Customizing Colors
Edit CSS variables in `css/main.css`:

```css
:root {
    --primary-600: #your-color;
    --primary-700: #your-darker-color;
    /* ... other color variables */
}
```

## Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Required Features
- ES6+ JavaScript support
- CSS Grid and Flexbox
- Canvas API
- File API
- Drag and Drop API

## Performance Optimization

### For Production
1. **Minify CSS and JavaScript files**
   ```bash
   # Using terser for JS
   npm install -g terser
   terser js/app.js -o js/app.min.js

   # Using cssnano for CSS
   npm install -g cssnano-cli
   cssnano css/main.css css/main.min.css
   ```

2. **Enable Gzip compression** on your web server

3. **Set up proper caching headers**:
   - CSS/JS files: 1 year cache
   - HTML files: No cache or short cache
   - Images: 1 month cache

4. **Use a CDN** for global distribution

### Lighthouse Recommendations
- Enable HTTPS
- Add service worker for offline functionality
- Optimize images (use WebP format)
- Add meta description and Open Graph tags

## Security Considerations

### Content Security Policy
Add to your HTML `<head>`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### HTTPS
Always serve over HTTPS in production for:
- Security
- Modern browser features
- SEO benefits

## Monitoring and Analytics

### Add Google Analytics
```html
<!-- Add before closing </head> tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Monitoring
Consider adding error monitoring services like:
- Sentry
- LogRocket
- Bugsnag

## Maintenance

### Regular Updates
1. Update preset data as country requirements change
2. Test with new browser versions
3. Monitor user feedback and analytics
4. Update dependencies if any are added

### Backup Strategy
- Keep Git repository as primary backup
- Regular exports of any user-generated content
- Database backups if user accounts are added

## Support

For technical support or questions about deployment:
1. Check the README.md file
2. Review testing-results.md for known issues
3. Check browser console for JavaScript errors
4. Verify all files are uploaded correctly

## License

This project is ready for commercial use. Ensure you have proper licensing for any third-party libraries if added in the future.

