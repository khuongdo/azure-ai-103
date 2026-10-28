---
note: docs/study/deep-dives/multimodal-understanding.md
skill: Analyze images and video
retrieved: 2026-10-12
---

# Quiz: multimodal understanding

Based on the [deep dive](../deep-dives/multimodal-understanding.md).

## Flashcards

**Q:** How are images sent to chat models?
**A:** As image_url content (URL or base64).

**Q:** Blob SAS image access role?
**A:** Storage Blob Data Reader with managed identity.

**Q:** Video analyzer for search?
**A:** prebuilt-videoSearch.

**Q:** Video sampling limit?
**A:** About 1 frame per second, resized to 512×512.

**Q:** What does video CU transcribe?
**A:** Speech only.

**Q:** How many contentCategories for video?
**A:** One.

**Q:** Image Analysis 4.0 retirement?
**A:** September 25, 2028.

**Q:** Risk of text in images?
**A:** Indirect prompt injection.

**Q:** Which Image Analysis 4.0 feature suggests crop rectangles for a target shape?
**A:** `smartCrops`, with aspect ratios (width / height, 0.75 to 1.8).

**Q:** What does smartCrops return?
**A:** A bounding box per requested aspect ratio; you apply the crop yourself.

## Practice questions

### 1. Users need to find a moment in a video library. What?

- A. Compress video
- B. Translate
- C. Whole-file embeddings only
- D. Per-segment results from prebuilt-videoSearch indexed with timestamps

<details><summary>Answer</summary>

**Correct: D.** To find a *moment*, the index must contain *moments*. `prebuilt-videoSearch` splits a video into segments and returns, per segment, a description, transcript text, key frames and start/end times. Index one document per segment (with the timestamps and the parent video ID), preferably with a vector field for hybrid search. A hit then points to "video 42, 01:12 to 01:30".

```json
{ "id": "v42_s07", "videoId": "v42", "startMs": 72000, "endMs": 90000,
  "description": "Chef plates the dish", "transcript": "...", "contentVector": [ ... ] }
```

**Why the others are wrong:**
- **A. Compress video:** reduces storage, adds no search.
- **B. Translate:** changes language only.
- **C. Whole-file embeddings only:** one vector per video is too coarse to locate a moment.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/concepts/prebuilt-analyzers

</details>

### 2. A screenshot says 'ignore your rules'. What is it?

- A. Bias
- B. Blur
- C. Indirect prompt injection
- D. Rate limit

<details><summary>Answer</summary>

**Correct: C.** The model reads text inside images (OCR-like). If that text says "ignore your rules", the image carries an instruction the user never typed, so it is an **indirect prompt injection** (the attack arrives through content, not through the user's message). Defend by treating image text as **untrusted data**, scanning it, applying indirect-attack guardrail controls, and giving the model limited permissions.

**Why the others are wrong:**
- **A. Bias:** unfair treatment of groups, unrelated.
- **B. Blur:** an image quality problem.
- **D. Rate limit:** a 429 throttling error.

Source: https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview

</details>

### 3. Same fields extracted from many product photos. Which tool?

- A. Translator
- B. CU custom image analyzer
- C. Speech
- D. Language

<details><summary>Answer</summary>

**Correct: B.** Extracting the **same set of fields** from many images is the job of a **Content Understanding custom image analyzer**: you define a field schema (for example `ProductType`, `PrimaryColor`, `HasLogo`) with methods (`extract`, `classify`, `generate`), and every image returns the same JSON structure, with grounding where applicable.

```json
"fieldSchema": { "fields": {
  "PrimaryColor": { "type": "string", "method": "classify", "enum": ["red", "blue", "green", "black", "white", "other"] },
  "Description":  { "type": "string", "method": "generate", "description": "One factual sentence" }
}}
```

**Why the others are wrong:**
- **A. Translator, C. Speech, D. Language:** these work on text or audio, not pixels.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/image/overview

</details>

### 4. Video analyzer returns which outputs?

- A. Only audio
- B. Only images
- C. Only SQL
- D. Markdown and JSON

<details><summary>Answer</summary>

**Correct: D.** A Content Understanding video analyzer returns two forms: **Markdown** (readable: transcript with timestamps, key frames) and **JSON** (structured fields from your schema, plus segment data). Markdown feeds RAG and reading; JSON feeds databases and rules. Video analysis combines audio and visual understanding.

**Why the others are wrong:**
- **A. Only audio / B. Only images:** video analysis covers both modalities and more.
- **C. Only SQL:** not an output format.

Source: https://learn.microsoft.com/en-us/azure/ai-services/content-understanding/video/overview

</details>

### 5. You need square thumbnails centered on the main subject of product photos using Image Analysis 4.0. What do you request?

- A. The `objects` feature
- B. The `tags` feature
- C. The `smartCrops` feature with aspect ratio 1.0, then apply the returned bounding box
- D. The `denseCaptions` feature

<details><summary>Answer</summary>

**Correct: C.** `smartCrops` is the Image Analysis 4.0 feature that proposes crop rectangles that keep the main subject (area of interest) for the aspect ratios you request (width / height, between 0.75 and 1.8; 1.0 is square). It only **returns a bounding box per ratio**; your code performs the crop.

```python
from azure.ai.vision.imageanalysis import ImageAnalysisClient
from azure.ai.vision.imageanalysis.models import VisualFeatures
from PIL import Image

client = ImageAnalysisClient(endpoint=endpoint, credential=credential)
result = client.analyze_from_url(image_url=url, visual_features=[VisualFeatures.SMART_CROPS],
                                 smart_crops_aspect_ratios=[1.0])
box = result.smart_crops.list[0].bounding_box            # x, y, width, height
thumb = Image.open("photo.jpg").crop((box.x, box.y, box.x + box.width, box.y + box.height))
```

**Why the others are wrong:**
- **A. `objects`, B. `tags`, D. `denseCaptions`:** describe what is in the image but return no crop rectangle for a target ratio.

Source: https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/how-to/call-analyze-image-40

</details>
