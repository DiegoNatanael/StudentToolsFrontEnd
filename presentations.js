// presentations.js

export async function generatePresentation(component) {
    if (!component.presentationInput.trim()) {
        alert('Please enter a presentation topic first.');
        return;
    }

    component.isLoading = true;
    component.presentationOutput = '';

    try {
        const prompt = `
You are an expert presentation creator. Generate content for a slide deck on the given topic.
You MUST respond with ONLY a valid JSON object, with this exact structure:
{
  "title": "Main Presentation Title",
  "slides": [
    { "title": "Slide 1 Title", "content": ["Bullet point 1.", "Bullet point 2."] },
    { "title": "Slide 2 Title", "content": ["Another bullet point.", "And another."] }
  ]
}

Topic: ${component.presentationInput}
`;
        
        // ======================= START: THE FIX =======================
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gpt-4o-mini"];
        let aiResponse = null;

        for (const model of modelsToTry) {
            try {
                console.log(`Attempting to generate presentation with model: ${model}`);
                aiResponse = await puter.ai.chat(prompt, { model: model });
                console.log(`✅ Success with model: ${model}`);
                break; // Exit the loop on the first success
            } catch (error) {
                console.warn(`❌ Model failed: ${model}`, error.message);
                if (model === modelsToTry[modelsToTry.length - 1]) {
                    throw new Error("All AI models failed to respond. Please try again later.");
                }
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
        
        const backendResponse = await fetch('https://studenttools.onrender.com/api/generate/pptx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contentJson)
        });

        if (!backendResponse.ok) {
            const error = await backendResponse.json();
            throw new Error(error.detail || `Backend error: ${backendResponse.status}`);
        }

        const blob = await backendResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contentJson.title.replace(/ /g, '_')}.pptx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        component.presentationOutput = `<div class="text-green-700 font-medium">Success! Your presentation '${a.download}' has started downloading.</div>`;

    } catch (error) {
        console.error('Presentation generation failed:', error);
        component.presentationOutput = `<div class="text-red-700 font-medium"><b>Error:</b> ${error.message}</div>`;
    } finally {
        component.isLoading = false;
    }
}