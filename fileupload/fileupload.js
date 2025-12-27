// GLOBAL FILE CONTEXT
window.fileContext = {
    text: "",
    name: ""
};

// ELEMENTS
const fileBtn = document.getElementById("file-btn");
const filePopup = document.getElementById("file-popup");
const fileInput = document.getElementById("file-input");
const fileStatus = document.getElementById("file-status");

// TOGGLE POPUP
fileBtn.onclick = () => {
    filePopup.classList.toggle("active");
};

// PICK FILE
function pickFile() {
    fileInput.click();
}

// HANDLE FILE
fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;

    fileStatus.textContent = "Reading file...";

    const ext = file.name.split(".").pop().toLowerCase();

    try {
        let text = "";

        if (ext === "txt") {
            text = await file.text();
        } 
        else if (ext === "pdf") {
            text = await extractPdfText(file);
        } 
        else if (ext === "docx") {
            text = await extractDocxText(file);
        } 
        else {
            throw "Unsupported file";
        }

        if (!text || text.trim().length < 20) {
            throw "No readable text found";
        }

        window.fileContext.text = text.slice(0, 15000); // limit
        window.fileContext.name = file.name;

        fileStatus.textContent = "File uploaded successfully ✓";
        filePopup.classList.remove("active");

    } catch (err) {
        window.fileContext = { text: "", name: "" };
        fileStatus.textContent = "Your file has no readable text";
    }
};
