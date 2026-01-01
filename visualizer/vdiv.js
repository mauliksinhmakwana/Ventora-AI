// Ventora Interaction Visualizer
class VentoraVisualizer {
    constructor() {
        this.currentVisualization = null;
        this.isInitialized = false;
        this.exportQueue = [];
    }

    init() {
        if (this.isInitialized) return;
        
        // Initialize mermaid
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                fontFamily: 'inherit'
            });
        }
        
        // Initialize export tools when needed
        this.initExportTools();
        
        this.isInitialized = true;
        console.log('Ventora Visualizer initialized');
    }

    initExportTools() {
        // We'll load export libraries on demand
        this.exportLibraries = {
            jsPDF: false,
            html2canvas: false,
            xlsx: false
        };
    }

    // Load export library dynamically
    async loadExportLibrary(libraryName) {
        if (libraryName === 'jspdf' && !window.jspdf) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            this.exportLibraries.jsPDF = true;
        }
        if (libraryName === 'html2canvas' && !window.html2canvas) {
            await this.loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js');
            this.exportLibraries.html2canvas = true;
        }
        if (libraryName === 'xlsx' && !window.XLSX) {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
            this.exportLibraries.xlsx = true;
        }
    }

    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Main function to detect and create visualizations
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
        
        // Check for chemical structures (removed as requested)
        // if (this.detectChemicalStructure(content)) {
        //     return this.createChemicalVisualization(content);
        // }
        
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

    // Table Detection and Creation
    detectTable(content) {
        const tablePatterns = [
            /\|\s*[^\|]+\s*\|/g, // Markdown tables
            /\n-{3,}\n/, // Separator lines
            /Row\s*\d+:/i,
            /Column\s*[A-Z]/i,
            /(?:^|\n)[A-Za-z]+\s*\|\s*[^\n]+\n[-|\s]+\n/
        ];
        return tablePatterns.some(pattern => pattern.test(content));
    }

    createTableVisualization(content) {
        const rows = content.split('\n').filter(line => line.trim());
        
        // Try to parse markdown table
        if (content.includes('|')) {
            const lines = rows.filter(line => line.includes('|'));
            if (lines.length >= 2) {
                const headers = lines[0].split('|').map(h => h.trim()).filter(h => h);
                const dataRows = lines.slice(2).map(line => 
                    line.split('|').map(cell => cell.trim()).filter((_, i) => i > 0 && i < headers.length + 1)
                );
                
                return this.generateTableHTML(headers, dataRows);
            }
        }
        
        // Try to parse structured data
        const structuredData = this.parseStructuredData(content);
        if (structuredData.headers && structuredData.rows) {
            return this.generateTableHTML(structuredData.headers, structuredData.rows);
        }
        
        return null;
    }

    parseStructuredData(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = [];
        const rows = [];
        
        lines.forEach(line => {
            // Pattern: "Key: Value"
            const keyValueMatch = line.match(/^([^:]+):\s*(.+)$/);
            if (keyValueMatch) {
                if (headers.length === 0) {
                    headers.push('Property', 'Value');
                }
                rows.push([keyValueMatch[1].trim(), keyValueMatch[2].trim()]);
            }
            
            // Pattern: "Item - Description"
            const itemMatch = line.match(/^([^-]+)\s*-\s*(.+)$/);
            if (itemMatch) {
                if (headers.length === 0) {
                    headers.push('Item', 'Description');
                }
                rows.push([itemMatch[1].trim(), itemMatch[2].trim()]);
            }
        });
        
        return { headers, rows };
    }

    generateTableHTML(headers, rows) {
        const tableId = 'viz-table-' + Date.now();
        const vizId = 'table-viz-' + Date.now();
        
        let html = `
        <div class="visualizer-container" id="${vizId}">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-table"></i>
                    Data Table
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyTable('${tableId}')" title="Copy to Clipboard">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <div class="export-dropdown">
                        <button class="viz-btn primary export-toggle" title="Export Options">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <div class="export-menu">
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsPDF('${vizId}')">
                                <i class="fas fa-file-pdf"></i> PDF
                            </button>
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsExcel('${vizId}')">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsImage('${vizId}')">
                                <i class="fas fa-image"></i> Image
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="data-table-container">
                <table class="data-table" id="${tableId}">
                    <thead>
                        <tr>
                            ${headers.map(header => `<th>${this.escapeHTML(header)}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `
                            <tr>
                                ${row.map(cell => `<td>${this.escapeHTML(cell)}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="table-footer">
                <span>${rows.length} rows × ${headers.length} columns</span>
                <span class="table-timestamp">Generated ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        </div>`;
        
        return html;
    }

    // Diet Plan Visualization
    detectDietPlan(content) {
        const dietKeywords = [
            'breakfast', 'lunch', 'dinner', 'snack', 'meal',
            'calories', 'protein', 'carbs', 'fat', 'nutrition',
            'diet plan', 'meal plan', 'macros', 'calorie'
        ];
        
        const lowerContent = content.toLowerCase();
        return dietKeywords.some(keyword => lowerContent.includes(keyword));
    }

    createDietVisualization(content) {
        // Parse meal information
        const meals = this.parseMealData(content);
        const totals = this.calculateNutritionTotals(meals);
        
        const vizId = 'diet-viz-' + Date.now();
        
        let html = `
        <div class="visualizer-container" id="${vizId}">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-apple-alt"></i>
                    Diet Plan Visualization
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyDietPlan('${vizId}')" title="Copy to Clipboard">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <div class="export-dropdown">
                        <button class="viz-btn primary export-toggle" title="Export Options">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <div class="export-menu">
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsPDF('${vizId}')">
                                <i class="fas fa-file-pdf"></i> PDF
                            </button>
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsExcel('${vizId}')">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsImage('${vizId}')">
                                <i class="fas fa-image"></i> Image
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Nutrition Summary -->
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
            
            <!-- Meal Cards -->
            <div class="diet-visualization">
        `;
        
        meals.forEach(meal => {
            html += `
                <div class="diet-card">
                    <div class="diet-card-header">
                        <div class="meal-time">${meal.time}</div>
                        <div class="meal-calories">${meal.calories} cal</div>
                    </div>
                    <div class="diet-items">
            `;
            
            meal.items.forEach(item => {
                html += `
                    <div class="diet-item">
                        <div class="item-name">${item.name}</div>
                        <div class="item-macros">${item.protein}P ${item.carbs}C ${item.fat}F</div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            
            <!-- Chart -->
            <div class="chart-container">
                <canvas id="diet-chart-${vizId}"></canvas>
            </div>
            
            <div class="table-footer">
                <span>${meals.length} meals | Total: ${totals.calories} calories</span>
                <span class="table-timestamp">Generated ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        </div>
        `;
        
        // Render chart after HTML is inserted
        setTimeout(() => this.renderDietChart(meals, totals, `diet-chart-${vizId}`), 100);
        
        return html;
    }

    parseMealData(content) {
        const meals = [];
        const lines = content.split('\n');
        let currentMeal = null;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            
            // Detect meal times
            const mealTimeMatch = trimmed.match(/^(Breakfast|Lunch|Dinner|Snack|Meal \d+)/i);
            if (mealTimeMatch) {
                if (currentMeal) meals.push(currentMeal);
                currentMeal = {
                    time: mealTimeMatch[0],
                    items: [],
                    calories: 0
                };
            }
            
            // Parse food items
            if (currentMeal && trimmed.includes('-')) {
                const parts = trimmed.split('-');
                if (parts.length >= 2) {
                    const name = parts[0].trim();
                    const details = parts[1].trim();
                    
                    // Extract nutrition info
                    const caloriesMatch = details.match(/(\d+)\s*cal/);
                    const proteinMatch = details.match(/(\d+)\s*g?\s*prot?/i);
                    const carbsMatch = details.match(/(\d+)\s*g?\s*carbs?/i);
                    const fatMatch = details.match(/(\d+)\s*g?\s*fat/i);
                    
                    const item = {
                        name: name,
                        calories: caloriesMatch ? parseInt(caloriesMatch[1]) : 0,
                        protein: proteinMatch ? parseInt(proteinMatch[1]) : 0,
                        carbs: carbsMatch ? parseInt(carbsMatch[1]) : 0,
                        fat: fatMatch ? parseInt(fatMatch[1]) : 0
                    };
                    
                    currentMeal.items.push(item);
                    currentMeal.calories += item.calories;
                }
            }
        });
        
        if (currentMeal) meals.push(currentMeal);
        
        // If no structured meals found, create generic ones
        if (meals.length === 0) {
            return this.createSampleMeals();
        }
        
        return meals;
    }

    createSampleMeals() {
        return [
            {
                time: "Breakfast",
                calories: 450,
                items: [
                    { name: "Oatmeal", calories: 150, protein: 5, carbs: 27, fat: 3 },
                    { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0 },
                    { name: "Protein Shake", calories: 195, protein: 25, carbs: 10, fat: 2 }
                ]
            },
            {
                time: "Lunch",
                calories: 650,
                items: [
                    { name: "Grilled Chicken", calories: 165, protein: 31, carbs: 0, fat: 4 },
                    { name: "Brown Rice", calories: 215, protein: 5, carbs: 45, fat: 2 },
                    { name: "Mixed Vegetables", calories: 70, protein: 3, carbs: 12, fat: 0 }
                ]
            }
        ];
    }

    calculateNutritionTotals(meals) {
        const totals = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };
        
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

    renderDietChart(meals, totals, canvasId) {
        if (typeof Chart === 'undefined') return;
        
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        
        const mealNames = meals.map(meal => meal.time);
        const mealCalories = meals.map(meal => meal.calories);
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: mealNames,
                datasets: [{
                    data: mealCalories,
                    backgroundColor: [
                        'rgba(0, 122, 255, 0.8)',
                        'rgba(52, 199, 89, 0.8)',
                        'rgba(255, 149, 0, 0.8)',
                        'rgba(255, 59, 48, 0.8)',
                        'rgba(88, 86, 214, 0.8)'
                    ],
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'white',
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} cal (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Chart Data Detection
    detectChartData(content) {
        const chartPatterns = [
            /data points/i,
            /values?:/i,
            /x-axis|y-axis/i,
            /graph|chart/i,
            /percentage|%/
        ];
        return chartPatterns.some(pattern => pattern.test(content));
    }

    createChartVisualization(content) {
        const data = this.extractChartData(content);
        const vizId = 'chart-viz-' + Date.now();
        
        let html = `
        <div class="visualizer-container" id="${vizId}">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-chart-bar"></i>
                    Data Visualization
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyChartData('${vizId}')" title="Copy Data">
                        <i class="fas fa-copy"></i> Copy Data
                    </button>
                    <div class="export-dropdown">
                        <button class="viz-btn primary export-toggle" title="Export Options">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <div class="export-menu">
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsPDF('${vizId}')">
                                <i class="fas fa-file-pdf"></i> PDF
                            </button>
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsExcel('${vizId}')">
                                <i class="fas fa-file-excel"></i> Excel
                            </button>
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsImage('${vizId}')">
                                <i class="fas fa-image"></i> Image
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="chart-container">
                <canvas id="${vizId}-chart"></canvas>
            </div>
            
            <div class="table-footer">
                <span>${data.values.length} data points</span>
                <span class="table-timestamp">Generated ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        </div>
        `;
        
        // Render chart after HTML is inserted
        setTimeout(() => this.renderDataChart(data, `${vizId}-chart`), 100);
        
        return html;
    }

    extractChartData(content) {
        // Try to extract numerical data
        const numbers = content.match(/\d+(\.\d+)?/g) || [];
        const labels = ['Data 1', 'Data 2', 'Data 3', 'Data 4', 'Data 5'];
        
        return {
            labels: labels.slice(0, Math.min(5, numbers.length)),
            values: numbers.slice(0, 5).map(Number)
        };
    }

    renderDataChart(data, canvasId) {
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
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'white'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'white'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }

    // Flow Chart Detection
    detectProcessFlow(content) {
        return content.includes('process') || 
               content.includes('flow') || 
               content.includes('steps') ||
               content.match(/\d+\.\s+[A-Z]/i);
    }

    createFlowChart(content) {
        const vizId = 'flow-viz-' + Date.now();
        
        let html = `
        <div class="visualizer-container" id="${vizId}">
            <div class="visualizer-header">
                <div class="visualizer-title">
                    <i class="fas fa-project-diagram"></i>
                    Process Flow
                </div>
                <div class="visualizer-actions">
                    <button class="viz-btn" onclick="window.ventoraVisualizer.copyFlowChart('${vizId}')" title="Copy to Clipboard">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <div class="export-dropdown">
                        <button class="viz-btn primary export-toggle" title="Export Options">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <div class="export-menu">
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsPDF('${vizId}')">
                                <i class="fas fa-file-pdf"></i> PDF
                            </button>
                            <button class="export-option" onclick="window.ventoraVisualizer.exportAsImage('${vizId}')">
                                <i class="fas fa-image"></i> Image
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flow-chart" id="${vizId}-flow">
                <div class="mermaid">
                    graph TD
                    A[Start] --> B[Process 1]
                    B --> C{Decision}
                    C -->|Yes| D[Process 2]
                    C -->|No| E[Process 3]
                    D --> F[End]
                    E --> F
                </div>
            </div>
            
            <div class="table-footer">
                <span>Process visualization</span>
                <span class="table-timestamp">Generated ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        </div>
        `;
        
        // Initialize mermaid
        setTimeout(() => {
            if (typeof mermaid !== 'undefined') {
                mermaid.init(undefined, document.querySelector(`#${vizId}-flow .mermaid`));
            }
        }, 200);
        
        return html;
    }

    // === NEW EXPORT FUNCTIONS ===
    
    async exportAsPDF(vizId) {
        const container = document.getElementById(vizId);
        if (!container) {
            this.showToast('Visualization not found!');
            return;
        }
        
        this.showToast('Preparing PDF export...');
        
        try {
            // Load required libraries
            await this.loadExportLibrary('jspdf');
            await this.loadExportLibrary('html2canvas');
            
            const { jsPDF } = window.jspdf;
            
            // Capture the visualization
            const canvas = await html2canvas(container, {
                backgroundColor: '#0a0a0a',
                scale: 2,
                useCORS: true,
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pageWidth = pdf.internal.pageSize.getWidth();
            
            // Add Ventora header
            pdf.setFontSize(20);
            pdf.setTextColor(0, 122, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.text('VENTORA AI', pageWidth / 2, 15, { align: 'center' });
            
            pdf.setFontSize(12);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Visualization Export', pageWidth / 2, 22, { align: 'center' });
            
            // Get title
            const title = container.querySelector('.visualizer-title').textContent.replace('Data Table', '').trim() || 'Visualization';
            pdf.setFontSize(16);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, 20, 35);
            
            // Add date
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 42);
            
            // Add visualization image
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 20, 50, imgWidth, imgHeight);
            
            // Add footer
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('Generated by Ventora AI', pageWidth / 2, 290, { align: 'center' });
            
            // Save PDF
            const fileName = `ventora-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.pdf`;
            pdf.save(fileName);
            
            this.showToast('PDF exported successfully!');
            
        } catch (error) {
            console.error('PDF export failed:', error);
            this.showToast('PDF export failed. Please try again.', 'error');
        }
    }
    
    async exportAsExcel(vizId) {
        const container = document.getElementById(vizId);
        if (!container) {
            this.showToast('Visualization not found!');
            return;
        }
        
        this.showToast('Preparing Excel export...');
        
        try {
            await this.loadExportLibrary('xlsx');
            
            let workbook = XLSX.utils.book_new();
            let worksheet;
            
            // Check visualization type
            const isTable = container.querySelector('.data-table');
            const isDietPlan = container.querySelector('.diet-visualization');
            
            if (isTable) {
                // Export table data
                const table = container.querySelector('table');
                const rows = Array.from(table.querySelectorAll('tr')).map(tr => 
                    Array.from(tr.querySelectorAll('th, td')).map(cell => cell.textContent)
                );
                
                worksheet = XLSX.utils.aoa_to_sheet(rows);
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Table Data');
                
            } else if (isDietPlan) {
                // Export diet plan data
                const meals = [];
                const mealCards = container.querySelectorAll('.diet-card');
                
                mealCards.forEach(card => {
                    const time = card.querySelector('.meal-time').textContent;
                    const calories = card.querySelector('.meal-calories').textContent;
                    
                    const items = card.querySelectorAll('.diet-item');
                    items.forEach(item => {
                        const name = item.querySelector('.item-name').textContent;
                        const macros = item.querySelector('.item-macros').textContent;
                        meals.push([time, name, calories, macros]);
                    });
                });
                
                const worksheetData = [
                    ['Meal Time', 'Food Item', 'Calories', 'Macros'],
                    ...meals
                ];
                
                worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Diet Plan');
            }
            
            // Generate and download
            const fileName = `ventora-export-${Date.now()}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            this.showToast('Excel file exported!');
            
        } catch (error) {
            console.error('Excel export failed:', error);
            this.showToast('Excel export failed. Please try again.', 'error');
        }
    }
    
    async exportAsImage(vizId) {
        const container = document.getElementById(vizId);
        if (!container) {
            this.showToast('Visualization not found!');
            return;
        }
        
        this.showToast('Capturing image...');
        
        try {
            await this.loadExportLibrary('html2canvas');
            
            const canvas = await html2canvas(container, {
                backgroundColor: '#0a0a0a',
                scale: 2,
                useCORS: true,
                logging: false
            });
            
            const link = document.createElement('a');
            link.download = `ventora-visualization-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            this.showToast('Image exported!');
            
        } catch (error) {
            console.error('Image export failed:', error);
            this.showToast('Image export failed. Please try again.', 'error');
        }
    }

    // === EXISTING COPY FUNCTIONS (UPDATED) ===
    
    async copyTable(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        // Create CSV format
        let csv = '';
        const rows = table.querySelectorAll('tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('th, td');
            const rowData = Array.from(cells).map(cell => {
                let text = cell.textContent;
                // Escape quotes and wrap in quotes if contains comma
                text = text.replace(/"/g, '""');
                if (text.includes(',') || text.includes('"')) {
                    text = `"${text}"`;
                }
                return text;
            });
            csv += rowData.join(',') + '\n';
        });
        
        try {
            await navigator.clipboard.writeText(csv);
            this.showToast('Table copied as CSV!');
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showToast('Copy failed. Please try again.', 'error');
        }
    }

    async copyDietPlan(vizId) {
        const container = document.getElementById(vizId);
        if (!container) return;
        
        // Extract text from diet plan
        let text = "VENTORA AI - DIET PLAN\n";
        text += "=".repeat(40) + "\n\n";
        
        // Nutrition summary
        const nutritionItems = container.querySelectorAll('.nutrition-item');
        nutritionItems.forEach(item => {
            const value = item.querySelector('.nutrition-value').textContent;
            const label = item.querySelector('.nutrition-label').textContent;
            text += `${label}: ${value}\n`;
        });
        
        text += "\n" + "=".repeat(40) + "\n\n";
        
        // Meal details
        const mealCards = container.querySelectorAll('.diet-card');
        mealCards.forEach(card => {
            const time = card.querySelector('.meal-time').textContent;
            const calories = card.querySelector('.meal-calories').textContent;
            text += `${time} (${calories}):\n`;
            
            const items = card.querySelectorAll('.diet-item');
            items.forEach(item => {
                const name = item.querySelector('.item-name').textContent;
                const macros = item.querySelector('.item-macros').textContent;
                text += `  • ${name} [${macros}]\n`;
            });
            text += '\n';
        });
        
        text += "\nGenerated by Ventora AI";
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Diet plan copied!');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Copy failed. Please try again.', 'error');
        }
    }

    async copyChartData(vizId) {
        const container = document.getElementById(vizId);
        if (!container) return;
        
        const canvas = container.querySelector('canvas');
        if (!canvas) return;
        
        // Get chart data
        const chart = Chart.getChart(canvas);
        if (!chart) {
            this.showToast('No chart data available', 'error');
            return;
        }
        
        const labels = chart.data.labels;
        const values = chart.data.datasets[0].data;
        
        let text = "Chart Data\n";
        text += "Label,Value\n";
        
        labels.forEach((label, index) => {
            text += `${label},${values[index]}\n`;
        });
        
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Chart data copied!');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Copy failed. Please try again.', 'error');
        }
    }

    async copyFlowChart(vizId) {
        const container = document.getElementById(vizId);
        if (!container) return;
        
        // Extract mermaid code
        const mermaidElement = container.querySelector('.mermaid');
        if (!mermaidElement) return;
        
        const mermaidCode = mermaidElement.textContent.trim();
        
        try {
            await navigator.clipboard.writeText(mermaidCode);
            this.showToast('Flow chart code copied!');
        } catch (err) {
            console.error('Copy failed:', err);
            this.showToast('Copy failed. Please try again.', 'error');
        }
    }

    // === UTILITY FUNCTIONS ===
    
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        // Create toast if it doesn't exist
        let toast = document.querySelector('.viz-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'viz-toast';
            document.body.appendChild(toast);
        }
        
        // Set type class
        toast.className = 'viz-toast';
        if (type === 'error') {
            toast.style.borderColor = '#ff4757';
            toast.style.background = 'rgba(255, 71, 87, 0.1)';
        }
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize global instance
window.ventoraVisualizer = new VentoraVisualizer();

// Close export menus when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.export-dropdown')) {
        document.querySelectorAll('.export-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});

// Toggle export menu
document.addEventListener('click', function(event) {
    if (event.target.closest('.export-toggle')) {
        event.stopPropagation();
        const dropdown = event.target.closest('.export-dropdown');
        const menu = dropdown.querySelector('.export-menu');
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }
});
