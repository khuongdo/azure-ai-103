---
domain: Implement computer vision solutions (question bank)
skill: All mock exam questions of one exam domain, gathered in one interactive set
sources:
  - https://aka.ms/AI103-StudyGuide
  - https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/
retrieved: 2026-11-23
---

# Question bank: Implement computer vision solutions

70 scenario questions for this domain (10-15% of the exam), collected from mock exams 1 to 10. They are shuffled, so topics are mixed. Use **Practice mode** to learn (check each answer, read the concept block), or **Exam mode** to measure yourself on one domain.

<iframe src="../question-bank-d3-view.html" title="Question bank: Implement computer vision solutions" style="width:100%;height:85vh;border:1px solid var(--md-default-fg-color--lightest);border-radius:6px"></iframe>

[Open full screen](question-bank-d3-view.html){ target=_blank }

## Where to study the topics behind these questions

- [Agent safety and identity](../deep-dives/agent-safety-and-identity.md)
- [Azure ai search configuration](../deep-dives/azure-ai-search-configuration.md)
- [Capacity cost and throttling](../deep-dives/capacity-cost-and-throttling.md)
- [Content understanding and document intelligence](../deep-dives/content-understanding-and-document-intelligence.md)
- [Image and video generation](../deep-dives/image-and-video-generation.md)
- [Model and service selection](../deep-dives/model-and-service-selection.md)
- [Multimodal understanding](../deep-dives/multimodal-understanding.md)
- [Responsible ai for multimodal content](../deep-dives/responsible-ai-for-multimodal-content.md)
- [Responsible ai governance](../deep-dives/responsible-ai-governance.md)

## Flashcards (39)

Short recall cards from the topic quizzes of this domain. Read the question, answer in your head, then open the card.

### Image and video generation

From the [quiz](../quizzes/image-and-video-generation-quiz.md).

??? question "Replacement for dall-e-3?"
    gpt-image series; dall-e-3 retired March 4, 2026.

??? question "Mask rule?"
    Fully transparent (alpha 0) areas are edited.

??? question "Max input images for edit?"
    16.

??? question "Video generation pattern?"
    Asynchronous job: create, poll, download.

??? question "Sora status values?"
    succeeded, failed, cancelled.

??? question "Remix?"
    Targeted edits to existing video.

??? question "Image rate note?"
    About 5 images per minute for some deployments.

??? question "Provenance signals?"
    C2PA Content Credentials and invisible watermarks.

??? question "How do you send a reference image to Sora 2?"
    As the `input_reference` file in a multipart/form-data request; its size must match the video size.

### Multimodal understanding

From the [quiz](../quizzes/multimodal-understanding-quiz.md).

??? question "How are images sent to chat models?"
    As image_url content (URL or base64).

??? question "Blob SAS image access role?"
    Storage Blob Data Reader with managed identity.

??? question "Video analyzer for search?"
    prebuilt-videoSearch.

??? question "Video sampling limit?"
    About 1 frame per second, resized to 512×512.

??? question "What does video CU transcribe?"
    Speech only.

??? question "How many contentCategories for video?"
    One.

??? question "Image Analysis 4.0 retirement?"
    September 25, 2028.

??? question "Risk of text in images?"
    Indirect prompt injection.

??? question "Which Image Analysis 4.0 feature suggests crop rectangles for a target shape?"
    `smartCrops`, with aspect ratios (width / height, 0.75 to 1.8).

??? question "What does smartCrops return?"
    A bounding box per requested aspect ratio; you apply the crop yourself.

### Responsible ai for multimodal content

From the [quiz](../quizzes/responsible-ai-for-multimodal-content-quiz.md).

??? question "Image severities?"
    0, 2, 4, 6.

??? question "Image with text severities?"
    Full 0 to 7.

??? question "Check provenance with?"
    Content Provenance Detection site or API.

??? question "What can strip C2PA metadata?"
    Cropping, resizing, format conversion, re-saving.

??? question "Invisible watermark visible?"
    No.

??? question "Filter where?"
    Inputs and outputs.

??? question "Disclose what?"
    That content is AI-generated.

??? question "Log what for audit?"
    Prompt, model, version, reviewer.

### Image and video generation and understanding

From the [quiz](../quizzes/multimodal-media-and-marketing-quiz.md).

??? question "Which image model family replaces `dall-e-3`?"
    `gpt-image` series (`dall-e-3` was retired March 4, 2026).

??? question "How does a mask work in image edits?"
    A PNG the same size as the input; **fully transparent areas (alpha 0)** are edited.

??? question "How many input images can the edit endpoint take?"
    Up to **16**, each under 50 MB (PNG or JPG).

??? question "What is the default quota note for some image models?"
    About 5 images per minute per deployment, so queue requests.

??? question "How does video generation work?"
    An **asynchronous job**: create, poll (`succeeded`, `failed`, `cancelled`), download. Sora 2 is Preview.

??? question "What is Sora's remix?"
    Targeted edits to an existing video instead of regenerating it.

??? question "Which analyzer segments video by scene or topic?"
    `prebuilt-videoSearch` (also transcripts and summaries of people, places and actions per segment).

??? question "Which analyzer describes images for search?"
    `prebuilt-imageSearch`.

??? question "When does Image Analysis 4.0 retire?"
    September 25, 2028.

??? question "What provenance signals does Microsoft add to supported model output?"
    **Content Credentials (C2PA)** metadata and **invisible watermarks**.

??? question "How do you check provenance?"
    The **Content Provenance Detection** website or API.

??? question "What can strip C2PA metadata?"
    Cropping, resizing, format conversion, re-saving.

Back to the [question bank overview](question-bank.md).
