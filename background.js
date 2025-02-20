const processedUrls = new Set(); // Track processed URLs

chrome.webRequest.onCompleted.addListener(
    async (details) => {
        const url = details.url;

        if (!url.includes("/components.json") || processedUrls.has(url)) return;

        processedUrls.add(url);
        console.log(`🔄 [background.js] Fetching new components.json: ${url}`);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const quizData = await response.json();
            const correctAnswers = extractCorrectAnswers(quizData);

            // ✅ Store answers in local storage
            chrome.storage.local.set({ correctAnswers }, () => {
                console.log("✅ [background.js] Correct answers updated.");
                
                // ✅ Notify content script to update highlighting
                chrome.runtime.sendMessage({ action: "updateAnswers" });
            });

        } catch (error) {
            console.error("❌ [background.js] Error fetching components.json:", error);
        }
    },
    { urls: ["https://www.netacad.com/content/noes/*/components.json"] }
);

// ✅ Extract only correct answers
function extractCorrectAnswers(quizData) {
    if (!Array.isArray(quizData)) return [];

    const answers = new Set();
    quizData.forEach(item => {
        if (item._component === "mcq") {
            item._items.forEach(ans => {
                if (ans._shouldBeSelected) {
                    answers.add(decodeHtmlEntities(removeHtmlTags(ans.text)));
                }
            });
        }
    });

    console.log(`📌 [background.js] Stored ${answers.size} correct answers.`);
    return Array.from(answers);
}

// ✅ Respond to requests for correct answers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getCorrectAnswers") {
        chrome.storage.local.get("correctAnswers", (data) => {
            sendResponse({ correctAnswers: data.correctAnswers || [] });
        });
        return true; // Keeps response channel open
    }
});

// ✅ Utility functions
function removeHtmlTags(text) {
    return text ? text.replace(/<[^>]*>/g, '').trim() : "";
}

function decodeHtmlEntities(text) {
    if (!text) return "";
    return text
        .replace(/&nbsp;/g, " ")
        .replace(/&#160;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"');
}
