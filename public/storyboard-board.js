(() => {
  const STYLE_LOCK = "Original painterly cinematic stylized animation; expressive hand-designed character shapes, hand-painted textures, graphic shadows, dramatic illustrated lighting, rich atmospheric depth, controlled colour palette and premium animated-series composition. Distinctly South African retro-futurism. STRICTLY ANIMATED, NOT PHOTOREALISTIC, NOT HYPERREALISTIC, NOT LIVE-ACTION, NOT PHOTOGRAPHIC. Original visual identity, do not copy an existing show or artist.";
  let currentShots = [];
  let animatedClips = {};
  let generatedFrames = {};
  try { window.storyforgeCharacterReferenceImage = window.storyforgeCharacterReferenceImage || localStorage.getItem("storyforge-character-reference") || null; } catch (e) {}

  window.buildStoryboard = async function () {
    const production = window.storyforgePipeline ? window.storyforgePipeline.read() : {};
    const scene = window.storyforgeScene || production.scene || null;
    const payload = {
      title: document.getElementById("boardTitle").value || production.title || "Untitled Story",
      episode: document.getElementById("boardEpisode").value || production.episode?.number || 1,
      episodeTitle: document.getElementById("boardEpisodeTitle").value || production.episode?.title || "The March",
      premise: document.getElementById("boardPremise").value || scene?.premise || scene?.action || production.idea || "",
      scene,
      worldBible: window.storyforgeWorldBible || (production.world ? JSON.stringify(production.world) : ""),
      characterBible: window.storyforgeCharacterBible || (window.storyforgePipeline ? window.storyforgePipeline.charactersText() : ""),
      visualStyle: window.storyforgeVisualStyle || production.visualStyle || STYLE_LOCK
    };
    const response = await fetch("/api/storyboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      toast(data.error || "Storyboard failed");
      return;
    }

    currentShots = (data.shots || []).map(shot => ({...shot, visualPrompt: [STYLE_LOCK, shot.visualPrompt || "", "WORLD CONTEXT: "+payload.worldBible, "CHARACTER CONTINUITY: "+payload.characterBible, "SCENE ACTION: "+(shot.action||payload.premise), "Strictly painterly stylized animation, no photorealism, no hyperrealism, no live action."].filter(Boolean).join("\n")}));
    animatedClips = {};
    generatedFrames = {};
    persistProductionState();
    const output = document.getElementById("toolOutput");
    output.style.display = "block";
    output.innerHTML =
      "<div style='display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap'>" +
      "<div><h4>Visual production board · " + data.episodeTitle + "</h4>" +
      "<p><strong>" + data.title + "</strong> · Episode " + data.episode + " · " + data.totalDuration + "</p></div>" +
      "<div style='display:flex;gap:8px;flex-wrap:wrap'><button class='generate' onclick='generateStoryboardFrames()'>Generate all shot frames →</button><button class='copy-btn' id='assembleVideoBtn' onclick='assembleFinalVideo()' disabled>Assemble final video →</button></div></div>" +
      "<p style='color:#888'>" + data.continuity + "</p>" + "<p style='color:#888'>Scene context automatically connected from Story Engine when available.</p>" +
      "<div id='storyboardBoard' style='display:grid;gap:12px;margin-top:14px'>" +
      currentShots.map(shotCard).join("") +
      "</div>";
    toast("Storyboard forged: " + currentShots.length + " shots. Generate the visual frames next.");
  };

  function shotCard(s) {
    return "<div class='shot' id='shot-" + s.number + "' style='padding:16px'>" +
      "<div style='display:flex;justify-content:space-between;gap:10px;align-items:center'>" +
      "<b>SHOT " + String(s.number).padStart(2, "0") + " · " + s.shotType + " · " + s.duration + "</b>" +
      "<span id='shot-status-" + s.number + "' class='status'>FRAME PENDING</span></div>" +
      "<div><strong>Camera:</strong> " + s.camera + "</div>" +
      "<div><strong>Action:</strong> " + s.action + "</div>" +
      "<div><strong>Audio:</strong> " + s.audio + "</div>" +
      "<div><strong>Visual prompt:</strong> " + s.visualPrompt + "</div>" +
      "<div id='shot-frame-" + s.number + "' style='margin-top:12px'></div></div>";
  }

  window.generateStoryboardFrames = async function () {
    if (!currentShots.length) {
      toast("Forge the storyboard first.");
      return;
    }

    for (const shot of currentShots) {
      const status = document.getElementById("shot-status-" + shot.number);
      const frame = document.getElementById("shot-frame-" + shot.number);
      status.textContent = "GENERATING…";

      try {
        const response = await fetch("/api/shot-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: STYLE_LOCK + "\nPROJECT WORLD: " + (window.storyforgeWorldBible || "") + "\nPROJECT CHARACTERS: " + (window.storyforgeCharacterBible || "") + "\nSHOT ACTION: " + shot.action + "\nCAMERA: " + shot.camera + "\n" + shot.visualPrompt + "\nKeep the exact stylized animated art direction. Do not render as a photograph, live-action film or hyperrealistic 3D.",
            size: "1024x1024",
            referenceImage: window.storyforgeCharacterReferenceImage || null
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Frame generation failed.");

        generatedFrames[shot.number] = data.url;
        frame.innerHTML =
          "<img src='" + data.url + "' alt='Shot " + shot.number + " frame' style='width:100%;max-height:520px;object-fit:cover;background:#080808;border:1px solid #292929;border-radius:10px'>" +
          "<div style='display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:8px'>" +
          "<span style='color:#666;font-size:11px'>Frame ready · next: animate shot</span>" +
          "<button class='copy-btn' onclick='animateShot(" + shot.number + ")'>Animate shot →</button></div>";
        status.textContent = "FRAME READY";
      } catch (error) {
        status.textContent = "FRAME FAILED";
        frame.innerHTML = "<p style='color:#888;font-size:12px'>" + error.message + "</p>";
      }
    }
    persistProductionState();
    toast("Shot frame pass complete.");
  };

  window.animateShot = async function (number) {
    const shot = currentShots.find(s => s.number === number);
    const frame = document.querySelector("#shot-frame-" + number + " img");
    if (!shot || !frame) {
      toast("Generate the shot frame first.");
      return;
    }
    const status = document.getElementById("shot-status-" + number);
    status.textContent = "ANIMATING…";
    try {
      const response = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: STYLE_LOCK + "\nPROJECT WORLD: " + (window.storyforgeWorldBible || "") + "\nPROJECT CHARACTERS: " + (window.storyforgeCharacterBible || "") + "\n" + shot.visualPrompt + "; " + shot.action + "; " + shot.camera + "; preserve the exact stylized character and environment shown in the reference frame; smooth cinematic animated motion; never photorealistic or live action",
          image: frame.src,
          referenceImages: window.storyforgeCharacterReferenceImage ? [window.storyforgeCharacterReferenceImage] : [],
          model: "alibaba/wan-2.2-fast",
          duration: Math.min(10, Math.max(2, parseInt(shot.duration, 10) || 4))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Animation failed.");
      const holder = document.getElementById("shot-frame-" + number);
      holder.innerHTML += "<video controls playsinline data-shot-clip='" + number + "' src='" + data.url + "' style='width:100%;margin-top:10px;max-height:520px;background:#080808;border:1px solid #292929;border-radius:10px'></video>";
      animatedClips[number] = data.url;
      persistProductionState();
      updateAssemblyButton();
      status.textContent = "ANIMATION READY";
      toast("Shot " + number + " animated.");
    } catch (error) {
      status.textContent = "ANIMATION FAILED";
      toast(error.message);
    }
  };

  window.assembleFinalVideo = async function () {
    const clips = currentShots.map(s => animatedClips[s.number]).filter(Boolean);
    if (clips.length < 2) {
      toast("Animate at least two shots first.");
      return;
    }
    const button = document.getElementById("assembleVideoBtn");
    button.disabled = true;
    button.textContent = "Assembling…";
    try {
      const response = await fetch("/api/assemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clips })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Video assembly failed.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const output = document.getElementById("toolOutput");
      const existing = document.getElementById("finalVideoOutput");
      if (existing) existing.remove();
      const wrap = document.createElement("div");
      wrap.id = "finalVideoOutput";
      wrap.style.cssText = "margin-top:18px;padding:16px;border:1px solid #292929;border-radius:12px;background:#080808";
      wrap.innerHTML = "<h4>FINAL VIDEO READY</h4><p style='color:#888'>Your animated storyboard has been assembled into one MP4.</p><video controls playsinline src='" + url + "' style='width:100%;max-height:620px;background:#000;border-radius:10px'></video><div style='margin-top:10px'><a class='copy-btn' href='" + url + "' download='storyforge-final.mp4' style='display:inline-block;text-decoration:none'>Download MP4 →</a></div>";
      output.appendChild(wrap);
      toast("Final video assembled.");
    } catch (error) {
      toast(error.message);
    } finally {
      button.disabled = false;
      button.textContent = "Assemble final video →";
      updateAssemblyButton();
    }
  };

  function persistProductionState() {
    try {
      localStorage.setItem("storyforge-production-state", JSON.stringify({shots:currentShots,frames:generatedFrames,clips:animatedClips,scene:window.storyforgeScene||null,characterReferenceImage:window.storyforgeCharacterReferenceImage||null,world:window.storyforgeWorldBible||"",characters:window.storyforgeCharacterBible||"",visualStyle:window.storyforgeVisualStyle||STYLE_LOCK}));
      if(window.storyforgePipeline)window.storyforgePipeline.write({storyboard:{shots:currentShots,scene:window.storyforgeScene||null},world:window.storyforgeWorldBible||"",characters:window.storyforgeCharacterBible||"",visualStyle:window.storyforgeVisualStyle||STYLE_LOCK});
    } catch (e) {}
  }
  window.renderRestoredProduction = function () {
    if (!currentShots.length) return;
    const output = document.getElementById("toolOutput");
    if (!output) return;
    output.style.display = "block";
    output.innerHTML = "<div style='display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap'><div><h4>Restored production board</h4><p style='color:#888'>Your previous storyboard production state was restored from this browser.</p></div><button class='copy-btn' onclick='generateStoryboardFrames()'>Regenerate missing frames →</button></div><div id='storyboardBoard' style='display:grid;gap:12px;margin-top:14px'>" + currentShots.map(shotCard).join("") + "</div>";
    currentShots.forEach(function(shot){
      const frame = generatedFrames[shot.number];
      const clip = animatedClips[shot.number];
      const holder = document.getElementById("shot-frame-" + shot.number);
      const status = document.getElementById("shot-status-" + shot.number);
      if (frame) {
        holder.innerHTML = "<img src='" + frame + "' alt='Shot " + shot.number + " frame' style='width:100%;max-height:520px;object-fit:cover;background:#080808;border:1px solid #292929;border-radius:10px'><div style='color:#666;font-size:11px;margin-top:8px'>Restored frame</div>";
        status.textContent = clip ? "ANIMATION READY" : "FRAME READY";
      }
      if (clip) {
        holder.innerHTML += "<video controls playsinline src='" + clip + "' style='width:100%;margin-top:10px;max-height:520px;background:#080808;border:1px solid #292929;border-radius:10px'></video>";
      }
    });
    updateAssemblyButton();
  };

  window.restoreProductionState = function () {
    try {
      const state=JSON.parse(localStorage.getItem("storyforge-production-state")||"null");
      if(!state||!Array.isArray(state.shots)||!state.shots.length)return;
      currentShots=state.shots; generatedFrames=state.frames||{}; animatedClips=state.clips||{};
      if(state.scene) window.storyforgeScene=state.scene;
      if(state.characterReferenceImage) window.storyforgeCharacterReferenceImage=state.characterReferenceImage;
    } catch(e) {}
  };
  function updateAssemblyButton() {
    const button = document.getElementById("assembleVideoBtn");
    if (!button) return;
    const count = Object.keys(animatedClips).length;
    button.disabled = count < 2;
    button.textContent = count ? "Assemble final video (" + count + ") →" : "Assemble final video →";
  }
  restoreProductionState();
  setTimeout(renderRestoredProduction, 50);
})();