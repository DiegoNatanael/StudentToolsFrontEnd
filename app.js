// app.js

// --- API Endpoints ---
const AI_API = "https://studenttools.onrender.com/api";      // AI Backend (Python/FastAPI)
const LARAVEL_API = "http://127.0.0.1:8001/api";             // Laravel Backend (Auth + Quota)

// --- UI Elements ---
const navButtons = document.querySelectorAll('.nav-btn:not(.auth-btn):not(.logout-btn)');
const sections = document.querySelectorAll('.hero-section');
const logOverlay = document.getElementById('statusLog');
const logMessages = document.getElementById('logMessages');

// --- Auth State ---
let authToken = localStorage.getItem('ST_AUTH_TOKEN');
let currentUser = null;
let currentSection = 'docs';
let currentDiagType = 'Flowchart';

// ============================================================
// AUTH SYSTEM
// ============================================================

const authOverlay = document.getElementById('authOverlay');
const openAuthBtn = document.getElementById('openAuthBtn');
const closeAuthBtn = document.getElementById('closeAuth');
const userInfoEl = document.getElementById('userInfo');
const userNameEl = document.getElementById('userName');
const quotaBadgeEl = document.getElementById('quotaBadge');
const logoutBtn = document.getElementById('logoutBtn');

// Open/Close Auth Modal
openAuthBtn.addEventListener('click', () => authOverlay.classList.remove('hidden'));
closeAuthBtn.addEventListener('click', () => authOverlay.classList.add('hidden'));
authOverlay.addEventListener('click', (e) => {
    if (e.target === authOverlay) authOverlay.classList.add('hidden');
});

// Tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        const formId = tab.dataset.tab === 'login' ? 'loginForm' : 'registerForm';
        document.getElementById(formId).classList.add('active');
    });
});

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('loginError');
    errorEl.classList.add('hidden');

    try {
        const resp = await fetch(`${LARAVEL_API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value,
            })
        });

        const data = await resp.json();
        if (!resp.ok) throw new Error(data.message || data.errors?.email?.[0] || 'Login failed');

        handleAuthSuccess(data);
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
    }
});

// Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('registerError');
    errorEl.classList.add('hidden');

    try {
        const resp = await fetch(`${LARAVEL_API}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                password_confirmation: document.getElementById('regPasswordConfirm').value,
            })
        });

        const data = await resp.json();
        if (!resp.ok) {
            const firstError = data.errors ? Object.values(data.errors)[0][0] : data.message;
            throw new Error(firstError || 'Registration failed');
        }

        handleAuthSuccess(data);
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
    }
});

function handleAuthSuccess(data) {
    authToken = data.token;
    currentUser = data.user;
    localStorage.setItem('ST_AUTH_TOKEN', authToken);
    updateAuthUI();
    authOverlay.classList.add('hidden');
    refreshQuota();
}

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${LARAVEL_API}/logout`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
    } catch (e) { /* ignore */ }

    authToken = null;
    currentUser = null;
    localStorage.removeItem('ST_AUTH_TOKEN');
    updateAuthUI();
});

function updateAuthUI() {
    if (authToken && currentUser) {
        userInfoEl.classList.remove('hidden');
        openAuthBtn.classList.add('hidden');
        userNameEl.textContent = currentUser.name;
    } else {
        userInfoEl.classList.add('hidden');
        openAuthBtn.classList.remove('hidden');
    }
}

async function refreshQuota() {
    if (!authToken) return;
    try {
        const resp = await fetch(`${LARAVEL_API}/check-quota`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!resp.ok) {
            if (resp.status === 401) { handleExpiredToken(); return; }
            return;
        }
        const data = await resp.json();
        quotaBadgeEl.textContent = data.remaining === 'unlimited' ? '∞' : data.remaining;
        quotaBadgeEl.classList.toggle('low', data.remaining !== 'unlimited' && data.remaining <= 1);
    } catch (e) { console.warn('Quota check failed:', e); }
}

function handleExpiredToken() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('ST_AUTH_TOKEN');
    updateAuthUI();
}

// Check existing token on load
async function initAuth() {
    if (!authToken) { updateAuthUI(); return; }
    try {
        const resp = await fetch(`${LARAVEL_API}/me`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!resp.ok) throw new Error('Invalid token');
        currentUser = await resp.json();
        updateAuthUI();
        refreshQuota();
    } catch (e) {
        handleExpiredToken();
    }
}
initAuth();

// ============================================================
// QUOTA GATE — checks Laravel before allowing generation
// ============================================================

async function checkQuotaGate() {
    // If no auth token, prompt login
    if (!authToken) {
        authOverlay.classList.remove('hidden');
        return false;
    }

    try {
        const resp = await fetch(`${LARAVEL_API}/check-quota`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (resp.status === 401) { handleExpiredToken(); authOverlay.classList.remove('hidden'); return false; }
        const data = await resp.json();

        if (!data.allowed) {
            logStatus("Daily quota exceeded! Come back tomorrow or upgrade.", true);
            hideLog();
            return false;
        }
        return true;
    } catch (e) {
        console.warn('Quota check failed, allowing generation:', e);
        return true; // Fail open if Laravel is down
    }
}

async function logGeneration(type, topic) {
    if (!authToken) return;
    try {
        await fetch(`${LARAVEL_API}/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ type, topic })
        });
        refreshQuota();
    } catch (e) { console.warn('Generation log failed:', e); }
}

