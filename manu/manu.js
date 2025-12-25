// manu/manu.js

function toggleBottomMenu() {
    const options = document.getElementById('menuExpandedOptions');
    options.classList.toggle('active');
}

// Close the menu if user clicks anywhere else in the sidebar
document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.menu-bottom-wrapper');
    const options = document.getElementById('menuExpandedOptions');
    if (wrapper && !wrapper.contains(e.target)) {
        options.classList.remove('active');
    }
});

// Helper to handle navigation and auto-close
function handleMenuAction(actionFunction) {
    const options = document.getElementById('menuExpandedOptions');
    options.classList.remove('active');
    
    // Call the original function (openSettings, openPersonalization, etc.)
    if (typeof window[actionFunction] === 'function') {
        window[actionFunction]();
    }
}
