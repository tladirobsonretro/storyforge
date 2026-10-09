"use strict";
// The main StoryForge workspace owns project creation, deduplication and rendering.
// Keep this compatibility file lightweight so it cannot overwrite the project list
// or add a fake "pipeline" card after the dashboard has rendered.
document.addEventListener("DOMContentLoaded", function () {
  if (typeof window.renderProjects === "function") window.renderProjects();
});
