**Listado de las funcionalidades esenciales para un videojuego básico de Parqués:**

1. Representación del tablero y fichas  
   • Modelo de datos que refleje casillas, “casa” de cada color, zona segura y meta.  
   • Renderizado gráfico (sprites, colores).

2. Gestión de jugadores  
   • Configuración de 2–4 jugadores (local, CPU u online).  
   • Asignación de color y fichas.

3. Tirada de dados  
   • Lógica de generación aleatoria de dos dados.  
   • Animación/efecto visual de la tirada.

4. Lógica de movimiento  
   • Cálculo de posibles casillas según el valor de los dados.  
   • Validación de reglas: sólo mover ficha si saca par (en los dos dados el mismo número) para salir de la casa, no sobrepasar meta, etc.

5. Captura
   • Comer ficha enemiga al caer sobre ella (la envía de vuelta a casa).

6. Zonas seguras  
   • Identificación de casillas donde no se puede comer.  
   • Respeto de estas reglas al mover.

7. Gestión de turnos  
   • Si un jugador saca par (en los dos dados el mismo número), puede volver a lanzar.
   • Si tiene todas las fichas en la casa tiene tres tiros para salir.
   • Solo se puede salir si saca par, para está implementación simpre saca como máximo dos fichas.
   • Indicador visual de turno activo.

8. Condición de victoria  
   • Detección automática cuando un jugador lleva sus 4 fichas a la meta.  
   • Pantalla de fin de partida y opción de reiniciar.

9. Interfaz de usuario y controles  
   • Selección de ficha con clic/tap o teclado.  
   • Botón para tirar dados.  
   • Mensajes de ayuda/instrucciones básicas.

10. Feedback audiovisual  
    • Animaciones de movimiento y captura.  
    • Efectos de sonido para dados, movimiento, victoria.