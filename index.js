const express = require("express");
const fetch   = require("node-fetch");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 10000;

const MANAGER_BASE  = "https://onbsmerino.managermas.cl";
const MANAGER_TOKEN = "ab9e36a328813ba45e8bb6431b3217648e412049";

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_, res) => res.json({ ok: true, base: MANAGER_BASE }));

// Proxy — reenvía todo lo que llegue a /proxy/* hacia Manager+
app.all("/proxy/*", async (req, res) => {
  // Extraer el path después de /proxy
  const path = req.path.replace("/proxy", "");
  
  // Construir URL completa con query string
  const qs  = Object.keys(req.query).length ? "?" + new URLSearchParams(req.query).toString() : "";
  const url = `${MANAGER_BASE}/api${path}${qs}`;

  console.log(`[PROXY] ${req.method} ${url}`);

  try {
    const options = {
      method:  req.method,
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Token ${MANAGER_TOKEN}`,
      },
    };

    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);
    const text     = await response.text();

    console.log(`[PROXY] Respuesta: ${response.status}`);

    res
      .status(response.status)
      .set("Content-Type", "application/json")
      .send(text);

  } catch (err) {
    console.error(`[PROXY] Error: ${err.message}`);
    res.status(500).json({ error: err.message, url });
  }
});

app.listen(PORT, () => console.log(`Proxy Manager+ corriendo en puerto ${PORT}`));
