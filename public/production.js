(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let scenes = [], busy = false, breakdownReady = false, finalUrl = null;
  const RUNTIME = 30;
  const CLIP_DURATIONS = [8, 8, 7, 7];

  function view(id) {
    document.querySelectorAll("main > section").forEach(s => s.classList.toggle("hidden", s.id !== id));
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function addUi() {
    const main = document.querySelector("main");
    if (!main || $("productionView")) return;
    const css = document.createElement("style");
    css.textContent = `
      .sf-production{max-width:900px;margin:0 auto}
      .sf-panel{border:1px solid #303030;background:#101010;border-radius:14px;padding:20px;margin-top:18px}
      .sf-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
      .sf-scenes{display:grid;gap:12px;margin-top:18px}
      .sf-scene{border:1px solid #303030;border-radius:12px;padding:16px;background:#0b0b0b}
      .sf-scene p{line-height:1.6;white-space:pre-wrap}
      .sf-scene textarea{width:100%;min-height:100px}
      .sf-spinner{display:inline-block;width:16px;height:16px;border:2px solid #777;border-top-color:#fff;border-radius:50%;animation:sfspin .8s linear infinite;vertical-align:-3px;margin-right:8px}
      .sf-progress{height:5px;background:#292929;border-radius:10px;overflow:hidden;margin-top:16px}
      .sf-progress span{display:block;height:100%;width:35%;background:#eee;border-radius:10px;animation:sftravel 1.4s ease-in-out infinite}
      .sf-video{width:100%;max-height:65vh;background:#000;border-radius:10px;margin-top:14px}
      #sfVideoErrorText{color:#ffb5b5;white-space:pre-wrap;overflow-wrap:anywhere}
      @keyframes sfspin{to{transform:rotate(360deg)}}
      @keyframes sftravel{0%{transform:translateX(-110%)}100%{transform:translateX(330%)}}
      @media(max-width:640px){.sf-panel{padding:15px}}
    `;
    document.head.appendChild(css);
    main.insertAdjacentHTML("beforeend", `
      <section id="productionView" class="hidden sf-production">
        <div class="workshop-head">
          <div><div class="eyebrow">Story Workshop · Step 5</div><h1>Episode 01 · Scene breakdown</h1>
          <p class="subheading" style="text-align:left">Turn Episode 1's approved blueprint into a scene-by-scene plan. Review it before generating video.</p>
          <div class="status" id="sfStatus" role="status" aria-live="polite">Ready to create the scene breakdown.</div></div>
          <button class="btn" id="sfBack" type="button">← Step 4</button>
        </div>
        <div class="sf-panel" id="sfStartPanel">
          <div class="section-title">Episode 01</div>
          <p id="sfEpisodeTitle" class="section-copy">Using the episode blueprint you already created in Step 4.</p>
          <button class="btn primary" id="sfCreate" type="button">Create scene breakdown</button>
          <div id="sfWorking" class="hidden" aria-live="polite"><p id="sfWorkingText"><span class="sf-spinner"></span>Reading Episode 1…</p><div class="sf-progress"><span></span></div></div>
        </div>
        <div class="sf-panel hidden" id="sfDonePanel">
          <div class="section-title">Scene breakdown complete</div>
          <p class="section-copy" id="sfDoneText">Done. Your scene breakdown is ready to review.</p>
          <button class="btn primary" id="sfOpen" type="button">Done · Open scene breakdown ↗</button>
        </div>
        <div class="sf-panel hidden" id="sfBreakdownPanel">
          <div class="section-title" id="sfBreakdownTitle">Episode 01 · Scene breakdown</div>
          <p class="section-copy">Check the order, action and visual prompts. Producing the video will use this breakdown and the visual style selected in your series settings.</p>
          <div id="sfSceneList" class="sf-scenes"></div>
          <div class="sf-actions">
            <button class="btn" id="sfRetry" type="button">Retry breakdown</button>
            <button class="btn primary" id="sfProduce" type="button">Produce video · 30 seconds ↗</button>
          </div>
          <div id="sfVideoWorking" class="hidden" aria-live="polite"><p id="sfVideoWorkingText"><span class="sf-spinner"></span>Preparing video…</p><div class="sf-progress"><span></span></div><p class="section-copy">Video generation can take several minutes. Keep this page open.</p></div>
          <div id="sfVideoError" class="sf-panel hidden" role="alert" style="border-color:#8d4242"><div class="section-title">Video generation stopped</div><p id="sfVideoErrorText" class="section-copy"></p><p class="section-copy">Your scene breakdown is still here. Correct the issue above, then retry without rebuilding the scenes.</p><button class="btn primary" id="sfVideoRetry" type="button">Retry video generation</button></div>
          <div id="sfVideoResult" class="hidden">
            <div class="section-title" style="margin-top:22px">Episode video ready</div>
            <video id="sfFinalVideo" class="sf-video" controls playsinline></video>
            <div class="sf-actions"><a id="sfDownload" class="btn primary" download="storyforge-episode-01.mp4">Download video</a></div>
          </div>
        </div>
      </section>`);
  }
  function dataForEpisode() {
    let map = {};
    try { map = JSON.parse($("episodeBlueprints")?.value || "{}"); } catch (_) {}
    const selected = map["1"] && typeof map["1"] === "object" ? map["1"] : {};
    return {
      number: 1,
      title: String(selected.episodeTitle || "Episode 01").trim(),
      purpose: String(selected.episodePurpose || "").trim(),
      opening: String(selected.episodeOpening || "").trim(),
      turn: String(selected.episodeTurn || "").trim(),
      beats: String(selected.episodeBeats || "").trim(),
      ending: String(selected.episodeEnding || "").trim(),
      character: String(selected.episodeCharacterBeat || "").trim(),
      visuals: String(selected.episodeVisuals || "").trim(),
      continuity: String(selected.episodeContinuity || "").trim()
    };
  }
  const world = () => [$("bibleWorld")?.value, $("setting")?.value, $("worldRules")?.value, $("bibleRules")?.value, $("bibleLocations")?.value].filter(Boolean).join("\n");
  const chars = () => [$("protagonist")?.value, $("antagonist")?.value, $("relationships")?.value, $("bibleCharacterLook")?.value, $("bibleCharacterVoice")?.value].filter(Boolean).join("\n");
  const style = ep => ep.visuals || $("bibleVisualStyle")?.value || $("tone")?.value || "original stylized animation";
  function breakdownStorageKey() {
    let projectId = "";
    try { projectId = localStorage.getItem("storyforge-workshop-active-v1") || ""; } catch (_) {}
    return "storyforge:scene-breakdown:v1:" + (projectId || "current-project");
  }
  function saveBreakdown() {
    if (!scenes.length) return;
    try {
      localStorage.setItem(breakdownStorageKey(), JSON.stringify({
        scenes,
        episode: dataForEpisode(),
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.warn("StoryForge could not save the scene breakdown:", error);
      $("sfStatus").textContent = "Scene breakdown is ready, but browser storage failed. Please save space and try again.";
    }
  }
  function restoreBreakdown() {
    try {
      const saved = JSON.parse(localStorage.getItem(breakdownStorageKey()) || "null");
      if (!saved || !Array.isArray(saved.scenes) || !saved.scenes.length) return false;
      scenes = saved.scenes;
      breakdownReady = true;
      $("sfEpisodeTitle").textContent = saved.episode?.title || "Episode 01";
      $("sfBreakdownTitle").textContent = "Episode 01 · " + (saved.episode?.title || "Scene breakdown");
      $("sfDoneText").textContent = "Restored your saved scene breakdown (" + scenes.length + " scenes).";
      $("sfDonePanel").classList.remove("hidden");
      $("sfCreate").textContent = "Recreate scene breakdown";
      renderBreakdown();
      $("sfBreakdownPanel").classList.remove("hidden");
      $("sfStatus").textContent = "Restored your previous scene breakdown. You can review it or produce the video.";
      return true;
    } catch (error) {
      console.warn("StoryForge could not restore the scene breakdown:", error);
      return false;
    }
  }

  async function post(url, body) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let d = {};
    try { d = await r.json(); } catch (_) {}
    if (!r.ok) throw new Error(d.error || ("Request failed (" + r.status + ")"));
    return d;
  }
  function getPremises(ep) {
    const beats = (ep.beats || "").split(/\n+/).map(x => x.replace(/^\s*(?:\d+[.)-]|[-•])\s*/, "").trim()).filter(Boolean);
    const unique = [];
    [ep.opening, ...beats, ep.turn, ep.ending].filter(Boolean).forEach(x => {
      const text = String(x).trim();
      if (text && !unique.some(y => y.toLowerCase() === text.toLowerCase())) unique.push(text);
    });
    if (unique.length < 2 && ep.purpose) unique.push(ep.purpose);
    if (unique.length < 2 && ep.character) unique.push(ep.character);
    if (unique.length < 2) throw new Error("Episode 1 needs at least two story beats in Step 4. Add its opening, beats, turning point or ending, then try again.");
    return unique.slice(0, 4);
  }
  function videoPrompt(scene, ep, index) {
    const sceneAction = scene.action || scene.premise || scene.title || "";
    return "Create clip " + (index + 1) + " of 4 for a 30-second vertical animated episode. Series: " + ($("seriesTitle")?.value || "Untitled series") + ". Episode 1: " + ep.title + ". Story beat: " + scene.premise + ". Scene action: " + sceneAction + ". World and setting: " + world() + ". Character design: " + chars() + ". LOCKED VISUAL STYLE: " + style(ep) + ". Continuity: " + (ep.continuity || $("bibleContinuity")?.value || "Keep character appearance, wardrobe, props, geography, lighting and colour palette consistent across all clips.") + ". Family-safe original animation. Vertical 9:16. No photorealism, no live action, no logos, no text. This clip must continue the same story and match the other clips.";
  }
  function renderBreakdown() {
    $("sfSceneList").innerHTML = scenes.map((s, i) => `
      <article class="sf-scene">
        <div class="scene-card-head"><strong>Scene ${i + 1}: ${esc(s.title || s.premise || "Story beat")}</strong><span class="saved-meta">Scene ${i + 1} of ${scenes.length}</span></div>
        <p>${esc(s.action || s.premise || "")}</p>
        ${s.dialogue?.length ? '<p><strong>Dialogue</strong><br>' + s.dialogue.map(d => esc(d.character || "Character") + ': ' + esc(d.line || "")).join("<br>") + '</p>' : ""}
        <label class="label" for="sfPrompt${i}">Visual prompt</label>
        <textarea id="sfPrompt${i}">${esc(s.videoPrompt || "")}</textarea>
      </article>`).join("");
  }
  function showWorking(target, text) {
    $(target).classList.remove("hidden");
    const node = $(text);
    node.innerHTML = '<span class="sf-spinner"></span>' + esc("Preparing Episode 1…");
  }
  async function createBreakdown() {
    if (busy) return;
    busy = true; breakdownReady = false; scenes = [];
    $("sfCreate").disabled = true; $("sfRetry").disabled = true; $("sfProduce").disabled = true;
    $("sfDonePanel").classList.add("hidden"); $("sfBreakdownPanel").classList.add("hidden");
    $("sfWorking").classList.remove("hidden");
    $("sfStatus").textContent = "Creating Episode 1 scene breakdown…";
    const ep = dataForEpisode();
    $("sfEpisodeTitle").textContent = ep.title;
    const statusMessages = ["Reading Episode 1's blueprint…", "Mapping the story beats…", "Building the scene sequence…", "Checking scene continuity…"];
    let statusIndex = 0;
    const ticker = setInterval(() => {
      statusIndex = (statusIndex + 1) % statusMessages.length;
      $("sfWorkingText").innerHTML = '<span class="sf-spinner"></span>' + esc(statusMessages[statusIndex]);
    }, 1200);
    try {
      const premises = getPremises(ep);
      for (let i = 0; i < premises.length; i++) {
        const scene = await post("/api/scene", { premise: premises[i], world: world(), characters: chars() });
        scenes.push({ ...scene, number: i + 1, premise: premises[i], videoPrompt: videoPrompt({ ...scene, premise: premises[i] }, ep, i) });
        $("sfWorkingText").innerHTML = '<span class="sf-spinner"></span>' + esc("Building scene " + (i + 1) + " of " + premises.length + "…");
      }
      breakdownReady = true;
      saveBreakdown();
      $("sfBreakdownTitle").textContent = "Episode 01 · " + ep.title;
      $("sfDoneText").textContent = "Done. " + scenes.length + " scenes prepared for Episode 1. No video has been generated yet.";
      $("sfDonePanel").classList.remove("hidden");
      $("sfStatus").textContent = "Done. Open the scene breakdown to review it.";
      $("sfCreate").textContent = "Recreate scene breakdown";
    } catch (error) {
      $("sfStatus").textContent = error.message || "Scene breakdown failed. Please try again.";
      $("sfWorkingText").textContent = error.message || "Scene breakdown failed.";
    } finally {
      clearInterval(ticker);
      $("sfWorking").classList.add("hidden");
      busy = false; $("sfCreate").disabled = false; $("sfRetry").disabled = false; $("sfProduce").disabled = false;
    }
  }
  async function produceVideo() {
    if (busy || !breakdownReady || !scenes.length) return;
    busy = true; $("sfProduce").disabled = true; $("sfRetry").disabled = true;
    $("sfVideoResult").classList.add("hidden"); $("sfVideoError").classList.add("hidden"); $("sfVideoWorking").classList.remove("hidden");
    $("sfVideoWorkingText").innerHTML = '<span class="sf-spinner"></span>Generating clip 1 of 4…';
    $("sfStatus").textContent = "Producing Episode 1 as a 30-second vertical video…";
    let ticker = null;
    try {
      const statusResponse = await fetch("/api/video-status", { cache: "no-store" });
      const statusData = await statusResponse.json();
      if (!statusResponse.ok || !statusData.configured) throw new Error(statusData.message || "Video generation is not connected. The server needs a valid POLLINATIONS_API_KEY.");
      const clips = [];
      for (let i = 0; i < scenes.length; i++) {
        scenes[i].videoPrompt = $("sfPrompt" + i)?.value || scenes[i].videoPrompt;
        saveBreakdown();
        $("sfVideoWorkingText").innerHTML = '<span class="sf-spinner"></span>' + esc("Sending scene " + (i + 1) + " of " + scenes.length + " to the video model. This can take several minutes…");
        const clip = await post("/api/video", { prompt: scenes[i].videoPrompt, model: "alibaba/wan-2.2-fast", duration: CLIP_DURATIONS[i] || 7, aspectRatio: "9:16", audio: true });
        if (!clip.url) throw new Error("The video provider returned no clip for scene " + (i + 1) + ".");
        clips.push(clip.url);
      }
      $("sfVideoWorkingText").innerHTML = '<span class="sf-spinner"></span>All scene clips generated. Assembling the finished episode…';
      const response = await fetch("/api/assemble", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clips, aspectRatio: "9:16" }) });
      if (!response.ok) {
        let data = {};
        try { data = await response.json(); } catch (_) {}
        throw new Error(data.error || "Could not assemble the final video.");
      }
      const blob = await response.blob();
      if (finalUrl) URL.revokeObjectURL(finalUrl);
      finalUrl = URL.createObjectURL(blob);
      $("sfFinalVideo").src = finalUrl;
      $("sfDownload").href = finalUrl;
      $("sfVideoResult").classList.remove("hidden");
      $("sfStatus").textContent = "Episode 1 video is ready to preview or download.";
    } catch (error) {
      const message = error.message || "Video production failed. Your scene breakdown is preserved.";
      $("sfStatus").textContent = "Video generation failed. Your scene breakdown is preserved.";
      const errorText = $("sfVideoErrorText");
      errorText.textContent = message;
      if (/402|insufficient balance|available paid balance/i.test(message)) {
        const help = document.createElement("p");
        help.className = "section-copy";
        help.textContent = "The connected Pollinations account needs available Pollen before generation can continue.";
        const topUp = document.createElement("a");
        topUp.href = "https://enter.pollinations.ai/top-up";
        topUp.target = "_blank";
        topUp.rel = "noopener noreferrer";
        topUp.textContent = "Open Pollinations top-up ↗";
        topUp.className = "btn";
        errorText.appendChild(help);
        errorText.appendChild(document.createElement("br"));
        errorText.appendChild(topUp);
      }
      $("sfVideoError").classList.remove("hidden");
      console.error("StoryForge episode video generation failed:", error);
    } finally {
      if (ticker) clearInterval(ticker);
      $("sfVideoWorking").classList.add("hidden");
      busy = false; $("sfProduce").disabled = false; $("sfRetry").disabled = false;
    }
  }
  function repairProjectsNavigation() {
    const main = document.querySelector("main");
    if (main) Array.from(main.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "\\n") node.remove();
    });
    document.addEventListener("click", event => {
      const button = event.target.closest("#projectsButton");
      if (!button) return;
      const ids = ["homeView","workshopView","bibleView","seasonView","episodeView","productionView","exportView","projectsView","authView"];
      ids.forEach(id => { const node = document.getElementById(id); if (node) node.classList.toggle("hidden", id !== "projectsView"); });
    }, true);
  }
  function init() {
    repairProjectsNavigation();
    addUi();
    if (!$("productionView")) return;
    $("productionData")?.remove();
    $("productionSettings")?.remove();
    $("sfBack").addEventListener("click", () => view("episodeView"));
    $("finishBlueprintButton")?.addEventListener("click", () => setTimeout(() => view("productionView"), 100));
    $("sfCreate").addEventListener("click", createBreakdown);
    $("sfRetry").addEventListener("click", createBreakdown);
    $("sfOpen").addEventListener("click", () => {
      if (!breakdownReady) return;
      renderBreakdown();
      $("sfBreakdownPanel").classList.remove("hidden");
      $("sfStatus").textContent = "Review Episode 1's scene breakdown before producing video.";
      $("sfBreakdownPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("sfProduce").addEventListener("click", produceVideo);
    $("sfSceneList").addEventListener("input", event => {
      const match = event.target.id.match(/^sfPrompt(\d+)$/);
      if (!match) return;
      const index = Number(match[1]);
      if (scenes[index]) { scenes[index].videoPrompt = event.target.value; saveBreakdown(); }
    });
    restoreBreakdown();
    $("sfVideoRetry").addEventListener("click", produceVideo);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
