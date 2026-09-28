const api = globalThis.browser ?? globalThis.chrome;
const $ = id => document.getElementById(id);
const statusEl = $("status"), out = $("out"), btn = $("go");

// ---- Keyword clause finder (works even if the server is down) ----
const CLAUSES = {
  "Arbitration / class-action waiver": /arbitration|class[- ]action|waive.{0,30}jury/i,
  "Auto-renewal / recurring charges": /auto(matic(ally)?)?[- ]renew|recurring (charge|billing|payment)|automatically (charged|billed)/i,
  "Data sharing / selling": /third[- ]part(y|ies)|sell.{0,20}(data|information)|share.{0,30}(data|information)|advertis(er|ing) partners/i,
  "Liability limits": /limitation of liability|not (be )?liable|disclaim.{0,20}warrant|as[- ]is/i,
  "Content license / IP rights": /perpetual|irrevocable|royalty[- ]free|sublicens/i,
  "Cancellation / refunds": /non[- ]refundable|no refunds?|cancel(l)?ation (fee|policy)/i,
  "Changes without notice": /(modify|change|update).{0,40}(at any time|without (prior )?notice|sole discretion)/i,
};

function findClauses(text) {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]/g) || [];
  const found = [];
  for (const [label, re] of Object.entries(CLAUSES)) {
    const hit = sentences.find(s => re.test(s) && s.length < 500);
    if (hit) found.push({ label, sentence: hit.trim() });
  }
  return found;
}

function renderFlags(clauses) {
  const box = $("flags");
  box.textContent = "";
  $("flagsTitle").hidden = clauses.length === 0;
  for (const c of clauses) {
    const d = document.createElement("div"); d.className = "flag";
    const b = document.createElement("b"); b.textContent = c.label;
    const s = document.createElement("span"); s.textContent = c.sentence;
    d.append(b, s); box.append(d);
  }
}

async function getInstallId() {
  let { installId } = await api.storage.local.get("installId");
  if (!installId) {
    installId = crypto.randomUUID();
    await api.storage.local.set({ installId });
  }
  return installId;
}

async function init() {
  const { consented } = await api.storage.local.get("consented");
  $("consent").hidden = !!consented;
  $("main").hidden = !consented;
}
$("accept").onclick = async () => { await api.storage.local.set({ consented: true }); init(); };

btn.onclick = async () => {
  btn.disabled = true;
  out.textContent = ""; renderFlags([]);
  try {
    statusEl.textContent = "Reading page…";
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    const [{ result: text }] = await api.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText,
    });
    if (!text || text.trim().length < 200) {
      statusEl.textContent = "This page has too little text to summarize.";
      return;
    }
    renderFlags(findClauses(text));

    statusEl.textContent = "Summarizing…";
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Install-Id": await getInstallId() },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
    out.textContent = data.summary;
    statusEl.textContent = "";
  } catch (e) {
    statusEl.textContent = "Couldn't summarize: " + e.message + " (keyword flags below still work)";
  } finally {
    btn.disabled = false;
  }
};

init();
