// app.js

// STEP 1: Import Alpine directly. The 'alpinejs' name works because of the importmap in your HTML.
import Alpine from 'alpinejs';

// Import our specialized generator functions from their own files.
import { generateDiagram } from './diagrams.js';
import { generateDocument } from './documents.js';
import { generatePresentation } from './presentations.js';

// Initialize Mermaid.js globally.
mermaid.initialize({ startOnLoad: false, theme: 'default' });

// STEP 2: Define and register our main component with Alpine BEFORE starting it.
// We are no longer using the 'alpine:init' event listener.
Alpine.data('app', () => ({
    // --- Global State Management ---
    currentSection: 'diagrams',
    isLoading: false,

    // --- Documents Section State ---
    documentInput: '',
    documentOutput: '',

    // --- Presentations Section State ---
    presentationInput: '',
    presentationOutput: '',

    // --- Diagrams Section State ---
    selectedDiagram: null,
    diagramInput: '',
    diagramOutput: '',
    useIcons: false,
    renderSuccess: false,

    // --- Core Functions (call the imported logic) ---
    async generateDiagram() {
        // 'this' refers to the Alpine component, which we pass to the function
        // so it can access and modify our state (e.g., this.isLoading).
        await generateDiagram(this);
    },
    async generateDocument() {
        await generateDocument(this);
    },
    async generatePresentation() {
        await generatePresentation(this);
    },

    // --- UI Helper Functions ---
    async downloadDiagram() {
        try {
            const svgElement = document.getElementById('diagram-output')?.querySelector('svg');
            if (!svgElement) {
                alert('No diagram to download.');
                return;
            }
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'diagram.svg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        }
    },

    // --- Static Data for the UI ---
    diagramTypes: [
        { 
            type: 'Flowchart', 
            name: 'Flowchart', 
            icon: 'fas fa-sitemap',
            description: 'Show processes, decisions, and flows',
            example: 'Process workflow, decision trees, algorithm steps',
            syntax: 'flowchart TD'
        },
        { 
            type: 'Sequence Diagram', 
            name: 'Sequence', 
            icon: 'fas fa-stream',
            description: 'Show interactions between participants over time',
            example: 'API calls, user authentication flow, message exchanges',
            syntax: 'sequenceDiagram'
        },
        { 
            type: 'Class Diagram', 
            name: 'Class', 
            icon: 'fas fa-cube',
            description: 'Show object-oriented class structures',
            example: 'Software architecture, database models, OOP design',
            syntax: 'classDiagram'
        },
        { 
            type: 'State Diagram', 
            name: 'State', 
            icon: 'fas fa-circle-notch',
            description: 'Show different states and transitions',
            example: 'User session states, order status, app lifecycle',
            syntax: 'stateDiagram-v2'
        },
        { 
            type: 'ER Diagram', 
            name: 'ER Diagram', 
            icon: 'fas fa-database',
            description: 'Show database relationships',
            example: 'Database schema, table relationships, data models',
            syntax: 'erDiagram'
        },
        { 
            type: 'User Journey', 
            name: 'User Journey', 
            icon: 'fas fa-route',
            description: 'Map user experience and emotions',
            example: 'Customer journey, user onboarding, app usage flow',
            syntax: 'journey'
        },
        { 
            type: 'Gantt', 
            name: 'Gantt', 
            icon: 'fas fa-tasks',
            description: 'Show project timeline and tasks',
            example: 'Project schedule, sprint planning, task dependencies',
            syntax: 'gantt'
        },
        { 
            type: 'Pie Chart', 
            name: 'Pie Chart', 
            icon: 'fas fa-chart-pie',
            description: 'Show proportional data',
            example: 'Market share, budget distribution, survey results',
            syntax: 'pie'
        },
        { 
            type: 'Quadrant Chart', 
            name: 'Quadrant', 
            icon: 'fas fa-th',
            description: 'Plot items in 4 quadrants',
            example: 'Priority matrix, risk assessment, feature evaluation',
            syntax: 'quadrantChart'
        },
        { 
            type: 'Mindmap', 
            name: 'Mind Map', 
            icon: 'fas fa-brain',
            description: 'Organize ideas hierarchically',
            example: 'Brainstorming, concept mapping, study notes',
            syntax: 'mindmap'
        },
        { 
            type: 'Timeline', 
            name: 'Timeline', 
            icon: 'fas fa-history',
            description: 'Show chronological events',
            example: 'Historical events, project milestones, company history',
            syntax: 'timeline'
        },
        { 
            type: 'GitGraph', 
            name: 'Git Graph', 
            icon: 'fab fa-git-alt',
            description: 'Show git branch history',
            example: 'Git commits, branch merges, version history',
            syntax: 'gitGraph'
        },
        { 
            type: 'Sankey', 
            name: 'Sankey', 
            icon: 'fas fa-water',
            description: 'Show flow quantities between nodes',
            example: 'Energy flow, budget allocation, traffic sources',
            syntax: 'sankey-beta'
        },
        { 
            type: 'XY Chart', 
            name: 'XY Chart', 
            icon: 'fas fa-chart-line',
            description: 'Plot data points on X and Y axes',
            example: 'Sales trends, performance metrics, correlation data',
            syntax: 'xychart-beta'
        },
        { 
            type: 'Block Diagram', 
            name: 'Block', 
            icon: 'fas fa-cubes',
            description: 'Show system components and relationships',
            example: 'System architecture, network topology, infrastructure',
            syntax: 'block-beta'
        },
        { 
            type: 'Kanban', 
            name: 'Kanban', 
            icon: 'fas fa-columns',
            description: 'Visual workflow board',
            example: 'Task management, sprint board, workflow stages',
            syntax: 'kanban'
        },
    ],
}));

// STEP 3: Make Alpine globally available on the window object so the HTML can use it.
window.Alpine = Alpine;

// STEP 4: Manually start Alpine. This runs AFTER our component is defined, solving the race condition.
Alpine.start();