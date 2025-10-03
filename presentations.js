// presentations.js

export async function generatePresentation(component) {
    if (!component.presentationInput.trim()) {
        alert('Please enter a presentation topic first.');
        return;
    }

    component.isLoading = true;
    component.presentationOutput = '';

    try {
        // 1. Craft a prompt to get presentation JSON from the AI
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
        // 2. Call Puter.js AI
        const aiResponse = await puter.ai.chat(prompt, { model: "gemini-1.5-flash" });
        let contentJson;

        // 3. Clean and parse the AI response
        try {
            const cleanedResponse = aiResponse.toString().replace(/```json\n?|```/g, '').trim();
            contentJson = JSON.parse(cleanedResponse);
        } catch (e) {
            throw new Error("AI returned invalid JSON. Please try again.");
        }
        
        // 4. Send the JSON to our Python backend's PPTX endpoint
        const backendResponse = await fetch('http://127.0.0.1:8000/api/generate/pptx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contentJson)
        });

        if (!backendResponse.ok) {
            const error = await backendResponse.json();
            throw new Error(error.detail || `Backend error: ${backendResponse.status}`);
        }

        // 5. Handle the file download
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