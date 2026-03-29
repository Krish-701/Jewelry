/**
 * Preset options for Background, Religion, and Dress Code dropdowns.
 * Each preset has: id, name, emoji, short description, and a detailed promptSnippet for AI generation.
 */

// ─── BACKGROUND PRESETS ───────────────────────────────────────────────
export const BACKGROUND_PRESETS = [
    {
        id: 'white-studio',
        name: 'Pure White Studio',
        emoji: '⬜',
        description: 'Clean, bright white wall or cyclorama with soft diffused lighting',
        promptSnippet: 'Pure white seamless studio backdrop, clean bright white cyclorama wall with soft diffused lighting, timeless and versatile background that makes gold and gems pop with maximum sparkle, professional jewelry catalog setting',
    },
    {
        id: 'grey-neutral',
        name: 'Light Grey / Beige Neutral',
        emoji: '🩶',
        description: 'Subtle textured grey/beige background with gentle shadows',
        promptSnippet: 'Subtle textured light grey or beige neutral studio wall with gentle soft shadows, sophisticated and modern background, ideal for everyday or fusion jewelry without competing colors',
    },
    {
        id: 'white-marble',
        name: 'Luxurious White Marble',
        emoji: '🏛️',
        description: 'Polished white marble with faint veins and soft reflections',
        promptSnippet: 'Luxurious polished white marble surface or wall with faint natural veins and soft reflections, classic Indian premium feel inspired by palaces and high-end showrooms, elegant for close-ups and full model shots',
    },
    {
        id: 'black-charcoal',
        name: 'Soft Black / Deep Charcoal',
        emoji: '⬛',
        description: 'Matte black backdrop with focused lighting on the model/jewelry',
        promptSnippet: 'Soft matte or slightly glossy deep black charcoal backdrop with focused dramatic lighting on the model and jewelry, dramatic luxury vibe that highlights metal shine and stone brilliance perfectly',
    },
    {
        id: 'cream-silk',
        name: 'Cream Ivory Silk Drape',
        emoji: '🤍',
        description: 'Gentle folds of ivory/cream silk or satin cloth',
        promptSnippet: 'Gentle folds of ivory and cream silk or satin fabric draped as background, soft rich texture with warm undertones, bridal premium Indian elegance while staying simple and uncluttered',
    },
    {
        id: 'gold-champagne',
        name: 'Gold-Flecked Champagne',
        emoji: '✨',
        description: 'Soft champagne/beige with very faint golden shimmer',
        promptSnippet: 'Subtle gold-flecked champagne neutral backdrop with soft beige and very faint golden shimmer texture, warm and opulent ambiance that enhances gold jewelry naturally without being busy',
    },
    {
        id: 'marble-courtyard',
        name: 'Marble Courtyard / Jharokha',
        emoji: '🕌',
        description: 'Clean marble wall with simple arched details or faint carvings',
        promptSnippet: 'Minimal marble courtyard or jharokha-inspired wall, clean marble with simple arched details and faint elegant carvings like a subtle haveli touch, royal yet uncluttered authentic Indian premium heritage feel',
    },
    {
        id: 'pastel-blush',
        name: 'Soft Pastel Pink / Blush',
        emoji: '🌸',
        description: 'Light blush pink or muted rose backdrop',
        promptSnippet: 'Soft pastel pink or blush wall with gentle diffused lighting, light blush pink or muted rose backdrop, romantic and feminine background popular for bridal or delicate pieces while keeping focus on the jewelry',
    },
    {
        id: 'wood-neutral',
        name: 'Polished Wood + Neutral Wall',
        emoji: '🪵',
        description: 'Rich wood flooring against a simple cream wall',
        promptSnippet: 'Polished rich dark or light wood flooring against a simple cream neutral wall, warm grounded luxury feel that suits both traditional and contemporary Indian jewelry designs',
    },
    {
        id: 'window-natural',
        name: 'Studio with Natural Window Light',
        emoji: '🪟',
        description: 'Plain wall near a window with sheer curtains and natural glow',
        promptSnippet: 'Elegant indoor studio with large window providing soft natural light, plain light-colored wall near a window with sheer curtains creating gentle natural glow and soft shadows, fresh premium lifestyle feel without outdoor complexity',
    },
];

// ─── RELIGION PRESETS ─────────────────────────────────────────────────
export const RELIGION_PRESETS = [
    {
        id: 'hindu',
        name: 'Hindu',
        emoji: '🙏',
        description: 'Traditional Hindu cultural context',
        promptSnippet: 'The model reflects a traditional Hindu cultural aesthetic, with styling choices that complement Hindu bridal or festive traditions, warm and auspicious tones, traditional Indian beauty with sindoor and bindi embellishments where appropriate',
    },
    {
        id: 'christian',
        name: 'Christian',
        emoji: '✝️',
        description: 'Christian cultural context',
        promptSnippet: 'The model reflects a Christian cultural aesthetic, elegant and graceful styling suited for Christian weddings or ceremonies, classic Western-inspired beauty with subtle sophistication',
    },
    {
        id: 'muslim',
        name: 'Muslim',
        emoji: '☪️',
        description: 'Muslim cultural context',
        promptSnippet: 'The model reflects a Muslim cultural aesthetic, elegant modest styling suited for Muslim celebrations or Eid, modest and graceful fashion sensibility with rich fabrics and refined jewelry presentation',
    },
    {
        id: 'other',
        name: 'Other / Universal',
        emoji: '🌍',
        description: 'Neutral universal styling — no specific religious context',
        promptSnippet: 'The model has a universal, culturally neutral aesthetic, elegant and sophisticated styling that appeals across all cultures and backgrounds, modern and inclusive beauty',
    },
];

