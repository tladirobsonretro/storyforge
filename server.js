const express = require("express");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const ffmpegPath = require("ffmpeg-static");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

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
    name, premise, tone, setting,
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
    name, role, personality, appearance, goal,
    strength: "Sees possibilities where others see obstacles.",
    flaw: "Sometimes acts before understanding the consequences.",
    arc: "Learns that becoming stronger also means learning when to trust others."
  };
}

function buildAsset(input) {
  const type = (input.type || "character").trim();
  const subject = (input.subject || "original story character").trim();
  const style = (input.style || "cinematic animated adventure").trim();
  const mood = (input.mood || "warm, curious and adventurous").trim();
  const notes = (input.notes || "Keep the design original, readable and consistent across future scenes.").trim();
  const ratios = { character: "1:1", environment: "16:9", prop: "1:1", scene: "16:9" };
  const prompt = [
    "Create an original " + type.toLowerCase() + " for a story universe.",
    "Subject: " + subject + ".",
    "Visual style: " + style + ".",
    "Mood: " + mood + ".",
    "Use a clear silhouette, strong visual storytelling and memorable shapes.",
    "Design for recurring continuity across future images.",
    "Do not imitate an existing copyrighted character, franchise or artist."
  ].join(" ");
  const negativePrompt = "No logos, no text, no watermark, no existing franchise characters, no copied character designs, no distorted anatomy, no duplicate subjects.";
  return {
    assetType: type,
    subject,
    prompt,
    negativePrompt,
    aspectRatio: ratios[type.toLowerCase()] || "16:9",
    visualNotes: "Prioritise silhouette, colour separation, facial readability and details that can be reproduced consistently.",
    continuityNotes: notes
  };
}

app.post("/api/scene", async (req, res) => {
  const input = req.body || {};
  const premise = (input.premise || "").trim();
  const characters = (input.characters || "").trim();
  const world = (input.world || "").trim();
  if (!premise) return res.status(400).json({ error: "A scene premise is required." });
  if (!process.env.POLLINATIONS_API_KEY) return res.json({title:"Scene: "+premise.slice(0,48),location:world||"Story world",action:"The characters investigate the situation, make a meaningful choice and discover a new clue.",dialogue:[{character:"Hero",line:"Something here is not what it seems."},{character:"Companion",line:"Then we should find out what it is."}],beats:["Establish the location","Introduce the problem","Character choice","Discovery","Hook for the next scene"]});
  try {
    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {method:"POST",headers:{"Authorization":"Bearer "+process.env.POLLINATIONS_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"openai",messages:[{role:"system",content:"Write original family-safe animated scenes. Return ONLY JSON with title, location, action, dialogue, beats. dialogue is an array of character and line. Keep dialogue short and natural."},{role:"user",content:"World: "+world+"\nCharacters: "+characters+"\nScene premise: "+premise}],temperature:0.85})});
    const data = await response.json();
    if (!response.ok) throw new Error("Scene model failed");
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || "");
    if (!parsed.title || !Array.isArray(parsed.dialogue) || !Array.isArray(parsed.beats)) throw new Error("Incomplete scene");
    res.json(parsed);
  } catch (error) { res.status(502).json({error:"Scene generation failed. Please try again."}); }
});
app.post("/api/world", (req, res) => {
  if (!req.body) return res.status(400).json({ error: "World details are required." });
  res.json(buildWorld(req.body));
});

app.post("/api/character", (req, res) => {
  if (!req.body) return res.status(400).json({ error: "Character details are required." });
  res.json(buildCharacter(req.body));
});

app.post("/api/asset", (req, res) => {
  if (!req.body) return res.status(400).json({ error: "Asset details are required." });
  res.json(buildAsset(req.body));
});

app.post("/api/image", async (req, res) => {
  if (!process.env.POLLINATIONS_API_KEY) {
    return res.status(503).json({ error: "Image generation is not connected yet. Add POLLINATIONS_API_KEY in Render to enable it." });
  }
  const prompt = (req.body && req.body.prompt || "").trim();
  const model = (req.body && req.body.model || "flux").trim();
  if (!prompt) return res.status(400).json({ error: "An image prompt is required." });
  try {
    const response = await fetch("https://gen.pollinations.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.POLLINATIONS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        prompt,
        response_format: "url",
        size: req.body.size || "1024x1024"
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || data.error || "Image generation failed." });
    const url = data.data?.[0]?.url || data.data?.[0]?.b64_json;
    if (!url) return res.status(502).json({ error: "The image provider returned no image." });
    res.json({ url, model });
  } catch (error) {
    res.status(502).json({ error: "Image provider could not be reached." });
  }
});

function buildStoryboard(input) {
  const title = (input.title || "Untitled Story").trim();
  const episode = Number(input.episode || 1);
  const episodeTitle = (input.episodeTitle || "The Discovery").trim();
  const scene = input.scene || null;
  const premise = (input.premise || (scene && scene.action) || "the heroes discover something unexpected").trim();
  const worldBible = (input.worldBible || "").trim();
  const characterBible = (input.characterBible || "").trim();
  const visualStyle = (input.visualStyle || "Original painterly cinematic stylized animation with expressive character design, hand-painted textures, bold graphic shadows, rich atmospheric lighting and distinctly South African retro-futurist environments; never photorealistic, hyperrealistic or live-action.").trim();
  const continuityPrefix = ["LOCKED VISUAL STYLE: " + visualStyle, worldBible && "WORLD BIBLE: " + worldBible, characterBible && "CHARACTER BIBLE: " + characterBible, input.scene && "SCENE CONTEXT: " + JSON.stringify(input.scene), "Maintain exact identity, proportions, wardrobe, signature accessories, environment geography, lighting language and colour palette across every shot. Use stylized animated rendering only. No photorealism, hyperrealism or live-action aesthetics."].filter(Boolean).join(" ");
  const templates = [
    ["01","Extreme wide establishing","Slow aerial push-in","Establish the location and the scale of the world before the action begins.","Ambient environment, distant birds and soft score.","4s","cinematic establishing frame; original characters; consistent world design"],
    ["02","Wide shot","Gentle tracking movement","Reveal the heroes entering the location and noticing the first unusual detail.","Footsteps, environment and light dialogue.","4s","full-body character continuity; same outfits and proportions"],
    ["03","Medium two-shot","Slow lateral track","Let the heroes react to the discovery and establish their relationship.","Dialogue, subtle character movement and score.","4s","consistent facial features and wardrobe"],
    ["04","Over-the-shoulder","Slow push toward subject","Show what the heroes are looking at and make the audience discover it with them.","Music builds; environmental detail.","3s","match previous location, lighting and character eyelines"],
    ["05","Close-up","Locked camera with tiny push-in","Focus on the clue, expression or object that changes the direction of the story.","Score drops to a discovery cue.","3s","prop and facial detail must remain consistent"],
    ["06","Reaction close-up","Tiny handheld drift","Capture the emotional reaction and the decision to continue.","Breath, dialogue or a short musical beat.","3s","preserve character identity and emotional continuity"],
    ["07","Action wide","Dynamic follow shot","Turn the discovery into movement as the heroes commit to the next step.","Footsteps, movement and rising score.","4s","maintain screen direction and environment continuity"],
    ["08","Final cinematic frame","Slow pull-back","End the scene on a memorable image that naturally leads into the next scene.","Music resolves into a transition cue.","4s","strong silhouette; clean composition; continuity-ready"]
  ];
  return {
    title, episode, episodeTitle, premise,
    shots: templates.map((t,i)=>({number:i+1,shot:t[0],shotType:t[1],camera:t[2],action:(scene && scene.beats && scene.beats[i % scene.beats.length]) || t[3],audio:(scene && scene.dialogue && scene.dialogue[i % scene.dialogue.length] ? scene.dialogue[i % scene.dialogue.length].character + ": " + scene.dialogue[i % scene.dialogue.length].line : t[4]),duration:t[5],visualPrompt:continuityPrefix + " " + t[6]})),
    totalDuration:"29s",
    continuity:"Keep character identity, wardrobe, props, lighting, location geography and screen direction consistent across every shot." + (worldBible || characterBible ? " StoryForge continuity lock is active." : " Add a world and character bible to activate the continuity lock.")
  };
}

