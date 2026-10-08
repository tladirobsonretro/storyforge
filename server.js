const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>StoryForge</title>
        <style>
          body {
            margin: 0;
            background: #0b0b0b;
            color: #fff;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .container {
            max-width: 700px;
            padding: 40px;
            text-align: center;
          }
          h1 { font-size: 56px; margin-bottom: 10px; }
          p { color: #aaa; font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>StoryForge</h1>
          <p>Build worlds. Create characters. Tell stories.</p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(\`StoryForge running on port \${PORT}\`);
});
