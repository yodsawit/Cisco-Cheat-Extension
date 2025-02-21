document.addEventListener("DOMContentLoaded", function () {
    const outputElement = document.getElementById("quiz-output");

    chrome.storage.local.get("correctAnswers", function (result) {
        if (result.correctAnswers && result.correctAnswers.length > 0) {
            outputElement.textContent = result.correctAnswers.join("\n");
        } else {
            outputElement.textContent = "No quiz data found.";
        }
    });
});
