// --- CONFIGURACIÓN GLOBAL ---
const COLORES_DISPONIBLES_BASE = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']; // 10 Colores: Rojo, Azul, Verde, Morado, Naranja, Gris, Cian, Negro, Rosa, Amarillo
const MAPA_COLORES = {
    '1': 'red', '2': 'blue', '3': 'green', '4': 'purple', 
    '5': 'orange', '6': 'gray', '7': 'Brown', '8': 'black',
    '9': 'pink', '10': 'yellow'
};
const LONGITUD_CODIGO = 4;
const MAX_INTENTOS = 20;

// Definición de Niveles de Dificultad
const NIVELES = {
    FACIL: { nombre: "Fácil", colores: 4, intentos: 20 },
    MEDIO: { nombre: "Medio", colores: 6, intentos: 20 }, 
    DIFICIL: { nombre: "Difícil", colores: 8, intentos: 20 },
    EXPERTO: { nombre: "Experto", colores: 10, intentos: 20 }
};

// --- ESTADO DEL JUEGO ---
let codigoSecreto = [];
let intentoActual = 1; 
let maxIntentosActual = NIVELES.FACIL.intentos;
let paletaActual = COLORES_DISPONIBLES_BASE.slice(0, NIVELES.FACIL.colores);
let combinacionActual = Array(LONGITUD_CODIGO).fill(undefined);

// --- LÓGICA DE MASTERMIND (CORE) ---
 // 1. Iniciar el nivel predeterminado (FACIL)
    iniciarNivel(NIVELES.FACIL);

    // 2. Crear el menú de dificultad para que aparezcan las opciones
        function iniciarNivel(nivelSeleccionado) {
    // Resetear el estado del juego
    intentoActual = 1;
    maxIntentosActual = nivelSeleccionado.intentos;
    paletaActual = COLORES_DISPONIBLES_BASE.slice(0, nivelSeleccionado.colores);
    
    // Limpiar la interfaz (Tablero y Mensajes)
    document.getElementById('tablero-juego').innerHTML = ''; // Limpiar el tablero
    document.getElementById('btn-enviar').disabled = false;
    document.getElementById('mensaje').textContent = `Nivel: ${nivelSeleccionado.nombre}. Intentos: ${maxIntentosActual}`;

    // Generar elementos del juego
    generarPaletaColores();
    generarCodigoSecreto();
    resetearIntentoActual();
}

