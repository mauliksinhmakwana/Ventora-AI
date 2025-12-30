// File Upload and OCR Management
let fileContext = {
    files: [],
    text: '',
    name: ''
};

// Initialize file context
function initFileContext() {
    const saved = localStorage.getItem('ventora_file_context');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            fileContext = parsed;
            updateFilesList();
        } catch (e) {
            console.error('Error loading file context:', e);
        }
    }
    window.fileContext = fileContext;
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

// Take photo
function takePhoto() {
    document.getElementById('ocr-input').click();
}

// Handle file selection
document.getElementById('file-input').addEventListener('change', function(e) {
    if (this.files.length > 0) {
        handleFiles(this.files);
        this.value = '';
    }
});

// Handle camera input
document.getElementById('ocr-input').addEventListener('change', function(e) {
    if (this.files.length > 0) {
        const files = Array.from(this.files);
        files.forEach(file => {
            // Rename camera photos
            if (file.type.startsWith('image/')) {
                const newFile = new File([file], `scan_${Date.now()}.jpg`, {
                    type: file.type,
                    lastModified: file.lastModified
                });
                handleFiles([newFile]);
            } else {
                handleFiles([file]);
            }
        });
        this.value = '';
    }
});

// Handle files
function handleFiles(fileList) {
    const files = Array.from(fileList);
    
    // Check max limit (5 files)
    if (fileContext.files.length + files.length > 5) {
        showPopupStatus('Max 5 files allowed', 'error');
        return;
    }
    
    showPopupStatus('Processing...', 'info');
    
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
        file: file,
        isCameraImage: file.name.includes('scan_')
    };
    
    fileContext.files.push(fileObj);
    saveFileContext();
    
    // Process file
    processFile(fileObj);
}

async function processFile(fileObj) {
    const index = fileContext.files.findIndex(f => f.id === fileObj.id);
    if (index === -1) return;
    
    try {
        // Check file size
        if (fileObj.size > 10 * 1024 * 1024) {
            throw new Error('File too large (10MB max)');
        }
        
        let extractedText = '';
        
        if (fileObj.type.startsWith('image/')) {
            // OCR for images
            extractedText = await extractTextFromImage(fileObj.file);
        } else if (fileObj.type === 'application/pdf') {
            // PDF text
            extractedText = await extractTextFromPDF(fileObj.file);
        } else if (fileObj.type.includes('text') || fileObj.name.match(/\.(txt|md|html|rtf|csv)$/i)) {
            // Text files
            extractedText = await extractTextFromTextFile(fileObj.file);
        } else {
            throw new Error('File type not supported');
        }
        
        if (!extractedText || extractedText.trim().length < 10) {
            throw new Error('No text found');
        }
        
        // Success
        fileContext.files[index].status = 'success';
        fileContext.files[index].text = extractedText.trim();
        fileContext.files[index].error = null;
        
        showPopupStatus(`${fileObj.name}: OK`, 'success');
        
    } catch (error) {
        fileContext.files[index].status = 'error';
        fileContext.files[index].error = error.message;
        fileContext.files[index].text = '';
        
        showPopupStatus(`${fileObj.name}: ${error.message}`, 'error');
    }
    
    saveFileContext();
    updateFilesList();
}

// OCR Function
async function extractTextFromImage(file) {
    try {
        const { createWorker } = Tesseract;
        const worker = await createWorker('eng');
        const result = await worker.recognize(file);
        await worker.terminate();
        return result.data.text;
    } catch (error) {
        throw new Error('OCR failed');
    }
}

// PDF text extraction
async function extractTextFromPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                const text = content
                    .replace(/[^\x20-\x7E\n\r]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                if (text.length > 10) {
                    resolve(text.substring(0, 5000));
                } else {
                    reject(new Error('No text in PDF'));
                }
            } catch (err) {
                reject(new Error('PDF read error'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read PDF'));
        reader.readAsBinaryString(file);
    });
}

