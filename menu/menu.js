// Profile Menu Slide-Up Logic
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    const overlay = document.getElementById('profileMenuOverlay');
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeProfileMenu() {
    document.getElementById('profileMenu').classList.remove('active');
    document.getElementById('profileMenuOverlay').classList.remove('active');
}

// Ensure these close the profile menu before running existing functions
function handleSettings() {
    closeProfileMenu();
    if (typeof openSettings === 'function') openSettings();
}

function handlePersonalization() {
    closeProfileMenu();
    if (typeof openPersonalization === 'function') openPersonalization();
}

function handleExport() {
    closeProfileMenu();
    if (typeof exportChat === 'function') exportChat();
}

// Wait for the Profile button to exist in DOM
document.addEventListener('DOMContentLoaded', () => {
    const pBtn = document.getElementById('profileButton');
    if (pBtn) pBtn.onclick = toggleProfileMenu;
});
