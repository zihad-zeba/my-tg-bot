const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// ================== CONFIG ==================
const GITHUB_TOKEN = "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"; // আপনার টোকেন
const USERNAME = "zihad-zeba";
const REPO = "tg-bot-js";
const BRANCH = "main";

const LOCAL_DIR = __dirname;
const API_URL = `https://api.github.com/repos/${USERNAME}/${REPO}`;

const HEADERS = {
    "Authorization": `token ${GITHUB_TOKEN}`,
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
};

const IGNORE = new Set([
    ".git", 
    "__pycache__", 
    ".idea", 
    ".vscode", 
    ".DS_Store",
    "node_modules"
]);

const ONLY_FILES = new Set([
    // "sync.js"
]);
// ============================================

// গিটহাবের নিয়মে লোকাল ফাইলের SHA Hash তৈরি করা
function calculateGitSha(buffer) {
    const prefix = `blob ${buffer.length}\0`;
    return crypto.createHash('sha1').update(prefix).update(buffer).digest('hex');
}

// ফোল্ডার থেকে লোকাল ফাইলের ম্যাপ তৈরি করা
function getLocalFilesMap() {
    const map = new Map();
    function scanDir(dir) {
        const list = fs.readdirSync(dir);
        for (let file of list) {
            const fullPath = path.join(dir, file);
            const relPath = path.relative(LOCAL_DIR, fullPath);
            const pathParts = relPath.split(path.sep);
            
            if (IGNORE.has(file) || pathParts.some(p => IGNORE.has(p))) continue;

            if (fs.statSync(fullPath).isDirectory()) {
                scanDir(fullPath);
            } else {
                const repoPath = relPath.split(path.sep).join('/');
                if (ONLY_FILES.size > 0 && !ONLY_FILES.has(file) && !ONLY_FILES.has(repoPath)) continue;
                
                const buffer = fs.readFileSync(fullPath);
                map.set(repoPath, {
                    fullPath,
                    content: buffer.toString('base64'),
                    sha: calculateGitSha(buffer)
                });
            }
        }
    }
    scanDir(LOCAL_DIR);
    return map;
}

// গিটহাব থেকে রিমোট ফাইলের ম্যাপ তৈরি করা (মাত্র ১ রিকোয়েস্টেই)
async function getRemoteTreeMap() {
    const map = new Map();
    const treeUrl = `${API_URL}/git/trees/${BRANCH}?recursive=1`;
    const res = await fetch(treeUrl, { headers: HEADERS });
    
    if (!res.ok) {
        console.log("ℹ️  Remote repository tree not found or empty.");
        return map;
    }
    
    const treeData = await res.json();
    for (const item of treeData.tree) {
        if (item.type !== 'blob') continue;
        const pathParts = item.path.split('/');
        
        if (IGNORE.has(pathParts[pathParts.length - 1]) || pathParts.some(p => IGNORE.has(p))) continue;
        if (ONLY_FILES.size > 0 && !ONLY_FILES.has(pathParts[pathParts.length - 1]) && !ONLY_FILES.has(item.path)) continue;
        
        map.set(item.path, item.sha);
    }
    return map;
}

// ============================================
//               CORE ACTIONS
// ============================================

async function uploadFile(repoPath, content, remoteSha) {
    const url = `${API_URL}/contents/${repoPath}`;
    const bodyData = { message: `Update ${repoPath} via sync`, content, branch: BRANCH };
    if (remoteSha) bodyData.sha = remoteSha;

    const res = await fetch(url, { method: 'PUT', headers: HEADERS, body: JSON.stringify(bodyData) });
    if (res.ok || res.status === 201) console.log(`✔ Uploaded: ${repoPath}`);
    else console.log(`✖ Failed to upload: ${repoPath}`);
}

async function deleteRemoteFile(repoPath, sha) {
    const url = `${API_URL}/contents/${repoPath}`;
    const bodyData = { message: `Hard sync: Delete ${repoPath}`, sha, branch: BRANCH };
    
    const res = await fetch(url, { method: 'DELETE', headers: HEADERS, body: JSON.stringify(bodyData) });
    if (res.ok) console.log(`🗑  Deleted on GitHub: ${repoPath}`);
    else console.log(`✖ Failed to delete on GitHub: ${repoPath}`);
}

async function downloadFile(repoPath, localPath) {
    const url = `${API_URL}/contents/${repoPath}`;
    const res = await fetch(url, { headers: { ...HEADERS, "Accept": "application/vnd.github.v3.raw" } });
    
    if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        fs.writeFileSync(localPath, Buffer.from(arrayBuffer));
        console.log(`✔ Pulled: ${repoPath}`);
    } else console.log(`✖ Failed to pull: ${repoPath}`);
}

