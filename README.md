
# Passport Photo Cropper

A comprehensive web-based passport and ID photo cropping tool that automatically validates and crops photos according to international standards for various countries and document types.

## Features

- **Multi-Country Support**: Presets for Canada, USA, EU/Schengen, China, and more
- **Document Type Specific**: Different requirements for passports, visas, PR cards, citizenship documents
- **Automated Validation**: Face detection, pose validation, background checking
- **Precise Cropping**: ICAO-compliant head positioning and sizing
- **Live Preview**: Real-time overlay showing target zones and validation status
- **Batch Processing**: Process multiple photos with the same preset
- **Export Options**: High-quality JPEG output with print-ready PDF sheets

## Technical Specifications

### Photo Requirements
- **Output Formats**: JPEG (sRGB colorspace)
- **DPI**: 300 (configurable)
- **Quality**: 85-95% JPEG compression
- **Background**: White/off-white with uniformity validation
- **Pose Tolerance**: Yaw ≤ 5°, Pitch ≤ 5°, Roll ≤ 3°

### Supported Presets

#### Canada
- **Passport**: 50×70 mm, head height 31-36 mm
- **Visa/PR/Citizenship**: 50×70 mm (document-specific variations)

#### United States
- **Passport & Visa**: 2×2 in (51×51 mm), head height 25-35 mm

#### EU/Schengen
- **Visa**: 35×45 mm, head height 32-36 mm

#### China
- **Passport/Visa**: 33×48 mm, head height 28-33 mm

## Project Structure

```
passport-photo-cropper/
├── index.html              # Main application page
├── css/
│   ├── main.css            # Primary styles
│   ├── components.css      # Component-specific styles
│   └── responsive.css      # Mobile responsiveness
├── js/
│   ├── app.js              # Main application logic
│   ├── photo-processor.js  # Photo processing and validation
│   ├── presets.js          # Country/document presets
│   └── utils.js            # Utility functions
├── data/
│   └── presets.json        # Preset configurations
├── images/                 # UI assets and sample images
└── assets/                 # Additional resources
```

## Usage

1. **Select Preset**: Choose country and document type
2. **Upload Photo**: Drag and drop or select image file
3. **Auto-Crop**: System automatically detects face and applies preset
4. **Validate**: Real-time feedback on compliance
5. **Adjust**: Manual fine-tuning if needed
6. **Export**: Download cropped photo and/or print sheet

## Development

Built with vanilla HTML5, CSS3, and JavaScript ES6+. No external dependencies required for core functionality.

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT License - see LICENSE file for details

