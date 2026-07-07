// <model-screen> — embeddable AI-model screening widget.
// Install:  <script type="module" src="https://cdn.jsdelivr.net/gh/Join-The-Wheel/model-screen@v0.2.0/dist/widget.js"></script>
//           <model-screen></model-screen>
// Everything runs in the visitor's browser: the matcher model (~34MB, cached)
// downloads only on first use; the visitor's text never leaves the page.
// Data + methodology: https://github.com/Join-The-Wheel/model-screen

const DATA_BASE = new URL('../data/', import.meta.url).href;
const REPO = 'https://github.com/Join-The-Wheel/model-screen';
const SITE = 'https://join-the-wheel.github.io/model-screen';
const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

const AXIS_GROUPS = {
  task7: ['lookup', 'condense', 'compare', 'procedural', 'artifact', 'evaluate', 'meta'],
  difficulty3: ['easy', 'medium', 'hard_plus'],
  retrieval_mode: ['none', 'knowledge', 'knowledge_web'],
  responseMode: ['direct', 'reasoned'],
  outputFormat: ['conversation', 'single_action', 'task_list', 'document_draft', 'document_analysis'],
};

const CSS = `
  :host { all: initial; display: block;
    --ink:#1a1a18; --muted:#6b6a64; --faint:#8f8e86; --line:#e2e1da; --card:#ffffff;
    --accent:#0f6e56; --accent-bg:#e1f5ee; --accent-line:#bfe4d6;
    --warn:#993c1d; --warn-bg:#faece7; --chip-on:#e1f5ee;
    font:16px/1.6 system-ui,-apple-system,sans-serif; color:var(--ink); }
  @media (prefers-color-scheme: dark) { :host {
    --ink:#ecebe4; --muted:#a5a49b; --faint:#7d7c74; --line:#33332f; --card:#252523;
    --accent:#4dbf9c; --accent-bg:#12352b; --accent-line:#1d5443;
    --warn:#f0997b; --warn-bg:#3a2118; --chip-on:#12352b; } }
  * { box-sizing:border-box; }
  .examples { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 10px; }
  .ex { font-size:13px; color:var(--muted); border:1px dashed var(--line); background:none; border-radius:999px;
        padding:5px 12px; cursor:pointer; font-family:inherit; }
  .ex:hover { color:var(--accent); border-color:var(--accent-line); }
  textarea { width:100%; min-height:88px; padding:13px 15px; font:inherit; color:inherit; border:1.5px solid var(--line);
             border-radius:12px; resize:vertical; background:var(--card); }
  textarea:focus { outline:none; border-color:var(--accent); }
  .chips { display:flex; flex-wrap:wrap; gap:8px; margin:12px 0 6px; }
  .chip { border:1px solid var(--line); background:var(--card); color:var(--ink); border-radius:999px; padding:7px 15px;
          font-size:14px; font-family:inherit; cursor:pointer; }
  .chip:hover { border-color:var(--accent); }
  .chip[aria-pressed="true"] { background:var(--chip-on); border-color:var(--accent); color:var(--accent); font-weight:600; }
  .chiphint { font-size:12.5px; color:var(--faint); margin:0 0 14px; }
  .linklike { background:none; border:none; padding:0; font:inherit; font-size:12.5px; color:var(--accent); cursor:pointer;
              text-decoration:underline; text-underline-offset:2px; }
  .how { margin:14px 0 0; border:1px solid var(--line); border-radius:12px; background:var(--card); }
  .how > summary { padding:11px 15px; font-size:14px; font-weight:600; color:var(--ink); }
  .how > summary:hover { color:var(--accent); }
  .how > div { padding:2px 17px 15px; font-size:14px; color:var(--muted); line-height:1.6; }
  .how ol { margin:.4rem 0 .9rem; padding-left:1.25rem; }
  .how li { margin:.4rem 0; }
  .how strong, .how dt { color:var(--ink); }
  .how dl { margin:.3rem 0 .9rem; }
  .how dt { font-weight:600; margin-top:.55rem; }
  .how dd { margin:0; }
  .how a { color:var(--accent); text-decoration:none; }
  .how a:hover { text-decoration:underline; }
  .banner a { color:inherit; text-decoration:underline; text-underline-offset:2px; }
  .row { display:flex; align-items:center; flex-wrap:wrap; gap:12px; }
  .go { font:inherit; font-weight:600; background:var(--accent); color:#fff; border:0; border-radius:10px;
        padding:11px 24px; cursor:pointer; }
  .go:disabled { opacity:.5; cursor:wait; }
  .status { font-size:13px; color:var(--muted); }
  .mode { font-size:13px; color:var(--muted); display:flex; align-items:center; gap:6px; }
  .mode select, .how select { font:inherit; font-size:13px; color:inherit; background:var(--card); border:1px solid var(--line);
                 border-radius:8px; padding:3px 6px; }
  .banner { font-size:13px; color:var(--muted); border:1px dashed var(--line); border-radius:12px;
            padding:11px 15px; margin:1.6rem 0 1.1rem; background:var(--card); }
  .readback { font-size:14px; color:var(--muted); margin:0 0 14px; }
  .facet { display:inline-block; background:var(--card); border:1px solid var(--line); border-radius:6px;
           padding:1px 8px; margin:2px 3px 2px 0; font-size:13px; }
  .summary { font-size:14px; color:var(--muted); margin:0 0 16px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px 20px; margin:0 0 14px; }
  .head { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
  .rank { flex:none; width:26px; height:26px; border-radius:8px; background:var(--accent-bg); color:var(--accent);
          font-size:14px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; align-self:center; }
  h3 { margin:0; font-size:18px; font-weight:650; }
  h3 a { color:inherit; text-decoration:none; border-bottom:1px solid var(--line); }
  h3 a:hover { border-color:var(--accent); color:var(--accent); }
  .pill { display:inline-block; font-size:11.5px; border-radius:999px; padding:2.5px 10px; font-weight:600; }
  .pill.thin { background:var(--warn-bg); color:var(--warn); }
  .pill.cov  { background:var(--accent-bg); color:var(--accent); }
  .meta { font-size:13px; color:var(--muted); margin:4px 0 0; }
  .sect { margin:12px 0 0; }
  .h { font-size:12px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:var(--faint); margin:0 0 5px; }
  .evd { font-size:14px; margin:3px 0; padding-left:18px; position:relative; }
  .evd::before { content:"↳"; position:absolute; left:0; color:var(--faint); }
  .evd.bad::before { content:"⚠"; color:var(--warn); }
  .evd.bad { color:var(--warn); }
  .bm { color:var(--muted); }
  .evd a { color:var(--accent); text-decoration:none; }
  .evd a:hover { text-decoration:underline; }
  .srcbadge { font-size:11px; border:1px solid var(--line); border-radius:5px; padding:0 5px; color:var(--faint); white-space:nowrap; }
  .srcbadge.tp { color:var(--accent); border-color:var(--accent-line); }
  .try { display:flex; flex-wrap:wrap; gap:7px; margin-top:4px; }
  .try a { font-size:13px; color:var(--accent); background:var(--accent-bg); border:1px solid var(--accent-line);
           border-radius:999px; padding:4px 13px; text-decoration:none; font-weight:600; }
  .try a.sec { background:none; border-color:var(--line); color:var(--muted); font-weight:500; }
  .try a.sec:hover { color:var(--accent); border-color:var(--accent-line); }
  .note { font-size:12.5px; color:var(--faint); }
  details { margin-top:10px; }
  summary { font-size:13px; color:var(--muted); cursor:pointer; }
  summary:hover { color:var(--accent); }
  .none { color:var(--muted); font-size:14.5px; }
  .fb { margin-top:2.5rem; border-top:1px solid var(--line); padding-top:1.4rem; }
  .foot { margin-top:2.75rem; font-size:12.5px; color:var(--faint); border-top:1px solid var(--line); padding-top:1.1rem; line-height:1.7; }
  .foot a { color:var(--muted); }
`;

