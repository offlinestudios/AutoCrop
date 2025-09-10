/**
 * Photo Processor - Core photo processing and validation logic
 * Handles face detection, validation, and cropping for passport photos
 */

class PhotoProcessor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentImage = null;
        this.currentPreset = null;
        this.faceDetectionModel = null;
        this.validationResults = {};
    }

    /**
     * Initialize the photo processor
     */
    async init() {
        // Create canvas for image processing
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize face detection (using MediaPipe or similar)
        await this.initFaceDetection();
    }

    /**
     * Initialize face detection model
     */
    async initFaceDetection() {
        try {
            // For now, we'll use a simplified face detection approach
            // In production, you would integrate with MediaPipe, TensorFlow.js, or similar
            console.log('Face detection initialized');
            this.faceDetectionModel = {
                ready: true,
                detect: this.mockFaceDetection.bind(this)
            };
        } catch (error) {
            console.error('Failed to initialize face detection:', error);
            this.faceDetectionModel = null;
        }
    }

    /**
     * Mock face detection for demonstration
     * In production, replace with actual face detection library
     */
    mockFaceDetection(imageData) {
        // Mock face detection results
        const width = imageData.width;
        const height = imageData.height;
        
        return {
            faces: [{
                bbox: {
                    x: width * 0.25,
                    y: height * 0.15,
                    width: width * 0.5,
                    height: height * 0.7
                },
                landmarks: {
                    leftEye: { x: width * 0.35, y: height * 0.35 },
                    rightEye: { x: width * 0.65, y: height * 0.35 },
                    nose: { x: width * 0.5, y: height * 0.5 },
                    mouth: { x: width * 0.5, y: height * 0.65 },
                    chin: { x: width * 0.5, y: height * 0.85 },
                    crown: { x: width * 0.5, y: height * 0.15 }
                },
                pose: {
                    yaw: 0,
                    pitch: 0,
                    roll: 0
                },
                confidence: 0.95
            }]
        };
    }

    /**
     * Load and process an image file
     */
    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Detect faces in the current image
     */
    async detectFaces() {
        if (!this.currentImage || !this.faceDetectionModel) {
            throw new Error('Image or face detection model not ready');
        }

        // Draw image to canvas for processing
        this.canvas.width = this.currentImage.width;
        this.canvas.height = this.currentImage.height;
        this.ctx.drawImage(this.currentImage, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Detect faces
        const detection = await this.faceDetectionModel.detect(imageData);
        
        if (!detection.faces || detection.faces.length === 0) {
            throw new Error('No face detected in the image');
        }

        if (detection.faces.length > 1) {
            throw new Error('Multiple faces detected. Please use an image with only one person');
        }

        return detection.faces[0];
    }

    /**
     * Validate photo against preset requirements
     */
    validatePhoto(face, preset) {
        const validationResults = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Validate head size
        const headHeight = this.calculateHeadHeight(face);
        const headHeightMm = this.pixelsToMm(headHeight, preset.dpi);
        
        if (headHeightMm < preset.head_height_range_mm.min) {
            validationResults.valid = false;
            validationResults.errors.push('FACE_TOO_SMALL');
        } else if (headHeightMm > preset.head_height_range_mm.max) {
            validationResults.valid = false;
            validationResults.errors.push('FACE_TOO_LARGE');
        }

        // Validate eye position
        const eyePosition = this.calculateEyePosition(face);
        const eyePositionMm = this.pixelsToMm(eyePosition, preset.dpi);
        
        if (preset.eye_line_from_bottom_mm) {
            const targetEyePos = preset.eye_line_from_bottom_mm.target;
            const tolerance = preset.eye_line_from_bottom_mm.tolerance;
            
            if (Math.abs(eyePositionMm - targetEyePos) > tolerance) {
                validationResults.valid = false;
                validationResults.errors.push('EYES_OUT_OF_RANGE');
            }
        }

        // Validate pose
        if (Math.abs(face.pose.yaw) > preset.pose_tolerance_deg.yaw ||
            Math.abs(face.pose.pitch) > preset.pose_tolerance_deg.pitch ||
            Math.abs(face.pose.roll) > preset.pose_tolerance_deg.roll) {
            validationResults.valid = false;
            validationResults.errors.push('POSE_INVALID');
        }

        // Validate background (simplified)
        if (!this.validateBackground()) {
            validationResults.valid = false;
            validationResults.errors.push('BACKGROUND_NONUNIFORM');
        }

        // Validate sharpness
        const sharpness = this.calculateSharpness();
        if (sharpness < preset.validation.sharpness_min) {
            validationResults.valid = false;
            validationResults.errors.push('SHARPNESS_LOW');
        }

        this.validationResults = validationResults;
        return validationResults;
    }

    /**
     * Calculate head height in pixels
     */
    calculateHeadHeight(face) {
        return Math.abs(face.landmarks.crown.y - face.landmarks.chin.y);
    }

    /**
     * Calculate eye position from bottom in pixels
     */
    calculateEyePosition(face) {
        const eyeY = (face.landmarks.leftEye.y + face.landmarks.rightEye.y) / 2;
        return this.canvas.height - eyeY;
    }

    /**
     * Convert pixels to millimeters
     */
    pixelsToMm(pixels, dpi) {
        return (pixels / dpi) * 25.4;
    }

    /**
     * Convert millimeters to pixels
     */
    mmToPixels(mm, dpi) {
        return (mm / 25.4) * dpi;
    }

    /**
     * Validate background uniformity (simplified)
     */
    validateBackground() {
        // Simplified background validation
        // In production, implement proper background uniformity checking
        return true;
    }

    /**
     * Calculate image sharpness using Laplacian variance
     */
    calculateSharpness() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        let variance = 0;
        let mean = 0;
        let count = 0;

        // Convert to grayscale and calculate Laplacian
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                
                // Laplacian kernel
                const laplacian = Math.abs(
                    -4 * gray +
                    data[((y-1) * width + x) * 4] +
                    data[((y+1) * width + x) * 4] +
                    data[(y * width + (x-1)) * 4] +
                    data[(y * width + (x+1)) * 4]
                );
                
                mean += laplacian;
                count++;
            }
        }

        mean /= count;

        // Calculate variance
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                
                const laplacian = Math.abs(
                    -4 * gray +
                    data[((y-1) * width + x) * 4] +
                    data[((y+1) * width + x) * 4] +
                    data[(y * width + (x-1)) * 4] +
                    data[(y * width + (x+1)) * 4]
                );
                
                variance += Math.pow(laplacian - mean, 2);
            }
        }

        return variance / count;
    }

    /**
     * Auto-crop image according to preset specifications
     */
    cropImage(face, preset) {
        const targetWidth = preset.pixel_dimensions.width;
        const targetHeight = preset.pixel_dimensions.height;

        // Calculate required scaling
        const headHeightPixels = this.calculateHeadHeight(face);
        const targetHeadHeightMm = (preset.head_height_range_mm.min + preset.head_height_range_mm.max) / 2;
        const targetHeadHeightPixels = this.mmToPixels(targetHeadHeightMm, preset.dpi);
        
        const scale = targetHeadHeightPixels / headHeightPixels;

        // Calculate crop position
        const eyeY = (face.landmarks.leftEye.y + face.landmarks.rightEye.y) / 2;
        const faceCenter = {
            x: (face.landmarks.leftEye.x + face.landmarks.rightEye.x) / 2,
            y: eyeY
        };

        // Position eye line according to preset
        let targetEyeY;
        if (preset.eye_line_from_bottom_mm) {
            targetEyeY = targetHeight - this.mmToPixels(preset.eye_line_from_bottom_mm.target, preset.dpi);
        } else if (preset.eye_line_from_top_mm) {
            targetEyeY = this.mmToPixels(preset.eye_line_from_top_mm.target, preset.dpi);
        } else {
            targetEyeY = targetHeight * 0.35; // Default eye position
        }

        // Calculate crop rectangle
        const cropX = faceCenter.x * scale - targetWidth / 2;
        const cropY = eyeY * scale - targetEyeY;

        // Create output canvas
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = targetWidth;
        outputCanvas.height = targetHeight;
        const outputCtx = outputCanvas.getContext('2d');

        // Draw scaled and positioned image
        outputCtx.drawImage(
            this.currentImage,
            -cropX / scale, -cropY / scale,
            targetWidth / scale, targetHeight / scale,
            0, 0,
            targetWidth, targetHeight
        );

        return outputCanvas;
    }

    /**
     * Export cropped image as blob
     */
    exportImage(canvas, preset) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', preset.file.quality / 100);
        });
    }

    /**
     * Get validation error messages
     */
    getValidationMessages(errors) {
        const messages = {
            'FACE_TOO_SMALL': 'Face is too small for the selected document type',
            'FACE_TOO_LARGE': 'Face is too large for the selected document type',
            'EYES_OUT_OF_RANGE': 'Eye position is outside acceptable range',
            'FRAME_TOO_TIGHT': 'Image frame is too tight, insufficient margins',
            'BACKGROUND_NONUNIFORM': 'Background is not uniform white/off-white',
            'POSE_INVALID': 'Head pose exceeds acceptable tolerance',
            'EXPRESSION_INVALID': 'Expression is not neutral or mouth is not closed',
            'SHARPNESS_LOW': 'Image is not sharp enough',
            'EXPOSURE_POOR': 'Image exposure is too bright or too dark'
        };

        return errors.map(error => messages[error] || error);
    }
}

// Export for use in other modules
window.PhotoProcessor = PhotoProcessor;

