// app.js
import Alpine from 'alpinejs';
import { generateDiagram } from './diagrams.js';
import { generateDocument } from './documents.js';
import { generatePresentation } from './presentations.js';

// Initialize Mermaid. We will update its theme dynamically.
mermaid.initialize({ startOnLoad: false, theme: 'dark' });

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

    // --- NEW: Theme Management ---
    initTheme() {
        // On app start, check localStorage for a theme preference.
        // If none exists, it respects the `isDarkMode: true` default.
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
        if (shouldReRender && this.diagramOutput && this.diagramInput) {
            // A small delay to ensure the theme is applied before re-rendering
            setTimeout(() => this.generateDiagram(), 50);
        }
    },

    // --- Core Functions (no changes here) ---
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

            const svgString = new XMLSerializer().serializeToString(svgElement);

            // ======================= START: THE FIX =======================
            // Convert the raw SVG string to a Base64 data URL to avoid tainting the canvas.
            const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
            // ======================= END: THE FIX =========================

            const img = new Image();
            img.onload = () => {
                const bbox = svgElement.getBBox();
                const PADDING = 60; // 30px margin on each side

                const canvas = document.createElement('canvas');
                canvas.width = bbox.width + PADDING;
                canvas.height = bbox.height + PADDING;
                const ctx = canvas.getContext('2d');

                // Fill background (important for non-transparent PNG)
                ctx.fillStyle = this.isDarkMode ? '#111827' : '#FFFFFF'; // Tailwind's dark:bg-gray-900 or bg-white
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw the SVG image onto the canvas, offsetting it correctly
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

            // Set the image source to our new, safe data URL
            img.src = dataUrl;

        } catch (error) {
            console.error('Download failed:', error);
            alert(`Download failed: ${error.message}`);
        }
    },

    // --- Static Data (no changes here) ---
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