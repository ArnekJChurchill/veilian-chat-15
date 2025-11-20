// Pusher setup
const pusher = new Pusher('b7d05dcc13df522efbbc', {
  cluster: 'us2'
});

const channel = pusher.subscribe('veilian-chat');
channel.bind('new-message', function(data) {
  addMessage(data.displayName, data.message);
});

// DOM elements
const loginBox = document.getElementById('loginBox');
const chatContainer = document.getElementById('chatContainer');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const closeChatBtn = document.getElementById('closeChat');
const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const adminPanel = document.getElementById('adminPanel');
const banUsernameInput = document.getElementById('banUsername');
const banBtn = document.getElementById('banBtn');
const unbanBtn = document.getElementById('unbanBtn');
const bannedListDiv = document.getElementById('bannedList');

let currentUser = '';
let isModerator = false;

// Login
loginBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return alert("Fill both fields");

  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if(data.success){
    currentUser = username;
    isModerator = data.isModerator;
    loginBox.style.display = 'none';
    chatContainer.style.display = 'block';
    if(isModerator){
      adminPanel.style.display = 'block';
      fetchBannedList();
      alert("Moderator logged in!");
    }
  } else {
    alert(data.message || "Login failed");
  }
});

// Signup
signupBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) return alert("Fill both fields");

  const res = await fetch('/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if(data.success) alert("Signup successful! Please log in.");
  else alert(data.message || "Signup failed");
});

// Send Message
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', e => { if(e.key === "Enter") sendMessage(); });
function sendMessage(){
  const msg = messageInput.value.trim();
  if(!msg) return;
  fetch('/send', {
    method: 'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ displayName: currentUser, message: msg })
  });
  messageInput.value = '';
}

// Add message to chat
function addMessage(name, msg){
  const msgDiv = document.createElement('div');
  msgDiv.textContent = `${name}: ${msg}`;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Close Chat
closeChatBtn.addEventListener('click', () => {
  chatContainer.style.display = 'none';
  loginBox.style.display = 'block';
});

// Admin: Ban/Unban
banBtn.addEventListener('click', async () => {
  const banUser = banUsernameInput.value.trim();
  if(!banUser) return alert("Enter username");
  await fetch('/ban', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:banUser})});
  fetchBannedList();
});

unbanBtn.addEventListener('click', async () => {
  const unbanUser = banUsernameInput.value.trim();
  if(!unbanUser) return alert("Enter username");
  await fetch('/unban', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:unbanUser})});
  fetchBannedList();
});

async function fetchBannedList(){
  const res = await fetch('/banned');
  const data = await res.json();
  bannedListDiv.innerHTML = "Banned Users: " + (data.banned.join(", ") || "None");
}

