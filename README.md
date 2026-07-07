# Model Screen

Describe what you need an AI model for, in a sentence. Model Screen checks recent model releases against **published evidence** — benchmarks, model cards, third-party trackers — and tells you which models are worth actually testing for *your* use case, which aren't, and where the evidence is silent.

**Screening, not scoring.** Results are an uncalibrated shortlist: admission-to-testing, never endorsements. Third-party-measured evidence outranks vendor claims. Where no evidence exists, we say so — we never guess.

**Docs:** [Live demo](https://join-the-wheel.github.io/model-screen/) · [Methodology](https://join-the-wheel.github.io/model-screen/methodology.html) (the full method: corpus, matching arithmetic, chips, limits) · [FAQ](https://join-the-wheel.github.io/model-screen/faq.html)

## Using Model Screen

The supported surface is the hosted screen: **[join-the-wheel.github.io/model-screen](https://join-the-wheel.github.io/model-screen/)**.

Third-party embedding of the widget is **not offered yet** — the data format, widget API and licensing are still settling pre-1.0. Watch this repo if you want to hear when that changes.

## Architecture notes (maintainers)

The widget (`dist/widget.js`, a `<model-screen>` custom element) has two tiers. Default: everything in the visitor's browser — the matching model (~34MB, cached) downloads on first use. Assisted (`api-base` attribute pointing at a deployed copy of [`server/`](server/)): use-case facets are extracted by gpt-oss-120b (Fireworks, ZDR by default) and embeddings run on hosted bge-m3 (DeepInfra, zero-retention) — multilingual, no browser download, ~$0.0003 per screen. Both components were selected by running the screening methodology on the selection problem itself. If the proxy is unreachable the widget silently falls back to fully-in-browser mode.

Deploy the proxy (Cloud Run):

```bash
gcloud run deploy model-screen-proxy --source server/ --region us-central1   --allow-unauthenticated --max-instances 2   --set-secrets FIREWORKS_API_KEY=fireworks-api-key:latest,DEEPINFRA_API_KEY=deepinfra-api-key:latest
```

## Privacy

Default (tier 0): everything runs in the visitor's browser — the use-case text is embedded locally and matched against a pre-judged evidence corpus shipped with the widget. **Nothing a visitor types leaves the page.** No accounts, no cookies, no telemetry.

Assisted mode (tier 1): the use-case text is sent to the site's own proxy and forwarded only to two zero-retention inference providers (named above); it is never stored or logged.

## How it works

1. Your sentence is split into facets and embedded in-browser (bge-small-en-v1.5 via transformers.js).
2. Each facet retrieves its neighborhood in a corpus of evidence rows — published benchmark results judged offline for what they actually say (including *adverse* evidence: a model's independently measured hallucination rate counts against it, at full weight).
3. Constraint chips (privacy / budget / grounding / faithfulness) act as hard filters and evidence weights — they carry the signals prose embedding measurably drops.
4. Ranked cards show *why* each model screens in, what to watch out for, where it's served, and free ways to try it — every claim with its source link.

Some third-party scores are withheld per the source's terms; we link out instead of storing them.

## Data

`data/` holds the baked corpus: model manifest, judged evidence rows (with per-row source URLs and access dates), and embedding vectors. Current data date is in `data/corpus.json` → `generated`. The corpus is produced by the Model Tracker screening methodology (concept docs and pipeline live upstream); refreshes land here as tagged releases.

## Field reports

Tried a model the screen recommended (or warned you about)? [Open an issue](../../issues/new) with a sentence about how it went — real-workload reports make the next person's screen better. Never required, never gated.

## License

MIT (provisional — the upstream project's open-core licensing decision is tracked separately and may adjust before v1.0).
