// File Upload and OCR Management
let fileContext = {
    files: [],
    text: '',
    name: ''
};

// Initialize file context from localStorage
function initFileContext() {
    const saved = localStorage.getItem('ventora_file_context');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            fileContext = parsed;
            updateFileContextDisplay();
        } catch (e) {
            console.error('Error loading file context:', e);
        }
    }
    window.fileContext = fileContext;
}

// Check if mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Toggle file popup
function toggleFilePopup(event) {
    event.stopPropagation();
    const popup = document.getElementById('file-popup');
    const isOpen = popup.style.display === 'block';
    
    if (isOpen) {
        closeFilePopup();
    } else {
        openFilePopup();
    }
}

function openFilePopup() {
    const popup = document.getElementById('file-popup');
    popup.style.display = 'block';
    
    // Show mobile camera button if on mobile
    const mobileCameraBtn = document.getElementById('mobile-camera-btn');
    if (isMobileDevice()) {
        mobileCameraBtn.style.display = 'block';
    }
    
    // Add click outside listener
    setTimeout(() => {
        document.addEventListener('click', closeFilePopupOnOutsideClick);
    }, 10);
    
    updateFilesList();
}

function closeFilePopup() {
    const popup = document.getElementById('file-popup');
    popup.style.display = 'none';
    document.removeEventListener('click', closeFilePopupOnOutsideClick);
}

function closeFilePopupOnOutsideClick(event) {
    const popup = document.getElementById('file-popup');
    const fileBtn = document.getElementById('file-btn');
    
    if (popup && !popup.contains(event.target) && !fileBtn.contains(event.target)) {
        closeFilePopup();
    }
}

// Open file picker
function openFilePicker() {
    document.getElementById('file-input').click();
}

// Take photo on mobile
function takePhoto() {
    if (!isMobileDevice()) {
        showPopupStatus('Camera is only available on mobile devices.', 'error');
        return;
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to file input with camera capture
        document.getElementById('camera-input').click();
        return;
    }
    
    // Request camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            // Create camera preview modal
            showCameraPreview(stream);
        })
        .catch(err => {
            console.error('Camera error:', err);
            showPopupStatus('Cannot access camera. Please check permissions.', 'error');
        });
}

function showCameraPreview(stream) {
    // Create camera preview modal
    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10001;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `;
    
    const video = document.createElement('video');
    video.style.cssText = `
        width: 100%;
        max-width: 500px;
        max-height: 70vh;
        object-fit: contain;
    `;
    video.autoplay = true;
    video.srcObject = stream;
    
    const controls = document.createElement('div');
    controls.style.cssText = `
        margin-top: 20px;
        display: flex;
        gap: 20px;
    `;
    
    const captureBtn = document.createElement('button');
    captureBtn.innerHTML = '<i class="fas fa-camera"></i> Capture';
    captureBtn.style.cssText = `
        padding: 12px 24px;
        background: var(--accent-blue);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        cursor: pointer;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
    cancelBtn.style.cssText = `
        padding: 12px 24px;
        background: rgba(255,255,255,0.1);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        cursor: pointer;
    `;
    
    captureBtn.onclick = () => {
        // Create canvas and capture image
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        // Convert to blob
        canvas.toBlob(blob => {
            // Stop camera stream
            stream.getTracks().forEach(track => track.stop());
            
            // Remove modal
            document.body.removeChild(modal);
            
            // Process the captured image
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            processFile(file);
            
        }, 'image/jpeg', 0.8);
    };
    
    cancelBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
    };
    
    controls.appendChild(captureBtn);
    controls.appendChild(cancelBtn);
    
    modal.appendChild(video);
    modal.appendChild(controls);
    document.body.appendChild(modal);
}

// Handle file selection
document.getElementById('file-input').addEventListener('change', function(e) {
    if (this.files.length > 0) {
        handleFiles(this.files);
        this.value = ''; // Reset input
    }
});

// Handle camera capture
document.getElementById('camera-input').addEventListener('change', function(e) {
    if (this.files.length > 0) {
        handleFiles(this.files);
        this.value = ''; // Reset input
    }
});

// Handle files
function handleFiles(fileList) {
    const files = Array.from(fileList);
    
    // Check max limit (5 files)
    if (fileContext.files.length + files.length > 5) {
        showPopupStatus('Maximum 5 files allowed. Remove some files first.', 'error');
        return;
    }
    
    // Process each file
    files.forEach(file => {
        addFileToContext(file);
    });
    
    updateFilesList();
}

