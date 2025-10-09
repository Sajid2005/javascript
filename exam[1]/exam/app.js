// app.js
// Use module to keep scope clean
const api = (() => {
  // Keys for localStorage
  const USERS_KEY = 'jspr_users_v1';
  const RESULTS_KEY = 'jspr_results_v1';
  const SESSIONS_KEY = 'jspr_sessions_v1';

  // helper to load & save
  const load = (k) => JSON.parse(localStorage.getItem(k) || '[]');
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // create simple unique id
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

  // crypto helper - returns hex sha256 digest
  async function sha256Hex(str) {
    const enc = new TextEncoder();
    const data = enc.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const arr = Array.from(new Uint8Array(hash));
    return arr.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function randomSalt(len = 12){
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(n => (n % 36).toString(36)).join('');
  }

  // public methods simulating network latency
  return {
    // Signup: store { id, name, email, passwordHash, salt, createdAt }
    async signup({name, email, password}){
      await new Promise(r => setTimeout(r, 120));
      const users = load(USERS_KEY);
      if(users.find(u => u.email.toLowerCase() === email.toLowerCase())){
        throw new Error('Email already registered');
      }
      const salt = randomSalt();
      const hash = await sha256Hex(salt + password);
      const user = { id: uid(), name, email: email.toLowerCase(), passwordHash: hash, salt, createdAt: new Date().toISOString() };
      users.push(user);
      save(USERS_KEY, users);
      return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    },

    // Login: verify password, create session token, returns { token, user }
    async login({email, password}){
      await new Promise(r => setTimeout(r, 120));
      const users = load(USERS_KEY);
      const user = users.find(u => u.email === (email||'').toLowerCase());
      if(!user) throw new Error('No account with this email');
      const hash = await sha256Hex(user.salt + password);
      if(hash !== user.passwordHash) throw new Error('Invalid credentials');
      const sessions = load(SESSIONS_KEY);
      const token = uid();
      sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
      save(SESSIONS_KEY, sessions);
      return { token, user: { id: user.id, name: user.name, email: user.email } };
    },

    // Validate token
    async getUserByToken(token){
      const sessions = load(SESSIONS_KEY);
      const s = sessions.find(x => x.token === token);
      if(!s) return null;
      const users = load(USERS_KEY);
      return users.find(u => u.id === s.userId) || null;
    },

    // Logout: remove session
    async logout(token){
      const sessions = load(SESSIONS_KEY).filter(s => s.token !== token);
      save(SESSIONS_KEY, sessions);
    },

    // Add result: { id, ownerId, studentName, subject, score, date, createdAt }
    async addResult({ownerId, studentName, subject, score, date}){
      await new Promise(r => setTimeout(r, 80));
      const results = load(RESULTS_KEY);
      const res = { id: uid(), ownerId, studentName, subject, score: Number(score), date, createdAt: new Date().toISOString() };
      results.push(res);
      save(RESULTS_KEY, results);
      return res;
    },

    async updateResult({ownerId, id, studentName, subject, score, date}){
      await new Promise(r => setTimeout(r, 80));
      const results = load(RESULTS_KEY);
      const idx = results.findIndex(r => r.id === id);
      if(idx === -1) throw new Error('Result not found');
      if(results[idx].ownerId !== ownerId) throw new Error('Not authorized');
      results[idx] = { ...results[idx], studentName, subject, score: Number(score), date };
      save(RESULTS_KEY, results);
      return results[idx];
    },

    async deleteResult({ownerId, id}){
      await new Promise(r => setTimeout(r, 80));
      const results = load(RESULTS_KEY);
      const res = results.find(r => r.id === id);
      if(!res) throw new Error('Result not found');
      if(res.ownerId !== ownerId) throw new Error('Not authorized');
      const newRes = results.filter(r => r.id !== id);
      save(RESULTS_KEY, newRes);
      return true;
    },

    async getResultsForUser(ownerId){
      await new Promise(r => setTimeout(r, 80));
      const results = load(RESULTS_KEY).filter(r => r.ownerId === ownerId);
      // return copy
      return results.map(r => ({ ...r }));
    },

    // dev helper: clear all data (not exposed in UI)
    _dumpAll(){
      return { users: load(USERS_KEY), results: load(RESULTS_KEY), sessions: load(SESSIONS_KEY) };
    }
  };
})();

// ---------- UI & app logic ----------
const $ = (id) => document.getElementById(id);

// DOM elements
const showLoginBtn = $('showLoginBtn');
const showSignupBtn = $('showSignupBtn');
const loginForm = $('loginForm');
const signupForm = $('signupForm');
const loginBtn = $('loginBtn');
const signupBtn = $('signupBtn');
const loginMsg = $('loginMsg');
const signupMsg = $('signupMsg');

const authSection = $('authSection');
const resultsSection = $('resultsSection');
const welcomeText = $('welcomeText');
const logoutBtn = $('logoutBtn');

const signupName = $('signupName');
const signupEmail = $('signupEmail');
const signupPassword = $('signupPassword');
const signupConfirmPassword = $('signupConfirmPassword');

const loginEmail = $('loginEmail');
const loginPassword = $('loginPassword');

const studentName = $('studentName');
const subjectInput = $('subjectInput');
const scoreInput = $('scoreInput');
const dateInput = $('dateInput');
const addResultBtn = $('addResultBtn');
const cancelEditBtn = $('cancelEditBtn');
const addResultMsg = $('addResultMsg');

const scoreboardList = $('scoreboardList');
const subjectFilter = $('subjectFilter');
const searchInput = $('searchInput');
const sortSelect = $('sortSelect');
const refreshBtn = $('refreshBtn');

const logoutButton = $('logoutBtn');

let state = {
  token: localStorage.getItem('jspr_token_v1') || null,
  currentUser: null,
  editingId: null,
  results: []
};

// ---------- UI helpers ----------
function showMsg(el, text, isError=true, timeout=3500){
  el.style.color = isError ? '' : 'green';
  el.textContent = text;
  if(timeout){
    setTimeout(()=>{ if(el.textContent === text) el.textContent = ''; }, timeout);
  }
}

function toggleAuthTab(tab){
  if(tab === 'login'){
    showLoginBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
    loginForm.style.display = '';
    signupForm.style.display = 'none';
  } else {
    showLoginBtn.classList.remove('active');
    showSignupBtn.classList.add('active');
    loginForm.style.display = 'none';
    signupForm.style.display = '';
  }
}

// ---------- Auth flows ----------
showLoginBtn.addEventListener('click', ()=>toggleAuthTab('login'));
showSignupBtn.addEventListener('click', ()=>toggleAuthTab('signup'));

signupBtn.addEventListener('click', async () => {
  signupMsg.textContent = '';
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const pw = signupPassword.value;
  const pw2 = signupConfirmPassword.value;
  if(!name || !email || !pw || !pw2) return showMsg(signupMsg, 'Please fill all fields');
  if(pw !== pw2) return showMsg(signupMsg, 'Passwords do not match');
  if(pw.length < 6) return showMsg(signupMsg, 'Password must be at least 6 chars');
  try{
    const user = await api.signup({name, email, password: pw});
    showMsg(signupMsg, 'Account created. Please login.', false);
    // auto switch to login
    toggleAuthTab('login');
    signupName.value = signupEmail.value = signupPassword.value = signupConfirmPassword.value = '';
  }catch(err){
    showMsg(signupMsg, err.message || 'Signup failed');
  }
});

loginBtn.addEventListener('click', async () => {
  loginMsg.textContent = '';
  const email = loginEmail.value.trim();
  const pw = loginPassword.value;
  if(!email || !pw) return showMsg(loginMsg, 'Please enter email & password');
  try{
    const { token, user } = await api.login({ email, password: pw });
    state.token = token;
    localStorage.setItem('jspr_token_v1', token);
    state.currentUser = user;
    loginEmail.value = loginPassword.value = '';
    await afterLogin();
  }catch(err){
    showMsg(loginMsg, err.message || 'Login failed');
  }
});

logoutButton.addEventListener('click', async () => {
  if(state.token){
    await api.logout(state.token);
  }
  state.token = null;
  state.currentUser = null;
  localStorage.removeItem('jspr_token_v1');
  showLoggedOut();
});

// ---------- After login ----------
async function afterLogin(){
  // validate token and fetch user info
  const rawUser = await api.getUserByToken(state.token);
  if(!rawUser){
    // invalid session
    state.token = null;
    localStorage.removeItem('jspr_token_v1');
    showLoggedOut();
    return;
  }
  state.currentUser = { id: rawUser.id, name: rawUser.name, email: rawUser.email };
  welcomeText.style.display = 'inline-block';
  welcomeText.textContent = `Hi, ${state.currentUser.name}`;
  logoutBtn.style.display = 'inline-block';
  authSection.style.display = 'none';
  resultsSection.style.display = '';
  await loadAndRenderResults();
}

// ---------- Logged out UI ----------
function showLoggedOut(){
  welcomeText.style.display = 'none';
  logoutBtn.style.display = 'none';
  authSection.style.display = '';
  resultsSection.style.display = 'none';
  state.editingId = null;
  addResultBtn.textContent = 'Add Result';
  cancelEditBtn.style.display = 'none';
}

// ---------- Results logic ----------
async function loadAndRenderResults(){
  if(!state.currentUser) return;
  const results = await api.getResultsForUser(state.currentUser.id);
  state.results = results;
  renderSubjectFilter();
  renderScoreboard();
}

function renderSubjectFilter(){
  // collect unique subjects
  const subs = Array.from(new Set(state.results.map(r => r.subject).filter(Boolean))).sort();
  // keep previous value
  const prev = subjectFilter.value;
  subjectFilter.innerHTML = '<option value="">All subjects</option>';
  subs.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    subjectFilter.appendChild(opt);
  });
  if(subs.includes(prev)) subjectFilter.value = prev;
}

