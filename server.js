const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>StoryForge | Create worlds. Tell stories.</title>
<style>
:root{--bg:#090909;--panel:#111;--panel2:#171717;--line:#272727;--text:#f5f5f5;--muted:#929292;--accent:#fff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
button,input,textarea,select{font:inherit}button{cursor:pointer}
.app{min-height:100vh;display:grid;grid-template-columns:230px 1fr}
.sidebar{border-right:1px solid var(--line);padding:24px 16px;background:#0c0c0c;display:flex;flex-direction:column}
.logo{font-size:21px;font-weight:800;letter-spacing:-.7px;padding:4px 10px 30px}.logo span{color:#777}
.nav{display:grid;gap:5px}.nav button{border:0;background:transparent;color:#999;text-align:left;padding:11px 12px;border-radius:9px}.nav button.active,.nav button:hover{background:#1a1a1a;color:#fff}
.side-bottom{margin-top:auto;color:#666;font-size:12px;padding:12px}
.main{padding:30px 34px 60px;max-width:1250px;width:100%;margin:auto}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:34px}.eyebrow{color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1.6px}.top h1{font-size:32px;letter-spacing:-1.3px;margin:6px 0 0}.new{background:#fff;color:#000;border:0;border-radius:9px;padding:11px 17px;font-weight:700}
.hero{border:1px solid var(--line);border-radius:16px;background:linear-gradient(135deg,#171717,#0e0e0e);padding:30px;margin-bottom:28px}.hero h2{font-size:28px;margin:0 0 8px;letter-spacing:-1px}.hero p{color:#999;margin:0 0 22px}.prompt{display:flex;gap:10px}.prompt input{flex:1;background:#090909;border:1px solid #303030;color:#fff;border-radius:9px;padding:14px 15px;outline:none}.prompt input:focus{border-color:#666}.generate{background:#fff;color:#000;border:0;border-radius:9px;padding:0 19px;font-weight:750}
.section-head{display:flex;justify-content:space-between;align-items:center;margin:28px 0 14px}.section-head h3{font-size:15px;margin:0}.section-head span{font-size:12px;color:#666}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{border:1px solid var(--line);background:var(--panel);border-radius:13px;padding:18px;min-height:135px}.icon{width:34px;height:34px;border-radius:8px;background:#202020;display:grid;place-items:center;margin-bottom:14px;font-size:15px}.card h4{margin:0 0 6px;font-size:15px}.card p{margin:0;color:#777;font-size:13px;line-height:1.5}
.projects{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.project{border:1px solid var(--line);border-radius:13px;padding:20px;background:var(--panel);display:flex;justify-content:space-between;align-items:center}.project strong{font-size:15px}.project small{display:block;color:#666;margin-top:5px}.status{font-size:11px;border:1px solid #333;border-radius:99px;padding:5px 9px;color:#999}
.toast{position:fixed;right:22px;bottom:22px;background:#fff;color:#000;padding:12px 16px;border-radius:9px;font-size:13px;font-weight:650;display:none}
@media(max-width:800px){.app{grid-template-columns:1fr}.sidebar{display:none}.main{padding:22px 18px}.cards,.projects{grid-template-columns:1fr}.prompt{flex-direction:column}.generate{padding:13px}.top h1{font-size:27px}}
</style>
</head>
<body>
<div class="app">
<aside class="sidebar">
<div class="logo">StoryForge <span>AI</span></div>
<nav class="nav">
<button class="active">⌂ &nbsp; Dashboard</button>
<button>◈ &nbsp; Worlds</button>
<button>● &nbsp; Characters</button>
<button>▣ &nbsp; Stories</button>
<button>▶ &nbsp; Videos</button>
</nav>
<div class="side-bottom">Create once. Build a universe.</div>
</aside>
<main class="main">
<div class="top"><div><div class="eyebrow">Creator workspace</div><h1>Bring a story to life.</h1></div><button class="new" onclick="focusPrompt()">+ New story</button></div>
<section class="hero">
<h2>What are we creating?</h2>
<p>Start with an idea. StoryForge will turn it into a world, characters and a story.</p>
<div class="prompt"><input id="idea" placeholder="A young explorer discovers an island that appears once every hundred years..." /><button class="generate" onclick="createStory()">Create story →</button></div>
</section>
<div class="section-head"><h3>Creative tools</h3><span>Build every layer of your story</span></div>
<section class="cards">
<div class="card"><div class="icon">◉</div><h4>World Builder</h4><p>Define locations, rules, history, tone and the visual identity of your universe.</p></div>
<div class="card"><div class="icon">♙</div><h4>Character Forge</h4><p>Create recurring characters with personalities, relationships and visual consistency.</p></div>
<div class="card"><div class="icon">✦</div><h4>Story Engine</h4><p>Turn a premise into episodes, scenes, dialogue and a complete narrative arc.</p></div>
<div class="card"><div class="icon">▤</div><h4>Storyboard</h4><p>Break every scene into shots with camera direction, action and visual prompts.</p></div>
<div class="card"><div class="icon">◇</div><h4>Asset Studio</h4><p>Generate and organise the images, voices and creative assets your story needs.</p></div>
<div class="card"><div class="icon">▶</div><h4>Video Forge</h4><p>Assemble scenes into short-form episodes ready for review and publishing.</p></div>
</section>
<div class="section-head"><h3>Your worlds</h3><span>0 active projects</span></div>
<section class="projects">
<div class="project"><div><strong>Start your first universe</strong><small>Your next story begins here.</small></div><span class="status">NEW</span></div>
<div class="project"><div><strong>StoryForge roadmap</strong><small>World → Character → Story → Video</small></div><span class="status">BUILDING</span></div>
</section>
</main>
</div>
<div class="toast" id="toast"></div>
<script>
function focusPrompt(){document.getElementById("idea").focus()}
function createStory(){
 const input=document.getElementById("idea"), value=input.value.trim();
 const toast=document.getElementById("toast");
 if(!value){toast.textContent="Give us an idea first.";toast.style.display="block";setTimeout(()=>toast.style.display="none",2200);focusPrompt();return}
 toast.textContent="Story workspace created: "+value.slice(0,45)+(value.length>45?"…":"");
 toast.style.display="block";setTimeout(()=>toast.style.display="none",3000);
}
</script>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`StoryForge running on port ${PORT}`);
});
