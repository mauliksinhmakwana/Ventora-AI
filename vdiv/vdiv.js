// vdiv.js - Ventora Drug Interaction Visualizer
class VentoraDrugVisualizer {
  constructor(container) {
    this.container = container;
    this.nodes = [];
    this.edges = [];
  }

  render(data) {
    // Clear previous
    this.container.innerHTML = `
      <div class="vdiv-title">Drug & Food Interactions</div>
      <div class="vdiv-network" id="vdiv-network"></div>
      <div class="vdiv-legend">
        <div class="vdiv-legend-item"><div class="vdiv-legend-color" style="background:#86efac"></div><span>Minor</span></div>
        <div class="vdiv-legend-item"><div class="vdiv-legend-color" style="background:#fdba74"></div><span>Moderate</span></div>
        <div class="vdiv-legend-item"><div class="vdiv-legend-color" style="background:#f87171"></div><span>Major</span></div>
        <div class="vdiv-legend-item"><div class="vdiv-legend-color" style="background:#4b5563;opacity:0.3"></div><span>No known</span></div>
      </div>
    `;

    const network = document.getElementById('vdiv-network');
    const width = network.offsetWidth;
    const height = network.offsetHeight;

    // Simple circle layout
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    data.nodes.forEach((node, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const nodeEl = document.createElement('div');
      nodeEl.className = `vdiv-node ${node.type || ''}`;
      nodeEl.style.left = `${x - 50}px`;
      nodeEl.style.top = `${y - 50}px`;
      nodeEl.textContent = node.name;
      network.appendChild(nodeEl);
    });

    // Draw edges
    data.edges.forEach(edge => {
      const fromNode = data.nodes[edge.from];
      const toNode = data.nodes[edge.to];
      if (!fromNode || !toNode) return;

      const angle = (edge.from / data.nodes.length) * 2 * Math.PI;
      const x1 = centerX + radius * Math.cos(angle);
      const y1 = centerY + radius * Math.sin(angle);

      const angle2 = (edge.to / data.nodes.length) * 2 * Math.PI;
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);

      const edgeEl = document.createElement('div');
      edgeEl.className = `vdiv-edge ${edge.severity}`;
      const length = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
      const angleDeg = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

      edgeEl.style.width = `${length}px`;
      edgeEl.style.left = `${x1}px`;
      edgeEl.style.top = `${y1}px`;
      edgeEl.style.transform = `rotate(${angleDeg}deg)`;
      network.appendChild(edgeEl);
    });
  }
}

// Global function to trigger from AI response
function renderDrugInteraction(data) {
  const container = document.createElement('div');
  container.className = 'vdiv-container';
  document.querySelector('.msg.ai:last-child')?.appendChild(container);

  const visualizer = new VentoraDrugVisualizer(container);
  visualizer.render(data);

  scrollToBottom();
}
