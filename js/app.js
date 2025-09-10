/**
 * Main Application - Passport Photo Cropper
 * Coordinates all functionality and user interactions
 */

class PassportPhotoCropper {
    constructor() {
        this.currentStep = 1;
        this.maxSteps = 4;
        this.presetManager = new PresetManager();
        this.photoProcessor = new PhotoProcessor();
        this.currentPhoto = null;
        this.currentPreset = null;
        this.processedResult = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize components
            await this.presetManager.loadPresets();
            await this.photoProcessor.init();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Populate initial data
            this.populateCountries();
            
            console.log('Passport Photo Cropper initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            Utils.showNotification('Failed to initialize application', 'error');
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Hero section
        document.getElementById('start-cropping')?.addEventListener('click', () => {
            this.showMainApp();
        });

        document.getElementById('learn-more')?.addEventListener('click', () => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        });

        // Preset selection
        document.getElementById('country-select')?.addEventListener('change', (e) => {
            this.onCountryChange(e.target.value);
        });

        document.getElementById('document-select')?.addEventListener('change', (e) => {
            this.onDocumentTypeChange(e.target.value);
        });

        document.getElementById('custom-preset-btn')?.addEventListener('click', () => {
            this.showCustomPresetModal();
        });

        // Photo upload
        const uploadArea = document.getElementById('upload-area');
        const photoInput = document.getElementById('photo-input');

        uploadArea?.addEventListener('click', () => {
            photoInput?.click();
        });

        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handlePhotoUpload(files[0]);
            }
        });

        photoInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handlePhotoUpload(e.target.files[0]);
            }
        });

        document.getElementById('change-photo')?.addEventListener('click', () => {
            photoInput?.click();
        });

        // Navigation
        document.getElementById('prev-step')?.addEventListener('click', () => {
            this.previousStep();
        });

        document.getElementById('next-step')?.addEventListener('click', () => {
            this.nextStep();
        });

        // Download actions
        document.getElementById('download-photo')?.addEventListener('click', () => {
            this.downloadPhoto();
        });

        document.getElementById('download-print-sheet')?.addEventListener('click', () => {
            this.downloadPrintSheet();
        });

        document.getElementById('process-another')?.addEventListener('click', () => {
            this.resetToStep(2);
        });

        document.getElementById('change-preset')?.addEventListener('click', () => {
            this.resetToStep(1);
        });

        // Custom preset modal
        document.getElementById('close-custom-modal')?.addEventListener('click', () => {
            this.hideCustomPresetModal();
        });

        document.getElementById('cancel-custom')?.addEventListener('click', () => {
            this.hideCustomPresetModal();
        });

        document.getElementById('custom-preset-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCustomPreset();
        });

        // Preset change listener
        document.addEventListener('presetChanged', (e) => {
            this.onPresetSelected(e.detail.preset);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideCustomPresetModal();
            }
        });
    }

    /**
     * Show main application and hide hero
     */
    showMainApp() {
        document.querySelector('.hero')?.style.setProperty('display', 'none');
        document.querySelector('.features')?.style.setProperty('display', 'none');
        document.querySelector('.how-it-works')?.style.setProperty('display', 'none');
        document.getElementById('main-app')?.style.setProperty('display', 'block');
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Populate countries dropdown
     */
    populateCountries() {
        const countrySelect = document.getElementById('country-select');
        if (!countrySelect) return;

        const countries = this.presetManager.getCountries();
        countrySelect.innerHTML = '<option value="">Select a country...</option>';
        
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag} ${country.name}`;
            countrySelect.appendChild(option);
        });
    }

    /**
     * Handle country selection change
     */
    onCountryChange(countryCode) {
        const documentSelect = document.getElementById('document-select');
        if (!documentSelect) return;

        if (!countryCode) {
            documentSelect.innerHTML = '<option value="">Select document type...</option>';
            documentSelect.disabled = true;
            this.clearPresetCards();
            return;
        }

        const documentTypes = this.presetManager.getDocumentTypes(countryCode);
        documentSelect.innerHTML = '<option value="">Select document type...</option>';
        
        documentTypes.forEach(docType => {
            const option = document.createElement('option');
            option.value = docType.id;
            option.textContent = docType.name;
            documentSelect.appendChild(option);
        });

        documentSelect.disabled = false;
        this.clearPresetCards();
    }

    /**
     * Handle document type selection change
     */
    onDocumentTypeChange(documentType) {
        const countryCode = document.getElementById('country-select')?.value;
        if (!countryCode || !documentType) {
            this.clearPresetCards();
            return;
        }

        this.showPresetCards(countryCode, documentType);
    }

    /**
     * Show preset cards for selected country and document type
     */
    showPresetCards(countryCode, documentType) {
        const preset = this.presetManager.getPreset(countryCode, documentType);
        if (!preset) return;

        const container = document.getElementById('preset-cards');
        if (!container) return;

        container.innerHTML = '';

        const card = this.createPresetCard(preset);
        container.appendChild(card);

        // Auto-select the preset
        card.click();
    }

    /**
     * Create a preset card element
     */
    createPresetCard(preset) {
        const card = document.createElement('div');
        card.className = 'preset-card';
        card.dataset.presetId = preset.id;

        const country = this.presetManager.getCountries().find(c => c.code === preset.country);
        const specs = this.presetManager.getPresetSpecs(preset);

        card.innerHTML = `
            <div class="preset-header">
                <span class="preset-flag">${country?.flag || '🏳️'}</span>
                <h3 class="preset-title">${preset.name}</h3>
            </div>
            <ul class="preset-specs">
                ${specs.map(spec => `<li>${spec}</li>`).join('')}
            </ul>
        `;

        card.addEventListener('click', () => {
            this.selectPresetCard(card, preset);
        });

        return card;
    }

    /**
     * Select a preset card
     */
    selectPresetCard(card, preset) {
        // Remove selection from other cards
        document.querySelectorAll('.preset-card').forEach(c => {
            c.classList.remove('selected');
        });

        // Select this card
        card.classList.add('selected');
        
        // Set current preset
        this.presetManager.setCurrentPreset(preset);
        this.currentPreset = preset;

        // Enable next step
        this.updateNavigationButtons();
    }

    /**
     * Clear preset cards
     */
    clearPresetCards() {
        const container = document.getElementById('preset-cards');
        if (container) {
            container.innerHTML = '';
        }
        this.currentPreset = null;
        this.updateNavigationButtons();
    }

    /**
     * Handle preset selection
     */
    onPresetSelected(preset) {
        this.currentPreset = preset;
        this.updateNavigationButtons();
    }

    /**
     * Handle photo upload
     */
    async handlePhotoUpload(file) {
        try {
            // Validate file
            if (!Utils.isValidImageType(file)) {
                Utils.showNotification('Please select a valid image file (JPEG, PNG, WebP)', 'error');
                return;
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                Utils.showNotification('File size must be less than 10MB', 'error');
                return;
            }

            // Load image
            const img = await this.photoProcessor.loadImage(file);
            this.currentPhoto = { file, img };

            // Show preview
            this.showPhotoPreview(img, file);

            // Enable next step
            this.updateNavigationButtons();

        } catch (error) {
            console.error('Failed to upload photo:', error);
            Utils.showNotification('Failed to upload photo', 'error');
        }
    }

    /**
     * Show photo preview
     */
    async showPhotoPreview(img, file) {
        const uploadArea = document.getElementById('upload-area');
        const preview = document.getElementById('photo-preview');
        const previewImage = document.getElementById('preview-image');
        const photoInfo = document.getElementById('photo-info');

        if (!uploadArea || !preview || !previewImage || !photoInfo) return;

        // Hide upload area and show preview
        uploadArea.style.display = 'none';
        preview.style.display = 'block';

        // Set preview image
        previewImage.src = img.src;

        // Get image dimensions
        const dimensions = await Utils.getImageDimensions(file);

        // Show photo info
        photoInfo.innerHTML = `
            <div class="info-item">
                <div class="info-label">File Size</div>
                <div class="info-value">${Utils.formatFileSize(file.size)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Dimensions</div>
                <div class="info-value">${dimensions.width} × ${dimensions.height}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Aspect Ratio</div>
                <div class="info-value">${dimensions.aspectRatio.toFixed(2)}:1</div>
            </div>
            <div class="info-item">
                <div class="info-label">Format</div>
                <div class="info-value">${file.type.split('/')[1].toUpperCase()}</div>
            </div>
        `;
    }

    /**
     * Process photo with current preset
     */
    async processPhoto() {
        if (!this.currentPhoto || !this.currentPreset) {
            Utils.showNotification('Please select a preset and upload a photo', 'error');
            return;
        }

        try {
            // Show processing status
            this.showProcessingStatus();

            // Detect faces
            const face = await this.photoProcessor.detectFaces();

            // Validate photo
            const validation = this.photoProcessor.validatePhoto(face, this.currentPreset);

            // Crop image
            const croppedCanvas = this.photoProcessor.cropImage(face, this.currentPreset);

            // Store result
            this.processedResult = {
                face,
                validation,
                croppedCanvas,
                preset: this.currentPreset
            };

            // Show results
            this.showValidationResults(validation, croppedCanvas);

        } catch (error) {
            console.error('Failed to process photo:', error);
            this.showProcessingError(error.message);
        }
    }

    /**
     * Show processing status
     */
    showProcessingStatus() {
        const processingStatus = document.getElementById('processing-status');
        const validationResults = document.getElementById('validation-results');

        if (processingStatus) processingStatus.style.display = 'block';
        if (validationResults) validationResults.style.display = 'none';
    }

    /**
     * Show validation results
     */
    showValidationResults(validation, croppedCanvas) {
        const processingStatus = document.getElementById('processing-status');
        const validationResults = document.getElementById('validation-results');
        const validationStatus = document.getElementById('validation-status');
        const croppedCanvasElement = document.getElementById('cropped-canvas');

        if (processingStatus) processingStatus.style.display = 'none';
        if (validationResults) validationResults.style.display = 'block';

        // Show validation status
        if (validationStatus) {
            const statusClass = validation.valid ? 'success' : 'error';
            const statusText = validation.valid ? '✓ Photo meets requirements' : '✗ Photo needs adjustments';
            
            validationStatus.className = `validation-status ${statusClass}`;
            validationStatus.textContent = statusText;
        }

        // Show individual validation checks
        this.updateValidationChecks(validation);

        // Show cropped result
        if (croppedCanvasElement && croppedCanvas) {
            const ctx = croppedCanvasElement.getContext('2d');
            croppedCanvasElement.width = croppedCanvas.width;
            croppedCanvasElement.height = croppedCanvas.height;
            ctx.drawImage(croppedCanvas, 0, 0);
        }

        // Enable next step if validation passed
        this.updateNavigationButtons();
    }

    /**
     * Update individual validation checks
     */
    updateValidationChecks(validation) {
        const checks = {
            'face-detection-check': validation.errors.includes('FACE_NOT_DETECTED') ? 'fail' : 'pass',
            'head-size-check': validation.errors.includes('FACE_TOO_SMALL') || validation.errors.includes('FACE_TOO_LARGE') ? 'fail' : 'pass',
            'eye-position-check': validation.errors.includes('EYES_OUT_OF_RANGE') ? 'fail' : 'pass',
            'pose-check': validation.errors.includes('POSE_INVALID') ? 'fail' : 'pass',
            'background-check': validation.errors.includes('BACKGROUND_NONUNIFORM') ? 'fail' : 'pass',
            'quality-check': validation.errors.includes('SHARPNESS_LOW') || validation.errors.includes('EXPOSURE_POOR') ? 'fail' : 'pass'
        };

        Object.entries(checks).forEach(([id, status]) => {
            const element = document.getElementById(id);
            if (element) {
                element.className = `validation-check ${status}`;
                element.textContent = status === 'pass' ? 'Passed' : 'Failed';
            }
        });
    }

    /**
     * Show processing error
     */
    showProcessingError(message) {
        const processingStatus = document.getElementById('processing-status');
        const validationResults = document.getElementById('validation-results');

        if (processingStatus) {
            processingStatus.innerHTML = `
                <div class="processing-error">
                    <h3>Processing Failed</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="app.previousStep()">Go Back</button>
                </div>
            `;
        }

        if (validationResults) validationResults.style.display = 'none';
    }

    /**
     * Prepare download page
     */
    prepareDownload() {
        if (!this.processedResult) return;

        const finalCanvas = document.getElementById('final-canvas');
        const presetName = document.getElementById('download-preset-name');
        const downloadSpecs = document.getElementById('download-specs');

        // Copy cropped canvas to final canvas
        if (finalCanvas && this.processedResult.croppedCanvas) {
            const ctx = finalCanvas.getContext('2d');
            finalCanvas.width = this.processedResult.croppedCanvas.width;
            finalCanvas.height = this.processedResult.croppedCanvas.height;
            ctx.drawImage(this.processedResult.croppedCanvas, 0, 0);
        }

        // Show preset name
        if (presetName) {
            presetName.textContent = this.processedResult.preset.name;
        }

        // Show specifications
        if (downloadSpecs) {
            const specs = this.presetManager.getPresetSpecs(this.processedResult.preset);
            downloadSpecs.innerHTML = specs.map(spec => `<div>${spec}</div>`).join('');
        }
    }

    /**
     * Download processed photo
     */
    async downloadPhoto() {
        if (!this.processedResult) {
            Utils.showNotification('No processed photo available', 'error');
            return;
        }

        try {
            const blob = await this.photoProcessor.exportImage(
                this.processedResult.croppedCanvas,
                this.processedResult.preset
            );

            const filename = `passport-photo-${this.processedResult.preset.country}-${Utils.formatDateForFilename()}.jpg`;
            Utils.downloadBlob(blob, filename);

            Utils.showNotification('Photo downloaded successfully', 'success');

        } catch (error) {
            console.error('Failed to download photo:', error);
            Utils.showNotification('Failed to download photo', 'error');
        }
    }

    /**
     * Download print sheet
     */
    async downloadPrintSheet() {
        if (!this.processedResult) {
            Utils.showNotification('No processed photo available', 'error');
            return;
        }

        try {
            const printSheet = Utils.createPrintSheet(
                this.processedResult.croppedCanvas,
                this.processedResult.preset
            );

            const blob = await Utils.canvasToBlob(printSheet, 'image/jpeg', 0.95);
            const filename = `passport-photo-sheet-${this.processedResult.preset.country}-${Utils.formatDateForFilename()}.jpg`;
            Utils.downloadBlob(blob, filename);

            Utils.showNotification('Print sheet downloaded successfully', 'success');

        } catch (error) {
            console.error('Failed to download print sheet:', error);
            Utils.showNotification('Failed to download print sheet', 'error');
        }
    }

    /**
     * Show custom preset modal
     */
    showCustomPresetModal() {
        const modal = document.getElementById('custom-preset-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Hide custom preset modal
     */
    hideCustomPresetModal() {
        const modal = document.getElementById('custom-preset-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Create custom preset
     */
    createCustomPreset() {
        const form = document.getElementById('custom-preset-form');
        if (!form) return;

        const formData = new FormData(form);
        const config = {
            name: document.getElementById('custom-name')?.value,
            photo_size_mm: {
                width: parseFloat(document.getElementById('custom-width')?.value),
                height: parseFloat(document.getElementById('custom-height')?.value)
            },
            head_height_range_mm: {
                min: parseFloat(document.getElementById('custom-head-min')?.value),
                max: parseFloat(document.getElementById('custom-head-max')?.value)
            },
            dpi: parseInt(document.getElementById('custom-dpi')?.value)
        };

        // Validate configuration
        const validation = this.presetManager.validatePresetConfig(config);
        if (!validation.valid) {
            Utils.showNotification(validation.errors[0], 'error');
            return;
        }

        // Create preset
        const customPreset = this.presetManager.createCustomPreset(config);
        
        // Select the custom preset
        this.currentPreset = customPreset;
        this.presetManager.setCurrentPreset(customPreset);

        // Hide modal
        this.hideCustomPresetModal();

        // Show success message
        Utils.showNotification('Custom preset created successfully', 'success');

        // Update UI
        this.clearPresetCards();
        const card = this.createPresetCard(customPreset);
        document.getElementById('preset-cards')?.appendChild(card);
        this.selectPresetCard(card, customPreset);
    }

    /**
     * Navigate to next step
     */
    async nextStep() {
        if (this.currentStep >= this.maxSteps) return;

        // Validate current step
        if (!this.canProceedToNextStep()) {
            return;
        }

        // Special handling for step 3 (processing)
        if (this.currentStep === 2) {
            this.goToStep(3);
            await this.processPhoto();
            return;
        }

        // Special handling for step 4 (download)
        if (this.currentStep === 3) {
            this.prepareDownload();
        }

        this.goToStep(this.currentStep + 1);
    }

    /**
     * Navigate to previous step
     */
    previousStep() {
        if (this.currentStep <= 1) return;
        this.goToStep(this.currentStep - 1);
    }

    /**
     * Go to specific step
     */
    goToStep(step) {
        if (step < 1 || step > this.maxSteps) return;

        // Hide current step
        document.querySelector('.step-content.active')?.classList.remove('active');
        document.querySelector('.step.active')?.classList.remove('active');

        // Show new step
        document.getElementById(`step-${step}`)?.classList.add('active');
        document.querySelector(`.step[data-step="${step}"]`)?.classList.add('active');

        // Update current step
        this.currentStep = step;

        // Update navigation
        this.updateNavigationButtons();

        // Mark completed steps
        this.updateStepProgress();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Reset to specific step
     */
    resetToStep(step) {
        // Clear relevant data
        if (step <= 1) {
            this.currentPreset = null;
            this.currentPhoto = null;
            this.processedResult = null;
        } else if (step <= 2) {
            this.currentPhoto = null;
            this.processedResult = null;
        }

        // Reset UI
        if (step <= 2) {
            const uploadArea = document.getElementById('upload-area');
            const preview = document.getElementById('photo-preview');
            if (uploadArea) uploadArea.style.display = 'block';
            if (preview) preview.style.display = 'none';
        }

        this.goToStep(step);
    }

    /**
     * Check if can proceed to next step
     */
    canProceedToNextStep() {
        switch (this.currentStep) {
            case 1:
                if (!this.currentPreset) {
                    Utils.showNotification('Please select a preset first', 'warning');
                    return false;
                }
                return true;
            case 2:
                if (!this.currentPhoto) {
                    Utils.showNotification('Please upload a photo first', 'warning');
                    return false;
                }
                return true;
            case 3:
                if (!this.processedResult || !this.processedResult.validation.valid) {
                    Utils.showNotification('Photo processing must be completed successfully', 'warning');
                    return false;
                }
                return true;
            default:
                return true;
        }
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');

        if (!prevBtn || !nextBtn) return;

        // Previous button
        if (this.currentStep <= 1) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-flex';
        }

        // Next button
        if (this.currentStep >= this.maxSteps) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'inline-flex';
            nextBtn.disabled = !this.canProceedToNextStep();
        }
    }

    /**
     * Update step progress indicators
     */
    updateStepProgress() {
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else {
                step.classList.remove('completed');
            }
        });
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PassportPhotoCropper();
});

// Export for global access
window.PassportPhotoCropper = PassportPhotoCropper;

