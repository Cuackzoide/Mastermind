// --- CONFIGURACIÓN GLOBAL ---
const COLORES_DISPONIBLES_BASE = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
];
// 10 Colores: Rojo, Azul, Verde, Morado, Naranja, Gris, Cian, Negro, Rosa, Amarillo
const MAPA_COLORES = {
  1: "red",
  2: "blue",
  3: "green",
  4: "purple",
  5: "orange",
  6: "gray",
  7: "Brown",
  8: "black",
  9: "pink",
  10: "yellow",
};
const LONGITUD_CODIGO = 4;
const NIVELES = {
  FACIL: { nombre: "Fácil", colores: 4, intentos: 20 },
  MEDIO: { nombre: "Medio", colores: 6, intentos: 20 },
  DIFICIL: { nombre: "Difícil", colores: 8, intentos: 20 },
  EXPERTO: { nombre: "Experto", colores: 10, intentos: 20 },
};

const gameState = {
  codigoSecreto: [],
  intentoActual: 1,
  maxIntentosActual: NIVELES.FACIL.intentos,
  paletaActual: COLORES_DISPONIBLES_BASE.slice(0, NIVELES.FACIL.colores),
  combinacionActual: Array(LONGITUD_CODIGO).fill(undefined),
};

let DOM_CACHE = {};

// --- LÓGICA DE MASTERMIND ---

// 2. Crear el menú de dificultad para que aparezcan las opciones
function iniciarNivel(nivelSeleccionado) {
  // Resetear el estado del juego
  gameState.intentoActual = 1;
  gameState.maxIntentosActual = nivelSeleccionado.intentos;
  gameState.paletaActual = COLORES_DISPONIBLES_BASE.slice(
    0,
    nivelSeleccionado.colores
  );
  gameState.codigoSecreto = []; // RESETEAR el código secreto

  // Limpiar la interfaz (Tablero y Mensajes)
  DOM_CACHE.tablero.innerHTML = ""; // Limpiar el tablero
  DOM_CACHE.btnEnviar.disabled = false;
  DOM_CACHE.mensaje.textContent = `Nivel: ${nivelSeleccionado.nombre} | Intentos: ${gameState.maxIntentosActual}`;

  // Generar elementos del juego
  generarPaletaColores();
  generarCodigoSecreto();
  resetearIntentoActual();
}

function generarCodigoSecreto() {
  /** Genera el código secreto usando la paleta actual. */
  for (let i = 0; i < LONGITUD_CODIGO; i++) {
    let randomIndex = Math.floor(Math.random() * gameState.paletaActual.length);
    gameState.codigoSecreto.push(gameState.paletaActual[randomIndex]);
  }
  //Descomentar para pruebas
  /* console.log(`DEBUG: Código Secreto (${paletaActual.length} colores) generado:`, codigoSecreto.join(' '));*/
}

function evaluarIntento(intento, secreto) {
  /** Compara el intento con el secreto y devuelve las pistas*/
  let negros = 0;
  let blancos = 0;

  const secretoRestante = [...secreto];
  const intentoRestante = [...intento];

  // 1. Contar Pines Negros (Posición y Color Correctos)
  for (let i = 0; i < LONGITUD_CODIGO; i++) {
    if (intento[i] === secreto[i]) {
      negros++;
      secretoRestante[i] = null;
      intentoRestante[i] = null;
    }
  }

  // 2. Contar Pines Blancos (Solo Color Correcto)
  for (let i = 0; i < LONGITUD_CODIGO; i++) {
    const colorIntento = intentoRestante[i];
    if (colorIntento !== null) {
      const secretIndex = secretoRestante.indexOf(colorIntento);
      if (secretIndex !== -1) {
        blancos++;
        secretoRestante[secretIndex] = null;
      }
    }
  }
  return { negros, blancos };
}

// --- GESTIÓN DE LA INTERFAZ (DOM) ---

