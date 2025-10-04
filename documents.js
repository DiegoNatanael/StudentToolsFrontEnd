// documents.js

let selectedStyle = "formal";

export function updateStyle(style) {
    selectedStyle = style;
    console.log('✅ Style updated to:', style);
}

// Helper function to determine pages needed
function getPagesConfig(lengthLevel) {
    const configs = {
        1: { pages: "3-5", sections: 3, calls: 1 },
        2: { pages: "7-10", sections: 5, calls: 2 },
        3: { pages: "15-20", sections: 8, calls: 3 }
    };
    return configs[lengthLevel];
}

export async function generateDocument(component) {
    if (!component.documentInput.trim()) {
        alert('Please enter a document topic first.');
        return;
    }
    
    component.isLoading = true;
    component.documentOutput = '';

    try {
        const lengthConfig = getPagesConfig(component.documentLength);
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gpt-4o-mini"];
        
        let allSections = [];
        let documentTitle = "";

        // === MULTI-CALL STRATEGY ===
        for (let callNum = 1; callNum <= lengthConfig.calls; callNum++) {
            const sectionsPerCall = Math.ceil(lengthConfig.sections / lengthConfig.calls);
            
            let contextPrompt = "";
            if (callNum > 1) {
                // Provide context from previous sections
                const previousSections = allSections.map(s => s.header).join(", ");
                contextPrompt = `\n\nPrevious sections covered: ${previousSections}. Continue from where they left off, DO NOT repeat these topics.`;
            }

            const prompt = `
You are an expert content creator. Generate ${callNum === 1 ? 'the beginning of' : 'continuation of'} a comprehensive ${lengthConfig.pages}-page document on the given topic.

CRITICAL REQUIREMENTS:
- Generate exactly ${sectionsPerCall} DISTINCT sections
- Each section MUST have 3-5 paragraphs minimum (150-250 words per paragraph)
- Use VARIED section structures: some with subsections, some with examples, some with analysis
- DO NOT follow a repetitive pattern (avoid: concept → definition → concept → definition)
- Mix different content types: explanations, examples, case studies, analysis, implications, comparisons
${contextPrompt}

You MUST respond with ONLY a valid JSON object:
{
  "title": "Main Document Title",
  "sections": [
    { "header": "Section Title", "paragraphs": ["Long paragraph 1 (150-250 words).", "Long paragraph 2.", "Long paragraph 3."] }
  ]
}

Topic: ${component.documentInput}
Call ${callNum} of ${lengthConfig.calls} - Generate sections ${(callNum-1)*sectionsPerCall + 1} to ${callNum*sectionsPerCall}
`;

            console.log(`📝 Generating part ${callNum}/${lengthConfig.calls}`);
            
            let aiResponse = null;
            for (const model of modelsToTry) {
                try {
                    console.log(`Attempting with model: ${model}`);
                    aiResponse = await puter.ai.chat(prompt, { model: model });
                    console.log(`✅ Success with model: ${model}`);
                    break;
                } catch (error) {
                    console.warn(`❌ Model failed: ${model}`, error.message);
                    if (model === modelsToTry[modelsToTry.length - 1]) {
                        throw new Error("All AI models failed. Please try again.");
                    }
                }
            }
            
            if (!aiResponse) {
                throw new Error("AI response was empty after trying all models.");
            }

            let contentJson;
            try {
                const cleanedResponse = aiResponse.toString().replace(/```json\n?|```/g, '').trim();
                contentJson = JSON.parse(cleanedResponse);
            } catch (e) {
                throw new Error("AI returned invalid JSON. Please try again.");
            }

            // Store title from first call
            if (callNum === 1) {
                documentTitle = contentJson.title;
            }

            // Accumulate sections
            allSections = allSections.concat(contentJson.sections);
            
            // Show progress
            component.documentOutput = `<div class="text-blue-700 font-medium">Generating... Part ${callNum}/${lengthConfig.calls} complete</div>`;
        }

        // === SEND TO BACKEND ===
        console.log('📝 Selected style before sending:', selectedStyle);
        const contentJsonWithStyle = {
            title: documentTitle,
            sections: allSections,
            style: selectedStyle
        };
        console.log('📤 Sending to backend:', contentJsonWithStyle);

        const backendResponse = await fetch('https://studenttools.onrender.com/api/generate/docx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contentJsonWithStyle)
        });

        if (!backendResponse.ok) {
            const error = await backendResponse.json();
            throw new Error(error.detail || `Backend error: ${backendResponse.status}`);
        }

        const blob = await backendResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentTitle.replace(/ /g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        component.documentOutput = `<div class="text-green-700 font-medium">✅ Success! Your ${lengthConfig.pages}-page document '${a.download}' has started downloading.</div>`;

    } catch (error) {
        console.error('❌ Document generation failed:', error);
        component.documentOutput = `<div class="text-red-700 font-medium"><b>Error:</b> ${error.message}</div>`;
    } finally {
        component.isLoading = false;
    }
}

window.updateStyle = updateStyle;