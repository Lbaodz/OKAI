  const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const searchInput = document.getElementById('search-input');
const intelligenceEl = document.getElementById('ai-intelligence');
const searchResultEl = document.getElementById('search-result');
const searchProgressEl = document.getElementById('search-progress');
const progressPercentageEl = document.getElementById('progress-percentage');

let knowledgeBase = {};
let fetchedData = null;
const STORAGE_KEY = 'aiKnowledgeBase_v2';
async function fet() {
    try {
        const res = await fetch('https://cdn.jsdelivr.net/gh/Lbaodz/OKAI@main/OK.json');
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        const text = await res.json();
        try {
            return text; // JSON đúng chuẩn
        } catch {
            return eval("(" + text + ")"); // fallback JS object
        }
    } catch (err) {
        console.error('Failed to load gist:', err);
        return {};
    }
}


async function initKnowledgeBase() {

  knowledgeBase = await fet();
  console.log('Loaded knowledgeBase:', knowledgeBase);
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) knowledgeBase = Object.assign({}, knowledgeBase, JSON.parse(stored));

  updateIntelligenceMetric();
  addMessage('bot', 'Hello! I am a learning chatbot with weighted random responses.');
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
      return `I have added a new fact for "${q}". I now have ${knowledgeBase[q].length} possible answers.`;
    }
  }
  for (const question in knowledgeBase) {
    if (normalizedMsg.includes(question.toLowerCase())) {
      const answers = knowledgeBase[question];
      return answers.length > 1 ? selectRandomWeightedAnswer(answers) : answers[0].answer;
    }
  }
  return "I don't know the answer. Teach me using 'Learn: [Question]=[Answer]'";
}

function sendMessage() {
  const msg = userInput.value.trim();
  if (!msg) return;
  addMessage('user', msg);
  userInput.value = '';
  setTimeout(() => addMessage('bot', getBotResponse(msg)), 500);
}

function searchFact() {
  const searchText = searchInput.value.toLowerCase().trim();
  searchResultEl.innerHTML = '';
  searchProgressEl.style.display = 'block';
  progressPercentageEl.textContent = '0%';
  const totalQuestions = Object.keys(knowledgeBase).length;
  let processed = 0;

  const interval = setInterval(() => {
    if (processed >= totalQuestions) { clearInterval(interval); searchProgressEl.style.display = 'none'; return; }
    processed++;
    progressPercentageEl.textContent = `${Math.floor((processed / totalQuestions) * 100)}%`;
  }, 50);

  setTimeout(() => {
    for (const question in knowledgeBase) {
      if (question.toLowerCase().includes(searchText)) {
        const answers = knowledgeBase[question].map(i => i.answer).join(', ');
        searchResultEl.innerHTML += `<div>Question: ${question} | Answers: ${answers}</div>`;
      }
    }
    if (!searchResultEl.innerHTML) searchResultEl.innerHTML = '<div>No results found.</div>';
    clearInterval(interval);
    searchProgressEl.style.display = 'none';
  }, 500);
}

userInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

// Start chatbot
initKnowledgeBase();
