CREATE TABLE IF NOT EXISTS respuestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    palabra_clave TEXT NOT NULL,
    respuesta TEXT NOT NULL
);

INSERT INTO respuestas (palabra_clave, respuesta) VALUES 
('hola', '¡Hola! Bienvenido a *La Areperita* 🌽. ¿Te gustaría conocer nuestras deliciosas arepas de peto 100% naturales? Escribe "menú" para ver nuestras opciones.'),
('menú', 'Aquí está nuestro menú 📝:

🥇 Arepa de peto clásica
🥑 Arepa de peto con aguacate
🧀 Arepa de peto con queso campesino

Escribe "ordenar" para comenzar tu pedido.'),
('ordenar', '¡Excelente! 🛒 Para hacer tu pedido, por favor indícanos qué tipo de arepa deseas y cuántas unidades.'),
('gracias', 'Gracias por elegir *La Areperita*. ¡Esperamos que disfrutes nuestras arepas! 🌽');