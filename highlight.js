function highlightAnswers() {
    function highlightInDocument(doc) {
        doc.querySelectorAll("div, span, p").forEach(el => {
            // Normalize text and check if it contains the phrase
            const text = el.textContent.trim().toLowerCase();
            if (text.includes("why should i take this module?") && !el.dataset.highlighted) {
                el.style.backgroundColor = "yellow";
                el.style.fontWeight = "bold";
                el.dataset.highlighted = "true"; // Prevent reprocessing
            }
        });

        // Handle shadow DOMs
        doc.querySelectorAll("*").forEach(el => {
            if (el.shadowRoot) {
                highlightInDocument(el.shadowRoot); // Recursively highlight inside shadow DOM
            }
        });
    }

    function processIframes() {
        document.querySelectorAll("iframe").forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    highlightInDocument(iframeDoc);
                }
            } catch (e) {
                console.warn("Cannot access iframe due to CORS restrictions:", e);
            }
        });
    }

    // Run initially and then periodically
    highlightInDocument(document);
    processIframes();
    setInterval(() => {
        highlightInDocument(document);
        processIframes();
    }, 2000);
}

// Call the function to highlight answers
highlightAnswers();
