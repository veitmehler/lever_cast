import { getLLMAdapter } from '../../article-pipeline/llm/factory'
import { cleanTextOutput } from '../../article-pipeline/output-cleaner'
import { loadPromptTemplate } from '../../article-pipeline/enrichment/prompt-template'
import { recordLLMUsage } from '../../lib/llm-usage'

const DEF_SYS = `You are an expert at writing cinematic video generation prompts for text-to-video AI models.

Your task: Write a single, detailed prompt describing an atmospheric background video. The video will play behind text overlays (headline + bullet points) — the video is ONLY a visual backdrop. The real content is the text on top.

RULES:
1. Describe SLOW, SMOOTH, AMBIENT scenes — no fast cuts, no action, no people talking.
2. CAMERA FIXED: The video model uses a fixed camera. Do NOT describe camera pans, zooms, or movement. Describe static or slow-moving subjects (clouds drifting, gentle waves, light shifting).
3. TOPIC-RELEVANT but NOT LITERAL: For a finance article, describe "golden sunset over a modern city skyline" — not spreadsheets or charts. Abstract, evocative, professional.
4. Keep it to 2-4 sentences. One cohesive scene.
5. Style: cinematic, high-end, suitable for LinkedIn/Instagram/Twitter. Natural lighting, professional mood.

OUTPUT: Return ONLY the video description text. No preamble, no quotes, no markdown.`

const DEF_USER = `Write a cinematic background video description for this content:

TOPIC: {{topic}}

DETAILS: {{details}}

SPECIAL INSTRUCTIONS (if any):

Photo-Realistic, modern, in bright, sunny coloring. MUST have PHOTO-REALISTIC proportions!!

CRITICAL: MUST BE photo-realist and serious, AVOID anything cartoonish!
CRITICAL: MUST NOT include paperwork or icons on the image!

{{special_instructions}}

VIDEO MODEL: {{video_model}}

Return ONLY the video description, ready to use in the video model.`

export async function generateVideoReelPrompt(opts: {
  topic: string
  details: string
  specialInstructions: string
  videoModel: string
  userId?: string
}): Promise<string> {
  const t = await loadPromptTemplate(206)
  const provider = (t?.defaultProvider ?? 'gemini').toLowerCase()
  const model = t?.defaultModel ?? 'gemini-3-flash-preview'

  const userPrompt = (t?.userPrompt ?? DEF_USER)
    .replace(/\{\{topic\}\}/g, opts.topic.slice(0, 500))
    .replace(/\{\{details\}\}/g, opts.details.slice(0, 1500))
    .replace(/\{\{special_instructions\}\}/g, opts.specialInstructions.slice(0, 800))
    .replace(/\{\{video_model\}\}/g, opts.videoModel)

  const adapter = getLLMAdapter(provider)
  const run = await adapter.call({
    systemPrompt: t?.systemPrompt ?? DEF_SYS,
    userPrompt,
    model,
    temperature: 0.7,
    maxTokens: 512,
  })
  await recordLLMUsage(opts.userId ?? null, 'social_video_prompt', run)

  return cleanTextOutput(run.content).trim()
}
