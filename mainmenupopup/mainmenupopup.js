// Main Menu Popup - DeepSeek Style - UPDATED

// Global state
let currentSection = null;
let sections = {
    'goals': {
        title: 'Your Goals',
        icon: 'fas fa-check-circle',
        render: renderGoalsSection
    },
    'personalization': {
        title: 'Personalization',
        icon: 'fas fa-user-circle',
        render: renderPersonalizationSection
    },
    'settings': {
        title: 'Settings',
        icon: 'fas fa-cog',
        render: renderSettingsSection
    },
    'export': {
        title: 'Export Chat',
        icon: 'fas fa-download',
        render: renderExportSection
    },
    'privacy': {
        title: 'Privacy & Security',
        icon: 'fas fa-shield-alt',
        render: renderPrivacySection
    }
};

// Initialize popup
function initMainMenuPopup() {
    loadAllData();
    setupEventListeners();
}

// Open the main menu popup
function openMainMenuPopup() {
    const modal = document.getElementById('mainmenu-modal');
    const container = document.querySelector('.mainmenu-container');
    
    if (!modal || !container) return;
    
    // Close sidebar menu if open
    if (typeof closeMenu === 'function') closeMenu();
    
    // Reset to menu view on mobile
    if (window.innerWidth <= 768) {
        container.classList.add('menu-view');
        container.classList.remove('content-view');
        currentSection = null;
    } else {
        // On desktop, open with first section
        if (!currentSection) {
            currentSection = 'personalization';
        }
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Render menu and initial section
    renderMenu();
    
    // On desktop, show the first section
    if (window.innerWidth > 768 && currentSection) {
        renderSection(currentSection);
    }
}

// Close the popup
function closeMainMenuPopup() {
    const modal = document.getElementById('mainmenu-modal');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Go back to menu (mobile)
function goBackToMenu() {
    if (window.innerWidth <= 768) {
        const container = document.querySelector('.mainmenu-container');
        container.classList.add('menu-view');
        container.classList.remove('content-view');
        currentSection = null;
    }
}

// Open a section
function openSection(sectionId) {
    const section = sections[sectionId];
    if (!section) return;
    
    currentSection = sectionId;
    
    // Update UI based on device
    if (window.innerWidth <= 768) {
        const container = document.querySelector('.mainmenu-container');
        container.classList.remove('menu-view');
        container.classList.add('content-view');
    }
    
    // Update active menu item
    renderMenu();
    
    // Render the section
    renderSection(sectionId);
}

// Render the sidebar menu
function renderMenu() {
    const menuContainer = document.querySelector('.sidebar-menu');
    if (!menuContainer) return;
    
    // Menu HTML
    menuContainer.innerHTML = `
        <div class="menu-section">
            <h4 class="section-title">Preferences</h4>
            ${renderMenuItem('goals', 'Your Goals', 'fas fa-check-circle')}
            ${renderMenuItem('personalization', 'Personalization', 'fas fa-user-circle')}
            ${renderMenuItem('settings', 'Settings', 'fas fa-cog')}
        </div>
        
        <div class="menu-section">
            <h4 class="section-title">Data</h4>
            ${renderMenuItem('export', 'Export Chat', 'fas fa-download')}
            <div class="menu-item" onclick="showClearDataConfirm()">
                <i class="fas fa-trash-alt"></i>
                <span>Clear All Data</span>
            </div>
        </div>
        
        <div class="menu-section">
            <h4 class="section-title">About</h4>
            ${renderMenuItem('privacy', 'Privacy & Security', 'fas fa-shield-alt')}
        </div>
    `;
}

// Helper to render menu item
function renderMenuItem(id, title, icon) {
    const activeClass = currentSection === id ? 'active' : '';
    return `
        <div class="menu-item ${activeClass}" onclick="openSection('${id}')">
            <i class="${icon}"></i>
            <span>${title}</span>
        </div>
    `;
}

// Render a section
function renderSection(sectionId) {
    const section = sections[sectionId];
    if (!section) return;
    
    const contentTitle = document.querySelector('.content-title');
    const contentBody = document.querySelector('.content-body');
    
    if (contentTitle) contentTitle.textContent = section.title;
    if (contentBody) section.render(contentBody);
}

// Load all data
function loadAllData() {
    // Personalization
    if (!window.personalization) {
        window.personalization = JSON.parse(localStorage.getItem('nebula_pers')) || {
            userName: '',
            studyLevel: 'college',
            major: '',
            responseStyle: 'balanced',
            customInstructions: ''
        };
    }
    
    // App Settings
    if (!window.nebulaSettings) {
        window.nebulaSettings = JSON.parse(localStorage.getItem('nebula_settings')) || {
            model: 'groq:general',
            temperature: 0.7,
            maxTokens: 1024
        };
    }
    
    // Goals/Tasks
    if (!window.ventoraTasks) {
        window.ventoraTasks = JSON.parse(localStorage.getItem('ventora_tasks')) || [];
    }
    
    // Study Notes
    if (!window.ventoraNotes) {
        window.ventoraNotes = localStorage.getItem('ventora_study_notes') || '';
    }
}

// ===== SECTION RENDER FUNCTIONS =====

// Personalization Section
function renderPersonalizationSection(container) {
    container.innerHTML = `
        <div class="form-group">
            <label class="form-label">Your Name</label>
            <input type="text" class="form-input" id="menu-pers-name" 
                   placeholder="What should I call you?" 
                   value="${window.personalization.userName || ''}">
        </div>
        
        <div class="form-group">
            <label class="form-label">Proficiency Level</label>
            <select class="form-select" id="menu-pers-level">
                <option value="school" ${window.personalization.studyLevel === 'school' ? 'selected' : ''}>Foundation</option>
                <option value="highschool" ${window.personalization.studyLevel === 'highschool' ? 'selected' : ''}>Intermediate</option>
                <option value="college" ${window.personalization.studyLevel === 'college' ? 'selected' : ''}>Advanced Academic</option>
                <option value="researcher" ${window.personalization.studyLevel === 'researcher' ? 'selected' : ''}>Expert / Scholar</option>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label">Interest / Major</label>
            <input type="text" class="form-input" id="menu-pers-major" 
                   placeholder="e.g. Medicine, Computer Science"
                   value="${window.personalization.major || ''}">
        </div>
        
        <div class="form-group">
            <label class="form-label">Response Style</label>
            <select class="form-select" id="menu-pers-style">
                <option value="balanced" ${window.personalization.responseStyle === 'balanced' ? 'selected' : ''}>Standard (Optimal)</option>
                <option value="technical" ${window.personalization.responseStyle === 'technical' ? 'selected' : ''}>Technical & Analytical</option>
                <option value="encouraging" ${window.personalization.responseStyle === 'encouraging' ? 'selected' : ''}>Socratic Tutor</option>
                <option value="concise" ${window.personalization.responseStyle === 'concise' ? 'selected' : ''}>Direct & Precise</option>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label">Custom Instructions</label>
            <textarea class="form-textarea" id="menu-pers-custom" 
                      placeholder="What would you like Ventora to know? Any specific preferences...">
${window.personalization.customInstructions || ''}</textarea>
        </div>
        
        <div class="btn-group">
            <button class="btn btn-primary" onclick="saveMenuPersonalization()">Save Changes</button>
            <button class="btn btn-secondary" onclick="resetMenuPersonalization()">Reset to Default</button>
        </div>
    `;
}

// Settings Section
function renderSettingsSection(container) {
    container.innerHTML = `
        <div class="form-group">
            <label class="form-label">AI Model</label>
            <select class="form-select" id="menu-settings-model">
                <option value="groq:general" ${window.nebulaSettings.model === 'groq:general' ? 'selected' : ''}>MIA – General</option>
                <option value="groq:research" ${window.nebulaSettings.model === 'groq:research' ? 'selected' : ''}>MIA – Research & Analysis</option>
                <option value="groq:study" ${window.nebulaSettings.model === 'groq:study' ? 'selected' : ''}>MIA – Clinical Reasoning</option>
            </select>
            <div class="form-info">Choose the AI model for responses</div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Temperature: <span id="temp-value">${window.nebulaSettings.temperature}</span></label>
            <input type="range" class="form-range" id="menu-settings-temp" 
                   min="0" max="1" step="0.1" value="${window.nebulaSettings.temperature}">
            <div class="range-labels">
                <span>Precise</span>
                <span>Balanced</span>
                <span>Creative</span>
            </div>
            <div class="form-info">Lower values = more focused, Higher values = more creative</div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Max Tokens</label>
            <select class="form-select" id="menu-settings-tokens">
                <option value="512" ${window.nebulaSettings.maxTokens === 512 ? 'selected' : ''}>512</option>
                <option value="1024" ${window.nebulaSettings.maxTokens === 1024 ? 'selected' : ''}>1024</option>
                <option value="2048" ${window.nebulaSettings.maxTokens === 2048 ? 'selected' : ''}>2048</option>
                <option value="4096" ${window.nebulaSettings.maxTokens === 4096 ? 'selected' : ''}>4096</option>
                <option value="8192" ${window.nebulaSettings.maxTokens === 8192 ? 'selected' : ''}>8192</option>
            </select>
            <div class="form-info">Maximum length of AI responses</div>
        </div>
        
        <div class="btn-group">
            <button class="btn btn-primary" onclick="saveMenuSettings()">Save Settings</button>
            <button class="btn btn-secondary" onclick="resetMenuSettings()">Reset to Default</button>
        </div>
    `;
    
    // Add event listener for temperature slider
    const tempSlider = document.getElementById('menu-settings-temp');
    const tempValue = document.getElementById('temp-value');
    if (tempSlider && tempValue) {
        tempSlider.addEventListener('input', function() {
            tempValue.textContent = this.value;
        });
    }
}

// Goals Section
function renderGoalsSection(container) {
    // Get tasks HTML
    let tasksHTML = '';
    if (window.ventoraTasks.length === 0) {
        tasksHTML = '<div class="empty-state"><i class="fas fa-tasks"></i><h4>No goals yet</h4><p>Add your first study goal!</p></div>';
    } else {
        window.ventoraTasks.forEach((task, index) => {
            const completedClass = task.completed ? 'completed' : '';
            tasksHTML += `
                <div class="task-item">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="toggleMenuTask(${index})">
                    <span class="task-text ${completedClass}">${task.text}</span>
                    <button class="task-delete" onclick="deleteMenuTask(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        });
    }
    
    container.innerHTML = `
        <div class="task-container">
            <input type="text" class="task-input" id="menu-new-task" 
                   placeholder="Add a new study goal...">
            <button class="task-add-btn" onclick="addMenuTask()">Add</button>
        </div>
        
        <div class="task-list">
            ${tasksHTML}
        </div>
        
        <div class="form-group" style="margin-top: 30px;">
            <label class="form-label">Study Notes (Auto-saves)</label>
            <textarea class="form-textarea" id="menu-study-notes" 
                      placeholder="Write down important things to remember...">${window.ventoraNotes}</textarea>
            <div class="form-info">Notes are automatically saved as you type</div>
        </div>
    `;
    
    // Set up auto-save for notes
    const notesArea = document.getElementById('menu-study-notes');
    if (notesArea) {
        let notesTimer;
        notesArea.addEventListener('input', function() {
            clearTimeout(notesTimer);
            notesTimer = setTimeout(() => {
                localStorage.setItem('ventora_study_notes', this.value);
                window.ventoraNotes = this.value;
                showMenuToast('Notes saved!');
            }, 1000);
        });
    }
}

// Privacy & Security Section
function renderPrivacySection(container) {
    container.innerHTML = `
        <div class="about-logo">VENTORA<span>AI</span></div>
        <div class="about-tagline">Medical Information Assistant</div>
        
        <div class="about-description">
            Your privacy and security are our top priority. Ventora AI is designed with
            privacy-first principles to ensure your data remains secure and private.
        </div>
        
        <div class="privacy-content">
            <div class="privacy-point">
                <i class="fas fa-lock"></i>
                <span><strong>Local Storage:</strong> All your conversations, settings, and personal data are stored locally in your browser. No data is sent to external servers for storage.</span>
            </div>
            
            <div class="privacy-point">
                <i class="fas fa-shield-alt"></i>
                <span><strong>No Account Required:</strong> Ventora AI doesn't require you to create an account. Your data stays with you on your device.</span>
            </div>
            
            <div class="privacy-point">
                <i class="fas fa-user-secret"></i>
                <span><strong>No Personal Tracking:</strong> We don't track your personal information, browsing history, or usage patterns. Your interactions remain private.</span>
            </div>
            
            <div class="privacy-point">
                <i class="fas fa-database"></i>
                <span><strong>Data Ownership:</strong> You own all your data. You can export your conversations at any time or clear all data with one click.</span>
            </div>
            
            <div class="privacy-point">
                <i class="fas fa-code"></i>
                <span><strong>Open Source:</strong> Ventora AI's code is transparent. You can review how it handles your data and verify its security measures.</span>
            </div>
            
            <div class="privacy-point">
                <i class="fas fa-heartbeat"></i>
                <span><strong>Medical Disclaimer:</strong> Ventora AI provides educational information only. It is not a substitute for professional medical advice.</span>
            </div>
        </div>
        
        <div class="form-info" style="margin-top: 20px; text-align: center;">
            <i class="fas fa-info-circle"></i> Created by Maulik Makwana • Version V5.4 MIA
        </div>
    `;
}

// Export Section - UPDATED with conversation selection
function renderExportSection(container) {
    const conversations = JSON.parse(localStorage.getItem('nebula_conversations')) || [];
    const currentConversationId = localStorage.getItem('current_conversation_id') || (conversations[0]?.id || '');
    
    let conversationOptions = '';
    let exportAllOption = '';
    
    if (conversations.length === 0) {
        conversationOptions = '<div class="empty-state"><i class="fas fa-comment-slash"></i><h4>No conversations</h4><p>Start chatting to export conversations.</p></div>';
    } else {
        // Option to export all conversations
        exportAllOption = `
            <div class="conversation-option" onclick="selectExportOption('all')">
                <input type="radio" name="export-option" id="export-all" ${currentConversationId === 'all' ? 'checked' : ''}>
                <div class="conversation-info">
                    <div class="conversation-title">Export All Conversations</div>
                    <div class="conversation-date">${conversations.length} conversations • All data</div>
                </div>
            </div>
        `;
        
        // Individual conversation options
        conversations.forEach(conv => {
            const date = new Date(conv.updatedAt);
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isCurrent = conv.id === currentConversationId;
            
            conversationOptions += `
                <div class="conversation-option" onclick="selectExportOption('${conv.id}')">
                    <input type="radio" name="export-option" id="export-${conv.id}" ${isCurrent ? 'checked' : ''}>
                    <div class="conversation-info">
                        <div class="conversation-title">${conv.title}</div>
                        <div class="conversation-date">${dateStr} • ${timeStr} • ${conv.messages?.length || 0} messages</div>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = `
        <div class="form-group">
            <label class="form-label">Select Conversations to Export</label>
            <div class="conversation-select">
                ${exportAllOption}
                ${conversationOptions}
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Export Format</label>
            <select class="form-select" id="menu-export-format">
                <option value="txt">Text File (.txt)</option>
                <option value="json">JSON (.json)</option>
                <option value="html">HTML (.html)</option>
                <option value="markdown">Markdown (.md)</option>
                <option value="pdf">PDF (.pdf)</option>
            </select>
            <div class="form-info">PDF export may take longer to generate</div>
        </div>
        
        <div class="form-group">
            <label class="form-label">Include</label>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="menu-include-timestamps" checked>
                    <span>Timestamps</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="menu-include-metadata" checked>
                    <span>Metadata (titles, dates)</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="menu-include-formatting" checked>
                    <span>Formatting (bold, code blocks)</span>
                </label>
            </div>
        </div>
        
        <div class="btn-group">
            <button class="btn btn-primary" onclick="exportMenuChat()">Export Now</button>
            <button class="btn btn-secondary" onclick="previewMenuExport()">Preview</button>
        </div>
        
        <div class="form-info" style="margin-top: 20px; text-align: center;">
            <i class="fas fa-info-circle"></i> Exported files contain only your conversation data.
        </div>
    `;
    
    // Initialize export selection
    if (currentConversationId) {
        selectExportOption(currentConversationId);
    } else if (conversations.length > 0) {
        selectExportOption('all');
    }
}

// ===== DATA MANAGEMENT FUNCTIONS =====

// Export selection
let selectedExportOption = 'all';

function selectExportOption(optionId) {
    selectedExportOption = optionId;
    
    // Update radio buttons
    document.querySelectorAll('input[name="export-option"]').forEach(radio => {
        radio.checked = radio.id === `export-${optionId}`;
    });
}

// Save personalization
function saveMenuPersonalization() {
    window.personalization = {
        userName: document.getElementById('menu-pers-name')?.value.trim() || '',
        studyLevel: document.getElementById('menu-pers-level')?.value || 'college',
        major: document.getElementById('menu-pers-major')?.value.trim() || '',
        responseStyle: document.getElementById('menu-pers-style')?.value || 'balanced',
        customInstructions: document.getElementById('menu-pers-custom')?.value.trim() || ''
    };
    
    localStorage.setItem('nebula_pers', JSON.stringify(window.personalization));
    showMenuToast('Personalization saved!');
}

// Reset personalization
function resetMenuPersonalization() {
    if (confirm('Reset personalization to default values?')) {
        window.personalization = {
            userName: '',
            studyLevel: 'college',
            major: '',
            responseStyle: 'balanced',
            customInstructions: ''
        };
        
        localStorage.setItem('nebula_pers', JSON.stringify(window.personalization));
        renderPersonalizationSection(document.querySelector('.content-body'));
        showMenuToast('Personalization reset');
    }
}

// Save settings
function saveMenuSettings() {
    window.nebulaSettings = {
        model: document.getElementById('menu-settings-model')?.value || 'groq:general',
        temperature: parseFloat(document.getElementById('menu-settings-temp')?.value || 0.7),
        maxTokens: parseInt(document.getElementById('menu-settings-tokens')?.value || 1024)
    };
    
    localStorage.setItem('nebula_settings', JSON.stringify(window.nebulaSettings));
    showMenuToast('Settings saved!');
}

// Reset settings
function resetMenuSettings() {
    if (confirm('Reset settings to default values?')) {
        window.nebulaSettings = {
            model: 'groq:general',
            temperature: 0.7,
            maxTokens: 1024
        };
        
        localStorage.setItem('nebula_settings', JSON.stringify(window.nebulaSettings));
        renderSettingsSection(document.querySelector('.content-body'));
        showMenuToast('Settings reset');
    }
}

// Tasks management
function addMenuTask() {
    const input = document.getElementById('menu-new-task');
    if (!input || !input.value.trim()) return;
    
    window.ventoraTasks.push({ text: input.value, completed: false });
    localStorage.setItem('ventora_tasks', JSON.stringify(window.ventoraTasks));
    
    input.value = '';
    renderGoalsSection(document.querySelector('.content-body'));
    showMenuToast('Task added!');
}

function toggleMenuTask(index) {
    if (index >= 0 && index < window.ventoraTasks.length) {
        window.ventoraTasks[index].completed = !window.ventoraTasks[index].completed;
        localStorage.setItem('ventora_tasks', JSON.stringify(window.ventoraTasks));
        renderGoalsSection(document.querySelector('.content-body'));
    }
}

function deleteMenuTask(index) {
    if (index >= 0 && index < window.ventoraTasks.length) {
        window.ventoraTasks.splice(index, 1);
        localStorage.setItem('ventora_tasks', JSON.stringify(window.ventoraTasks));
        renderGoalsSection(document.querySelector('.content-body'));
        showMenuToast('Task deleted');
    }
}

// Export chat - UPDATED with PDF support
function exportMenuChat() {
    const format = document.getElementById('menu-export-format')?.value || 'txt';
    const includeTimestamps = document.getElementById('menu-include-timestamps')?.checked !== false;
    const includeMetadata = document.getElementById('menu-include-metadata')?.checked !== false;
    const includeFormatting = document.getElementById('menu-include-formatting')?.checked !== false;
    
    if (selectedExportOption === 'all') {
        // Export all conversations
        exportAllConversations(format, includeTimestamps, includeMetadata, includeFormatting);
    } else {
        // Export single conversation
        exportSingleConversation(selectedExportOption, format, includeTimestamps, includeMetadata, includeFormatting);
    }
}

function exportAllConversations(format, includeTimestamps, includeMetadata, includeFormatting) {
    const conversations = JSON.parse(localStorage.getItem('nebula_conversations')) || [];
    
    if (conversations.length === 0) {
        showMenuToast('No conversations to export');
        return;
    }
    
    if (format === 'pdf') {
        showMenuToast('PDF export for multiple conversations coming soon!');
        return;
    }
    
    let content = '';
    let filename = `ventora-all-conversations-${new Date().toISOString().slice(0, 10)}`;
    let mimeType = 'text/plain';
    
    if (includeMetadata) {
        content += `=== Ventora AI - All Conversations ===\n\n`;
        content += `Export Date: ${new Date().toLocaleString()}\n`;
        content += `Total Conversations: ${conversations.length}\n\n`;
    }
    
    conversations.forEach((conv, index) => {
        if (includeMetadata) {
            content += `\n--- Conversation ${index + 1}: ${conv.title} ---\n`;
            content += `Date: ${new Date(conv.updatedAt).toLocaleString()}\n`;
            content += `Messages: ${conv.messages?.length || 0}\n\n`;
        }
        
        conv.messages?.forEach(msg => {
            const role = msg.role === 'user' ? 'You' : 'Ventora AI';
            const time = includeTimestamps ? `[${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ` : '';
            content += `${time}${role}:\n${msg.content}\n\n`;
        });
        
        content += '\n';
    });
    
    if (includeMetadata) {
        content += '\n=== End of Export ===\n';
    }
    
    switch(format) {
        case 'txt':
            filename += '.txt';
            break;
        case 'json':
            content = JSON.stringify({ conversations, exportDate: new Date().toISOString() }, null, 2);
            filename += '.json';
            mimeType = 'application/json';
            break;
        case 'html':
            // Simple HTML export for all conversations
            content = generateAllConversationsHTML(conversations, includeTimestamps, includeMetadata);
            filename += '.html';
            mimeType = 'text/html';
            break;
        case 'markdown':
            filename += '.md';
            break;
    }
    
    downloadFile(content, filename, mimeType);
    showMenuToast(`Exported ${conversations.length} conversations!`);
}

function exportSingleConversation(conversationId, format, includeTimestamps, includeMetadata, includeFormatting) {
    const conversations = JSON.parse(localStorage.getItem('nebula_conversations')) || [];
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
        showMenuToast('No conversation to export');
        return;
    }
    
    let content = '';
    let filename = `ventora-chat-${conversation.id}`;
    let mimeType = 'text/plain';
    
    if (format === 'pdf') {
        generatePDF(conversation, includeTimestamps, includeMetadata, includeFormatting);
        return;
    }
    
    switch(format) {
        case 'txt':
            content = exportConversationAsText(conversation, includeTimestamps, includeMetadata, includeFormatting);
            filename += '.txt';
            break;
        case 'json':
            content = exportConversationAsJSON(conversation);
            filename += '.json';
            mimeType = 'application/json';
            break;
        case 'html':
            content = exportConversationAsHTML(conversation, includeTimestamps, includeMetadata, includeFormatting);
            filename += '.html';
            mimeType = 'text/html';
            break;
        case 'markdown':
            content = exportConversationAsMarkdown(conversation, includeTimestamps, includeMetadata, includeFormatting);
            filename += '.md';
            break;
    }
    
    downloadFile(content, filename, mimeType);
    showMenuToast('Chat exported!');
}

// Export helper functions
function exportConversationAsText(conversation, includeTimestamps, includeMetadata, includeFormatting) {
    let text = '';
    
    if (includeMetadata) {
        text += `=== Ventora AI Conversation ===\n\n`;
        text += `Title: ${conversation.title}\n`;
        text += `Date: ${new Date(conversation.updatedAt).toLocaleString()}\n\n`;
    }
    
    conversation.messages.forEach(msg => {
        const role = msg.role === 'user' ? 'You' : 'Ventora AI';
        const time = includeTimestamps ? `[${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ` : '';
        text += `${time}${role}:\n${msg.content}\n\n`;
    });
    
    if (includeMetadata) {
        text += '\n=== End of Conversation ===\n';
    }
    
    return text;
}

function exportConversationAsJSON(conversation) {
    const exportData = {
        metadata: {
            title: conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            exportDate: new Date().toISOString(),
            model: window.nebulaSettings?.model
        },
        messages: conversation.messages
    };
    
    return JSON.stringify(exportData, null, 2);
}

function exportConversationAsHTML(conversation, includeTimestamps, includeMetadata, includeFormatting) {
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${conversation.title}</title>
    <style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6}
    .message{margin-bottom:20px;padding:15px;border-radius:8px}.user{background:#f0f7ff}
    .ai{background:#f8f9fa}.timestamp{font-size:0.8rem;color:#666}pre{background:#1a1a1a;color:#fff;padding:10px;border-radius:5px}</style></head><body>`;
    
    if (includeMetadata) {
        html += `<h1>${conversation.title}</h1><p><small>${new Date(conversation.updatedAt).toLocaleString()}</small></p><hr>`;
    }
    
    conversation.messages.forEach(msg => {
        const roleClass = msg.role === 'user' ? 'user' : 'ai';
        const roleName = msg.role === 'user' ? 'You' : 'Ventora AI';
        const time = includeTimestamps ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        
        html += `<div class="message ${roleClass}"><strong>${roleName}</strong><br>${msg.content.replace(/\n/g, '<br>')}`;
        if (time) html += `<div class="timestamp">${time}</div>`;
        html += `</div>`;
    });
    
    html += `</body></html>`;
    return html;
}

function exportConversationAsMarkdown(conversation, includeTimestamps, includeMetadata, includeFormatting) {
    let md = '';
    
    if (includeMetadata) {
        md += `# ${conversation.title}\n\n`;
        md += `**Date:** ${new Date(conversation.updatedAt).toLocaleString()}\n\n`;
        md += `---\n\n`;
    }
    
    conversation.messages.forEach(msg => {
        const role = msg.role === 'user' ? '**You**' : '**Ventora AI**';
        const time = includeTimestamps ? `*${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}* ` : '';
        md += `${time}${role}\n\n${msg.content}\n\n---\n\n`;
    });
    
    return md;
}

function generateAllConversationsHTML(conversations, includeTimestamps, includeMetadata) {
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ventora AI Conversations</title>
    <style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}
    .conversation{margin-bottom:40px;border-bottom:2px solid #ddd;padding-bottom:20px}
    .message{margin-bottom:15px;padding:10px;border-radius:5px}.user{background:#f0f7ff}
    .ai{background:#f8f9fa}.timestamp{font-size:0.8rem;color:#666}</style></head><body>
    <h1>Ventora AI Conversations</h1><p><small>Export Date: ${new Date().toLocaleString()}</small></p>`;
    
    conversations.forEach((conv, index) => {
        html += `<div class="conversation"><h2>${index + 1}. ${conv.title}</h2>`;
        html += `<p><small>${new Date(conv.updatedAt).toLocaleString()} • ${conv.messages?.length || 0} messages</small></p>`;
        
        conv.messages?.forEach(msg => {
            const roleClass = msg.role === 'user' ? 'user' : 'ai';
            const roleName = msg.role === 'user' ? 'You' : 'Ventora AI';
            const time = includeTimestamps ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            
            html += `<div class="message ${roleClass}"><strong>${roleName}</strong><br>${msg.content.replace(/\n/g, '<br>')}`;
            if (time) html += `<div class="timestamp">${time}</div>`;
            html += `</div>`;
        });
        
        html += `</div>`;
    });
    
    html += `</body></html>`;
    return html;
}

// PDF generation using jsPDF
function generatePDF(conversation, includeTimestamps, includeMetadata, includeFormatting) {
    // Check if jsPDF is available
    if (typeof jspdf === 'undefined') {
        showMenuToast('PDF export requires jsPDF library. Using HTML export instead.');
        exportSingleConversation(conversation.id, 'html', includeTimestamps, includeMetadata, includeFormatting);
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        let y = 20;
        const lineHeight = 7;
        const margin = 20;
        const pageWidth = doc.internal.pageSize.width;
        const maxWidth = pageWidth - 2 * margin;
        
        // Add title
        doc.setFontSize(16);
        doc.text(conversation.title, margin, y);
        y += 15;
        
        // Add metadata
        if (includeMetadata) {
            doc.setFontSize(10);
            doc.text(`Date: ${new Date(conversation.updatedAt).toLocaleString()}`, margin, y);
            y += 10;
        }
        
        // Add messages
        doc.setFontSize(12);
        
        conversation.messages.forEach(msg => {
            const role = msg.role === 'user' ? 'You' : 'Ventora AI';
            
            // Check if we need a new page
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            
            // Add role
            doc.setFont('helvetica', 'bold');
            let text = role;
            if (includeTimestamps) {
                text += ` [${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]`;
            }
            doc.text(text, margin, y);
            y += lineHeight;
            
            // Add message content
            doc.setFont('helvetica', 'normal');
            const lines = doc.splitTextToSize(msg.content, maxWidth);
            lines.forEach(line => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, margin, y);
                y += lineHeight;
            });
            
            y += lineHeight; // Space between messages
        });
        
        // Save PDF
        doc.save(`ventora-chat-${conversation.id}.pdf`);
        showMenuToast('PDF exported!');
        
    } catch (error) {
        console.error('PDF export error:', error);
        showMenuToast('PDF export failed. Using HTML instead.');
        exportSingleConversation(conversation.id, 'html', includeTimestamps, includeMetadata, includeFormatting);
    }
}

// Download helper
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Clear all data
function showClearDataConfirm() {
    if (confirm('Are you sure? This will delete ALL chat history, settings, goals, and personalization.')) {
        clearAllMenuData();
    }
}

function clearAllMenuData() {
    localStorage.removeItem('nebula_conversations');
    localStorage.removeItem('nebula_settings');
    localStorage.removeItem('nebula_pers');
    localStorage.removeItem('ventora_tasks');
    localStorage.removeItem('ventora_study_notes');
    
    // Reset global variables
    window.personalization = {
        userName: '',
        studyLevel: 'college',
        major: '',
        responseStyle: 'balanced',
        customInstructions: ''
    };
    
    window.nebulaSettings = {
        model: 'groq:general',
        temperature: 0.7,
        maxTokens: 1024
    };
    
    window.ventoraTasks = [];
    window.ventoraNotes = '';
    
    showMenuToast('All data cleared');
    
    // If on a section, refresh it
    if (currentSection) {
        renderSection(currentSection);
    }
    
    // Refresh chat if function exists
    if (typeof createNewConversation === 'function') {
        createNewConversation();
    }
}

// Toast notification
function showMenuToast(message) {
    if (typeof showToast === 'function') {
        showToast(message);
        return;
    }
    
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 122, 255, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        font-size: 0.9rem;
        z-index: 10000;
        animation: toastFade 3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// Preview export
function previewMenuExport() {
    showMenuToast('Preview feature coming soon!');
}

// Setup event listeners
function setupEventListeners() {
    // Close button
    const closeBtn = document.querySelector('.content-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMainMenuPopup);
        // Add touch support
        closeBtn.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.95)';
        });
        closeBtn.addEventListener('touchend', function(e) {
            this.style.transform = '';
        });
    }
    
    // Back button for mobile
    const backBtn = document.querySelector('.content-back');
    if (backBtn) {
        backBtn.addEventListener('click', goBackToMenu);
        // Add touch support
        backBtn.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.95)';
        });
        backBtn.addEventListener('touchend', function(e) {
            this.style.transform = '';
        });
    }
    
    // Close on background click
    const modal = document.getElementById('mainmenu-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeMainMenuPopup();
            }
        });
    }
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal?.classList.contains('active')) {
            closeMainMenuPopup();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && currentSection) {
            // On desktop, just update the menu highlights
            renderMenu();
        }
    });
    
    // Better touch support for menu items
    document.addEventListener('touchstart', function() {}, { passive: true });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initMainMenuPopup);

// Export functions
window.openMainMenuPopup = openMainMenuPopup;
window.closeMainMenuPopup = closeMainMenuPopup;
window.openSection = openSection;
window.selectExportOption = selectExportOption;
