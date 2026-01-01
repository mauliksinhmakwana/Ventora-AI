// Ventora Interaction Visualizer - ON DEMAND VERSION
class VentoraVisualizer {
    constructor() {
        this.isInitialized = false;
        this.visualizationCache = new Map();
    }

    init() {
        if (this.isInitialized) return;
        
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                fontFamily: 'inherit'
            });
        }
        
        this.isInitialized = true;
    }

    // Main function - returns visualization HTML with triggers
    createVisualizationTriggers(content, messageId) {
        this.init();
        
        const vizTypes = this.detectVisualizationTypes(content);
        
        if (vizTypes.length === 0) return '';
        
        // Store content for later use
        this.visualizationCache.set(messageId, {
            content: content,
            types: vizTypes,
            timestamp: Date.now()
        });
        
        // Create trigger buttons
        return this.createTriggerHTML(vizTypes, messageId);
    }

    detectVisualizationTypes(content) {
        const types = [];
        
        if (this.detectTable(content)) types.push('table');
        if (this.detectDietPlan(content)) types.push('diet');
        if (this.detectChemicalStructure(content)) types.push('chemical');
        if (this.detectChartData(content)) types.push('chart');
        if (this.detectProcessFlow(content)) types.push('flow');
        
        return types;
    }

    createTriggerHTML(vizTypes, messageId) {
        const buttons = vizTypes.map(type => {
            const icons = {
                'table': 'fa-table',
                'diet': 'fa-apple-alt',
                'chemical': 'fa-atom',
                'chart': 'fa-chart-bar',
                'flow': 'fa-project-diagram'
            };
            
            const labels = {
                'table': 'Show Table',
                'diet': 'Visualize Diet',
                'chemical': 'View Structure',
                'chart': 'Show Chart',
                'flow': 'View Flowchart'
            };
            
            return `
                <button class="viz-trigger-btn" onclick="window.ventoraVisualizer.showVisualization('${type}', '${messageId}')">
                    <i class="fas ${icons[type]}"></i>
                    ${labels[type]}
                </button>
            `;
        }).join('');
        
        return `
            <div class="viz-toolbar" id="viz-toolbar-${messageId}">
                ${buttons}
                <div style="font-size: 0.7rem; color: var(--text-secondary); margin-left: auto;">
                    <i class="fas fa-eye"></i> Visualize
                </div>
            </div>
        `;
    }

    // Show visualization on demand
    showVisualization(type, messageId) {
        const cached = this.visualizationCache.get(messageId);
        if (!cached) return;
        
        const content = cached.content;
        let vizHTML = '';
        
        switch(type) {
            case 'table':
                vizHTML = this.createTableVisualization(content);
                break;
            case 'diet':
                vizHTML = this.createDietVisualization(content);
                break;
            case 'chemical':
                vizHTML = this.createChemicalVisualization(content);
                break;
            case 'chart':
                vizHTML = this.createChartVisualization(content);
                break;
            case 'flow':
                vizHTML = this.createFlowChart(content);
                break;
        }
        
        if (vizHTML) {
            this.displayVisualization(vizHTML, messageId, type);
        }
    }

    displayVisualization(html, messageId, type) {
        // Remove existing visualization for this message
        const existingViz = document.getElementById(`viz-${messageId}`);
        if (existingViz) existingViz.remove();
        
        // Create visualization container
        const vizContainer = document.createElement('div');
        vizContainer.id = `viz-${messageId}`;
        vizContainer.innerHTML = html;
        
        // Insert after the message
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.parentNode.insertBefore(vizContainer, messageElement.nextSibling);
        } else {
            // Fallback: insert at end of chat
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) chatContainer.appendChild(vizContainer);
        }
        
        // Scroll to visualization
        vizContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Update button state
        const toolbar = document.getElementById(`viz-toolbar-${messageId}`);
        if (toolbar) {
            const buttons = toolbar.querySelectorAll('.viz-trigger-btn');
            buttons.forEach(btn => {
                if (btn.textContent.includes(type)) {
                    btn.innerHTML = '<i class="fas fa-check"></i> Visible';
                    btn.style.background = 'rgba(52, 199, 89, 0.1)';
                    btn.style.borderColor = 'rgba(52, 199, 89, 0.3)';
                    btn.style.color = '#34c759';
                }
            });
        }
    }

    // Table Detection
    detectTable(content) {
        const lines = content.split('\n');
        let pipeCount = 0;
        let dashLineCount = 0;
        
        lines.forEach(line => {
            if (line.includes('|')) pipeCount++;
            if (/^[\s|:-]+$/.test(line)) dashLineCount++;
        });
        
        return (pipeCount >= 2 && dashLineCount >= 1) || 
               content.includes('TABLE:') ||
               content.match(/^\s*\d+\.\s+.*\s*-\s*/m);
    }

    createTableVisualization(content) {
        const tableData = this.extractTableData(content);
        if (!tableData.headers || tableData.headers.length === 0) return '';
        
        const tableId = 'table-' + Date.now();
        
        return `
        <div class="visualizer-container">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-table"></i>
                    Data Table
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyTable('${tableId}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="viz-btn primary" onclick="window.ventoraVisualizer.exportToPDF('table', '${tableId}')">
                        <i class="fas fa-file-pdf"></i> Export PDF
                    </button>
                </div>
            </div>
            <div class="data-table-container">
                <table class="data-table" id="${tableId}">
                    <thead>
                        <tr>
                            ${tableData.headers.map(h => `<th>${this.escapeHTML(h)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableData.rows.map(row => `
                            <tr>
                                ${row.map(cell => `<td>${this.escapeHTML(cell)}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    extractTableData(content) {
        const lines = content.split('\n').filter(l => l.trim());
        const headers = [];
        const rows = [];
        
        // Try markdown table
        const tableLines = lines.filter(l => l.includes('|'));
        if (tableLines.length >= 3) {
            // First line is headers
            const headerLine = tableLines[0];
            headers.push(...headerLine.split('|')
                .map(h => h.trim())
                .filter(h => h && !/^[-:]+$/.test(h)));
            
            // Data rows start from line 3
            for (let i = 2; i < tableLines.length; i++) {
                const rowData = tableLines[i].split('|')
                    .map(cell => cell.trim())
                    .filter((cell, idx) => idx > 0 && idx <= headers.length);
                if (rowData.length === headers.length) {
                    rows.push(rowData);
                }
            }
        }
        
        // If no markdown table, try structured data
        if (headers.length === 0) {
            lines.forEach(line => {
                // Pattern: "Key: Value"
                const kvMatch = line.match(/^([^:]+):\s*(.+)$/);
                if (kvMatch) {
                    if (headers.length === 0) {
                        headers.push('Item', 'Details');
                    }
                    rows.push([kvMatch[1].trim(), kvMatch[2].trim()]);
                }
                
                // Pattern: "• Item - Description"
                const bulletMatch = line.match(/[•\-]\s*([^-]+)\s*-\s*(.+)$/);
                if (bulletMatch) {
                    if (headers.length === 0) {
                        headers.push('Item', 'Description');
                    }
                    rows.push([bulletMatch[1].trim(), bulletMatch[2].trim()]);
                }
            });
        }
        
        return { headers, rows };
    }

    // Diet Plan Detection
    detectDietPlan(content) {
        const dietWords = ['breakfast', 'lunch', 'dinner', 'snack', 'meal', 'calories', 'protein', 'carbs', 'fat', 'nutrition'];
        const lower = content.toLowerCase();
        return dietWords.some(word => lower.includes(word)) && 
               (lower.includes('plan') || lower.includes('diet'));
    }

    createDietVisualization(content) {
        const meals = this.parseDietData(content);
        const totals = this.calculateTotals(meals);
        const vizId = 'diet-' + Date.now();
        
        return `
        <div class="visualizer-container">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-apple-alt"></i>
                    Diet Plan
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyText('${vizId}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="viz-btn primary" onclick="window.ventoraVisualizer.exportToPDF('diet', '${vizId}')">
                        <i class="fas fa-file-pdf"></i> Export PDF
                    </button>
                </div>
            </div>
            
            <div id="${vizId}">
                <div class="nutrition-summary">
                    <div class="nutrition-item">
                        <div class="nutrition-value">${totals.calories}</div>
                        <div class="nutrition-label">Calories</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${totals.protein}g</div>
                        <div class="nutrition-label">Protein</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${totals.carbs}g</div>
                        <div class="nutrition-label">Carbs</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${totals.fat}g</div>
                        <div class="nutrition-label">Fat</div>
                    </div>
                </div>
                
                <div class="diet-visualization">
                    ${meals.map(meal => `
                        <div class="diet-card">
                            <div class="diet-card-header">
                                <div class="meal-time">${meal.time}</div>
                                <div class="meal-calories">${meal.calories} cal</div>
                            </div>
                            <div class="diet-items">
                                ${meal.items.map(item => `
                                    <div class="diet-item">
                                        <div class="item-name">${item.name}</div>
                                        <div class="item-macros">P${item.protein} C${item.carbs} F${item.fat}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="chart-container">
                <canvas id="diet-chart-${vizId}"></canvas>
            </div>
        </div>`;
    }

    parseDietData(content) {
        const meals = [];
        const lines = content.split('\n');
        let currentMeal = null;
        
        lines.forEach(line => {
            const trimmed = line.trim().toLowerCase();
            
            // Check for meal headers
            if (trimmed.includes('breakfast') || trimmed.match(/meal\s*\d+/)) {
                if (currentMeal) meals.push(currentMeal);
                currentMeal = {
                    time: this.capitalize(trimmed.split(':')[0] || trimmed),
                    items: [],
                    calories: 0
                };
            }
            
            // Parse food items
            if (currentMeal && (trimmed.includes('-') || trimmed.includes(':'))) {
                const parts = trimmed.split(/[-:]/);
                if (parts.length >= 2) {
                    const item = {
                        name: parts[0].trim(),
                        calories: this.extractNumber(parts[1], 'cal'),
                        protein: this.extractNumber(parts[1], 'prot'),
                        carbs: this.extractNumber(parts[1], 'carb'),
                        fat: this.extractNumber(parts[1], 'fat')
                    };
                    
                    if (item.name && !item.name.match(/^\d/)) {
                        currentMeal.items.push(item);
                        currentMeal.calories += item.calories;
                    }
                }
            }
        });
        
        if (currentMeal) meals.push(currentMeal);
        
        // If no meals found, create sample
        if (meals.length === 0) {
            return [
                {
                    time: "Sample Meal",
                    calories: 500,
                    items: [
                        { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 4 },
                        { name: "Brown Rice", calories: 215, protein: 5, carbs: 45, fat: 2 }
                    ]
                }
            ];
        }
        
        return meals;
    }

    // Chemical Structure - IMPROVED
    detectChemicalStructure(content) {
        const chemPatterns = [
            /C\d*H\d*[NO]?\d*/i,
            /molecular formula/i,
            /chemical formula/i,
            /SMILES:/i,
            /structural formula/i
        ];
        return chemPatterns.some(pattern => pattern.test(content));
    }

    createChemicalVisualization(content) {
        // Extract chemical formula
        const formulaMatch = content.match(/(C\d*H\d*[NOPS]?\d*)/i) || 
                            content.match(/([A-Z][a-z]?\d*)/g);
        
        let formula = 'Unknown';
        if (formulaMatch) {
            formula = Array.isArray(formulaMatch) ? formulaMatch[0] : formulaMatch;
        }
        
        const vizId = 'chem-' + Date.now();
        const structures = this.generateChemicalStructures(formula);
        
        return `
        <div class="visualizer-container">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-atom"></i>
                    Chemical Structure
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyText('${vizId}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="viz-btn primary" onclick="window.ventoraVisualizer.exportToPDF('chemical', '${vizId}')">
                        <i class="fas fa-file-pdf"></i> Export PDF
                    </button>
                </div>
            </div>
            
            <div id="${vizId}">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: #4dabf7; margin-bottom: 10px;">
                        ${formula}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        Molecular Formula
                    </div>
                </div>
                
                <div class="chemical-structure">
                    <div style="font-family: 'Courier New', monospace; font-size: 1rem; line-height: 1.5; white-space: pre;">
${structures.ascii}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 20px;">
                    <div class="nutrition-item">
                        <div class="nutrition-value">${formula}</div>
                        <div class="nutrition-label">Formula</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${structures.weight}</div>
                        <div class="nutrition-label">MW (g/mol)</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${structures.atoms.C || 0}</div>
                        <div class="nutrition-label">C Atoms</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${structures.atoms.H || 0}</div>
                        <div class="nutrition-label">H Atoms</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(0, 122, 255, 0.05); border-radius: 8px;">
                    <div style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 5px;">
                        <strong>Chemical Properties:</strong>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        • ${structures.type} compound<br>
                        • Molecular weight: ${structures.weight} g/mol<br>
                        • Atoms: ${structures.totalAtoms} total
                    </div>
                </div>
            </div>
        </div>`;
    }

    generateChemicalStructures(formula) {
        // Different structures for different formulas
        const structures = {
            'CH4': {
                ascii: `     H
     |
  H--C--H
     |
     H`,
                weight: 16,
                atoms: { C: 1, H: 4 },
                type: 'Alkane',
                totalAtoms: 5
            },
            'C2H6': {
                ascii: `H   H
 \\ /
  C
 / \\
H   H
     |
     C
    / \\
   H   H`,
                weight: 30,
                atoms: { C: 2, H: 6 },
                type: 'Ethane',
                totalAtoms: 8
            },
            'C6H12O6': {
                ascii: `    CHO
    |
H--C--OH
|     |
HO--C--H
    |
    CH2OH`,
                weight: 180,
                atoms: { C: 6, H: 12, O: 6 },
                type: 'Glucose',
                totalAtoms: 24
            },
            'C9H8O4': {
                ascii: `    O
    ||
    C
   / \\
  O   C6H4
      |
     COOH`,
                weight: 180,
                atoms: { C: 9, H: 8, O: 4 },
                type: 'Aspirin',
                totalAtoms: 21
            }
        };
        
        // Return matching structure or default
        const match = Object.keys(structures).find(f => 
            formula.toUpperCase().includes(f) || f.includes(formula.toUpperCase())
        );
        
        if (match) return structures[match];
        
        // Default structure
        return {
            ascii: `    O
    ||
    C
   / \\
  H   R`,
            weight: this.calculateMolecularWeight(formula),
            atoms: this.countAtoms(formula),
            type: 'Organic Compound',
            totalAtoms: Object.values(this.countAtoms(formula)).reduce((a, b) => a + b, 0)
        };
    }

    // Chart and Flow functions (keep similar to before but improved)
    detectChartData(content) {
        return content.includes('data:') || 
               content.match(/\d+%\s/g) || 
               content.includes('chart') ||
               content.match(/values?\s*:/i);
    }

    createChartVisualization(content) {
        const data = this.extractChartData(content);
        const vizId = 'chart-' + Date.now();
        
        const html = `
        <div class="visualizer-container">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-chart-bar"></i>
                    Data Chart
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyText('${vizId}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="viz-btn primary" onclick="window.ventoraVisualizer.exportToPDF('chart', '${vizId}')">
                        <i class="fas fa-file-pdf"></i> Export PDF
                    </button>
                </div>
            </div>
            <div id="${vizId}">
                <div class="chart-container">
                    <canvas id="chart-canvas-${vizId}"></canvas>
                </div>
            </div>
        </div>`;
        
        setTimeout(() => this.renderChart(data, `chart-canvas-${vizId}`), 100);
        return html;
    }

    detectProcessFlow(content) {
        return content.includes('step') && 
               (content.includes('process') || content.includes('flow'));
    }

    createFlowChart(content) {
        const vizId = 'flow-' + Date.now();
        
        return `
        <div class="visualizer-container">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-project-diagram"></i>
                    Process Flow
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyText('${vizId}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="viz-btn primary" onclick="window.ventoraVisualizer.exportToPDF('flow', '${vizId}')">
                        <i class="fas fa-file-pdf"></i> Export PDF
                    </button>
                </div>
            </div>
            <div id="${vizId}">
                <div class="flow-chart">
                    <div class="mermaid">
                        graph TD
                        A[Start Process] --> B[First Step]
                        B --> C[Decision Point]
                        C -->|Yes| D[Next Step]
                        C -->|No| E[Alternative]
                        D --> F[Final Step]
                        E --> F
                        F --> G[End Process]
                    </div>
                </div>
            </div>
        </div>`;
    }

    // Utility Functions
    extractNumber(text, type) {
        const patterns = {
            'cal': /(\d+)\s*cal/,
            'prot': /(\d+)\s*g?\s*prot?/i,
            'carb': /(\d+)\s*g?\s*carb?/i,
            'fat': /(\d+)\s*g?\s*fat/i
        };
        
        const match = text.match(patterns[type]);
        return match ? parseInt(match[1]) : 0;
    }

    calculateTotals(meals) {
        return meals.reduce((totals, meal) => {
            meal.items.forEach(item => {
                totals.calories += item.calories;
                totals.protein += item.protein;
                totals.carbs += item.carbs;
                totals.fat += item.fat;
            });
            return totals;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    calculateMolecularWeight(formula) {
        const weights = { C: 12, H: 1, O: 16, N: 14, S: 32, P: 31 };
        let total = 0;
        
        formula.replace(/([CHONSP])(\d*)/gi, (match, element, count) => {
            const num = count ? parseInt(count) : 1;
            total += (weights[element.toUpperCase()] || 0) * num;
        });
        
        return total;
    }

    countAtoms(formula) {
        const atoms = {};
        formula.replace(/([CHONSP])(\d*)/gi, (match, element, count) => {
            const key = element.toUpperCase();
            const num = count ? parseInt(count) : 1;
            atoms[key] = (atoms[key] || 0) + num;
        });
        return atoms;
    }

    // FIXED: Copy Function
    async copyText(elementId) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                this.showToast('Element not found');
                return;
            }
            
            // Get text content
            let text = '';
            
            if (element.querySelector('table')) {
                // For tables
                const table = element.querySelector('table');
                const rows = Array.from(table.querySelectorAll('tr'));
                rows.forEach(row => {
                    const cells = Array.from(row.querySelectorAll('th, td'));
                    text += cells.map(cell => cell.textContent.trim()).join('\t') + '\n';
                });
            } else {
                // For other content
                text = element.innerText || element.textContent;
            }
            
            await navigator.clipboard.writeText(text.trim());
            this.showToast('Copied to clipboard!');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Failed to copy');
        }
    }

    // FIXED: Export to PDF with better formatting
    async exportToPDF(type, elementId) {
        try {
            const { jsPDF } = window.jspdf;
            const element = document.getElementById(elementId);
            
            if (!element) {
                this.showToast('Element not found');
                return;
            }
            
            if (typeof html2canvas === 'undefined') {
                this.showToast('PDF export requires html2canvas');
                return;
            }
            
            // Create PDF
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Add header
            doc.setFontSize(16);
            doc.setTextColor(0, 122, 255);
            doc.text('Ventora AI - Visualization', 20, 20);
            
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text('Generated: ' + new Date().toLocaleString(), 20, 28);
            
            // Create canvas from element
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#0a0a0a',
                useCORS: true
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Add image to PDF
            doc.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
            
            // Add footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('ventora.ai - Medical Information Assistant', 105, 290, { align: 'center' });
            
            // Save PDF
            doc.save(`ventora-${type}-${Date.now()}.pdf`);
            this.showToast('PDF exported successfully!');
            
        } catch (err) {
            console.error('PDF export failed:', err);
            this.showToast('Failed to export PDF');
        }
    }

    extractChartData(content) {
        // Extract numbers from content
        const numbers = content.match(/\d+(\.\d+)?/g) || ['10', '20', '30', '40', '50'];
        const labels = ['A', 'B', 'C', 'D', 'E'];
        
        return {
            labels: labels.slice(0, Math.min(5, numbers.length)),
            values: numbers.slice(0, 5).map(n => parseFloat(n))
        };
    }

    renderChart(data, canvasId) {
        if (typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Values',
                    data: data.values,
                    backgroundColor: 'rgba(0, 122, 255, 0.8)',
                    borderColor: 'rgba(0, 122, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'white' }
                    }
                }
            }
        });
    }

    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        let toast = document.querySelector('.viz-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'viz-toast';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// Initialize global instance
window.ventoraVisualizer = new VentoraVisualizer();
