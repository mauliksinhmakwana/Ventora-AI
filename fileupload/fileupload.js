window.extractedFileText = "";

document.addEventListener('DOMContentLoaded', () => {
    // Inject the mini-popup HTML dynamically into the input-section
    const inputSection = document.querySelector('.input-section');
    const popupHTML = `
        <div id="filePopup" class="file-popup">
            <div class="file-option" id="uploadOption">
                <i class="fas fa-file-alt"></i>
                <span>Upload Text File</span>
            </div>
            <div id="fileStatus" class="file-status-indicator">No file selected</div>
        </div>
        <input type="file" id="file-input" style="display: none;" accept=".txt,.js,.css,.html,.json,.md,.py,.cpp">
    `;
    inputSection.insertAdjacentHTML('afterbegin', popupHTML);

    const attachBtn = document.getElementById('attach-btn');
    const filePopup = document.getElementById('filePopup');
    const uploadOption = document.getElementById('uploadOption');
    const fileInput = document.getElementById('file-input');
    const fileStatus = document.getElementById('fileStatus');

    // Toggle the mini-popup
    attachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filePopup.classList.toggle('active');
    });

    // Close popup when clicking outside
    document.addEventListener('click', () => {
        filePopup.classList.remove('active');
    });

    uploadOption.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = function(event) {
            const text = event.target.result;
            
            // STRICT VALIDATION: If no text, don't accept the file
            if (!text || text.trim().length === 0) {
                if (window.showToast) window.showToast("Error: Your file has no text.", "error");
                window.extractedFileText = "";
                attachBtn.classList.remove('active');
                fileStatus.innerText = "No text detected.";
                fileInput.value = ""; // Clear file
            } else {
                window.extractedFileText = text;
                attachBtn.classList.add('active');
                fileStatus.innerText = `Ready: ${file.name}`;
                if (window.showToast) window.showToast("Uploaded successfully!", "info");
            }
        };

        reader.readAsText(file);
        filePopup.classList.remove('active');
    });
});
