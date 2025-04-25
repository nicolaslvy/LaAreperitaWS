const { Client, LocalAuth, RemoteAuth } = require('whatsapp-web.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const qrcode = require('qrcode-terminal');
const express = require('express');

//const qrcode = require('qrcode');
//const fs = require('fs');
const app = express();
const port = process.env.PORT || 8080;
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

// Directorio donde se guardará el archivo QR
const qrPath = path.join(dbDir, 'qr-image.png');


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

// Generamos el QR como imagen y lo servimos en una URL
client.on('qr', (qr) => {
    console.log('Escanea este código QR para iniciar sesión en WhatsApp Web:');

    // Generar QR como un buffer en memoria
    qrcode.toBuffer(qr, { type: 'png' }, (err, buffer) => {
        if (err) {
            console.error('Error generando el QR:', err);
        } else {
            // Servimos el QR a través de la ruta /qr sin necesidad de guardarlo en el sistema de archivos
            app.get('/qr', (req, res) => {
                res.setHeader('Content-Type', 'image/png');  // Establecemos el tipo de contenido adecuado
                res.send(buffer);  // Enviamos el buffer como una imagen PNG
            });

            console.log('QR generado correctamente, accede a /qr para escanearlo.');
        }
    });
});
// Servir el QR generado en una URL accesible
// app.get('/qr', (req, res) => {
//     const qrImagePath = path.join(__dirname, 'qr-image.png');
//     res.sendFile(qrImagePath);
// });

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

// Iniciar el servidor Express
app.listen(port, () => {
    console.log(`🚀 Servidor Express corriendo en http://localhost:${port}`);
    client.initialize(); // Inicializar cliente de WhatsApp después de iniciar el servidor
});