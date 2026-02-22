// diagrams.js

export async function generateDiagram(component) {
    if (!component.diagramInput.trim()) {
        alert('Please describe what you want to visualize.');
        return;
    }
    if (!component.selectedDiagram) {
        alert('Please select a diagram type.');
        return;
    }

    component.isLoading = true;
    component.diagramOutput = '';
    component.renderSuccess = false;

    // The model cascade from your original file
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gpt-4o-mini"];
    let response = null;

    for (const model of modelsToTry) {
        try {
            const prompt = `
You are a Mermaid.js expert. Generate code for a ${component.selectedDiagram.name}.
The first line MUST be \`${component.selectedDiagram.syntax}\`.
Output ONLY raw Mermaid code. No explanations or markdown.

Example of Mindmap structure:
mindmap
  root((Topic))
    Branch 1
    Branch 2

User request: ${component.diagramInput}
`;
            response = await puter.ai.chat(prompt, { model: model });
            console.log(`✅ Used model: ${model}`);
            break; 
        } catch (error) {
            console.warn(`❌ Model failed: ${model}`, error.message);
            if (model === modelsToTry[modelsToTry.length - 1]) throw error;
        }
    }

    try {
        let mermaidCode = response.toString().trim().replace(/```mermaid\n?|```/g, '');
        if (!mermaidCode) throw new Error("Empty response from AI.");
        
        const { svg } = await mermaid.render('diagram-output-svg', mermaidCode);
        component.diagramOutput = svg;
        component.renderSuccess = true;

    } catch (error) {
        console.error('Mermaid rendering error:', error);
        component.renderSuccess = false;
        component.diagramOutput = `<div class="bg-red-100 text-red-800 p-4 rounded"><b>Error:</b> ${error.message}</div>`;
    } finally {
        component.isLoading = false;
    }
}