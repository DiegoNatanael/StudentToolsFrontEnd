// presentations.js

let selectedPresentationStyle = "formal";

export function updatePresentationStyle(style) {
    selectedPresentationStyle = style;
    console.log('✅ Presentation style updated to:', style);
}

function getSlidesConfig(lengthLevel) {
    const configs = {
        1: { slides: 6, description: "5-8 slides" },
        2: { slides: 12, description: "10-15 slides" },
        3: { slides: 20, description: "18-25 slides" }
    };
    return configs[lengthLevel];
}

export async function generatePresentation(component) {
    if (!component.presentationInput.trim()) {
        alert('Please enter a presentation topic first.');
        return;
    }
    
    component.isLoading = true;
    component.presentationOutput = '';

    try {
        const slidesConfig = getSlidesConfig(component.presentationLength);
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gpt-4o-mini"];
        
        const prompt = `
You are creating a professional presentation. Generate ${slidesConfig.slides} slides for a presentation.

SLIDE STRUCTURE:
- First slide: Title slide with just the main title
- Slides 2-${slidesConfig.slides - 1}: Content slides with titles and 3-5 concise bullet points each
- Last slide: "Conclusion" or "Key Takeaways" summarizing main points

CONTENT GUIDELINES:
- Keep bullet points SHORT and IMPACTFUL (max 15 words per point)
- Use action-oriented language
- Vary slide types: some with facts, some with processes, some with comparisons
- Make it engaging and visual-friendly

JSON format:
{
  "title": "Presentation Title",
  "slides": [
    { "title": "Slide Title", "content": ["Bullet 1", "Bullet 2", "Bullet 3"] }
  ]
}

Topic: ${component.presentationInput}
Style: ${selectedPresentationStyle}
Generate exactly ${slidesConfig.slides} slides.
`;

        console.log(`📊 Generating ${slidesConfig.description} presentation`);
        
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

        console.log('📝 Selected presentation style:', selectedPresentationStyle);
        const contentWithStyle = {
            ...contentJson,
            style: selectedPresentationStyle
        };
        console.log('📤 Sending to backend:', contentWithStyle);

        const backendResponse = await fetch('https://studenttools.onrender.com/api/generate/pptx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contentWithStyle)
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
        
        component.presentationOutput = `<div class="text-green-700 font-medium">✅ Success! Your ${slidesConfig.description} presentation '${a.download}' has started downloading.</div>`;

    } catch (error) {
        console.error('❌ Presentation generation failed:', error);
        component.presentationOutput = `<div class="text-red-700 font-medium"><b>Error:</b> ${error.message}</div>`;
    } finally {
        component.isLoading = false;
    }
}

window.updatePresentationStyle = updatePresentationStyle;