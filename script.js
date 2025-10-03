// --- Diagram Generation (PUTER.JS INTEGRATION) ---
async function generateDiagram() {
    if (!this.diagramInput.trim()) {
        alert('Please describe what you want to visualize.');
        return;
    }
    if (!this.selectedDiagram) {
        alert('Please select a diagram type.');
        return;
    }

    this.isLoading = true;
    this.diagramOutput = '';
    this.renderSuccess = false;

    try {
        // Build prompt for Puter.js
        const prompt = `
You are a Mermaid.js expert. Generate ONLY valid Mermaid ${this.selectedDiagram.toLowerCase()} code.
Start with the correct syntax for ${this.selectedDiagram}.
Use \\n for line breaks in nodes. Keep text concise.
Output ONLY raw Mermaid code. No explanations, no markdown.

User request: ${this.diagramInput}
`;

        // Call Puter.js (uses Gemini 1.5 Flash under the hood)
        const response = await puter.ai.chat(prompt, {
            model: "google/gemini-1.5-flash"
        });

        let mermaidCode = response.toString().trim();

        // Clean common AI artifacts
        mermaidCode = mermaidCode
            .replace(/```mermaid\n?/g, '')
            .replace(/```\n?/g, '')
            .split('\n')
            .filter(line =>
                !line.trim().startsWith('//') &&
                !line.includes('Note:') &&
                line.trim() !== ''
            )
            .join('\n')
            .trim();

        if (!mermaidCode) throw new Error("Empty response from AI.");

        console.log('Mermaid Code:', mermaidCode);

        // Render with Mermaid.js
        const { svg } = await mermaid.render('diagram-output-svg', mermaidCode);
        this.diagramOutput = svg;
        this.renderSuccess = true;

    } catch (error) {
        console.error('Puter.js Error:', error);
        this.renderSuccess = false;
        this.diagramOutput = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-red-500 mt-1"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Diagram Generation Failed</h3>
                        <div class="mt-2 text-sm text-red-700">
                            <p><b>Error:</b> ${error.message || 'Unknown error'}</p>
                            <p class="mt-2">Try a simpler request like "water cycle flowchart".</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } finally {
        this.isLoading = false;
    }
}