function addFileToContext(file) {
    const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const fileObj = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'processing',
        error: null,
        text: '',
        file: file
    };
    
    fileContext.files.push(fileObj);
    saveFileContext();
    
    // Start processing
    processFile(fileObj);
}

async function processFile(fileObj) {
    const index = fileContext.files.findIndex(f => f.id === fileObj.id);
    if (index === -1) return;
    
    try {
        // Check file size (limit to 10MB)
        if (fileObj.size > 10 * 1024 * 1024) {
            throw new Error('File too large (max 10MB)');
        }
        
        // Extract text based on file type
        let extractedText = '';
        
        if (fileObj.type.startsWith('image/')) {
            // Image file - use OCR
            extractedText = await extractTextFromImage(fileObj.file);
        } else if (fileObj.type === 'application/pdf') {
            // PDF file
            extractedText = await extractTextFromPDF(fileObj.file);
        } else if (fileObj.type.includes('word') || 
                   fileObj.type.includes('excel') || 
                   fileObj.type.includes('powerpoint') ||
                   fileObj.type.includes('rtf') ||
                   fileObj.type.includes('text')) {
            // Text-based documents
            extractedText = await extractTextFromTextFile(fileObj.file);
        } else {
            throw new Error('Unsupported file type');
        }
        
        // Check if text was extracted
        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('No text could be extracted from this file');
        }
        
        // Update file object
        fileContext.files[index].status = 'success';
        fileContext.files[index].text = extractedText;
        fileContext.files[index].error = null;
        
    } catch (error) {
        console.error('Error processing file:', error);
        fileContext.files[index].status = 'error';
        fileContext.files[index].error = error.message;
        fileContext.files[index].text = '';
    }
    
    saveFileContext();
    updateFilesList();
    updateFileContextDisplay();
}

// Text extraction functions
async function extractTextFromImage(file) {
    // Load Tesseract.js dynamically
    const { createWorker } = await import('https://unpkg.com/tesseract.js@v4.0.0/dist/tesseract.min.js');
    
    const worker = await createWorker('eng');
    
    try {
        const result = await worker.recognize(file);
        await worker.terminate();
        
        return result.data.text;
    } catch (error) {
        await worker.terminate();
        throw new Error('OCR failed: ' + error.message);
    }
}

async function extractTextFromPDF(file) {
    // Simple PDF text extraction (for basic PDFs)
    // Note: For production, use a proper PDF library like pdf.js
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            // This is a basic implementation - actual PDF parsing requires pdf.js
            const content = e.target.result;
            // Try to extract any text-like content
            const textMatch = content.match(/\/FlateDecode.*?stream[\s\S]*?endstream/);
            if (textMatch) {
                // Very basic text extraction
                const text = textMatch[0]
                    .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable chars
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
                
                if (text.length > 10) {
                    resolve(text.substring(0, 5000)); // Limit text length
                } else {
                    reject(new Error('No readable text found in PDF'));
                }
            } else {
                reject(new Error('PDF text extraction not supported'));
            }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });
}

async function extractTextFromTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = reject;
        
        if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            reader.readAsText(file);
        } else {
            // For binary files, try as text anyway
            reader.readAsText(file);
        }
    });
}

// Update files list in popup
function updateFilesList() {
    const filesList = document.getElementById('files-list');
    const popupActions = document.getElementById('popup-actions');
    
    if (!filesList) return;
    
    filesList.innerHTML = '';
    
    if (fileContext.files.length === 0) {
        filesList.innerHTML = '<div class="empty-list">No files attached</div>';
        popupActions.style.display = 'none';
        return;
    }
    
    popupActions.style.display = 'flex';
    
    fileContext.files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = `file-item ${file.status === 'error' ? 'error' : ''}`;
        
        const fileIcon = getFileIcon(file.type);
        
        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    ${fileIcon}
                </div>
                <div class="file-details">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-status">
                        ${getFileStatusHTML(file)}
                    </div>
                </div>
            </div>
            <button class="remove-file" onclick="removeFile('${file.id}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        filesList.appendChild(fileItem);
    });
}

