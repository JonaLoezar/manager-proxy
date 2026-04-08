const express = require("express");
const fetch   = require("node-fetch");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 3000;

const MANAGER_BASE = process.env.MANAGER_BASE || "https://onbsmerino.managermas.cl";
const MANAGER_TOKEN = process.env.MANAGER_TOKEN || "ab9e36a328813ba45e8bb6431b3217648e412049";

app.use(cors());
app.use(express.json());

app.all("/proxy/*", async (req, res) => {
  const path    = req.params[0];
  const qs      = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const url     = `${MANAGER_BASE}/api/${path}/${qs}`;

  try {
    const response = await fetch(url, {
      method:  req.method,
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Token ${MANAGER_TOKEN}`,
      },
      body: ["POST","PUT","PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.status(response.status).set("Content-Type", "application/json").send(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_, res) => res.json({ ok: true, base: MANAGER_BASE }));

app.listen(PORT, () => console.log(`Proxy Manager+ corriendo en puerto ${PORT}`));
