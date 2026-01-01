/* visualizer/vdiv.js */
window.VentoraVisualizer = {
    // Dynamic Library Loader
    loadLibrary: async (url) => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            document.head.appendChild(script);
        });
    },

    init: async function() {
        // Load dependencies if not already present
        if (!window.html2canvas) await this.loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        if (!window.jspdf) await this.loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    },

    process: function(htmlContent) {
        // Simple regex to detect markdown-style tables
        const tableRegex = /<table>[\s\S]*?<\/table>/g;
        
        return htmlContent.replace(tableRegex, (match) => {
            const id = 'v-' + Math.random().toString(36).substr(2, 9);
            return `
            <div class="v-visual-container" id="container-${id}">
                <div class="v-visual-header">
                    <div class="v-visual-title"><i class="fas fa-chart-pie"></i> Visualizer</div>
                    <div class="v-visual-actions">
                        <button class="v-action-btn" onclick="VentoraVisualizer.copyTable('${id}')">Copy</button>
                        <button class="v-action-btn" onclick="VentoraVisualizer.exportPDF('${id}')">PDF</button>
                    </div>
                </div>
                <div class="v-visual-body" id="${id}">
                    ${match}
                </div>
            </div>`;
        });
    },

    copyTable: async function(id) {
        const element = document.getElementById(id);
        const canvas = await html2canvas(element, { backgroundColor: '#0d0d0d' });
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]);
            alert('Table copied as Image!');
        });
    },

    exportPDF: async function(id) {
        const { jsPDF } = window.jspdf;
        const element = document.getElementById(id);
        const canvas = await html2canvas(element, { backgroundColor: '#0d0d0d', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
        pdf.save(`Ventora_Report_${id}.pdf`);
    }
};

// Initialize libraries immediately
VentoraVisualizer.init();