function renderScoreboard(){
  // apply search/filter/sort
  let items = [...state.results];
  const q = searchInput.value.trim().toLowerCase();
  if(q){
    items = items.filter(r => (r.studentName||'').toLowerCase().includes(q) || (r.subject||'').toLowerCase().includes(q));
  }
  const subj = subjectFilter.value;
  if(subj) items = items.filter(r => r.subject === subj);

  const sort = sortSelect.value;
  if(sort === 'score_desc') items.sort((a,b)=>b.score - a.score);
  else if(sort === 'score_asc') items.sort((a,b)=>a.score - b.score);
  else if(sort === 'date_desc') items.sort((a,b)=> new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt));
  else if(sort === 'date_asc') items.sort((a,b)=> new Date(a.date||a.createdAt) - new Date(b.date||b.createdAt));

  // render
  scoreboardList.innerHTML = '';
  if(items.length === 0){
    scoreboardList.innerHTML = `<div class="smalltext">No results to show.</div>`;
    return;
  }

  items.forEach(r => {
    const el = document.createElement('div');
    el.className = 'result-card';
    el.innerHTML = `
      <div class="result-left">
        <div class="badge">${r.score}</div>
        <div>
          <div style="font-weight:700">${escapeHtml(r.studentName)}</div>
          <div class="result-meta">${escapeHtml(r.subject)} • <span class="smalltext">${r.date || (new Date(r.createdAt)).toLocaleDateString()}</span></div>
        </div>
      </div>
      <div class="result-actions">
        <button class="icon-btn icon-edit" data-id="${r.id}">Edit</button>
        <button class="icon-btn icon-delete" data-id="${r.id}">Delete</button>
      </div>
    `;
    scoreboardList.appendChild(el);
  });

  // attach handlers
  scoreboardList.querySelectorAll('.icon-edit').forEach(b => b.addEventListener('click', onEditClicked));
  scoreboardList.querySelectorAll('.icon-delete').forEach(b => b.addEventListener('click', onDeleteClicked));
}

