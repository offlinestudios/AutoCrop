/**
 * Advanced Features - Enhanced functionality for Passport Photo Cropper
 * Includes batch processing, advanced validation, and user experience enhancements
 */

class AdvancedFeatures {
    constructor(app) {
        this.app = app;
        this.batchQueue = [];
        this.processingBatch = false;
        this.validationHistory = [];
        this.userPreferences = this.loadUserPreferences();
        
        this.init();
    }

    /**
     * Initialize advanced features
     */
    init() {
        this.setupBatchProcessing();
        this.setupAdvancedValidation();
        this.setupUserPreferences();
        this.setupKeyboardShortcuts();
        this.setupAnalytics();
    }

    /**
     * Setup batch processing functionality
     */
    setupBatchProcessing() {
        // Add batch upload button to UI
        this.addBatchUploadButton();
        
        // Setup batch processing modal
        this.createBatchProcessingModal();
    }

    /**
     * Add batch upload button to the upload area
     */
    addBatchUploadButton() {
        const uploadArea = document.getElementById('upload-area');
        if (!uploadArea) return;

        const batchButton = document.createElement('button');
        batchButton.className = 'btn btn-outline btn-small';
        batchButton.innerHTML = `
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
            </svg>
            Batch Process Multiple Photos
        `;
        batchButton.id = 'batch-upload-btn';

        batchButton.addEventListener('click', () => {
            this.showBatchProcessingModal();
        });

        // Insert after upload requirements
        const requirements = uploadArea.querySelector('.upload-requirements');
        if (requirements) {
            requirements.insertAdjacentElement('afterend', batchButton);
        }
    }

    /**
     * Create batch processing modal
     */
    createBatchProcessingModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'batch-processing-modal';

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Batch Process Photos</h3>
                    <button class="modal-close" id="close-batch-modal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="batch-upload-area" id="batch-upload-area">
                        <div class="upload-content">
                            <div class="upload-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7,10 12,15 17,10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                            </div>
                            <h3>Drop multiple photos here</h3>
                            <p>or <span class="upload-link" id="batch-browse">browse files</span></p>
                            <div class="upload-requirements">
                                <small>Select multiple photos to process with the same preset</small>
                            </div>
                        </div>
                        <input type="file" id="batch-photo-input" accept="image/*" multiple hidden>
                    </div>
                    
                    <div class="batch-queue" id="batch-queue" style="display: none;">
                        <h4>Photos to Process (<span id="batch-count">0</span>)</h4>
                        <div class="batch-items" id="batch-items"></div>
                        <div class="batch-actions">
                            <button class="btn btn-outline" id="clear-batch">Clear All</button>
                            <button class="btn btn-primary" id="start-batch-processing">Start Processing</button>
                        </div>
                    </div>
                    
                    <div class="batch-progress" id="batch-progress" style="display: none;">
                        <h4>Processing Photos...</h4>
                        <div class="progress-bar">
                            <div class="progress-fill" id="batch-progress-fill"></div>
                        </div>
                        <div class="progress-text" id="batch-progress-text">0 of 0 completed</div>
                    </div>
                    