function generarPaletaColores() {
  /** Crea los botones de la paleta actual. */
  DOM_CACHE.paletaColores.innerHTML = "";

  // Itera sobre la paletaActual
  gameState.paletaActual.forEach((colorCode) => {
    const button = document.createElement("button");
    button.className = "color-pin";
    button.dataset.color = colorCode;
    button.style.backgroundColor = MAPA_COLORES[colorCode];
    button.textContent = colorCode;
    button.addEventListener("click", manejarSeleccionColor);
    DOM_CACHE.paletaColores.appendChild(button);
  });
}

function crearFilaIntento(filaNum) {
  /** Crea una fila para el historial y la añade al inicio del tablero (prepend). */
  const filaDiv = document.createElement("div");
  filaDiv.className = "fila-mastermind";
  filaDiv.id = `Fila${filaNum}`;

  // Slots de Intento (colores del jugador)
  const grupoSlots = document.createElement("div");
  grupoSlots.className = "grupo-slots";
  for (let slot = 1; slot <= LONGITUD_CODIGO; slot++) {
    const slotDiv = document.createElement("div");
    slotDiv.id = `Fila${filaNum}_Slot${slot}`;
    slotDiv.className = "slot-intento-historial";
    grupoSlots.appendChild(slotDiv);
  }
  filaDiv.appendChild(grupoSlots);

  // Slots de Respuesta (Feedback)
  const grupoRespuestas = document.createElement("div");
  grupoRespuestas.className = "grupo-respuestas";
  for (let r = 1; r <= LONGITUD_CODIGO; r++) {
    const respuestaDiv = document.createElement("div");
    respuestaDiv.id = `Fila${filaNum}_Respuesta${r}`;
    respuestaDiv.className = "slot-respuesta";
    grupoRespuestas.appendChild(respuestaDiv);
  }
  filaDiv.appendChild(grupoRespuestas);

  // Añadir la nueva fila AL PRINCIPIO del tablero, ya que el intento más reciente va arriba ^-^
  DOM_CACHE.tablero.prepend(filaDiv);
  return filaDiv;
}

function actualizarSlotIntento(index, colorCode) {
  /** Actualiza el slot de la combinación actual */
  const slot = DOM_CACHE.slotsActuales[index];
  if (colorCode) {
    slot.style.backgroundColor = MAPA_COLORES[colorCode];
    slot.dataset.color = colorCode;
  } else {
    slot.style.backgroundColor = "white";
    slot.dataset.color = "";
  }
}

function mostrarFeedback(pistas, intento, filaId) {
  const filaDiv = document.getElementById(filaId);

  // 1. Mostrar los colores del intento en el historial
  for (let i = 0; i < LONGITUD_CODIGO; i++) {
    const slotHistorial = document.getElementById(`${filaId}_Slot${i + 1}`);
    slotHistorial.style.backgroundColor = MAPA_COLORES[intento[i]];
  }

  // 2. Mostrar los pines de correccion (feedback)
  const pinesFeedback = filaDiv.querySelectorAll(".slot-respuesta");
  let pinIndex = 0;

  // Pines Negros (correctos y en la posición correcta)
  for (let i = 0; i < pistas.negros; i++) {
    pinesFeedback[pinIndex].style.backgroundColor = "black";
    pinIndex++;
  }

  // Pines Blancos (presentes pero en la posición incorrecta)
  for (let i = 0; i < pistas.blancos; i++) {
    pinesFeedback[pinIndex].style.backgroundColor = "white";
    pinesFeedback[pinIndex].style.border = "1px solid black"; // Para que se vean!
    pinIndex++;
  }
}

function resetearIntentoActual() {
  /** Borra la combinación actual y el array */
  gameState.combinacionActual = Array(LONGITUD_CODIGO).fill(undefined);
  for (let i = 0; i < LONGITUD_CODIGO; i++) {
    actualizarSlotIntento(i, null);
  }
}

// --- MANEJO DE EVENTOS Y FLUJO DE JUEGO ---

function manejarSeleccionColor(event) {
  const colorCode = event.target.dataset.color;
  const indexVacio = gameState.combinacionActual.findIndex(
    (c) => c === undefined
  );

  if (indexVacio !== -1) {
    gameState.combinacionActual[indexVacio] = colorCode;
    actualizarSlotIntento(indexVacio, colorCode);
  } else {
    gameState.combinacionActual[LONGITUD_CODIGO - 1] = colorCode;
    actualizarSlotIntento(LONGITUD_CODIGO - 1, colorCode);
  }
}

