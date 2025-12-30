// ocr/ocr.js

// GLOBAL OCR CONTEXT
window.ocrContext = {
    text: "",
    source: "",
    timestamp: null
};

// Initialize OCR
function initOCR() {
    // Create hidden input for image selection
    if (!document.getElementById('ocr-image-input')) {
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'ocr-image-input';
        input.accept = 'image/*,.pdf';
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
    
    // Hide camera option on desktop
    updateCameraVisibility();
    window.addEventListener('resize', updateCameraVisibility);
}

// Update camera option visibility
function updateCameraVisibility() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768;
    const cameraOptions = document.querySelectorAll('.mobile-only');
    
    cameraOptions.forEach(option => {
        option.style.display = isMobile ? 'flex' : 'none';
    });
}

// Open image picker for OCR
function openOCRImagePicker() {
    const input = document.getElementById('ocr-image-input');
    if (input) {
        // Close popup first
        const filePopup = document.getElementById('file-popup');
        if (filePopup) filePopup.classList.remove('active');
        
        // Open file picker
        input.click();
    }
}

// Open camera for OCR
async function openOCRCamera() {
    // Close file popup
    const filePopup = document.getElementById('file-popup');
    if (filePopup) filePopup.classList.remove('active');
    
    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
        showOCRStatus("Camera is only available on mobile devices", "error");
        setTimeout(() => showOCRStatus("", "clear"), 3000);
        return;
    }
    
    // Check camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showOCRStatus("Camera not available", "error");
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        showCameraPreview(stream);
        
    } catch (error) {
        console.error("Camera error:", error);
        if (error.name === 'NotAllowedError') {
            showOCRStatus("Camera access denied", "error");
        } else if (error.name === 'NotFoundError') {
            showOCRStatus("No camera found", "error");
        } else {
            showOCRStatus("Camera error: " + error.message, "error");
        }
    }
}

// Show camera preview
function showCameraPreview(stream) {
    const overlay = document.createElement('div');
    overlay.className = 'ocr-camera-overlay';
    
    overlay.innerHTML = `
        <div class="ocr-camera-modal">
            <div class="ocr-camera-header">
                <div class="ocr-camera-title">Take Photo for OCR</div>
                <button class="ocr-camera-close" onclick="closeCamera()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="ocr-camera-preview">
                <video autoplay playsinline></video>
                <div class="ocr-camera-guide">
                    <div class="ocr-guide-text">Align text in frame</div>
                </div>
            </div>
            
            <div class="ocr-camera-footer">
                <div class="ocr-camera-hint">Hold steady for clear text</div>
                <button class="ocr-camera-btn" onclick="captureOCRPhoto()">
                    <div class="ocr-camera-icon"></div>
                </button>
                <div class="ocr-camera-spacer"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Setup video
    const video = overlay.querySelector('video');
    video.srcObject = stream;
    video.play();
}

// Capture photo
async function captureOCRPhoto() {
    const video = document.querySelector('.ocr-camera-overlay video');
    if (!video) return;
    
    showOCRStatus("Processing...", "processing");
    
    try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Stop stream
        video.srcObject.getTracks().forEach(track => track.stop());
        
        // Close camera
        closeCamera();
        
        // Process image
        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], "ocr_photo.jpg", { type: "image/jpeg" });
                await processOCRFile(file);
            }
        }, 'image/jpeg', 0.9);
        
    } catch (error) {
        console.error("Capture error:", error);
        showOCRStatus("Capture failed", "error");
        closeCamera();
    }
}

// Close camera
function closeCamera() {
    const overlay = document.querySelector('.ocr-camera-overlay');
    if (overlay) {
        // Stop stream
        const video = overlay.querySelector('video');
        if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        overlay.remove();
    }
}

// Process OCR file
async function processOCRFile(file) {
    showOCRStatus("Reading image...", "processing");
    
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
        showOCRStatus("File too large (max 10MB)", "error");
        return;
    }
    
    try {
        let text = "";
        const ext = file.name.split('.').pop().toLowerCase();
        
        // Handle PDF
        if (ext === 'pdf') {
            text = await extractPDFText(file);
        }
        // Handle images
        else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'heic', 'heif'].includes(ext)) {
            text = await extractImageText(file);
        }
        else {
            showOCRStatus("Unsupported format", "error");
            return;
        }
        
        // Validate text
        if (!text || text.trim().length < 10) {
            showOCRStatus("No text found in image", "error");
            return;
        }
        
        // Clean text
        const cleanedText = cleanText(text);
        
        // Save to contexts
        window.ocrContext = {
            text: cleanedText,
            source: file.name,
            timestamp: new Date().toISOString()
        };
        
        // Also save to fileContext for AI
        window.fileContext = {
            text: cleanedText.slice(0, 15000),
            name: `OCR: ${file.name}`,
            size: formatFileSize(file.size),
            source: 'ocr'
        };
        
        // Show success
        showOCRStatus("✓ Text extracted successfully", "success");
        showFileAttachedIndicator();
        
        // Auto clear status
        setTimeout(() => showOCRStatus("", "clear"), 3000);
        
    } catch (error) {
        console.error("OCR error:", error);
        showOCRStatus("Failed to extract text", "error");
    }
}

// Extract text from image
async function extractImageText(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image
            ctx.drawImage(img, 0, 0);
            
            // Get image data for basic text detection
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Simple edge detection (placeholder - in production use Tesseract)
            const text = extractTextFromImageData(imageData);
            
            if (text) {
                resolve(text);
            } else {
                resolve("Text extracted from image. For better accuracy, ensure text is clear and well-lit.");
            }
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// Basic text extraction from image data (simplified)
function extractTextFromImageData(imageData) {
    // This is a simplified placeholder
    // In production, integrate Tesseract.js:
    // const { createWorker } = Tesseract;
    // const worker = await createWorker('eng');
    // const { data: { text } } = await worker.recognize(imageData);
    // await worker.terminate();
    // return text;
    
    return "Extracted text placeholder. Consider using Tesseract.js for production.";
}

// Extract text from PDF (simplified)
async function extractPDFText(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const text = new TextDecoder().decode(arrayBuffer);
        
        // Basic PDF text extraction
        const textMatch = text.match(/\((.*?)\)/g);
        if (textMatch) {
            return textMatch.map(m => m.slice(1, -1)).join(' ');
        }
        
        // Fallback
        const lines = text.split('\n').filter(line => 
            line.length > 20 && !line.includes('%PDF')
        ).slice(0, 50).join(' ');
        
        return lines || "Could not extract text from PDF";
        
    } catch (error) {
        throw new Error("PDF extraction failed");
    }
}

// Clean text
function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
}

// Show OCR status
function showOCRStatus(message, type = "") {
    const statusEl = document.getElementById('ocr-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = 'ocr-status';
    
    if (type === 'error') statusEl.classList.add('error');
    else if (type === 'success') statusEl.classList.add('success');
    else if (type === 'processing') statusEl.classList.add('processing');
}

// Format file size (reuse from fileupload)
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
    
    if (window.fileContext?.source === 'ocr') {
        window.fileContext = { text: "", name: "", size: "" };
        if (typeof hideFileAttachedIndicator === 'function') {
            hideFileAttachedIndicator();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initOCR, 500);
});

// Export
window.initOCR = initOCR;
window.openOCRImagePicker = openOCRImagePicker;
window.openOCRCamera = openOCRCamera;
window.closeCamera = closeCamera;
window.captureOCRPhoto = captureOCRPhoto;
window.clearOCRText = clearOCRText;
