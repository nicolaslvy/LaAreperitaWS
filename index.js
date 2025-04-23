const { Client, LocalAuth } = require('whatsapp-web.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/database.sqlite');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true }
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('La Areperita bot is ready to serve! 🌽');
});

client.on('message', msg => {
    const mensaje = msg.body.toLowerCase();

    db.get("SELECT respuesta FROM respuestas WHERE palabra_clave = ?", [mensaje], (err, row) => {
        if (row) {
            msg.reply(row.respuesta);
        } else {
            msg.reply("¡Hola! 👋 Soy el asistente de *La Areperita*. ¿Quieres conocer nuestras arepas de peto 100% naturales? Escribe 'menú' o 'ordenar' para comenzar.");
        }
    });
});

client.initialize();