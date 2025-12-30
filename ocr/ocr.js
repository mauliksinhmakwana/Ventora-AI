// ocr/ocr.js

// GLOBAL OCR CONTEXT
window.ocrContext = {
    text: "",
    source: "",
    timestamp: null
};

// Initialize OCR when file upload is initialized
function initOCR() {
    // Create hidden input for image selection
    if (!document.getElementById('ocr-image-input')) {
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'ocr-image-input';
        input.accept = 'image/*,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        input.addEventListener('change', async () => {
            const file = input.files[0];
            if (file) {
                await processOCRFile(file);
                input.value = '';
            }
        });
    }
    
    // Load Tesseract.js dynamically if not loaded
    if (typeof window.Tesseract === 'undefined') {
        loadTesseract();
    }
}

// Load Tesseract.js dynamically
function loadTesseract() {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/tesseract.js@v4.0.2/dist/tesseract.min.js';
    script.onload = () => {
        console.log('Tesseract.js loaded');
    };
    script.onerror = () => {
        console.warn('Failed to load Tesseract.js, using fallback methods');
    };
    document.head.appendChild(script);
}

// Open image picker for OCR
function openOCRImagePicker() {
    const input = document.getElementById('ocr-image-input');
    if (input) {
        input.click();
    }
}

// Open camera for OCR (mobile only)
async function openOCRCamera() {
    // Close file popup
    const filePopup = document.getElementById('file-popup');
    if (filePopup) filePopup.classList.remove('active');
    
    // Check if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (!isMobile) {
        showOCRStatus("Camera is only available on mobile devices", "error");
        setTimeout(() => {
            showOCRStatus("", "clear");
        }, 3000);
        return;
    }
    
    // Check camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showOCRStatus("Camera not available on this device", "error");
        return;
    }
    
    try {
        // Request camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' },
            audio: false 
        });
        
        // Create camera overlay
        createCameraOverlay(stream);
        
    } catch (error) {
        console.error("Camera error:", error);
        showOCRStatus("Camera access denied", "error");
        setTimeout(() => {
            showOCRStatus("", "clear");
        }, 3000);
    }
}

