// ✅ Inject highlight.js after the message is received and quizData is available
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateAnswers") {
        // Fetch updated quizData from local storage
        chrome.storage.local.get("quizData", (data) => {
            if (data.quizData) {
                console.log("Retrieved quizData from storage:", data.quizData); // ✅ Log to debug
                
                // Pass the quizData to highlight.js
                window.postMessage({ type: "SET_QUESTION_ANSWER_PAIRS", qpair: data.quizData }, "*");

                // Inject highlight.js after quiz data is ready
                injectScript("highlight.js");
            }
        });
    }
});

// Function to inject highlight.js into the page
function injectScript(file) {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(file);
    script.type = "text/javascript";
    script.async = false;
    document.documentElement.appendChild(script);
}
