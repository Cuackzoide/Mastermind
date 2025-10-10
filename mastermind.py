import random

# --- CONFIGURACIÓN DEL JUEGO ---
COLORES_DISPONIBLES = ['ROJO', 'AZUL', 'AMARILLO', 'BLANCO', 'CAFE', 'VERDE', 'NEGRO', 'NARANJO']
LONGITUD_CODIGO = 4
MAX_INTENTOS = 50

# --- LÓGICA DEL JUEGO ---

def generar_codigo_secreto(colores, longitud):
    """Genera una lista de colores aleatorios para el código secreto."""
    return random.choices(colores, k=longitud)

def evaluar_intento(intento, secreto):
    """
    Compara el intento del jugador con el código secreto y devuelve las pistas.
    Devuelve un diccionario con 'negros' (color y posición correctos) y 'blancos' (solo color correcto).
    """
    negros = 0
    blancos = 0
    
    # Copias mutables para contar y evitar doble conteo
    secreto_restante = list(secreto)
    intento_restante = list(intento)

    # 1. Contar Pines Negros (Posición y Color Correctos)
    indices_a_remover = []
    for i in range(LONGITUD_CODIGO):
        if intento_restante[i] == secreto_restante[i]:
            negros += 1
            indices_a_remover.append(i)
    
    # Eliminar las coincidencias perfectas para el cálculo de pines blancos
    for i in sorted(indices_a_remover, reverse=True):
        secreto_restante.pop(i)
        intento_restante.pop(i)
        
    # 2. Contar Pines Blancos (Solo Color Correcto)
    for color_intento in intento_restante:
        if color_intento in secreto_restante:
            blancos += 1
            # Eliminar la primera ocurrencia del color en el secreto para evitar doble conteo
            secreto_restante.remove(color_intento) 
            
    return {'negros': negros, 'blancos': blancos}

def validar_intento(intento):
    """Verifica si el intento es válido (longitud y colores)."""
    if len(intento) != LONGITUD_CODIGO:
        return False
    for color in intento:
        if color not in COLORES_DISPONIBLES:
            return False
    return True

# --- FUNCIÓN PRINCIPAL DEL JUEGO ---

def jugar_mastermind():
    """Bucle principal que ejecuta el juego."""
    print("--- ¡Bienvenido a Mastermind CLI! ---")
    print(f"Colores disponibles (iniciales): {', '.join(COLORES_DISPONIBLES)}")
    print(f"Tienes que adivinar un código de {LONGITUD_CODIGO} colores.")
    print(f"Máximo de intentos: {MAX_INTENTOS}\n")
    
    codigo_secreto = generar_codigo_secreto(COLORES_DISPONIBLES, LONGITUD_CODIGO)
    
    # DEBUG: Descomentar para ver el código secreto al inicio (solo para pruebas)
    # print(f"DEBUG: Código Secreto es {codigo_secreto}") 
    
    intentos_restantes = MAX_INTENTOS

    while intentos_restantes > 0:
        print(f"\n--- Intento {MAX_INTENTOS - intentos_restantes + 1} de {MAX_INTENTOS} ---")
        
        # 1. Entrada del Jugador
        entrada = input(f"Ingresa {LONGITUD_CODIGO} colores separados por espacio (ej. ROJO AZUL VERDE AMARILLO): ").upper()
        intento_jugador = entrada.split()
        
        # 2. Validación
        if not validar_intento(intento_jugador):
            print("❌ Entrada no válida. Asegúrate de usar 4 colores válidos (ej. ROJO AZUL VERDE AMARILLO).")
            continue
        
        # 3. Evaluación
        pistas = evaluar_intento(intento_jugador, codigo_secreto)
        
        # 4. Salida/Feedback
        print(f"Tu intento: {intento_jugador}")
        print(f"Pistas: {pistas['negros']} Pin(es) Negro(s) | {pistas['blancos']} Pin(es) Blanco(s)")
        
        # 5. Condición de Victoria
        if pistas['negros'] == LONGITUD_CODIGO:
            print("\n🎉 ¡FELICIDADES! ¡Adivinaste el código!")
            break
        
        intentos_restantes -= 1
    
    # Fin del juego
    if intentos_restantes == 0:
        print("\n😔 ¡Se acabaron los intentos!")
        print(f"El código secreto era: {codigo_secreto}")

# Ejecutar el juego
if __name__ == "__main__":
    jugar_mastermind()