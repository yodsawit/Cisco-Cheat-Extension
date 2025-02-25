// Inject highlight.js into the page
function injectScript(file) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(file);
    script.type = "text/javascript";
    script.async = false;
    document.documentElement.appendChild(script);
}

// Fetch quiz answers from storage and pass them to highlight.js
chrome.storage.local.get("quizData", (data) => {
    if (data.quizData) {
        console.log("Retrieved quizData from storage:", data.quizData); // ✅ Log to debug
        window.postMessage({ type: "SET_QUESTION_ANSWER_PAIRS", qpair: data.quizData }, "*");
    }
});

// ✅ Inject highlight.js after fetching answers
injectScript("highlight.js");
