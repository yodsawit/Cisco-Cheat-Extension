document.addEventListener("DOMContentLoaded", function () {
    const outputElement = document.getElementById("quiz-output");

    chrome.storage.local.get("quizData", function (result) {
        if (result.quizData && Array.isArray(result.quizData) && result.quizData.length > 0) {
            outputElement.innerHTML = ""; // Clear previous content

            result.quizData.forEach(({ question, answers }, index) => {
                const questionEl = document.createElement("div");
                questionEl.innerHTML = `<strong>${question}</strong>`;
                
                const answerList = document.createElement("ul");
                answers.forEach(answer => {
                    const answerItem = document.createElement("li");
                    answerItem.textContent = answer;
                    answerList.appendChild(answerItem);
                });

                outputElement.appendChild(questionEl);
                outputElement.appendChild(answerList);
            });
        } else {
            outputElement.textContent = "No quiz data found.";
        }
    });
});
