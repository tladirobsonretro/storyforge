const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

function buildStory(idea) {
  const clean = idea.trim().replace(/\s+/g, " ");
  const title = clean.length > 48 ? clean.slice(0, 48).replace(/\s+\S*$/, "") : clean;
  const world = "A cinematic world built around " + clean.toLowerCase() + ". It feels expansive, mysterious and full of places worth discovering.";
  const protagonist = "A curious young hero who refuses to leave a mystery unsolved.";
  const companion = "A loyal companion who brings humour, courage and a different way of seeing the world.";
  return {
    title: title || "Untitled Adventure",
    logline: "When " + clean.toLowerCase() + ", a young hero must uncover the truth before the opportunity disappears.",
    world,
    characters: [
      { name: "The Explorer", role: protagonist },
      { name: "The Companion", role: companion }
    ],
    episodes: [
      { number: 1, title: "The Discovery", summary: "The ordinary world changes when the first clue appears. Our heroes choose to follow it." },
      { number: 2, title: "Beyond the Map", summary: "The journey reveals a hidden world with rules nobody expected." },
      { number: 3, title: "The Test", summary: "A difficult choice forces the heroes to work together and trust what they have learned." },
      { number: 4, title: "The Secret", summary: "The mystery finally makes sense, but solving it creates a bigger question." },
      { number: 5, title: "A New Beginning", summary: "The heroes return changed, carrying a discovery that opens the door to the next adventure." }
    ],
    scenes: [
      { shot: "01", camera: "Wide establishing shot", action: "Reveal the world and the first strange clue.", audio: "Atmospheric score, distant environmental sounds." },
      { shot: "02", camera: "Medium tracking shot", action: "Follow the heroes as they investigate.", audio: "Footsteps, dialogue and subtle rhythmic music." },
      { shot: "03", camera: "Close-up", action: "Reveal the object or detail that changes everything.", audio: "Music drops, then a single discovery cue." }
    ]
  };
}

function buildWorld(input) {
  const name = (input.name || "Untitled World").trim();
  const premise = (input.premise || "an unexplored world").trim();
  const tone = (input.tone || "cinematic adventure").trim();
  const setting = (input.setting || "islands, hidden places and ancient mysteries").trim();
  return {
    name,
    premise,
    tone,
    setting,
    rules: [
      "Every discovery should reveal a new question.",
      "The world has its own history and visual language.",
      "Characters must have meaningful choices that affect the story."
    ],
    visualIdentity: "A " + tone.toLowerCase() + " world built around " + setting.toLowerCase() + ", with strong silhouettes, memorable locations and cinematic lighting."
  };
}

function buildCharacter(input) {
  const name = (input.name || "New Character").trim();
  const role = (input.role || "hero").trim();
  const personality = (input.personality || "curious, brave and imaginative").trim();
  const appearance = (input.appearance || "distinctive silhouette and expressive features").trim();
  const goal = (input.goal || "discover the truth").trim();
  return {
    name,
    role,
    personality,
    appearance,
    goal,
    strength: "Sees possibilities where others see obstacles.",
    flaw: "Sometimes acts before understanding the consequences.",
    arc: "Learns that becoming stronger also means learning when to trust others."
  };
}

app.post("/api/world", (req, res) => {
  if (!req.body) return res.status(400).json({ error: "World details are required." });
  res.json(buildWorld(req.body));
});

app.post("/api/character", (req, res) => {
  if (!req.body) return res.status(400).json({ error: "Character details are required." });
  res.json(buildCharacter(req.body));
});

