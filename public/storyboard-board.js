(() => {
  let currentShots = [];

  window.buildStoryboard = async function () {
    const payload = {
      title: document.getElementById("boardTitle").value,
      episode: document.getElementById("boardEpisode").value,
      episodeTitle: document.getElementById("boardEpisodeTitle").value,
      premise: document.getElementById("boardPremise").value
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

    currentShots = data.shots || [];
    const output = document.getElementById("toolOutput");
    output.style.display = "block";
    output.innerHTML =
      "<div style='display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap'>" +
      "<div><h4>Visual production board · " + data.episodeTitle + "</h4>" +
      "<p><strong>" + data.title + "</strong> · Episode " + data.episode + " · " + data.totalDuration + "</p></div>" +
      "<button class='generate' onclick='generateStoryboardFrames()'>Generate all shot frames →</button></div>" +
      "<p style='color:#888'>" + data.continuity + "</p>" +
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
            prompt: shot.visualPrompt + "; " + shot.action + "; " + shot.camera +
              "; original cinematic story frame; consistent characters, location and visual identity",
            size: "1024x1024"
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Frame generation failed.");

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
    toast("Shot frame pass complete.");
  };

  window.animateShot = function (number) {
    const shot = currentShots.find(s => s.number === number);
    if (!shot) return;
    showTool("video");
    document.getElementById("videoTitle").value =
      (document.getElementById("boardTitle").value || "StoryForge shot") + " · Shot " + String(number).padStart(2, "0");
    toast("Shot " + number + " loaded into Video Forge. Animation is the next build step.");
  };
})();