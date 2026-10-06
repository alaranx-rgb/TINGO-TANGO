const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Servir la interfaz web
app.use(express.static(path.join(__dirname)));

let jugadores = [];
let indiceActual = 0;
let enJuego = false;

// 20 PENITENCIAS EN FORMA DE PREGUNTAS SOBRE CCI
const penitenciasOriginales = [
  "¿Qué es un Contrato de Compraventa Internacional (CCI)?",
  "Nombra al menos dos características del Contrato de Compraventa Internacional.",
  "¿Qué significan las siglas CISG y qué convenio representan?",
  "¿Cuándo aplica automáticamente la Convención de Viena de 1980?",
  "Nombra una cosa que NO regula la Convención de Viena (CISG).",
  "¿Cuáles son los 3 requisitos para que una oferta comercial sea válida?",
  "¿Qué ocurre si la respuesta a una oferta incluye cambios sustanciales como el precio o la responsabilidad?",
  "¿Por qué es importante incluir el código arancelario (HS Code) en la descripción de la mercancía?",
  "¿Cómo se debe especificar correctamente la condición de entrega según los Incoterms®?",
  "¿Cuál es el medio de pago que ofrece la máxima seguridad para el vendedor y por qué?",
  "Menciona dos empresas o entidades reconocidas para realizar inspecciones de mercancía en origen.",
  "¿Cuál es la diferencia entre un evento de Fuerza Mayor y una cláusula de Hardship?",
  "¿Qué consecuencia o efecto tiene una cláusula de Fuerza Mayor si ocurre una pandemia o un bloqueo portuario?",
  "¿Qué obliga a hacer la cláusula de Hardship (excesiva onerosidad) si los fletes suben drásticamente?",
  "Menciona dos ventajas del Arbitraje Comercial Internacional frente a la Justicia Ordinaria.",
  "¿Qué importancia tiene la Convención de Nueva York de 1958 en el comercio internacional?",
  "¿Por qué se dice que el CCI es un contrato transnacional?",
  "¿Qué diferencia hay entre una inspección en origen y una en destino?",
  "¿Por qué es desfavorable acudir a tribunales ordinarios en un conflicto internacional?",
  "Menciona 3 cláusulas operativas fundamentales que debe incluir todo Contrato de Compraventa Internacional."
];

// Copia de trabajo para ir descontando las penitencias usadas
let penitenciasDisponibles = [...penitenciasOriginales];

io.on('connection', (socket) => {
  console.log('Jugador conectado:', socket.id);

  socket.on('unirse', (nombre) => {
    jugadores.push({ id: socket.id, nombre });
    io.emit('actualizarJugadores', jugadores);
  });

  socket.on('iniciarJuego', () => {
    if (jugadores.length < 2 || enJuego) return;
    enJuego = true;
    indiceActual = 0;
    
    // Tiempo aleatorio entre 10 y 25 segundos
    const tiempoTango = Math.floor(Math.random() * 15000) + 10000;
    
    // Intervalo para rotar la pelota ("tingo")
    const intervaloTingo = setInterval(() => {
      indiceActual = (indiceActual + 1) % jugadores.length;
      io.emit('estadoPelota', { poseedor: jugadores[indiceActual] });
    }, 800);

    // Detención aleatoria ("tango")
    setTimeout(() => {
      clearInterval(intervaloTingo);
      enJuego = false;

      // Si se acabaron las preguntas, reinicia la lista
      if (penitenciasDisponibles.length === 0) {
        penitenciasDisponibles = [...penitenciasOriginales];
      }

      // Selecciona una pregunta al azar y la REMUEVE de la lista para no repetirla
      const indicePenitencia = Math.floor(Math.random() * penitenciasDisponibles.length);
      const penitenciaElegida = penitenciasDisponibles.splice(indicePenitencia, 1)[0];
      
      io.emit('tangoFinal', {
        perdedor: jugadores[indiceActual],
        penitencia: penitenciaElegida
      });
    }, tiempoTango);
  });

  socket.on('disconnect', () => {
    jugadores = jugadores.filter(j => j.id !== socket.id);
    io.emit('actualizarJugadores', jugadores);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