app.post("/api/shot-frame", async (req, res) => {
  if (!process.env.POLLINATIONS_API_KEY) return res.status(503).json({error:"Image generation is not connected yet. Add POLLINATIONS_API_KEY in Render."});
  const prompt=(req.body?.prompt||"").trim();
  if(!prompt) return res.status(400).json({error:"A shot prompt is required."});
  try {
    const response=await fetch("https://gen.pollinations.ai/v1/images/generations",{method:"POST",headers:{"Authorization":"Bearer "+process.env.POLLINATIONS_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({model:"flux",prompt,response_format:"url",size:req.body?.size||"1024x1024",...(req.body?.referenceImage ? {image:[req.body.referenceImage]} : {})})});
    const data=await response.json();
    if(!response.ok) return res.status(response.status).json({error:data.error?.message||"Frame generation failed."});
    const url=data.data?.[0]?.url||data.data?.[0]?.b64_json;
    if(!url) return res.status(502).json({error:"No frame returned."});
    res.json({url,model:"flux"});
  } catch(e) { res.status(502).json({error:"Image provider could not be reached."}); }
});

app.post("/api/storyboard", async (req, res) => {
  if (!req.body) return res.status(400).json({ error: "Storyboard details are required." });
  const input = req.body;
  if (!input.scene || !process.env.POLLINATIONS_API_KEY) return res.json(buildStoryboard(input));
  try {
    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST", headers: {"Authorization":"Bearer "+process.env.POLLINATIONS_API_KEY,"Content-Type":"application/json"},
      body: JSON.stringify({model:"openai",messages:[{role:"system",content:"Turn the supplied scene into exactly 8 original production-ready shots for a premium STYLIZED ANIMATED series. This is NOT live action and NOT photorealistic or hyperrealistic. Use painterly hand-crafted surfaces, expressive stylized faces, graphic shapes, dramatic illustrated lighting, textured brushwork and cinematic animated composition. Preserve the project’s locked visual style, world, character identities, outfits, props, geography and dialogue in every shot. Do not imitate any existing show or artist. Return ONLY valid JSON with key shots. Each shot needs number, scene, camera, action, audio, duration, visualPrompt. Every visualPrompt must explicitly repeat the locked style and the no-photorealism rule."},{role:"user",content:"LOCKED VISUAL STYLE: "+(input.visualStyle||"Original painterly cinematic stylized animation, not photorealistic")+"\nWORLD: "+(input.worldBible||"")+"\nCHARACTERS: "+(input.characterBible||"")+"\nSCENE: "+JSON.stringify(input.scene)}],temperature:0.65})
    });
    const data=await response.json();
    if(!response.ok) throw new Error("Storyboard model failed");
    const raw=data.choices?.[0]?.message?.content||"";
    const parsed=JSON.parse(raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());
    if(!Array.isArray(parsed.shots)||!parsed.shots.length) throw new Error("Incomplete storyboard");
    res.json({...parsed,status:"AI_STORYBOARD_READY"});
  } catch(error) { res.json({...buildStoryboard(input),status:"TEMPLATE_FALLBACK"}); }
});
function buildVideoPlan(input) {
  const title = String(input.title || "Untitled Video").trim();
  const format = String(input.format || "short").trim().toLowerCase();
  const shots = Math.max(1, Math.min(100, parseInt(input.shots, 10) || (Array.isArray(input.storyboard) && input.storyboard.length) || 8));
  const duration = Math.max(1, Math.min(3600, parseInt(input.duration, 10) || 30));
  const captions = input.captions !== false;
  const aspectRatio = format === "landscape" || format === "youtube" || format === "16:9" ? "16:9" :
    format === "square" || format === "1:1" ? "1:1" : "9:16";
  const storyboard = Array.isArray(input.storyboard) ? input.storyboard : [];
  const renderPlan = [
    "Lock project title, format and visual continuity",
    "Organise " + shots + " shots across approximately " + duration + " seconds",
    "Use saved storyboard shots and preserve character, world and scene continuity",
    captions ? "Prepare readable captions and check safe margins" : "Keep captions disabled",
    "Balance dialogue, sound effects and music",
    "Render and review the final cut for pacing, continuity and export quality"
  ];
  if (input.world) renderPlan.splice(1, 0, "Apply the saved world bible to locations, lighting and visual language");
  if (input.characters) renderPlan.splice(2, 0, "Apply the saved character bible to identity, wardrobe and proportions");
  if (storyboard.length) renderPlan.splice(3, 0, "Use " + storyboard.length + " saved storyboard entries as the shot reference");
  return {
    title, format, aspectRatio, shots, duration, captions,
    audio: "Dialogue clarity, environmental sound, sound effects and a balanced music bed",
    status: "READY",
    renderPlan
  };
}

app.post("/api/video-plan", (req, res) => {
  if (!req.body) return res.status(400).json({ error: "Video details are required." });
  res.json(buildVideoPlan(req.body));
});

app.post("/api/video", async (req, res) => {
  if (!process.env.POLLINATIONS_API_KEY) return res.status(503).json({ error: "Video generation is not connected yet. Add POLLINATIONS_API_KEY in Render to enable it." });
  const prompt = String(req.body?.prompt || "").trim();
  const model = String(req.body?.model || "wan").trim();
  const duration = Math.max(2, Math.min(10, Number(req.body?.duration || 4)));
  if (!prompt) return res.status(400).json({ error: "A video prompt is required." });
  try {
    const params = new URLSearchParams({ model, duration: String(duration) });
    if (req.body?.image) params.append("image", String(req.body.image));
    if (Array.isArray(req.body?.referenceImages)) {
      req.body.referenceImages.slice(0, 3).forEach((url) => params.append("reference_images", String(url)));
    }
    const endpoint = "https://gen.pollinations.ai/video/" + encodeURIComponent(prompt) + "?" + params.toString();
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { "Authorization": "Bearer " + process.env.POLLINATIONS_API_KEY, "Accept": "video/mp4, application/json" }
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      const body = await response.text();
      let message = body;
      try { const parsed = JSON.parse(body); message = parsed.error?.message || parsed.error || parsed.message || body; } catch (_) {}
      return res.status(response.status).json({ error: "Video provider error (" + response.status + "): " + String(message).slice(0, 500) });
    }
    if (contentType.includes("application/json") || contentType.includes("text/")) {
      const body = await response.text();
      return res.status(502).json({ error: "The video provider returned a message instead of a video: " + body.slice(0, 400) });
    }
    const video = Buffer.from(await response.arrayBuffer());
    if (video.length < 1000) return res.status(502).json({ error: "The video provider returned an empty or incomplete video. Please try again." });
    if (video.length > 20 * 1024 * 1024) return res.status(502).json({ error: "The generated clip exceeds the 20 MB preview limit. Try a shorter clip." });
    res.json({ url: "data:video/mp4;base64," + video.toString("base64"), model, duration, bytes: video.length });
  } catch (error) {
    console.error("StoryForge video generation failed:", error);
    res.status(502).json({ error: "Video generation could not finish. Please try again. " + (error.message || "") });
  }
});

