const { Client, LocalAuth } = require('whatsapp-web.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Definimos las rutas de base de datos
const dbDir = path.join(__dirname, 'data');
const dbFile = path.join(dbDir, 'database.sqlite');

// Asegura que la carpeta exista
if (!fs.existsSync(dbDir)) {
    try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('📁 Carpeta "data" creada.');
    } catch (err) {
        console.error('❌ Error al crear carpeta data:', err);
        process.exit(1);
    }
}

// Inicializa la base de datos
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('❌ No se pudo abrir la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Base de datos conectada:', dbFile);

        // Crea tabla si no existe
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
                        insertarRespuestasIniciales();
                    }
                });
            } else {
                console.log('📂 Tabla "respuestas" ya existe.');
                insertarRespuestasIniciales();
            }
        });
    }
});

// Inserta respuestas predeterminadas si no existen
function insertarRespuestasIniciales() {
    db.get("SELECT COUNT(*) AS count FROM respuestas", (err, result) => {
        if (err) {
            console.error('❌ Error contando respuestas:', err.message);
        } else if (result.count === 0) {
            const insert = db.prepare("INSERT INTO respuestas (mensaje, respuesta) VALUES (?, ?)");

            insert.run('hola', '¡Hola! Bienvenido a *La Areperita* 🌽. ¿Te gustaría conocer nuestras deliciosas arepas de peto 100% naturales? Escribe "menú" para ver nuestras opciones.');
            insert.run('menú', 'Aquí está nuestro menú 📝:\n\n🥇 Arepas de peto clásica\n🧀 Arepas rellenas de queso\n\nEscribe "ordenar" para comenzar tu pedido.');
            insert.run('ordenar', '¡Excelente! 🛒 Para hacer tu pedido, por favor indícanos qué tipo de arepa deseas y cuántas unidades.');
            insert.run('gracias', 'Gracias por elegir *La Areperita*. ¡Esperamos que disfrutes nuestras arepas! 🌽');

            insert.finalize(() => {
                console.log('✅ Respuestas predeterminadas insertadas.');
            });
        } else {
            console.log(`📌 Se encontraron ${result.count} respuestas existentes.`);
        }
    });
}

// Inicializa el cliente de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

client.on('qr', qr => {
    console.log('📲 Escanea este QR con WhatsApp Business:');
    console.log(qr);
});

client.on('ready', () => {
    console.log('🤖 La Areperita Bot está listo!');
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