function generarCodigoSecreto() {
    /** Genera el código secreto usando la paleta actual. */
    codigoSecreto = [];
    for (let i = 0; i < LONGITUD_CODIGO; i++) {
        const randomIndex = Math.floor(Math.random() * paletaActual.length);
        codigoSecreto.push(paletaActual[randomIndex]);
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
    const paletaDiv = document.getElementById('paleta-colores');
    paletaDiv.innerHTML = '';

    // Itera sobre la paletaActual
    paletaActual.forEach(colorCode => {
        const button = document.createElement('button');
        button.className = 'color-pin';
        button.dataset.color = colorCode;
        button.style.backgroundColor = MAPA_COLORES[colorCode];
        // Asegúrate de que los colores más oscuros (Negro/Cian) tengan letras legibles si es necesario
        if (colorCode === 'B' || colorCode === 'C') { 
            button.style.color = 'white';
        }
        button.textContent = colorCode;
        button.addEventListener('click', manejarSeleccionColor);
        paletaDiv.appendChild(button);
    });
}

function crearFilaIntento(filaNum) {
    /** Crea una fila para el historial y la añade al inicio del tablero (prepend). */
    const tablero = document.getElementById('tablero-juego');
    const filaDiv = document.createElement('div');
    filaDiv.className = 'fila-mastermind';
    filaDiv.id = `Fila${filaNum}`;
    
    // Slots de Intento (colores del jugador)
    const grupoSlots = document.createElement('div');
    grupoSlots.className = 'grupo-slots';
    for (let slot = 1; slot <= LONGITUD_CODIGO; slot++) {
        const slotDiv = document.createElement('div');
        slotDiv.id = `Fila${filaNum}_Slot${slot}`;
        slotDiv.className = 'slot-intento-historial';
        grupoSlots.appendChild(slotDiv);
    }
    filaDiv.appendChild(grupoSlots);
    
    // Slots de Respuesta (Feedback)
    const grupoRespuestas = document.createElement('div');
    grupoRespuestas.className = 'grupo-respuestas';
    for (let r = 1; r <= LONGITUD_CODIGO; r++) {
        const respuestaDiv = document.createElement('div');
        respuestaDiv.id = `Fila${filaNum}_Respuesta${r}`;
        respuestaDiv.className = 'slot-respuesta';
        grupoRespuestas.appendChild(respuestaDiv);
    }
    filaDiv.appendChild(grupoRespuestas);

    // Añadir la nueva fila AL PRINCIPIO del tablero, ya que el intento más reciente va arriba ^-^
    tablero.prepend(filaDiv); 
    return filaDiv;
}

function actualizarSlotIntento(index, colorCode) {
    /** Actualiza el slot de la combinación actual */
    const slot = document.querySelector(`#intento-actual .slot-intento[data-index="${index}"]`);
    if (colorCode) {
        slot.style.backgroundColor = MAPA_COLORES[colorCode];
        slot.dataset.color = colorCode;
    } else {
        slot.style.backgroundColor = 'white';
        slot.dataset.color = '';
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
    const pinesFeedback = filaDiv.querySelectorAll('.slot-respuesta');
    let pinIndex = 0;

    // Pines Negros (correctos y en la posición correcta)
    for (let i = 0; i < pistas.negros; i++) {
        pinesFeedback[pinIndex].style.backgroundColor = 'black';
        pinIndex++;
    }

    // Pines Blancos (presentes pero en la posición incorrecta)
    for (let i = 0; i < pistas.blancos; i++) {
        pinesFeedback[pinIndex].style.backgroundColor = 'white';
        pinesFeedback[pinIndex].style.border = '1px solid black';
        pinIndex++;
    }
}

function resetearIntentoActual() {
    /** Borra la combinación actual y el array */
    combinacionActual = Array(LONGITUD_CODIGO).fill(undefined);
    for (let i = 0; i < LONGITUD_CODIGO; i++) {
        actualizarSlotIntento(i, null);
    }
}

// --- MANEJO DE EVENTOS Y FLUJO DE JUEGO ---

function manejarSeleccionColor(event) {
    const colorCode = event.target.dataset.color;
    const indexVacio = combinacionActual.findIndex(c => c === undefined);
    
    if (indexVacio !== -1) {
        combinacionActual[indexVacio] = colorCode;
        actualizarSlotIntento(indexVacio, colorCode);
    } else {
        combinacionActual[LONGITUD_CODIGO - 1] = colorCode;
        actualizarSlotIntento(LONGITUD_CODIGO - 1, colorCode);
    }
}

function manejarEnvio() {
    /** Lógica que se ejecuta al presionar 'ENVIAR INTENTO'. */
    const mensajeDiv = document.getElementById('mensaje');
    const pistasDiv = document.getElementById('pistas');
    const botonEnviar = document.getElementById('btn-enviar');
    
    // 1. Verificar si el intento está completo
    if (combinacionActual.some(c => c === undefined)) {
        mensajeDiv.textContent = "Selecciona los 4 colores.";
        return;
    }

    // Desactivar la fila activa anterior (si existe)
    if (intentoActual > 1) {
        document.getElementById(`Fila${intentoActual - 1}`).classList.remove('fila-activa');
    }
    
    // 2. Crear, añadir y activar la nueva fila (al inicio del tablero)
    const nuevaFila = crearFilaIntento(intentoActual);
    nuevaFila.classList.add('fila-activa');
    
    // 3. Evaluar
    const pistas = evaluarIntento(combinacionActual, codigoSecreto);

    // 4. Mostrar Feedback en la fila recién creada
    mostrarFeedback(pistas, combinacionActual, nuevaFila.id);
    
    // 5. Chequear Victoria
    if (pistas.negros === LONGITUD_CODIGO) {
        mensajeDiv.textContent = "¡FELICITACIONES! ¡Decifraste el código secreto!";
        pistasDiv.textContent = `En solo ${intentoActual} turnos`;
        botonEnviar.disabled = true;
        nuevaFila.classList.remove('fila-activa'); // Quita la marca de activa al ganar
        return;
    } 
    
    // 6. Chequear Derrota
    if (intentoActual >= MAX_INTENTOS) {
        mensajeDiv.textContent = `¡No tienes más intentos! El código secreto era: ${codigoSecreto.join(' ')}`;
        botonEnviar.disabled = true;
        nuevaFila.classList.remove('fila-activa');
        return;
    }
    
    // 7. Preparar el siguiente turno
    nuevaFila.classList.remove('fila-activa'); // Desactiva la fila después de la jugada
    intentoActual++;
    resetearIntentoActual();
    mensajeDiv.textContent = `Turnos restantes ${NIVELES.FACIL.intentos + 1 - intentoActual}.`;
    pistasDiv.textContent = `Claves: ${pistas.negros} Negro(s), ${pistas.blancos} Blanco(s).`;
}

// --- INICIALIZACIÓN DEL JUEGO ---

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Obtener la selección inicial y forzar la carga del nivel
    const selectNivel = document.getElementById('select-nivel');
    
    // Si el selector existe, usamos el valor por defecto del select
    if (selectNivel) {
        // Usamos la clave del select (ej: "MEDIO") para obtener el objeto NIVELES.MEDIO
        iniciarNivel(NIVELES[selectNivel.value]); 
    } else {
        // Fallback si el HTML tarda en cargar o hay error: Nivel por defecto (FÁCIL o MEDIO)
        iniciarNivel(NIVELES.FACIL); 
    }
    
    // 2. Asignar Event Listeners (permanece igual)
    document.getElementById('btn-enviar').addEventListener('click', manejarEnvio);
    document.getElementById('btn-borrar').addEventListener('click', resetearIntentoActual);
});