// about.js — SAFE DROP-IN (no tag dependency changes)

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeText(element, html, speed = 25) {
    element.innerHTML = "";

    const temp = document.createElement("div");
    temp.innerHTML = html;

    for (const node of temp.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            for (const char of node.textContent) {
                element.innerHTML += char;
                await sleep(speed);
            }
        } else {
            element.appendChild(node.cloneNode(true));
            await sleep(speed);
        }
        if (typeof scrollToBottom === "function") scrollToBottom();
    }
}

function openAboutModal() {
    const modal = document.getElementById("about-modal");
    if (!modal) return;

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
        document.getElementById("close-about-btn")?.focus();
    }, 100);
}

function closeAboutModal() {
    const modal = document.getElementById("about-modal");
    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    window.lastFocusedElement?.focus();
}

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("focusin", e => {
        const modal = document.getElementById("about-modal");
        if (!modal?.classList.contains("active")) {
            window.lastFocusedElement = e.target;
        }
    });

    document.querySelectorAll(".menu-item").forEach(item => {
        const span = item.querySelector("span");
        if (span?.textContent.trim() === "About") {
            item.addEventListener("click", e => {
                e.preventDefault();
                openAboutModal();
            });
        }
    });

    document.getElementById("close-about-btn")
        ?.addEventListener("click", closeAboutModal);

    const modal = document.getElementById("about-modal");
    modal?.addEventListener("click", e => {
        if (e.target === modal) closeAboutModal();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && modal?.classList.contains("active")) {
            closeAboutModal();
        }
    });
});

window.openAboutModal = openAboutModal;
window.closeAboutModal = closeAboutModal;
