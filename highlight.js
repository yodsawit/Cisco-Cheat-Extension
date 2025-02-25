let qpair = []; // Store question-answer pairs globally

// ✅ Listen for messages from content.js
window.addEventListener("message", (event) => {
    if (event.source !== window || event.data.type !== "SET_QUESTION_ANSWER_PAIRS") return;
    
    qpair = event.data.qpair; // Store question-answer pairs

    //console.log("Received qpair:", qpair);
    
    if (!Array.isArray(qpair)) {
        console.error("Expected qpair to be an array, but received:", typeof qpair);
        return;
    }

    highlightQuestionsAndAnswers(); // Re-run highlighting when pairs arrive
});

// Function to decode HTML entities in text
function decodeHtmlEntities(text) {
    if (!text) return "";

    return text
        .replace(/&nbsp;|&#160;|\u00A0/g, " ")  // Replace all non-breaking spaces
        .replace(/&amp;/g, "&")  
        .replace(/&lt;/g, "<")  
        .replace(/&gt;/g, ">")  
        .replace(/&quot;/g, '"')  
        .replace(/&#39;/g, "'")  
        .replace(/&rsquo;/g, "'")  
        .replace(/&lsquo;/g, "'")  
        .replace(/&ldquo;/g, '"')  
        .replace(/&rdquo;/g, '"')  
        .replace(/\s+/g, " ")  // Collapse multiple spaces into a single space
        .trim();
}


function highlightQuestionsAndAnswers() {
    function highlightInDocument(doc) {
        doc.querySelectorAll("div, span, p, label").forEach(el => {
            const text = decodeHtmlEntities(el.textContent.toLowerCase());
            // if (text.includes("parameter is commonly used to identify a wireless network")) {
            //     console.log("Debugging text before comparison:", text);
            
            //     const qpairQuestion = decodeHtmlEntities(
            //         qpair.find(q => q.question.toLowerCase().includes("parameter is commonly used to identify a wireless network"))
            //         ?.question || ""
            //     ).toLowerCase();
            
            //     console.log("Debugging qpairQuestion before comparison:", qpairQuestion);
            
            //     console.log("Text char codes:", text.split("").map(c => c.charCodeAt(0)));
            //     console.log("Qpair char codes:", qpairQuestion.split("").map(c => c.charCodeAt(0)));
            
            //     console.log("Comparison result:", text === qpairQuestion);
            // }            
            
            // Check if the element contains a question
            const matchingQuestion = qpair.find(q => decodeHtmlEntities(q.question.toLowerCase()) === text);
            if (matchingQuestion && !el.dataset.highlighted) {
                // Highlight the question
                el.style.backgroundColor = "yellow";  
                el.style.fontWeight = "bold";
                el.dataset.highlighted = "true";

                // After highlighting the question, find the corresponding answer
                highlightAnswer(matchingQuestion, el);
            }
        });

        // Recursively check shadow DOMs
        doc.querySelectorAll("*").forEach(el => {
            if (el.shadowRoot) {
                highlightInDocument(el.shadowRoot); // Traverse into shadow root
            }
        });
    }

    function highlightAnswer(matchingQuestion, questionElement) {
        // Ensure matchingQuestion.answers is an array and contains elements
        if (!Array.isArray(matchingQuestion.answers) || matchingQuestion.answers.length === 0) {
            console.error("Answers are undefined or not an array for question:", matchingQuestion.question);
            return;
        }

        // Find the closest mcq__inner container, even if it's inside a shadow DOM
        const mcqContainer = findClosestMCQContainer(questionElement);

        if (!mcqContainer) {
            console.error("MCQ container not found for question:", matchingQuestion.question);
            return;
        }

        // Find all elements with text inside the mcq container (div, span, p, label)
        const textElements = mcqContainer.querySelectorAll("div, span, p, label");

        textElements.forEach(el => {
            const text = decodeHtmlEntities(el.textContent.toLowerCase());

            // Check if the answer text matches any of the correct answers in the array
            if (matchingQuestion.answers.some(answer => decodeHtmlEntities(answer.toLowerCase()) === text)) {
                console.log("Highlighting answer:", text);

                // Highlight the correct answer within the innermost mcq container
                el.style.backgroundColor = "lightgreen";
                el.style.fontWeight = "bold";
            }
        });
    }

    function findClosestMCQContainer(element) {
        let parentElement = element;

        // Traverse upwards through the DOM, including shadow roots
        while (parentElement) {
            if (parentElement.classList && parentElement.classList.contains("mcq__inner")) {
                return parentElement;
            }

            if (!parentElement.parentElement) {
                parentElement = parentElement.getRootNode().host;
            } else {
                parentElement = parentElement.parentElement;
            }
        }

        return null;
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

// Run every 3 seconds to detect new content
setInterval(highlightQuestionsAndAnswers, 3000);
