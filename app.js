// app.js

// Set this to your Production API Route (Render)
const API_BASE = "https://studenttools.onrender.com/api";

// --- UI Elements ---
const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.hero-section');
const logOverlay = document.getElementById('statusLog');
const logMessages = document.getElementById('logMessages');

// --- State Management ---
let currentSection = 'docs';
let currentDiagType = 'Flowchart';

// --- Navigation ---
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.section;
        navButtons.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(target).classList.add('active');
        currentSection = target;
    });
});

// --- Diagram Picker Logic ---
const diagTypeCards = document.querySelectorAll('.diag-type-card');
diagTypeCards.forEach(card => {
    card.addEventListener('click', () => {
        diagTypeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        currentDiagType = card.dataset.type;
    });
});

// --- Logger System ---
function logStatus(message, isNew = false) {
    if (isNew) logMessages.innerHTML = "";
    logOverlay.classList.remove('hidden');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    msgDiv.textContent = `> ${message} `;
    logMessages.appendChild(msgDiv);
    logMessages.scrollTop = logMessages.scrollHeight;
}

function hideLog() {
    setTimeout(() => {
        logOverlay.classList.add('hidden');
    }, 2000);
}

// --- API Helpers ---
function getDeviceId() {
    const info = [
        navigator.userAgent,
        screen.height,
        screen.width,
        new Date().getTimezoneOffset()
    ].join('|');

    // Simple hash function for the string
    let hash = 0;
    for (let i = 0; i < info.length; i++) {
        const char = info.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

async function generateGeneric(endpoint, body, onSuccess) {
    const adminToken = localStorage.getItem('STUDENT_TOOLS_ADMIN');
    const deviceId = getDeviceId();

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': adminToken || "",
                'X-Device-Id': deviceId
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(await response.text());

        return response;
    } catch (error) {
        logStatus(`Error: ${error.message} `);
        console.error(error);
        return null;
    }
}

// --- Specific Generators ---

// DOCUMENT GENERATION (V2 — Direct LaTeX Pipeline)
document.getElementById('genDocBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const topic = document.getElementById('docInput').value.trim();

    if (!topic) return alert("Please enter a topic");
    if (btn.disabled) return;

    try {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

        console.log("%c--- 🏛️ COUNCIL V2 (Direct LaTeX) ---", "color: #00ffcc; font-weight: bold; font-size: 14px;");
        console.time("Total Generation Time");

        logStatus("AI is writing your LaTeX document...", true);
        console.log("[Step 1] Classifying scale & generating LaTeX...");

        // Step 1: Generate LaTeX code
        const planResponse = await generateGeneric('/generate/plan', { topic, type: "document" });
        if (!planResponse) {
            console.error("Pipeline Error: LaTeX generation was interrupted.");
            return;
        }

        const result = await planResponse.json();
        const latexSize = result.latex ? result.latex.length : 0;
        console.log(`[Step 1 Complete] LaTeX received: ${latexSize} chars`);

        logStatus("LaTeX generated! Compiling PDF...");
        console.log("[Step 2] Compiling LaTeX → PDF...");

        // Step 2: Compile LaTeX to PDF
        const pdfResponse = await generateGeneric('/generate/pdf', { latex: result.latex });

        if (pdfResponse) {
            const blob = await pdfResponse.blob();
            const safeName = topic.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/ /g, '_');
            downloadBlob(blob, `${safeName}.pdf`);
            console.timeEnd("Total Generation Time");
            logStatus("Success! Your professional document is ready.");
            hideLog();
        }
    } catch (error) {
        console.error("Pipeline Error:", error);
        logStatus(`Error: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    }
});

// --- Global State for Presentation ---
let lastGeneratedSlides = null;

// PRESENTATION GENERATION
document.getElementById('genPptBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const topic = document.getElementById('pptInput').value.trim();
    if (!topic) return alert("Please enter a topic");
    if (btn.disabled) return;

    try {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        logStatus("Planning your presentation slides...", true);

        // Step 1: Generate the plan/content
        const response = await generateGeneric('/generate/plan', { topic, type: "presentation" });
        if (!response) return;

        const data = await response.json();
        lastGeneratedSlides = data;

        logStatus(`Generated ${data.slides.length} slides. Building deck...`);

        // Step 2: Render in Overlay
        renderRevealPresentation(data);

        logOverlay.classList.add('hidden');
    } catch (error) {
        logStatus(`Error: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
    }
});

