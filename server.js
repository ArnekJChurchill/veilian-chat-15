const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const Pusher = require('pusher');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.json());

const pusher = new Pusher({
  appId:'2080160',
  key:'b7d05dcc13df522efbbc',
  secret:'4064ce2fc0ac5596d506',
  cluster:'us2',
  useTLS:true
});

// File paths
const USERS_FILE = path.join(__dirname,'data','users.json');
const BANNED_FILE = path.join(__dirname,'data','banned.json');

// Helper functions
function loadJSON(file){ return JSON.parse(fs.readFileSync(file)); }
function saveJSON(file,data){ fs.writeFileSync(file,JSON.stringify(data,null,2)); }

// Login
app.post('/login',(req,res)=>{
  const {username,password} = req.body;
  const usersData = loadJSON(USERS_FILE);
  const bannedData = loadJSON(BANNED_FILE);

  if(bannedData.banned.includes(username)) return res.json({success:false,message:"You are banned"});

  const user = usersData.users.find(u=>u.username===username && u.password===password);
  if(user) return res.json({success:true,isModerator:user.isModerator});
  return res.json({success:false,message:"Invalid credentials"});
});

// Signup
app.post('/signup',(req,res)=>{
  const {username,password} = req.body;
  if(!username.startsWith("@")) return res.json({success:false,message:"Username must start with @"});

  const usersData = loadJSON(USERS_FILE);
  const bannedData = loadJSON(BANNED_FILE);

  if(usersData.users.find(u=>u.username===username) || bannedData.banned.includes(username))
    return res.json({success:false,message:"Username already taken or banned"});

  usersData.users.push({username,password,isModerator:false});
  saveJSON(USERS_FILE,usersData);
  res.json({success:true});
});

// Send message
app.post('/send',(req,res)=>{
  const {displayName,message} = req.body;
  const bannedData = loadJSON(BANNED_FILE);
  if(bannedData.banned.includes(displayName)) return res.sendStatus(403);
  pusher.trigger('veilian-chat','new-message',{displayName,message});
  res.sendStatus(200);
});

// Admin: ban
app.post('/ban',(req,res)=>{
  const {username} = req.body;
  const usersData = loadJSON(USERS_FILE);
  const bannedData = loadJSON(BANNED_FILE);

  if(!usersData.users.find(u=>u.username===username)) return res.json({success:false,message:"User not found"});
  if(!bannedData.banned.includes(username)) bannedData.banned.push(username);
  saveJSON(BANNED_FILE,bannedData);
  res.json({success:true});
});

// Admin: unban
app.post('/unban',(req,res)=>{
  const {username} = req.body;
  const bannedData = loadJSON(BANNED_FILE);
  bannedData.banned = bannedData.banned.filter(u=>u!==username);
  saveJSON(BANNED_FILE,bannedData);
  res.json({success:true});
});

// Get banned users
app.get('/banned',(req,res)=>{
  const bannedData = loadJSON(BANNED_FILE);
  res.json(bannedData);
});

// Serve index
app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname,'public','index.html'));
});

app.listen(PORT,()=>console.log(`Veilian-Chat-15 running on http://localhost:${PORT}`));

