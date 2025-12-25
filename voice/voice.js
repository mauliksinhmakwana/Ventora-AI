// voice/voice.js
function toggleSpeech(btn) {
    if (!('speechSynthesis' in window)) {
        alert("Your browser does not support text-to-speech.");
        return;
    }

    // Stop if already speaking
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        resetVoiceButtons();
        return;
    }

    // Get message text and remove UI labels/timestamps
    const msgElement = btn.closest('.msg');
    const textToRead = msgElement.innerText
        .replace(/Copy|Regenerate|Read Aloud|Stop/g, '') 
        .replace(/\d{1,2}:\d{2}.*/g, '') 
        .replace(/```[\s\S]*?```/g, ' [code omitted] ') 
        .trim();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;

    btn.classList.add('speaking');
    btn.innerHTML = '<i class="fas fa-stop"></i> Stop';

    utterance.onend = () => resetVoiceButtons();
    utterance.onerror = () => resetVoiceButtons();

    window.speechSynthesis.speak(utterance);
}

function resetVoiceButtons() {
    document.querySelectorAll('.voice-btn').forEach(btn => {
        btn.classList.remove('speaking');
        btn.innerHTML = '<i class="fas fa-volume-up"></i> Read Aloud';
    });
}
