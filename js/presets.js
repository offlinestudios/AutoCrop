/**
 * Preset Manager - Handles loading and managing photo presets
 */

class PresetManager {
    constructor() {
        this.presets = [];
        this.countries = [];
        this.documentTypes = [];
        this.validationCodes = {};
        this.currentPreset = null;
    }

    /**
     * Load presets from JSON file
     */
    async loadPresets() {
        try {
            const response = await fetch('./data/presets.json');
            const data = await response.json();
            
            this.presets = data.presets;
            this.countries = data.countries;
            this.documentTypes = data.document_types;
            this.validationCodes = data.validation_codes;
            
            console.log('Presets loaded successfully:', this.presets.length, 'presets');
            return true;
        } catch (error) {
            console.error('Failed to load presets:', error);
            return false;
        }
    }

    /**
     * Get all available countries
     */
    getCountries() {
        return this.countries;
    }

    /**
     * Get document types for a specific country
     */
    getDocumentTypes(countryCode) {
        const countryPresets = this.presets.filter(preset => preset.country === countryCode);
        const docTypes = [...new Set(countryPresets.map(preset => preset.document_type))];
        
        return this.documentTypes.filter(docType => docTypes.includes(docType.id));
    }

    /**
     * Get preset by country and document type
     */
    getPreset(countryCode, documentType) {
        return this.presets.find(preset => 
            preset.country === countryCode && preset.document_type === documentType
        );
    }

    /**
     * Get preset by ID
     */
    getPresetById(presetId) {
        return this.presets.find(preset => preset.id === presetId);
    }

    /**
     * Set current active preset
     */
    setCurrentPreset(preset) {
        this.currentPreset = preset;
        this.notifyPresetChange(preset);
    }

    /**
     * Get current active preset
     */
    getCurrentPreset() {
        return this.currentPreset;
    }

    /**
     * Get validation message for error code
     */
    getValidationMessage(code) {
        return this.validationCodes[code] || code;
    }

    /**
     * Get all presets for a country
     */
    getCountryPresets(countryCode) {
        return this.presets.filter(preset => preset.country === countryCode);
    }