function manejarEnvio() {
  /** Lógica que se ejecuta al presionar 'ENVIAR INTENTO'. */

  // 1. Verificar si el intento está completo
  if (gameState.combinacionActual.some((c) => c === undefined)) {
    DOM_CACHE.mensaje.textContent = `Selecciona las ${LONGITUD_CODIGO} opciones.`;
    return;
  }

  // Desactivar la fila activa anterior (si existe)
  if (gameState.intentoActual > 1) {
    document
      .getElementById(`Fila${gameState.intentoActual - 1}`)
      .classList.remove("fila-activa");
  }

  // 2. Crear, añadir y activar la nueva fila (al inicio del tablero)
  const nuevaFila = crearFilaIntento(gameState.intentoActual);
  nuevaFila.classList.add("fila-activa");

  // 3. Evaluar
  const pistas = evaluarIntento(
    gameState.combinacionActual,
    gameState.codigoSecreto
  );

  // 4. Mostrar Feedback en la fila recién creada
  mostrarFeedback(pistas, gameState.combinacionActual, nuevaFila.id);

  // 5. Chequear Victoria
  if (pistas.negros === LONGITUD_CODIGO) {
    DOM_CACHE.mensaje.textContent =
      "¡FELICITACIONES! 🎉 ¡Decifraste el código secreto!";
    DOM_CACHE.pistas.textContent = `En solo ${gameState.intentoActual} turnos`;
    DOM_CACHE.btnEnviar.disabled = true;
    nuevaFila.classList.remove("fila-activa"); // Quita la marca de activa al ganar
    return;
  }

  // 6. Chequear Derrota
  if (gameState.intentoActual >= gameState.maxIntentosActual) {
    DOM_CACHE.mensaje.textContent = `¡No tienes más intentos! 😭 
    El código secreto era: ${codigoSecreto.join(" ")}`;
    DOM_CACHE.btnEnviar.disabled = true;
    nuevaFila.classList.remove("fila-activa");
    return;
  }

  // 7. Preparar el siguiente turno
  nuevaFila.classList.remove("fila-activa"); // Desactiva la fila después de la jugada
  gameState.intentoActual++;
  resetearIntentoActual();
  DOM_CACHE.mensaje.textContent = `Turnos restantes ${
    NIVELES.FACIL.intentos + 1 - gameState.intentoActual
  }.`;
  DOM_CACHE.pistas.textContent = `Claves: ${pistas.negros} Negro(s), ${pistas.blancos} Blanco(s).`;
}

// --- INICIALIZACIÓN DEL JUEGO ---

document.addEventListener("DOMContentLoaded", () => {
  DOM_CACHE = {
    // Contenedores principales
    tablero: document.getElementById("tablero-juego"),
    controles: document.getElementById("controles"),
    mensaje: document.getElementById("mensaje"),
    pistas: document.getElementById("pistas"),

    // Slots del intento actual
    slotsActuales: document.querySelectorAll("#intento-actual .slot-intento"),

    // Botones
    btnEnviar: document.getElementById("btn-enviar"),
    btnBorrar: document.getElementById("btn-borrar"),

    // Paleta
    paletaColores: document.getElementById("paleta-colores"),
  };

  // Obtener la selección inicial y forzar la carga del nivel
  const selectNivel = document.getElementById("select-nivel");

  // Si el selector existe, usamos el valor por defecto del select
  if (selectNivel) {
    // Usamos la clave del select (ej: "MEDIO") para obtener el objeto NIVELES.MEDIO
    iniciarNivel(NIVELES[selectNivel.value]);
  } else {
    // Nivel por defecto (FACIL)
    iniciarNivel(NIVELES.FACIL);
  }
  // 2. Asignar Event Listeners a los botones
  DOM_CACHE.btnEnviar.addEventListener("click", manejarEnvio);
  DOM_CACHE.btnBorrar.addEventListener("click", resetearIntentoActual);
});
// Sugerencias y modificaciones al repositorio https://github.com/Cuackzoide/Mastermind GRACIAS!