function renderRevealPresentation(data) {
    const overlay = document.getElementById('presentationOverlay');
    const container = document.getElementById('revealContainer');

    // Create Reveal structure matching TOEFL template
    let slidesHtml = data.slides.map((slide) => {
        const layout = slide.layout || 'text';

        if (layout === 'intro') {
            return `
                <section>
                    <h3>${slide.section || 'PRESENTACIÓN'}</h3>
                    <div class="divider"></div>
                    <h1>${slide.h1 || data.title}</h1>
                    <p>${slide.p || ''}</p>
                </section>
            `;
        } else if (layout === 'table' && slide.table) {
            const headers = slide.table.headers.map(h => `<th>${h}</th>`).join('');
            const rows = slide.table.rows.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
            return `
                <section>
                    <h3>${slide.section || 'DATOS'}</h3>
                    <h2>${slide.h2 || ''}</h2>
                    <div class="divider"></div>
                    <table>
                        <thead><tr>${headers}</tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </section>
            `;
        } else if (layout === 'conclusion') {
            return `
                <section>
                    <div class="center-content">
                        <h3>${slide.section || 'FINAL'}</h3>
                        <h1>${slide.h1 || 'Conclusión'}</h1>
                        <div class="divider"></div>
                        <p>${slide.p || ''}</p>
                    </div>
                </section>
            `;
        } else {
            // Default "Text" layout
            return `
                <section>
                    <div class="container slide-container">
                        <div class="col-text">
                            <h3>${slide.section || ''}</h3>
                            <h2>${slide.h2 || ''}</h2>
                            <div class="divider"></div>
                            ${slide.quote ? `<blockquote>${slide.quote}</blockquote>` : `<p>${slide.p || ''}</p>`}
                            ${slide.source ? `<a href="#" class="source-link">${slide.source}</a>` : ''}
                        </div>
                    </div>
                </section>
            `;
        }
    }).join('');

    container.innerHTML = `
        <div class="reveal">
            <div class="slides">
                ${slidesHtml}
            </div>
        </div>
    `;

    overlay.classList.remove('hidden');

    // Initialize Reveal
    const deck = new Reveal(container.querySelector('.reveal'), {
        controls: false,
        progress: false,
        center: true,
        hash: false,
        transition: 'fade',
        transitionSpeed: 'slow',
        width: 1200,
        height: 900
    });

    deck.initialize().then(() => {
        animateSlide(deck.getCurrentSlide());
        deck.on('slidechanged', event => animateSlide(event.currentSlide));
    });

    window.currentDeck = deck;
}

function animateSlide(slide) {
    const elements = slide.querySelectorAll('h1, h2, h3, p, .divider, blockquote, table, .source-link');
    gsap.fromTo(elements,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: "power3.out" }
    );
}

// Global click to advance
document.getElementById('revealContainer').addEventListener('mousedown', (e) => {
    if (window.currentDeck && e.button === 0) {
        window.currentDeck.next();
    }
});

// Close Presentation
document.getElementById('closePresentation').addEventListener('click', () => {
    document.getElementById('presentationOverlay').classList.add('hidden');
});

// Download PPTX
document.getElementById('downloadPptxBtn').addEventListener('click', async () => {
    if (!lastGeneratedSlides) return;

    logStatus("Converting to PPTX format...", true);
    const pptResponse = await generateGeneric('/generate/pptx', {
        title: lastGeneratedSlides.title,
        slides: lastGeneratedSlides.slides
    });

    if (pptResponse) {
        const blob = await pptResponse.blob();
        downloadBlob(blob, `${lastGeneratedSlides.title.replace(/ /g, '_')}.pptx`);
        hideLog();
    }
});

// DIAGRAM GENERATION
document.getElementById('genDiagBtn').addEventListener('click', async () => {
    const topic = document.getElementById('diagInput').value.trim();
    const type = currentDiagType;
    if (!topic) return alert("Please enter a topic");

    const container = document.getElementById('mermaidOutput');
    container.innerHTML = '<div class="loader"></div>';
    logStatus(`Architecting ${type} diagram...`, true);

    const response = await generateGeneric('/generate/diagram', { topic, type });
    if (response) {
        const data = await response.json();
        logStatus("Diagram logic established. Rendering...");

        container.removeAttribute('data-processed');
        container.innerHTML = data.code;
        try {
            await mermaid.run({ nodes: [container] });
            logStatus("Visualization complete.");
        } catch (e) {
            container.innerHTML = '<div class="text-red-500">Render Error. Try clarifying your description.</div>';
        }
        hideLog();
    }
});

// --- Utility Functions ---
function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
}

// --- God Mode Secret Activation ---
// Open console and type: activateGodMode("your_password")
window.activateGodMode = (pw) => {
    localStorage.setItem('STUDENT_TOOLS_ADMIN', pw);
    console.log("God Mode Activated. Unlimited uses enabled.");
};

// --- Admin Check on Load ---
async function checkAdminStatus() {
    try {
        const adminToken = localStorage.getItem('STUDENT_TOOLS_ADMIN');
        const response = await fetch(`${API_BASE}/health`, {
            headers: { 'X-Admin-Token': adminToken || "" }
        });
        const data = await response.json();
        if (data.is_admin) {
            console.log("God Mode Status: ACTIVE 👑");
        } else {
            console.warn("God Mode Status: INACTIVE 👤 (1 use per day)");
        }
    } catch (e) { }
}
checkAdminStatus();

// Initialize Mermaid
mermaid.initialize({ startOnLoad: false, theme: 'dark' });