document.addEventListener('DOMContentLoaded', () => {

    // --- Main Form Logic ---
    document.getElementById('navigator-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        const resultsContainer = document.getElementById('results-container');
        const submitButton = document.getElementById('submit-btn');

        resultsContainer.innerHTML = '<p class="loading">Loading demo paths...</p>';
        submitButton.disabled = true;
        submitButton.textContent = 'Loading...';

        try {
            const response = await fetch('./static/mock_data.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const careerPaths = await response.json();

            resultsContainer.innerHTML = '';
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

        } catch (error) {
            console.error('Error fetching mock data:', error);
            resultsContainer.innerHTML = `<p class="error">Error loading demo data. Check console.</p>`;
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Find My Path';
        }
    });

    // --- Aptitude Test Logic ---
    const startBtn = document.getElementById('start-aptitude-btn');
    const aptitudeModal = document.getElementById('aptitude-modal');
    // ... (rest of aptitude variables) ...
    startBtn.addEventListener('click', () => {
        // ... (aptitude start logic) ...
    });
    // ... (rest of aptitude functions) ...

    // --- AI Counselor Chat Logic ---
    const chatModal = document.getElementById('chat-modal');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatBox = document.getElementById('chat-box');
    const chatInputArea = document.getElementById('chat-input-area');

    const mockChatResponses = {
        "AI Specialist (Demo Data)": {
            "Tell me more about this role.": "As an AI Specialist, you would design and implement machine learning models, work with large datasets, and solve complex problems using AI. It’s a field with high demand and impact.",
            "What's the first step to take?": "A great first step is to master Python and take an online course in machine learning fundamentals on platforms like Coursera or edX. Building a small project, like an image classifier, is also highly recommended.",
            "Give me a mock interview question.": "Certainly. Here's one: 'Can you explain the difference between supervised and unsupervised learning? Give an example of a real-world problem for each.'"
        },
        "Data Scientist (Demo Data)": {
             "Tell me more about this role.": "Data Scientists use statistical methods and machine learning to extract insights from data. You would be responsible for telling a story with data to guide business strategy.",
             "What's the first step to take?": "Start by strengthening your statistics and probability knowledge. Also, become proficient in SQL for data querying and a language like Python or R for data analysis.",
             "Give me a mock interview question.": "Of course. 'Imagine you are given a dataset of customer transactions. How would you approach building a model to predict customer churn?'"
        },
        "UX/UI Designer (Demo Data)": {
            "Tell me more about this role.": "UX/UI Designers create the look, feel, and overall user experience of a product. It's a blend of visual arts, psychology, and technology to make products intuitive and enjoyable to use.",
            "What's the first step to take?": "Learning the fundamentals of design theory (color, typography, layout) is key. Simultaneously, get comfortable with design tools like Figma or Sketch. Creating a portfolio of small projects is crucial.",
            "Give me a mock interview question.": "Here is a typical question: 'Walk me through your design process for a new feature, from initial concept to final handoff to developers.'"
        }
    };
    
    // Event delegation for counselor buttons
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
        addMessage('ai', `Hello! I'm your AI Counselor. You're asking about the '${careerTitle}' path. How can I help you?`);
        
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
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
    }
    
    // --- Paste the full Aptitude Test Logic from the previous step here ---
    // (To keep this block clean, I've omitted it, but you should paste it back in)
    const aptitudeModalContent = document.getElementById('aptitude-modal-content');
    const questionTextApt = document.getElementById('question-text');
    const questionNumberTextApt = document.getElementById('question-number');
    const optionsContainerApt = document.getElementById('options-container');
    const nextBtnApt = document.getElementById('next-question-btn');
    const feedbackTextApt = document.getElementById('feedback-text');

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
        showQuestionApt();
    });

    nextBtnApt.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < aptitudeQuestions.length) {
            showQuestionApt();
        } else {
            endTestApt();
        }
    });

    function showQuestionApt() {
        feedbackTextApt.textContent = '';
        nextBtnApt.classList.add('modal-hidden');
        const question = aptitudeQuestions[currentQuestionIndex];
        questionNumberTextApt.textContent = `Question ${currentQuestionIndex + 1} of ${aptitudeQuestions.length}`;
        questionTextApt.textContent = question.question;
        optionsContainerApt.innerHTML = '';

        question.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'option-btn';
            button.onclick = () => selectAnswerApt(button, option, question.answer);
            optionsContainerApt.appendChild(button);
        });
    }

    function selectAnswerApt(selectedButton, selectedOption, correctAnswer) {
        Array.from(optionsContainerApt.children).forEach(btn => btn.disabled = true);
        if (selectedOption === correctAnswer) {
            score++;
            selectedButton.classList.add('correct');
            feedbackTextApt.textContent = 'Correct!';
            feedbackTextApt.style.color = 'var(--success-green)';
        } else {
            selectedButton.classList.add('incorrect');
            feedbackTextApt.textContent = `Incorrect. The right answer is ${correctAnswer}.`;
            feedbackTextApt.style.color = 'var(--danger-red)';
        }
        nextBtnApt.classList.remove('modal-hidden');
    }

    function endTestApt() {
        aptitudeModal.classList.add('modal-hidden');
        const skillsTextarea = document.getElementById('skills');
        let testResult = score >= 2 ? 'Strong logical reasoning skills.' : 'Developing logical reasoning.';
        const resultText = `Aptitude Result: ${testResult}`;
        skillsTextarea.value += (skillsTextarea.value ? '\n' : '') + resultText;
        alert(`Test complete! Score: ${score}/${aptitudeQuestions.length}. Result added to skills.`);
    }

});
