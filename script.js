document.addEventListener("DOMContentLoaded", function () {
    const outputElement = document.getElementById("quiz-output");

    chrome.storage.local.get("quizData", function (result) {
        if (result.quizData && result.quizData.length > 0) {
            outputElement.textContent = result.quizData;
        } else {
            outputElement.textContent = "No quiz data found.";
        }
    });
});