                    <div class="batch-results" id="batch-results" style="display: none;">
                        <h4>Processing Complete</h4>
                        <div class="batch-summary" id="batch-summary"></div>
                        <div class="batch-downloads">
                            <button class="btn btn-primary" id="download-all-photos">Download All Photos</button>
                            <button class="btn btn-outline" id="download-batch-report">Download Report</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupBatchModalEvents();
    }

    /**
     * Setup batch modal event listeners
     */
    setupBatchModalEvents() {
        const modal = document.getElementById('batch-processing-modal');
        const batchUploadArea = document.getElementById('batch-upload-area');
        const batchInput = document.getElementById('batch-photo-input');

        // Modal close
        document.getElementById('close-batch-modal')?.addEventListener('click', () => {
            this.hideBatchProcessingModal();
        });

        // File upload
        document.getElementById('batch-browse')?.addEventListener('click', () => {
            batchInput?.click();
        });

        batchUploadArea?.addEventListener('click', () => {
            batchInput?.click();
        });

        batchUploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            batchUploadArea.classList.add('dragover');
        });

        batchUploadArea?.addEventListener('dragleave', () => {
            batchUploadArea.classList.remove('dragover');
        });

        batchUploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            batchUploadArea.classList.remove('dragover');
            this.handleBatchUpload(Array.from(e.dataTransfer.files));
        });

        batchInput?.addEventListener('change', (e) => {
            this.handleBatchUpload(Array.from(e.target.files));
        });

        // Batch actions
        document.getElementById('clear-batch')?.addEventListener('click', () => {
            this.clearBatchQueue();
        });

        document.getElementById('start-batch-processing')?.addEventListener('click', () => {
            this.startBatchProcessing();
        });

        document.getElementById('download-all-photos')?.addEventListener('click', () => {
            this.downloadAllBatchPhotos();
        });

        document.getElementById('download-batch-report')?.addEventListener('click', () => {
            this.downloadBatchReport();
        });
    }

    /**
     * Show batch processing modal
     */
    showBatchProcessingModal() {
        if (!this.app.currentPreset) {
            Utils.showNotification('Please select a preset first', 'warning');
            return;
        }

        const modal = document.getElementById('batch-processing-modal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * Hide batch processing modal
     */
    hideBatchProcessingModal() {
        const modal = document.getElementById('batch-processing-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.clearBatchQueue();
    }

    /**
     * Handle batch photo upload
     */
    async handleBatchUpload(files) {
        const validFiles = files.filter(file => {
            if (!Utils.isValidImageType(file)) {
                Utils.showNotification(`${file.name} is not a valid image type`, 'warning');
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                Utils.showNotification(`${file.name} is too large (max 10MB)`, 'warning');
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // Add to batch queue
        for (const file of validFiles) {
            try {
                const img = await this.app.photoProcessor.loadImage(file);
                this.batchQueue.push({ file, img, status: 'pending' });
            } catch (error) {
                console.error(`Failed to load ${file.name}:`, error);
                Utils.showNotification(`Failed to load ${file.name}`, 'error');
            }
        }

        this.updateBatchQueueUI();
    }

    /**
     * Update batch queue UI
     */
    updateBatchQueueUI() {
        const batchQueue = document.getElementById('batch-queue');
        const batchCount = document.getElementById('batch-count');
        const batchItems = document.getElementById('batch-items');

        if (!batchQueue || !batchCount || !batchItems) return;

        if (this.batchQueue.length === 0) {
            batchQueue.style.display = 'none';
            return;
        }

        batchQueue.style.display = 'block';
        batchCount.textContent = this.batchQueue.length;

        batchItems.innerHTML = this.batchQueue.map((item, index) => `
            <div class="batch-item" data-index="${index}">
                <img src="${item.img.src}" alt="${item.file.name}" class="batch-thumbnail">
                <div class="batch-info">
                    <div class="batch-filename">${item.file.name}</div>
                    <div class="batch-filesize">${Utils.formatFileSize(item.file.size)}</div>
                </div>
                <div class="batch-status ${item.status}">${item.status}</div>
                <button class="btn btn-text btn-small batch-remove" onclick="advancedFeatures.removeBatchItem(${index})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    /**
     * Remove item from batch queue
     */
    removeBatchItem(index) {
        this.batchQueue.splice(index, 1);
        this.updateBatchQueueUI();
    }

    /**
     * Clear batch queue
     */
    clearBatchQueue() {
        this.batchQueue = [];
        this.updateBatchQueueUI();
    }

    /**
     * Start batch processing
     */
    async startBatchProcessing() {
        if (this.batchQueue.length === 0 || this.processingBatch) return;

        this.processingBatch = true;
        const batchProgress = document.getElementById('batch-progress');
        const batchQueue = document.getElementById('batch-queue');

        if (batchProgress) batchProgress.style.display = 'block';
        if (batchQueue) batchQueue.style.display = 'none';

        const results = [];
        let completed = 0;

        for (let i = 0; i < this.batchQueue.length; i++) {
            const item = this.batchQueue[i];
            
            try {
                // Update progress
                this.updateBatchProgress(completed, this.batchQueue.length);
                
                // Process photo
                this.app.photoProcessor.currentImage = item.img;
                const face = await this.app.photoProcessor.detectFaces();
                const validation = this.app.photoProcessor.validatePhoto(face, this.app.currentPreset);
                const croppedCanvas = this.app.photoProcessor.cropImage(face, this.app.currentPreset);
                
                results.push({
                    file: item.file,
                    success: true,
                    validation,
                    croppedCanvas
                });
                
                item.status = validation.valid ? 'success' : 'warning';
                
            } catch (error) {
                console.error(`Failed to process ${item.file.name}:`, error);
                results.push({
                    file: item.file,
                    success: false,
                    error: error.message
                });
                item.status = 'error';
            }
            
            completed++;
        }

        this.processingBatch = false;
        this.showBatchResults(results);
    }

    /**
     * Update batch processing progress
     */
    updateBatchProgress(completed, total) {
        const progressFill = document.getElementById('batch-progress-fill');
        const progressText = document.getElementById('batch-progress-text');

        if (progressFill) {
            const percentage = (completed / total) * 100;
            progressFill.style.width = `${percentage}%`;
        }

        if (progressText) {
            progressText.textContent = `${completed} of ${total} completed`;
        }
    }

    /**
     * Show batch processing results
     */
    showBatchResults(results) {
        const batchProgress = document.getElementById('batch-progress');
        const batchResults = document.getElementById('batch-results');
        const batchSummary = document.getElementById('batch-summary');

        if (batchProgress) batchProgress.style.display = 'none';
        if (batchResults) batchResults.style.display = 'block';

        const successful = results.filter(r => r.success && r.validation?.valid).length;
        const warnings = results.filter(r => r.success && !r.validation?.valid).length;
        const errors = results.filter(r => !r.success).length;

        if (batchSummary) {
            batchSummary.innerHTML = `
                <div class="batch-stats">
                    <div class="stat-item success">
                        <div class="stat-number">${successful}</div>
                        <div class="stat-label">Successful</div>
                    </div>
                    <div class="stat-item warning">
                        <div class="stat-number">${warnings}</div>
                        <div class="stat-label">Warnings</div>
                    </div>
                    <div class="stat-item error">
                        <div class="stat-number">${errors}</div>
                        <div class="stat-label">Errors</div>
                    </div>
                </div>
            `;
        }

        this.batchResults = results;
    }

    /**
     * Download all batch photos
     */
    async downloadAllBatchPhotos() {
        if (!this.batchResults) return;

        const successfulResults = this.batchResults.filter(r => r.success && r.validation?.valid);
        
        if (successfulResults.length === 0) {
            Utils.showNotification('No successful photos to download', 'warning');
            return;
        }

        // Create ZIP file (simplified - in production use JSZip library)
        for (let i = 0; i < successfulResults.length; i++) {
            const result = successfulResults[i];
            const blob = await this.app.photoProcessor.exportImage(result.croppedCanvas, this.app.currentPreset);
            const filename = `batch-photo-${i + 1}-${result.file.name.split('.')[0]}.jpg`;
            
            // Download each file individually (in production, create a ZIP)
            Utils.downloadBlob(blob, filename);
            
            // Add delay to prevent browser blocking
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        Utils.showNotification(`Downloaded ${successfulResults.length} photos`, 'success');
    }

    /**
     * Download batch processing report
     */
    downloadBatchReport() {
        if (!this.batchResults) return;

        const report = this.generateBatchReport();
        const blob = new Blob([report], { type: 'text/plain' });
        const filename = `batch-report-${Utils.formatDateForFilename()}.txt`;
        
        Utils.downloadBlob(blob, filename);
        Utils.showNotification('Report downloaded', 'success');
    }

    /**
     * Generate batch processing report
     */
    generateBatchReport() {
        const timestamp = new Date().toISOString();
        const preset = this.app.currentPreset;
        
        let report = `Passport Photo Batch Processing Report\n`;
        report += `Generated: ${timestamp}\n`;
        report += `Preset: ${preset.name}\n`;
        report += `Total Photos: ${this.batchResults.length}\n\n`;

        this.batchResults.forEach((result, index) => {
            report += `Photo ${index + 1}: ${result.file.name}\n`;
            report += `Status: ${result.success ? 'Success' : 'Error'}\n`;
            
            if (result.success) {
                report += `Validation: ${result.validation.valid ? 'Passed' : 'Failed'}\n`;
                if (!result.validation.valid) {
                    report += `Errors: ${result.validation.errors.join(', ')}\n`;
                }
            } else {
                report += `Error: ${result.error}\n`;
            }
            
            report += '\n';
        });

        return report;
    }

    /**
     * Setup advanced validation features
     */
    setupAdvancedValidation() {
        this.setupValidationHistory();
        this.setupValidationTips();
        this.setupQualityAnalysis();
    }

    /**
     * Setup validation history tracking
     */
    setupValidationHistory() {
        // Track validation results for analytics
        document.addEventListener('photoProcessed', (e) => {
            this.validationHistory.push({
                timestamp: Date.now(),
                preset: e.detail.preset.id,
                validation: e.detail.validation,
                success: e.detail.validation.valid
            });
            
            // Keep only last 100 entries
            if (this.validationHistory.length > 100) {
                this.validationHistory.shift();
            }
            
            this.saveValidationHistory();
        });
    }

    /**
     * Setup validation tips
     */
    setupValidationTips() {
        const tips = {
            'FACE_TOO_SMALL': 'Move closer to the camera or use a higher resolution image',
            'FACE_TOO_LARGE': 'Move further from the camera or crop the image',
            'EYES_OUT_OF_RANGE': 'Adjust your position so your eyes are at the correct height',
            'POSE_INVALID': 'Look straight at the camera and keep your head level',
            'BACKGROUND_NONUNIFORM': 'Use a plain white or light-colored background',
            'SHARPNESS_LOW': 'Ensure good lighting and hold the camera steady'
        };

        // Add tips to validation results
        const originalUpdateValidationChecks = this.app.updateValidationChecks;
        this.app.updateValidationChecks = (validation) => {
            originalUpdateValidationChecks.call(this.app, validation);
            
            // Add tips for failed validations
            validation.errors.forEach(error => {
                const element = document.getElementById(this.getCheckElementId(error));
                if (element && tips[error]) {
                    const tip = document.createElement('div');
                    tip.className = 'validation-tip';
                    tip.textContent = tips[error];
                    element.appendChild(tip);
                }
            });
        };
    }

    /**
     * Get validation check element ID for error code
     */
    getCheckElementId(errorCode) {
        const mapping = {
            'FACE_TOO_SMALL': 'head-size-check',
            'FACE_TOO_LARGE': 'head-size-check',
            'EYES_OUT_OF_RANGE': 'eye-position-check',
            'POSE_INVALID': 'pose-check',
            'BACKGROUND_NONUNIFORM': 'background-check',
            'SHARPNESS_LOW': 'quality-check'
        };
        return mapping[errorCode];
    }

    /**
     * Setup quality analysis
     */
    setupQualityAnalysis() {
        // Add quality score to validation results
        const originalValidatePhoto = this.app.photoProcessor.validatePhoto;
        this.app.photoProcessor.validatePhoto = function(face, preset) {
            const validation = originalValidatePhoto.call(this, face, preset);
            
            // Calculate quality score
            validation.qualityScore = this.calculateQualityScore(face, preset, validation);
            
            return validation;
        };
    }

    /**
     * Setup user preferences
     */
    setupUserPreferences() {
        this.applyUserPreferences();
        this.setupPreferenceControls();
    }

    /**
     * Load user preferences from localStorage
     */
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('passportPhotoCropper_preferences');
            return saved ? JSON.parse(saved) : this.getDefaultPreferences();
        } catch (error) {
            return this.getDefaultPreferences();
        }
    }

    /**
     * Get default user preferences
     */
    getDefaultPreferences() {
        return {
            theme: 'light',
            autoAdvance: true,
            showTips: true,
            defaultDPI: 300,
            defaultQuality: 90,
            saveHistory: true
        };
    }

    /**
     * Save user preferences to localStorage
     */
    saveUserPreferences() {
        try {
            localStorage.setItem('passportPhotoCropper_preferences', JSON.stringify(this.userPreferences));
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    /**
     * Apply user preferences
     */
    applyUserPreferences() {
        // Apply theme
        if (this.userPreferences.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }

        // Apply auto-advance
        if (this.userPreferences.autoAdvance) {
            // Auto-advance after successful processing
            document.addEventListener('photoProcessed', (e) => {
                if (e.detail.validation.valid) {
                    setTimeout(() => {
                        this.app.nextStep();
                    }, 2000);
                }
            });
        }
    }

    /**
     * Setup preference controls
     */
    setupPreferenceControls() {
        // Add preferences button to header
        const nav = document.querySelector('.nav');
        if (nav) {
            const prefsButton = document.createElement('button');
            prefsButton.className = 'btn btn-text';
            prefsButton.innerHTML = `
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
                Settings
            `;
            prefsButton.addEventListener('click', () => {
                this.showPreferencesModal();
            });
            nav.appendChild(prefsButton);
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not in input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key) {
                case 'ArrowLeft':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.app.previousStep();
                    }
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.app.nextStep();
                    }
                    break;
                case 'r':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.app.resetToStep(1);
                    }
                    break;
                case 'b':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.showBatchProcessingModal();
                    }
                    break;
            }
        });
    }

    /**
     * Setup analytics tracking
     */
    setupAnalytics() {
        // Track usage patterns (privacy-friendly)
        this.analytics = {
            sessionStart: Date.now(),
            stepsCompleted: 0,
            photosProcessed: 0,
            presetsUsed: new Set(),
            errors: []
        };

        // Track step completions
        const originalGoToStep = this.app.goToStep;
        this.app.goToStep = (step) => {
            originalGoToStep.call(this.app, step);
            this.analytics.stepsCompleted = Math.max(this.analytics.stepsCompleted, step);
        };

        // Track photo processing
        document.addEventListener('photoProcessed', (e) => {
            this.analytics.photosProcessed++;
            this.analytics.presetsUsed.add(e.detail.preset.id);
        });

        // Track errors
        const originalShowNotification = Utils.showNotification;
        Utils.showNotification = (message, type, duration) => {
            if (type === 'error') {
                this.analytics.errors.push({
                    timestamp: Date.now(),
                    message: message
                });
            }
            return originalShowNotification(message, type, duration);
        };
    }

    /**
     * Save validation history
     */
    saveValidationHistory() {
        if (!this.userPreferences.saveHistory) return;
        
        try {
            localStorage.setItem('passportPhotoCropper_validationHistory', JSON.stringify(this.validationHistory));
        } catch (error) {
            console.error('Failed to save validation history:', error);
        }
    }

    /**
     * Get usage statistics
     */
    getUsageStatistics() {
        const sessionDuration = Date.now() - this.analytics.sessionStart;
        const successRate = this.validationHistory.length > 0 
            ? (this.validationHistory.filter(v => v.success).length / this.validationHistory.length) * 100 
            : 0;

        return {
            sessionDuration: Math.round(sessionDuration / 1000), // seconds
            stepsCompleted: this.analytics.stepsCompleted,
            photosProcessed: this.analytics.photosProcessed,
            presetsUsed: Array.from(this.analytics.presetsUsed),
            errorCount: this.analytics.errors.length,
            successRate: Math.round(successRate),
            totalValidations: this.validationHistory.length
        };
    }
}

// Initialize advanced features when app is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for main app to initialize
    setTimeout(() => {
        if (window.app) {
            window.advancedFeatures = new AdvancedFeatures(window.app);
        }
    }, 100);
});

// Export for global access
window.AdvancedFeatures = AdvancedFeatures;

