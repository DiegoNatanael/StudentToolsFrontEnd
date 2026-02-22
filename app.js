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

// DOCUMENT GENERATION
document.getElementById('genDocBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const topic = document.getElementById('docInput').value.trim();

    if (!topic) return alert("Please enter a topic");
    if (btn.disabled) return;

    try {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

        console.log("%c--- 🏛️ COUNCIL OF MODELS INITIALIZED ---", "color: #00ffcc; font-weight: bold; font-size: 14px;");
        console.time("Council Processing Time");

        logStatus("Architecting professional report with LaTeX...", true);
        console.log("Stage 1: [ARCHITECT] Designing document structure...");

        // Step 1: Generate Plan
        const planResponse = await generateGeneric('/generate/plan', { topic, type: "document" });
        if (!planResponse) {
            console.error("Council Error: The pipeline was interrupted.");
            return;
        }

        const plan = await planResponse.json();
        console.log("Stage 2: [WRITER] Creative content generated.");
        console.log("Stage 3: [POLISHER] JSON & Syntax validation complete.");
        console.log("Plan Received:", plan);
        console.timeEnd("Council Processing Time");

        logStatus("Deep content structure established. Rendering PDF...");
        console.log("Final Stage: Rendering PDF via TeX engine...");

        // Step 2: Generate PDF
        const pdfResponse = await generateGeneric('/generate/pdf', plan);

        if (pdfResponse) {
            const blob = await pdfResponse.blob();
            downloadBlob(blob, `${plan.title.replace(/ /g, '_')}.pdf`);
            logStatus("Success! Your professional academic paper is ready.");
            hideLog();
        }
    } catch (error) {
        logStatus(`Pipeline Fail: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    }
});

/*
// PRESENTATION GENERATION
document.getElementById('genPptBtn').addEventListener('click', async () => {
    const topic = document.getElementById('pptInput').value.trim();
    if (!topic) return alert("Please enter a topic");

    logStatus("Brainstorming slides with Llama 3.1 405b...", true);

    const planResponse = await generateGeneric('/generate/plan', { topic, type: "presentation" });
    if (!planResponse) return;

    const plan = await planResponse.json();
    logStatus(`Planning ${ plan.slides.length } slides.Formatting PPTX...`);

    const pptResponse = await generateGeneric('/generate/pptx', {
        title: plan.title,
        slides: plan.slides
    });

    if (pptResponse) {
        const blob = await pptResponse.blob();
        downloadBlob(blob, `${ plan.title.replace(/ /g, '_') }.pptx`);
        logStatus("Presentation generated successfully!");
        hideLog();
    }
});
*/

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