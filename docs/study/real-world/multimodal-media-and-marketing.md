---
domain: Computer vision
skill: Design and implement image- and video-generation solutions; multimodal understanding workflows; responsible AI for multimodal content
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e
  - https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers
  - https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/overview
  - https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview
  - https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/overview
retrieved: 2026-10-12
---

# Real-world: generating and understanding images and video

Part of [Real-world practice](index.md). Two sides of one media business: **create** assets and **understand** the ones you already have.

## 1. The problem

A retail brand runs hundreds of campaigns a year. Designers spend days producing product backgrounds and size variants, the media library holds 200,000 images and 50,000 videos with poor metadata (nobody can find "the summer launch video where the model holds the blue jacket"), accessibility requires alt text for every image, and legal worries about unsafe or off-brand content and about AI-generated material not being labeled.

**Goals**

- **Generate and edit** images (backgrounds, variants, mask-based edits) and short video clips from a brief and reference media.
- **Describe and search** existing images and videos (captions, segments, transcripts).
- Produce **accessible alt text** and extended descriptions.
- Enforce **safety, brand and provenance** rules.

## 2. Why this is an AI-103 problem

| Need | Skill area |
|---|---|
| Text and reference to image/video; inpainting; editing; platform controls | Image- and video-generation solutions |
| Captions, visual Q&A, alt text, video segment analysis, object regions | Multimodal understanding workflows |
| Unsafe-content filters, prompt injection in images, brand and policy rules | Responsible AI for multimodal content |

## 3. Part A: generation

### Image generation and editing (what Learn documents)

- `dall-e-3` is **retired**; use `gpt-image` series models (the page lists some as GA and some as limited-access preview; check current status for your region).
- **Generate** with a JSON request; **edit** with multipart/form-data and up to **16** input images (PNG or JPG, each under 50 MB).
- **Inpainting** uses a **mask** PNG of the same dimensions as the input: fully transparent areas (alpha 0) are the regions to change. `input_fidelity` controls how closely the output matches the input style and features such as faces (not supported on the mini model).
- Useful parameters: `size`, `quality`, `n` (1 to 10), `output_format` (PNG or JPEG), `background: transparent` (some models).
- Output is returned as base64 (`b64_json`).
- Content moderation applies: harmful prompts do not generate images and you may see `content_policy_violation` or content-filter errors. Photorealistic images of minors are blocked by default.
- **Default quota is low** for some models (5 images per minute per deployment), so queue requests and plan capacity.

### Video generation (Sora 2, Preview)

- Input can be text, images or video; **remix** makes targeted edits to an existing video instead of regenerating it.
- It is an **asynchronous job**: create a job, poll status until `succeeded`, `failed` or `cancelled`, then download the result. Never block a web request on it.
- Because it is Preview, confirm availability and terms before depending on it in production.

### Architecture

```
Creative brief (product, style, channel, size)
      │
      ▼
 Prompt builder (brand rules + template + reference assets)
      │
      ├─► Image generate / edit (mask for inpainting) ──┐
      └─► Video job (create → poll → download)  ────────┤
                                                       ▼
                                  Automated checks
                                   ├─ content safety / guardrails
                                   ├─ brand rules (logo, colors, forbidden symbols)
                                   └─ quality (resolution, artifacts) 
                                                       ▼
                                  Human approval (designers)
                                                       ▼
                       Add provenance / label ─► DAM (media library) ─► publish
```

### Walkthrough: what happens to one generated asset

Example: marketing asks for the blue jacket on a rainy city street, in square and story formats.

