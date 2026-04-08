const express = require("express");
const fetch   = require("node-fetch");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 10000;

const MANAGER_BASE  = "https://onbsmerino.managermas.cl";
const MANAGER_TOKEN = "ab9e36a328813ba45e8bb6431b3217648e412049";
const RUT_EMPRESA   = "77101208-6";

const headers = {
  "Content-Type":  "application/json",
  "Authorization": `Token ${MANAGER_TOKEN}`,
};

app.use(cors({ origin: "*" }));
app.use(express.json());

// Función helper para llamar a Manager+
const managerGet = async (path) => {
  const url = `${MANAGER_BASE}${path}`;
  console.log(`[GET] ${url}`);
  const res  = await fetch(url, { headers });
  const data = await res.json();
  return { status: res.status, data };
};

const managerPost = async (path, body) => {
  const url = `${MANAGER_BASE}${path}`;
  console.log(`[POST] ${url}`);
  const res  = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, data };
};

// ── HEALTH ────────────────────────────────────────────────────────────────────
app.get("/health", (_, res) => {
  res.json({ ok: true, base: MANAGER_BASE, rut: RUT_EMPRESA });
});

// ── DOCUMENTOS ────────────────────────────────────────────────────────────────
// GET /documentos?tipo=FAVE&ciclo=V&df=20250901&dt=20251231&details=1&docnumreg=&rut_cliente=
app.get("/documentos", async (req, res) => {
  try {
    const { tipo = "FAVE", ciclo = "V", df, dt, details = "1", docnumreg, rut_cliente } = req.query;
    const params = new URLSearchParams();
    if (df)         params.set("df", df);
    if (dt)         params.set("dt", dt);
    if (details)    params.set("details", details);
    if (docnumreg)  params.set("docnumreg", docnumreg);
    if (rut_cliente)params.set("rut_cliente", rut_cliente);

    const path = `/api/documents/${RUT_EMPRESA}/${tipo}/${ciclo}/?${params.toString()}`;
    const { status, data } = await managerGet(path);
    res.status(status).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// GET /documentos/:docnumreg — documento específico
app.get("/documentos/:tipo/:ciclo/:docnumreg", async (req, res) => {
  try {
    const { tipo, ciclo, docnumreg } = req.params;
    const path = `/api/documents/${RUT_EMPRESA}/${tipo}/${ciclo}/?docnumreg=${docnumreg}&details=1`;
    const { status, data } = await managerGet(path);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PRODUCTOS ─────────────────────────────────────────────────────────────────
// GET /productos?buscar=texto&con_stock=S
app.get("/productos", async (req, res) => {
  try {
    const { buscar, con_stock = "S", con_listaprecios } = req.query;
    const params = new URLSearchParams();
    if (buscar)           params.set("buscar", buscar);
    if (con_stock)        params.set("con_stock", con_stock);
    if (con_listaprecios) params.set("con_listaprecios", con_listaprecios);

    const path = `/api/products/${RUT_EMPRESA}/?${params.toString()}`;
    const { status, data } = await managerGet(path);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CLIENTES / PROVEEDORES ────────────────────────────────────────────────────
// GET /clientes?rut=12345678-9&contacts=1
app.get("/clientes", async (req, res) => {
  try {
    const { rut = "", contacts = "1", con_credito = "1" } = req.query;
    const params = new URLSearchParams({ contacts, con_credito });
    const path = `/api/clients/${RUT_EMPRESA}/${rut}/?${params.toString()}`;
    const { status, data } = await managerGet(path);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── BODEGAS ───────────────────────────────────────────────────────────────────
app.get("/bodegas", async (_, res) => {
  try {
    const { status, data } = await managerGet(`/api/offices/${RUT_EMPRESA}/`);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── COMPROBANTES ──────────────────────────────────────────────────────────────
// GET /comprobantes?df=20250101&dt=20251231
app.get("/comprobantes", async (req, res) => {
  try {
    const { df, dt } = req.query;
    const params = new URLSearchParams();
    if (df) params.set("df", df);
    if (dt) params.set("dt", dt);
    const path = `/api/comprobantes/${RUT_EMPRESA}/?${params.toString()}`;
    const { status, data } = await managerGet(path);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── LISTAS DE PRECIOS ─────────────────────────────────────────────────────────
app.get("/listas-precios", async (_, res) => {
  try {
    const { status, data } = await managerGet(`/api/pricelist/${RUT_EMPRESA}/?dets=1`);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── STOCK ─────────────────────────────────────────────────────────────────────
// GET /stock?cod_producto=PR-1&dets=1
app.get("/stock", async (req, res) => {
  try {
    const { cod_producto = "", dets = "1", dt } = req.query;
    const params = new URLSearchParams({ dets });
    if (dt) params.set("dt", dt);
    const path = `/api/stock/${RUT_EMPRESA}/${cod_producto}/?${params.toString()}`;
    const { status, data } = await managerGet(path);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── TESORERÍA ─────────────────────────────────────────────────────────────────
// GET /tesoreria?df=01-01-2025&dt=31-12-2025
app.get("/tesoreria", async (req, res) => {
  try {
    const { df = "01-01-2025", dt = "31-12-2025" } = req.query;
    const path = `/api/tesoreria/analitico/${RUT_EMPRESA}/${df}/${dt}/`;
    const { status, data } = await managerGet(path);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CREAR DOCUMENTO ───────────────────────────────────────────────────────────
// POST /documentos/crear
app.post("/documentos/crear", async (req, res) => {
  try {
    const body = { ...req.body, rut_empresa: RUT_EMPRESA };
    const { emitir = "S", docnumreg = "S" } = req.query;
    const path = `/api/import/create-document/?emitir=${emitir}&docnumreg=${docnumreg}`;
    const { status, data } = await managerPost(path, body);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CREAR PROCESO (RECAUDACIÓN) ───────────────────────────────────────────────
// POST /procesos/crear
app.post("/procesos/crear", async (req, res) => {
  try {
    const body = { ...req.body, rut_empresa: RUT_EMPRESA };
    const { status, data } = await managerPost("/api/import/create-process/?emitir=S", body);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CREAR CLIENTE ─────────────────────────────────────────────────────────────
// POST /clientes/crear
app.post("/clientes/crear", async (req, res) => {
  try {
    const body = { ...req.body, rut_empresa: RUT_EMPRESA };
    const { status, data } = await managerPost("/api/import/update-client/?sobreescribir=S", body);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── CREAR PRODUCTO ────────────────────────────────────────────────────────────
// POST /productos/crear
app.post("/productos/crear", async (req, res) => {
  try {
    const body = { ...req.body, rut_empresa: RUT_EMPRESA };
    const { status, data } = await managerPost("/api/import/update-product/", body);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── BALANCE ───────────────────────────────────────────────────────────────────
// GET /balance?fecha=31-12-2025&moneda=CLP
app.get("/balance", async (req, res) => {
  try {
    const { fecha = "31-12-2025", moneda = "CLP", tasa_cambio = "1" } = req.query;
    const params = new URLSearchParams({ moneda, tasa_cambio });
    const path = `/api/balance/tributario/${RUT_EMPRESA}/${fecha}/?${params.toString()}`;
    const { status, data } = await managerGet(path);
    res.status(status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Keep-alive — evita que Render duerma el servicio
setInterval(() => {
  fetch(`https://manager-proxy.onrender.com/health`)
    .then(() => console.log("[KEEP-ALIVE] ok"))
    .catch(e => console.log("[KEEP-ALIVE] error:", e.message));
}, 14 * 60 * 1000);

app.listen(PORT, () => console.log(`Proxy Manager+ corriendo en puerto ${PORT}`));