app.post("/api/generate", (req, res) => {
  if (!req.body || !req.body.idea || !req.body.idea.trim()) {
    return res.status(400).json({ error: "Please provide a story idea." });
  }
  res.json(buildStory(req.body.idea));
});

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>StoryForge | Create worlds. Tell stories.</title>
<style>
:root{--bg:#090909;--panel:#111;--line:#282828;--text:#f5f5f5;--muted:#8d8d8d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input{font:inherit}button{cursor:pointer}
.app{min-height:100vh;display:grid;grid-template-columns:230px 1fr}.sidebar{border-right:1px solid var(--line);padding:24px 16px;background:#0c0c0c;display:flex;flex-direction:column}.logo{font-size:21px;font-weight:800;letter-spacing:-.7px;padding:4px 10px 30px}.logo span{color:#777}.nav{display:grid;gap:5px}.nav button{border:0;background:transparent;color:#999;text-align:left;padding:11px 12px;border-radius:9px}.nav button.active,.nav button:hover{background:#1a1a1a;color:#fff}.side-bottom{margin-top:auto;color:#666;font-size:12px;padding:12px}
.main{padding:30px 34px 70px;max-width:1250px;width:100%;margin:auto}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}.eyebrow{color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1.6px}.top h1{font-size:32px;letter-spacing:-1.3px;margin:6px 0 0}.new{background:#fff;color:#000;border:0;border-radius:9px;padding:11px 17px;font-weight:700}
.hero{border:1px solid var(--line);border-radius:16px;background:linear-gradient(135deg,#171717,#0e0e0e);padding:30px;margin-bottom:28px}.hero h2{font-size:28px;margin:0 0 8px;letter-spacing:-1px}.hero p{color:#999;margin:0 0 22px}.prompt{display:flex;gap:10px}.prompt input{flex:1;background:#090909;border:1px solid #303030;color:#fff;border-radius:9px;padding:14px 15px;outline:none}.tool-input{width:100%;margin-top:8px;background:#090909;border:1px solid #303030;color:#fff;border-radius:8px;padding:11px;outline:none}.tool-action{margin-top:14px;padding:12px 18px}.generate{background:#fff;color:#000;border:0;border-radius:9px;padding:0 19px;font-weight:750}.generate:disabled{opacity:.55;cursor:wait}
.section-head{display:flex;justify-content:space-between;align-items:center;margin:28px 0 14px}.section-head h3{font-size:15px;margin:0}.section-head span{font-size:12px;color:#666}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{border:1px solid var(--line);background:var(--panel);border-radius:13px;padding:18px;min-height:135px}.icon{width:34px;height:34px;border-radius:8px;background:#202020;display:grid;place-items:center;margin-bottom:14px}.card h4{margin:0 0 6px;font-size:15px}.card p{margin:0;color:#777;font-size:13px;line-height:1.5}
.results{display:none;border:1px solid var(--line);border-radius:16px;background:#0f0f0f;padding:24px;margin-top:28px}.results.show{display:block}.result-title{font-size:25px;margin:0 0 7px}.logline{color:#aaa;line-height:1.55;margin:0 0 22px}.result-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.result-box{border:1px solid var(--line);border-radius:12px;padding:18px;background:#131313}.result-box h4{margin:0 0 9px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888}.result-box p{margin:0;color:#bbb;line-height:1.55;font-size:13px}.episode{padding:11px 0;border-top:1px solid #252525}.episode:first-child{border-top:0;padding-top:0}.episode strong{font-size:13px}.episode span{display:block;color:#777;font-size:12px;line-height:1.45;margin-top:3px}.shots{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.shot{background:#191919;border-radius:9px;padding:12px}.shot b{font-size:11px;color:#777}.shot div{font-size:12px;margin-top:6px;line-height:1.4;color:#bbb}
.projects{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.project{border:1px solid var(--line);border-radius:13px;padding:20px;background:var(--panel);display:flex;justify-content:space-between;align-items:center}.project strong{font-size:15px}.project small{display:block;color:#666;margin-top:5px}.status{font-size:11px;border:1px solid #333;border-radius:99px;padding:5px 9px;color:#999}.toast{position:fixed;right:22px;bottom:22px;background:#fff;color:#000;padding:12px 16px;border-radius:9px;font-size:13px;font-weight:650;display:none}
@media(max-width:800px){.app{grid-template-columns:1fr}.sidebar{display:none}.main{padding:22px 18px}.cards,.projects,.result-grid,.shots{grid-template-columns:1fr}.prompt{flex-direction:column}.generate{padding:13px}.top h1{font-size:27px}}
</style>
</head>
<body><div class="app">
<aside class="sidebar"><div class="logo">StoryForge <span>AI</span></div><nav class="nav">
<button class="active" onclick="showTool('dashboard')">⌂ &nbsp; Dashboard</button><button onclick="showTool('world')">◈ &nbsp; Worlds</button><button onclick="showTool('character')">● &nbsp; Characters</button><button>▣ &nbsp; Stories</button><button>▶ &nbsp; Videos</button>
</nav><div class="side-bottom">Create once. Build a universe.</div></aside>
<main class="main">
<section id="toolPanel" class="results" style="margin-top:0;margin-bottom:28px">
  <div class="section-head" style="margin-top:0"><h3 id="toolTitle">World Builder</h3><span id="toolHint">Shape the rules of your universe</span></div>
  <div id="worldForm">
    <div class="result-grid">
      <div class="result-box"><h4>World name</h4><input id="worldName" class="tool-input" placeholder="The Isles of Everlight"></div>
      <div class="result-box"><h4>Tone</h4><input id="worldTone" class="tool-input" placeholder="Cinematic family adventure"></div>
      <div class="result-box"><h4>Premise</h4><input id="worldPremise" class="tool-input" placeholder="A hidden world appears beyond the ordinary sea"></div>
      <div class="result-box"><h4>Setting</h4><input id="worldSetting" class="tool-input" placeholder="Floating islands, ancient ruins, glowing forests"></div>
    </div>
    <button class="generate tool-action" onclick="buildWorld()">Forge world →</button>
  </div>
  <div id="characterForm" style="display:none">
    <div class="result-grid">
      <div class="result-box"><h4>Name</h4><input id="charName" class="tool-input" placeholder="Lumi"></div>
      <div class="result-box"><h4>Role</h4><input id="charRole" class="tool-input" placeholder="Explorer"></div>
      <div class="result-box"><h4>Personality</h4><input id="charPersonality" class="tool-input" placeholder="Curious, playful, brave"></div>
      <div class="result-box"><h4>Appearance</h4><input id="charAppearance" class="tool-input" placeholder="Distinctive colours, expressive eyes, unique silhouette"></div>
      <div class="result-box"><h4>Goal</h4><input id="charGoal" class="tool-input" placeholder="Find the missing map"></div>
    </div>
    <button class="generate tool-action" onclick="buildCharacter()">Forge character →</button>
  </div>
  <div id="toolOutput" class="result-box" style="display:none;margin-top:14px"></div>
</section>
<div class="top"><div><div class="eyebrow">Creator workspace</div><h1>Bring a story to life.</h1></div><button class="new" onclick="focusPrompt()">+ New story</button></div>
<section class="hero"><h2>What are we creating?</h2><p>Start with an idea. StoryForge turns the premise into a structured story world.</p><div class="prompt"><input id="idea" placeholder="A young explorer discovers an island that appears once every hundred years..." /><button id="generate" class="generate" onclick="createStory()">Create story →</button></div></section>
<section id="results" class="results"><h2 id="resultTitle" class="result-title"></h2><p id="logline" class="logline"></p><div class="result-grid">
<div class="result-box"><h4>World</h4><p id="world"></p></div><div class="result-box"><h4>Characters</h4><div id="characters"></div></div>
<div class="result-box"><h4>Episode arc</h4><div id="episodes"></div></div><div class="result-box"><h4>Storyboard starter</h4><div id="shots" class="shots"></div></div>
</div></section>
<div class="section-head"><h3>Creative tools</h3><span>Build every layer of your story</span></div>
<section class="cards"><div class="card"><div class="icon">◉</div><h4>World Builder</h4><p>Define locations, rules, history, tone and visual identity.</p></div><div class="card"><div class="icon">♙</div><h4>Character Forge</h4><p>Create recurring characters with personalities and visual consistency.</p></div><div class="card"><div class="icon">✦</div><h4>Story Engine</h4><p>Turn a premise into episodes, scenes, dialogue and narrative arcs.</p></div><div class="card"><div class="icon">▤</div><h4>Storyboard</h4><p>Break scenes into shots with camera direction and action.</p></div><div class="card"><div class="icon">◇</div><h4>Asset Studio</h4><p>Generate and organise the images, voices and creative assets.</p></div><div class="card"><div class="icon">▶</div><h4>Video Forge</h4><p>Assemble scenes into short-form episodes ready for review.</p></div></section>
<div class="section-head"><h3>Your worlds</h3><span>1 active workspace</span></div><section class="projects"><div class="project"><div><strong id="projectName">Start your first universe</strong><small id="projectSub">Your next story begins here.</small></div><span class="status">READY</span></div><div class="project"><div><strong>StoryForge pipeline</strong><small>World → Character → Story → Storyboard → Video</small></div><span class="status">BUILDING</span></div></section>
</main></div><div class="toast" id="toast"></div>
<script>
function focusPrompt(){document.getElementById("idea").focus()}
function showTool(tool){
 const panel=document.getElementById("toolPanel"), world=document.getElementById("worldForm"), character=document.getElementById("characterForm"), output=document.getElementById("toolOutput");
 if(tool==="dashboard"){panel.classList.remove("show");return}
 panel.classList.add("show"); output.style.display="none";
 world.style.display=tool==="world"?"block":"none";
 character.style.display=tool==="character"?"block":"none";
 document.getElementById("toolTitle").textContent=tool==="world"?"World Builder":"Character Forge";
 document.getElementById("toolHint").textContent=tool==="world"?"Shape the rules of your universe":"Create a recurring character";
 panel.scrollIntoView({behavior:"smooth",block:"start"});
}
async function buildWorld(){
 const payload={name:worldName.value,premise:worldPremise.value,tone:worldTone.value,setting:worldSetting.value};
 const response=await fetch("/api/world",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const data=await response.json(); if(!response.ok){toast(data.error||"World failed");return}
 toolOutput.style.display="block"; toolOutput.innerHTML="<h4>World forged</h4><p><strong>"+data.name+"</strong><br>"+data.visualIdentity+"</p><p>"+data.rules.join("<br>")+"</p>"; toast("World forged successfully.");
}
async function buildCharacter(){
 const payload={name:charName.value,role:charRole.value,personality:charPersonality.value,appearance:charAppearance.value,goal:charGoal.value};
 const response=await fetch("/api/character",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const data=await response.json(); if(!response.ok){toast(data.error||"Character failed");return}
 toolOutput.style.display="block"; toolOutput.innerHTML="<h4>Character forged</h4><p><strong>"+data.name+"</strong> · "+data.role+"</p><p>"+data.personality+"</p><p><strong>Goal:</strong> "+data.goal+"</p><p><strong>Strength:</strong> "+data.strength+"<br><strong>Flaw:</strong> "+data.flaw+"</p><p>"+data.arc+"</p>"; toast("Character forged successfully.");
}
function toast(message){const t=document.getElementById("toast");t.textContent=message;t.style.display="block";setTimeout(()=>t.style.display="none",2600)}
async function createStory(){
 const input=document.getElementById("idea"), button=document.getElementById("generate"), value=input.value.trim();
 if(!value){toast("Give us an idea first.");focusPrompt();return}
 button.disabled=true;button.textContent="Forging story…";
 try{
  const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idea:value})});
  const data=await response.json(); if(!response.ok) throw new Error(data.error||"Generation failed");
  document.getElementById("resultTitle").textContent=data.title;
  document.getElementById("logline").textContent=data.logline;
  document.getElementById("world").textContent=data.world;
  document.getElementById("characters").innerHTML=data.characters.map(c=>"<div class='episode'><strong>"+c.name+"</strong><span>"+c.role+"</span></div>").join("");
  document.getElementById("episodes").innerHTML=data.episodes.map(e=>"<div class='episode'><strong>"+e.number+". "+e.title+"</strong><span>"+e.summary+"</span></div>").join("");
  document.getElementById("shots").innerHTML=data.scenes.map(s=>"<div class='shot'><b>SHOT "+s.shot+"</b><div>"+s.camera+"</div><div>"+s.action+"</div></div>").join("");
  document.getElementById("results").classList.add("show");
  document.getElementById("projectName").textContent=data.title;
  document.getElementById("projectSub").textContent="Story world created and ready to develop.";
  toast("Story forged successfully.");
 }catch(error){toast(error.message)}finally{button.disabled=false;button.textContent="Create story →"}
}
</script></body></html>`);
});

app.listen(PORT, () => console.log(`StoryForge running on port ${PORT}`));
