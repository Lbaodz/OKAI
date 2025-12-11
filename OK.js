window.addEventListener('DOMContentLoaded', () => {

  const chatContainer = document.getElementById('chat-container');
  const userInput = document.getElementById('user-input');
  const searchInput = document.getElementById('search-input');
  const intelligenceEl = document.getElementById('ai-intelligence');
  const searchResultEl = document.getElementById('search-result');
  const searchProgressEl = document.getElementById('search-progress');
  const progressPercentageEl = document.getElementById('progress-percentage');

  let knowledgeBase = {};
  const STORAGE_KEY = 'aiKnowledgeBase_v2';

  async function fetchKnowledge() {
    try {
      const res = await fetch('https://cdn.jsdelivr.net/gh/Lbaodz/OKAI@main/OK.json');
      if (!res.ok) throw new Error(`HTTP status ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
      return {};
    }
  }

  async function initKnowledgeBase() {
    knowledgeBase = await fetchKnowledge();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) knowledgeBase = Object.assign({}, knowledgeBase, JSON.parse(stored));
    updateIntelligenceMetric();
    addMessage('bot', 'Hello! I am OK, your friendly learning chatbot. Teach me using "Learn: [Question]=[Answer]"');
  }

  function saveKnowledge() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledgeBase));
    updateIntelligenceMetric();
  }

  function updateIntelligenceMetric() {
    const factCount = Object.values(knowledgeBase).reduce((sum, arr) => sum + arr.length, 0);
    intelligenceEl.textContent = `OK knows ${factCount} fact(s) across ${Object.keys(knowledgeBase).length} questions.`;
  }

  function addMessage(sender, message) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.textContent = message;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  function selectRandomWeightedAnswer(answersList) {
    const totalFrequency = answersList.reduce((sum, item) => sum + item.frequency, 0);
    let randomWeight = Math.floor(Math.random() * totalFrequency);
    for (const item of answersList) {
      if (randomWeight < item.frequency) {
        item.frequency++;
        saveKnowledge();
        return item.answer;
      }
      randomWeight -= item.frequency;
    }
    return answersList[0].answer;
  }

  function getBotResponse(userMessage) {
    const normalizedMsg = userMessage.toLowerCase().trim();
    if (normalizedMsg.startsWith("learn:")) {
      const [q, a] = normalizedMsg.substring(6).trim().split('=').map(s => s.trim());
      if (q && a) {
        if (!knowledgeBase[q]) knowledgeBase[q] = [];
        knowledgeBase[q].push({ answer: a, frequency: 1 });
        saveKnowledge();
        return `✅ I've learned a new fact for "${q}". I now know ${knowledgeBase[q].length} answer(s) for this question.`;
      } else {
        return '⚠️ Format is wrong. Use: Learn: [Question]=[Answer]';
      }
    }

    for (const question in knowledgeBase) {
      if (normalizedMsg.includes(question.toLowerCase())) {
        const answers = knowledgeBase[question];
        return answers.length > 1 ? selectRandomWeightedAnswer(answers) : answers[0].answer;
      }
    }

    userInput.placeholder = 'Try teaching me using: Learn: [Question]=[Answer]';
    return "🤔 I don't know the answer yet.";
  }

  window.sendMessage = function() {
    const msg = userInput.value.trim();
    if (!msg) return;
    addMessage('user', msg);
    userInput.value = '';
    setTimeout(() => addMessage('bot', getBotResponse(msg)), 300);
  }

  window.searchFact = function() {
    const searchText = searchInput.value.toLowerCase().trim();
    searchResultEl.innerHTML = '';
    searchProgressEl.style.display = 'block';
    progressPercentageEl.textContent = '0%';

    const questions = Object.keys(knowledgeBase);
    if (!questions.length) {
      searchResultEl.innerHTML = '<div>No facts stored yet.</div>';
      searchProgressEl.style.display = 'none';
      return;
    }

    let processed = 0;
    const interval = setInterval(() => {
      processed++;
      progressPercentageEl.textContent = `${Math.floor((processed / questions.length) * 100)}%`;
      if (processed >= questions.length) {
        clearInterval(interval);
        searchProgressEl.style.display = 'none';
      }
    }, 20);

    setTimeout(() => {
      let found = false;
      for (const question of questions) {
        if (question.toLowerCase().includes(searchText)) {
          const answers = knowledgeBase[question].map(i => i.answer).join(', ');
          searchResultEl.innerHTML += `<div>❓ ${question} | 📝 Answers: ${answers}</div>`;
          found = true;
        }
      }
      if (!found) searchResultEl.innerHTML = '<div>No results found.</div>';
      clearInterval(interval);
      searchProgressEl.style.display = 'none';
    }, 200);
  }

  userInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
  searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') searchFact(); });

  // Start chatbot
  initKnowledgeBase();

});