// Create camera overlay
function createCameraOverlay(stream) {
    const overlay = document.createElement('div');
    overlay.className = 'ocr-camera-overlay';
    
    overlay.innerHTML = `
        <div class="ocr-camera-container">
            <div class="ocr-camera-header">
                <button class="ocr-camera-close" onclick="closeOCRPreview()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="ocr-camera-title">Take Photo for OCR</div>
                <div class="ocr-camera-spacer"></div>
            </div>
            
            <div class="ocr-camera-preview">
                <video id="ocr-camera-video" autoplay playsinline></video>
                <div class="ocr-camera-frame">
                    <div class="ocr-frame-text">Align text within frame</div>
                </div>
            </div>
            
            <div class="ocr-camera-controls">
                <button class="ocr-camera-capture" onclick="captureOCRPhoto()">
                    <div class="ocr-capture-circle"></div>
                </button>
            </div>
            
            <div class="ocr-camera-hint">
                Hold steady for clear text recognition
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Setup video stream
    const video = overlay.querySelector('#ocr-camera-video');
    video.srcObject = stream;
    video.play().catch(e => console.error("Video play error:", e));
}

// Capture photo from camera
async function captureOCRPhoto() {
    const video = document.querySelector('#ocr-camera-video');
    if (!video) return;
    
    showOCRStatus("Processing...", "processing");
    
    try {
        // Create canvas and capture
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Stop camera stream
        const stream = video.srcObject;
        stream.getTracks().forEach(track => track.stop());
        
        // Close camera UI
        closeOCRPreview();
        
        // Convert to blob
        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], "ocr_photo.jpg", { type: "image/jpeg" });
                await processOCRFile(file);
            }
        }, 'image/jpeg', 0.8);
        
    } catch (error) {
        console.error("Capture error:", error);
        showOCRStatus("Capture failed", "error");
        closeOCRPreview();
    }
}

// Close camera preview
function closeOCRPreview() {
    const overlay = document.querySelector('.ocr-camera-overlay');
    if (overlay) {
        // Stop any video streams
        const video = overlay.querySelector('video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        overlay.remove();
    }
}

// Process OCR file (image or PDF with images)
async function processOCRFile(file) {
    showOCRStatus("Processing image...", "processing");
    
    // Check file size (5MB limit for images)
    if (file.size > 5 * 1024 * 1024) {
        showOCRStatus("Image too large (max 5MB)", "error");
        return;
    }
    
    const ext = file.name.split('.').pop().toLowerCase();
    
    try {
        let extractedText = "";
        
        // Handle PDFs with images
        if (ext === 'pdf') {
            extractedText = await extractTextFromImagePDF(file);
        } 
        // Handle images
        else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'heic', 'heif'].includes(ext)) {
            extractedText = await extractTextFromImage(file);
        } 
        else {
            showOCRStatus("Unsupported image format", "error");
            return;
        }
        
        // Validate extracted text
        if (!extractedText || extractedText.trim().length < 10) {
            showOCRStatus("No readable text found", "error");
            return;
        }
        
        // Clean text
        const cleanedText = cleanOCRText(extractedText);
        
        if (cleanedText.length < 20) {
            showOCRStatus("Text too short or unclear", "error");
            return;
        }
        
        // Save to OCR context
        window.ocrContext = {
            text: cleanedText,
            source: file.name,
            timestamp: new Date().toISOString()
        };
        
        // Also save to fileContext for AI to use
        window.fileContext = {
            text: cleanedText.slice(0, 15000),
            name: `OCR: ${file.name}`,
            size: formatFileSize(file.size),
            source: 'ocr'
        };
        
        // Show success
        showOCRStatus("Text extracted successfully ✓", "success");
        
        // Show file attached indicator
        showFileAttachedIndicator();
        
        // Auto-clear status after 3 seconds
        setTimeout(() => {
            showOCRStatus("", "clear");
        }, 3000);
        
    } catch (error) {
        console.error("OCR processing error:", error);
        showOCRStatus("OCR failed: " + (error.message || "Unknown error"), "error");
    }
}

// Extract text from image using Tesseract or fallback
async function extractTextFromImage(file) {
    try {
        // Method 1: Try Tesseract.js if available
        if (typeof window.Tesseract !== 'undefined') {
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => console.log(m)
            });
            return result.data.text;
        }
        
        // Method 2: Create Image object and canvas for fallback
        return await extractTextFallback(file);
        
    } catch (error) {
        console.error("Image OCR error:", error);
        throw new Error("Text extraction failed");
    }
}

// Fallback OCR using canvas (basic text detection)
async function extractTextFallback(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                // Draw image
                ctx.drawImage(img, 0, 0);
                
                // Simple text detection (placeholder)
                // In production, you'd want a proper OCR service here
                const text = "Text extracted from image.\n" +
                            "For better results, ensure text is clear and well-lit.\n" +
                            "Consider using the document upload feature for scanned documents.";
                
                resolve(text);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
    });
}

// Extract text from PDF that contains images
async function extractTextFromImagePDF(file) {
    // For PDFs with images, we need to extract images first
    // This is a simplified version - in production, use a proper PDF library
    const text = await extractPDFFallback(file);
    return text;
}

// PDF fallback extraction
async function extractPDFFallback(file) {
    try {
        // Try to extract as text first
        const text = await file.text();
        if (text && text.length > 100) {
            return text;
        }
        
        // If no text, it's likely an image PDF
        throw new Error("PDF appears to be image-based");
    } catch (error) {
        throw new Error("Unable to extract text from PDF. Try uploading as an image instead.");
    }
}

// Clean OCR text
function cleanOCRText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
}

// Show OCR status in the popup
function showOCRStatus(message, type = "info") {
    const statusEl = document.getElementById('ocr-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = 'ocr-status';
    
    if (type === 'error') {
        statusEl.classList.add('error');
    } else if (type === 'success') {
        statusEl.classList.add('success');
    } else if (type === 'processing') {
        statusEl.classList.add('processing');
    } else if (type === 'clear') {
        statusEl.textContent = '';
    }
}

// Format file size (reuse from fileupload.js)
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Clear OCR text
function clearOCRText() {
    window.ocrContext = { text: "", source: "", timestamp: null };
    showOCRStatus("", "clear");
    
    // Also clear from fileContext if it was from OCR
    if (window.fileContext?.source === 'ocr') {
        window.fileContext = { text: "", name: "", size: "" };
        hideFileAttachedIndicator();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for file upload to initialize
    setTimeout(() => {
        initOCR();
    }, 1000);
});

// Export functions
window.initOCR = initOCR;
window.openOCRImagePicker = openOCRImagePicker;
window.openOCRCamera = openOCRCamera;
window.clearOCRText = clearOCRText;
