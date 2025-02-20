const processedUrls = new Set(); // Track processed URLs

chrome.webRequest.onCompleted.addListener(
    async (details) => {
        const url = details.url;

        // ✅ Only fetch new components.json URLs
        if (!url.includes("/components.json") || processedUrls.has(url)) return;

        processedUrls.add(url); // Mark this URL as processed
        console.log(`Fetching new components.json: ${url}`);

        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": "Bearer YOUR_ACCESS_TOKEN" // If required
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const quizData = await response.json();
            const processedData = processQuizData(quizData);

            // ✅ Store processed quiz data in local storage for popup display
            chrome.storage.local.set({ quizData: processedData });

            console.log("✅ [background.js] Fetched & processed components.json.");
        } catch (error) {
            console.error("❌ [background.js] Error fetching components.json:", error);
        }
    },
    { urls: ["https://www.netacad.com/content/noes/*/components.json"] } // ✅ Only listen for this pattern
);

function processQuizData(quizData) {
    if (!Array.isArray(quizData)) {
        console.error("❌ [background.js] Invalid JSON format:", quizData);
        return "Invalid data format.";
    }

    const quizQuestions = [];
    const MAX_ENTRIES = 500; // Prevent memory crash

    for (const item of quizData) {
        if (quizQuestions.length >= MAX_ENTRIES) break;

        // Ensure _component and _items are valid
        if (!item._component || !Array.isArray(item._items)) continue;

        if (item._component === "mcq") {
            const question = decodeHtmlEntities(removeHtmlTags(item.body));
            const correctAnswers = item._items
                .filter(ans => ans._shouldBeSelected)
                .map(ans => decodeHtmlEntities(removeHtmlTags(ans.text)));

            for (const answer of correctAnswers) {
                quizQuestions.push(`${question}, ${answer}`);
                if (quizQuestions.length >= MAX_ENTRIES) break;
            }
        }
    }

    console.log(`✅ [background.js] Processed ${quizQuestions.length} quiz entries.`);
    return quizQuestions.length > 0 ? quizQuestions.join("\n") : "No quiz data found.";
}

// ✅ Respond to requests for correct answers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getCorrectAnswers") {
        chrome.storage.local.get("quizData", (data) => {
            console.log("📥 [background.js] Received request for quiz answers.");

            if (data.quizData) {
                const correctAnswers = data.quizData
                    .split("\n")
                    .map(line => line.split(",")[1]?.trim())
                    .filter(Boolean);

                console.log("✅ [background.js] Sending correct answers:", correctAnswers);
                sendResponse({ correctAnswers });
            } else {
                console.warn("⚠️ [background.js] No quiz data found.");
                sendResponse({ correctAnswers: [] });
            }
        });
        return true; // Keep message channel open for async response
    }
});

// ✅ Safely remove HTML tags
function removeHtmlTags(text) {
    return text ? text.replace(/<[^>]*>/g, '').trim() : "";
}

// ✅ Safely decode HTML entities
function decodeHtmlEntities(text) {
    if (!text) return ""; // Prevent null/undefined errors

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
