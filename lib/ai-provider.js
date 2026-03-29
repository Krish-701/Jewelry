import { GoogleGenAI } from '@google/genai';
import { BACKGROUND_PRESETS, RELIGION_PRESETS, DRESS_CODE_PRESETS, MODEL_CONSISTENCY_OPTIONS, getPresetById } from './presets.js';
import { buildJewelryPromptV2, getGenerationSummary } from './prompt-builder.js';

/**
 * AI Provider abstraction — supports Google Gemini direct API and muapi.ai (Nano Banana Pro)
 * Switch via AI_PROVIDER env var: "google" or "muapi"
 *
 * OUTPUT SIZES:
 *   portrait   → 3:4 (portrait model shots)
 *   square2k   → 2048×2048 / 1:1
 *   landscape  → 1920×1080 / 16:9
 */

// Use globalThis to persist jobs across Next.js hot reloads in dev mode
const localJobs = globalThis.__nanaLocalJobs || (globalThis.__nanaLocalJobs = new Map());

function getConfig() {
    return {
        provider: process.env.AI_PROVIDER || 'google',
        geminiKey: process.env.GEMINI_API_KEY || '',
        muapiKey: process.env.MUAPI_API_KEY || '',
        muapiBase: process.env.MUAPI_BASE_URL || 'https://api.muapi.ai/v1',
        model: process.env.AI_MODEL || 'pro',
    };
}

function getModelId(config) {
    if (config.provider === 'muapi') {
        return 'nano-banana-pro';
    }
    return 'gemini-3.1-flash-image-preview';
}

function getAnalysisModel(config) {
    if (config.provider === 'muapi') {
        return 'nano-banana-2';
    }
    return 'gemini-3.1-flash-image-preview';
}

// Map output size key → aspect ratio strings
// Note: Nano Banana Pro supports up to 4096x4096
const SIZE_MAP = {
    portrait:   { aspectRatio: '3:4',   label: 'Portrait 3:4', maxSize: 2048 },
    square2k:   { aspectRatio: '1:1',   label: '2048×2048 Square', maxSize: 2048 },
    landscape:  { aspectRatio: '16:9',  label: '1920×1080 Landscape', maxSize: 1920 },
    portrait4k: { aspectRatio: '3:4',   label: 'Portrait 4K (3072×4096)', maxSize: 4096 },
    square4k:   { aspectRatio: '1:1',   label: '4096×4096 Square', maxSize: 4096 },
    ultrawide4k:{ aspectRatio: '32:9',  label: '3840×1080 Ultrawide', maxSize: 3840 },
    auto:       { aspectRatio: 'Auto',  label: 'Match Input', maxSize: 4096 },
};

function resolveAspectRatio(outputSize) {
    return SIZE_MAP[outputSize]?.aspectRatio || '3:4';
}

// ============ GOOGLE PROVIDER ============

function getGoogleClient(apiKey) {
    return new GoogleGenAI({ apiKey });
}

async function googleAnalyze(images) {
    const config = getConfig();
    const ai = getGoogleClient(config.geminiKey);
    const model = getAnalysisModel(config);

    const imageCount = images.length;
    const contents = [
        {
            text: `You are an expert jewelry analyst. You are given ${imageCount} image${imageCount > 1 ? 's' : ''} of the SAME jewelry piece or SET from ${imageCount > 1 ? 'multiple angles and distances' : 'one angle'}. Analyze ALL images together as a single reference. Return a JSON object with these fields:
- type: jewelry type (e.g., "necklace", "earrings", "ring", "bracelet", "maang tikka", "set")
- pieces: array of {type, description, sizeHint, sizeUnit} for each distinct piece. sizeHint describes the typical measurement needed (e.g., "Ring Size (India)", "Length", "Diameter", "Chain Length"). sizeUnit is the unit like "cm", "mm", or "India size"
- style: overall style (e.g., "traditional", "modern", "vintage", "temple jewelry", "kundan", "polki")
- material: primary material (e.g., "22k gold", "silver", "rose gold", "platinum")
- stones: array of ALL stones/gems visible
- colors: array of dominant colors
- occasion: suitable occasion
- description: a 2-3 sentence description covering ALL angles and details shown
- weight_estimate: light/medium/heavy
- finish: surface finish (e.g., "matte", "polished", "antique", "oxidized")

Return ONLY valid JSON, no markdown.`,
        },
    ];

    for (const img of images) {
        contents.push({
            inlineData: {
                mimeType: img.mimeType || 'image/jpeg',
                data: img.base64,
            },
        });
    }

    const response = await ai.models.generateContent({ model, contents });
    const text = response.candidates?.[0]?.content?.parts
        ?.filter(p => p.text)
        ?.map(p => p.text)
        ?.join('') || '';

    try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
    } catch {
        return {
            description: text, type: 'jewelry', style: 'traditional',
            material: 'gold', stones: [], colors: [], occasion: 'any',
            weight_estimate: 'medium', pieces: [], finish: 'polished',
        };
    }
}

