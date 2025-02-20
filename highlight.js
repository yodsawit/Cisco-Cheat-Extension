let correctAnswers = new Set(); // Store correct answers globally

// Listen for messages from content.js
window.addEventListener("message", (event) => {
    if (event.source !== window || event.data.type !== "SET_CORRECT_ANSWERS") return;
    
    correctAnswers = new Set(event.data.answers.map(ans => ans.toLowerCase().trim()));
    console.log("Correct answers received in highlight.js:", correctAnswers); // ✅ Log received data

    highlightAnswers(); // Re-run highlighting when answers arrive
});

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

        // ✅ Recursively check shadow DOMs
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
                    console.warn("Ignoring CORS iframe:", error);
                    iframe.dataset.corsErrorLogged = true;
                }
            }
        });
    }

    highlightInDocument(document);
    processIframes();
}

// ✅ Run every 3 seconds to detect new content
setInterval(highlightAnswers, 3000);