// ============================================================
// NAVIGATION
// ============================================================

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

// ============================================================
// LOGGER SYSTEM
// ============================================================

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

// ============================================================
// AI API HELPER (talks to Python backend)
// ============================================================

function getDeviceId() {
    const info = [
        navigator.userAgent,
        screen.height,
        screen.width,
        new Date().getTimezoneOffset()
    ].join('|');

    let hash = 0;
    for (let i = 0; i < info.length; i++) {
        const char = info.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

async function generateGeneric(endpoint, body, onSuccess) {
    const adminToken = localStorage.getItem('STUDENT_TOOLS_ADMIN');
    const deviceId = getDeviceId();

    try {
        const response = await fetch(`${AI_API}${endpoint}`, {
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

// ============================================================
// DOCUMENT GENERATION (with Laravel quota)
// ============================================================

document.getElementById('genDocBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const topic = document.getElementById('docInput').value.trim();

    if (!topic) return alert("Please enter a topic");
    if (btn.disabled) return;

    // CHECK QUOTA FIRST
    if (!(await checkQuotaGate())) return;

    try {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

        logStatus("AI is writing your LaTeX document...", true);

        const planResponse = await generateGeneric('/generate/plan', { topic, type: "document" });
        if (!planResponse) return;

        const result = await planResponse.json();
        logStatus("LaTeX generated! Compiling PDF...");

        const pdfResponse = await generateGeneric('/generate/pdf', { latex: result.latex });

        if (pdfResponse) {
            const blob = await pdfResponse.blob();
            const safeName = topic.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/ /g, '_');
            downloadBlob(blob, `${safeName}.pdf`);
            logStatus("Success! Your professional document is ready.");

            // LOG TO LARAVEL
            await logGeneration('document', topic);
            hideLog();
        }
    } catch (error) {
        logStatus(`Error: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    }
});

// ============================================================
// PRESENTATION GENERATION (with Laravel quota)
// ============================================================

let lastGeneratedSlides = null;

document.getElementById('genPptBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const topic = document.getElementById('pptInput').value.trim();
    if (!topic) return alert("Please enter a topic");
    if (btn.disabled) return;

    // CHECK QUOTA FIRST
    if (!(await checkQuotaGate())) return;

    try {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        logStatus("Planning your presentation slides...", true);

        const response = await generateGeneric('/generate/plan', { topic, type: "presentation" });
        if (!response) return;

        const data = await response.json();
        lastGeneratedSlides = data;

        logStatus(`Generated ${data.slides.length} slides. Building deck...`);
        renderRevealPresentation(data);
        logOverlay.classList.add('hidden');

        // LOG TO LARAVEL
        await logGeneration('presentation', topic);
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

document.getElementById('revealContainer').addEventListener('mousedown', (e) => {
    if (window.currentDeck && e.button === 0) {
        window.currentDeck.next();
    }
});

document.getElementById('closePresentation').addEventListener('click', () => {
    document.getElementById('presentationOverlay').classList.add('hidden');
});

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

// ============================================================
// DIAGRAM GENERATION (with Laravel quota)
// ============================================================

document.getElementById('genDiagBtn').addEventListener('click', async () => {
    const topic = document.getElementById('diagInput').value.trim();
    const type = currentDiagType;
    if (!topic) return alert("Please enter a topic");

    // CHECK QUOTA FIRST
    if (!(await checkQuotaGate())) return;

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

            // LOG TO LARAVEL
            await logGeneration('diagram', topic);
        } catch (e) {
            container.innerHTML = '<div class="text-red-500">Render Error. Try clarifying your description.</div>';
        }
        hideLog();
    }
});

// ============================================================
// UTILITIES
// ============================================================

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
window.activateGodMode = (pw) => {
    localStorage.setItem('STUDENT_TOOLS_ADMIN', pw);
    console.log("God Mode Activated. Unlimited uses enabled.");
};

// --- Admin Check on Load ---
async function checkAdminStatus() {
    try {
        const adminToken = localStorage.getItem('STUDENT_TOOLS_ADMIN');
        const response = await fetch(`${AI_API}/health`, {
            headers: { 'X-Admin-Token': adminToken || "" }
        });
        const data = await response.json();
        if (data.is_admin) {
            console.log("God Mode Status: ACTIVE 👑");
        } else {
            console.warn("God Mode Status: INACTIVE 👤");
        }
    } catch (e) { }
}
checkAdminStatus();

// Initialize Mermaid
mermaid.initialize({ startOnLoad: false, theme: 'dark' });