function escapeHtml(s){
  return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

async function onEditClicked(e){
  const id = e.currentTarget.dataset.id;
  const res = state.results.find(r => r.id === id);
  if(!res) return;
  // populate form
  studentName.value = res.studentName;
  subjectInput.value = res.subject;
  scoreInput.value = res.score;
  dateInput.value = res.date || '';
  state.editingId = id;
  addResultBtn.textContent = 'Save changes';
  cancelEditBtn.style.display = '';
}

cancelEditBtn.addEventListener('click', () => {
  clearAddForm();
});

async function onDeleteClicked(e){
  const id = e.currentTarget.dataset.id;
  if(!confirm('Delete this result?')) return;
  try{
    await api.deleteResult({ ownerId: state.currentUser.id, id });
    showMsg(addResultMsg, 'Result deleted', false);
    // refresh
    await loadAndRenderResults();
  }catch(err){
    showMsg(addResultMsg, err.message || 'Delete failed');
  }
}

function clearAddForm(){
  studentName.value = subjectInput.value = scoreInput.value = dateInput.value = '';
  state.editingId = null;
  addResultBtn.textContent = 'Add Result';
  cancelEditBtn.style.display = 'none';
  addResultMsg.textContent = '';
}

addResultBtn.addEventListener('click', async () => {
  addResultMsg.textContent = '';
  if(!state.currentUser) return showMsg(addResultMsg, 'Sign in to add results');
  const sName = studentName.value.trim();
  const subj = subjectInput.value.trim();
  const score = scoreInput.value;
  const date = dateInput.value || new Date().toISOString().slice(0,10);

  if(!sName || !subj || score === '' || score === null){
    return showMsg(addResultMsg, 'Please provide student, subject and score');
  }
  if(Number(score) < 0 || Number(score) > 100) return showMsg(addResultMsg, 'Score must be between 0 and 100');

  try{
    if(state.editingId){
      await api.updateResult({ ownerId: state.currentUser.id, id: state.editingId, studentName: sName, subject: subj, score, date });
      showMsg(addResultMsg, 'Result updated', false);
    } else {
      await api.addResult({ ownerId: state.currentUser.id, studentName: sName, subject: subj, score, date });
      showMsg(addResultMsg, 'Result added', false);
    }
    clearAddForm();
    await loadAndRenderResults();
  }catch(err){
    showMsg(addResultMsg, err.message || 'Failed to save result');
  }
});

// filters & search
searchInput.addEventListener('input', debounce(()=>renderScoreboard(), 250));
subjectFilter.addEventListener('change', ()=>renderScoreboard());
sortSelect.addEventListener('change', ()=>renderScoreboard());
refreshBtn.addEventListener('click', ()=>loadAndRenderResults());

// debounce helper
function debounce(fn, ms=200){
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(()=>fn(...args), ms);
  };
}

// initial load: if token exists, attempt to get user and show results
(async function init(){
  if(state.token){
    try{
      const rawUser = await api.getUserByToken(state.token);
      if(rawUser){
        state.currentUser = { id: rawUser.id, name: rawUser.name, email: rawUser.email };
        welcomeText.style.display = 'inline-block';
        welcomeText.textContent = `Hi, ${state.currentUser.name}`;
        logoutBtn.style.display = 'inline-block';
        authSection.style.display = 'none';
        resultsSection.style.display = '';
        await loadAndRenderResults();
        return;
      }
    }catch(e){
      console.warn(e);
    }
  }
  showLoggedOut();
})();

// small helper to keep components accessible from console if needed
window._app = { api, state };
