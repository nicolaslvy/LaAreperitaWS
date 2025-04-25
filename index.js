const { Client, LocalAuth, RemoteAuth } = require('whatsapp-web.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
//const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
//const path = require('path');

// 👇 Usa tu token personal de Browserless aquí
const BROWSERLESS_TOKEN = 'SBu0KSMcQVijvb1e8848f2011f632b76e4c796a89e';

const dbDir = path.join(__dirname, 'data');
const dbFile = path.join(dbDir, 'database.sqlite');

if (!fs.existsSync(dbDir)) {
    try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('📁 Carpeta "data" creada.');
    } catch (err) {
        console.error('❌ Error al crear carpeta data:', err);
        process.exit(1);
    }
}

const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('❌ No se pudo abrir la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Base de datos conectada:', dbFile);
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='respuestas'", (err, row) => {
            if (err) {
                console.error('❌ Error verificando tabla:', err.message);
            } else if (!row) {
                db.run(`
                    CREATE TABLE respuestas (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        mensaje TEXT NOT NULL UNIQUE,
                        respuesta TEXT NOT NULL
                    )
                `, (err) => {
                    if (err) {
                        console.error('❌ Error creando la tabla:', err.message);
                    } else {
                        console.log('🗂️ Tabla "respuestas" creada.');
                    }
                });
            } else {
                console.log('📂 Tabla "respuestas" ya existe.');
            }
        });
    }
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`,
    }
});

client.on('qr', async (qr) => {
    console.clear();
    console.log('🟢 Escanea este código QR desde la terminal:\n');

    // Mostrar en terminal
    qrcodeTerminal.generate(qr, { small: true });

    // Guardar QR como imagen
    const imagePath = './qr.png';
    await qrcode.toFile(imagePath, qr);

    // Subir a servidor temporal (ej: 0x0.st)
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    try {
        const response = await axios.post('https://0x0.st', form, {
            headers: form.getHeaders(),
        });

        console.log('\n🌍 También puedes abrir este link para escanear el QR:');
        console.log(response.data);
    } catch (error) {
        console.error('❌ Error al subir el QR:', error.message);
    }
});

// client.on('qr', qr => {
//     console.log('📲 Escanea este QR con WhatsApp Business:');
//     console.log(qr);
// });

client.on('ready', () => {
    console.log('🤖 La Areperita Bot está listo!');
});


client.on('disconnected', (reason) => {
    console.log('❌ Cliente desconectado:', reason);
});


client.on('message', msg => {
    const input = msg.body.trim().toLowerCase();
    db.get('SELECT respuesta FROM respuestas WHERE mensaje = ?', [input], (err, row) => {
        if (err) {
            console.error('❌ Error consultando respuesta:', err.message);
            return msg.reply('🚫 Ha ocurrido un error. Intenta más tarde.');
        }

        if (row && row.respuesta) {
            msg.reply(row.respuesta);
        } else {
            msg.reply('👋 ¡Hola! Bienvenido a *La Areperita* 🍽️\n\n¿Quieres ver nuestro menú?\nResponde con:\n👉 `menu`\n👉 `ordenar`\n👉 `ayuda`');
        }
    });
});

client.initialize();