function deleteLocalFile(localPath) {
    try {
        fs.unlinkSync(localPath);
        console.log(`🗑  Deleted locally: ${path.relative(LOCAL_DIR, localPath)}`);
    } catch (e) {
        console.log(`✖ Failed to delete locally: ${localPath}`);
    }
}

// ============================================
//               PUSH & PULL LOGIC
// ============================================

async function runSync(mode) {
    const isPush = mode === 'push' || mode === 'hard-push';
    const isHard = mode === 'hard-push' || mode === 'hard-pull';

    console.log(`\n🚀 Starting ${mode.toUpperCase()} for '${REPO}' (${USERNAME})...`);
    console.log("🔍 Fetching data and comparing files...");

    const localMap = getLocalFilesMap();
    const remoteMap = await getRemoteTreeMap();

    const toUpload = [];
    const toDeleteRemote = [];
    const toDownload = [];
    const toDeleteLocal = [];

    if (isPush) {
        // Push Logic
        for (const [repoPath, localData] of localMap.entries()) {
            if (remoteMap.get(repoPath) !== localData.sha) {
                toUpload.push({ repoPath, content: localData.content, remoteSha: remoteMap.get(repoPath) });
            }
        }
        if (isHard) {
            for (const [repoPath, remoteSha] of remoteMap.entries()) {
                if (!localMap.has(repoPath)) toDeleteRemote.push({ repoPath, sha: remoteSha });
            }
        }
    } else {
        // Pull Logic
        for (const [repoPath, remoteSha] of remoteMap.entries()) {
            if (localMap.get(repoPath)?.sha !== remoteSha) {
                toDownload.push({ repoPath, localPath: path.join(LOCAL_DIR, repoPath.split('/').join(path.sep)) });
            }
        }
        if (isHard) {
            for (const [repoPath, localData] of localMap.entries()) {
                if (!remoteMap.has(repoPath)) toDeleteLocal.push(localData.fullPath);
            }
        }
    }

    // প্রিভিউ দেখানো
    const totalChanges = toUpload.length + toDeleteRemote.length + toDownload.length + toDeleteLocal.length;

    if (totalChanges === 0) {
        console.log("🙌 Everything is strictly up to date! No changes needed.");
        return;
    }

    console.log("\n📝 The following actions will be performed:");
    if (toUpload.length > 0) toUpload.forEach(f => console.log(`  [⬆️  Upload/Update] ${f.repoPath}`));
    if (toDeleteRemote.length > 0) toDeleteRemote.forEach(f => console.log(`  [❌ Delete GitHub] ${f.repoPath}`));
    if (toDownload.length > 0) toDownload.forEach(f => console.log(`  [⬇️  Download/Pull] ${f.repoPath}`));
    if (toDeleteLocal.length > 0) toDeleteLocal.forEach(f => console.log(`  [❌ Delete Local]  ${path.relative(LOCAL_DIR, f)}`));

    // এপ্রুভাল নেওয়া
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const promptMsg = isHard 
        ? `\n⚠️  WARNING: You are in HARD mode. Files marked with [❌] will be permanently deleted.\n❓ Proceed? (y/n): ` 
        : `\n❓ Proceed with the update? (y/n): `;

    const answer = await new Promise(resolve => rl.question(promptMsg, resolve));
    rl.close();

    if (answer.trim().toLowerCase() === 'y') {
        console.log("\n🚀 Executing changes...");
        if (isPush) {
            for (const f of toUpload) await uploadFile(f.repoPath, f.content, f.remoteSha);
            for (const f of toDeleteRemote) await deleteRemoteFile(f.repoPath, f.sha);
        } else {
            for (const f of toDeleteLocal) deleteLocalFile(f);
            for (const f of toDownload) await downloadFile(f.repoPath, f.localPath);
        }
        console.log("\n✅ Sync complete!");
    } else {
        console.log("\n❌ Action cancelled by user.");
    }
}

// ============================================
//               MAIN EXECUTION
// ============================================
const command = process.argv[2] ? process.argv[2].toLowerCase() : null;
const validCommands = ['push', 'pull', 'hard-push', 'hard-pull'];

if (validCommands.includes(command)) {
    runSync(command);
} else {
    console.log("⚠️  Please specify a valid command.");
    console.log("👉 node sync.js push       (Upload changed local files to GitHub)");
    console.log("👉 node sync.js pull       (Download changed GitHub files to Local)");
    console.log("👉 node sync.js hard-push  (Upload files AND delete missing files on GitHub)");
    console.log("👉 node sync.js hard-pull  (Download files AND delete missing local files)");
}
