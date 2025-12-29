// fileupload/fileupload.js

// GLOBAL FILE CONTEXT
window.fileContext = {
    text: "",
    name: "",
    size: ""
};

// Initialize file upload
function initFileUpload() {
    const fileBtn = document.getElementById("file-btn");
    const filePopup = document.getElementById("file-popup");
    const fileInput = document.getElementById("file-input");
    const fileStatus = document.getElementById("file-status");
    const fileClearSection = document.getElementById("file-clear-section");
    
    if (!fileBtn || !filePopup) {
        console.error("File upload elements not found!");
        return;
    }
    
    // Toggle popup on button click
    fileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        filePopup.classList.toggle("active");
    });
    
    // Close popup when clicking outside
    document.addEventListener("click", (e) => {
        if (!filePopup.contains(e.target) && !fileBtn.contains(e.target)) {
            filePopup.classList.remove("active");
        }
    });
    
    // Handle file selection
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;
        
        // Call the new processing function
        await processSelectedFile(file);
    });
    
    // Close popup with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && filePopup.classList.contains("active")) {
            filePopup.classList.remove("active");
        }
    });
}

// Process file with OCR support
async function processSelectedFile(file) {
    const fileStatus = document.getElementById('file-status');
    
    // Show processing status
    fileStatus.innerHTML = `
        <div style="color: var(--accent-blue);">
            <i class="fas fa-spinner fa-spin"></i>
            Processing ${file.name}...
        </div>
    `;
    
    // Clear previous file context
    if (window.fileContext && window.fileContext.text) {
        clearAttachedFile();
    }
    
    try {
        // Check if it's an image or PDF for OCR
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
            
            // Load OCR module if not loaded
            if (typeof processFileWithOCR === 'undefined') {
                console.error('OCR module not loaded');
                // Fallback to basic file processing
                return await processFileBasic(file);
            }
            
            // Process with OCR
            const ocrResult = await processFileWithOCR(file);
            
            if (ocrResult.success) {
                // Store in file context
                window.fileContext = {
                    name: file.name,
                    text: ocrResult.text,
                    type: file.type.startsWith('image/') ? 'image' : 'pdf',
                    ocrExtracted: true,
                    size: formatFileSize(file.size)
                };
                
                // Show success with OCR option
                fileStatus.innerHTML = `
                    <div style="color: #2ed573;">
                        <i class="fas fa-check-circle"></i>
                        ${file.name} processed
                    </div>
                    <div style="margin-top: 8px;">
                        <button onclick="sendOCRTextToAI()" style="
                            background: var(--accent-blue);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            padding: 8px 12px;
                            font-size: 0.75rem;
                            cursor: pointer;
                            width: 100%;
                        ">
                            <i class="fas fa-robot"></i> Send to AI for analysis
                        </button>
                    </div>
                `;
                
            } else {
                throw new Error(ocrResult.error || 'OCR failed');
            }
            
        } else {
            // For text files, use basic processing
            return await processFileBasic(file);
        }
        
        // Show clear button
        const fileClearSection = document.getElementById('file-clear-section');
        if (fileClearSection) fileClearSection.style.display = 'block';
        
        // Show attached indicator
        showFileAttachedIndicator();
        
        // Auto-close popup after 2 seconds
        setTimeout(() => {
            const filePopup = document.getElementById('file-popup');
            if (filePopup) filePopup.classList.remove('active');
        }, 2000);
        
    } catch (error) {
        console.error('File processing error:', error);
        const fileStatus = document.getElementById('file-status');
        fileStatus.innerHTML = `
            <div style="color: #ff4757;">
                <i class="fas fa-exclamation-circle"></i>
                Error: ${error.message}
            </div>
        `;
        
        // Clear file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
    }
}