const HTML = `
  <div class="examples" part="examples">
    <button class="ex">Summarize legal contracts, flag risky clauses — privately</button>
    <button class="ex">Support bot over our docs that never makes things up</button>
    <button class="ex">Cheap high-volume ticket classification</button>
    <button class="ex">Long-form research reports with citations</button>
  </div>
  <textarea id="q" aria-label="Describe your use case" placeholder="e.g. Summarize long legal contracts and flag risky clauses. Privacy matters and budget is tight."></textarea>
  <div class="chips" role="group" aria-label="Constraints">
    <button class="chip" data-k="grounded" aria-pressed="false" title="Steers matching toward grounded (answers-from-your-documents) evidence and away from closed-book trivia tests">answers from my docs/data</button>
    <button class="chip" data-k="privacy" aria-pressed="false" title="Hard filter: removes every API-only model and anything impractical to self-host, before scoring — exclusions are listed with reasons">must run privately / self-host</button>
    <button class="chip" data-k="budget" aria-pressed="false" title="Published price ≲$3 per million output tokens nudges a model up; ≳$15 pushes it down">budget-sensitive</button>
    <button class="chip" data-k="faithful" aria-pressed="false" title="Brings in all fabrication/hallucination evidence at full weight; if none exists for a model, flags it 'test before trusting'">must not make things up</button>
  </div>
  <p class="chiphint">Chips are guarantees, not hints — each filters or re-weights models directly, skipping text understanding. <button class="linklike" id="chipsWhy" type="button">what each chip does</button></p>
  <div class="row">
    <button class="go" id="go">Screen models</button>
    <span class="status" id="status" role="status"></span>
  </div>
  <details class="how" id="how">
    <summary>How this works — what you'll get and how it's calculated</summary>
    <div>
      <ol>
        <li><strong>Read.</strong> Your sentence is split into facets — the capabilities, constraints and quality bars you stated. The results begin by reading these back, so a misread is visible instead of silent.</li>
        <li><strong>Match.</strong> Each facet retrieves the closest rows from a corpus of judged published evidence — benchmark results, model-card claims and third-party measurements for recent releases (<span id="corpusStats">hundreds of rows across ~two dozen models</span>) — every row carrying its source link.</li>
        <li><strong>Filter &amp; weigh.</strong> Chips apply first (below). Then each matched row counts by how closely it matches, how much it's worth, and which way it cuts — <strong>adverse findings weigh 1.6×</strong> favorable ones, and third-party measurements outrank vendor claims.</li>
        <li><strong>Rank.</strong> Models with at least 2 matched rows are ranked and the top 5 shown (beyond that, differences are noise). Models with less evidence are listed as "not enough evidence" — never silently scored zero. Ranks mean "strongest published case," never "will perform best" — no scores or grades, because a paper screen can order candidates but can't measure them.</li>
      </ol>
      <p class="h">What each chip does</p>
      <dl>
        <dt>answers from my docs/data</dt><dd>steers matching toward grounded (RAG / document) evidence, away from closed-book trivia</dd>
        <dt>must run privately / self-host</dt><dd><strong>hard filter</strong> — removes API-only and impractical-to-host models before scoring; exclusions listed with reasons</dd>
        <dt>budget-sensitive</dt><dd>published price ≲$3/M output tokens nudges up; ≳$15/M pushes down</dd>
        <dt>must not make things up</dt><dd>pulls in all faithfulness evidence: measured problems push the model down with a visible warning; no evidence at all → an explicit "test before trusting"</dd>
      </dl>
      <p class="h">Matching mode (advanced)</p>
      <p style="margin:.3rem 0 .5rem"><select id="modeSel" aria-label="Matching mode"><option value="free" selected>evidence-direct (default)</option><option value="axis">axis-mapped</option></select></p>
      <p style="margin:0">Evidence-direct matches your facets straight against evidence rows — flexible, handles anything you can phrase. Axis-mapped first classifies your use case onto a fixed workload grid (task × difficulty × retrieval × response × format), then scores by evidence support for that shape — stiffer, but phrasing-independent.</p>
      <p style="margin:.9rem 0 0">Full write-ups: <a href="${SITE}/methodology.html" target="_blank" rel="noopener">Methodology</a> · <a href="${SITE}/faq.html" target="_blank" rel="noopener">FAQ</a> · <a href="${REPO}" target="_blank" rel="noopener">data &amp; source</a></p>
    </div>
  </details>
  <div class="banner">Screening, not scoring: an <strong>uncalibrated</strong> shortlist from published evidence (data date <span id="dataDate">…</span>) — admission to testing, never endorsement. Where no evidence exists we say so; we never guess. Test before you trust. <a href="${SITE}/methodology.html" target="_blank" rel="noopener">How it's calculated</a> · <a href="${SITE}/faq.html" target="_blank" rel="noopener">FAQ</a></div>
  <div id="out" aria-live="polite"></div>
  <div class="fb" id="fbWrap" style="display:none">
    <strong style="font-size:15px">Tried one of these?</strong>
    <p class="none" style="margin:4px 0 8px">A sentence about how it actually went makes the next person's screen better. Never required.</p>
    <a class="go" style="display:inline-block; text-decoration:none" id="fbLink" target="_blank" rel="noopener">Share what happened ↗</a>
  </div>
  <div class="foot">Evidence: vendor announcements, model cards, and open trackers — every claim carries its source link. Some third-party scores are withheld per the source's terms; we link out instead. Recommendations are admission-to-testing, never endorsements. <a href="${SITE}/methodology.html" target="_blank" rel="noopener">Methodology</a> · <a href="${SITE}/faq.html" target="_blank" rel="noopener">FAQ</a> · <a href="${REPO}" target="_blank" rel="noopener">Data &amp; source</a></div>
`;

