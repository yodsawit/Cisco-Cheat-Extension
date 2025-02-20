// Inject highlight.js into the page
function injectScript(file) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(file);
    script.type = "text/javascript";
    script.async = false;
    document.documentElement.appendChild(script);
}

// ✅ Request answers from background.js
chrome.runtime.sendMessage({ action: "getCorrectAnswers" }, (response) => {
    if (response?.correctAnswers) {
        console.log("📥 [content.js] Received correct answers:", response.correctAnswers);
        window.postMessage({ type: "SET_CORRECT_ANSWERS", answers: response.correctAnswers }, "*");
    }
});

// ✅ Listen for answer updates
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateAnswers") {
        console.log("🔄 [content.js] Updating correct answers...");
        chrome.runtime.sendMessage({ action: "getCorrectAnswers" }, (response) => {
            if (response?.correctAnswers) {
                window.postMessage({ type: "SET_CORRECT_ANSWERS", answers: response.correctAnswers }, "*");
            }
        });
    }
});

// ✅ Inject highlight.js after fetching answers
injectScript("highlight.js");