// Basic file processing (for non-image/PDF files)
async function processFileBasic(file) {
    const fileStatus = document.getElementById('file-status');
    const fileClearSection = document.getElementById('file-clear-section');
    const ext = file.name.split('.').pop().toLowerCase();
    
    try {
        let text = '';
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            throw "File too large (max 10MB)";
        }
        
        // Extract text based on file type
        if (["txt", "md", "html", "htm", "csv", "rtf"].includes(ext)) {
            text = await file.text();
        } 
        else if (ext === "pdf") {
            // Use basic PDF extraction
            text = await extractPdfTextBasic(file);
        } 
        else if (ext === "docx" || ext === "doc") {
            text = await extractDocxText(file);
        }
        else {
            throw "Unsupported file format";
        }
        
        // Validate extracted text
        if (!text || text.trim().length < 10) {
            throw "No readable text found";
        }
        
        // Clean and limit text
        const cleanedText = text
            .replace(/\s+/g, ' ')
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .trim();
        
        if (cleanedText.length < 20) {
            throw "No readable text found";
        }
        
        // Save file context
        window.fileContext = {
            text: cleanedText.slice(0, 15000), // limit to 15k chars
            name: file.name,
            size: formatFileSize(file.size),
            type: 'text'
        };
        
        // Update UI
        fileStatus.innerHTML = `
            <div style="color: #2ed573;">
                <i class="fas fa-check-circle"></i>
                ${file.name} attached
            </div>
        `;
        
        if (fileClearSection) fileClearSection.style.display = 'block';
        
        // Show attached indicator
        showFileAttachedIndicator();
        
        // Auto-close popup after 2 seconds
        setTimeout(() => {
            const filePopup = document.getElementById('file-popup');
            if (filePopup) filePopup.classList.remove('active');
        }, 2000);
        
        return { success: true };
        
    } catch (err) {
        console.error("File error:", err);
        throw err;
    }
}

// Basic PDF extraction
async function extractPdfTextBasic(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        
        // Look for text in PDF
        const textMatches = text.match(/\((.*?)\)/g);
        if (textMatches) {
            const extracted = textMatches.map(match => 
                match.slice(1, -1).replace(/\\(.)/g, '$1')
            ).join(' ');
            if (extracted.trim().length > 50) return extracted;
        }
        
        // Alternative extraction
        const lines = text.split('\n');
        const readableLines = lines.filter(line => 
            line.trim().length > 10 && 
            !line.includes('%PDF') && 
            !line.includes('stream')
        );
        
        if (readableLines.length > 0) {
            return readableLines.slice(0, 100).join(' ');
        }
        
        throw "Could not extract text from PDF";
        
    } catch (error) {
        console.error("PDF extraction error:", error);
        throw "PDF text extraction failed. Ensure PDF has selectable text.";
    }
}

// Extract text from DOCX
async function extractDocxText(file) {
    try {
        const text = await file.text();
        
        // Look for readable content
        const lines = text.split('\n').filter(line => 
            line.trim().length > 0 && 
            line.length > 10 &&
            !line.includes('PK') &&
            !line.includes('<?xml')
        );
        
        if (lines.length > 0) {
            return lines.slice(0, 100).join(' ');
        }
        
        // Fallback
        const asciiText = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        const cleanAscii = asciiText.replace(/\s+/g, ' ').trim();
        
        if (cleanAscii.length > 100) {
            return cleanAscii.substring(0, 5000);
        }
        
        throw "Could not read DOCX file";
        
    } catch (error) {
        console.error("DOCX extraction error:", error);
        throw "Could not read DOCX file";
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show file attached indicator
function showFileAttachedIndicator() {
    const fileBtn = document.getElementById("file-btn");
    if (!fileBtn) return;
    
    // Remove existing indicator
    const existingIndicator = fileBtn.querySelector(".file-attached-indicator");
    if (existingIndicator) existingIndicator.remove();
    
    // Add new indicator
    const indicator = document.createElement("div");
    indicator.className = "file-attached-indicator";
    indicator.title = "File attached";
    fileBtn.appendChild(indicator);
    
    // Update button appearance
    fileBtn.classList.add("active");
}

// Hide file attached indicator
function hideFileAttachedIndicator() {
    const fileBtn = document.getElementById("file-btn");
    if (!fileBtn) return;
    
    const indicator = fileBtn.querySelector(".file-attached-indicator");
    if (indicator) indicator.remove();
    
    // Reset button appearance
    fileBtn.classList.remove("active");
}

// Clear attached file
function clearAttachedFile() {
    window.fileContext = { text: "", name: "", size: "" };
    hideFileAttachedIndicator();
    
    // Clear file input
    const fileInput = document.getElementById("file-input");
    if (fileInput) fileInput.value = "";
    
    // Hide clear section
    const fileClearSection = document.getElementById("file-clear-section");
    if (fileClearSection) fileClearSection.style.display = "none";
    
    // Clear status
    const fileStatus = document.getElementById("file-status");
    if (fileStatus) {
        fileStatus.textContent = "";
        fileStatus.className = "file-status";
    }
    
    // Show toast
    if (typeof showToast === "function") {
        showToast("File removed", "info");
    }
}

// Trigger file picker
function pickFile() {
    document.getElementById("file-input").click();
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(initFileUpload, 500);
});

// Export functions
window.initFileUpload = initFileUpload;
window.pickFile = pickFile;
window.clearAttachedFile = clearAttachedFile;
window.processSelectedFile = processSelectedFile;