app.post("/api/assemble", async (req, res) => {
  const clips = Array.isArray(req.body?.clips) ? req.body.clips.filter(Boolean) : [];
  if (clips.length < 2) return res.status(400).json({ error: "At least two animated shot clips are required." });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "storyforge-"));
  try {
    const files = [];
    for (let i = 0; i < clips.length; i++) {
      const url = new URL(clips[i]);
      if (!/^https?:$/.test(url.protocol)) throw new Error("Invalid clip URL.");
      const file = path.join(dir, String(i + 1).padStart(3, "0") + ".mp4");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not download shot " + (i + 1) + ".");
      fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
      files.push(file);
    }
    const normalized = [];
    for (let i = 0; i < files.length; i++) {
      const normalizedFile = path.join(dir, "normalized-" + String(i + 1).padStart(3, "0") + ".mp4");
      await new Promise((resolve, reject) => execFile(ffmpegPath, [
        "-y","-i",files[i],
        "-vf","scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p",
        "-r","30","-c:v","libx264","-preset","veryfast","-crf","23",
        "-c:a","aac","-ar","48000","-ac","2","-b:a","128k","-movflags","+faststart",normalizedFile
      ], {timeout:180000}, (error) => error ? reject(error) : resolve()));
      normalized.push(normalizedFile);
    }
    const list = path.join(dir, "concat.txt");
    fs.writeFileSync(list, normalized.map(f => "file '" + f.replace(/'/g, "'\\''") + "'").join("\n"));
    const output = path.join(dir, "storyforge-final.mp4");
    await new Promise((resolve, reject) => execFile(ffmpegPath, [
      "-y","-f","concat","-safe","0","-i",list,"-c","copy","-movflags","+faststart",output
    ], {timeout:180000}, (error) => error ? reject(error) : resolve()));
    res.setHeader("Content-Type", "video/mp4");
    res.sendFile(output, () => fs.rmSync(dir, { recursive: true, force: true }));
  } catch (error) {
    fs.rmSync(dir, { recursive: true, force: true });
    res.status(502).json({ error: error.message || "Video assembly failed." });
  }
});

app.post("/api/generate", async (req, res) => {
  if (!req.body || !req.body.idea || !req.body.idea.trim()) {
    return res.status(400).json({ error: "Please provide a story idea." });
  }
  const idea = req.body.idea.trim();
  if (!process.env.POLLINATIONS_API_KEY) {
    return res.json({ ...buildStory(idea), generatedBy: "template-fallback", aiConnected: false, generationWarning: "Pollinations is not connected. Add POLLINATIONS_API_KEY in Render." });
  }
  try {
    const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.POLLINATIONS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai",
        messages: [
          { role: "system", content: "You are StoryForge's story engine. Create original, family-safe stories for animation. Never imitate existing franchises or living artists. Return ONLY valid JSON with keys title, logline, world, characters, episodes, scenes. characters: name, role, personality, appearance, goal. episodes: 5 objects with number, title, summary. scenes: 5 objects with shot, camera, action, audio. Make the world visually distinctive and recurring characters easy to recognize." },
          { role: "user", content: "Story idea: " + idea + "\nCreate a production-ready original story bible and starter storyboard." }
        ],
        temperature: 0.9
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || data.error || "Story model failed.");
    const raw = data.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/^\`\`\`json\s*/i, "").replace(/^\`\`\`\s*/i, "").replace(/\s*\`\`\`$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.title || !Array.isArray(parsed.characters) || !Array.isArray(parsed.episodes) || !Array.isArray(parsed.scenes)) {
      throw new Error("Incomplete story response.");
    }
    res.json({ ...parsed, idea, generatedBy: "AI", aiConnected: true });
  } catch (error) {
    console.error("StoryForge AI generation failed:", error.message);
    res.json({ ...buildStory(idea), generatedBy: "template-fallback", aiConnected: true, generationWarning: "Pollinations is connected but the AI generation failed. Check the Pollinations response or Render logs." });
  }
});

app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>StoryForge | Create worlds. Tell stories.</title>
<style>
:root{--bg:#090909;--panel:#111;--line:#282828;--text:#f5f5f5;--muted:#8d8d8d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}button,input,select,textarea{font:inherit}button{cursor:pointer}
.app{min-height:100vh;display:grid;grid-template-columns:230px 1fr}.sidebar{border-right:1px solid var(--line);padding:24px 16px;background:#0c0c0c;display:flex;flex-direction:column}.logo{font-size:21px;font-weight:800;letter-spacing:-.7px;padding:4px 10px 30px}.logo span{color:#777}.nav{display:grid;gap:5px}.nav button{border:0;background:transparent;color:#999;text-align:left;padding:11px 12px;border-radius:9px}.nav button.active,.nav button:hover{background:#1a1a1a;color:#fff}.side-bottom{margin-top:auto;color:#666;font-size:12px;padding:12px}
.main{padding:30px 34px 70px;max-width:1250px;width:100%;margin:auto}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px}.eyebrow{color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1.6px}.top h1{font-size:32px;letter-spacing:-1.3px;margin:6px 0 0}.new{background:#fff;color:#000;border:0;border-radius:9px;padding:11px 17px;font-weight:700}
.hero{border:1px solid var(--line);border-radius:16px;background:linear-gradient(135deg,#171717,#0e0e0e);padding:30px;margin-bottom:28px}.hero h2{font-size:28px;margin:0 0 8px;letter-spacing:-1px}.hero p{color:#999;margin:0 0 22px}.prompt{display:flex;gap:10px}.prompt input{flex:1;background:#090909;border:1px solid #303030;color:#fff;border-radius:9px;padding:14px 15px;outline:none}.tool-input{width:100%;margin-top:8px;background:#090909;border:1px solid #303030;color:#fff;border-radius:8px;padding:11px;outline:none}.tool-action{margin-top:14px;padding:12px 18px}.generate{background:#fff;color:#000;border:0;border-radius:9px;padding:0 19px;font-weight:750}.generate:disabled{opacity:.55;cursor:wait}
.section-head{display:flex;justify-content:space-between;align-items:center;margin:28px 0 14px}.section-head h3{font-size:15px;margin:0}.section-head span{font-size:12px;color:#666}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{border:1px solid var(--line);background:var(--panel);border-radius:13px;padding:18px;min-height:135px}.card.clickable{cursor:pointer}.card.clickable:hover{border-color:#444;background:#151515}.icon{width:34px;height:34px;border-radius:8px;background:#202020;display:grid;place-items:center;margin-bottom:14px}.card h4{margin:0 0 6px;font-size:15px}.card p{margin:0;color:#777;font-size:13px;line-height:1.5}
.results{display:none;border:1px solid var(--line);border-radius:16px;background:#0f0f0f;padding:24px;margin-top:28px}.results.show{display:block}.result-title{font-size:25px;margin:0 0 7px}.logline{color:#aaa;line-height:1.55;margin:0 0 22px}.result-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.result-box{border:1px solid var(--line);border-radius:12px;padding:18px;background:#131313}.result-box h4{margin:0 0 9px;font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#888}.result-box p{margin:0;color:#bbb;line-height:1.55;font-size:13px}.episode{padding:11px 0;border-top:1px solid #252525}.episode:first-child{border-top:0;padding-top:0}.episode strong{font-size:13px}.episode span{display:block;color:#777;font-size:12px;line-height:1.45;margin-top:3px}.shots{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.shot{background:#191919;border-radius:9px;padding:12px}.shot b{font-size:11px;color:#777}.shot div{font-size:12px;margin-top:6px;line-height:1.4;color:#bbb}
@keyframes referenceSpin{to{transform:rotate(360deg)}}.reference-spinner{width:27px;height:27px;flex:0 0 27px;border:3px solid #3a3a3a;border-top-color:#fff;border-radius:50%;animation:referenceSpin .8s linear infinite}.asset-prompt{white-space:pre-wrap;background:#0a0a0a;border:1px solid #292929;border-radius:9px;padding:14px;color:#bbb;font-size:12px;line-height:1.55}.copy-btn{margin-top:10px;border:1px solid #333;background:#1b1b1b;color:#fff;border-radius:8px;padding:8px 11px;font-size:12px}
.projects{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.how-it-works{margin-top:42px;padding-top:4px}.how-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.how-grid>div{border:1px solid var(--line);background:#101010;border-radius:10px;padding:14px}.how-grid b{display:block;font-size:12px;margin-bottom:7px}.how-grid span{display:block;color:#777;font-size:12px;line-height:1.45}.project-top{display:flex;justify-content:space-between;align-items:center;gap:18px;margin:0 0 22px}.project-top h1{font-size:29px;letter-spacing:-1px;margin:6px 0}.project-top p{margin:0;color:#888;font-size:13px}.workspace-actions{display:flex;gap:8px;align-items:center}.project .project-actions{display:flex;align-items:center;gap:8px}.project .project-open{border:1px solid #383838;background:#1b1b1b;color:#fff;border-radius:8px;padding:7px 10px;font-size:12px}.project .project-delete{border:1px solid #733b3b;background:#211414;color:#ffb5b5;border-radius:8px;padding:7px 10px;font-size:12px}.project{border:1px solid var(--line);border-radius:13px;padding:20px;background:var(--panel);display:flex;justify-content:space-between;align-items:center}.project strong{font-size:15px}.project small{display:block;color:#666;margin-top:5px}.status{font-size:11px;border:1px solid #333;border-radius:99px;padding:5px 9px;color:#999}.toast{position:fixed;right:22px;bottom:22px;background:#fff;color:#000;padding:12px 16px;border-radius:9px;font-size:13px;font-weight:650;display:none}
@media(max-width:800px){.app{grid-template-columns:1fr}.sidebar{display:none}.main{padding:22px 18px}.cards,.projects,.result-grid,.shots,.how-grid{grid-template-columns:1fr}.prompt{flex-direction:column}.generate{padding:13px}.top h1{font-size:27px}.project-top{align-items:flex-start;flex-direction:column}.workspace-actions{width:100%;flex-wrap:wrap}}
</style>
</head>
<body><div class="app">
<aside class="sidebar"><div class="logo">StoryForge <span>AI</span></div><nav class="nav" id="mainNavigation">
<button id="navDashboard" class="active" onclick="showDashboard()">⌂ &nbsp; Dashboard</button><button id="navProjects" onclick="showProjects()">▣ &nbsp; Your Projects</button>
<div id="projectNavigation" style="display:none;margin-top:18px"><div class="eyebrow" style="padding:8px 12px">Current project</div>
<button onclick="showTool('world')">◈ &nbsp; World Builder</button><button onclick="showTool('character')">● &nbsp; Characters</button><button onclick="showTool('scene')">✦ &nbsp; Story Engine</button><button onclick="showTool('asset')">◇ &nbsp; Asset Studio</button><button onclick="showTool('storyboard')">▤ &nbsp; Storyboard</button><button onclick="showTool('video')">▶ &nbsp; Video Forge</button></div>
</nav><div class="side-bottom">Create once. Build a universe.</div></aside>
<main class="main">
<div id="dashboardView"><div class="top"><div><div class="eyebrow">Creator workspace</div><h1>Bring a story to life.</h1></div><button class="new" onclick="focusPrompt()">+ New story</button></div>
<section class="hero"><h2>What are we creating?</h2><p>Start with an idea. StoryForge turns the premise into a structured story world.</p><div class="prompt"><input id="idea" placeholder="A young explorer discovers an island that appears once every hundred years..." /><button id="generate" class="generate" onclick="createStory()">Create story →</button></div></section>

<div class="section-head"><h3>Your projects</h3><span id="projectCount">Saved locally in this browser</span></div><section id="projects" class="projects"></section>
</div><section id="projectWorkspace" style="display:none"><div class="project-top"><div><div class="eyebrow">Project workspace</div><h1 id="workspaceProjectTitle">Your project</h1><p id="workspaceProjectDescription">Everything for this story, in one place.</p></div><div class="workspace-actions"><button class="copy-btn" onclick="showDashboard()">← Dashboard</button><button class="new" onclick="focusPrompt()">+ New project</button></div></div><section id="toolPanel" class="results" style="margin-top:0;margin-bottom:28px">
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
    <button class="generate tool-action" onclick="buildCharacter()">Forge character →</button><button id="characterReferenceButton" class="copy-btn" onclick="generateCharacterReference()" style="display:none">Generate 3-view reference sheet →</button><p style="color:#777;font-size:11px;margin:8px 0 0">One image, exactly three views: full-body front, full-body side profile and face close-up. No text or labels.</p><div id="characterLibrary" style="margin-top:18px"></div>
  </div>
  <div id="storyboardForm" style="display:none">
    <div class="result-grid">
      <div class="result-box"><h4>Story title</h4><input id="boardTitle" class="tool-input" placeholder="The Island That Appears Once a Century"></div>
      <div class="result-box"><h4>Episode</h4><input id="boardEpisode" class="tool-input" type="number" min="1" value="1"></div>
      <div class="result-box"><h4>Episode title</h4><input id="boardEpisodeTitle" class="tool-input" placeholder="The Discovery"></div>
      <div class="result-box"><h4>Scene premise</h4><textarea id="boardPremise" class="tool-input" rows="3" placeholder="The heroes discover a glowing compass hidden beneath an ancient tree."></textarea></div>
    </div>
    <button class="generate tool-action" onclick="buildStoryboard()">Forge storyboard →</button>
  </div>
  <div id="sceneForm" style="display:none"><div class="result-grid"><div class="result-box"><h4>Scene premise</h4><textarea id="scenePremise" class="tool-input" rows="4" placeholder="The heroes discover a strange signal beneath the old lighthouse."></textarea></div><div class="result-box"><h4>World context</h4><textarea id="sceneWorld" class="tool-input" rows="4" placeholder="World details"></textarea></div><div class="result-box" style="grid-column:1/-1"><h4>Characters</h4><textarea id="sceneCharacters" class="tool-input" rows="3" placeholder="Character names, roles and personalities"></textarea></div></div><button class="generate tool-action" onclick="generateScene()">Generate full scene →</button></div><div id="videoForm" style="display:none">
    <div class="result-grid">
      <div class="result-box"><h4>Video title</h4><input id="videoTitle" class="tool-input" placeholder="The Island That Appears Once a Century"></div>
      <div class="result-box"><h4>Format</h4><select id="videoFormat" class="tool-input"><option>YouTube Short</option><option>TikTok / Reels</option><option>Landscape episode</option></select></div>
      <div class="result-box"><h4>Storyboard shots</h4><input id="videoShots" class="tool-input" type="number" min="1" max="30" value="8"></div>
      <div class="result-box"><h4>Total duration (seconds)</h4><input id="videoDuration" class="tool-input" type="number" min="1" max="60" value="29"></div>
      <div class="result-box"><h4>Captions</h4><select id="videoCaptions" class="tool-input"><option value="yes">Yes</option><option value="no">No</option></select></div>
    </div>
    <button class="generate tool-action" onclick="buildVideoPlan()">Prepare Video →</button><button id="videoGenerateButton" class="copy-btn" onclick="generateVideo()">Render Video →</button>
  </div>
  <div id="assetForm" style="display:none">
    <div class="result-grid">
      <div class="result-box"><h4>Asset type</h4><select id="assetType" class="tool-input"><option>character</option><option>environment</option><option>prop</option><option>scene</option></select></div>
      <div class="result-box"><h4>Visual style</h4><input id="assetStyle" class="tool-input" placeholder="Cinematic 3D animation"></div>
      <div class="result-box"><h4>Subject</h4><textarea id="assetSubject" class="tool-input" rows="3" placeholder="A young explorer with a distinctive backpack and glowing compass"></textarea></div>
      <div class="result-box"><h4>Mood</h4><input id="assetMood" class="tool-input" placeholder="Warm, curious, adventurous"></div>
      <div class="result-box" style="grid-column:1/-1"><h4>Continuity notes</h4><textarea id="assetNotes" class="tool-input" rows="3" placeholder="Keep the same face, outfit, proportions and signature accessory in every future scene."></textarea></div>
    </div>
    <button class="generate tool-action" onclick="buildAsset()">Build asset brief →</button><button id="generateImageButton" class="copy-btn" style="display:none" onclick="generateImage()">Generate image →</button>
  </div>
  <div id="toolOutput" class="result-box" style="display:none;margin-top:14px"></div>
</section>
<section id="results" class="results"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><h2 id="resultTitle" class="result-title"></h2><p id="logline" class="logline"></p></div><button id="saveProjectButton" class="new" type="button" onclick="saveProject()">Save project</button></div><div class="result-grid">
<div class="result-box"><h4>World</h4><p id="world"></p></div><div class="result-box"><h4>Characters</h4><div id="characters"></div></div>
<div class="result-box"><h4>Episode arc</h4><div id="episodes"></div></div><div class="result-box"><h4>Storyboard starter</h4><div id="shots" class="shots"></div></div>
</div></section></section>section class="how-it-works"><div class="section-head"><h3>What StoryForge helps you do</h3><span>One connected production workflow</span></div><div class="how-grid"><div><b>01 · Story</b><span>Shape your idea into a story.</span></div><div><b>02 · World & characters</b><span>Build a consistent universe.</span></div><div><b>03 · Scenes & assets</b><span>Prepare the pieces of each scene.</span></div><div><b>04 · Storyboard</b><span>Plan shots and visual continuity.</span></div><div><b>05 · Video</b><span>Generate clips and assemble your production.</span></div></div></section>
</main></div><div class="toast" id="toast"></div>
<script>
/* Explicit element bindings: never rely on browser-created globals for element IDs. */
const worldName = document.getElementById("worldName");
const worldTone = document.getElementById("worldTone");
const worldPremise = document.getElementById("worldPremise");
const worldSetting = document.getElementById("worldSetting");
const charName = document.getElementById("charName");
const charRole = document.getElementById("charRole");
const charPersonality = document.getElementById("charPersonality");
const charAppearance = document.getElementById("charAppearance");
const charGoal = document.getElementById("charGoal");
const boardTitle = document.getElementById("boardTitle");
const boardEpisode = document.getElementById("boardEpisode");
const boardEpisodeTitle = document.getElementById("boardEpisodeTitle");
const boardPremise = document.getElementById("boardPremise");
const videoTitle = document.getElementById("videoTitle");
const videoFormat = document.getElementById("videoFormat");
const videoShots = document.getElementById("videoShots");
const videoDuration = document.getElementById("videoDuration");
const videoCaptions = document.getElementById("videoCaptions");
const assetType = document.getElementById("assetType");
const assetStyle = document.getElementById("assetStyle");
const assetSubject = document.getElementById("assetSubject");
const assetMood = document.getElementById("assetMood");
const assetNotes = document.getElementById("assetNotes");
const toolOutput = document.getElementById("toolOutput");
let currentStory=null;
let activeProjectId=null;
 function readProjects(){try{const v=JSON.parse(localStorage.getItem("storyforge-projects")||"[]");return Array.isArray(v)?v:[]}catch(e){return []}}
 function readStored(key,fallback){try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch(e){return fallback}}
 function persistActiveProjectState(){if(activeProjectId===null)return;const a=readProjects(),i=a.findIndex(p=>Number(p.id)===Number(activeProjectId));if(i<0)return;a[i].workspace={productionBible:readStored("storyforge-production-bible",{}),productionState:readStored("storyforge-production-state",{}),storyBible:readStored("storyforge-story-bible",{world:null,characters:[]})};try{localStorage.setItem("storyforge-projects",JSON.stringify(a))}catch(e){}}
 function restoreProjectState(p){const old=readStored("storyforge-production-bible",{}),legacy=!p.workspace&&String(old.title||"").toLowerCase()===String(p.title||"").toLowerCase();if(p.workspace){localStorage.setItem("storyforge-production-bible",JSON.stringify(p.workspace.productionBible||{}));localStorage.setItem("storyforge-production-state",JSON.stringify(p.workspace.productionState||{}));localStorage.setItem("storyforge-story-bible",JSON.stringify(p.workspace.storyBible||{world:null,characters:[]}));}else if(!legacy){localStorage.setItem("storyforge-production-bible","{}");localStorage.setItem("storyforge-production-state","{}");localStorage.setItem("storyforge-story-bible",'{"world":null,"characters":[]}');window.storyforgeScene=null;window.storyforgeWorldBible=p.data?.world||"";window.storyforgeCharacterBible="";}const b=readStored("storyforge-story-bible",{world:null,characters:[]});window.storyforgeWorldBible=window.storyforgeWorldBible||b.world||p.data?.world||"";window.storyforgeCharacterBible=window.storyforgeCharacterBible||((b.characters||[]).map(c=>[c.name,c.role].join(" | ")).join("; "))}
 function showDashboard(){persistActiveProjectState();activeProjectId=null;document.getElementById("dashboardView").style.display="block";document.getElementById("projectWorkspace").style.display="none";document.getElementById("navDashboard").classList.add("active");document.getElementById("navProjects").classList.remove("active");document.getElementById("projectNavigation").style.display="none";document.getElementById("toolPanel").classList.remove("show");window.scrollTo({top:0,behavior:"smooth"})}
 function showProjects(){showDashboard();document.getElementById("navDashboard").classList.remove("active");document.getElementById("navProjects").classList.add("active");document.getElementById("projects").scrollIntoView({behavior:"smooth",block:"start"})}
 function showSavedStories(){showProjects()}
 function focusPrompt(){persistActiveProjectState();activeProjectId=null;localStorage.setItem("storyforge-production-bible","{}");localStorage.setItem("storyforge-production-state","{}");localStorage.setItem("storyforge-story-bible",'{"world":null,"characters":[]}');window.storyforgeScene=null;window.storyforgeWorldBible="";window.storyforgeCharacterBible="";showDashboard();const el=document.getElementById("idea");if(el){el.value="";el.focus()}}
 function saveProject(){if(!currentStory){toast("Create a story before saving.");return}const a=readProjects();let p=activeProjectId===null?null:a.find(x=>Number(x.id)===Number(activeProjectId));if(!p)p=a.find(x=>String(x.title||"")===String(currentStory.title||"")&&String(x.idea||"")===String(currentStory.idea||""));const id=p?p.id:Date.now(),next={...(p||{}),id,title:currentStory.title||"Untitled story",idea:currentStory.idea||"",data:currentStory.data||{},updatedAt:new Date().toISOString()};try{localStorage.setItem("storyforge-projects",JSON.stringify([next,...a.filter(x=>Number(x.id)!==Number(id))].slice(0,20)))}catch(e){toast("Could not save locally. Browser storage may be full.");return}activeProjectId=id;renderProjects();openProjectWorkspace(id);toast(p?"Project updated.":"Project created.")}
 function renderProjects(){const a=readProjects(),count=document.getElementById("projectCount"),list=document.getElementById("projects");count.textContent=a.length+" project"+(a.length===1?"":"s")+" saved on this device";list.innerHTML=a.length?a.map(p=>"<div class='project'><div><strong>"+escapeHtml(p.title||"Untitled story")+"</strong><small>"+escapeHtml(p.idea||"")+"</small><small>Updated "+escapeHtml(p.updatedAt?new Date(p.updatedAt).toLocaleDateString():"Saved project")+"</small></div><div class='project-actions'><button type='button' class='project-open' onclick='loadProject("+Number(p.id)+")'>Open project →</button><button type='button' class='project-delete' onclick='deleteProject("+Number(p.id)+")'>Delete</button></div></div>").join(""):"<div class='project'><div><strong>No projects yet</strong><small>Create your first story above. It will appear here.</small></div></div>"}
 function deleteProject(id){const a=readProjects(),p=a.find(x=>Number(x.id)===Number(id));if(!p){toast("Project not found.");return}if(!confirm("Delete \""+String(p.title||"Untitled story").replace(/[\"\\]/g,"")+" \"? This cannot be undone."))return;localStorage.setItem("storyforge-projects",JSON.stringify(a.filter(x=>Number(x.id)!==Number(id))));if(Number(activeProjectId)===Number(id)){activeProjectId=null;showDashboard()}renderProjects();toast("Project deleted.")}
 function loadProject(id){const p=readProjects().find(x=>Number(x.id)===Number(id));if(p)openProjectWorkspace(p.id)}
 function openProjectWorkspace(id){persistActiveProjectState();const p=readProjects().find(x=>Number(x.id)===Number(id));if(!p){toast("Project not found.");return}restoreProjectState(p);activeProjectId=p.id;renderStory(p.data||{title:p.title,characters:[],episodes:[],scenes:[]},p.idea||"");document.getElementById("workspaceProjectTitle").textContent=p.title||"Untitled project";document.getElementById("workspaceProjectDescription").textContent="Your world, characters, scenes, storyboard and video for this project.";document.getElementById("dashboardView").style.display="none";document.getElementById("projectWorkspace").style.display="block";document.getElementById("projectNavigation").style.display="block";document.getElementById("navDashboard").classList.remove("active");document.getElementById("navProjects").classList.remove("active");document.getElementById("toolPanel").classList.remove("show");if(window.storyforgePipeline?.syncContext)window.storyforgePipeline.syncContext();if(window.renderCharacterLibrary)window.renderCharacterLibrary();renderProjects();window.scrollTo({top:0,behavior:"smooth"})}
 function renderStory(data,idea){currentStory={title:data.title||"Untitled story",idea:idea||"",data};document.getElementById("resultTitle").textContent=data.title||"Untitled story";document.getElementById("logline").textContent=data.logline||"";document.getElementById("world").textContent=typeof data.world==="string"?data.world:JSON.stringify(data.world||"");document.getElementById("characters").innerHTML=(data.characters||[]).map(c=>"<div class='episode'><strong>"+escapeHtml(c.name||"Character")+"</strong><span>"+escapeHtml(c.role||"")+"</span></div>").join("");document.getElementById("episodes").innerHTML=(data.episodes||[]).map(e=>"<div class='episode'><strong>"+escapeHtml(e.number||"")+". "+escapeHtml(e.title||"Episode")+"</strong><span>"+escapeHtml(e.summary||"")+"</span></div>").join("");document.getElementById("shots").innerHTML=(data.scenes||[]).map(x=>"<div class='shot'><b>SHOT "+escapeHtml(x.shot||"")+"</b><div>"+escapeHtml(x.camera||"")+"</div><div>"+escapeHtml(x.action||"")+"</div></div>").join("");document.getElementById("results").classList.add("show")}
 function initWorkspace(){renderProjects()}
 function showTool(tool){if(tool==="dashboard"){showDashboard();return}if(!["world","character","asset","scene","storyboard","video"].includes(tool)){toast("That workspace does not exist.");return}if(activeProjectId===null){toast("Open a project first. These tools use that project's saved information.");showProjects();return}if(tool==="video"){const b=readStored("storyforge-production-bible",{}),st=readStored("storyforge-production-state",{}),sb=readStored("storyforge-story-bible",{world:null,characters:[]});const checks=[{ok:!!(b.title||currentStory?.title),label:"Story",tool:null},{ok:!!(b.world||sb.world||window.storyforgeWorldBible),label:"World",tool:"world"},{ok:!!((sb.characters||[]).length||window.storyforgeCharacterBible),label:"Characters",tool:"character"},{ok:!!(b.scene||st.scene||window.storyforgeScene),label:"Scene",tool:"scene"},{ok:!!((st.shots||[]).length||(b.storyboard?.shots||[]).length),label:"Storyboard",tool:"storyboard"}];const m=checks.find(x=>!x.ok);if(m){toast("Video Forge is locked. Complete "+m.label+" first.");if(m.tool)showTool(m.tool);else showDashboard();return}}document.getElementById("dashboardView").style.display="none";document.getElementById("projectWorkspace").style.display="block";const panel=document.getElementById("toolPanel"),world=document.getElementById("worldForm"),character=document.getElementById("characterForm"),asset=document.getElementById("assetForm"),storyboard=document.getElementById("storyboardForm"),video=document.getElementById("videoForm"),scene=document.getElementById("sceneForm"),output=document.getElementById("toolOutput");panel.classList.add("show");output.style.display="none";world.style.display=tool==="world"?"block":"none";character.style.display=tool==="character"?"block":"none";asset.style.display=tool==="asset"?"block":"none";storyboard.style.display=tool==="storyboard"?"block":"none";video.style.display=tool==="video"?"block":"none";scene.style.display=tool==="scene"?"block":"none";document.getElementById("toolTitle").textContent=tool==="world"?"World Builder":tool==="character"?"Character Forge":tool==="asset"?"Asset Studio":tool==="scene"?"Story Engine":tool==="storyboard"?"Storyboard Studio":"Video Forge";document.getElementById("toolHint").textContent=tool==="world"?"Shape the rules of your universe":tool==="character"?"Create a recurring character":tool==="asset"?"Prepare consistent visual assets":tool==="scene"?"Write action, dialogue and story beats":tool==="storyboard"?"Turn a scene into production-ready shots":"Generate and review video from your saved storyboard";panel.scrollIntoView({behavior:"smooth",block:"start"})}
 async function generateScene(){
 const premise=document.getElementById("scenePremise").value.trim();
 if(!premise){toast("Give us a scene premise first.");return}
 const response=await fetch("/api/scene",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({premise,world:document.getElementById("sceneWorld").value||window.storyforgeWorldBible||"",characters:document.getElementById("sceneCharacters").value||window.storyforgeCharacterBible||""})});
 const data=await response.json();
 if(!response.ok){toast(data.error||"Scene generation failed.");return}
 const output=document.getElementById("toolOutput"); output.style.display="block";
 output.innerHTML="<h3>"+data.title+"</h3><p><strong>Location:</strong> "+data.location+"</p><p>"+data.action+"</p><h4>Dialogue</h4>"+data.dialogue.map(d=>"<div class='episode'><strong>"+d.character+"</strong><span>"+d.line+"</span></div>").join("")+"<h4>Beats</h4><p>"+data.beats.map((b,i)=>(i+1)+". "+b).join("<br>")+"</p>";
 window.storyforgeScene=data; toast("Scene generated.");
}
async function buildWorld(){
 const payload={name:worldName.value,premise:worldPremise.value,tone:worldTone.value,setting:worldSetting.value};
 const response=await fetch("/api/world",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const data=await response.json(); if(!response.ok){toast(data.error||"World failed");return}
 window.storyforgeWorldBible = [data.name, data.premise, data.tone, data.setting, data.visualIdentity, "RULES: "+data.rules.join("; ")].join(" | "); toolOutput.style.display="block"; toolOutput.innerHTML="<h4>World forged</h4><p><strong>"+data.name+"</strong><br>"+data.visualIdentity+"</p><p>"+data.rules.join("<br>")+"</p><p style='color:#666;font-size:11px'>Continuity lock saved for Storyboard Studio.</p>"; toast("World forged successfully.");
}
function getStoryBible(){try{return JSON.parse(localStorage.getItem("storyforge-story-bible")||'{"world":null,"characters":[]}')}catch(e){return {world:null,characters:[]}}}
function saveStoryBible(bible){try{localStorage.setItem("storyforge-story-bible",JSON.stringify(bible))}catch(e){}}
function characterId(name){return String(name||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||String(Date.now())}
function escapeHtml(value){return String(value||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c))}
function migrateLegacyCharacter(){
 const bible=getStoryBible();
 if(Array.isArray(bible.characters)&&bible.characters.length)return false;
 let legacyData=window.storyforgeCharacterData||null;
 const legacyReference=localStorage.getItem("storyforge-character-reference")||"";
 const fields={
  name:typeof charName!=="undefined"?charName.value.trim():"",
  role:typeof charRole!=="undefined"?charRole.value.trim():"",
  personality:typeof charPersonality!=="undefined"?charPersonality.value.trim():"",
  appearance:typeof charAppearance!=="undefined"?charAppearance.value.trim():"",
  goal:typeof charGoal!=="undefined"?charGoal.value.trim():""
 };
 if(!legacyData&&window.storyforgeCharacterBible){
  const parts=String(window.storyforgeCharacterBible).split(" | ");
  legacyData={name:fields.name||parts[0]||"Recovered Character",role:fields.role||parts[1]||"character",personality:fields.personality||parts[2]||"curious and determined",appearance:fields.appearance||parts[3]||"distinctive recurring character design",goal:fields.goal||(parts.find(x=>x.indexOf("GOAL: ")===0)||"").replace(/^GOAL:\s*/,"")||"discover the truth",strength:(parts.find(x=>x.indexOf("STRENGTH: ")===0)||"").replace(/^STRENGTH:\s*/,"")||"Sees possibilities where others see obstacles.",flaw:(parts.find(x=>x.indexOf("FLAW: ")===0)||"").replace(/^FLAW:\s*/,"")||"Sometimes acts before understanding the consequences.",arc:(parts.find(x=>x.indexOf("ARC: ")===0)||"").replace(/^ARC:\s*/,"")||"Learns when to trust others."};
 }
 if(!legacyData&&!legacyReference)return false;
 const data=legacyData||{};
 const name=(data.name||fields.name||"Recovered Character").trim();
 const recovered={id:characterId(name),name,role:(data.role||fields.role||"character").trim(),personality:(data.personality||fields.personality||"curious and determined").trim(),appearance:(data.appearance||fields.appearance||"distinctive recurring character design").trim(),goal:(data.goal||fields.goal||"discover the truth").trim(),strength:data.strength||"Sees possibilities where others see obstacles.",flaw:data.flaw||"Sometimes acts before understanding the consequences.",arc:data.arc||"Learns when to trust others.",updatedAt:new Date().toISOString(),...(data.referenceImage?{referenceImage:data.referenceImage}:legacyReference?{referenceImage:legacyReference}:{}),migratedFromLegacy:true};
 bible.characters=[recovered];
 saveStoryBible(bible);
 window.storyforgeCharacterId=recovered.id;
 window.storyforgeCharacterData=recovered;
 window.storyforgeCharacterBible=[recovered.name,recovered.role,recovered.personality,recovered.appearance,"GOAL: "+recovered.goal,"STRENGTH: "+recovered.strength,"FLAW: "+recovered.flaw,"ARC: "+recovered.arc].join(" | ");
 window.storyforgeCharacterReferenceImage=recovered.referenceImage||"";
 return true;
}
function renderCharacterLibrary(){const el=document.getElementById("characterLibrary");if(!el)return;const bible=getStoryBible(),chars=Array.isArray(bible.characters)?bible.characters:[];el.replaceChildren();const heading=document.createElement("h4");heading.textContent="Character Bible";el.appendChild(heading);if(!chars.length){const p=document.createElement("p");p.textContent="Forged characters will be saved here and remain available for future stories.";el.appendChild(p);return}chars.forEach(ch=>{const row=document.createElement("div");row.className="shot";const name=document.createElement("strong");name.textContent=ch.name||"Unnamed character";const role=document.createElement("p");role.textContent=ch.role||"";const load=document.createElement("button");load.className="copy-btn";load.textContent="Load";load.addEventListener("click",()=>loadCharacter(ch.id));row.append(name,role,load);el.appendChild(row)})}
function loadCharacter(id){const bible=getStoryBible(),ch=(bible.characters||[]).find(x=>x.id===id);if(!ch){toast("Character not found.");return}charName.value=ch.name||"";charRole.value=ch.role||"";charPersonality.value=ch.personality||"";charAppearance.value=ch.appearance||"";charGoal.value=ch.goal||"";window.storyforgeCharacterId=ch.id;window.storyforgeCharacterData=ch;window.storyforgeCharacterBible=[ch.name,ch.role,ch.personality,ch.appearance,"GOAL: "+ch.goal,"STRENGTH: "+ch.strength,"FLAW: "+ch.flaw,"ARC: "+ch.arc].join(" | ");window.storyforgeCharacterReferenceImage=ch.referenceImage||"";toolOutput.style.display="block";toolOutput.innerHTML="<h4>Character loaded</h4><p><strong>"+escapeHtml(ch.name)+"</strong> · "+escapeHtml(ch.role)+"</p><p>"+escapeHtml(ch.personality)+"</p>"+(ch.referenceImage?"<img src='"+escapeHtml(ch.referenceImage)+"' style='width:100%;max-height:600px;object-fit:contain;background:#080808;border:1px solid #292929;border-radius:10px;margin-top:12px'>":"<p style='color:#888'>No reference sheet saved yet.</p>")+"<div style='display:flex;gap:8px;margin-top:10px'><button class='copy-btn' onclick='generateCharacterReference()'>Regenerate reference sheet →</button></div>";document.getElementById("characterReferenceButton").style.display="inline-block";toast(ch.name+" loaded.")}
async function generateCharacterReference(){const bible=window.storyforgeCharacterBible||"";if(!bible){toast("Forge or load the character first.");return}if(window.storyforgeReferenceGenerating)return;window.storyforgeReferenceGenerating=true;const button=document.getElementById("characterReferenceButton");const panel=document.getElementById("characterReferencePanel");const setBusy=busy=>{if(button){button.disabled=busy;button.textContent=busy?"Generating reference sheet…":"Regenerate 3-view reference sheet →"}document.querySelectorAll("#characterReferencePanel button").forEach(b=>{b.disabled=busy;if(busy)b.dataset.previousText=b.textContent;else if(b.dataset.previousText){b.textContent=b.dataset.previousText;delete b.dataset.previousText}})};setBusy(true);toolOutput.style.display="block";let loading=document.getElementById("characterReferenceLoading");if(!loading){loading=document.createElement("div");loading.id="characterReferenceLoading";loading.style.cssText="display:flex;align-items:center;gap:14px;margin-top:18px;padding:18px;border:1px solid #343434;border-radius:12px;background:#151515;color:#eee";loading.innerHTML="<div class='reference-spinner' aria-hidden='true'></div><div><strong style='display:block;font-size:13px'>Forging your character reference…</strong><span style='display:block;color:#999;font-size:12px;margin-top:5px'>Creating the front view, side profile and close-up. This can take a little while. Please wait.</span></div>";const anchor=document.getElementById("characterReferencePanel");if(anchor)anchor.insertAdjacentElement("afterend",loading);else toolOutput.appendChild(loading)}try{const prompt="Create ONE clean character design reference sheet for an original recurring animated character. CHARACTER BIBLE: "+bible+". The image must contain EXACTLY THREE views of the SAME character, arranged horizontally side by side with clear spacing: (1) full-body FRONT VIEW, standing upright and facing directly toward camera; (2) full-body TRUE SIDE PROFILE, exactly 90 degrees, showing the same outfit and silhouette; (3) CLOSE-UP head-and-shoulders portrait showing the face, hairstyle, skin texture and defining expression. Keep identity, face, body proportions, clothing, colours and accessories perfectly consistent across all three views. Plain unobtrusive neutral background. Original painterly cinematic STYLIZED ANIMATION with expressive hand-designed character shapes, hand-painted textures, graphic shadows and dramatic illustrated lighting, suited to an original retro-futuristic South African sci-fi series. STRICTLY STYLIZED ANIMATION, NOT photorealistic, NOT hyperrealistic, NOT live-action, NOT photographic. NO WORDS OR TEXT OF ANY KIND, NO LABELS, NO LETTERS, NO NUMBERS, NO TYPOGRAPHY, NO LOGOS, NO CAPTIONS, NO WATERMARKS, no extra views, no extra characters, no panels containing writing. This is a production continuity reference, not a poster.";const response=await fetch("/api/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,size:"1024x1024"})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Reference generation failed.");window.storyforgeCharacterReferencePreview=data.url;const referenceHtml="<div id='characterReferencePanel' style='margin-top:18px'><h4>Reference sheet preview</h4><img src='"+escapeHtml(data.url)+"' style='width:100%;max-height:600px;object-fit:contain;background:#080808;border:1px solid #292929;border-radius:10px'><div style='display:flex;gap:8px;align-items:center;margin-top:10px'><button class='copy-btn' onclick='generateCharacterReference()'>Regenerate 3-view sheet →</button><button class='copy-btn' onclick='saveCharacterReference()'>Save this reference</button></div><p style='color:#666;font-size:11px'>Preview only. Regenerate until you like it, then save it to this character's Story Bible.</p></div>";const existing=document.getElementById("characterReferencePanel");if(existing)existing.outerHTML=referenceHtml;else toolOutput.appendChild(document.createRange().createContextualFragment(referenceHtml));toast("Reference preview generated. Save it if you like it.");}catch(error){toast(error.message)}finally{const currentLoading=document.getElementById("characterReferenceLoading");if(currentLoading)currentLoading.remove();window.storyforgeReferenceGenerating=false;setBusy(false)}}
function saveCharacterReference(){const url=window.storyforgeCharacterReferencePreview||"",id=window.storyforgeCharacterId||"";if(!url||!id){toast("Generate a reference and forge or load a character first.");return}const bible=getStoryBible(),chars=Array.isArray(bible.characters)?bible.characters:[],index=chars.findIndex(ch=>ch.id===id);if(index<0){toast("Character not found in the Story Bible.");return}chars[index].referenceImage=url;chars[index].referenceSavedAt=new Date().toISOString();bible.characters=chars;saveStoryBible(bible);window.storyforgeCharacterReferenceImage=url;window.storyforgeCharacterReferencePreview="";renderCharacterLibrary();const panel=document.getElementById("characterReferencePanel");if(panel)panel.outerHTML="<div id='characterReferencePanel' style='margin-top:18px'><h4>Saved character reference</h4><img src='"+escapeHtml(url)+"' style='width:100%;max-height:600px;object-fit:contain;background:#080808;border:1px solid #292929;border-radius:10px'><div style='display:flex;gap:8px;align-items:center;margin-top:10px'><button class='copy-btn' onclick='generateCharacterReference()'>Regenerate →</button><span style='color:#666;font-size:11px'>Saved to "+escapeHtml(chars[index].name)+"</span></div></div>";toast("Reference saved to "+chars[index].name+".")}
function removeCharacterReference(){window.storyforgeCharacterReferenceImage="";window.storyforgeCharacterReferencePreview="";const panel=document.getElementById("characterReferencePanel");if(panel)panel.remove();toast("Reference preview removed.")}
async function buildCharacter(){const payload={name:charName.value,role:charRole.value,personality:charPersonality.value,appearance:charAppearance.value,goal:charGoal.value};const response=await fetch("/api/character",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok){toast(data.error||"Character failed");return}const bible=getStoryBible(),chars=Array.isArray(bible.characters)?bible.characters:[],id=characterId(data.name),existing=chars.find(ch=>ch.id===id),character={...(existing||{}),id,name:data.name,role:data.role,personality:data.personality,appearance:data.appearance,goal:data.goal,strength:data.strength,flaw:data.flaw,arc:data.arc,updatedAt:new Date().toISOString()};if(existing?.referenceImage)character.referenceImage=existing.referenceImage;bible.characters=[...chars.filter(ch=>ch.id!==id),character];saveStoryBible(bible);window.storyforgeCharacterId=id;window.storyforgeCharacterData=character;window.storyforgeCharacterBible=[data.name,data.role,data.personality,data.appearance,"GOAL: "+data.goal,"STRENGTH: "+data.strength,"FLAW: "+data.flaw,"ARC: "+data.arc].join(" | ");window.storyforgeCharacterReferenceImage=character.referenceImage||"";window.storyforgeCharacterReferencePreview="";toolOutput.style.display="block";toolOutput.innerHTML="<h4>Character forged and saved</h4><p><strong>"+escapeHtml(data.name)+"</strong> · "+escapeHtml(data.role)+"</p><p>"+escapeHtml(data.personality)+"</p><p><strong>Goal:</strong> "+escapeHtml(data.goal)+"</p><p><strong>Strength:</strong> "+escapeHtml(data.strength)+"<br><strong>Flaw:</strong> "+escapeHtml(data.flaw)+"</p><p>"+escapeHtml(data.arc)+"</p><p style='color:#777;font-size:11px'>Saved to the Story Bible. Generate a reference sheet, regenerate until you like it, then save the reference.</p>";document.getElementById("characterReferenceButton").style.display="inline-block";renderCharacterLibrary();toast(data.name+" saved to the Story Bible.")}
async function buildStoryboard(){
 const payload={title:boardTitle.value,episode:boardEpisode.value,episodeTitle:boardEpisodeTitle.value,premise:boardPremise.value,worldBible:window.storyforgeWorldBible||"",characterBible:window.storyforgeCharacterBible||""};
 const response=await fetch("/api/storyboard",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const data=await response.json(); if(!response.ok){toast(data.error||"Storyboard failed");return}
 toolOutput.style.display="block";
 toolOutput.innerHTML="<h4>Storyboard forged · "+data.episodeTitle+"</h4><p><strong>"+data.title+"</strong> · Episode "+data.episode+" · "+data.totalDuration+"</p><p style='color:#888'>"+data.continuity+"</p><div style='display:grid;gap:10px;margin-top:14px'>"+data.shots.map(s=>"<div class='shot' style='padding:16px'><b>SHOT "+String(s.number).padStart(2,"0")+" · "+s.shotType+" · "+s.duration+"</b><div><strong>Camera:</strong> "+s.camera+"</div><div><strong>Action:</strong> "+s.action+"</div><div><strong>Audio:</strong> "+s.audio+"</div><div><strong>Visual prompt:</strong> "+s.visualPrompt+"</div></div>").join("")+"</div>";
 toast("Storyboard forged: "+data.shots.length+" shots.");
}
async function buildVideoPlan(){
  const button=[...document.querySelectorAll("button")].find(b=>/prepare video/i.test(b.textContent||""));
  if(window.storyforgeBuildingEditPlan)return;
  window.storyforgeBuildingEditPlan=true;
  const originalText=button?button.textContent:"Prepare Video →";
  let overlay=document.getElementById("videoPlanLoadingOverlay");
  if(!overlay){
    overlay=document.createElement("div");overlay.id="videoPlanLoadingOverlay";
    overlay.style.cssText="position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.78);backdrop-filter:blur(5px)";
    overlay.innerHTML="<div role='status' aria-live='polite' style='width:min(420px,100%);padding:26px;border:1px solid #383838;border-radius:16px;background:#151515;color:#f5f5f5;text-align:center;box-shadow:0 20px 80px #0009'><div class='reference-spinner' style='margin:0 auto 18px;width:34px;height:34px'></div><h3 style='margin:0 0 9px;font-size:18px'>Building your edit plan…</h3><p style='margin:0;color:#aaa;font-size:13px;line-height:1.6'>StoryForge is organising your shots, format, timing, audio and captions. Keep this page open.</p><p id='videoPlanLoadingStatus' style='margin:14px 0 0;color:#777;font-size:11px'>Waiting for the edit-plan service…</p></div>";
    document.body.appendChild(overlay);
  }
  if(button){button.disabled=true;button.textContent="Building edit plan…";}
  const output=document.getElementById("toolOutput");
  if(output){output.style.display="block";output.innerHTML="<p style='color:#aaa'>Building your edit plan… this may take a moment.</p>";}
  try{
    const p=(()=>{try{return JSON.parse(localStorage.getItem("storyforge-production-bible")||"{}")}catch(_){return {}}})();
    const state=(()=>{try{return JSON.parse(localStorage.getItem("storyforge-production-state")||"{}")}catch(_){return {}}})();
    const savedShots=Array.isArray(state.shots)?state.shots:[];
    const shotInput=(typeof videoShots!=="undefined"&&videoShots?videoShots.value:"").trim();
    const payload={
      title:(typeof videoTitle!=="undefined"&&videoTitle?videoTitle.value:"").trim()||p.title||state.title||"THE QUEUE",
      format:typeof videoFormat!=="undefined"&&videoFormat?videoFormat.value:"short",
      shots:shotInput||String(savedShots.length||8),
      duration:typeof videoDuration!=="undefined"&&videoDuration?videoDuration.value:"30",
      captions:typeof videoCaptions!=="undefined"&&videoCaptions?videoCaptions.value==="yes":true,
      world:p.world||state.world||window.storyforgeWorldBible||"",
      characters:p.characters||state.characters||window.storyforgeCharacterBible||"",
      scene:p.scene||state.scene||window.storyforgeScene||{},
      storyboard:savedShots
    };
    const response=await fetch("/api/video-plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"The edit-plan service returned an error.");
    if(output){
      const steps=Array.isArray(data.renderPlan)?data.renderPlan:[];
      output.innerHTML="<h4>Video preparation ready</h4><p><strong>"+escapeHtml(data.title||payload.title)+"</strong> · "+escapeHtml(data.format||payload.format)+" · "+escapeHtml(data.aspectRatio||"")+" · "+escapeHtml(String(data.duration||payload.duration))+"s</p><p><strong>Audio:</strong> "+escapeHtml(data.audio||"Not specified")+"</p><p><strong>Captions:</strong> "+((data.captions??payload.captions)?"Enabled":"Disabled")+"</p><h4 style='margin-top:18px'>Render plan</h4><ol>"+steps.map(x=>"<li>"+escapeHtml(String(x))+"</li>").join("")+"</ol><p style='color:#777;font-size:12px'>Status: "+escapeHtml(data.status||"Ready")+" · Preparation complete. Select Render Video to generate the clip.</p>";
    }
    toast("Video preparation completed.");
  }catch(error){
    if(output)output.innerHTML="<h4>Could not build the edit plan</h4><p style='color:#f0a0a0'>"+escapeHtml(error.message||"Unknown error")+"</p><p style='color:#aaa'>Check your connection and try again. Your story and storyboard remain saved.</p><button class='copy-btn' onclick='buildVideoPlan()'>Try again →</button>";
    toast("Edit plan failed: "+(error.message||"Unknown error"));
  }finally{
    const current=document.getElementById("videoPlanLoadingOverlay");if(current)current.remove();
    window.storyforgeBuildingEditPlan=false;
    if(button){button.disabled=false;button.textContent=originalText;}
  }
}

async function generateVideo(){
 const button=document.getElementById("videoGenerateButton");
 const output=document.getElementById("toolOutput");
 const title=(document.getElementById("videoTitle")?.value||"THE QUEUE").trim();
 button.disabled=true;button.textContent="Rendering video…";
 output.style.display="block";
 output.innerHTML="<h4>Rendering your video…</h4><p style='color:#aaa'>StoryForge is asking the video model to create a moving clip. This can take a few minutes. Keep this page open.</p><div class='reference-spinner' style='margin:16px 0;width:28px;height:28px'></div>";
 try{
  const bible=(()=>{try{return JSON.parse(localStorage.getItem("storyforge-production-bible")||"{}")}catch(_){return {}}})();
  const state=(()=>{try{return JSON.parse(localStorage.getItem("storyforge-production-state")||"{}")}catch(_){return {}}})();
  const shots=Array.isArray(state.shots)?state.shots:[];
  const selectedShot=shots[0]||{};
  const world=bible.world||state.world||window.storyforgeWorldBible||"retro-futuristic South Africa in 2094";
  const characters=bible.characters||state.characters||window.storyforgeCharacterBible||"Thabo Ndlovu, Nomsa Khumalo, Aiden Mokoena, Rafiq Sayed and Zola Maseko";
  const scene=bible.scene||state.scene||window.storyforgeScene||{};
  const shotDescription=[selectedShot.shotType,selectedShot.camera,selectedShot.action,selectedShot.visualPrompt].filter(Boolean).join(". ");
  const prompt=[
   "Create a finished "+Math.max(2,Math.min(10,Number(document.getElementById("videoDuration")?.value||4)))+"-second cinematic animated video clip for the original series "+title+".",
   "LOCKED VISUAL STYLE: original painterly, highly stylized animation; expressive hand-designed characters; hand-painted textures; bold graphic shadows; cinematic illustrated lighting; atmospheric depth; retro-futuristic South African environments. STRICTLY animated, never photorealistic, hyperrealistic or live-action.",
   "WORLD: "+String(world),
   "CHARACTERS AND CONTINUITY: "+String(characters),
   "SCENE CONTEXT: "+JSON.stringify(scene),
   "STORYBOARD SHOT: "+(shotDescription||"A cinematic establishing moment in the story world."),
   "Use coherent continuous motion, stable character identity, clear composition, natural movement and a deliberate camera move. No titles, captions, logos or watermarks."
  ].join("\\n");
  const duration=Math.max(2,Math.min(10,Number(document.getElementById("videoDuration")?.value||4)));
  const response=await fetch("/api/video",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,model:"wan",duration})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||"Video generation failed.");
  if(!data.url||!String(data.url).startsWith("data:video/"))throw new Error("The provider did not return a playable video file.");
  output.innerHTML="<h4>Video rendered successfully</h4><p><strong>"+escapeHtml(title)+"</strong> · "+escapeHtml(String(data.duration||duration))+"s</p><video controls autoplay playsinline src='"+data.url+"' style='display:block;width:100%;max-height:620px;background:#080808;border:1px solid #292929;border-radius:10px'></video><p style='color:#aaa;font-size:12px;margin-top:10px'>Your generated video is ready. Use the player controls to replay it.</p><button class='copy-btn' onclick='generateVideo()'>Render another clip →</button>";
  toast("Video rendered successfully.");
 }catch(error){
  output.innerHTML="<h4>Video could not be rendered</h4><p style='color:#f0a0a0'>"+escapeHtml(error.message||"Unknown video error")+"</p><p style='color:#aaa'>Your saved story, characters and storyboard are unchanged. You can retry after correcting the provider error.</p><button class='copy-btn' onclick='generateVideo()'>Try rendering again →</button>";
  toast(error.message||"Video generation failed.");
 }finally{button.disabled=false;button.textContent="Render Video →"}
}

async function buildAsset(){
 const payload={type:assetType.value,style:assetStyle.value,subject:assetSubject.value,mood:assetMood.value,notes:assetNotes.value};
 const response=await fetch("/api/asset",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const data=await response.json(); if(!response.ok){toast(data.error||"Asset failed");return}
 toolOutput.style.display="block";
 toolOutput.innerHTML="<h4>Asset brief ready</h4><p><strong>"+data.assetType+"</strong> · "+data.aspectRatio+"</p><p><strong>Visual notes:</strong> "+data.visualNotes+"</p><p><strong>Continuity:</strong> "+data.continuityNotes+"</p><h4 style='margin-top:18px'>Generation prompt</h4><div class='asset-prompt' id='assetPrompt'>"+data.prompt+"</div><button class='copy-btn' onclick='copyText("+JSON.stringify(data.prompt)+")'>Copy prompt</button><h4 style='margin-top:18px'>Negative prompt</h4><div class='asset-prompt'>"+data.negativePrompt+"</div>";
 document.getElementById("generateImageButton").style.display="inline-block"; toast("Asset brief built.");
}
async function generateImage(){
 const prompt=document.getElementById("assetPrompt")?.textContent?.trim();
 if(!prompt){toast("Build an asset brief first.");return}
 const button=document.getElementById("generateImageButton");
 button.disabled=true;button.textContent="Generating image…";
 try{
  const response=await fetch("/api/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,size:"1024x1024"})});
  const data=await response.json();
  if(!response.ok) throw new Error(data.error||"Image generation failed.");
  toolOutput.innerHTML += "<h4 style='margin-top:18px'>Generated image</h4><img src='"+data.url+"' alt='Generated StoryForge asset' style='width:100%;max-height:600px;object-fit:contain;background:#080808;border:1px solid #292929;border-radius:10px'><p style='color:#666;font-size:11px;margin-top:8px'>Generated with "+data.model+".</p>";
  toast("Image generated.");
 }catch(error){toast(error.message)}finally{button.disabled=false;button.textContent="Generate image →"}
}
async function copyText(value){try{await navigator.clipboard.writeText(value);toast("Prompt copied.");}catch(e){toast("Copy unavailable. Select the prompt manually.")}}
function toast(message){const t=document.getElementById("toast");t.textContent=message;t.style.display="block";setTimeout(()=>t.style.display="none",2600)}
async function createStory(){
 const input=document.getElementById("idea"), button=document.getElementById("generate"); if(!input||!button){toast("Story form failed to load. Refresh the page.");return} const value=input.value.trim();
 if(!value){toast("Give us an idea first.");focusPrompt();return}
 button.disabled=true;button.textContent="Forging story…";
 try{
  const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({idea:value})});
  const data=await response.json(); if(!response.ok) throw new Error(data.error||"Generation failed");
  renderStory(data,value);
  window.storyforgeWorldBible = data.world || "";
  window.storyforgeCharacterBible = (data.characters || []).map(c => [c.name, c.role].join(" | ")).join(" ; ");
  toast("Story forged successfully.");
 }catch(error){toast(error.message)}finally{button.disabled=false;button.textContent="Create story →"}
}

// Make primary tool actions reliable and surface failures instead of silently doing nothing.
Object.assign(window, {
 showTool, showSavedStories, showDashboard, showProjects, loadProject, openProjectWorkspace, deleteProject, buildWorld, buildCharacter, generateCharacterReference,
 generateScene, buildStoryboard, buildVideoPlan, generateVideo, buildAsset, generateImage,
 focusPrompt, toast, createStory, saveProject
});
document.addEventListener("click", function(event) {
 const button = event.target && event.target.closest ? event.target.closest("button[onclick]") : null;
 if (!button) return;
 const source = button.getAttribute("onclick") || "";
 const match = source.match(/^\s*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*;?\s*$/);
 if (!match) return;
 const name = match[1], args = match[2].trim();
 const noArgActions = new Set(["showSavedStories","buildWorld","buildCharacter","generateCharacterReference","generateScene","buildStoryboard","buildVideoPlan","generateVideo","buildAsset","generateImage","focusPrompt","createStory","saveProject"]);
 if (name !== "showTool" && !(noArgActions.has(name) && !args)) return;
 event.preventDefault();
 event.stopImmediatePropagation();
 try {
  let result;
  if (name === "showTool") {
   const tool = args.match(/^['"]([^'"]+)['"]$/);
   if (!tool) throw new Error("Unknown tool selection.");
   result = window.showTool(tool[1]);
  } else {
   if (typeof window[name] !== "function") throw new Error("Tool did not load: " + name);
   result = window[name]();
  }
  Promise.resolve(result).catch(function(error) {
   console.error("StoryForge action failed:", error);
   toast("Action failed: " + (error && error.message ? error.message : "Please try again."));
  });
 } catch (error) {
  console.error("StoryForge action failed:", error);
  toast("Action failed: " + (error && error.message ? error.message : "Please try again."));
 }
}, true);
migrateLegacyCharacter(); initWorkspace(); renderCharacterLibrary();
</script><script src="/story-create.js?v=2"></script><script src="/story-save.js?v=1"></script><script src="/storyboard-board.js?v=2"></script><script src="/pipeline.js?v=1"></script></body></html>`);
});

app.listen(PORT, () => console.log(`StoryForge running on port ${PORT}`));