let correctAnswers = new Set();

// ✅ Listen for messages from content.js
window.addEventListener("message", (event) => {
    if (event.source !== window || event.data.type !== "SET_CORRECT_ANSWERS") return;
    
    correctAnswers = new Set(event.data.answers.map(ans => ans.toLowerCase().trim()));
    console.log("✅ [highlight.js] Correct answers updated:", correctAnswers);

    highlightAnswers(); // Apply highlights immediately
});

// ✅ Highlight correct answers
function highlightAnswers() {
    function highlightInDocument(doc) {
        doc.querySelectorAll("div, span, p, label").forEach(el => {
            const text = el.textContent.trim().toLowerCase();
            if (correctAnswers.has(text) && !el.dataset.highlighted) {
                el.style.backgroundColor = "lightgreen";
                el.style.fontWeight = "bold";
                el.dataset.highlighted = "true";
            }
        });

        // ✅ Process shadow DOMs
        doc.querySelectorAll("*").forEach(el => {
            if (el.shadowRoot) {
                highlightInDocument(el.shadowRoot);
            }
        });
    }

    function processIframes() {
        document.querySelectorAll("iframe").forEach(iframe => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc) {
                    highlightInDocument(doc);
                }
            } catch (error) {
                if (!iframe.dataset.corsErrorLogged) {
                    console.warn("⚠️ [highlight.js] CORS issue on iframe:", error);
                    iframe.dataset.corsErrorLogged = true;
                }
            }
        });
    }

    highlightInDocument(document);
    processIframes();
}

// ✅ Observe DOM changes for new content (instead of `setInterval`)
const observer = new MutationObserver(() => {
    highlightAnswers();
});
observer.observe(document.body, { childList: true, subtree: true });
