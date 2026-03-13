document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('navigator-form');
  const resultsContainer = document.getElementById('results-container');
  const submitBtn = document.getElementById('submit-btn');
  const loaderBar = document.getElementById('loader-bar');

  document.getElementById('get-started-btn').addEventListener('click', function(e){
    e.preventDefault();
    const target = document.getElementById('skills-form');
    target.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('skills').focus();
    }, 600);
  });

  form.addEventListener('submit', async function(event){
    event.preventDefault();
    const skills = document.getElementById('skills').value;
    const interests = document.getElementById('interests').value;
    resultsContainer.innerHTML = '';
    loaderBar.style.width = '0';
    loaderBar.classList.add('transition-all');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';
    loaderBar.style.width = '100%';

    try {
      const res = await fetch('/navigate',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({skills, interests})});
      if(!res.ok) throw new Error(`Status ${res.status}`);
      const careerPaths = await res.json();
      loaderBar.style.width = '0';
      if(careerPaths && careerPaths.length>0){
        careerPaths.forEach(path => {
          const card = document.createElement('div');
          card.className='bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition transform hover:-translate-y-1 duration-300';
          card.innerHTML=`
            <h3 class="text-xl font-bold text-navy mb-2">${path.title}</h3>
            <p class="text-slate-600 mb-4">${path.description}</p>
            <h4 class="text-sm uppercase text-accent mb-2">Skill Gaps</h4>
            <ul class="list-disc list-inside mb-4">${(path.skill_gaps||[]).map(g=>`<li>${g}</li>`).join('')}</ul>
            <button class="bg-accent text-white py-2 px-4 rounded-xl counselor-btn transition transform hover:-translate-y-1" data-career-title="${path.title}">Talk to AI</button>
          `;
          resultsContainer.appendChild(card);
        });
      } else {
        resultsContainer.innerHTML='<p class="text-center text-slate-500">No career paths could be generated.</p>';
      }
    } catch(e){
      resultsContainer.innerHTML='<p class="text-center text-danger-red">Server error. Please try again.</p>';
    } finally{
      submitBtn.disabled=false;
      submitBtn.textContent='Find My Path';
      loaderBar.style.width='0';
    }
  });

  const startBtn = document.getElementById('start-aptitude-btn');
  const aptitudeModal = document.getElementById('aptitude-modal');
  const questionTextEl = document.getElementById('question-text');
  const questionNumberText = document.getElementById('question-number');
  const optionsContainer = document.getElementById('options-container');
  const nextBtn = document.getElementById('next-question-btn');
  const feedbackText = document.getElementById('feedback-text');
  const closeAptitudeBtn = document.getElementById('close-aptitude-modal');

  const aptitudeQuestions = [
    { question: 'Which number logically follows this series? 4, 6, 9, 6, 14, 6, ...', options: ['6', '17', '19', '21'], answer: '19' },
    { question: 'Book is to Reading as Fork is to:', options: ['Drawing', 'Writing', 'Eating', 'Stirring'], answer: 'Eating' },
    { question: 'Find the odd one out:', options: ['Triangle', 'Circle', 'Square', 'Rectangle'], answer: 'Circle' }
  ];

  let currentQuestionIndex=0, score=0;

  startBtn?.addEventListener('click', () => {
    currentQuestionIndex=0; score=0;
    aptitudeModal.classList.remove('opacity-0','pointer-events-none');
    showQuestion();
  });
  closeAptitudeBtn.addEventListener('click', () => aptitudeModal.classList.add('opacity-0','pointer-events-none'));
  nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if(currentQuestionIndex < aptitudeQuestions.length) showQuestion(); else endTest();
  });
  function showQuestion(){
    feedbackText.textContent=''; nextBtn.classList.add('hidden');
    const question = aptitudeQuestions[currentQuestionIndex];
    questionNumberText.textContent=`Question ${currentQuestionIndex+1} of ${aptitudeQuestions.length}`;
    questionTextEl.textContent=question.question;
    optionsContainer.innerHTML='';
    question.options.forEach(option=>{
      const btn=document.createElement('button');
      btn.textContent=option;
      btn.className='option-btn bg-substrate border border-slate-200 rounded-xl py-3 px-4 w-full text-left transition hover:bg-gray-100';
      btn.onclick=()=>selectAnswer(btn,option,question.answer);
      optionsContainer.appendChild(btn);
    });
  }
  function selectAnswer(selBtn, selOpt, correct){
    Array.from(optionsContainer.children).forEach(b=>b.disabled=true);
    if(selOpt===correct){
      score++; selBtn.classList.add('bg-accent','text-white');
      feedbackText.textContent='Correct!';
      feedbackText.classList.add('text-green-600');
    }else{
      selBtn.classList.add('bg-danger-red','text-white');
      feedbackText.textContent=`Incorrect. The right answer is ${correct}.`;
      feedbackText.classList.add('text-danger-red');
    }
    nextBtn.classList.remove('hidden');
  }
  function endTest(){
    aptitudeModal.classList.add('opacity-0','pointer-events-none');
    const skillsTextarea=document.getElementById('skills');
    let testResult = score>=2 ? 'Strong logical reasoning.' : 'Developing logical reasoning.';
    skillsTextarea.value += (skillsTextarea.value?'\n':'')+`Aptitude Test Result: ${testResult}`;
    alert(`Test complete! Score: ${score}/${aptitudeQuestions.length}`);
  }

  const chatModal=document.getElementById('chat-modal');
  const closeChatBtn=document.getElementById('close-chat-btn');
  const chatBox=document.getElementById('chat-box');
  const chatInputArea=document.getElementById('chat-input-area');

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

  document.addEventListener('click', function(event){
    if(event.target.matches('.counselor-btn')){
      const careerTitle = event.target.getAttribute('data-career-title');
      openChat(careerTitle);
    }
  });
  closeChatBtn.addEventListener('click', ()=> chatModal.classList.add('opacity-0','pointer-events-none'));
  function openChat(careerTitle){
    chatModal.classList.remove('opacity-0','pointer-events-none');
    chatBox.innerHTML='';
    addMessage('ai', `Hello! You're asking about the '${careerTitle}' path. How can I help you?`);
    chatInputArea.innerHTML='';
    const questions = mockChatResponses[careerTitle];
    if(questions){
      Object.keys(questions).forEach(q=>{
        const btn=document.createElement('button');
        btn.textContent=q;
        btn.className='w-full text-left bg-substrate border border-slate-200 rounded-xl py-2 px-4 transition hover:bg-gray-100';
        btn.onclick = ()=> askQuestion(careerTitle, q);
        chatInputArea.appendChild(btn);
      });
    }
  }
  function askQuestion(careerTitle, question){
    addMessage('user', question);
    const answer = mockChatResponses[careerTitle][question];
    setTimeout(()=> addMessage('ai', answer||"I'm still learning about that topic!"),500);
  }
  function addMessage(sender, text){
    const div = document.createElement('div');
    div.className='p-3 rounded-2xl max-w-[80%] '+(sender==='ai'?'bg-substrate self-start':'bg-accent text-white self-end');
    div.textContent=text;
    chatBox.appendChild(div);
    chatBox.scrollTop=chatBox.scrollHeight;
  }

  lucide.createIcons();
});
