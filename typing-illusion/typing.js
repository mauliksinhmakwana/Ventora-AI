// ========= Ventora Typing Illusion =========

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function typeWriterEffect(element, text, speed = 40) {
  element.classList.add("ai-typing", "typing-cursor");
  element.innerHTML = "";

  const words = text.split(" ");
  let index = 0;

  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (index >= words.length) {
        clearInterval(interval);
        element.classList.remove("typing-cursor");
        resolve();
        return;
      }
      element.innerHTML += words[index] + " ";
      index++;
      if (typeof scrollToBottom === "function") scrollToBottom();
    }, speed);
  });
}

// 🔴 THIS MUST EXIST
async function renderAIResponse(container, text) {
  await sleep(600); // thinking pause
  await typeWriterEffect(container, text, 45);
}

// 🔴 MAKE IT GLOBAL (IMPORTANT)
window.renderAIResponse = renderAIResponse;

