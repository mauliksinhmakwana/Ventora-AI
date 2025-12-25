// Initialize Personalization Data
window.personalization = JSON.parse(localStorage.getItem('nebula_pers')) || {
    userName: '',
    studyLevel: 'college',
    responseStyle: 'friendly'
};

// Open the Popup
window.openPersonalization = function() {
    if(typeof closeMenu === "function") closeMenu(); // Close sidebar first
    
    // Fill the form with saved data
    document.getElementById('persName').value = window.personalization.userName;
    document.getElementById('persLevel').value = window.personalization.studyLevel;
    document.getElementById('persStyle').value = window.personalization.responseStyle;
    
    // Show the modal
    document.getElementById('personalizationModal').classList.add('active');
};

// Close the Popup
window.closePersonalization = function() {
    document.getElementById('personalizationModal').classList.remove('active');
};

// Save and Close
window.savePersonalization = function() {
    window.personalization.userName = document.getElementById('persName').value.trim();
    window.personalization.studyLevel = document.getElementById('persLevel').value;
    window.personalization.responseStyle = document.getElementById('persStyle').value;
    
    // Save to browser memory
    localStorage.setItem('nebula_pers', JSON.stringify(window.personalization));
    
    window.closePersonalization();
    if(typeof showToast === "function") showToast("Identity Updated! ✨");
};
