// Inject highlight.js into the page
function injectScript(file) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(file);
    script.type = "text/javascript";
    script.async = false;
    document.documentElement.appendChild(script);
}

// Fetch quiz answers from storage and pass them to highlight.js
chrome.storage.local.get("correctAnswers", (data) => {
    if (data.correctAnswers) {
        console.log("Retrieved correctAnswers from storage:", data.correctAnswers); // ✅ Log to debug
        window.postMessage({ type: "SET_CORRECT_ANSWERS", answers: data.correctAnswers }, "*");
    }
});

// Inject highlight.js
injectScript("highlight.js");
