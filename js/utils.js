/**
 * Utility Functions - Common helper functions
 */

class Utils {
    /**
     * Format file size in human readable format
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate image file type
     */
    static isValidImageType(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type);
    }

    /**
     * Get image dimensions from file
     */
    static getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    aspectRatio: img.width / img.height
                });
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Download blob as file
     */
    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Convert canvas to blob
     */
    static canvasToBlob(canvas, type = 'image/jpeg', quality = 0.9) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, type, quality);
        });
    }

    /**
     * Resize image while maintaining aspect ratio
     */
    static resizeImage(img, maxWidth, maxHeight) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > height) {
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        return canvas;
    }

    /**
     * Create image from canvas
     */
    static canvasToImage(canvas) {
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    /**
     * Get dominant color from image
     */
    static getDominantColor(canvas, sampleSize = 10) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const colorCounts = {};
        
        // Sample pixels
        for (let i = 0; i < data.length; i += 4 * sampleSize) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            
            if (alpha > 128) { // Only count non-transparent pixels
                const color = `${r},${g},${b}`;
                colorCounts[color] = (colorCounts[color] || 0) + 1;
            }
        }
        
        // Find most common color
        let maxCount = 0;
        let dominantColor = '255,255,255';
        
        for (const color in colorCounts) {
            if (colorCounts[color] > maxCount) {
                maxCount = colorCounts[color];
                dominantColor = color;
            }
        }
        
        const [r, g, b] = dominantColor.split(',').map(Number);
        return { r, g, b };
    }

    /**
     * Check if color is close to white
     */
    static isWhiteish(color, threshold = 30) {
        const { r, g, b } = color;
        return r > 255 - threshold && g > 255 - threshold && b > 255 - threshold;
    }

    /**
     * Calculate color difference (Delta E)
     */
    static colorDifference(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * Debounce function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Generate unique ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Format date for filename
     */
    static formatDateForFilename(date = new Date()) {
        return date.toISOString().slice(0, 19).replace(/[:.]/g, '-');
    }

    /**
     * Create print sheet with multiple photos
     */
    static createPrintSheet(photoCanvas, preset, sheetSize = { width: 4, height: 6 }) {
        const dpi = preset.dpi;
        const sheetWidthPx = (sheetSize.width * dpi);
        const sheetHeightPx = (sheetSize.height * dpi);
        
        const canvas = document.createElement('canvas');
        canvas.width = sheetWidthPx;
        canvas.height = sheetHeightPx;
        const ctx = canvas.getContext('2d');
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, sheetWidthPx, sheetHeightPx);
        
        const photoWidth = preset.pixel_dimensions.width;
        const photoHeight = preset.pixel_dimensions.height;
        
        // Calculate how many photos fit
        const photosPerRow = Math.floor(sheetWidthPx / photoWidth);
        const photosPerCol = Math.floor(sheetHeightPx / photoHeight);
        
        // Center the photos on the sheet
        const startX = (sheetWidthPx - (photosPerRow * photoWidth)) / 2;
        const startY = (sheetHeightPx - (photosPerCol * photoHeight)) / 2;
        
        // Draw photos
        for (let row = 0; row < photosPerCol; row++) {
            for (let col = 0; col < photosPerRow; col++) {
                const x = startX + (col * photoWidth);
                const y = startY + (row * photoHeight);
                ctx.drawImage(photoCanvas, x, y);
            }
        }
        
        return canvas;
    }

    /**
     * Show notification
     */
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '6px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * Copy text to clipboard
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    }

    /**
     * Load image from URL
     */
    static loadImageFromUrl(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * Convert image to different format
     */
    static convertImageFormat(canvas, format = 'jpeg', quality = 0.9) {
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        return Utils.canvasToBlob(canvas, mimeType, quality);
    }
}

// Export for use in other modules
window.Utils = Utils;

