// app.js
import Alpine from 'alpinejs';
import { generateDiagram } from './diagrams.js';
import { generateDocument } from './documents.js';
import { generatePresentation } from './presentations.js';

// Initialize Mermaid. We will update its theme dynamically.
mermaid.initialize({ startOnLoad: false, theme: 'default' });

Alpine.data('app', () => ({
    // --- State Management ---
    isDarkMode: true, // Default to dark mode
    currentSection: 'diagrams',
    isLoading: false,
    documentInput: '',
    documentOutput: '',
    presentationInput: '',
    presentationOutput: '',
    selectedDiagram: null,
    diagramInput: '',
    diagramOutput: '',
    useIcons: false,
    renderSuccess: false,

    // --- Theme Management ---
    initTheme() {
        // Check localStorage for a preference. If none, use the default.
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && this.isDarkMode)) {
            this.isDarkMode = true;
        } else {
            this.isDarkMode = false;
        }
        this.applyTheme(false); // Apply theme on init without re-rendering diagram
    },
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme(true); // Apply theme and re-render diagram if it exists
    },
    applyTheme(shouldReRender) {
        if (this.isDarkMode) {
            localStorage.theme = 'dark';
            document.documentElement.classList.add('dark');
        } else {
            localStorage.theme = 'light';
            document.documentElement.classList.remove('dark');
        }
        // Re-initialize Mermaid with the correct theme
        mermaid.initialize({ startOnLoad: false, theme: this.isDarkMode ? 'dark' : 'default' });
        
        // Only re-generate the diagram if one is already showing
        if (shouldReRender && this.diagramOutput) {
            this.generateDiagram();
        }
    },

    // --- Core Functions ---
    async generateDiagram() { await generateDiagram(this); },
    async generateDocument() { await generateDocument(this); },
    async generatePresentation() { await generatePresentation(this); },

    // --- NEW & IMPROVED PNG DOWNLOAD FUNCTION ---
    async downloadDiagram() {
        try {
            const svgElement = document.getElementById('diagram-output')?.querySelector('svg');
            if (!svgElement) {
                alert('No diagram to download');
                return;
            }

            // Temporarily set explicit styles for export
            svgElement.style.backgroundColor = this.isDarkMode ? '#111827' : '#FFFFFF'; // gray-900 or white

            const svgString = new XMLSerializer().serializeToString(svgElement);
            // Reset inline style after getting the string
            svgElement.style.backgroundColor = '';

            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            const img = new Image();
            img.onload = () => {
                const bbox = svgElement.getBBox();
                const PADDING = 60; // 30px margin on each side

                const canvas = document.createElement('canvas');
                canvas.width = bbox.width + PADDING;
                canvas.height = bbox.height + PADDING;
                const ctx = canvas.getContext('2d');

                // Fill background (important for non-transparent PNG)
                ctx.fillStyle = this.isDarkMode ? '#111827' : '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw the SVG image onto the canvas, offsetting it to remove whitespace
                // and center it within the new padding.
                ctx.drawImage(img, -bbox.x + (PADDING / 2), -bbox.y + (PADDING / 2));
                
                URL.revokeObjectURL(url);

                canvas.toBlob((blob) => {
                    const link = document.createElement('a');
                    link.download = 'diagram.png';
                    link.href = URL.createObjectURL(blob);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                }, 'image/png');
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                alert("Download failed: Could not load the diagram image for conversion.");
            };

            img.src = url;

        } catch (error) {
            console.error('Download failed:', error);
            alert(`Download failed: ${error.message}`);
        }
    },

    // --- Static Data ---
    diagramTypes: [
        { type: 'Flowchart', name: 'Flowchart', icon: 'fas fa-sitemap', description: 'Show processes, decisions, and flows', example: 'Process workflow, decision trees, algorithm steps', syntax: 'flowchart TD' },
        { type: 'Sequence Diagram', name: 'Sequence', icon: 'fas fa-stream', description: 'Show interactions over time', example: 'API calls, user authentication', syntax: 'sequenceDiagram' },
        { type: 'Class Diagram', name: 'Class', icon: 'fas fa-cube', description: 'Show class structures', example: 'Software architecture, OOP design', syntax: 'classDiagram' },
        { type: 'State Diagram', name: 'State', icon: 'fas fa-circle-notch', description: 'Show states and transitions', example: 'User session states, order status', syntax: 'stateDiagram-v2' },
        { type: 'ER Diagram', name: 'ER Diagram', icon: 'fas fa-database', description: 'Show database relationships', example: 'Database schema, data models', syntax: 'erDiagram' },
        { type: 'User Journey', name: 'User Journey', icon: 'fas fa-route', description: 'Map user experience', example: 'Customer journey, onboarding', syntax: 'journey' },
        { type: 'Gantt', name: 'Gantt', icon: 'fas fa-tasks', description: 'Show project timeline', example: 'Project schedule, sprint planning', syntax: 'gantt' },
        { type: 'Pie Chart', name: 'Pie Chart', icon: 'fas fa-chart-pie', description: 'Show proportional data', example: 'Market share, budget distribution', syntax: 'pie' },
        { type: 'Quadrant Chart', name: 'Quadrant', icon: 'fas fa-th', description: 'Plot items in 4 quadrants', example: 'Priority matrix, risk assessment', syntax: 'quadrantChart' },
        { type: 'Mindmap', name: 'Mind Map', icon: 'fas fa-brain', description: 'Organize ideas hierarchically', example: 'Brainstorming, concept mapping', syntax: 'mindmap' },
        { type: 'Timeline', name: 'Timeline', icon: 'fas fa-history', description: 'Show chronological events', example: 'Project milestones, company history', syntax: 'timeline' },
        { type: 'GitGraph', name: 'Git Graph', icon: 'fab fa-git-alt', description: 'Show git branch history', example: 'Git commits, branch merges', syntax: 'gitGraph' },
    ],
}));

window.Alpine = Alpine;
Alpine.start();