function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return '<i class="fas fa-image"></i>';
    if (fileType.includes('pdf')) return '<i class="fas fa-file-pdf"></i>';
    if (fileType.includes('word')) return '<i class="fas fa-file-word"></i>';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '<i class="fas fa-file-excel"></i>';
    if (fileType.includes('text') || fileType.includes('plain')) return '<i class="fas fa-file-alt"></i>';
    return '<i class="fas fa-file"></i>';
}

function getFileStatusHTML(file) {
    if (file.status === 'processing') {
        return '<span class="processing"><i class="fas fa-spinner fa-spin"></i> Processing...</span>';
    } else if (file.status === 'success') {
        const textLength = file.text.length;
        return `<span class="success"><i class="fas fa-check-circle"></i> ${textLength} chars extracted</span>`;
    } else if (file.status === 'error') {
        return `<span class="error"><i class="fas fa-exclamation-circle"></i> ${file.error}</span>`;
    }
    return '<span>Pending</span>';
}

function showPopupStatus(message, type = 'info') {
    const statusEl = document.getElementById('popup-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = 'popup-status';
    if (type) {
        statusEl.classList.add(type);
    }
    
    // Auto-clear after 5 seconds
    if (type !== 'processing') {
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'popup-status';
        }, 5000);
    }
}

function removeFile(fileId) {
    fileContext.files = fileContext.files.filter(f => f.id !== fileId);
    saveFileContext();
    updateFilesList();
    updateFileContextDisplay();
    
    if (fileContext.files.length === 0) {
        clearFileContext();
    }
}

function clearAllFiles() {
    if (confirm('Remove all attached files?')) {
        clearFileContext();
        updateFilesList();
        showPopupStatus('All files removed', 'success');
    }
}

function attachFiles() {
    // Combine all successful file texts
    const successfulFiles = fileContext.files.filter(f => f.status === 'success');
    
    if (successfulFiles.length === 0) {
        showPopupStatus('No files with extracted text to attach', 'error');
        return;
    }
    
    // Combine texts
    const combinedText = successfulFiles.map(f => 
        `=== ${f.name} ===\n${f.text}\n`
    ).join('\n');
    
    // Update global file context
    fileContext.text = combinedText;
    fileContext.name = `${successfulFiles.length} file(s) attached`;
    
    saveFileContext();
    updateFileContextDisplay();
    
    closeFilePopup();
    showToast('Files attached to chat', 'success');
}

function clearAttachedFile() {
    clearFileContext();
    showToast('Files detached from chat', 'info');
}

function clearFileContext() {
    fileContext = {
        files: [],
        text: '',
        name: ''
    };
    window.fileContext = fileContext;
    localStorage.removeItem('ventora_file_context');
    updateFileContextDisplay();
}

function updateFileContextDisplay() {
    // Update any UI that shows file status
    const fileStatus = document.getElementById('file-status');
    if (fileStatus) {
        if (fileContext.text) {
            fileStatus.textContent = `${fileContext.files.length} file(s) attached`;
            fileStatus.style.color = 'var(--accent-blue)';
        } else {
            fileStatus.textContent = 'No file attached';
            fileStatus.style.color = 'var(--text-secondary)';
        }
    }
    
    // Update file clear section visibility
    const clearSection = document.getElementById('file-clear-section');
    if (clearSection) {
        clearSection.style.display = fileContext.text ? 'block' : 'none';
    }
}

function saveFileContext() {
    try {
        // Don't save the File objects (they're not serializable)
        const serializableFiles = fileContext.files.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type,
            size: f.size,
            status: f.status,
            error: f.error,
            text: f.text
            // file: f.file // Don't save File object
        }));
        
        const toSave = {
            files: serializableFiles,
            text: fileContext.text,
            name: fileContext.name
        };
        
        localStorage.setItem('ventora_file_context', JSON.stringify(toSave));
    } catch (e) {
        console.error('Error saving file context:', e);
    }
}

function openGoogleDrive() {
    showPopupStatus('Google Drive integration coming soon', 'info');
    // For now, we'll just show a message
    // In production, you would implement OAuth and Google Drive API
}

// Export for use in main chat
window.fileContext = fileContext;
window.clearAttachedFile = clearAttachedFile;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initFileContext();
    
    // Clear file context when creating new chat
    const originalCreateNewConversation = window.createNewConversation;
    if (originalCreateNewConversation) {
        window.createNewConversation = function() {
            clearFileContext();
            return originalCreateNewConversation.apply(this, arguments);
        };
    }
});
