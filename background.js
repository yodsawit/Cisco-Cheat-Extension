const processedUrls = new Set(); // Track processed URLs

// Clear processedUrls when the active tab URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    // Clear the set when a new page is loaded
    processedUrls.clear();
    console.log("✅ [background.js] Reset processedUrls for new page.");
  }
});

// Fetch new components.json and process it
chrome.webRequest.onCompleted.addListener(
  async (details) => {
    const url = details.url;

    // Skip if URL has already been processed
    if (!url.includes("/components.json") || processedUrls.has(url)) return;

    processedUrls.add(url);
    console.log(`🔄 [background.js] Fetching new components.json: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const quizData = await response.json();
      const processedQuizData = processQuizData(quizData); // Process the quiz data

      // Store quizData in local storage
      chrome.storage.local.set({ quizData: processedQuizData }, () => {
        console.log("✅ [background.js] Quiz data updated.");

        // ✅ Notify content script to update highlighting
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "updateAnswers" });
            console.log("✅ [background.js] Message sent to content script.");
          }
        });
      });
    } catch (error) {
      console.error(
        "❌ [background.js] Error fetching components.json:",
        error
      );
    }
  },
  { urls: ["https://www.netacad.com/content/noes/*/components.json"] } // Listen only for this pattern
);

function processQuizData(quizData) {
  if (!Array.isArray(quizData)) {
    console.error("❌ [background.js] Invalid JSON format:", quizData);
    return [];
  }

  const quizQuestions = [];
  const MAX_ENTRIES = 500;

  for (const item of quizData) {
    if (quizQuestions.length >= MAX_ENTRIES) break;

    const questionType = item._component; // Store question type

    if (questionType === "mcq" && item._items) {
      const question = decodeHtmlEntities(removeHtmlTags(item.body));
      const correctAnswers = item._items
        .filter((ans) => ans._shouldBeSelected)
        .map((ans) => decodeHtmlEntities(removeHtmlTags(ans.text)));

      quizQuestions.push({ question, questionType, answers: correctAnswers });
    } else if (
      ["matching", "objectMatching"].includes(questionType) &&
      item._items
    ) {
      for (const pair of item._items) {
        const question = decodeHtmlEntities(
          removeHtmlTags(pair.text || pair.question || "")
        );
        const correctAnswers = [
          decodeHtmlEntities(
            removeHtmlTags(
              (pair._options || []).find((opt) => opt._isCorrect)?.text ||
                pair.answer ||
                ""
            )
          ),
        ];

        quizQuestions.push({ question, questionType, answers: correctAnswers });
      }
    }
  }

  console.log(
    `✅ [background.js] Processed ${quizQuestions.length} quiz entries.`
  );
  return quizQuestions; // Always return an array
}

// ✅ Respond to requests for quiz answers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getCorrectAnswers") {
    chrome.storage.local.get("quizData", (data) => {
      console.log("📥 [background.js] Received request for quiz answers.");

      if (data.quizData) {
        sendResponse({ quizData: data.quizData });
      } else {
        console.warn("⚠️ [background.js] No quiz data found.");
        sendResponse({ quizData: [] });
      }
    });
    return true; // Keeps response channel open
  }
});

// ✅ Utility functions
function removeHtmlTags(text) {
  return text ? text.replace(/<[^>]*>/g, "").trim() : "";
}

function decodeHtmlEntities(text) {
  if (!text) return "";
  return text
    .replace(/&nbsp;|&#160;|\u00A0/g, " ") // Non-breaking spaces
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;|\u2019/g, "'") // Single quotes
    .replace(/&ldquo;|&rdquo;/g, '"') // Double quotes
    .replace(/&#44;/g, ",")
    .replace(/&#x2216;|\u2216/g, "\\") // Reverse solidus (backslash)
    .replace(/&ndash;|\u2013/g, "-") // En dash
    .replace(/&mdash;|\u2014/g, "-") // Em dash
    .replace(/&times;/g, "x") // Multiplication sign
    .replace(/&divide;/g, "/") // Division sign
    .replace(/&hellip;/g, "…") // Ellipsis
    .replace(/&euro;/g, "€") // Euro
    .replace(/&pound;/g, "£") // Pound
    .replace(/&yen;/g, "¥") // Yen
    .replace(/&plusmn;/g, "±") // Plus-minus sign
    .replace(/&bull;/g, "•") // Bullet point
    .replace(/&alpha;/g, "α") // Alpha
    .replace(/&beta;/g, "β") // Beta
    .replace(/&gamma;/g, "γ") // Gamma
    .replace(/&zwnj;/g, "") // Zero-width non-joiner
    .replace(/&zwj;/g, "") // Zero-width joiner
    .replace(/[\u200B\u200E\u200F]/g, "") // Remove zero-width spaces & direction marks
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}