class ModelScreen extends HTMLElement {
  constructor() {
    super();
    this.state = { chips: { grounded: false, privacy: false, budget: false, faithful: false } };
    this.ready = null;
    // Optional tier-1: <model-screen api-base="https://your-proxy"> upgrades to
    // server-side facet extraction (gpt-oss) + hosted multilingual embeddings
    // (bge-m3). Absent or unreachable, the widget runs fully in-browser.
    this.apiBase = null;
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);
    const wrap = document.createElement('div');
    wrap.innerHTML = HTML;
    root.appendChild(wrap);
    this.$ = (id) => root.getElementById(id);
    root.querySelectorAll('.chip').forEach((c) =>
      c.addEventListener('click', () => {
        this.state.chips[c.dataset.k] = !this.state.chips[c.dataset.k];
        c.setAttribute('aria-pressed', String(this.state.chips[c.dataset.k]));
      })
    );
    root.querySelectorAll('.ex').forEach((b) =>
      b.addEventListener('click', () => { this.$('q').value = b.textContent; this.$('q').focus(); })
    );
    this.$('q').addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') this.$('go').click(); });
    this.$('go').addEventListener('click', () => this.screen());
    this.$('chipsWhy').addEventListener('click', () => {
      const d = this.$('how');
      d.open = true;
      d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  connectedCallback() {
    // attributes are not readable in the constructor for createElement-built
    // elements — resolve the tier here instead
    this.apiBase = (this.getAttribute('api-base') || '').replace(/\/+$/, '') || null;
    this.setStatusIdle();
  }

  // The privacy statement must match the tier actually in effect — the two
  // modes make different promises and conflating them would be a lie.
  setStatusIdle() {
    this.$('status').textContent = this.apiBase
      ? 'assisted mode: your text goes only to two zero-retention AI providers — never stored'
      : 'runs entirely in your browser — nothing you type leaves this page';
  }

  // Heavy assets load on first use, never on page load — embedding this widget
  // must not cost the host page anything until a visitor actually engages.
  load() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      this.$('status').textContent = 'loading data…';
      const j = (f) => fetch(DATA_BASE + f).then((r) => r.json());
      const [axes, corpus, glosses, providers] = await Promise.all([
        j('axes-vectors.json'), j('corpus.json'), j('gloss-vectors.json'),
        fetch(DATA_BASE + 'providers.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
      ]);
      Object.assign(this, { axes, corpus, glosses, providers });
      this.evidenceById = Object.fromEntries(corpus.evidence.map((e) => [e.id, e]));
      this.$('dataDate').textContent = corpus.generated;
      this.$('corpusStats').textContent =
        `${corpus.evidence.length} judged rows across ${corpus.models.length} releases, as of ${corpus.generated}`;
      if (this.apiBase) {
        const [gm3, am3] = await Promise.all([j('gloss-vectors-m3.json'), j('axes-vectors-m3.json')]);
        this.glosses = gm3; this.axes = am3;
      } else {
        const { pipeline, env } = await import(TRANSFORMERS_CDN);
        env.allowLocalModels = false;
        this.embedder = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', {
          progress_callback: (p) => {
            if (p.status === 'progress' && p.file?.endsWith('.onnx'))
              this.$('status').textContent = `loading matcher… ${Math.round(p.progress)}% (first use only — cached after)`;
          },
        });
      }
    })();
    return this.ready;
  }

  async api(path, body) {
    const r = await fetch(this.apiBase + path, { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('proxy ' + r.status);
    return r.json();
  }
  async embedBatch(texts) {
    if (this.apiBase) return (await this.api('/embed', { texts })).vectors;
    const out = [];
    for (const t of texts) out.push(Array.from((await this.embedder(t, { pooling: 'mean', normalize: true })).data));
    return out;
  }
  async getFacets(q) {
    if (this.apiBase) {
      try {
        const d = await this.api('/facets', { text: q });
        const texts = (d.facets || []).map((f) => f.text).filter(Boolean);
        if (texts.length) return texts.slice(0, 8);
        return [];
      } catch { /* fall through to rule-based */ }
    }
    return this.splitFacets(q);
  }

  cos(a, b) { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return d / (Math.sqrt(na) * Math.sqrt(nb)); }
  async embed(t) { return (await this.embedBatch([t]))[0]; }
  esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  splitFacets(q) {
    const parts = q.split(/[.;!?\n]+/)
      .flatMap((s) => s.split(/,| and | but | plus | while | — | - /i))
      .map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 2);
    const facets = [...new Set(parts)].slice(0, 6);
    return facets.length ? facets : [q.trim()];
  }

  async matchEvidenceDirect(q) {
    const facets = await this.getFacets(q);
    if (!facets.length) return { facets: ['(no screenable use case found)'], perModel: {} };
    const vecs = await this.embedBatch(facets);
    const perModel = {};
    for (let fi = 0; fi < facets.length; fi++) {
      const hits = Object.entries(this.glosses.vectors)
        .map(([id, v]) => [id, this.cos(vecs[fi], v)])
        .sort((a, b) => b[1] - a[1]).slice(0, 12).filter(([, s]) => s >= 0.45);
      for (const [id, s] of hits) {
        const e = this.evidenceById[id];
        if (!e) continue;
        const m = (perModel[e.model] ||= { score: 0, hits: {} });
        const sign = e.rowDir === 'low' ? -1.6 : e.rowDir === 'mixed' ? 0.2 : 1;
        const contrib = (s - 0.4) * (e.rowW || 0.5) * sign;
        m.score += contrib;
        if (!m.hits[id] || Math.abs(contrib) > Math.abs(m.hits[id])) m.hits[id] = contrib;
      }
    }
    return { facets, perModel };
  }

  axisProfile(qv) {
    const T = 0.025, profile = {};
    for (const [group, values] of Object.entries(AXIS_GROUPS)) {
      const sims = values.map((v) => [`${group}.${v}`, this.cos(qv, this.axes.vectors[`${group}.${v}`])]);
      const hi = Math.max(...sims.map((s) => s[1]));
      const exps = sims.map(([av, s]) => [av, Math.exp((s - hi) / T)]);
      const z = exps.reduce((a, [, e]) => a + e, 0);
      for (const [av, e] of exps) if (e / z >= 0.12) profile[av] = +(e / z).toFixed(3);
    }
    if (this.state.chips.grounded) {
      delete profile['retrieval_mode.none'];
      profile['retrieval_mode.knowledge'] = Math.max(profile['retrieval_mode.knowledge'] || 0, 0.8);
      delete profile['task7.meta'];
    }
    return profile;
  }

  async matchAxisMapped(q) {
    const profile = this.axisProfile((await this.embedBatch([q]))[0]);
    const perModel = {};
    for (const m of this.corpus.models) {
      const sup = this.corpus.support[m.slug] || {};
      const entry = { score: 0, hits: {} };
      for (const [av, match] of Object.entries(profile)) {
        const s = sup[av];
        if (!s) continue;
        entry.score += match * s.s;
        for (const id of s.ids.slice(0, 2)) entry.hits[id] = (entry.hits[id] || 0) + match * s.s;
      }
      perModel[m.slug] = entry;
    }
    const facets = Object.entries(profile).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([av, w]) => `${av.split('.')[1]} ${(w * 100) | 0}%`);
    return { facets, perModel };
  }

  assemble(perModel) {
    const { privacy, budget, faithful } = this.state.chips;
    const results = [], excluded = [], insufficient = [];
    const priceHigh = (p) => { const m = [...(p || '').matchAll(/\$([0-9.]+)/g)].map((x) => +x[1]); return m.length ? Math.max(...m) : null; };
    for (const m of this.corpus.models) {
      if (m.availability !== 'ga') { excluded.push({ m, reason: m.availability === 'limited-preview' ? 'limited preview — no public access yet' : 'no public API or download' }); continue; }
      if (privacy && !(m.boundary || []).includes('hosted_oss')) { excluded.push({ m, reason: 'API-only — cannot run privately' }); continue; }
      if (privacy && m.selfHostClass === 'cluster') { excluded.push({ m, reason: 'open weights, but cluster-scale — impractical to self-host' }); continue; }
      const entry = perModel[m.slug] || { score: 0, hits: {} };
      let { score } = entry;
      let faithNote = null;
      if (faithful) {
        const fRows = this.corpus.evidence.filter((e) => e.model === m.slug && e.tags.includes('faithfulness'));
        const adverse = fRows.filter((e) => e.rowDir === 'low');
        const positive = fRows.filter((e) => e.rowDir === 'high');
        if (adverse.length) { score -= 0.6; adverse.forEach((e) => { entry.hits[e.id] = -1; }); faithNote = 'adverse faithfulness evidence — see warnings'; }
        else if (positive.length) { score += 0.25; positive.forEach((e) => { entry.hits[e.id] = Math.max(entry.hits[e.id] || 0, 0.5); }); faithNote = 'independent faithfulness evidence in its favor'; }
        else faithNote = 'no faithfulness evidence exists — test before trusting';
      }
      if (budget) {
        const hi = priceHigh(m.pricing);
        if (hi != null) score += hi <= 3 ? 0.2 : hi >= 15 ? -0.3 : 0;
      }
      const evidenceN = Object.keys(entry.hits).length;
      if (evidenceN < 2) { insufficient.push({ m }); continue; }
      results.push({ m, score: +score.toFixed(3), evidenceN, hits: entry.hits, faithNote });
    }
    results.sort((a, b) => b.score - a.score);
    return { results, excluded, insufficient };
  }

  srcBadge(e) {
    const tp = /third-party|leaderboard/i.test(e.sourceClass);
    const label = tp ? 'third-party' : /vendor/i.test(e.sourceClass) ? 'vendor' : (e.sourceClass.split(/[ (]/)[0] || 'source');
    const tip = tp ? 'Measured by someone other than the vendor — the strongest evidence class here'
      : label === 'vendor' ? 'Vendor-reported — best case by construction; weighted accordingly'
      : 'Community-relayed or secondary source';
    return `<span class="srcbadge${tp ? ' tp' : ''}" title="${this.esc(tip)} — full provenance: ${this.esc(e.sourceClass)}">${this.esc(label)}</span>`;
  }
  evidenceLine(e, bad) {
    const score = e.scoreWithheld
      ? `<a href="${this.esc(e.url)}" target="_blank" rel="noopener">score at source</a> <span class="note">(withheld per source terms)</span>`
      : this.esc(e.score);
    return `<div class="evd${bad ? ' bad' : ''}">${this.esc(e.gloss)} <span class="bm">— ${this.esc(e.benchmark)}: ${score}</span> ${this.srcBadge(e)} <a href="${this.esc(e.url)}" target="_blank" rel="noopener">source</a></div>`;
  }
  card(r, rank) {
    const esc = this.esc.bind(this);
    const prov = this.providers[r.m.slug] || {};
    const hits = Object.entries(r.hits).map(([id, c]) => ({ e: this.evidenceById[id], c })).filter((x) => x.e);
    const why = hits.filter((x) => x.c > 0).sort((a, b) => b.c - a.c).slice(0, 4);
    const warn = hits.filter((x) => x.c < 0).sort((a, b) => a.c - b.c).slice(0, 3);
    const all = this.corpus.evidence.filter((e) => e.model === r.m.slug);
    const titleLink = prov.docs || r.m.announcementUrl;
    const free = (prov.freeAccess || []).slice(0, 4);
    const provs = (prov.providers || []).slice(0, 4);
    return `<div class="card">
      <div class="head"><span class="rank">${rank}</span>
        <h3>${titleLink ? `<a href="${esc(titleLink)}" target="_blank" rel="noopener">${esc(r.m.name)}</a>` : esc(r.m.name)}</h3>
        <span class="pill cov" title="How many judged evidence rows matched your facets — coverage, not quality">${r.evidenceN} matched evidence rows</span>
        ${r.evidenceN < 4 ? '<span class="pill thin" title="Fewer than 4 matched rows — one enthusiastic benchmark can carry the rank; worth five minutes in a playground, not a shortlist spot">thin evidence — a lead, not a verdict</span>' : ''}</div>
      <p class="meta">${esc(r.m.vendor)} · ${esc(r.m.released)} · ${r.m.weights === 'open' ? `open weights (${esc(r.m.license || 'license unclear')})` : 'API-only'} · ${esc(r.m.contextWindow)} context · ${esc(r.m.pricing)}${r.m.notes ? ' · ' + esc(r.m.notes) : ''}</p>
      ${why.length ? `<div class="sect"><p class="h">Why it screens in</p>${why.map((x) => this.evidenceLine(x.e, false)).join('')}</div>` : ''}
      ${warn.length ? `<div class="sect"><p class="h">Watch out</p>${warn.map((x) => this.evidenceLine(x.e, true)).join('')}</div>` : ''}
      ${r.faithNote ? `<div class="sect"><p class="h">Faithfulness</p><p class="evd" style="padding-left:0">${esc(r.faithNote)}</p></div>` : ''}
      ${free.length ? `<div class="sect"><p class="h">Try it free</p><div class="try">${free.map((f) => `<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a>`).join('')}</div></div>` : ''}
      ${provs.length ? `<div class="sect"><p class="h">Available via</p><div class="try">${provs.map((p) => `<a class="sec" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a>`).join('')}${prov.pricingUrl ? `<a class="sec" href="${esc(prov.pricingUrl)}" target="_blank" rel="noopener">pricing</a>` : ''}</div></div>` : ''}
      <details><summary>All ${all.length} evidence rows for this model</summary>${all.map((e) => this.evidenceLine(e, e.rowDir === 'low')).join('')}</details>
    </div>`;
  }

  render({ results, excluded, insufficient }, facets, mode) {
    const esc = this.esc.bind(this);
    const top = results.slice(0, 5);
    let h = `<p class="readback">We read your use case as ${mode === 'free' ? 'these facets' : 'this workload shape'}: ${facets.map((f) => `<span class="facet">${esc(f)}</span>`).join('')} <span class="note">— imperfect by design; the chips carry what prose can't.</span></p>`;
    h += `<p class="summary">Screened ${this.corpus.models.length} recent releases → ${top.length} worth testing${excluded.length ? ` · ${excluded.length} excluded by your constraints` : ''}${insufficient.length ? ` · ${insufficient.length} lacked relevant published evidence` : ''}</p>`;
    if (!top.length) h += `<p class="none">Nothing clears the screen with adequate evidence — which is itself the honest answer. Loosen a constraint, or treat this use case as test-it-yourself territory.</p>`;
    h += top.map((r, i) => this.card(r, i + 1)).join('');
    if (insufficient.length) h += `<details><summary>${insufficient.length} models had too little relevant published evidence to rank (absence is a finding, not a zero)</summary><p class="none">${insufficient.map((x) => esc(x.m.name)).join(' · ')}</p></details>`;
    if (excluded.length) h += `<details><summary>${excluded.length} models excluded before scoring (your constraints)</summary><p class="none">${excluded.map((x) => `${esc(x.m.name)} — ${esc(x.reason)}`).join('<br>')}</p></details>`;
    this.$('out').innerHTML = h;
    const body = encodeURIComponent(`**Model tried:**\n\n**What I used it for:** ${this.$('q').value.slice(0, 300)}\n\n**How it went:**\n\n**Formal results (optional):**\n`);
    this.$('fbLink').href = `${REPO}/issues/new?title=${encodeURIComponent('Field report: <model>')}&body=${body}`;
    this.$('fbWrap').style.display = 'block';
  }

  async screen() {
    const q = this.$('q').value.trim();
    if (!q) return;
    this.$('go').disabled = true;
    try {
      await this.load();
      this.$('status').textContent = 'screening…';
      const mode = this.$('modeSel').value;
      const { facets, perModel } = mode === 'free' ? await this.matchEvidenceDirect(q) : await this.matchAxisMapped(q);
      this.render(this.assemble(perModel), facets, mode);
      this.$('status').textContent = 'done — rerun any time';
    } catch (e) {
      if (this.apiBase) {
        this.apiBase = null; this.ready = null;
        this.$('status').textContent = 'assisted mode unavailable — retrying fully in-browser…';
        this.$('go').disabled = false;
        return this.screen();
      }
      this.$('status').textContent = 'something failed to load — check connection and retry';
    } finally {
      this.$('go').disabled = false;
    }
  }
}

customElements.define('model-screen', ModelScreen);
