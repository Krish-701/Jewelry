import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const PROMPTS_DIR = path.join(DATA_DIR, 'prompts');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure directories exist
function ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
    if (!fs.existsSync(PROMPTS_DIR)) fs.mkdirSync(PROMPTS_DIR, { recursive: true });
}

// Save image to disk
export function saveImage(jobId, base64Data, mimeType = 'image/png') {
    ensureDirs();
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const filename = `${jobId}.${ext}`;
    const filepath = path.join(IMAGES_DIR, filename);
    
    // Remove data URI prefix if present
    const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    
    fs.writeFileSync(filepath, buffer);
    return `/api/images?filename=${filename}`;
}

// Save prompt to disk
export function savePrompt(jobId, prompt) {
    ensureDirs();
    const filepath = path.join(PROMPTS_DIR, `${jobId}.txt`);
    fs.writeFileSync(filepath, prompt, 'utf-8');
}

// Read prompt from disk
export function readPrompt(jobId) {
    const filepath = path.join(PROMPTS_DIR, `${jobId}.txt`);
    if (fs.existsSync(filepath)) {
        return fs.readFileSync(filepath, 'utf-8');
    }
    return null;
}

// Get image path
export function getImagePath(filename) {
    return path.join(IMAGES_DIR, filename);
}

// Check if image exists
export function imageExists(filename) {
    return fs.existsSync(path.join(IMAGES_DIR, filename));
}

// Save history entry
export function saveHistoryEntry(entry) {
    ensureDirs();
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    }
    // Add new entry at beginning
    history.unshift(entry);
    // Keep only last 100 entries
    history = history.slice(0, 100);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    return entry;
}

// Get all history
export function getHistory() {
    ensureDirs();
    if (!fs.existsSync(HISTORY_FILE)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}

// Update history entry
export function updateHistoryEntry(jobId, updates) {
    ensureDirs();
    if (!fs.existsSync(HISTORY_FILE)) return null;
    
    let history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    const index = history.findIndex(h => h.jobId === jobId);
    
    if (index !== -1) {
        history[index] = { ...history[index], ...updates };
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        return history[index];
    }
    return null;
}

// Delete history entry and associated files
export function deleteHistoryEntry(jobId) {
    ensureDirs();
    if (!fs.existsSync(HISTORY_FILE)) return false;
    
    let history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    const entry = history.find(h => h.jobId === jobId);
    
    if (entry) {
        // Delete image file
        if (entry.imageFilename) {
            const imgPath = path.join(IMAGES_DIR, entry.imageFilename);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
        // Delete prompt file
        const promptPath = path.join(PROMPTS_DIR, `${jobId}.txt`);
        if (fs.existsSync(promptPath)) fs.unlinkSync(promptPath);
        
        // Remove from history
        history = history.filter(h => h.jobId !== jobId);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        return true;
    }
    return false;
}
