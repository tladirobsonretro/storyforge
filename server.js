const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 10000;
app.disable("x-powered-by");
app.use(express.static(__dirname));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "cornerco.html")));
app.get("/health", (_req, res) => res.json({ ok: true, app: "CornerCo" }));
app.listen(PORT, "0.0.0.0", () => console.log(`CornerCo running on ${PORT}`));