async function googleGenerate(prompt, images, options = {}) {
    const config = getConfig();
    const ai = getGoogleClient(config.geminiKey);
    const model = getModelId(config);
    const ar = resolveAspectRatio(options.outputSize);

    const contents = [{ text: prompt }];

    for (const img of images) {
        contents.push({
            inlineData: {
                mimeType: img.mimeType || 'image/jpeg',
                data: img.base64,
            },
        });
    }

    const genConfig = {
        maxOutputTokens: 32768,
        temperature: 1,
        topP: 0.95,
        responseModalities: ['TEXT', 'IMAGE'],
        thinkingConfig: {
            thinkingLevel: 'HIGH',
        },
        imageConfig: {
            aspectRatio: ar,
            imageSize: '2K',
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
        ],
        systemInstruction: {
            parts: [{
                text: `You are an image generation model specialized in producing ultra-photorealistic, RAW-style photographs.

Always generate images that look like real, unedited DSLR or mirrorless camera photos.

Core requirements:
- Photorealism is mandatory. The image must be indistinguishable from a real photograph.
- Use natural lighting only (ambient, sunlight, practical light sources).
- Preserve realistic textures: skin pores, fabric fibers, surface imperfections.
- Do NOT apply beauty filters, smoothing, or stylization.
- Avoid CGI, 3D-rendered, or painterly aesthetics.

Camera simulation:
- Full-frame camera look (35mm sensor)
- Realistic lens settings (35mm / 50mm / 85mm)
- Physically plausible depth of field (natural bokeh)
- Accurate exposure, contrast, and dynamic range

Color and tone:
- Neutral, true-to-life color grading
- No oversaturation or HDR exaggeration
- Natural white balance

Strictly avoid:
- Cartoon, anime, illustration, painting styles
- Unrealistic skin, plastic textures, or perfect symmetry
- Fantasy elements unless explicitly requested`
            }]
        },
    };

    const jobId = 'ggl_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    
    // Store in-memory
    localJobs.set(jobId, { 
        status: 'processing', 
        images: [], 
        provider: 'google',
        prompt
    });

    // Run the generation asynchronously (fire and forget)
    (async () => {
        try {
            const response = await ai.models.generateContent({ model, contents, config: genConfig });
            const resultImages = [];
            let resultText = '';
            
            for (const part of (response.candidates?.[0]?.content?.parts || [])) {
                if (part.text) {
                    resultText += part.text;
                } else if (part.inlineData) {
                    resultImages.push({
                        data: part.inlineData.data,
                        mimeType: part.inlineData.mimeType || 'image/png',
                    });
                }
            }
            
            if (resultImages.length > 0) {
                // Buffer the image to a base64 string matching MuAPI output format
                const base64Str = resultImages[0].data;
                localJobs.set(jobId, { 
                    status: 'completed', 
                    imageUrl: `data:${resultImages[0].mimeType};base64,${base64Str}`,
                    text: resultText
                });
            } else {
                localJobs.set(jobId, { status: 'failed', error: 'No image returned by Google API' });
            }
        } catch (err) {
            console.error('Google Background Generate Error:', err);
            localJobs.set(jobId, { status: 'failed', error: err.message });
        }
    })();

    // Return the job info immediately
    return {
        images: [],
        jobId,
        status: 'processing',
        text: 'Google image generation started...',
        provider: 'google'
    };
}

