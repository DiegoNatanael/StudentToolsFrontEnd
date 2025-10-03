// app.js
import Alpine from 'alpinejs';
import { generateDiagram } from './diagrams.js';
import { generateDocument } from './documents.js';
import { generatePresentation } from './presentations.js';

// Initialize Mermaid. We will update its theme dynamically.
mermaid.initialize({ startOnLoad: false, theme: 'dark' });

Alpine.data('app', () => ({
    // --- State Management ---
    isDarkMode: true,
    isMobileMenuOpen: false, // State for the hamburger menu
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
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && this.isDarkMode)) {
            this.isDarkMode = true;
        } else {
            this.isDarkMode = false;
        }
        this.applyTheme(false);
    },
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme(true);
    },
    applyTheme(shouldReRender) {
        if (this.isDarkMode) {
            localStorage.theme = 'dark';
            document.documentElement.classList.add('dark');
        } else {
            localStorage.theme = 'light';
            document.documentElement.classList.remove('dark');
        }
        mermaid.initialize({ startOnLoad: false, theme: this.isDarkMode ? 'dark' : 'default' });
        if (shouldReRender && this.diagramOutput && this.diagramInput) {
            setTimeout(() => this.generateDiagram(), 50);
        }
    },

    // --- Core Functions ---
    async generateDiagram() { await generateDiagram(this); },
    async generateDocument() { await generateDocument(this); },
    async generatePresentation() { await generatePresentation(this); },

    // --- PNG Download Function ---
    async downloadDiagram() {
        try {
            const svgElement = document.getElementById('diagram-output')?.querySelector('svg');
            if (!svgElement) {
                alert('No diagram to download');
                return;
            }
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
            const img = new Image();
            img.onload = () => {
                const bbox = svgElement.getBBox();
                const PADDING = 60;
                const canvas = document.createElement('canvas');
                canvas.width = bbox.width + PADDING;
                canvas.height = bbox.height + PADDING;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = this.isDarkMode ? '#111827' : '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, -bbox.x + (PADDING / 2), -bbox.y + (PADDING / 2));
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
                alert("Download failed: Could not load the diagram image for conversion.");
            };
            img.src = dataUrl;
        } catch (error) {
            console.error('Download failed:', error);
            alert(`Download failed: ${error.message}`);
        }
    },

    // --- Static Data ---
    diagramTypes: [
        { type: 'Flowchart', name: 'Flowchart', icon: 'fas fa-sitemap', description: 'Show processes & flows', example: 'Process workflow, decision trees', syntax: 'flowchart TD' },
        { type: 'Sequence Diagram', name: 'Sequence', icon: 'fas fa-stream', description: 'Show interactions over time', example: 'API calls, user authentication', syntax: 'sequenceDiagram' },
        { type: 'Class Diagram', name: 'Class', icon: 'fas fa-cube', description: 'Show class structures', example: 'Software architecture, OOP', syntax: 'classDiagram' },
        { type: 'State Diagram', name: 'State', icon: 'fas fa-circle-notch', description: 'Show states & transitions', example: 'User sessions, order status', syntax: 'stateDiagram-v2' },
        { type: 'ER Diagram', name: 'ER Diagram', icon: 'fas fa-database', description: 'Show database relationships', example: 'Database schema, data models', syntax: 'erDiagram' },
        { type: 'User Journey', name: 'User Journey', icon: 'fas fa-route', description: 'Map user experience', example: 'Customer journey, onboarding', syntax: 'journey' },
        { type: 'Gantt', name: 'Gantt', icon: 'fas fa-tasks', description: 'Show project timeline', example: 'Project schedule, planning', syntax: 'gantt' },
        { type: 'Pie Chart', name: 'Pie Chart', icon: 'fas fa-chart-pie', description: 'Show proportional data', example: 'Market share, budgets', syntax: 'pie' },
        { type: 'Quadrant Chart', name: 'Quadrant', icon: 'fas fa-th', description: 'Plot items in 4 quadrants', example: 'Priority matrix, risk assessment', syntax: 'quadrantChart' },
        { type: 'Mindmap', name: 'Mind Map', icon: 'fas fa-brain', description: 'Organize ideas hierarchically', example: 'Brainstorming, concepts', syntax: 'mindmap' },
        { type: 'Timeline', name: 'Timeline', icon: 'fas fa-history', description: 'Show chronological events', example: 'Project milestones, history', syntax: 'timeline' },
        { type: 'GitGraph', name: 'Git Graph', icon: 'fab fa-git-alt', description: 'Show git branch history', example: 'Git commits, branch merges', syntax: 'gitGraph' },
    ],
}));

window.Alpine = Alpine;
Alpine.start();