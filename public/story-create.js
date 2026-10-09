(() => {
  "use strict";
  const notify = (message) => {
    const el = document.getElementById("toast");
    if (el) {
      el.textContent = message;
      el.style.display = "block";
      return;
    }
    window.alert(message);
  };

  async function runStoryCreation(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const input = document.getElementById("idea");
    const button = document.getElementById("generate");
    if (!input || !button) {
      notify("The story form did not load. Refresh the page and try again.");
      return;
    }

    const idea = input.value.trim();
    if (!idea) {
      notify("Enter a story idea first.");
      input.focus();
      return;
    }

    button.disabled = true;
    const originalLabel = button.textContent;
    button.textContent = "Creating your story…";
    notify("Creating your story…");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea })
      });
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); }
      catch { throw new Error("The server returned an unreadable response. Please try again."); }
      if (!response.ok) throw new Error(data.error || "Story creation failed.");

      const title = document.getElementById("resultTitle");
      const logline = document.getElementById("logline");
      const world = document.getElementById("world");
      const characters = document.getElementById("characters");
      const episodes = document.getElementById("episodes");
      const shots = document.getElementById("shots");
      const results = document.getElementById("results");

      if (typeof window.renderStory === "function") {
        window.renderStory(data, idea);
      } else if (title && logline && world && characters && episodes && shots && results) {
        title.textContent = data.title || "Untitled Story";
        logline.textContent = data.logline || "";
        world.textContent = data.world || "";
        characters.textContent = "";
        (data.characters || []).forEach((item) => {
          const row = document.createElement("div");
          row.className = "episode";
          const name = document.createElement("strong");
          name.textContent = item.name || "Character";
          const role = document.createElement("span");
          role.textContent = item.role || "";
          row.append(name, role);
          characters.appendChild(row);
        });
        episodes.textContent = "";
        (data.episodes || []).forEach((item) => {
          const row = document.createElement("div");
          row.className = "episode";
          const heading = document.createElement("strong");
          heading.textContent = (item.number || "") + ". " + (item.title || "Episode");
          const summary = document.createElement("span");
          summary.textContent = item.summary || "";
          row.append(heading, summary);
          episodes.appendChild(row);
        });
        shots.textContent = "";
        (data.scenes || []).forEach((item) => {
          const row = document.createElement("div");
          row.className = "shot";
          const heading = document.createElement("strong");
          heading.textContent = "SHOT " + (item.shot || "");
          const details = document.createElement("div");
          details.textContent = [item.camera, item.action, item.audio].filter(Boolean).join(" · ");
          row.append(heading, details);
          shots.appendChild(row);
        });
        results.classList.add("show");
      } else {
        throw new Error("The story results panel is missing. Refresh the page and retry.");
      }

      window.storyforgeWorldBible = data.world || "";
      window.storyforgeCharacterBible = "";
      if (window.storyforgePipeline && window.storyforgePipeline.write) {
        window.storyforgePipeline.write({title:data.title||"Untitled story",idea:idea,logline:data.logline||"",world:data.world||"",characters:data.characters||[],episodes:data.episodes||[],scenes:data.scenes||[]});
      }
      try {
        localStorage.setItem("storyforge-story-bible", JSON.stringify({world:null,characters:[]}));
        const stored = JSON.parse(localStorage.getItem("storyforge-projects") || "[]");
        const projects = Array.isArray(stored) ? stored : [];
        const titleText = data.title || "Untitled story";
        const existingIndex = projects.findIndex(p => String(p.title || "") === String(titleText) && String(p.idea || "") === String(idea));
        const now = new Date().toISOString();
        const existing = existingIndex >= 0 ? projects[existingIndex] : null;
        const project = {
          ...(existing || {}),
          id: existing ? existing.id : Date.now(),
          title: titleText,
          idea,
          data,
          updatedAt: now,
          workspace: {
            productionBible: JSON.parse(localStorage.getItem("storyforge-production-bible") || "{}"),
            productionState: JSON.parse(localStorage.getItem("storyforge-production-state") || "{}"),
            storyBible: JSON.parse(localStorage.getItem("storyforge-story-bible") || '{"world":null,"characters":[]}')
          }
        };
        const next = [project, ...projects.filter((p, i) => i !== existingIndex)].slice(0, 20);
        localStorage.setItem("storyforge-projects", JSON.stringify(next));
      } catch (storageError) {
        throw new Error("The story was generated, but your browser could not save it. Check browser storage settings and try Save project again.");
      }
      if (typeof window.renderProjects === "function") window.renderProjects();
      if (typeof window.openProjectWorkspace === "function") {
        const projects = JSON.parse(localStorage.getItem("storyforge-projects") || "[]");
        const saved = projects.find(p => String(p.title || "") === String(data.title || "Untitled story") && String(p.idea || "") === String(idea));
        if (saved) window.openProjectWorkspace(saved.id);
      }
      notify(data.generationWarning || "Project saved on this device. Open it from Your Projects.");
      results?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      notify(error && error.message ? error.message : "Story creation failed. Please try again.");
    } finally {
      button.disabled = false;
      button.textContent = originalLabel || "Create story →";
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest && event.target.closest("#generate");
    if (button) runStoryCreation(event);
  }, true);

  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("generate");
    if (button) {
      button.setAttribute("type", "button");
      button.title = "Create a story from your idea";
    }
  });
})();