// Text file extraction
async function extractTextFromTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Update files list
function updateFilesList() {
    const filesList = document.getElementById('files-list');
    const popupActions = document.getElementById('popup-actions');
    
    if (!filesList) return;
    
    filesList.innerHTML = '';
    
    if (fileContext.files.length === 0) {
        filesList.innerHTML = `
            <div class="mini-empty-state">
                <i class="fas fa-file"></i>
                <span>No files attached</span>
            </div>
        `;
        popupActions.style.display = 'none';
        return;
    }
    
    popupActions.style.display = 'flex';
    
    fileContext.files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = `mini-file-item ${file.status === 'error' ? 'error' : ''}`;
        
        const fileIcon = getFileIcon(file);
        
        fileItem.innerHTML = `
            <div class="mini-file-info">
                <div class="mini-file-icon">
                    ${fileIcon}
                </div>
                <div class="mini-file-details">
                    <div class="mini-file-name" title="${file.name}">${file.name}</div>
                    <div class="mini-file-status">
                        ${getFileStatusHTML(file)}
                    </div>
                </div>
            </div>
            <button class="mini-remove-file" onclick="removeFile('${file.id}')" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        filesList.appendChild(fileItem);
    });
}

function getFileIcon(file) {
    if (file.isCameraImage) return '<i class="fas fa-camera"></i>';
    if (file.type.startsWith('image/')) return '<i class="fas fa-image"></i>';
    if (file.type.includes('pdf')) return '<i class="fas fa-file-pdf"></i>';
    if (file.type.includes('word')) return '<i class="fas fa-file-word"></i>';
    if (file.type.includes('text')) return '<i class="fas fa-file-alt"></i>';
    return '<i class="fas fa-file"></i>';
}

function getFileStatusHTML(file) {
    if (file.status === 'processing') {
        return '<span class="mini-status-processing"><span class="mini-spinner"></span> Processing</span>';
    } else if (file.status === 'success') {
        const textLength = file.text ? file.text.length : 0;
        return `<span class="mini-status-success"><i class="fas fa-check-circle"></i> ${textLength} chars</span>`;
    } else if (file.status === 'error') {
        return `<span class="mini-status-error"><i class="fas fa-exclamation-circle"></i> Error</span>`;
    }
    return '<span>Pending</span>';
}

function showPopupStatus(message, type = 'info') {
    const statusEl = document.getElementById('popup-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = 'mini-popup-status';
    if (type === 'error') statusEl.classList.add('error');
    if (type === 'success') statusEl.classList.add('success');
    
    if (type !== 'info') {
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'mini-popup-status';
        }, 2000);
    }
}

function removeFile(fileId) {
    fileContext.files = fileContext.files.filter(f => f.id !== fileId);
    saveFileContext();
    updateFilesList();
    showPopupStatus('Removed', 'success');
}

function clearAllFiles() {
    if (fileContext.files.length === 0) return;
    
    if (confirm('Remove all files?')) {
        fileContext.files = [];
        saveFileContext();
        updateFilesList();
        showPopupStatus('Cleared', 'success');
    }
}

function attachFiles() {
    const successfulFiles = fileContext.files.filter(f => f.status === 'success' && f.text);
    
    if (successfulFiles.length === 0) {
        showPopupStatus('No text to attach', 'error');
        return;
    }
    
    // Format text for AI
    const combinedText = successfulFiles.map(f => 
        `[File: ${f.name}]\n${f.text}\n`
    ).join('\n');
    
    fileContext.text = combinedText;
    fileContext.name = `${successfulFiles.length} file(s)`;
    
    saveFileContext();
    closeFilePopup();
    showToast('Files attached', 'success');
}

function saveFileContext() {
    try {
        const serializableFiles = fileContext.files.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type,
            size: f.size,
            status: f.status,
            error: f.error,
            text: f.text,
            isCameraImage: f.isCameraImage
        }));
        
        localStorage.setItem('ventora_file_context', JSON.stringify({
            files: serializableFiles,
            text: fileContext.text,
            name: fileContext.name
        }));
    } catch (e) {
        console.error('Error saving:', e);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', initFileContext);
