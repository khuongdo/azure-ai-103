---
note: docs/study/deep-dives/image-and-video-generation.md
skill: Generate and edit images and video
retrieved: 2026-10-12
---

# Quiz: image and video generation

Based on the [deep dive](../deep-dives/image-and-video-generation.md).

## Flashcards

**Q:** Replacement for dall-e-3?
**A:** gpt-image series; dall-e-3 retired March 4, 2026.

**Q:** Mask rule?
**A:** Fully transparent (alpha 0) areas are edited.

**Q:** Max input images for edit?
**A:** 16.

**Q:** Video generation pattern?
**A:** Asynchronous job: create, poll, download.

**Q:** Sora status values?
**A:** succeeded, failed, cancelled.

**Q:** Remix?
**A:** Targeted edits to existing video.

**Q:** Image rate note?
**A:** About 5 images per minute for some deployments.

**Q:** Provenance signals?
**A:** C2PA Content Credentials and invisible watermarks.

**Q:** How do you send a reference image to Sora 2?
**A:** As the `input_reference` file in a multipart/form-data request; its size must match the video size.

## Practice questions

### 1. Replace only the background of a photo. What?

- A. Remix
- B. New generation
- C. Edit with a mask
- D. Image Analysis

<details><summary>Answer</summary>

**Correct: C.** The **edit** endpoint sends the original image plus a **mask** (same size; the transparent/marked area shows where to repaint) and a prompt. Only the masked region is regenerated (inpainting), so the product in the foreground stays unchanged. A new generation would redraw everything, including the product.

```python
result = client.images.edit(
    model="<deployment>",
    image=open("photo.png", "rb"),
    mask=open("background-mask.png", "rb"),      # marks the background only
    prompt="A sunny beach with palm trees",
)
```

The edit endpoint uses **multipart/form-data**, not JSON. Check the result by comparing the unmasked pixels with the original.

**Why the others are wrong:**
- **A. Remix:** a video feature (targeted edit of an existing video).
- **B. New generation:** may change the product as well.
- **D. Image Analysis:** reads and describes an image; it does not edit.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e

</details>

### 2. Video request times out in a web app. Fix?

- A. Smaller image
- B. Synchronous call
- C. Async job and polling
- D. Longer timeout

<details><summary>Answer</summary>

**Correct: C.** Video generation takes from tens of seconds to minutes, longer than a web request or gateway timeout. The API is an **asynchronous job**: create the job, return the job ID immediately, **poll** (with a delay) until a terminal status, then download. In a web app, store the job ID, let a worker poll, and notify the user when it is ready.

```python
job = requests.post(f"{endpoint}/openai/v1/video/generations/jobs?api-version=preview",
                    headers=headers, json={"model": "<deployment>", "prompt": prompt,
                                           "width": "1080", "height": "1080", "n_seconds": "5"}).json()
store_job_id(user_id, job["id"])        # return to the browser now: "Your video is being made"
```

**Why the others are wrong:**
- **A. Smaller image:** does not change how long generation takes.
- **B. Synchronous call:** is exactly what times out.
- **D. Longer timeout:** hides the symptom, ties up server connections, and still breaks on a restart.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation

</details>

### 3. You still call dall-e-3 and fail. Why?

- A. Wrong region
- B. Retired March 4, 2026
- C. No mask
- D. Bad key

<details><summary>Answer</summary>

**Correct: B.** `dall-e-3` was **retired on March 4, 2026**, so calls to a deployment of it fail. Move to the `gpt-image` family (for example `gpt-image-2`; `gpt-image-1.x` models are limited access) and update the deployment name and parameters, because the new models always return base64 (`b64_json`) and have different `size` and `quality` rules.

```python
result = client.images.generate(model="<gpt-image-deployment>", prompt="A lighthouse at dawn", size="1024x1024")
image_bytes = base64.b64decode(result.data[0].b64_json)    # no response_format parameter
```

**Why the others are wrong:**
- **A. Wrong region:** would say the model is unavailable in that region, not retired.
- **C. No mask:** a mask is only needed for edits.
- **D. Bad key:** would give 401.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e

</details>

### 4. Which statuses end a video job?

- A. succeeded, failed, cancelled
- B. ready
- C. queued only
- D. open, closed

<details><summary>Answer</summary>

**Correct: A.** A video job moves through states such as queued and running, and ends in one of three **terminal** states: **`succeeded`**, **`failed`** or **`cancelled`**. Your polling loop must stop on any of the three (not only `succeeded`), otherwise a failed job makes you poll forever. On `succeeded` read `generations` and download; on `failed` or `cancelled` log the error and decide to retry or alert.

```python
while status not in ("succeeded", "failed", "cancelled"):
    time.sleep(10)                       # delay, not a tight loop (avoids throttling)
    status = get_job(job_id)["status"]
```

**Why the others are wrong:**
- **B. ready, D. open/closed:** not statuses in this API.
- **C. queued only:** queued is the first state, not the end.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation

</details>

### 5. A team wants a Sora 2 video that starts from a product photo. How should the photo be sent?

- A. As base64 text inside a JSON `prompt`
- B. As the `input_reference` file part of a multipart/form-data request, sized to match the video
- C. As a URL in `n_variants`
- D. As a mask file

<details><summary>Answer</summary>

**Correct: B.** For Sora 2 the reference image is **`input_reference`**, an optional **file** (JPEG, PNG or WebP) sent in a **multipart/form-data** request, together with `prompt`, `model` and `size`. Its dimensions must **match the video `size` exactly** (Learn lists `720x1280` and `1280x720`), so resize first. The image acts as the first frame anchor; describe the motion in the prompt.

```python
video = client.videos.create(
    model="<sora-deployment>",
    prompt="Slow orbit around the product on a marble table",
    size="1280x720",
    input_reference=open("product-1280x720.png", "rb"),
)
```

With raw REST, remove the `Content-Type: application/json` header and let your HTTP library set the multipart boundary.

**Why the others are wrong:**
- **A. Base64 in `prompt`:** the prompt is text; the image is a file part.
- **C. URL in `n_variants`:** `n_variants` is a number (1 to 4) of video versions.
- **D. Mask file:** masks are for image edits, not for video reference.

Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation

</details>
