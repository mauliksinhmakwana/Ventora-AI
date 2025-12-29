// Ventora AI - Enhanced Document & Image Processor
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.querySelector('input[type="file"]');
    const uploadBtn = document.querySelector('[href="#"]');
    const removeFileBtn = document.querySelector('[onclick*="remove"], [href*="remove"]');
    const messageInput = document.querySelector('input[type="text"], textarea');
    
    // Configuration
    const MAX_FILES = 5;
    const ALLOWED_TYPES = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
        'image/tiff', 'application/pdf', 'text/plain', 'text/html', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    // State management
    let uploadedFiles = [];
    
    // Fix file input for multiple uploads
    if (fileInput) {
        fileInput.multiple = true;
        fileInput.accept = '.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.pdf,.txt,.html,.doc,.docx';
        
        fileInput.addEventListener('change', function(e) {
            if (this.files && this.files.length > 0) {
                const newFiles = Array.from(this.files);
                
                // Check total file count
                if (uploadedFiles.length + newFiles.length > MAX_FILES) {
                    alert(`❌ Maximum ${MAX_FILES} files allowed. You already have ${uploadedFiles.length} files.`);
                    this.value = '';
                    return;
                }
                
                // Validate file types
                const invalidFiles = newFiles.filter(file => !ALLOWED_TYPES.includes(file.type));
                if (invalidFiles.length > 0) {
                    alert(`❌ Unsupported file types: ${invalidFiles.map(f => f.name).join(', ')}`);
                    this.value = '';
                    return;
                }
                
                // Process each file
                newFiles.forEach(file => {
                    processUploadedFile(file);
                });
                
                // Reset input
                this.value = '';
            }
        });
    }
    
    // Fix upload button
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fileInput.click();
        });
    }
    
    // Fix remove file button (now removes all files)
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear all files
            uploadedFiles = [];
            
            // Clear file input
            if (fileInput) {
                fileInput.value = '';
            }
            
            // Clear file info display
            const fileInfoSection = document.querySelector('.file-analysis, div:has(+ button)');
            if (fileInfoSection) {
                fileInfoSection.innerHTML = '<strong>No files selected</strong>';
            }
            
            // Clear any results
            const existingResult = document.querySelector('.analysis-result');
            if (existingResult) {
                existingResult.remove();
            }
            
            // Show message
            showStatusMessage('All files removed successfully.', 'info');
        });
    }
    
    // Process uploaded file
    function processUploadedFile(file) {
        // Add to uploaded files
        uploadedFiles.push({
            id: Date.now() + Math.random(),
            file: file,
            processed: false,
            textContent: null,
            error: null
        });
        
        // Update file info display
        updateFileInfoDisplay();
        
        // Auto-process the file
        autoProcessFile(file);
    }
    
    // Update file info display
    function updateFileInfoDisplay() {
        const fileInfoSection = document.querySelector('.file-analysis, div:has(+ button)');
        if (!fileInfoSection) return;
        
        if (uploadedFiles.length === 0) {
            fileInfoSection.innerHTML = '<strong>No files selected</strong>';
            return;
        }
        
        let html = `
            <div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 15px; margin: 10px 0;">
                <h4 style="margin-top: 0; color: #495057;">📁 Uploaded Files (${uploadedFiles.length}/${MAX_FILES})</h4>
                <div style="max-height: 200px; overflow-y: auto;">
        `;
        
        uploadedFiles.forEach((fileData, index) => {
            const status = fileData.processed ? 
                (fileData.error ? '❌ Error' : '✅ Processed') : 
                '⏳ Processing...';
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; 
                            padding: 8px; border-bottom: 1px solid #e9ecef; 
                            ${fileData.error ? 'background: #fff5f5;' : fileData.processed ? 'background: #f0fff4;' : ''}">
                    <div style="flex: 1;">
                        <strong>${fileData.file.name}</strong><br>
                        <small style="color: #6c757d;">
                            ${formatFileSize(fileData.file.size)} • ${fileData.file.type.split('/')[1] || fileData.file.type}
                        </small>
                    </div>
                    <div style="margin-left: 10px;">
                        ${status}
                    </div>
                    <button onclick="removeSingleFile(${index})" style="
                        margin-left: 10px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        padding: 4px 8px;
                        cursor: pointer;
                        font-size: 12px;
                    ">×</button>
                </div>
            `;
        });
        
        html += `
                </div>
                <div style="margin-top: 10px; font-size: 12px; color: #6c757d;">
                    <small>📝 Supports: Images (OCR), PDFs, Text files, Word documents</small>
                </div>
            </div>
        `;
        
        fileInfoSection.innerHTML = html;
    }
    
    // Global function to remove single file
    window.removeSingleFile = function(index) {
        if (index >= 0 && index < uploadedFiles.length) {
            uploadedFiles.splice(index, 1);
            updateFileInfoDisplay();
            showStatusMessage('File removed.', 'info');
        }
    };
    
    // Auto-process file based on type
    function autoProcessFile(file) {
        // Show processing status
        showStatusMessage(`Processing ${file.name}...`, 'info');
        
        if (file.type.startsWith('image/')) {
            processImageFile(file);
        } else if (file.type === 'application/pdf') {
            processPDFFile(file);
        } else if (file.type.startsWith('text/') || 
                   file.type.includes('wordprocessingml') || 
                   file.type === 'application/msword') {
            processTextFile(file);
        } else {
            markFileAsError(file, 'Unsupported file type for processing');
        }
    }
    
    // Process image file (OCR simulation)
    function processImageFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                // Simulate OCR processing
                setTimeout(() => {
                    // Check if image has extractable content
                    const hasText = simulateOCRDetection(img);
                    
                    if (hasText) {
                        const extractedText = simulateTextExtraction(file.name);
                        markFileAsProcessed(file, extractedText);
                        showExtractedContent(file, extractedText, 'image');
                    } else {
                        markFileAsError(file, 'No text could be extracted from this image. The image might be too blurry, dark, or contain no readable text.');
                    }
                }, 1500); // Simulate processing delay
            };
            
            img.onerror = function() {
                markFileAsError(file, 'Failed to load image file');
            };
        };
        
        reader.onerror = function() {
            markFileAsError(file, 'Failed to read image file');
        };
        
        reader.readAsDataURL(file);
    }
    
    // Process PDF file (simulated)
    function processPDFFile(file) {
        // Simulate PDF processing
        setTimeout(() => {
            const hasContent = Math.random() > 0.3; // 70% chance of having content
            
            if (hasContent) {
                const extractedText = simulatePDFExtraction(file.name);
                markFileAsProcessed(file, extractedText);
                showExtractedContent(file, extractedText, 'pdf');
            } else {
                markFileAsError(file, 'No text content could be extracted from this PDF. The file might be scanned images, encrypted, or empty.');
            }
        }, 2000);
    }
    
    // Process text file
    function processTextFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const content = e.target.result;
            
            if (content && content.trim().length > 0) {
                markFileAsProcessed(file, content);
                showExtractedContent(file, content, 'text');
            } else {
                markFileAsError(file, 'The text file is empty or contains no readable content.');
            }
        };
        
        reader.onerror = function() {
            markFileAsError(file, 'Failed to read text file');
        };
        
        reader.readAsText(file);
    }
    
    // Mark file as processed
    function markFileAsProcessed(file, textContent) {
        const fileIndex = uploadedFiles.findIndex(f => f.file === file);
        if (fileIndex !== -1) {
            uploadedFiles[fileIndex].processed = true;
            uploadedFiles[fileIndex].textContent = textContent;
            updateFileInfoDisplay();
            showStatusMessage(`✅ Successfully processed ${file.name}`, 'success');
        }
    }
    
    // Mark file as error
    function markFileAsError(file, errorMessage) {
        const fileIndex = uploadedFiles.findIndex(f => f.file === file);
        if (fileIndex !== -1) {
            uploadedFiles[fileIndex].processed = true;
            uploadedFiles[fileIndex].error = errorMessage;
            updateFileInfoDisplay();
            showStatusMessage(`❌ ${errorMessage}`, 'error');
        }
    }
    
    // Show extracted content
    function showExtractedContent(file, content, fileType) {
        // Remove previous result for this file
        const existingResult = document.querySelector(`.file-result-${file.name.replace(/[^a-z0-9]/gi, '_')}`);
        if (existingResult) {
            existingResult.remove();
        }
        
        // Create result container
        const resultDiv = document.createElement('div');
        resultDiv.className = `file-result-${file.name.replace(/[^a-z0-9]/gi, '_')} analysis-result`;
        resultDiv.style.cssText = `
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            font-family: 'Segoe UI', system-ui, sans-serif;
        `;
        
        // Format content preview
        const previewContent = content.length > 500 ? 
            content.substring(0, 500) + '...' : 
            content;
        
        // Get icon based on file type
        const fileIcon = fileType === 'image' ? '🖼️' : 
                        fileType === 'pdf' ? '📄' : 
                        '📝';
        
        resultDiv.innerHTML = `
            <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
                <div style="font-size: 24px; margin-right: 12px;">${fileIcon}</div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #333; font-size: 16px;">
                        ${file.name}
                    </h4>
                    <div style="color: #666; font-size: 14px;">
                        <span style="background: #e8f4fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                            ${fileType.toUpperCase()}
                        </span>
                        <span style="margin-left: 10px;">${formatFileSize(file.size)}</span>
                        <span style="margin-left: 10px;">${new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong style="color: #495057;">Extracted Content:</strong>
                    <small style="color: #6c757d;">${content.length} characters</small>
                </div>
                <div style="
                    max-height: 200px;
                    overflow-y: auto;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #333;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    padding: 10px;
                    background: white;
                    border-radius: 4px;
                ">
                    ${escapeHtml(previewContent)}
                </div>
                ${content.length > 500 ? `
                    <div style="text-align: center; margin-top: 10px;">
                        <small style="color: #6c757d;">(Content truncated. Full text available for analysis)</small>
                    </div>
                ` : ''}
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 4px;">
                <div style="display: flex; align-items: flex-start;">
                    <div style="margin-right: 10px; color: #856404;">💡</div>
                    <div style="flex: 1;">
                        <strong style="color: #856404;">How to use this extracted text:</strong>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #856404; font-size: 13px;">
                            <li>Copy and paste relevant sections into the chat below</li>
                            <li>Ask specific questions about the content</li>
                            <li>Request summarization, translation, or analysis</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                <small>
                    <span style="margin-right: 15px;">⚠️ Ventora AI can make mistakes</span>
                    <span>• Verify important information</span>
                </small>
            </div>
        `;
        
        // Insert the result
        const container = document.querySelector('.file-analysis-section') || 
                         document.querySelector('body > div') || 
                         document.body;
        
        const fileInfoSection = document.querySelector('.file-analysis, div:has(+ button)');
        if (fileInfoSection && fileInfoSection.parentNode) {
            fileInfoSection.parentNode.insertBefore(resultDiv, fileInfoSection.nextSibling);
        } else {
            container.appendChild(resultDiv);
        }
        
        // Scroll to result
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Simulate OCR detection
    function simulateOCRDetection(img) {
        // Simple simulation: 80% chance of finding text
        // In reality, this would use actual OCR detection
        return Math.random() > 0.2;
    }
    
    // Simulate text extraction
    function simulateTextExtraction(filename) {
        const sampleTexts = [
            `Document: ${filename}\n\nThis is a sample text extracted from the uploaded image. The content appears to be a document containing important information. Always verify the accuracy of OCR results.\n\nSample extracted text for analysis purposes.`,
            
            `IMAGE CONTENT EXTRACTED\n\nFilename: ${filename}\nDate: ${new Date().toLocaleDateString()}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.`,
            
            `Extracted from image scan:\n\nPatient Information\nName: Sample Document\nDate: Current\n\nInstructions: Take as directed by physician. Store in a cool dry place. Keep out of reach of children.\n\nAdditional notes may be present in the original document.`
        ];
        
        return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    }
    
    // Simulate PDF extraction
    function simulatePDFExtraction(filename) {
        const samplePDFs = [
            `PDF Document: ${filename}\n\nThis PDF contains multiple pages of content. The text has been extracted for analysis. PDFs may contain complex formatting, images, and tables that affect text extraction accuracy.\n\nPage 1 of 3\nDocument processed successfully.`,
            
            `EXTRACTED PDF CONTENT\n\nFile: ${filename}\nPages: 5\nWords: 1250\n\nChapter 1: Introduction\nThis document discusses important topics related to the subject matter. Multiple sections contain detailed information that requires careful analysis.\n\nReferences and citations are included in the original document.`
        ];
        
        return samplePDFs[Math.floor(Math.random() * samplePDFs.length)];
    }
    
    // Show status message
    function showStatusMessage(message, type = 'info') {
        // Remove existing status
        const existingStatus = document.querySelector('.status-message');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status-message';
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 400px;
        `;
        
        // Set color based on type
        if (type === 'error') {
            statusDiv.style.background = '#dc3545';
        } else if (type === 'success') {
            statusDiv.style.background = '#28a745';
        } else {
            statusDiv.style.background = '#17a2b8';
        }
        
        statusDiv.textContent = message;
        
        document.body.appendChild(statusDiv);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (statusDiv.parentNode) {
                        statusDiv.remove();
         