1. **Brief becomes a structured request.** Product, setting, lighting, aspect ratios and channel are captured as fields, not free text, so every request is comparable and testable.
2. **The prompt builder applies brand rules.** It fills a tested template and adds the product reference image and constraints (palette, no competitor logos).
3. **A job is queued.** Image calls are rate-limited (low default quota for some models), so a queue spaces them out. Video jobs are asynchronous: you create a job and poll until `succeeded`, `failed` or `cancelled`.
4. **The model generates or edits.** For product fidelity, a **mask** limits the change to the background (transparent mask pixels are edited), so the jacket stays exactly as photographed.
5. **Safety checks run automatically.** Content moderation and guardrails check the output; anything blocked is logged with the reason.
6. **Brand and quality checks run.** A vision model verifies "logo visible", "no prohibited symbol", correct product color, and technical quality (resolution, artifacts).
7. **A designer reviews.** Humans approve anything customer-facing. The prompt, parameters, model, version and reviewer are stored so the asset is reproducible and auditable.
8. **Provenance is added.** The asset is labeled as AI-generated according to policy (content credentials are the likely mechanism, to be verified), then stored in the media library.
9. **Publish.** Channel-specific versions go out; cost per approved asset is recorded.

### Build steps

1. **Turn brand guidelines into rules.** Allowed palettes, logo placement, forbidden symbols, tone, product accuracy. Rules go into prompts *and* automated checks.
2. **Use templates, not free text.** A prompt builder fills a tested template (product, setting, lighting, aspect ratio) so results are consistent and controllable.
3. **Use reference media** for product fidelity; use **mask-based edits** to change only the background and leave the product untouched.
4. **Generate variants in batch** (`n`, sizes per channel) through a queue that respects rate limits.
5. **Check before showing anyone.** Run safety moderation, brand checks (a vision model can verify "logo visible", "no prohibited symbol"), and technical quality.
6. **Keep a human in the loop** for anything customer-facing. Store the prompt, parameters, model, version and reviewer for every asset.
7. **Label AI-generated content.** Provenance metadata (C2PA content credentials) is the likely mechanism; verify what the service adds and how your pipeline preserves and checks it. `[NEEDS VERIFICATION]`
8. **Record costs** per asset and set budgets and quotas.

## 4. Part B: understanding existing media

### Services and when to use them

| Need | Use | What you get |
|---|---|---|
| Describe, caption and answer questions about images | **Multimodal model deployment** (vision-capable) | Concise or detailed captions, alt text, grounded Q&A |
| Describe and index images for search | Content Understanding **`prebuilt-imageSearch`** | One-paragraph description and extracted visual content |
| Index videos | Content Understanding **`prebuilt-videoSearch`** | Automatic **segmentation** by topic or scene shift; per-segment transcript, summaries of people, places and actions |
| Index audio/conversations (including from video) | **`prebuilt-audioSearch`** | Transcript and a summary |
| Custom fields for your domain (for example "products visible") | **Custom analyzer** derived from `prebuilt-image` or `prebuilt-video` | Your schema |
| Face detection/recognition | **Azure Face** (Azure Vision family), with responsible-use limits | Specialized service |

Note: **Image Analysis 4.0 in Azure Vision is deprecated and retires on September 25, 2028**; plan new work on multimodal models and Content Understanding instead.

### Architecture

```
Media library (Blob)
      │
      ▼
 Content Understanding analyzers  (imageSearch / videoSearch / custom)
      │ descriptions, segments, transcripts, fields
      ▼
 Enrichment (alt text, tags, safety flags)
      ▼
 Azure AI Search index  (text + vectors; multimodal search)
      ▼
 Search UI / agent ("find the summer launch video with the blue jacket")
```

### Walkthrough: what happens to one video in the library

Example: `summer-launch-2026.mp4`, 4 minutes long.

1. **The file is registered** with its basic metadata and a copy stays in Blob Storage.
2. **The video analyzer runs.** `prebuilt-videoSearch` first splits the video into **segments** wherever the topic or scene changes, because one summary for a whole video would be too coarse to search.
3. **Each segment is described.** The analyzer produces a **transcript** of the speech and a description of **people, places and actions** (for example "model in a blue jacket crosses a rainy street").
4. **Enrichment adds more.** A second pass writes alt text (short and extended), tags products seen, and adds a safety flag.
5. **Each segment becomes a search record** with start and end time, text, tags and a vector of its description, so a search returns the *moment* in the video, not just the file.
6. **The index is updated** in Azure AI Search with text and vector fields, so keyword ("blue jacket"), meaning ("rain outerwear") and combined queries work.
7. **A user or agent searches.** The query is run as hybrid search; the result links to the video at the matching timestamp.
8. **Quality is verified** with test queries whose right answers are known ("does the correct clip appear in the top 5?").

