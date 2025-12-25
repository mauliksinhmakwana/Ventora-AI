// Simple Slide-up Menu System

function initSlideUpMenu() {
    // Add trigger button to sidebar
    const menuItems = document.querySelector('.menu-items');
    
    if (!menuItems) return;
    
    // Create bottom trigger
    const bottomTrigger = document.createElement('div');
    bottomTrigger.className = 'menu-bottom-trigger';
    bottomTrigger.innerHTML = `
        <button class="menu-trigger-btn" id="menuTriggerBtn">
            <div class="trigger-left">
                <i class="fas fa-bars"></i>
                <span>More Options</span>
            </div>
            <i class="fas fa-chevron-up trigger-chevron"></i>
        </button>
    `;
    
    // Add to menu container
    menuItems.parentNode.appendChild(bottomTrigger);
    
    // Create slide-up menu HTML
    createSlideUpMenuHTML();
    
    // Set up events
    setupMenuEvents();
}

function createSlideUpMenuHTML() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'slideup-menu-overlay';
    overlay.id = 'slideupMenuOverlay';
    overlay.onclick = closeSlideUpMenu;
    
    // Create slide-up menu
    const slideUpMenu = document.createElement('div');
    slideUpMenu.className = 'slideup-menu-container';
    slideUpMenu.id = 'slideupMenuContainer';
    slideUpMenu.innerHTML = `
        <div class="slideup-menu-header">
            <div class="slideup-menu-title">Menu</div>
            <button class="close-slideup-menu" onclick="closeSlideUpMenu()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="slideup-menu-items">
            <div class="slideup-menu-item" onclick="toggleGoalModal(); closeSlideUpMenu();">
                <i class="fas fa-check-circle"></i>
                <span>Study Goals</span>
            </div>
            
            <div class="slideup-menu-item" onclick="openPersonalization(); closeSlideUpMenu();">
                <i class="fas fa-user-circle"></i>
                <span>Personalization</span>
            </div>
            
            <div class="slideup-menu-item" onclick="openSettings(); closeSlideUpMenu();">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
            </div>
            
            <div class="slideup-menu-divider"></div>
            
            <div class="slideup-menu-item" onclick="openAboutModal(); closeSlideUpMenu();">
                <i class="fas fa-info-circle"></i>
                <span>About</span>
            </div>
            
            <div class="slideup-menu-item" onclick="exportChat(); closeSlideUpMenu();">
                <i class="fas fa-download"></i>
                <span>Export Chat</span>
            </div>
            
            <div class="slideup-menu-divider"></div>
            
            <div class="slideup-menu-item" onclick="clearAllData(); closeSlideUpMenu();" style="color: #ff4757;">
                <i class="fas fa-trash"></i>
                <span>Clear All Data</span>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(overlay);
    document.body.appendChild(slideUpMenu);
}

function setupMenuEvents() {
    const triggerBtn = document.getElementById('menuTriggerBtn');
    
    if (triggerBtn) {
        triggerBtn.addEventListener('click', openSlideUpMenu);
    }
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSlideUpMenu();
        }
    });
}

function openSlideUpMenu() {
    const overlay = document.getElementById('slideupMenuOverlay');
    const slideUpMenu = document.getElementById('slideupMenuContainer');
    const triggerBtn = document.getElementById('menuTriggerBtn');
    
    // Close main menu first
    closeMenu();
    
    // Open slide-up
    overlay.classList.add('active');
    slideUpMenu.classList.add('active');
    triggerBtn.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
}

function closeSlideUpMenu() {
    const overlay = document.getElementById('slideupMenuOverlay');
    const slideUpMenu = document.getElementById('slideupMenuContainer');
    const triggerBtn = document.getElementById('menuTriggerBtn');
    
    overlay.classList.remove('active');
    slideUpMenu.classList.remove('active');
    triggerBtn.classList.remove('active');
    
    // Restore scroll
    document.body.style.overflow = '';
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initSlideUpMenu();
});
