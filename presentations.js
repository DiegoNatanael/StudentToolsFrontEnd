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
You are creating a professional presentation with RICH, DETAILED content. Generate ${slidesConfig.slides} slides.

CRITICAL REQUIREMENTS:
- Each content slide MUST have 5-7 bullet points (not 3!)
- Bullet points should be SPECIFIC and INFORMATIVE (12-20 words each)
- Include data, examples, statistics, or concrete details
- Vary content types: definitions, processes, comparisons, benefits, challenges, examples
- Make every slide valuable - no generic filler content

SLIDE BREAKDOWN:
- Slide 1: Title slide (just title)
- Slides 2-${slidesConfig.slides - 1}: Dense content slides with specific information
- Last slide: Key takeaways with actionable insights

CONTENT QUALITY:
- Use specific terminology and detailed explanations
- Include quantifiable information where relevant
- Provide context and real-world applications
- Each bullet should teach something concrete

JSON format (MUST be valid):
{
  "title": "Presentation Title",
  "slides": [
    { "title": "Slide Title", "content": ["Detailed point 1...", "Detailed point 2...", "Point 3...", "Point 4...", "Point 5..."] }
  ]
}

Topic: ${component.presentationInput}
Generate ${slidesConfig.slides} information-rich slides.
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