(() => {
  "use strict";
  const KEY = "storyforge-projects";
  function toast(message) {
    const el = document.getElementById("toast");
    if (el) {
      el.textContent = message;
      el.style.display = "block";
    } else {
      window.alert(message);
    }
  }
  function getSaved() {
    const raw = localStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(value)) throw new Error("Saved projects data is invalid.");
    return value;
  }
  function refreshProjectList(projects) {
    const count = document.getElementById("projectCount");
    const list = document.getElementById("projects");
    if (count) count.textContent = projects.length + " saved locally in this browser";
    if (!list) return;
    list.replaceChildren();
    projects.forEach((project) => {
      const row = document.createElement("div");
      row.className = "project";
      row.style.cursor = "pointer";
      row.tabIndex = 0;
      const details = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = project.title || "Untitled story";
      const idea = document.createElement("small");
      idea.textContent = project.idea || "";
      details.append(title, idea);
      const status = document.createElement("span");
      status.className = "status";
      status.textContent = "OPEN";
      row.append(details, status);
      const open = () => {
        if (typeof window.renderStory === "function" && project.data) {
          window.renderStory(project.data, project.idea || "");
          document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
          toast("Saved story opened.");
        } else toast("This saved item cannot be opened.");
      };
      row.addEventListener("click", open);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
      });
      list.appendChild(row);
    });
    const pipeline = document.createElement("div");
    pipeline.className = "project";
    const info = document.createElement("div");
    const heading = document.createElement("strong");
    heading.textContent = "StoryForge pipeline";
    const subtitle = document.createElement("small");
    subtitle.textContent = "World → Character → Story → Asset → Storyboard → Video";
    info.append(heading, subtitle);
    const status = document.createElement("span");
    status.className = "status";
    status.textContent = "BUILDING";
    pipeline.append(info, status);
    list.appendChild(pipeline);
  }
  function saveCurrentStory(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const story = window.currentStory || null;
    const title = document.getElementById("resultTitle")?.textContent?.trim();
    const idea = document.getElementById("idea")?.value?.trim() || "";
    const world = document.getElementById("world")?.textContent || "";
    const characterNodes = [...(document.getElementById("characters")?.children || [])];
    const episodeNodes = [...(document.getElementById("episodes")?.children || [])];
    const shotNodes = [...(document.getElementById("shots")?.children || [])];
    if (!title || (!story && !world && !characterNodes.length && !episodeNodes.length && !shotNodes.length)) {
      toast("Create a story before saving it.");
      return;
    }
    const data = story?.data || {
      title,
      logline: document.getElementById("logline")?.textContent || "",
      world,
      characters: characterNodes.map((el) => ({ name: el.querySelector("strong")?.textContent || "", role: el.querySelector("span")?.textContent || "" })),
      episodes: episodeNodes.map((el) => ({ title: el.querySelector("strong")?.textContent || "", summary: el.querySelector("span")?.textContent || "" })),
      scenes: shotNodes.map((el) => ({ shot: el.querySelector("b, strong")?.textContent || "", action: el.textContent || "" }))
    };
    const savedIdea = story?.idea || idea || title;
    try {
      const projects = getSaved();
      const item = { id: Date.now(), title, idea: savedIdea, data, savedAt: new Date().toISOString() };
      projects.unshift(item);
      const next = projects.slice(0, 20);
      localStorage.setItem(KEY, JSON.stringify(next));
      const verified = getSaved();
      if (!verified.some((p) => p.id === item.id)) throw new Error("Browser did not confirm the save.");
      refreshProjectList(verified);
      toast("Project saved on this device.");
    } catch (error) {
      toast("Save failed: " + (error?.message || "browser storage is unavailable."));
    }
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest && event.target.closest("#saveProjectButton");
    if (button) saveCurrentStory(event);
  }, true);
  document.addEventListener("DOMContentLoaded", () => {
    try { refreshProjectList(getSaved()); }
    catch (error) { toast("Could not read saved projects: " + (error?.message || "storage error")); }
  });
})();