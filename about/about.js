// about/about.js

function openAboutModal() {
    const modal = document.getElementById("about-modal");
    if (!modal) return;

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeAboutModal() {
    const modal = document.getElementById("about-modal");
    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

/* Privacy popup */
function openPrivacy() {
    document.getElementById("privacy-popup").classList.add("active");
}

function closePrivacy() {
    document.getElementById("privacy-popup").classList.remove("active");
}

/* Background close */
document.addEventListener("click", (e) => {
    const modal = document.getElementById("about-modal");
    if (modal && e.target === modal) closeAboutModal();
});

/* ESC key */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closePrivacy();
        closeAboutModal();
    }
});

window.openAboutModal = openAboutModal;
window.closeAboutModal = closeAboutModal;
window.openPrivacy = openPrivacy;
window.closePrivacy = closePrivacy;
