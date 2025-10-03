// documents.js

// This function is exported so app.js can import it.
// It accepts the Alpine component ("this") as an argument to access its data.
export async function generateDocument(component) {
    if (!component.documentInput.trim()) {
        alert('Please enter a document topic first.');
        return;
    }
    
    component.isLoading = true;
    component.documentOutput = ''; // Clear previous status

    try {
        // 1. Craft the prompt to get structured JSON from the AI
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

        // 4. Send the JSON to our Python backend
        const backendResponse = await fetch('http://127.0.0.1:8000/api/generate/docx', {
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