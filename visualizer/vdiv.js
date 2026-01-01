// Ventora Interaction Visualizer - FIXED VERSION
class VentoraVisualizer {
    constructor() {
        this.currentVisualization = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose'
            });
        }
        
        this.isInitialized = true;
    }

    async visualizeContent(content) {
        this.init();
        
        // Check for table patterns
        if (this.detectTable(content)) {
            return this.createTableVisualization(content);
        }
        
        // Check for diet/nutrition patterns
        if (this.detectDietPlan(content)) {
            return this.createDietVisualization(content);
        }
        
        // Check for data patterns (charts)
        if (this.detectChartData(content)) {
            return this.createChartVisualization(content);
        }
        
        // Check for process flows
        if (this.detectProcessFlow(content)) {
            return this.createFlowChart(content);
        }
        
        return null;
    }

    // Table Detection and Creation - IMPROVED
    detectTable(content) {
        const lines = content.split('\n');
        let hasPipeTable = false;
        let hasDashLine = false;
        
        for (let line of lines) {
            if (line.includes('|') && line.trim().startsWith('|')) {
                hasPipeTable = true;
            }
            if (/^[\s|:-]+$/.test(line) && line.includes('-')) {
                hasDashLine = true;
            }
        }
        
        return (hasPipeTable && hasDashLine) || 
               content.match(/^\s*[A-Za-z].*\|.*[A-Za-z]/m) ||
               content.includes('Table:') ||
               content.match(/\d+\.\s+.*\s*-\s*/);
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
                    <button class="viz-btn primary" onclick="window.ventoraVisualizer.exportToPDF('${tableId}', 'table')">
                        <i class="fas fa-file-pdf"></i> Export PDF
                    </button>
                </div>
            </div>
            <div class="data-table-container">
                <table class="data-table" id="${tableId}">
                    <thead>
                        <tr>
                            ${tableData.headers.map(header => `<th>${this.escapeHTML(header)}</th>`).join('')}
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
        
        // Try to parse markdown table
        const tableLines = lines.filter(l => l.includes('|') && !/^[-:|]+$/.test(l));
        
        if (tableLines.length >= 2) {
            // Parse headers (first non-dash line with pipes)
            const headerLine = tableLines[0];
            const headerParts = headerLine.split('|').map(p => p.trim()).filter(p => p);
            
            if (headerParts.length > 0) {
                headers.push(...headerParts);
                
                // Parse data rows (skip separator line)
                for (let i = 1; i < tableLines.length; i++) {
                    const rowLine = tableLines[i];
                    const rowParts = rowLine.split('|').map(p => p.trim()).filter(p => p);
                    
                    if (rowParts.length === headers.length) {
                        rows.push(rowParts);
                    } else if (rowParts.length > headers.length) {
                        // Sometimes there are extra pipes at ends
                        const trimmedParts = rowParts.slice(0, headers.length);
                        if (trimmedParts.length === headers.length) {
                            rows.push(trimmedParts);
                        }
                    }
                }
            }
        }
        
        // If no markdown table found, try to extract structured data
        if (headers.length === 0) {
            this.extractStructuredData(content, headers, rows);
        }
        
        return { headers, rows };
    }

    extractStructuredData(content, headers, rows) {
        const lines = content.split('\n');
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            // Pattern: "Key: Value"
            const kvMatch = trimmed.match(/^([^:]+):\s*(.+)$/);
            if (kvMatch) {
                if (headers.length === 0) {
                    headers.push('Item', 'Value');
                }
                rows.push([kvMatch[1].trim(), kvMatch[2].trim()]);
            }
            
            // Pattern: "• Item - Description"
            const bulletMatch = trimmed.match(/[•\-]\s*([^-:]+)[-:]\s*(.+)$/);
            if (bulletMatch) {
                if (headers.length === 0) {
                    headers.push('Item', 'Description');
                }
                rows.push([bulletMatch[1].trim(), bulletMatch[2].trim()]);
            }
            
            // Pattern: "1. Item - Description"
            const numberedMatch = trimmed.match(/^\d+\.\s*([^-:]+)[-:]\s*(.+)$/);
            if (numberedMatch) {
                if (headers.length === 0) {
                    headers.push('#', 'Description');
                }
                rows.push([numberedMatch[1].trim(), numberedMatch[2].trim()]);
            }
        });
    }

    // Diet Plan Visualization - IMPROVED
    detectDietPlan(content) {
        const dietWords = ['breakfast', 'lunch', 'dinner', 'snack', 'meal', 'calories', 'protein', 'carbs', 'fat', 'nutrition', 'diet'];
        const lower = content.toLowerCase();
        
        // Must contain at least 2 diet-related words
        const matches = dietWords.filter(word => lower.includes(word));
        return matches.length >= 2;
    }

    createDietVisualization(content) {
        const meals = this.parseDietData(content);
        if (meals.length === 0) return '';
        
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
                    <button class="viz-btn primary" onclick="window.ventoraVisualizer.exportToPDF('${vizId}', 'diet')">
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
            const trimmed = line.trim();
            if (!trimmed) return;
            
            const lower = trimmed.toLowerCase();
            
            // Check for meal headers
            if (lower.includes('breakfast') || lower.includes('lunch') || 
                lower.includes('dinner') || lower.includes('snack') ||
                lower.match(/meal\s+\d+/)) {
                
                if (currentMeal && currentMeal.items.length > 0) {
                    meals.push(currentMeal);
                }
                
                // Extract meal name
                let mealName = 'Meal';
                if (lower.includes('breakfast')) mealName = 'Breakfast';
                else if (lower.includes('lunch')) mealName = 'Lunch';
                else if (lower.includes('dinner')) mealName = 'Dinner';
                else if (lower.includes('snack')) mealName = 'Snack';
                else if (lower.match(/meal\s+\d+/)) {
                    const match = lower.match(/meal\s+(\d+)/);
                    mealName = match ? `Meal ${match[1]}` : 'Meal';
                }
                
                currentMeal = {
                    time: mealName,
                    items: [],
                    calories: 0
                };
            }
            
            // Parse food items (look for patterns like "Food - 200 cal, 20g protein")
            if (currentMeal && (trimmed.includes('-') || trimmed.includes(':'))) {
                const item = this.parseFoodItem(trimmed);
                if (item.name && item.calories > 0) {
                    currentMeal.items.push(item);
                    currentMeal.calories += item.calories;
                }
            }
        });
        
        // Add the last meal
        if (currentMeal && currentMeal.items.length > 0) {
            meals.push(currentMeal);
        }
        
        // If no meals found, try to extract any food items
        if (meals.length === 0) {
            const extracted = this.extractFoodItems(content);
            if (extracted.length > 0) {
                meals.push({
                    time: 'Meal',
                    items: extracted,
                    calories: extracted.reduce((sum, item) => sum + item.calories, 0)
                });
            }
        }
        
        return meals;
    }

    parseFoodItem(text) {
        // Patterns: "Chicken breast - 200 calories, 30g protein"
        //           "Rice (100g): 130 cal, 2g protein, 28g carbs"
        
        const item = {
            name: '',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };
        
        // Extract name (everything before first dash or colon)
        const nameMatch = text.match(/^([^:-]+)/);
        if (nameMatch) {
            item.name = nameMatch[1].trim();
        }
        
        // Extract calories
        const calMatch = text.match(/(\d+)\s*cal/);
        if (calMatch) item.calories = parseInt(calMatch[1]);
        
        // Extract protein
        const protMatch = text.match(/(\d+)\s*g?\s*prot/);
        if (protMatch) item.protein = parseInt(protMatch[1]);
        
        // Extract carbs
        const carbMatch = text.match(/(\d+)\s*g?\s*carb/);
        if (carbMatch) item.carbs = parseInt(carbMatch[1]);
        
        // Extract fat
        const fatMatch = text.match(/(\d+)\s*g?\s*fat/);
        if (fatMatch) item.fat = parseInt(fatMatch[1]);
        
        return item;
    }

    extractFoodItems(content) {
        const items = [];
        const lines = content.split('\n');
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed && (trimmed.includes('cal') || trimmed.includes('protein'))) {
                const item = this.parseFoodItem(trimmed);
                if (item.name && item.calories > 0) {
                    items.push(item);
                }
            }
        });
        
        return items;
    }

    calculateTotals(meals) {
        const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        
        meals.forEach(meal => {
            meal.items.forEach(item => {
                totals.calories += item.calories;
                totals.protein += item.protein;
                totals.carbs += item.carbs;
                totals.fat += item.fat;
            });
        });
        
        return totals;
    }

    // Chart Data - IMPROVED
    detectChartData(content) {
        return content.includes('chart') || 
               content.match(/\d+%\s/g) ||
               content.includes('graph') ||
               content.match(/data\s*:/i) ||
               content.match(/\d+\s*[/\\]\s*\d+/);
    }

    createChartVisualization(content) {
        const data = this.extractChartData(content);
        const vizId = 'chart-' + Date.now();
        
        const html = `
        <div class="visualizer-container">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-chart-bar"></i>
                    Data Visualization
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyText('${vizId}')">
                        <i class="fas fa-copy"></i> Copy Data
                    </button>
                    <button class="viz-btn primary" onclick="window.ventoraVisualizer.exportToPDF('${vizId}', 'chart')">
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
        
        // Render chart
        setTimeout(() => {
            if (typeof Chart !== 'undefined') {
                this.renderChart(data, `chart-canvas-${vizId}`);
            }
        }, 100);
        
        return html;
    }

    extractChartData(content) {
        // Extract numbers and create simple data
        const numbers = content.match(/\d+(\.\d+)?/g) || [];
        const limitedNumbers = numbers.slice(0, 8).map(n => parseFloat(n));
        
        // Create labels
        const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, limitedNumbers.length);
        
        return {
            labels: labels,
            values: limitedNumbers
        };
    }

    renderChart(data, canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        // Destroy existing chart if any
        if (ctx.chartInstance) {
            ctx.chartInstance.destroy();
        }
        
        ctx.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Values',
                    data: data.values,
                    backgroundColor: 'rgba(0, 122, 255, 0.8)',
                    borderColor: 'rgba(0, 122, 255, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20, 20, 20, 0.9)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(0, 122, 255, 0.5)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'white',
                            font: {
                                size: 11
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'white',
                            font: {
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }

    // Flow Chart
    detectProcessFlow(content) {
        return (content.includes('step') && content.includes('process')) ||
               content.includes('flowchart') ||
               content.match(/step\s+\d+/i);
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
                    <button class="viz-btn primary" onclick="window.ventoraVisualizer.exportToPDF('${vizId}', 'flow')">
                        <i class="fas fa-file-pdf"></i> Export PDF
                    </button>
                </div>
            </div>
            <div id="${vizId}">
                <div class="flow-chart">
                    <div class="mermaid">
                        graph TD
                        A[Start] --> B[Step 1]
                        B --> C[Decision]
                        C -->|Yes| D[Step 2]
                        C -->|No| E[Alternative]
                        D --> F[Complete]
                        E --> F
                    </div>
                </div>
            </div>
        </div>`;
    }

    // ========== FIXED COPY FUNCTIONS ==========
    
    async copyTable(tableId) {
        try {
            const table = document.getElementById(tableId);
            if (!table) {
                this.showToast('Table not found');
                return;
            }
            
            // Extract table data
            const rows = table.querySelectorAll('tr');
            let text = '';
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                const rowText = Array.from(cells).map(cell => cell.textContent.trim()).join('\t');
                text += rowText + '\n';
            });
            
            await navigator.clipboard.writeText(text);
            this.showToast('Table copied to clipboard!');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Failed to copy table');
        }
    }

    async copyText(elementId) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                this.showToast('Element not found');
                return;
            }
            
            // Get all text content
            let text = '';
            
            // Handle different types of content
            if (element.querySelector('table')) {
                // For tables
                const table = element.querySelector('table');
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('th, td');
                    text += Array.from(cells).map(cell => cell.textContent.trim()).join('\t') + '\n';
                });
            } else if (element.querySelector('.diet-card')) {
                // For diet plans
                const cards = element.querySelectorAll('.diet-card');
                cards.forEach(card => {
                    const time = card.querySelector('.meal-time').textContent;
                    const calories = card.querySelector('.meal-calories').textContent;
                    text += `${time} (${calories}):\n`;
                    
                    const items = card.querySelectorAll('.diet-item');
                    items.forEach(item => {
                        const name = item.querySelector('.item-name').textContent;
                        const macros = item.querySelector('.item-macros').textContent;
                        text += `  • ${name} ${macros}\n`;
                    });
                    text += '\n';
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

    // ========== FIXED PDF EXPORT ==========
    
    async exportToPDF(elementId, type) {
        try {
            const { jsPDF } = window.jspdf;
            
            if (!jsPDF || typeof html2canvas === 'undefined') {
                this.showToast('PDF libraries not loaded');
                return;
            }
            
            const element = document.getElementById(elementId);
            if (!element) {
                this.showToast('Element not found');
                return;
            }
            
            // Create canvas from element
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#0a0a0a',
                useCORS: true,
                logging: false,
                allowTaint: true
            });
            
            // Create PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Calculate dimensions
            const imgWidth = 180;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Add image to PDF
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight);
            
            // Add header
            pdf.setFontSize(16);
            pdf.setTextColor(0, 122, 255);
            pdf.text(`Ventora AI - ${this.capitalize(type)} Export`, 105, 10, { align: 'center' });
            
            // Add footer
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });
            
            // Save PDF
            pdf.save(`ventora-${type}-${Date.now()}.pdf`);
            this.showToast('PDF exported successfully!');
            
        } catch (err) {
            console.error('PDF export failed:', err);
            this.showToast('Failed to export PDF');
        }
    }

    // ========== UTILITY FUNCTIONS ==========
    
    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    showToast(message) {
        // Remove existing toast
        const existing = document.querySelector('.viz-toast');
        if (existing) existing.remove();
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'viz-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize
window.ventoraVisualizer = new VentoraVisualizer();
