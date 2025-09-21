document.addEventListener('DOMContentLoaded', () => {

    // --- Main Form Logic for Production ---
    document.getElementById('navigator-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        const resultsContainer = document.getElementById('results-container');
        const submitButton = document.getElementById('submit-btn');
        const skills = document.getElementById('skills').value;
        const interests = document.getElementById('interests').value;

        resultsContainer.innerHTML = '<p class="loading">Generating career paths...</p>';
        submitButton.disabled = true;
        submitButton.textContent = 'Loading...';

        try {
            const response = await fetch('/navigate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ skills, interests }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const careerPaths = await response.json();
            resultsContainer.innerHTML = ''; // Clear loading message

            if (careerPaths && careerPaths.length > 0) {
                careerPaths.forEach(path => {
                    const pathDiv = document.createElement('div');
                    pathDiv.className = 'result-card';
                    pathDiv.innerHTML = `
                        <h3>${path.title}</h3>
                        <p>${path.description}</p>
                        <h4>Skill Gaps to Address</h4>
                        <ul>
                            ${(path.skill_gaps || []).map(gap => `<li>${gap}</li>`).join('')}
                        </ul>
                        <button class="counselor-btn" data-career-title="${path.title}">Talk to AI Counselor</button>
                    `;
                    resultsContainer.appendChild(pathDiv);
                });
            } else {
                resultsContainer.innerHTML = '<p>No career paths could be generated. Please try refining your skills and interests.</p>';
            }

        } catch (error) {
            console.error('Error fetching career data:', error);
            resultsContainer.innerHTML = `<p class="error">An error occurred while communicating with the server. Please try again later.</p>`;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Find My Path';
        }
    });

    // --- Aptitude Test Logic ---
    const startBtn = document.getElementById('start-aptitude-btn');
    const aptitudeModal = document.getElementById('aptitude-modal');
    const questionTextEl = document.getElementById('question-text');
    const questionNumberText = document.getElementById('question-number');
    const optionsContainer = document.getElementById('options-container');
    const nextBtn = document.getElementById('next-question-btn');
    const feedbackText = document.getElementById('feedback-text');

    const aptitudeQuestions = [
        { question: 'Which number logically follows this series? 4, 6, 9, 6, 14, 6, ...', options: ['6', '17', '19', '21'], answer: '19' },
        { question: 'Book is to Reading as Fork is to:', options: ['Drawing', 'Writing', 'Eating', 'Stirring'], answer: 'Eating' },
        { question: 'Find the odd one out:', options: ['Triangle', 'Circle', 'Square', 'Rectangle'], answer: 'Circle' }
    ];

    let currentQuestionIndex = 0;
    let score = 0;

    startBtn.addEventListener('click', () => {
        currentQuestionIndex = 0;
        score = 0;
        aptitudeModal.classList.remove('modal-hidden');
        showQuestion();
    });

    nextBtn.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < aptitudeQuestions.length) {
            showQuestion();
        } else {
            endTest();
        }
    });

    function showQuestion() {
        feedbackText.textContent = '';
        nextBtn.classList.add('modal-hidden');
        const question = aptitudeQuestions[currentQuestionIndex];
        questionNumberText.textContent = `Question ${currentQuestionIndex + 1} of ${aptitudeQuestions.length}`;
        questionTextEl.textContent = question.question;
        optionsContainer.innerHTML = '';

        question.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'option-btn';
            button.onclick = () => selectAnswer(button, option, question.answer);
            optionsContainer.appendChild(button);
        });
    }

    function selectAnswer(selectedButton, selectedOption, correctAnswer) {
        Array.from(optionsContainer.children).forEach(btn => btn.disabled = true);
        if (selectedOption === correctAnswer) {
            score++;
            selectedButton.classList.add('correct');
            feedbackText.textContent = 'Correct!';
            feedbackText.style.color = 'var(--success-green)';
        } else {
            selectedButton.classList.add('incorrect');
            feedbackText.textContent = `Incorrect. The right answer is ${correctAnswer}.`;
            feedbackText.style.color = 'var(--danger-red)';
        }
        nextBtn.classList.remove('modal-hidden');
    }

    function endTest() {
        aptitudeModal.classList.add('modal-hidden');
        const skillsTextarea = document.getElementById('skills');
        let testResult = score >= 2 ? 'Strong logical reasoning.' : 'Developing logical reasoning.';
        const resultText = `Aptitude Test Result: ${testResult}`;
        skillsTextarea.value += (skillsTextarea.value ? '\n' : '') + resultText;
        alert(`Test complete! Your score: ${score}/${aptitudeQuestions.length}. Your result has been added to your skills profile.`);
    }

    // --- AI Counselor Chat Logic ---
    const chatModal = document.getElementById('chat-modal');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatBox = document.getElementById('chat-box');
    const chatInputArea = document.getElementById('chat-input-area');

    const mockChatResponses = {
        "AI Specialist (Live Demo)": {
            "Tell me more about this role.": "As an AI Specialist, you'd design and implement machine learning models and work with large datasets. It’s a field with high demand and impact.",
            "What's the first step to take?": "Master Python and take an online course in machine learning on a platform like Coursera. Building a small project is also highly recommended.",
            "Give me a mock interview question.": "Certainly: 'Can you explain the difference between supervised and unsupervised learning? Give a real-world example for each.'"
        },
        "Data Scientist (Live Demo)": {
            "Tell me more about this role.": "Data Scientists use statistical methods to extract insights from data. You would be telling a story with data to guide business strategy.",
            "What's the first step to take?": "Strengthen your statistics knowledge and become proficient in SQL for data querying and a language like Python or R for analysis.",
            "Give me a mock interview question.": "Of course: 'Imagine you are given a dataset of customer transactions. How would you approach building a model to predict customer churn?'"
        }
    };

    document.addEventListener('click', function(event) {
        if (event.target.matches('.counselor-btn')) {
            const careerTitle = event.target.getAttribute('data-career-title');
            openChat(careerTitle);
        }
    });

    closeChatBtn.addEventListener('click', () => chatModal.classList.add('modal-hidden'));

    function openChat(careerTitle) {
        chatModal.classList.remove('modal-hidden');
        chatBox.innerHTML = '';
        addMessage('ai', `Hello! You're asking about the '${careerTitle}' path. How can I help you?`);
        
        chatInputArea.innerHTML = '';
        const questions = mockChatResponses[careerTitle];
        if (questions) {
            Object.keys(questions).forEach(question => {
                const button = document.createElement('button');
                button.textContent = question;
                button.onclick = () => askQuestion(careerTitle, question);
                chatInputArea.appendChild(button);
            });
        }
    }

    function askQuestion(careerTitle, question) {
        addMessage('user', question);
        const answer = mockChatResponses[careerTitle][question];
        setTimeout(() => addMessage('ai', answer || "I'm still learning about that topic!"), 500);
    }

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        messageDiv.textContent = text;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});
