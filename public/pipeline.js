(() => {
  "use strict";
  const KEY = "storyforge-production-bible";
  const STYLE = "Original painterly, cinematic stylized animation with expressive hand-designed characters, bold readable silhouettes, hand-painted surface textures, graphic shadows, rich atmospheric lighting, controlled colour palettes and cinematic animated composition. Distinctly South African retro-futurism: township street life, African architectural geometry, minibus taxi culture, patterned civic infrastructure and tactile futuristic technology. Premium animated-series finish, original visual identity. STRICTLY STYLIZED ANIMATION, never photorealistic, hyperrealistic, live-action, photographic or generic cyberpunk. Do not copy any existing show, franchise or artist.";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) { return {}; } };
  const write = patch => { const next = Object.assign({}, read(), patch, { updatedAt: new Date().toISOString() }); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (_) {} return next; };
  const byId = id => document.getElementById(id);
  const val = id => (byId(id)?.value || "").trim();
  const storyBible = () => { try { return JSON.parse(localStorage.getItem("storyforge-story-bible") || '{"world":null,"characters":[]}'); } catch (_) { return {world:null,characters:[]}; } };
  const charactersText = () => (storyBible().characters || []).map(c => [c.name, "Role: "+c.role, "Personality: "+c.personality, "Appearance: "+c.appearance, "Goal: "+c.goal, c.referenceImage ? "Reference image saved." : ""].filter(Boolean).join(" | ")).join("\n");
  const worldText = () => { const w=read().world || storyBible().world; if (typeof w==="string") return w; if (w) return JSON.stringify(w); return window.storyforgeWorldBible || ""; };
  const syncContext = () => {
    const p=read(), chars=charactersText();
    let episodeField=byId("boardEpisode");
    if(episodeField && Array.isArray(p.episodes) && p.episodes.length) {
      if(episodeField.tagName!=="SELECT") {
        const select=document.createElement("select");select.id="boardEpisode";select.className=episodeField.className;episodeField.replaceWith(select);episodeField=select;
      }
      const previous=episodeField.value||String(p.episode?.number||1);
      episodeField.innerHTML=p.episodes.map((ep,i)=>"<option value='"+(ep.number||i+1)+"' data-title='"+String(ep.title||"").replace(/&/g,"&amp;").replace(/'/g,"&#39;")+"' data-summary='"+String(ep.summary||"").replace(/&/g,"&amp;").replace(/'/g,"&#39;")+"'>Episode "+(ep.number||i+1)+": "+String(ep.title||"Untitled").replace(/</g,"&lt;")+"</option>").join("");
      if([...episodeField.options].some(o=>o.value===previous))episodeField.value=previous;
      if(!episodeField.dataset.sfBound){episodeField.dataset.sfBound="1";episodeField.addEventListener("change",()=>{const option=episodeField.options[episodeField.selectedIndex];if(!option)return;const title=byId("boardEpisodeTitle"),premise=byId("boardPremise");if(title)title.value=option.dataset.title||"";if(premise)premise.value=option.dataset.summary||"";write({episode:{number:Number(option.value),title:option.dataset.title||"",summary:option.dataset.summary||""}});});}
      const selected=episodeField.options[episodeField.selectedIndex];if(selected){if(byId("boardEpisodeTitle")&&!val("boardEpisodeTitle"))byId("boardEpisodeTitle").value=selected.dataset.title||"";if(byId("boardPremise")&&!val("boardPremise"))byId("boardPremise").value=selected.dataset.summary||"";}
    }
    if (p.title) {
      if (byId("boardTitle") && !val("boardTitle")) byId("boardTitle").value=p.title;
      if (byId("videoTitle") && !val("videoTitle")) byId("videoTitle").value=p.title;
    }
    if (p.world) window.storyforgeWorldBible = typeof p.world==="string" ? p.world : [p.world.name,p.world.premise,p.world.tone,p.world.setting,p.world.visualIdentity,"RULES: "+(p.world.rules||[]).join("; ")].filter(Boolean).join(" | ");
    else if (storyBible().world) window.storyforgeWorldBible = JSON.stringify(storyBible().world);
    if (chars) window.storyforgeCharacterBible = chars;
    else if (!window.storyforgeCharacterBible) window.storyforgeCharacterBible = "";
    window.storyforgeVisualStyle = p.visualStyle || STYLE;
    window.storyforgeProductionContext = p;
    if (byId("boardPremise") && p.scene && !val("boardPremise")) byId("boardPremise").value=p.scene.premise || p.scene.action || "";
    if (byId("boardEpisode") && p.episode && !val("boardEpisode")) byId("boardEpisode").value=String(p.episode.number || 1);
    if (byId("boardEpisodeTitle") && p.episode && !val("boardEpisodeTitle")) byId("boardEpisodeTitle").value=p.episode.title || "";
    if (byId("sceneWorld") && !val("sceneWorld")) byId("sceneWorld").value=window.storyforgeWorldBible || "";
    if (byId("sceneCharacters") && !val("sceneCharacters")) byId("sceneCharacters").value=window.storyforgeCharacterBible || "";
    renderFlow();
  };
  const steps = [
    {id:"story",label:"1. Story",tool:null,done:p=>!!(p.title||val("resultTitle"))},
    {id:"world",label:"2. World",tool:"world",done:p=>!!(p.worldBuiltAt||(p.world&&typeof p.world==="object"&&p.world.setting&&p.world.visualIdentity)||(storyBible().world&&storyBible().world.setting&&storyBible().world.visualIdentity))},
    {id:"characters",label:"3. Characters",tool:"character",done:p=>!!(p.charactersBuiltAt||(storyBible().characters||[]).length>0)},
    {id:"scene",label:"4. Scene",tool:"scene",done:p=>!!(p.scene||window.storyforgeScene)},
    {id:"storyboard",label:"5. Storyboard",tool:"storyboard",done:p=>!!(p.storyboard&&p.storyboard.shots&&p.storyboard.shots.length)},
    {id:"video",label:"6. Video",tool:"video",done:p=>!!(p.videoRenderedAt||p.video?.renderedAt)}
  ];
  function activeStep(p) { const i=steps.findIndex(s=>!s.done(p)); return i<0?steps.length-1:i; }
  function renderFlow() {
    const root=byId("storyforgeFlow"); if(!root)return;
    const p=read(), active=activeStep(p);
    root.innerHTML="<div class='sf-flow-head'><div><strong>Production pipeline</strong><span>Build once. Every stage inherits the work before it.</span></div><span class='sf-style-lock'>STYLE LOCKED · PAINTERLY ANIMATION</span></div><div class='sf-steps'>"+steps.map((s,i)=>"<button type='button' class='sf-step "+(s.done(p)?"complete ":"")+(i===active?"current":"")+"' data-step='"+s.id+"' "+(i>active&&!s.done(p)?"disabled":"")+"><span>"+(s.done(p)?"✓":String(i+1).padStart(2,"0"))+"</span>"+s.label+"</button>").join("")+"</div><div class='sf-flow-foot'><span>"+(steps.filter(s=>s.done(p)).length)+" of "+steps.length+" stages complete</span><button type='button' id='sfContinue' class='generate'>"+(active===0?"Start with Story →":"Continue: "+steps[active].label+" →")+"</button></div>";
    root.querySelectorAll("[data-step]").forEach(btn=>btn.addEventListener("click",()=>{const step=steps.find(s=>s.id===btn.dataset.step);if(step){if(step.tool&&typeof window.showTool==="function")window.showTool(step.tool);else byId("idea")?.focus();}}));
    byId("sfContinue")?.addEventListener("click",()=>{const step=steps[active];if(step.tool&&typeof window.showTool==="function")window.showTool(step.tool);else {byId("idea")?.focus();byId("idea")?.scrollIntoView({behavior:"smooth",block:"center"});}});
  }
  function saveStoryFromPage() {
    const title=val("resultTitle") || val("boardTitle") || val("videoTitle");
    const episodeRows=[...(byId("episodes")?.children||[])];
    const episodes=episodeRows.map((row,i)=>({number:i+1,title:row.querySelector("strong")?.textContent?.replace(/^[0-9]+[.] /,"")||"Episode "+(i+1),summary:row.querySelector("span")?.textContent||""})).filter(e=>e.title);
    if(title) write({title,idea:val("idea")||read().idea||"",logline:byId("logline")?.textContent||read().logline||"",episodes:episodes.length?episodes:read().episodes||[],world:byId("world")?.textContent||read().world||""});
  }
  function bootstrapSavedStory() {
    const existing=read(); if(existing.title&&Array.isArray(existing.episodes)&&existing.episodes.length)return;
    try {
      const projects=JSON.parse(localStorage.getItem("storyforge-projects")||"[]");
      if(!Array.isArray(projects)||!projects.length)return;
      const p=projects.find(x=>/the queue/i.test((x.title||"")+" "+(x.data?.title||"")))||projects[0];
      const d=p.data||{};
      write({title:existing.title||d.title||p.title||"",idea:existing.idea||p.idea||"",logline:existing.logline||d.logline||"",world:existing.world||d.world||"",episodes:Array.isArray(existing.episodes)&&existing.episodes.length?existing.episodes:(Array.isArray(d.episodes)?d.episodes:[]),characters:existing.characters||d.characters||[]});
    } catch (_) {}
  }
  function installWrapper(name, after) {
    const original=window[name]; if(typeof original!=="function"||original.__sfWrapped)return;
    const wrapped=async function(...args){const result=await original.apply(this,args);try{await after(result);}catch(e){}return result;};
    wrapped.__sfWrapped=true;window[name]=wrapped;
  }
  function injectStyles() {
    if(byId("storyforgeFlowStyles"))return;
    const style=document.createElement("style");style.id="storyforgeFlowStyles";style.textContent=".sf-flow{border:1px solid #303030;border-radius:14px;padding:16px;margin:0 0 18px;background:#111}.sf-flow-head,.sf-flow-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.sf-flow-head strong{display:block;font-size:15px}.sf-flow-head span{display:block;color:#999;font-size:12px;margin-top:4px}.sf-flow-head .sf-style-lock{display:inline-block;color:#c9b17b;border:1px solid #51472f;border-radius:20px;padding:6px 9px;font-size:10px;letter-spacing:.04em}.sf-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin:16px 0}.sf-step{display:flex;align-items:center;gap:7px;min-width:0;border:1px solid #333;background:#171717;color:#aaa;border-radius:8px;padding:9px 7px;font-size:11px;cursor:pointer}.sf-step span{display:inline-grid;place-items:center;flex:0 0 21px;height:21px;border-radius:50%;background:#292929;color:#eee;font-size:10px}.sf-step.current{border-color:#d4bc83;color:#fff;background:#252117}.sf-step.complete span{background:#3c624b;color:#fff}.sf-step:disabled{opacity:.35;cursor:not-allowed}.sf-flow-foot{color:#999;font-size:11px}.sf-flow-foot .generate{font-size:12px;padding:10px 13px}@media(max-width:850px){.sf-steps{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:480px){.sf-steps{grid-template-columns:repeat(2,minmax(0,1fr))}";
    document.head.appendChild(style);
  }
  function initialise() {
    const toolPanel=byId("toolPanel");
    if(toolPanel&&!byId("storyforgeFlow")){const root=document.createElement("section");root.id="storyforgeFlow";root.className="sf-flow";toolPanel.parentNode.insertBefore(root,toolPanel);}
    injectStyles();
    bootstrapSavedStory();
    const p=read(); if(!p.visualStyle)write({visualStyle:STYLE});
    syncContext();
    installWrapper("createStory",()=>{saveStoryFromPage();const title=val("resultTitle")||val("idea");if(title)write({title,idea:val("idea"),logline:byId("logline")?.textContent||""});syncContext();});
    installWrapper("buildWorld",()=>{const world={name:val("worldName"),tone:val("worldTone"),premise:val("worldPremise"),setting:val("worldSetting"),visualIdentity:window.storyforgeWorldBible||"",rules:[]};write({world,worldBuiltAt:new Date().toISOString()});const bible=storyBible();bible.world=world;try{localStorage.setItem("storyforge-story-bible",JSON.stringify(bible));}catch(_){}syncContext();});
    installWrapper("buildCharacter",()=>{write({charactersBuiltAt:new Date().toISOString()});saveStoryFromPage();syncContext();});
    installWrapper("generateScene",()=>{const scene=window.storyforgeScene||{};scene.premise=val("scenePremise");write({scene,world:window.storyforgeWorldBible||worldText(),characters:charactersText()});syncContext();});
    installWrapper("buildStoryboard",()=>{const state=(()=>{try{return JSON.parse(localStorage.getItem("storyforge-production-state")||"{}")}catch(_){return {}}})();write({storyboard:{title:val("boardTitle"),episode:Number(val("boardEpisode")||1),episodeTitle:val("boardEpisodeTitle"),premise:val("boardPremise"),shots:state.shots||[]},world:window.storyforgeWorldBible||worldText(),characters:charactersText()});syncContext();});
    installWrapper("buildVideoPlan",()=>{write({videoPlan:{title:val("videoTitle"),format:val("videoFormat"),shots:val("videoShots"),duration:val("videoDuration"),captions:val("videoCaptions")}});syncContext();});
    document.addEventListener("click",event=>{if(event.target.closest("#generate"))setTimeout(()=>{if(byId("resultTitle")?.textContent){saveStoryFromPage();syncContext();}},1200);});
    const originalShow=window.showTool;
    if(typeof originalShow==="function"&&!originalShow.__sfWrapped){const wrapped=function(tool){syncContext();return originalShow.apply(this,arguments)};wrapped.__sfWrapped=true;window.showTool=wrapped;}
    document.addEventListener("click",event=>{if(event.target.closest("#saveProjectButton"))saveStoryFromPage();});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialise);else initialise();
  window.generateVideo = async function () {
    const p=read();
    let production={};try{production=JSON.parse(localStorage.getItem("storyforge-production-state")||"{}")}catch(_){}
    const world=window.storyforgeWorldBible||p.world||production.world||"";
    const chars=window.storyforgeCharacterBible||charactersText()||production.characters||"";
    const shots=Array.isArray(production.shots)?production.shots:(p.storyboard&&p.storyboard.shots)||[];
    const scene=p.scene||production.scene||window.storyforgeScene||{};
    const title=val("videoTitle")||p.title||"Story scene";
    const sequence=shots.map((shot,i)=>"SHOT "+(i+1)+": "+[shot.action,shot.camera,shot.audio,shot.visualPrompt].filter(Boolean).join(" | ")).join("\\n");
    const prompt=[p.visualStyle||STYLE,"STORY: "+title,"WORLD BIBLE: "+(typeof world==="string"?world:JSON.stringify(world)),"CHARACTER BIBLE: "+(typeof chars==="string"?chars:JSON.stringify(chars)),"SCENE: "+JSON.stringify(scene),"STORYBOARD IN ORDER:\\n"+(sequence||"No storyboard shots saved yet."),"Follow the supplied shot order and story action. Preserve character identity, wardrobe, accessories, location geography, colour palette and lighting continuity. Strictly painterly stylized animation. Never photorealistic, hyperrealistic, photographic or live-action."].join("\\n\\n");
    const button=byId("videoGenerateButton");if(!button)return;
    button.disabled=true;button.textContent="Generating context-aware clip…";
    try{
      const response=await fetch("/api/video",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,model:"alibaba/wan-2.2-fast",duration:4,referenceImages:window.storyforgeCharacterReferenceImage?[window.storyforgeCharacterReferenceImage]:[]})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"Video generation failed.");
      const output=byId("toolOutput");output.style.display="block";
      output.innerHTML+="<h4 style='margin-top:18px'>Generated context-aware clip</h4><video controls playsinline src='"+data.url+"' style='width:100%;max-height:520px;background:#080808;border:1px solid #292929;border-radius:10px'></video><p style='color:#888;font-size:11px'>Generated using the saved world, characters, scene and storyboard context.</p>";
      write({videoRenderedAt:new Date().toISOString(),video:{title,duration:4,model:data.model||"alibaba/wan-2.2-fast",renderedAt:new Date().toISOString()}});if(typeof window.persistActiveProjectState==="function")window.persistActiveProjectState();renderFlow();if(typeof window.toast==="function")window.toast("Context-aware clip generated.");
    }catch(error){if(typeof window.toast==="function")window.toast(error.message);}
    finally{button.disabled=false;button.textContent="Generate test clip →";}
  };
  window.storyforgePipeline = { read, write, syncContext, visualStyle:STYLE, charactersText, worldText };
})();