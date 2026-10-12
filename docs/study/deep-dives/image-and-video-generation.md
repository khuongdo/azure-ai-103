---
domain: Implement computer vision solutions
skill: Generate and edit images and video with Foundry models; handle quotas, safety errors and asynchronous jobs
sources:
  - https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e
  - https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation
retrieved: 2026-10-12
---

# Deep dive: image and video generation

Generating media is easy to demo and hard to run. The hard parts are **quota** (images per minute), **asynchronous jobs** (video), **safety blocks** and **repeatability**. This page covers the API facts and the steps to run them reliably. The full applied pipeline is in [Media generation and understanding](../real-world/multimodal-media-and-marketing.md).

Items marked `[NEEDS VERIFICATION]` are not confirmed on Microsoft Learn. Numbers marked *example* are illustrative.

---

## 1. Image models

| Model | Status on Learn | Quality values |
|---|---|---|
| `dall-e-3` | **Retired March 4, 2026**; existing deployments no longer work | n/a |
| `gpt-image-2.5-sunburst`, `gpt-image-2.5-flare`, `gpt-image-2` | GA | Sunburst/Flare: low, medium, high, xhigh, max, auto. GPT-Image-2: low, medium, high |
| `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini` | Limited access | low, medium, high (Learn lists conflicting defaults: high in the general text, medium for `gpt-image-1-mini` in the table) |

### Generation request: fields
| Field | Meaning and limits |
|---|---|
| `prompt` | What to draw |
| `n` | Number of images, **1 to 10** (default 1) |
| `size` | `1024x1024`, `1024x1536`, `1536x1024` for the gpt-image-1 family. For GPT-Image-2 and Sunburst/Flare, custom `WIDTHxHEIGHT` where both edges are multiples of 16, long edge ≤ 3,840 px, aspect ratio between 1:3 and 3:1, total pixels 655,360 to 8,294,400. Above `2560x1440` is experimental for Sunburst/Flare. The rules apply only when you set `size`; `auto` can violate them |
| `quality` | See table above |
| `output_format` | `PNG` (default) or `JPEG`. WEBP is not supported |
| `output_compression` | Integer 0 to 100 (default 100), JPEG only |
| `background` | `auto` or `transparent` (needs PNG; per Learn code comments, GPT-Image-1 only) |
| `user` | Any string, for tracking |
| `stream`, `partial_images` | Stream partial results; `partial_images` 0 to 3 |

The response always returns base64 (`data[i].b64_json`); the gpt-image models do not support `response_format`.

```python
from openai import AzureOpenAI
import base64

client = AzureOpenAI(api_version="2025-04-01-preview",
                     azure_endpoint=ENDPOINT, api_key=KEY)   # or an Entra token provider
result = client.images.generate(model="<deployment>", prompt="A minimalist poster of a lighthouse at dawn",
                                n=1, size="1024x1024", quality="high", output_format="png")
open("poster.png", "wb").write(base64.b64decode(result.data[0].b64_json))
```

### Streaming (partial images)
Set `stream=true` and `partial_images` (0 to 3). Events of type `image_generation.partial_image` carry `partial_image_index` and `b64_json`, so a UI can show progressive previews instead of a long blank wait.

---

## 2. Editing images (inpainting)

The edit endpoint uses **multipart/form-data**, not JSON.

| Field | Meaning |
|---|---|
| `image[]` | Up to **16** input images, each **under 50 MB**, PNG or JPG |
| `mask` | PNG, **same dimensions as the input**; **fully transparent pixels (alpha = 0) are the areas to edit** |
| `prompt` | What the edited area should become |
| `input_fidelity` | How closely style and features (especially faces) follow the input; not supported by `gpt-image-1-mini` |
| `size`, `n`, `quality`, `stream`, `partial_images`, `background` | As in generation |

### Step by step: replace a product photo background
1. **Prepare the photo** (PNG or JPG, under 50 MB).
2. **Build the mask:** copy the photo's size; make the background pixels transparent (alpha 0), leave the product opaque. *Wrong:* a mask of a different size, or an opaque mask (nothing changes).
3. **Write the prompt** for the edited area only: "Plain light-grey studio backdrop with soft shadow."
4. **Set `input_fidelity` high** if the product details must stay intact.
5. **Send the multipart request** and decode `b64_json`.
6. **Check the result:** compare the unmasked area with the original; run content safety on the output; keep the prompt, parameters and model version with the file.

