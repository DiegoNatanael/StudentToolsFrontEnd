// Initialize Mermaid.js
mermaid.initialize({ startOnLoad: false, theme: 'default' });

function app() {
    return {
        // --- Navigation State ---
        currentSection: 'diagrams',
        
        // --- Documents Section ---
        documentInput: '',
        documentOutput: '',
        
        // --- Presentations Section ---
        presentationInput: '',
        
        // --- Diagrams Section ---
        selectedDiagram: null,
        diagramInput: '',
        diagramOutput: '',
        useIcons: false,
        renderSuccess: false,
        isLoading: false,
        // NEW STATE VARIABLE FOR BYOK
        userApiKey: '', 
        
        // Diagram types (Same as original)
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

        // Real Font Awesome icons (Same as original)
        iconPool: [
            'fa-brain', 'fa-lightbulb', 'fa-book', 'fa-graduation-cap', 'fa-users',
            'fa-chart-line', 'fa-cog', 'fa-rocket', 'fa-star', 'fa-heart',
            'fa-clock', 'fa-calendar', 'fa-briefcase', 'fa-folder', 'fa-file',
            'fa-database', 'fa-server', 'fa-code', 'fa-laptop', 'fa-mobile',
            'fa-globe', 'fa-tree', 'fa-leaf', 'fa-sun', 'fa-moon',
            'fa-cloud', 'fa-bolt', 'fa-fire', 'fa-water', 'fa-snowflake',
            'fa-bicycle', 'fa-car', 'fa-plane', 'fa-ship', 'fa-subway',
            'fa-music', 'fa-film', 'fa-camera', 'fa-palette', 'fa-pen',
            'fa-pencil-alt', 'fa-paint-brush', 'fa-hammer', 'fa-wrench', 'fa-tools',
            'fa-shield-alt', 'fa-lock', 'fa-key', 'fa-gem', 'fa-award'
        ],

        // --- Document Generation (Placeholder for now) ---
        async generateDocument() {
            if (!this.documentInput.trim()) {
                alert('Please enter a document topic first.');
                return;
            }
            
            // NOTE: Document generation still needs to be connected to the backend
            alert('Document generation logic needs to be fully implemented and connected to a new backend API call.');
            
            // To prevent the errors from showing on the console, you must ensure
            // documentOutput, isLoading are defined, which they are in the return block.
            // The original logic is now a placeholder.
        },

        // --- Diagram Generation (BYOK Logic) ---
        async generateDiagram() {
            if (!this.diagramInput.trim()) {
                alert('Please describe what you want to visualize.');
                return;
            }
            
            // NEW: BYOK check
            if (!this.userApiKey.trim()) {
                alert('Please enter your AI API Key.');
                return;
            }

            // FastAPI BACKEND ENDPOINT
            const BACKEND_URL = 'https://studentools.onrender.com/api/generate/diagram'; 
            
            this.isLoading = true;
            this.diagramOutput = '';
            this.renderSuccess = false;

            // Prepare the data to send to FastAPI
            const requestBody = {
                api_key: this.userApiKey.trim(), // NEW: Include the user's key
                diagram_type: this.selectedDiagram,
                description: this.diagramInput,
                use_icons: this.useIcons
            };
            
            try {
                // Call your FastAPI backend, which handles the secure AI call
                const response = await fetch(BACKEND_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({})); 
                    throw new Error(`Backend Error (${response.status}): ${errorData.detail || 'Failed to generate diagram. Check your key and input.'}`);
                }

                const data = await response.json();
                let mermaidCode = data.mermaid_code.trim() || ''; 
                
                if (!mermaidCode) throw new Error("Empty AI response received from server.");
                
                // Process mindmap icons (Frontend handles this)
                if (this.selectedDiagram === 'Mindmap' && this.useIcons) {
                    mermaidCode = mermaidCode.replace(/::icon\([^)]+\)/g, ''); 
                    mermaidCode = this.addContextualIcons(mermaidCode);
                }

                console.log('Final Mermaid Code:', mermaidCode);

                // Client-Side Rendering
                const { svg } = await mermaid.render('diagram-output-svg', mermaidCode);
                this.diagramOutput = svg;
                this.renderSuccess = true;

            } catch (error) {
                console.error('Diagram Generation Error:', error);
                this.diagramOutput = `<div class="text-red-600 p-4">Error: ${error.message}. Try rephrasing your input.</div>`;
            } finally {
                this.isLoading = false;
            }
        },

        addContextualIcons(mermaidCode) {
            const lines = mermaidCode.split('\n');
            const processedLines = [];
            
            for (let line of lines) {
                if (line.trim() === 'mindmap') {
                    processedLines.push(line);
                    continue;
                }
                
                if (line.trim().length > 0) {
                    processedLines.push(line);
                    const indent = line.match(/^(\s*)/)[1];
                    const contextualIcon = this.getContextualIcon(line);
                    processedLines.push(`${indent}  ::icon(fa ${contextualIcon})`);
                } else {
                    processedLines.push(line);
                }
            }
            
            return processedLines.join('\n');
        },

        getRandomIcon() {
            return this.iconPool[Math.floor(Math.random() * this.iconPool.length)];
        },

        getContextualIcon(text) {
            const lowerText = text.toLowerCase();
            
            // Science & Nature
            if (lowerText.match(/water|ocean|sea|rain|liquid/)) return 'fa-water';
            if (lowerText.match(/sun|solar|light|ray/)) return 'fa-sun';
            if (lowerText.match(/cloud|sky|weather/)) return 'fa-cloud';
            if (lowerText.match(/snow|ice|frozen|cold/)) return 'fa-snowflake';
            if (lowerText.match(/fire|heat|burn|flame/)) return 'fa-fire';
            if (lowerText.match(/plant|tree|leaf|green|grow/)) return 'fa-leaf';
            if (lowerText.match(/energy|power|electric/)) return 'fa-bolt';
            if (lowerText.match(/wind|air|breeze/)) return 'fa-wind';
            if (lowerText.match(/earth|soil|ground/)) return 'fa-globe';
            if (lowerText.match(/moon|night|lunar/)) return 'fa-moon';
            
            // Process & Actions
            if (lowerText.match(/process|procedure|method/)) return 'fa-cog';
            if (lowerText.match(/evapor|vapor|steam/)) return 'fa-cloud-meatball';
            if (lowerText.match(/condensation|condense/)) return 'fa-tint';
            if (lowerText.match(/precipitation|rain|snow/)) return 'fa-cloud-rain';
            if (lowerText.match(/collect|gather|accumulate/)) return 'fa-archive';
            if (lowerText.match(/formation|form|create/)) return 'fa-shapes';
            if (lowerText.match(/cool|chill|freeze/)) return 'fa-temperature-low';
            if (lowerText.match(/transpir|release|emit/)) return 'fa-wind';
            if (lowerText.match(/infiltr|seep|absorb/)) return 'fa-filter';
            if (lowerText.match(/runoff|flow|stream/)) return 'fa-water';
            
            // Technology & Computing
            if (lowerText.match(/code|program|software/)) return 'fa-code';
            if (lowerText.match(/computer|laptop|pc/)) return 'fa-laptop';
            if (lowerText.match(/mobile|phone|smartphone/)) return 'fa-mobile';
            if (lowerText.match(/server|host|backend/)) return 'fa-server';
            if (lowerText.match(/database|data|storage/)) return 'fa-database';
            if (lowerText.match(/web|internet|online/)) return 'fa-globe';
            
            // Education & Knowledge
            if (lowerText.match(/learn|study|education/)) return 'fa-graduation-cap';
            if (lowerText.match(/book|read|literature/)) return 'fa-book';
            if (lowerText.match(/brain|think|mind|idea/)) return 'fa-brain';
            if (lowerText.match(/light|idea|innovation/)) return 'fa-lightbulb';
            
            // Business & Work
            if (lowerText.match(/business|company|corporate/)) return 'fa-briefcase';
            if (lowerText.match(/chart|graph|analytics/)) return 'fa-chart-line';
            if (lowerText.match(/user|people|person|human/)) return 'fa-users';
            if (lowerText.match(/time|clock|schedule/)) return 'fa-clock';
            if (lowerText.match(/calendar|date|event/)) return 'fa-calendar';
            if (lowerText.match(/folder|directory|organize/)) return 'fa-folder';
            if (lowerText.match(/file|document|paper/)) return 'fa-file';
            
            // Creative & Media
            if (lowerText.match(/music|sound|audio/)) return 'fa-music';
            if (lowerText.match(/film|video|movie/)) return 'fa-film';
            if (lowerText.match(/camera|photo|picture/)) return 'fa-camera';
            if (lowerText.match(/paint|art|draw/)) return 'fa-palette';
            if (lowerText.match(/write|pen|author/)) return 'fa-pen';
            
            // Tools & Objects
            if (lowerText.match(/tool|equipment|instrument/)) return 'fa-tools';
            if (lowerText.match(/hammer|build|construct/)) return 'fa-hammer';
            if (lowerText.match(/wrench|fix|repair/)) return 'fa-wrench';
            if (lowerText.match(/lock|secure|safe/)) return 'fa-lock';
            if (lowerText.match(/key|unlock|access/)) return 'fa-key';
            if (lowerText.match(/shield|protect|defense/)) return 'fa-shield-alt';
            
            // Symbols & Status
            if (lowerText.match(/star|favorite|featured/)) return 'fa-star';
            if (lowerText.match(/heart|love|like/)) return 'fa-heart';
            if (lowerText.match(/award|prize|achievement/)) return 'fa-award';
            if (lowerText.match(/gem|diamond|precious/)) return 'fa-gem';
            if (lowerText.match(/rocket|launch|start/)) return 'fa-rocket';
            
            // Fallback to random
            return this.getRandomIcon();
        },

        async downloadDiagram() {
            try {
                const svgElement = document.getElementById('diagram-output')?.querySelector('svg');
                if (!svgElement) { 
                    alert('No diagram to download'); 
                    return; 
                }
                
                const clonedSvg = svgElement.cloneNode(true);
                const bbox = svgElement.getBBox();
                const width = bbox.width || svgElement.width.baseVal.value || 800;
                const height = bbox.height || svgElement.height.baseVal.value || 600;
                const scale = 2;
                
                clonedSvg.setAttribute('width', width);
                clonedSvg.setAttribute('height', height);
                
                const svgString = new XMLSerializer().serializeToString(clonedSvg);
                const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                
                const canvas = document.createElement('canvas');
                canvas.width = width * scale;
                canvas.height = height * scale;
                const ctx = canvas.getContext('2d');
                
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const img = new Image();
                const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
                
                img.onload = function() {
                    try {
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        
                        canvas.toBlob(function(blob) {
                            if (blob) {
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = 'diagram.png';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(link.href);
                            } else {
                                throw new Error('Blob creation failed');
                            }
                        }, 'image/png');
                    } catch (e) {
                        console.warn('PNG export failed, downloading SVG instead:', e);
                        const link = document.createElement('a');
                        link.href = svgUrl;
                        link.download = 'diagram.svg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                    URL.revokeObjectURL(svgUrl);
                };
                
                img.onerror = function() {
                    console.warn('Image load failed, downloading SVG instead');
                    const link = document.createElement('a');
                    link.href = svgUrl;
                    link.download = 'diagram.svg';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(svgUrl);
                };
                
                img.src = svgDataUrl;
                
            } catch (error) {
                console.error('Download failed:', error);
                alert('Download failed. Please try again.');
            }
        }
    };
}
