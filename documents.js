// documents.js

let selectedStyle = "formal"; // Default style

export function updateStyle(style) {
    selectedStyle = style;
}

export async function generateDocument(component) {
    if (!component.documentInput.trim()) {
        alert('Please enter a document topic first.');
        return;
    }
    
    component.isLoading = true;
    component.documentOutput = '';

    try {
        const prompt = `
You are an expert content creator. Generate content for a document on the given topic.
You MUST respond with ONLY a valid JSON object, with this exact structure:
{
  "title": "Main Document Title",
  "sections": [
    { "header": "Section 1 Heading", "paragraphs": ["Paragraph 1.", "Paragraph 2."] },
    { "header": "Section 2 Heading", "paragraphs": ["A single paragraph."] }
  ]
}

Topic: ${component.documentInput}
`;
        
        // ======================= START: THE FIX =======================
        // Add the same model cascade logic from the diagram generator.
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gpt-4o-mini"];
        let aiResponse = null;

        for (const model of modelsToTry) {
            try {
                console.log(`Attempting to generate document with model: ${model}`);
                aiResponse = await puter.ai.chat(prompt, { model: model });
                console.log(`✅ Success with model: ${model}`);
                break; // Exit the loop on the first success
            } catch (error) {
                console.warn(`❌ Model failed: ${model}`, error.message);
                // If this was the last model in the list, re-throw the error to be caught below.
                if (model === modelsToTry[modelsToTry.length - 1]) {
                    throw new Error("All AI models failed to respond. Please try again later.");
                }
                // Otherwise, the loop will just continue to the next model.
            }
        }
        
        if (!aiResponse) {
             throw new Error("AI response was empty after trying all models.");
        }
        // ======================= END: THE FIX =======================

        let contentJson;
        try {
            const cleanedResponse = aiResponse.toString().replace(/```json\n?|```/g, '').trim();
            contentJson = JSON.parse(cleanedResponse);
        } catch (e) {
            throw new Error("AI returned invalid JSON. Please try again.");
        }

        // === SEND STYLE TO BACKEND ===
        const contentJsonWithStyle = {
            ...contentJson,
            style: selectedStyle
        };

        const backendResponse = await fetch('https://studenttools.onrender.com/api/generate/docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contentJsonWithStyle) // Send the object with style
        });

        if (!backendResponse.ok) {
            const error = await backendResponse.json();
            throw new Error(error.detail || `Backend error: ${backendResponse.status}`);
        }

        const blob = await backendResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contentJson.title.replace(/ /g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        component.documentOutput = `<div class="text-green-700 font-medium">Success! Your document '${a.download}' has started downloading.</div>`;

    } catch (error) {
        console.error('Document generation failed:', error);
        component.documentOutput = `<div class="text-red-700 font-medium"><b>Error:</b> ${error.message}</div>`;
    } finally {
        component.isLoading = false;
    }
}