    /**
     * Search presets by name or country
     */
    searchPresets(query) {
        const searchTerm = query.toLowerCase();
        return this.presets.filter(preset => 
            preset.name.toLowerCase().includes(searchTerm) ||
            preset.country_name.toLowerCase().includes(searchTerm) ||
            preset.document_type.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get preset specifications as human-readable text
     */
    getPresetSpecs(preset) {
        const specs = [];
        
        // Photo size
        if (preset.photo_size_inches) {
            specs.push(`Size: ${preset.photo_size_inches.width}"×${preset.photo_size_inches.height}" (${preset.photo_size_mm.width}×${preset.photo_size_mm.height} mm)`);
        } else {
            specs.push(`Size: ${preset.photo_size_mm.width}×${preset.photo_size_mm.height} mm`);
        }
        
        // Head height
        specs.push(`Head height: ${preset.head_height_range_mm.min}-${preset.head_height_range_mm.max} mm`);
        
        // DPI
        specs.push(`Resolution: ${preset.dpi} DPI`);
        
        // Background
        specs.push(`Background: ${preset.background.color}`);
        
        // File format
        specs.push(`Format: ${preset.file.format.toUpperCase()} (Quality: ${preset.file.quality}%)`);
        
        return specs;
    }

    /**
     * Generate prompt for AI cropping service
     */
    generateCroppingPrompt(preset) {
        let prompt = `Detect the face (chin and natural crown). Crop and scale to ${preset.pixel_dimensions.width}×${preset.pixel_dimensions.height} at ${preset.dpi} DPI so that the chin-to-crown head height is ${preset.head_height_range_mm.min}–${preset.head_height_range_mm.max} mm. `;
        
        if (preset.eye_line_from_bottom_mm) {
            prompt += `Place the eye line ${preset.eye_line_from_bottom_mm.target} mm from the bottom of the image (± ${preset.eye_line_from_bottom_mm.tolerance} mm). `;
        } else if (preset.eye_line_from_top_mm) {
            prompt += `Place the eye line ${preset.eye_line_from_top_mm.target} mm from the top of the image (± ${preset.eye_line_from_top_mm.tolerance} mm). `;
        }
        
        prompt += `Keep at least ${preset.top_clearance_mm.min} mm clearance above the crown and ${preset.crop_safe_margins.side_min_mm} mm on left/right. `;
        prompt += `Maintain a ${preset.aspect_ratio} frame corresponding to ${preset.photo_size_mm.width}×${preset.photo_size_mm.height} mm. `;
        
        prompt += `Validate pose (yaw ≤ ${preset.pose_tolerance_deg.yaw}°, pitch ≤ ${preset.pose_tolerance_deg.pitch}°, roll ≤ ${preset.pose_tolerance_deg.roll}°), `;
        prompt += `ensure neutral expression, even lighting, and a uniform ${preset.background.color} background within ${preset.background.uniformity_tolerance} tolerance. `;
        
        prompt += `Output JPEG (sRGB) at quality ${preset.file.quality}, not exceeding ${preset.file.max_size_mb} MB. `;
        prompt += `If constraints cannot be met, return a failure code from {${preset.if_unmet.join(', ')}} with reason.`;
        
        return prompt;
    }

    /**
     * Notify listeners of preset change
     */
    notifyPresetChange(preset) {
        const event = new CustomEvent('presetChanged', { 
            detail: { preset } 
        });
        document.dispatchEvent(event);
    }

    /**
     * Create custom preset
     */
    createCustomPreset(config) {
        const customPreset = {
            id: 'custom_' + Date.now(),
            name: config.name || 'Custom Preset',
            country: 'CUSTOM',
            country_name: 'Custom',
            document_type: 'custom',
            photo_size_mm: config.photo_size_mm,
            dpi: config.dpi || 300,
            pixel_dimensions: {
                width: Math.round((config.photo_size_mm.width / 25.4) * (config.dpi || 300)),
                height: Math.round((config.photo_size_mm.height / 25.4) * (config.dpi || 300))
            },
            aspect_ratio: `${config.photo_size_mm.width}:${config.photo_size_mm.height}`,
            head_height_range_mm: config.head_height_range_mm,
            head_width_range_mm: config.head_width_range_mm || { min: 15, max: 25 },
            eye_line_from_bottom_mm: config.eye_line_from_bottom_mm,
            top_clearance_mm: config.top_clearance_mm || { min: 3 },
            crop_safe_margins: config.crop_safe_margins || { top_min_mm: 3, side_min_mm: 3 },
            background: config.background || { color: 'white/off-white', uniformity_tolerance: 'low' },
            pose_tolerance_deg: config.pose_tolerance_deg || { yaw: 5, pitch: 5, roll: 3 },
            validation: config.validation || {
                sharpness_min: 80,
                exposure_luma_range: [30, 235],
                glasses: { allow: true, no_glare: true, no_tint: true },
                head_covering: { allow_religious: true, no_shadows: true },
                expression: 'neutral'
            },
            file: config.file || { format: 'jpeg', colorspace: 'srgb', quality: 90, max_size_mb: 5 },
            if_unmet: ['FACE_TOO_SMALL', 'FACE_TOO_LARGE', 'EYES_OUT_OF_RANGE', 'FRAME_TOO_TIGHT', 'BACKGROUND_NONUNIFORM', 'POSE_INVALID', 'EXPRESSION_INVALID']
        };

        return customPreset;
    }

    /**
     * Validate preset configuration
     */
    validatePresetConfig(config) {
        const errors = [];

        if (!config.photo_size_mm || !config.photo_size_mm.width || !config.photo_size_mm.height) {
            errors.push('Photo size (width and height in mm) is required');
        }

        if (!config.head_height_range_mm || !config.head_height_range_mm.min || !config.head_height_range_mm.max) {
            errors.push('Head height range (min and max in mm) is required');
        }

        if (config.head_height_range_mm && config.head_height_range_mm.min >= config.head_height_range_mm.max) {
            errors.push('Head height minimum must be less than maximum');
        }

        if (config.dpi && (config.dpi < 150 || config.dpi > 600)) {
            errors.push('DPI must be between 150 and 600');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Export for use in other modules
window.PresetManager = PresetManager;

