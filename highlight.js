// Ensure qpair is declared globally
var qpair = []; // Use 'var' or 'let' outside any condition to make it globally accessible

// ✅ Listen for messages from content.js
window.addEventListener("message", (event) => {
  if (
    event.source !== window ||
    event.data.type !== "SET_QUESTION_ANSWER_PAIRS"
  )
    return;

  qpair = event.data.qpair; // ✅ Update global qpair

  if (!Array.isArray(qpair)) {
    console.error("Expected qpair to be an array, but received:", typeof qpair);
    return;
  }

  highlightQuestionsAndAnswers(); // ✅ Ensure it runs after qpair is set
});

// Function to decode HTML entities in text
function decodeHtmlEntities(text) {
  if (!text) return "";

  return text
    .replace(/&nbsp;|&#160;|\u00A0/g, " ") // Replace all non-breaking spaces
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#44;/g, ",")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/\s+/g, " ") // Collapse multiple spaces into a single space
    .trim();
}

function highlightQuestionsAndAnswers() {
  function highlightInDocument(doc) {
    doc.querySelectorAll("div, span, p, label").forEach((el) => {
      const text = decodeHtmlEntities(el.textContent.toLowerCase());

      const skipClasses = [
        "mcq__item",
        "mcq__item-label",
        "mcq__item-text",
        "mcq__item-text-inner",
      ];

      if (skipClasses.some((className) => el.classList.contains(className))) {
        return; // Skip this element
      }

      // Find matching question (for both MCQ and Matching types)
      const matchingQuestion = qpair.find(
        (q) => decodeHtmlEntities(q.question.toLowerCase()) === text
      );

      if (matchingQuestion && !el.dataset.highlighted) {
        // If it's an objectMatching question, highlight with the color of the nearby container
        if (matchingQuestion.questionType === "objectMatching") {
          // Find the closest parent container with class 'objectMatching-category-item-inner'
          const categoryItem = el.closest(
            ".objectMatching-category-item-inner"
          );

          if (categoryItem) {
            const categoryNumber = categoryItem.querySelector(
              ".category-item-number"
            );

            if (categoryNumber) {
              // Get the background color from the nearby category-item-number container
              const rgbColor =
                window.getComputedStyle(categoryNumber).backgroundColor;

              // Set the question's background color to match the nearby container's color
              el.style.backgroundColor = rgbColor;
            }
          }
        } else {
          // Default highlight for non-objectMatching questions
          el.style.backgroundColor = "yellow";
        }
        el.style.fontWeight = "bold";
        el.dataset.highlighted = "true";

        highlightAnswer(matchingQuestion, el);

        return;
      }
    });

    // Recursively check shadow DOMs
    doc.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) {
        highlightInDocument(el.shadowRoot);
      }
    });
  }

  function highlightAnswer(matchingQuestion, questionElement) {
    if (
      !Array.isArray(matchingQuestion.answers) ||
      matchingQuestion.answers.length === 0
    ) {
      console.error("Answers missing for question:", matchingQuestion.question);
      return;
    }

    const mcqContainer = findClosestMCQContainer(questionElement);
    if (!mcqContainer) {
      console.error(
        "MCQ container not found for question:",
        matchingQuestion.question
      );
      return;
    }

    let questionColor = "lightgreen"; // Default color for MCQ
    if (matchingQuestion.questionType === "objectMatching") {
      // Get the background color of the highlighted question
      questionColor = window.getComputedStyle(questionElement).backgroundColor;
    }

    mcqContainer.querySelectorAll("div, span, p, label").forEach((el) => {
      const skipClasses = ["objectMatching-option-item-container"];

      if (skipClasses.some((className) => el.classList.contains(className))) {
        return; // Skip this element
      }
      const text = decodeHtmlEntities(el.textContent.toLowerCase());
      if (
        matchingQuestion.answers.some(
          (answer) => decodeHtmlEntities(answer.toLowerCase()) === text
        )
      ) {
        el.style.backgroundColor = questionColor; // Use the question's color
        el.style.fontWeight = "bold";
      }
    });
  }

  function findClosestMCQContainer(element) {
    let parentElement = element;
    while (parentElement) {
      const questionContainer = ["mcq__inner", "component__widget-inner", "matching__item-title_inner"];

      if (
        parentElement.classList &&
        questionContainer.some((className) =>
          parentElement.classList.contains(className)
        )
      ) {
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
    document.querySelectorAll("iframe").forEach((iframe) => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc) {
          highlightInDocument(doc);
        }
      } catch (error) {
        if (!iframe.dataset.corsErrorLogged) {
          console.warn("⚠️ CORS issue on iframe:", error);
          iframe.dataset.corsErrorLogged = true;
        }
      }
    });
  }

  highlightInDocument(document);
  processIframes();
}

// ✅ Run every 3 seconds to detect new content
setInterval(highlightQuestionsAndAnswers, 3000);