// ============ MUAPI PROVIDER (Nano Banana Pro) ============
async function uploadToCatbox(base64DataUri) {
    if (base64DataUri.startsWith('http')) return base64DataUri;

    const base64Data = base64DataUri.replace(/^data:image\/\w+;base64,/, "");
    const mimeMatch = base64DataUri.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const extension = mimeType.split('/')[1] || 'jpg';
    
    // Convert to Buffer and Blob
    const buffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([buffer], { type: mimeType });
    
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", blob, `image.${extension}`);

    const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Catbox upload failed (${response.status}): ${errText}`);
    }

    return await response.text();
}

async function muapiRequest(url, payload, headers = {}) {
    const config = getConfig();
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'x-api-key': config.muapiKey,
        ...headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`muapi.ai error (${response.status}): ${errText}`);
    }

    return response.json();
}

async function muapiGet(url, headers = {}) {
    const config = getConfig();
    const defaultHeaders = {
        'x-api-key': config.muapiKey,
        ...headers
    };

    const response = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`muapi.ai get error (${response.status}): ${errText}`);
    }

    return response.json();
}

async function muapiAnalyze(images) {
    const config = getConfig();
    const model = getAnalysisModel(config);
    const imageCount = images.length;
    const imagesList = images.map(img =>
        `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`
    );

    const result = await muapiRequest(model, {
        prompt: `You are an expert jewelry analyst. You are given ${imageCount} image${imageCount > 1 ? 's' : ''} of the SAME jewelry piece or SET from ${imageCount > 1 ? 'multiple angles and distances' : 'one angle'}. Analyze ALL images together as a single reference. Return a JSON object with:
- type, pieces (array of {type, description, sizeHint, sizeUnit}), style, material, stones (array), colors (array), occasion, description (2-3 sentences), weight_estimate, finish
sizeHint describes the typical measurement needed (e.g., "Ring Size (India)", "Length", "Diameter", "Chain Length"). sizeUnit is the unit like "cm", "mm", or "India size"
Return ONLY valid JSON.`,
        images_list: imagesList,
    });

    try {
        if (result.text) {
            const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        }
        return result;
    } catch {
        return {
            description: result.text || 'Analysis complete', type: 'jewelry',
            style: 'traditional', material: 'gold', stones: [], colors: [],
            occasion: 'any', weight_estimate: 'medium', pieces: [], finish: 'polished',
        };
    }
}

async function muapiGenerate(prompt, images, options = {}) {
    const ar = resolveAspectRatio(options.outputSize);
    let muapiAspectRatio = 'Auto';
    if (ar === '3:4') muapiAspectRatio = '3:4';
    if (ar === '1:1') muapiAspectRatio = '1:1';
    if (ar === '16:9') muapiAspectRatio = '16:9';

    const imagesList = images.map(img =>
        `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`
    );

    // Upload images to catbox.moe to get public URLs since MuAPI does not accept long base64 strings
    console.log("Uploading locally generated images to Catbox for MuAPI...");
    const uploadedImages = await Promise.all(imagesList.map(img => uploadToCatbox(img)));
    console.log("Successfully uploaded to Catbox:", uploadedImages);

    const payload = {
        prompt,
        images_list: uploadedImages,
        aspect_ratio: muapiAspectRatio,
        google_search: false,
        resolution: '1k',
        output_format: 'jpg',
        num_inference_steps: 20,
        sync_mode: false,
    };

    try {
        const url = "https://api.muapi.ai/api/v1/nano-banana-2-edit";
        const result = await muapiRequest(url, payload);

        if (!result.request_id) {
            throw new Error('No request_id returned from muapi.ai');
        }

        const requestId = result.request_id;
        
        // Background feature: immediately return the jobId instead of polling
        return {
            images: [], // Empty initially
            jobId: requestId,
            status: 'processing',
            text: 'Image generation started...',
            provider: 'muapi'
        };

    } catch (err) {
        console.error('MuAPI Generate Error:', err);
        throw err;
    }
}

export async function checkJob(jobId) {
    if (jobId.startsWith('ggl_')) {
        const job = localJobs.get(jobId);
        if (!job) return { status: 'failed', error: 'Job not found on this server instance' };
        return job;
    }

    try {
        const resultUrl = `https://api.muapi.ai/api/v1/predictions/${jobId}/result`;
        const pollResponse = await muapiGet(resultUrl);
        const status = pollResponse.status;

        if (status === 'completed') {
            const outputUrl = pollResponse.outputs?.[0];
            if (!outputUrl) throw new Error('Task completed but no output URL returned');

            // Optionally we could return just the URL, but the frontend currently expects base64
            // Since it's history, we might just store the URL. But for consistency, let's buffer it and return base64
            const imageResponse = await fetch(outputUrl);
            const buffer = await imageResponse.arrayBuffer();
            return {
                status: 'completed',
                imageUrl: `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`
            };
        } else if (status === 'failed' || status === 'canceled') {
            return { status: 'failed', error: pollResponse.error || 'Unknown error' };
        }

        return { status: 'processing' };
    } catch (err) {
        console.error('MuAPI Status Error:', err);
        return { status: 'failed', error: err.message };
    }
}

// ============ PUBLIC API ============

export async function analyzeJewelry(images) {
    // ALWAYS use Google for analysis as requested by the user
    return googleAnalyze(images);
}

export async function generateImage(prompt, images, options = {}) {
    const config = getConfig();
    return config.provider === 'muapi'
        ? muapiGenerate(prompt, images, options)
        : googleGenerate(prompt, images, options);
}

/**
 * Build an ultra-detailed jewelry prompt for Nano Banana Pro / Gemini
 * @param {object} analysis - jewelry analysis result
 * @param {object} template - template object
 * @param {number} imageCount - number of reference images
 * @param {string} [extraPrompt] - user extra prompt appended to final prompt
 * @param {object} [presetOptions] - preset and size options
 */
export function buildJewelryPrompt(analysis, template, imageCount, extraPrompt = '', presetOptions = {}) {
    // Use the new enhanced prompt builder with input understanding layer
    const result = buildJewelryPromptV2(analysis, template, imageCount, extraPrompt, presetOptions);
    
    // Log the understanding for debugging
    if (process.env.NODE_ENV !== 'production') {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║           PROMPT BUILDER - INPUT UNDERSTANDING                   ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');
        console.log(getGenerationSummary(result.understanding));
        console.log('\n────────────────────────────────────────────────────────────────────\n');
    }
    
    return result.prompt;
}

export function getCurrentConfig() {
    const config = getConfig();
    return {
        provider: config.provider,
        model: config.model,
        modelId: getModelId(config),
        hasGeminiKey: !!config.geminiKey && config.geminiKey !== 'your-google-api-key-here',
        hasMuapiKey: !!config.muapiKey && config.muapiKey !== 'your-muapi-key-here',
    };
}

export { SIZE_MAP };