---

## 3. Errors, safety and quota

| Situation | What you see | Action |
|---|---|---|
| Harmful prompt | `error.code: "contentFilter"` with "Your task failed as a result of our safety system." (operation `Failed`) | Change the prompt; do not retry the same text |
| Harmful output | `contentFilter`: "Generated image was filtered as a result of our safety system." | Adjust the prompt; log |
| `DeploymentNotFound` | Wrong deployment name | Verify the name |
| `401 Unauthorized` | Bad key or token | Check credentials |
| `429 Too Many Requests` | Quota | Retry with exponential backoff |
| `content_policy_violation` | Policy | Modify the prompt |
| `InvalidPayload` | Bad `prompt`, `size` or `n` | Check the fields |

- **Default quota:** about **5 images per minute per deployment** for the gpt-image models on Learn. Plan a queue; do not fan out 100 parallel requests.
- **Minors:** photorealistic images of minors are blocked by default; access needs a request form (enterprise-tier customers are auto-approved).

*Worked example (example numbers):* a catalogue needs 600 variants. At 5 per minute that is 120 minutes. Options: spread across deployments, request more quota, or use batch-style off-hours queues. A design that assumes instant results will time out.

---

## 4. Video generation (Sora 2, preview)

Sora 2 creates video from text and/or input images or video. Generation is an **asynchronous job**.

### Job lifecycle, step by step
1. **Create a job:** POST to `/openai/v1/video/generations/jobs` with prompt and format: `width`, `height` (the Learn sample uses 1080), `n_seconds` (samples use 5 and 10), and `n_variants` (**1 to 4** different versions from the same prompt). API version is `preview` during preview.
2. **Receive a job ID** immediately. Do not wait on this HTTP call.
3. **Poll** `/openai/v1/video/generations/jobs/{job_id}` until `status` is `succeeded`, `failed` or `cancelled`.
4. **On `succeeded`,** read `generations` and download the file. On `failed` or `cancelled`, log the error and decide to retry or alert.
5. **Remix (optional):** apply targeted edits to an existing video instead of regenerating everything.

```python
import time, requests
job = requests.post(f"{endpoint}/openai/v1/video/generations/jobs?api-version=preview",
                    headers=headers,
                    json={"model": "<deployment>", "prompt": "A slow pan across a rainy neon street",
                          "width": "1080", "height": "1080", "n_seconds": "5", "n_variants": "1"}).json()
status = None
while status not in ("succeeded", "failed", "cancelled"):
    time.sleep(10)                                   # poll with a delay, not a tight loop
    status_resp = requests.get(f"{endpoint}/openai/v1/video/generations/jobs/{job['id']}?api-version=preview",
                               headers=headers).json()
    status = status_resp.get("status")
```

*What can go wrong:* holding a web request open until the video is ready (time-outs); polling in a tight loop (throttling); losing the job ID after a restart (store it); ignoring `failed`. In production use a queue and a worker, and notify the user when done.

`[NEEDS VERIFICATION]` Supported resolutions, maximum duration and exact field names of the request body should be confirmed against the current Sora page before coding.

Azure applies input and output moderation to media generation models, with content filtering and abuse monitoring (see [Responsible AI for multimodal content](responsible-ai-for-multimodal-content.md)).

---

## 5. Choosing between operations

| Goal | Use |
|---|---|
| New picture from a description | Image generation |
| Change part of an existing picture, keep the rest | Image edit with mask |
| Combine several reference images | Image edit with multiple `image[]` (up to 16) |
| New clip | Video job |
| Small change to a clip | Remix |
| Describe or search existing media | Not generation: see [Multimodal understanding](multimodal-understanding.md) |

## 6. Cost and operations checklist
- Cost per **approved** asset, not per attempt (retries and rejected drafts count).
- Quality and size drive cost; use `low` or `medium` for drafts and `high` for finals.
- Queue and back off; store prompts, parameters and model versions.
- Keep provenance on finals.
- Alert on quota errors and filter blocks.

---

## Sources
- [Image generation](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e)
- [Sora 2 video generation](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation)
