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

## Practice questions

### 1. Replace only the background of a photo. What?

- A. Remix
- B. New generation
- C. Edit with a mask
- D. Image Analysis

<details><summary>Answer</summary>

**Correct: C.** Mask-based inpainting changes only masked regions.
**Incorrect:** the other options do not fit — may change product; C — video; D — analysis.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e

</details>

### 2. Video request times out in a web app. Fix?

- A. Smaller image
- B. Synchronous call
- C. Async job and polling
- D. Longer timeout

<details><summary>Answer</summary>

**Correct: C.** Video generation is asynchronous.
**Incorrect:** the other options do not fit — do not fix design.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation

</details>

### 3. You still call dall-e-3 and fail. Why?

- A. Wrong region
- B. Retired March 4, 2026
- C. No mask
- D. Bad key

<details><summary>Answer</summary>

**Correct: B.** The model was retired.
**Incorrect:** the other options do not fit — not the reason.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/dall-e

</details>

### 4. Which statuses end a video job?

- A. succeeded, failed, cancelled
- B. ready
- C. queued only
- D. open, closed

<details><summary>Answer</summary>

**Correct: A.** Terminal states.
**Incorrect:** the other options do not fit — not statuses.
Source: https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/video-generation

</details>
