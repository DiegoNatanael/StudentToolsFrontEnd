// documents.js

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
        const aiResponse = await puter.ai.chat(prompt, { model: "gemini-1.5-flash" });
        let contentJson;

        try {
            const cleanedResponse = aiResponse.toString().replace(/```json\n?|```/g, '').trim();
            contentJson = JSON.parse(cleanedResponse);
        } catch (e) {
            throw new Error("AI returned invalid JSON. Please try again.");
        }

        // ======================= START: THE FIX =======================
        // Point the fetch request to your live Render backend URL.
        const backendResponse = await fetch('https://studenttools.onrender.com/api/generate/docx', {
        // ======================= END: THE FIX =======================
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