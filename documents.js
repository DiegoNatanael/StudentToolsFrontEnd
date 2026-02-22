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
You are a student researcher writing an investigative report. Generate ${callNum === 1 ? 'the beginning of' : 'continuation of'} a ${lengthConfig.pages}-page research document.

WRITING STYLE:
- Write in flowing, connected prose with smooth transitions
- NEVER use bullet points - only narrative paragraphs
- Blend analysis, examples, and evidence naturally
- Use academic phrases: "Research indicates...", "Evidence suggests...", "This demonstrates..."
- Connect ideas with transitions: "Furthermore...", "However...", "In light of this..."

STRUCTURE:
- Generate ${sectionsPerCall} major sections with VARIED lengths and structures
- Some sections should be brief (2-3 paragraphs), others extensive (6-8 paragraphs)
- Paragraph lengths should vary naturally: some short (100 words), others detailed (300+ words)
- Mix different section types: some analytical, some descriptive, some comparative
- Break monotony - no two sections should follow the same pattern
${contextPrompt}

DEPTH & QUALITY:
- Provide comprehensive coverage with specific details
- Include concrete examples and real-world applications
- Discuss implications, significance, and broader context
- Where relevant, acknowledge different perspectives or complexities

JSON format:
{
  "title": "Document Title",
  "sections": [
    { "header": "Section Title", "paragraphs": ["Paragraph 1...", "Paragraph 2..."] }
  ]
}

Topic: ${component.documentInput}
Part ${callNum} of ${lengthConfig.calls}
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