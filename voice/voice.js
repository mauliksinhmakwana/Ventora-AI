// Change this line inside toggleSpeech when stopping
btn.innerHTML = '<i class="fas fa-volume-up"></i> Read';

// And update your reset function
function resetVoiceUI() {
    const allBtns = document.querySelectorAll('.voice-btn');
    allBtns.forEach(b => {
        b.classList.remove('speaking');
        b.innerHTML = '<i class="fas fa-volume-up"></i> Read';
    });
}