### Build steps

1. **Start with a sample** of 500 assets across types; define what "good metadata" means (searchable description, products, people, setting, brand-safe flag).
2. **Run the analyzers** and review output with the content team. Tune a custom analyzer for domain fields.
3. **Store per-segment results for video**, with start/end times, so search returns the *moment*, not just the file.
4. **Index into AI Search** with hybrid and vector fields so keyword ("blue jacket"), meaning ("outerwear for rain") and visual content all work. See [retrieval deep dive](../deep-dives/rag-retrieval-and-grounding.md).
5. **Generate alt text** in two lengths: a concise alt text and an extended description. Follow your accessibility guidelines; be factual, describe function and context, avoid "image of". Provide a human review path for important pages.
6. **Backfill in batches**, throttled, with progress tracking; process new uploads as they arrive.
7. **Add safety flags** (unsafe content, sensitive items) so risky assets are not surfaced.

## 5. Responsible AI for multimodal content

- **Filter unsafe visual content** with guardrails and content safety classification, both for generated outputs and uploaded media.
- **Indirect prompt injection through images:** text inside an image (a sign, a screenshot, a hidden watermark) can carry instructions to a multimodal model. Treat extracted text as untrusted data; use guardrail indirect-attack controls where available, and never let image text trigger actions without checks.
- **Brand and policy rules:** watermarks where required, prohibited symbols flagged, brand-usage checks, and review of potentially inappropriate content.
- **People and likeness:** do not generate or edit realistic images of real people without consent and policy approval; keep records.
- **Transparency:** label AI-generated content; keep provenance.

## 6. Quality and operations

| Area | Metric | Method |
|---|---|---|
| Generation | Approval rate by designers, rework rate, brand-rule violations caught before review | Review logs, automated checks |
| Generation | Cost per approved asset | Billing plus review time |
| Understanding | Search success (does the right asset appear in the top 5?) | Test queries with known answers |
| Alt text | Accuracy and usefulness | Accessibility review sample; screen reader users when possible |
| Safety | False negatives on a test set of risky media | Red-team set |

Operational notes: image and video jobs are slow and rate-limited, so use queues, idempotency keys and status tracking; store generation parameters for reproducibility; keep an audit trail for compliance.

## 7. What goes wrong in practice

| Symptom | Likely cause | Fix |
|---|---|---|
| Product looks different in every image | Free-text prompting, no reference | Reference images, masks, templates; verify with a vision check |
| Text in generated images garbled | Model limitation | Add text in post-processing, not in generation |
| Throttled batch | Low default image quota | Queue, backoff, request more quota |
| Video never finishes | Blocked synchronous call or failed job | Async job pattern, handle `failed` and `cancelled` |
| Alt text hallucinated details | Model guessed | Prompt for visible evidence only; review important images |
| Video search returns the whole file | Segments not indexed | Index per-segment results with timestamps |
| Unsafe asset published | Skipped moderation for "trusted" sources | Moderate everything; spot-audit |
| Preview feature changes | Preview API/versioning | Isolate behind an interface; keep a fallback |

## 8. Variations

- **E-commerce catalog:** auto-generate lifestyle backgrounds for product cutouts, then run brand checks.
- **Training and compliance video:** index lectures per segment with transcripts and summaries; build a search assistant. See [knowledge assistant](enterprise-knowledge-assistant.md).
- **Social listening:** analyze user images and videos for brand mentions with safety filters.

## Sources and open items

See the frontmatter. Metrics and the pipeline layout are illustrative. `[NEEDS VERIFICATION]` which gpt-image models are GA in your region, C2PA behavior on generated assets, Sora 2 production availability, and current limits for video analyzers.