// ─── DRESS CODE PRESETS ───────────────────────────────────────────────
export const DRESS_CODE_PRESETS = [
    {
        id: 'cream-silk-saree',
        name: 'Cream / Ivory Silk Saree',
        emoji: '👗',
        description: 'Elegant draping with minimal border or zari',
        promptSnippet: 'Plain cream or ivory silk saree draped elegantly with minimal border or zari, timeless and luxurious fabric that highlights necklaces earrings and maang tikka, great for bridal or traditional gold sets',
    },
    {
        id: 'white-anarkali',
        name: 'White Off-White Anarkali Suit',
        emoji: '🤍',
        description: 'Flowing floor-length anarkali with subtle embroidery',
        promptSnippet: 'Soft white or off-white flowing floor-length anarkali suit with subtle embroidery or plain fabric, graceful and feminine silhouette ideal for delicate kundan or polki pieces with a clean premium vibe',
    },
    {
        id: 'beige-kurta-palazzo',
        name: 'Beige Champagne Kurta + Palazzo',
        emoji: '👘',
        description: 'Straight or A-line kurta paired with palazzo pants',
        promptSnippet: 'Beige or champagne silk kurta in straight or A-line cut paired with matching palazzo pants, modern ethnic fusion look that is versatile for everyday or light festive jewelry, sophisticated and uncluttered appearance',
    },
    {
        id: 'blush-lehenga',
        name: 'Light Blush Pink Lehenga Choli',
        emoji: '🌷',
        description: 'Simple lehenga with minimal work, soft dupatta',
        promptSnippet: 'Light blush pink or pastel lehenga choli with simple minimal embroidery work and soft dupatta, romantic and elegant outfit excellent for statement necklaces and bangles while maintaining a premium feel',
    },
    {
        id: 'red-silk-saree',
        name: 'Classic Red / Maroon Silk Saree',
        emoji: '❤️',
        description: 'Rich but not heavily embellished saree',
        promptSnippet: 'Classic red or maroon silk saree with light embroidery, rich but not heavily embellished, bold yet refined traditional favorite for heavy gold jewelry, adds warmth and luxury in photographs',
    },
    {
        id: 'white-maxi-gown',
        name: 'White / Ivory Maxi Dress / Gown',
        emoji: '👰',
        description: 'Flowing Western-style maxi with subtle Indian touches',
        promptSnippet: 'White or ivory flowing Western-style maxi dress or long gown with subtle Indian touches like light embroidery, contemporary and clean look that works well when mixing traditional jewelry with modern outfits',
    },
    {
        id: 'mint-anarkali',
        name: 'Soft Pastel Green / Mint Anarkali',
        emoji: '🌿',
        description: 'Lightweight, flowing anarkali in fresh tones',
        promptSnippet: 'Soft pastel green or mint lightweight flowing anarkali in fresh serene tones, fresh and premium look suited for nature-inspired or lighter jewelry collections',
    },
    {
        id: 'cream-kurti-dupatta',
        name: 'Cream / Beige Kurti with Dupatta',
        emoji: '🧣',
        description: 'Simple straight kurti with delicate dupatta',
        promptSnippet: 'Cream or beige cotton-silk simple straight kurti with delicate dupatta, everyday elegant outfit perfect for daily-wear or fusion jewelry shoots, very relatable yet upscale appearance',
    },
    {
        id: 'black-silk-saree',
        name: 'Black / Deep Charcoal Silk Saree',
        emoji: '🖤',
        description: 'Matte or lightly textured black outfit',
        promptSnippet: 'Black or deep charcoal silk saree or gown with matte or lightly textured finish, dramatic and high-end look that makes gold and colored stones pop dramatically against simple premium backdrops',
    },
    {
        id: 'gold-silk-lehenga',
        name: 'Ivory / Light Gold Silk Lehenga',
        emoji: '👑',
        description: 'Minimalist lehenga with soft sheen',
        promptSnippet: 'Ivory or light gold-toned silk lehenga with minimalist design and soft sheen, opulent without being busy, ideal for showcasing intricate polki or diamond sets in a royal yet simple manner',
    },
];

// ─── CUSTOM MODEL CONSISTENCY OPTIONS ─────────────────────────────────
export const MODEL_CONSISTENCY_OPTIONS = [
    {
        id: 'exact',
        name: 'Exact Match',
        emoji: '📌',
        description: 'Keep the model photo as close to the original as possible',
        promptSnippet: 'CRITICAL: Reproduce the exact same model from the reference photo with maximum fidelity — same face, same skin tone, same body proportions, same hair style and color. The model should be virtually identical to the uploaded reference photo. Only add the jewelry onto this exact model.',
    },
    {
        id: 'slight-variation',
        name: 'Slight Variation',
        emoji: '🎨',
        description: 'Keep consistency but allow subtle artistic changes',
        promptSnippet: 'Use the uploaded model reference photo as the primary guide — maintain the same face structure, skin tone, and general appearance, but allow slight artistic variations in pose, expression, or hair styling for a more natural and editorial result. The model should be clearly recognizable as the same person.',
    },
];

/**
 * Helper: get preset by ID from any preset array
 */
export function getPresetById(presets, id) {
    return presets.find(p => p.id === id) || null;
}
