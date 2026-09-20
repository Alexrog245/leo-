# ARCADE 404

**Classic games. Reimagined.**

Diez juegos arcade reconstruidos desde cero con HTML, CSS y JavaScript puro.
Sin framework ni build: abres `index.html` y juegas. Los recursos visuales y el
sonido local se difieren hasta que un modo los necesita, salvo las dos pistas
preparadas para el relevo fluido entre HOME y el selector.

```
SNAKE · INVADERS · PONG · BREAKER · STACK · CHESS · BLOCK BLAST · PAC 404 · OPERACIÓN 404 · TURNO 404
```

---

## Ejecutar

Opción directa (funciona con doble clic):

```bash
# abre index.html en tu navegador
```

Opción recomendada (evita cualquier restricción de `file://`):

```bash
python3 -m http.server 3000
# http://localhost:3000
```

Comprobación estática sin instalar paquetes:

```bash
node tools/verify-project.js
```

Smoke de audio HOME/HUB (autoplay desde el parseo, crossfade de tensión y fallback invisible):

```bash
node tools/smoke-home-audio.js
```

Smoke de campaña de TURNO 404 (protocolos Fácil/Normal/Difícil, cinemática, guía manual, monitor con escenas de cámara legibles y avatar del interlocutor, sin fila estática de personajes, tres noches, rutas, clientes técnicos, horror visual no punitivo, reloj final y revelación):

```bash
node tools/smoke-turno404-campaign.js
```

Smoke de OPERACIÓN 404 (arte externo, apoyo VIP, dificultad, Sil, Sala VIP, Taller, cajas de arsenal y botín sin freeze):

```bash
node tools/smoke-op404-refinements.js
```

Smoke de lectura manual (hilo global y OP404 no avanzan escenas por temporizador):

```bash
node tools/smoke-story-controls.js
```

Smoke de VIP Central (acceso abierto, saldo inicial cero, conversión de score, trivia de afinidad y Companion de campo):

```bash
node tools/smoke-vip-central.js
```

---

## Estructura del proyecto

Organizado por capas: **estilos** divididos por responsabilidad y **lógica** dividida
en núcleo reutilizable + un módulo por juego. Nada de un único CSS gigante.

```
arcade404/
├── index.html                 # Marcado: boot, topbar, home, hub y contenedor de juegos
│
├── assets/                    # Ilustraciones PNG y cuatro pistas MP3 locales
│   ├── favicon.png             # Icono cuadrado generado a partir de la marca
│   ├── logo.png
│   ├── Davinchi/ Desire/ Rog/ Sil/ Sr de las colinas/  # 14 expresiones por personaje
│   ├── Enemigos/ Jefes/        # Arte usado por OPERACIÓN 404 y el dossier
│   ├── Home/                   # Backdrop pixel-art del distrito nocturno de inicio
│   └── Sonido/                 # Inicio, tensión, horror y click para navegación/juegos
│
├── css/
│   ├── main.css               # ÚNICO punto de entrada: sólo @imports ordenados
│   │
│   ├── base/                  # Cimientos
│   │   ├── tokens.css         # Design tokens (color, tipografía, radios, motion, capas)
│   │   ├── reset.css          # Reset + normalización + foco + scrollbar
│   │   ├── typography.css     # Títulos, etiquetas mono, <kbd>, utilidades de texto
│   │   ├── animations.css     # Keyframes reutilizables
│   │   └── utilities.css      # .sr-only y helpers
│   │
│   ├── layout/                # Estructura de la página
│   │   ├── background.css     # Resplandores, retícula y barrido
│   │   ├── crt.css            # Scanlines, ruido y viñeta
│   │   ├── shell.css          # .app, .screen, .game-root, system-info
│   │   ├── topbar.css         # Marca, estado y acciones
│   │   ├── footer.css
│   │   └── boot.css           # Secuencia de arranque
│   │
│   ├── components/            # Piezas reutilizables
│   │   ├── button.css         # .btn, variantes, .icon-button
│   │   ├── hud.css            # HUD compacto de una línea (stats, vidas, selectores)
│   │   ├── overlay.css        # READY / PAUSA / GAME OVER
│   │   ├── taunt.css          # Caras de neón, diablito y pixel art del gordo
│   │   ├── touch.css          # D-Pad y acciones táctiles
│   │   └── transition.css     # Cortina de listones entre HOME y el selector
│   │
│   ├── screens/
│   │   ├── home.css
│   │   ├── hub.css            # Cabecera, rejilla y pie del selector
│   │   ├── vip.css            # Sala VIP: escena, foco, trivia, tienda y vínculos
│   │   └── game.css           # Pantalla de juego: barra + HUD + tablero + avisos transitorios
│   │
│   ├── cards/
│   │   ├── card.css           # Tarjeta del hub (hover + selección)
│   │   └── previews.css       # Mini-previstas animadas de cada juego
│   │
│   └── games/                 # Sólo ajustes finos: acento y proporción del escenario
│       ├── snake.css  invaders.css  pong.css
│       └── breaker.css  tetris.css  chess.css  blockblast.css  pac404.css  op404.css  turno404.css
│
├── js/
    ├── app.js                 # Bootstrap: boot, reloj, sonido, rutas, teclado global
    │
    ├── core/                  # Núcleo compartido (ningún juego lo duplica)
    │   ├── utils.js           # DOM, números, formato, entorno
    │   ├── storage.js         # Récords y ajustes (localStorage + respaldo en memoria)
    │   ├── assets.js          # Manifiesto de 92 recursos, carga diferida y helpers Canvas/DOM/audio
    │   ├── vip.js             # FICHAS, acceso abierto de campaña, trivia, afinidad y apoyos persistentes
    │   ├── audio.js           # Sintetizador WebAudio: efectos + música procedimental
    │   ├── loop.js            # Bucle de paso fijo + medidor de FPS
    │   ├── input.js           # Teclado global: keydown + keyup + suelta todo al perder el foco
    │   ├── canvas.js          # Lienzo con coordenadas lógicas y DPR
    │   ├── registry.js        # Registro de juegos
    │   ├── pixelart.js        # Sprites pixel a pixel (el gordo) → SVG o canvas
    │   ├── taunts.js          # Burlas y excusas: 5 caras de neón por juego
    │   ├── game-shell.js      # Ciclo, overlay, apoyo Companion e input táctil
    │   ├── router.js          # Rutas por hash (#/, #/hub, #/vip, #/game/<id>)
    │   ├── hub.js             # Construcción y navegación del selector
    │   └── vip-central.js     # Vista y controles de VIP Central
    │
    └── games/                 # Un archivo por juego, autocontenido
        ├── snake.js  invaders.js  pong.js  breaker.js
        ├── tetris.js  chess.js  blockblast.js  pac404.js  turno404.js
        └── op404/             # El FPS va en carpeta:
            ├── maps.js        #   mundos, sub-niveles y mapas ampliados 34x32
            ├── sprites.js     #   enemigos, jefes, armas, dinero y texturas
            ├── intro.js       #   cinemática de introducción (5 viñetas)
            ├── shop.js        #   Sala VIP: checkpoint + Sr. De Las Colinas
            ├── clap.js        #   bolsa del CLAP: tabla útil 60/40 de la caja ciega
            └── game.js        #   motor de raycasting y lógica de campaña
│
└── tools/
    ├── serve.py               # Servidor local mínimo
    ├── verify-project.js      # Verificación estática sin dependencias
    ├── smoke-home-audio.js    # Smoke de autoplay, crossfade HOME/HUB y fallbacks
    ├── smoke-turno404-campaign.js  # Smoke de noches, rutas, clientes y revelación de TURNO 404
    ├── smoke-op404-refinements.js  # Smoke de arte, VIP, Sil, Sala VIP y botín de OP404
    └── smoke-vip-central.js        # Smoke de economía global, acceso abierto y compañeros
```

### Orden de carga

Los scripts se cargan como **scripts clásicos** (sin `type="module"`) para que la
página funcione incluso abierta con `file://`. Todos comparten el namespace
`window.Arcade404`. El orden es: `core/` → `games/` → `app.js`.

---

## Controles

| Tecla | Acción |
| --- | --- |
| `ENTER` | Entrar al arcade / empezar / reintentar |
| `↑ ↓ ← →` `WASD` | Navegar en el hub y moverse en los juegos |
| `ESC` | Volver atrás |
| `P` | Pausar / reanudar |
| `M` | Silenciar o activar el sonido |
| `V` | Abrir **VIP Central** desde el hub o desde avisos de campaña |
| `Y` | Activar el impulso del **Companion** equipado (desde nivel 2) |
| `R` | Abrir / cerrar los registros de TURNO 404 (dentro de ese juego) |

### VIP Central: economía entre juegos

El botón **VIP** de la barra, **VIP CENTRAL** del selector y el **Sr. de las
Colinas** pulsable en HOME abren una sala global separada de la Sala VIP interna
de OPERACIÓN 404. En HOME Colinas no lleva rótulo: al pulsar literalmente su
silueta se abre la escena VIP, con la misma ciudad pixel/synthwave del HOME,
retícula neón, reflejos y alfombra roja. Un perfil nuevo empieza con **0 FICHAS
VIP**. **OPERACIÓN 404** y **TURNO 404** quedan con acceso abierto mientras se
ajustan sus campañas: no piden ni consumen tickets. Las partidas convierten el
score en FICHAS al cerrar (cada 50 puntos suma una ficha, además de un mínimo de
progreso); OP404 y TURNO404 acreditan también cada zona o tramo superado. El saldo persiste en
`arcade404:vip-central:v1` junto con su historial breve. Un perfil de cortesía
intacto de la versión previa se migra automáticamente al inicio en cero, sin tocar
partidas o compras reales.

- **Introducción guiada:** en la primera visita, Colinas recibe al jugador y
  Desire, Davinchi, Rog y Sil se incorporan uno a uno a una cinemática breve. Cada
  cual explica score, fichas, campañas abiertas, suministros o vínculos desde su personalidad.
  El estado `vipIntroSeen` evita repetirla por obligación; **VER INTRODUCCIÓN** la
  reproduce de nuevo cuando se quiera. `ESPACIO`, `ENTER`, `←` y `→` también
  controlan la secuencia; nunca cambia sola de escena.
- **Foco vivo en la sala:** sin ningún menú abierto el elenco completo permanece
  en sus posiciones. Al elegir a alguien, su cuerpo deja temporalmente su pedestal
  y pasa al primer plano del diálogo; al cambiar de persona o cerrar el menú, el
  anterior reaparece con una transición de regreso.
- **Afinidad y trivia:** cada canal habilitado contiene exactamente **cinco
  bloques** de conversación. El personaje comparte una pista sobre su historia,
  gusto o forma de ayudar y luego plantea una pregunta de tres respuestas. Cada
  bloque se guarda una sola vez: un acierto añade **+9** afinidad y un error resta
  **−4**. Regalos y partidas siguen siendo rutas adicionales para subir el vínculo.
- **Apoyos reales y Companion de campo:** los apoyos propios de cada integrante
  siguen afectando directamente OP404/TURNO404. En **OPERACIÓN 404**, el personaje
  equipado se materializa como una mascota pixelada caminante dentro del mapa: desde
  Confianza (nivel 2) recoge efectivo lejano, desde Sincronía (nivel 3) alerta
  emboscadas y desde Vínculo (nivel 4) entrega pequeñas recuperaciones o balas;
  Leyenda potencia esos buffs. `Y` activa el impulso de foco desde nivel 2 en cualquier
  ROM (dos usos desde nivel 4), sin crear un overlay ni una mini-pantalla fija.
- **Acceso de campaña abierto:** OPERACIÓN 404 y TURNO 404 se pueden iniciar,
  reiniciar y volver a probar sin tickets mientras se afinan. Los saldos de pases
  antiguos se conservan intactos y no se convierten automáticamente en FICHAS.
- **Mesa de Colinas y suministros:** el anfitrión ofrece kit de campo, café de
  guardia y buffer de clientes. Sus botones siguen siendo pulsables aun sin saldo:
  muestran cuánto falta y Colinas responde de forma contextual. El kit se aplica a
  OP404; café y buffer se aplican a TURNO404 en el siguiente ingreso compatible,
  sin mezclar FICHAS VIP con el dinero local de la campaña FPS. Desde el mostrador
  se puede abrir también su propio vínculo de compañero.

### El hilo narrativo

Nueve de los diez juegos forman **una sola historia**, presentada a ritmo de
lectura del jugador. **TURNO 404** es el modo paralelo del equipo: usa el mismo
reparto y amplía el universo sin alterar los capítulos de campaña.

Entras a jugar tranquilo, sin nada que leer. Pero **la primera vez** que cruzas
cierta puntuación en un juego, en lugar de la burla de siempre salta una
**cinemática** que avanza el relato. Cada juego de campaña guarda un capítulo. Se desbloquea
una única vez, queda guardado en `localStorage`, y la marca `CAP n` de su tarjeta
en el hub se enciende en dorado.

Durante la cinemática el juego se congela y **nunca pasa solo**: `ESPACIO` muestra
la siguiente viñeta, el botón **SIGUIENTE ESCENA** ofrece el mismo gesto en móvil
y `ENTER` queda como alternativa de accesibilidad. `ESC` la salta de forma
explícita (mientras se cuenta, `ESC` no te saca al hub).

| Cap. | Juego | Se desbloquea a | Qué cuenta |
| --- | --- | --- | --- |
| 1 | Snake | 120 puntos | **El turno de noche.** Rodríguez, agente de ATC, mata el rato con la culebrita a las 3 AM. Belisario, el supervisor que no duerme nunca, lo pilla y lo castiga al archivo |
| 2 | STACK | 4 000 puntos | **La torre de tickets.** Antes del castigo tiene que vaciar la cola. Todos los tickets dicen lo mismo, palabra por palabra: *«MI TELEVISOR ME HABLA Y TIENE RAZÓN»* |
| 3 | Block Blast | 600 puntos | **Sótano de archivo.** Ordenando cajas encuentra un expediente con presupuesto y fechas: *«PROGRAMA DE CONCIENCIA COLECTIVA · FASE 3»*. La fase 3 empieza esa semana |
| 4 | Pong | 5 puntos | **La videollamada.** Reporta el expediente por el canal correcto. Se lo devuelven. Lo reenvía. Se lo devuelven. Esa noche el país entero enciende el televisor |
| 5 | Breaker | 2 500 puntos | **El muro del piso 12.** Despierta y el edificio grita consignas. La escalera está tapiada: alguien no quiere que nadie suba |
| 6 | PAC 404 | 2 000 puntos | **Los conductos.** Huyendo por la ventilación se topa con los otros dos que no cantan: **Desire** y **Davinchi** |
| 7 | Chess | ganar una partida | **La partida.** En el piso 12 no hay laboratorio: hay un tablero. Belisario no está infectado — *él firmó el programa*, y quiere convencerlo |
| 8 | Invaders | 8 000 puntos | **El cielo.** Bajan naves diciendo que vienen a ayudar. El casco lleva el sello del expediente: **Ministerio de la Verdad**. Vienen a rematar |
| 9 | Operación 404 | 6 000 puntos | **La decisión.** Sil traza los nodos, Davinchi abre las rutas, Desire sostiene el refugio, el Sr. de las Colinas carga reservas y Rog enciende la diadema: *«Vamos a cerrar el ticket»*. Enlaza con la campaña del propio juego |

El **capítulo 0** es la cinemática de apertura de Operación 404 (la señal toma
las pantallas y abre los cinco canales); el capítulo 9 desemboca justo ahí y la
ruta sigue por los seis nodos hasta el Comedor.

Técnicamente vive en `js/core/story.js` y se engancha en el **shell**, no en cada
juego: los nueve de campaña lo heredan con una sola llamada a `shell.checkStory(score)`. La
viñeta se dibuja en 640×400 y se encaja centrada en el lienzo de cada juego,
conservando la proporción con barras negras.

## Rendimiento

La versión actual incluye comprobaciones reproducibles sin dependencias:
`node tools/verify-project.js` valida el orden de carga, los **92 recursos** del
manifiesto, los **10 juegos**, los imports CSS y la sintaxis de todos los JS;
`node tools/smoke-home-audio.js` simula autoplay de parser aceptado y bloqueado
para HOME, el crossfade hacia la tensión del selector, sus reintentos automáticos y
los fallbacks invisibles. `node tools/smoke-op404-refinements.js` comprueba sin
navegador el arte integrado, los bonos VIP, el regateo implícito por visita,
mapas ampliados, Taller con persistencia de checkpoint/seguro, cajas de arsenal
escalonadas, Companion y los 5 s de botín jugable. `node tools/smoke-story-controls.js`
confirma que el hilo global y la introducción de OP404 esperan cada avance manual.
`node tools/smoke-turno404-campaign.js` recorre los protocolos Fácil/Normal/Difícil,
la cinemática, la guía manual de cuatro pasos, tres noches, objetivos escalados,
rutas laterales, clientes con lectura técnica, cortes psicológicos no punitivos,
reloj final y derrota contextual.
`node tools/smoke-vip-central.js` comprueba economía global, acceso abierto,
suministros, afinidad y el enlace con GameShell.
También se hizo una smoke test de runtime que monta, inicia, actualiza y renderiza
los diez modos; TURNO 404 valida su oficina, cámaras, energía, cierre, ambiente
de Horror y registros bajo demanda.

| Garantía | Implementación |
| --- | --- |
| Portada inmersiva | HOME ocupa el viewport completo y muestra sólo el distrito, logo, elenco y CTA; la barra, pie y datos periféricos reaparecen al entrar al selector |
| Relevo de módulos | `ENTRAR AL ARCADE` cierra doce listones alternos sobre HOME, monta el hub detrás y los abre en sentido inverso; se respeta `prefers-reduced-motion` |
| Selector conectado | El hub conserva la misma ilustración del distrito, oscurecida con velo, viñeta y retícula para dar contraste a sus módulos de recreativa |
| Carga inicial medida | HOME carga el logo, la ilustración de distrito, los cinco retratos y las dos pistas necesarias para el relevo (`Inicio` y tensión); archivo completo, enemigos y jefes siguen diferidos |
| Escena viva | La ilustración pixel-art integra luna, skyline, recreativas, CRT, mascotas y suelo sin panel central; el cielo pulsa, las nubes se desplazan, el OVNI patrulla y el CTA queda anclado al viewport |
| Recursos visuales | `A.assets` solicita y cachea PNG opcionales; OPERACIÓN 404 prepara los retratos enemigos de la zona antes del primer frame y usa una baliza de señal, nunca el sprite procedural anterior, mientras un PNG termina de cargar |
| Encuadre coherente | Las siluetas transparentes se calibran por arte visible; el raycaster recorta márgenes fuente de enemigos/jefes sin duplicar los PNG |
| Pausa segura | El shell detiene bucles, audio local y `requestAnimationFrame` pendiente al salir |
| Movimiento reducido | Una media query global desactiva animaciones/transiciones no esenciales |

Optimizaciones aplicadas en esta revisión:

- **OPERACIÓN 404** cachea los degradados de techo y suelo por zona en vez de
  reconstruirlos en cada uno de los 60 frames por segundo. Además negocia un
  perfil gráfico: escritorio conserva 320 rayos con canvas a 1,25×; táctil o
  hardware limitado usa 192 rayos, 1× y presentación estable a 30 FPS mientras
  el input/lógica mantiene su paso fijo. Si dos mediciones reales caen por debajo
  de 42 FPS, baja una vez al perfil seguro sin reiniciar la partida.
- **OPERACIÓN 404** consulta la línea de visión de cada enemigo por celda o cada
  85–140 ms, limita partículas/charcos/decals/rayos persistentes y prepara los
  IDs únicos de enemigos al cargar una zona, antes del primer frame. Los enemigos
  invocados después conservan una cola escalonada de un PNG cercano por ciclo
  (más lenta en táctil); mientras decodifica aparece una baliza de señal en lugar
  del sprite procedural anterior. Las transmisiones normales preparan el
  retrato de su voz; una alerta de jefe prepara exactamente al jefe y a quien
  lo reporta durante la lectura manual, antes de reanudar la cola de arte.
- **Shell y bucle** cachean nodos/valores del HUD para no forzar escritura DOM en
  cada tick y descartan acumulación de simulación obsoleta tras un frame caro,
  con lo que una caída puntual puede recuperarse en vez de encadenar stutter.
- **Breaker** reutiliza un degradado por combinación de paleta y altura en lugar
  de crear uno por ladrillo y por frame (hasta 60 por fotograma).
- **Snake** comparte un único degradado para todos los muros, trasladando el
  contexto en vez de generar uno por bloque.
- **Invaders** pre-renderiza cada sprite a un lienzo cacheado por patrón, color
  y brillo, y agrupa los píxeles contiguos de cada fila en un solo `fillRect`.
  Antes pintaba ~6.000 rectángulos con `shadowBlur` por fotograma: el P95 del
  frame baja de **228 ms a 0,9 ms** con 90 invasores en pantalla.
- **PAC 404** cachea el laberinto completo en un lienzo (solo se repinta al
  cambiar de nivel o mundo): `drawMaze` pasa de 2,8 ms a 0,1 ms.

### Sonido y música

Los efectos y la música de los juegos clásicos se sintetizan con WebAudio. Las pistas
locales de `assets/Sonido/` complementan esa capa: **Inicio** ambienta HOME,
**Ambiente de tensión** acompaña el selector, `click` se reproduce al activar
cualquier control de interfaz, la pista de **Davinchi** se prueba al pulsar su
silueta en HOME y **TURNO 404** reserva `horror-turno404.mp3` para el relevo de
las 04:00 AM.

Las dos pistas de navegación se declaran invisibles en el HTML con `preload="auto"`.
**Inicio** además usa `loop`, `playsinline` y `autoplay`, por lo que el navegador la
descubre durante el parseo; recibe un intento explícito inmediato y reintentos en
`canplay`, `window.load`, `pageshow` y al volver a HOME. La pista de tensión no hace
autoplay: al pulsar `ENTRAR AL ARCADE` se inicia a volumen cero **dentro de ese gesto**
y Inicio comienza a bajar. Cuando los listones terminan de cubrir HOME, tensión sube de
forma gradual mientras Inicio completa su salida y se revela el selector. Así no se crea
una segunda instancia de Inicio ni hay un corte entre módulos. La tensión se pausa al abrir
un juego y ambas
pistas respetan los interruptores independientes `SFX` y `MSC`.

No se muestra un botón de ambiente. Si una política del navegador o un iframe bloquea
audio audible sin interacción —algo que ningún sitio puede forzar—, el primer clic,
toque o tecla lo reintenta de forma invisible.

La música es procedimental: un secuenciador programa bajo, arpegio y batería
sobre una escala por pista, con seis ambientes (`hub`, `arcade`, `arena`,
`tenso`, `doom`, `jefe`). Cada juego declara el suyo con el campo `music` de su
registro y el shell la arranca, la atenúa al pausar y la detiene al salir.
OPERACIÓN 404 salta sola a la pista `jefe` en las zonas con jefe.

| Juego | Controles propios |
| --- | --- |
| **Snake** | `WASD` / flechas para girar |
| **Invaders** | `← →` mover, `ESPACIO` disparar |
| **Pong** | `W / S` pala izquierda (o ratón), `↑ / ↓` pala derecha en 2P. El **límite de puntos** (5, 7, 11, 15 o 21) se elige en la barra de controles |
| **Breaker** | `← →` o ratón para la pala, `ESPACIO` lanzar |
| **STACK** | `← →` mover, `↑ / X` rotar, `Z` rotar inverso, `↓` caída rápida, `ESPACIO` soltar, `C` guardar. Cruza el tablero con arena de un solo color |
| **Chess** | Clic en pieza y clic en destino; `UNDO` para deshacer |
| **Block Blast** | Arrastra la pieza a la rejilla; `1 2 3` elegir, flechas mover, `ENTER` colocar, `B` bomba 3×3. Los bloques especiales estallan solos al romperse su línea |
| **OPERACIÓN 404** | En cada escena: `ESPACIO` avanza una sola viñeta; `ENTER` es alternativa y `ESC` salta explícitamente. Los dossiers de zona también esperan `ESPACIO` / toque antes del combate. En la Sala VIP: `↑ ↓` elegir, `ENTER` comprar, **`R` pedir descuento** (o hablar/tocar al Sr. de las Colinas) y `ESPACIO` salir; la bienvenida avanza línea por línea con Espacio/toque. En juego: `WASD` mover, **ratón o `← →`** mirar, **clic** o `ESPACIO` disparar (mantén con la ametralladora), **rueda** o `1-7` cambiar de arma, `SHIFT` correr, **doble clic** para bloquear el puntero y mirar en continuo (`ESC` lo suelta) — o D-Pad táctil + FIRE |
| **PAC 404** | `WASD` / flechas para girar (o D-Pad táctil). Los chips reinician a los firewalls: cómetelos antes de que dejen de parpadear |
| **TURNO 404** | Tras pulsar jugar, elige **FÁCIL / NORMAL / DIFÍCIL** con `1–3`, toque o clic (`ENTER` confirma el protocolo activo) antes de la cinemática. Al terminarla, la guía de Sil, Davinchi, Desire y Rog avanza con `ESPACIO` / `ENTER`; `ESC` la salta explícitamente y nunca consume recursos. La apertura, la guía y cada relevo esperan un gesto; no hay cuenta atrás narrativa. Durante la guardia: `C` abre el monitor, `1–3` cambia cámara, `E` corta una llamada, `Q` o la notificación abre el mensaje de cliente y `1–3` elige su respuesta, `V` descarga un ducto, `L` ilumina el ventanal, `F` cierra el acceso, `H` te esconde, `ESPACIO` controla el pánico y `R` abre registros. Clic y toque también funcionan |

En móvil aparecen controles táctiles bajo el tablero (D-Pad + acción) o control por
arrastre, según el juego. Tetris incluye **DROP**, las escenas tienen botones de
continuar y el layout responde a orientación, áreas seguras y la altura real del
navegador para que funcione igual en teléfono, tableta y escritorio.

---

## TURNO 404: campaña de horror en la oficina

**TURNO 404** es una campaña breve de horror psicológico y tecnológico en el
centro de soporte del archivo del piso 12. Arranca a las **03:14 AM** con la
cinemática animada **La Noche de las Luces Parpadeantes**: lluvia torrencial,
CRT, café quemado, ozono y humedad rodean al equipo cuando Sil encuentra una
anomalía de audio, Rog detecta un consumo imposible en el sótano y el edificio
sufre un apagón. El expediente 404 describe al **Manguangua** como una entidad
ficticia del archivo de ARCADE 404 —un collage corrupto de voces, imágenes y
pánico, no una biografía ni una afirmación sobre una persona real— antes de que
aparezca en el pasillo y active el protocolo de supervivencia.

La guardia jugable empieza a las **03:18 AM**. Cada noche cruza tres sectores
conectados: **El canal rojo** (03:18–04:00), **El archivo que mira** (04:00–05:00)
y **La última hora** (05:00–06:00). Alcanzar 06:00 cierra esa noche, muestra un
relevo y permite iniciar la siguiente con desgaste parcial; sobrevivir las **tres
noches** completa la campaña. En la recta final, el reloj salta por 05:30, 05:40,
05:45, 05:50 y 05:55: 06:00 sólo aparece al ganar el relevo. Las comunicaciones
de **Desire**, **Davinchi**, **Rog**, **el Sr. de las Colinas** y **Sil** usan sus
retratos emocionales; el transcript conserva los últimos mensajes para que el
deterioro del equipo siga siendo parte de la jugabilidad.

- **Protocolo de dificultad:** antes de la cinemática aparece una pantalla de
  calibración visible. **FÁCIL** amplía el turno un 40% y la ventana base de
  alertas un 65%; **NORMAL** —el recomendado y más amable que el balance
  anterior— amplía el turno un 18% y la ventana base un 34%; **DIFÍCIL**
  conserva la presión original.
  El perfil aplica de forma coherente al reloj, objetivos de cámara, llegada de
  amenazas, ductos, llamadas, clientes, consumo, pánico, recuperaciones y cierre.
  La elección se recuerda localmente para el siguiente ingreso, pero siempre se
  puede escoger otro protocolo antes de arrancar una nueva guardia.
- **Cinemática de apertura:** el logo de ARCADE 404, los cinco integrantes y
  la escena de lluvia aparecen después de elegir protocolo. `ESPACIO`, `ENTER` o
  el botón **CONTINUAR** avanzan exactamente una escena; si no se toca nada, el
  texto se mantiene para poder leerlo.
- **Guía previa de la oficina:** tras la cinemática, Sil explica cámaras (`C`, `1–3`),
  Davinchi asocia cada alerta con `E`, `V` y `Q`, Desire enseña a leer la ficha
  técnica y contestar con empatía (`1–3`), y Rog cubre oscuridad, luz, cierre,
  escondite y respiración. Cada uno de los cuatro pasos espera `ESPACIO`, `ENTER`
  o toque; `ESC` salta la guía. No corre reloj ni se gastan energía, pánico o
  recursos mientras se lee.
- **Objetivo de cámara:** `C` levanta el monitor y `1–3` selecciona recepción,
  pasillo norte o archivo muerto. Mantén a la vista la cámara indicada para
  recuperar la evidencia del nivel. Vigilar a la amenaza correcta también frena
  su aproximación, pero consume energía.
- **Llamadas hostiles:** una señal entra en cada turno. El botón rojo y la tecla
  `E` permiten **CORTAR SEÑAL** antes de que se agote su contador. Ignorarla
  aumenta pánico y acelera al Manguangua; cortarla aporta score y reduce presión.
- **Rutas impredecibles:** además de la puerta, Manguangua puede irrumpir por el
  **DUCTO 04** (`V`), cubrir el **ventanal oeste** (`L`) o abrir el **archivo**
  (`CAM 03`). Cada ruta tiene contador, grito propio al aparecer y una respuesta
  precisa; mientras se contiene, la presión de la puerta se congela unos segundos.
- **Clientes:** cada mensaje dispara una **notificación visible**. Al tocarla,
  pulsar `Q` o usar **ABRIR MENSAJE** aparece la computadora de la oficina con el
  texto completo, una tarjeta de **LECTURA TÉCNICA** y tres respuestas rápidas.
  Los casos usan protocolos coherentes —sensores de ascensor, aislamiento ante
  interferencia, óptica de baja luz, firmas de autenticación y rutas de audio—;
  las frases no etiquetan su tono, pero la que acompaña, protege y explica el paso
  seguro a la persona es la correcta. La respuesta seca deja tensión residual y
  la sarcástica empeora pánico/amenaza; atender con cuidado recupera score y
  recursos. Dejarlo caer resta energía, aumenta pánico y acelera la amenaza sin
  matar de forma arbitraria.
- **Oficina:** Desire usa la luz (`L`) como defensa temporal; Rog administra la
  batería y el cierre hidráulico (`F`); `H` permite ocultarse bajo el escritorio
  si ya no queda otra salida. El Sr. de las Colinas aporta suministros, pánico y
  advertencias cuando el silencio deja de ser seguro.
- **Horror psicológico:** durante una guardia pueden aparecer parpadeos breves y
  cortes ambientales dentro de la oficina. En el corte, el brillo del monitor
  queda como referencia visual. Son sobresaltos de puesta en escena: se aplazan
  si ya hay una alerta importante y **no** modifican reloj, energía, pánico,
  amenazas ni ventanas de respuesta. Con `prefers-reduced-motion` pasan a una
  atenuación estática, sin animación.

- **Pánico, derrota y puntuación:** `ESPACIO` contiene la respiración con
  enfriamiento. Si el Manguangua alcanza al jugador, un grito agudo activa un
  primer plano de su rostro antes del GAME OVER; el texto final cambia según el
  apagón, el pánico, la puerta o una llamada que no fue cortada.
- **Carga, rendimiento y escala:** mientras se elige protocolo se precargan de
  forma no bloqueante el logo, la entidad y las expresiones críticas de la
  cinemática; el resto de retratos sigue bajo demanda y cada recurso se calienta
  una sola vez. La oficina DOM se actualiza por estados, con repintado más rápido
  sólo cuando hay una alerta, y reduce ruido/composición en el modo compacto. El
  marco mide el ancho y alto real del escenario y adapta proporción, densidad,
  filas y columnas para móvil vertical, pantallas bajas, tableta, escritorio y
  formato ultraancho. En alturas extremas prioriza controles, medidores y el
  objetivo antes que dejar filas cortadas o paneles superpuestos.
- **Registros:** `R` congela una guardia en curso para consultar el equipo y el
  dossier de amenazas. Las expresiones se cargan sólo al abrir cada ficha y las
  imágenes externas aparecen bajo demanda.

| Operador | Área | Uso durante la guardia |
| --- | --- | --- |
| **ROG** | Mando táctico y energía | Vigila batería, consumo del sótano y cierre hidráulico |
| **SIL** | Cámaras y señal | Detecta anomalías de audio, valida cámaras y corta interferencias |
| **DESIRE** | Proyectores y luz | Usa la luz como defensa y ayuda a contener el pánico |
| **DAVINCHI** | Accesos y ductos | Marca rutas secundarias y activa las alertas de ventilación |
| **SR. DE LAS COLINAS** | Suministros y tensión | Reacciona al pánico, advierte fallas y sostiene la presión del equipo |

### Voces del equipo

Las transmisiones de **TURNO 404** y los dossiers de **OPERACIÓN 404** comparten
una ficha de voz en `A.assets.characters`, además de sus líneas específicas. Así
cada aviso sigue siendo reconocible incluso bajo presión:

| Personaje | Firma de voz |
| --- | --- |
| **Desire** | delicada, coqueta y protectora; llama **«amor»** mientras calma o cuida |
| **Davinchi** | roquero y tecnológico; explica rutas, cableado y sistemas con un **«yeah»** seguro |
| **Sil** | calcula antes de hablar; frases breves, reflexivas y cortantes centradas en el dato |
| **Rog** | protector, serio y sobrepensador; deja salir humor seco cuando intenta bajar la tensión |
| **Sr. de las Colinas** | mordaz, pretencioso y obsesionado con estatus; satiriza privilegio, acceso y precios VIP |

`assets/Sonido/horror-turno404.mp3` espera hasta que el reloj del turno alcanza
las **04:00 AM** y entra desde casi silencio con un fundido de tres segundos;
luego aumenta discretamente con el riesgo y el pánico. Respeta el interruptor
global de música y se pausa o detiene con el ciclo de vida del juego. El grito
entregado `gritos turno404-562425.mp3` suena cuando el Manguangua aparece por una
ruta crítica, llega a la puerta o toma el primer plano de derrota; si el medio
nativo no se puede reproducir, `caprilesScream` queda como respaldo sintético.
El motor Web Audio conserva `manguanguaWhisper` para la interferencia hostil.
`click.mp3` sigue siendo el sonido global de interfaz y no se superponen Inicio
ni la pista de tensión del selector.

## OPERACIÓN 404: la campaña

El FPS dejó de ser una sucesión de zonas y ahora es una campaña con historia,
mundos, economía y checkpoints.

### Visuales entregados e integración progresiva

`A.assets` conecta el arte externo sin sacrificar la respuesta del raycaster:
al cargar una zona se preparan sus IDs de enemigo únicos antes del primer frame.
Mientras un PNG termina de decodificar, una **baliza de señal** neutral ocupa su
lugar; nunca se ve el sprite procedural anterior antes del retrato integrado. Los
enemigos invocados después sí usan una cola visual de **un PNG cercano y dentro del
visor** por ciclo, por lo que el combate conserva respuesta durante una oleada.

- **Enemigos por mundo:** Chavista, Usuario, Malandro, Calidad, Back Office y
  Colectivo usan sus variantes entregadas cuando aparecen en la zona.
- **Jefes:** Supervisor, Ampa, Maduro, Chávez, el **Manguangua** y Sr. M
  tienen sus ilustraciones asociadas a sus tipos de jefe (la clave técnica del
  asset heredado se conserva internamente por compatibilidad).
- **Compañeros:** **Desire** y **Davinchi** conservan sus nombres definitivos y
  usan sus PNG de cuerpo completo en las salas secretas y en los conductos. En
  el cuadro de diálogo sí cambian a expresiones narrativas por línea —alegría,
  miedo, preocupación, tristeza o firmeza— sin alterar su silueta del mundo.
- **Escala y suelo:** cada enemigo y jefe externo se dibuja con una ficha de
  altura y base propia, más sombra de contacto, para que su silueta quede apoyada
  en el suelo del raycaster sin duplicar imágenes. Los PNG externos se interpolan
  al entrar al visor (el pixel-art procedural conserva su píxel duro), evitando
  el leve dentado/deformación que aparecía a escala fraccional.
- **Sala VIP:** el Sr. de las Colinas precarga su retrato de entrada y carga bajo
  demanda cada gesto (relajado, serio, molesto, feliz o dormido), conservando el
  último listo durante el cambio. La miniatura y la etiqueta de variante aparecen
  dentro de su bocadillo junto al texto. Si la red aún no entregó el primero,
  aparece una tarjeta VIP de sincronización: nunca el vendedor procedural anterior.

### Cinemática de introducción

Al empezar se reproduce una secuencia de cinco viñetas pixel art con el texto
escribiéndose letra a letra (`js/games/op404/intro.js`). Ahora no sólo explica el
desastre: prepara la ruta y el equipo que la sostiene.

1. **CARACAS, 03:00 AM** — la misma imagen aparece en todas las pantallas y
   busca una respuesta.
2. **LA SEÑAL** — el programa de conciencia colectiva convierte monitores en
   órdenes y promete una única voz.
3. **LA CIUDAD RESPONDE** — usuarios, vecinos y funcionarios quedan atrapados
   en el mismo canal; los que saben escuchar resisten.
4. **CINCO CANALES ABIERTOS** — una composición pixel-art presenta a **Sil**
   (red), **Rog** (campo), **Desire** (refugio), **Davinchi** (ruta) y el
   **Sr. de las Colinas** (suministros VIP) con sus colores de operación.
5. **OPERACIÓN 404** — un tablero animado dibuja los seis nodos desde Soporte
   hasta el Comedor y deja claro que el Palacio es una escala, no el final.

`ESPACIO` pasa una sola viñeta (el botón **SIGUIENTE ESCENA** hace lo mismo en
móvil). `ENTER` es una alternativa de accesibilidad y sólo `ESC` salta la
cinemática de forma explícita.

### Dossier de doce zonas y visor táctico

Cada entrada dispara una **transmisión de lectura manual** de
`js/games/op404/maps.js`. El briefing de zona o jefe congela el combate hasta que
se pulse `ESPACIO` o **CONTINUAR TRANSMISIÓN**, de modo que el encargo, la voz y la
expresión emocional se puedan leer sin recibir daño detrás de la tarjeta. Las
pistas de salida durante los **5,0 s de botín** siguen sin bloquear movimiento ni
recolección. Así los doce mapas cuentan una línea continua: se rastrea la señal en
Soporte, se abre la calle, se recuperan las coordenadas del Archivo, se corta el
núcleo de la refinería, se identifica el relé oculto y se llega al **nodo madre**
del Comedor.

- Las **seis zonas con jefe** usan un aviso de amenaza que encuadra su ilustración
  correspondiente; al vencerlas, la pista siguiente aparece durante los **5,0 s
  de botín** sin reducirlos ni bloquear la recolección.
- Las transmisiones distribuyen la agencia entre Sil, Rog, Desire, Davinchi y el
  Sr. de las Colinas. Desire y Davinchi emplean sus expresiones sólo dentro de
  cuadros de diálogo/radio; dentro del mundo 3D mantienen sus cuerpos completos.
- El visor suma un encabezado `OP-404`, radar enmarcado, progreso de los 12 nodos,
  mira contextual y una atmósfera de bajo coste por mundo: barrido de monitores,
  lluvia de neón, polvo de archivo, vapor industrial, estática de retransmisión o
  esporas del nodo madre.
- La nueva cabina CRT combina borde ámbar/cian, profundidad de gabinete y trama
  discreta. No capta eventos de puntero y se congela con `prefers-reduced-motion`.

### Dossier de doce zonas y visor táctico

Cada entrada dispara una **transmisión no bloqueante** de `js/games/op404/maps.js`.
El jugador conserva movimiento, puntería y disparo: la tarjeta sólo transforma el
cartel de zona en un encargo claro, con canal, objetivo, voz y expresión emocional
del elenco. Así los doce mapas cuentan una línea continua: se rastrea la señal en
Soporte, se abre la calle, se recuperan las coordenadas del Archivo, se corta el
núcleo de la refinería, se identifica el relé oculto y se llega al **nodo madre**
del Comedor.

- Las **seis zonas con jefe** usan un aviso de amenaza que encuadra su ilustración
  correspondiente; al vencerlas, la pista siguiente aparece durante los **5,0 s
  de botín** sin reducirlos ni bloquear la recolección.
- Las transmisiones distribuyen la agencia entre Sil, Rog, Desire, Davinchi y el
  Sr. de las Colinas. Desire y Davinchi emplean sus expresiones sólo dentro de
  cuadros de diálogo/radio; dentro del mundo 3D mantienen sus cuerpos completos.
- El visor suma un encabezado `OP-404`, radar enmarcado, progreso de los 12 nodos,
  mira contextual y una atmósfera de bajo coste por mundo: barrido de monitores,
  lluvia de neón, polvo de archivo, vapor industrial, estática de retransmisión o
  esporas del nodo madre.
- La nueva cabina CRT combina borde ámbar/cian, profundidad de gabinete y trama
  discreta. No capta eventos de puntero y se congela con `prefers-reduced-motion`.

### Mundos y sub-niveles

| Mundo | Sub-niveles | Cierra con |
| --- | --- | --- |
| **1 — Oficinas y Call Center** | `1-1` Soporte Técnico · `1-2` Piso Gerencial | **EL SUPERVISOR** |
| **2 — Las Calles de Caracas** | `2-1` El Barrio · `2-2` La Plaza | **EL PRANES** |
| **3 — Archivos del Gobierno** | `3-1` Archivo Central · `3-2` El Palacio | **MADURO** |
| **4 — Control de Refinería** | `4-1` Sala de Control · `4-2` La Refinería | **CHÁVEZ** |
| **5 — Ruta de Salida** | `5-1` La Avenida · `5-2` La Casa del Manguangua | **EL MANGUANGUA** |
| **6 — El Último Turno** | `6-1` Antesala del Comedor · `6-2` El Comedor | **SR. M** |

Son **12 niveles**: el primero de cada pareja amplía la ruta sin jefe y el
segundo enfrenta, en orden, a uno de los seis jefes existentes. Así aparece un
jefe nuevo cada dos niveles sin reemplazar ningún encuentro previo. Cada plano runtime
mide **34 columnas × 32 filas**: el núcleo original conserva sus objetivos y se abre a
un anillo exterior con alas norte, sur, este y oeste. Las rutas laterales contienen
munición, **cajas de arsenal aleatorias** y más candidatos para salas secretas; el
72% de zonas intenta una exploración secreta y el 32% de esas visitas puede abrir una
segunda sala.

### Arsenal variable y cajas de campaña

Las marcas de arma del mapa ya no son recompensas fijas: se resuelven como **cajas
de arsenal** al cargar la zona. La pool empieza con la **Escopeta** y abre una pieza
adicional cada dos zonas, hasta incluir Ametralladora, Lanza-pastichos, Rifle de
Pulso, Crio-pasticho y Rebota-404. Las armas aún ausentes dentro de esa pool tienen
prioridad, por lo que una caja repetida se transforma en munición útil al recogerla.

Los enemigos comunes pueden dejar una caja con una probabilidad baja que crece
ligeramente en la campaña. Cada jefe garantiza una mientras falte un arma elegible;
si ya está completo, conserva una oportunidad limitada de soltar una repetida. Esto
varía el orden de adquisición sin filtrar prototipos de final de campaña a los mapas
iniciales.

### Dinero, Sala VIP y checkpoints

Los enemigos sueltan **monedas y billetes** al caer (los jefes, un fajo). Al
caer el último hostil se abre una ventana de botín de **5,0 segundos exactos**:
puedes moverte, girar y recoger, pero ya no disparar ni recibir daño. Sólo al
agotarse esa cuenta se entra en la **SALA VIP**, pasa a la siguiente zona o se
muestra el final. Además de la Sala, cada zona instala un **checkpoint de campo**:
al caer se restaura una vez el mismo nivel, dinero, munición, arsenal, **carga de escudo**
y módulos del Taller con salud justa según la dificultad. La Sala sigue guardando el progreso
entre zonas y sirve de tienda.

Atiende el **SR. DE LAS COLINAS**: camisa blanca, lentes oscuros, pelo castaño
y una **corona de oro flotando**, siempre relajado con su cerveza **Polar** y un
toboso que dice *«Soy VIP Baby»*. Vende arepas, munición de cuatro tipos (incluidas
celdas de pulso), un chaleco que rellena la vida y una **RECARGA DE ESCUDO** que
suma +40 a la reserva persistente de blindaje. El seguro y los checkpoints conservan
la carga consolidada; Colinas comenta cada compra con su propio repertorio.

Los precios son **caros a propósito** ($35 la bolsa del CLAP, $380 el chaleco):
la idea es que rebusques dinero en cada zona. El catálogo también vende **mejoras
de Furia** y **llamadas a los Yanquis**.

El catálogo va **por categorías** — ARMAS, PROTO, **TALLER**, MUNICIÓN, PODERES,
SEGURO y COMIDA — que se recorren con izquierda / derecha; dentro de cada una se
elige con arriba / abajo. Las armas y el desbloqueo de la Furia se marcan como
**COMPRADO** una vez son tuyos.

**Taller de armas.** La pestaña **TALLER** trabaja sobre el arma equipada y permite
comprar tres niveles de **Impacto** (+14% de daño base por nivel), **Ciclo** (−9%
de espera multiplicativa por nivel, con un límite seguro) y **Control** (menos
dispersión, más velocidad de proyectil y menos retroceso). Cada nivel siguiente
cuesta más; el panel muestra `L0/3`–`L3/3`, el arma objetivo y `MAX` cuando se
completa. Los módulos cambian los disparos reales, el HUD y sobreviven tanto al
checkpoint de campo como al seguro VIP.

**Regateo VIP implícito.** Los cinco márgenes por visita se mantienen internos:
no hay contador ni botón de “5 intentos”. Intentar comprar sin fondos, pulsar
**`R` para pedir descuento** o hablar/tocar directamente al Sr. de las Colinas
inicia la conversación del artículo que no puedes pagar. Cada margen válido
mantiene exactamente **20%** de probabilidad de regalo. Puede caer $18–$42, 24
balas, una arepa de +28, un **seguro VIP** (o $35 si ya tienes uno) o una bolsa
del CLAP; nunca un arma. Cuando el trato entrega algo, el Sr. de las Colinas
incluye: **«Jaja, come ahi tremendo pobre»** antes de mostrar el premio.

Los tratos fallidos —y la insistencia después de agotar los márgenes— elevan el
fastidio del Sr. de las Colinas durante esa visita. Su texto cambia junto con la
variante visual del bocadillo (**RELAJADO**, **SERIO**, **FELIZ**, **MOLESTO** o
**DORMIDO**); al volver a entrar, tanto los cinco márgenes como el fastidio se
renuevan.

**La primera visita es distinta.** El mercader se presenta con un monólogo:
quién es, que la Sala VIP es zona neutral, qué categorías vende y que los seguros
existen *«por si te da por morirte, que no combina con tu perfil»*. Cualquier tecla lo salta.

**Seguro de vida VIP ($400).** Su propia categoría en la tienda. Si te matan
mientras está activo, en vez de game over **reapareces en la Sala VIP** con el
progreso del último checkpoint —dinero, arsenal, **módulos del Taller**, poderes y
hasta la memoria de los aliados— y con la vida al máximo. El seguro se consume, y el Sr. de las
Colinas lo celebra desde su catálogo premium: *«La previsión también es
estatus»* y *«La dignidad se vende aparte y está agotada»*.

**Se duerme.** Si lo dejas quieto un rato se echa a dormir, y si insistes al
hablarle se despierta de mal humor: *«A un miembro fundador no lo despiertan sin
cita»*. Su saludo además **cambia según cómo llegaste** de la zona anterior: si
vienes molido se burla, si vienes intacto lo admite a regañadientes, y si traes la
cartera llena o vacía también lo nota.

### Habilidades: Furia, Yanquis y la Bolsa del CLAP

| Tecla | Habilidad | Qué hace |
| --- | --- | --- |
| **Z** | **FURIA DE ATENCIÓN AL CLIENTE** | pantalla roja: **invulnerable**, cadencia máxima y munición infinita. Se **desbloquea una sola vez** en la tienda y luego sólo se mejora; no se gasta en usos, **se recarga recibiendo daño** |
| **X** | **LLAMADA A LOS YANQUIS** | bombardeo aéreo: barre a la tropa común de la pantalla. Contra jefes **no es un botón de matar**: 15-20% de su vida máxima y **2 s de aturdimiento** |
| **C** | **BOLSA DEL CLAP** | abre la caja ciega: **60% de suministros útiles y 40% de contratiempos** |

La bolsa es el artículo más barato de la tienda y además aparece tirada por los
mapas (1-3 por zona). El 60/40 se decide **antes** de elegir el producto; cada
resultado favorable tiene un efecto alternativo si ya tienes el recurso lleno,
para que abrir una bolsa nunca desperdicie el turno:

| | Resultado | Efecto |
| --- | --- | --- |
| 🟢 | **Azúcar Turbo** | +50% de velocidad durante 4,2 s; quita lentitud y pasta pegada |
| 🟢 | **Nutrivicha Mágica** | recarga +55 de escudo persistente; sólo baja al absorber daño |
| 🟢 | **Harina de Hoja** | +25 de vida; con la vida llena suma una recarga de escudo |
| 🟢 | **Arepa Rellena** | +40 de vida; con la vida llena suma una recarga mayor de escudo |
| 🟢 | **Caja de Munición** | +60 balas, +12 cartuchos y +3 pastichos; con arsenal lleno recarga escudo |
| 🟢 | **Café de Guardia** | limpia lentitud/pasta y activa un sprint corto |
| 🟢 | **Vale de Suministros** | suma efectivo local para la Sala VIP de OPERACIÓN 404 |
| 🟢 | **Sobre de Cafeína** | carga la Furia si está desbloqueada; si no, entrega escudo |
| 🔴 | **Arroz con Gorgojos** | aparece un **Gorgojo Gigante**; sin espacio, aplica lentitud breve |
| 🔴 | **Sardina en Lata Dañada** | resta 18 de vida, sin poder rematarte |
| 🔴 | **Pasta Picada y Deformada** | −30% de velocidad durante 3,8 s |
| 🔴 | **Bolsa Rota** | derrama 45% de munición y 20% del efectivo, pero conserva armas y progreso |

### Salas secretas y compañeros

**La exploración secreta es frecuente, pero nunca obligatoria.** El 72% de zonas
intenta tallar una habitación oculta dentro de un bloque de pared; el 32% de esas
visitas intenta una segunda sala. El aliado queda **justo en el centro**. No hay
puerta marcada: hay que dar con el muro correcto, y encontrarla suena distinto
(la música cambia a la pista `secreta`).

Al entrar arranca una **escena**: cada frase se queda en pantalla hasta pulsar
`ESPACIO` o **SIGUIENTE MENSAJE**; sólo la última confirmación entrega el apoyo.
Y **la historia avanza de verdad** — no te vuelve a contar lo mismo. Cada aliado
tiene un **arco de cinco capítulos**: la primera vez se presenta, la segunda te
reconoce y cuenta qué pasó mientras no estabas, y así hasta un desenlace. Si te
los cruzas más veces de las que hay capítulos, pasan a reencuentros cortos escritos
para poder repetirse. Cada frase selecciona el **retrato emocional** correspondiente;
el cuerpo completo sigue siendo la única representación de Desire y Davinchi dentro
del mundo 3D.

El progreso vive en `allyMet` y **viaja en el checkpoint**, así que morir no les
borra la memoria.

**DESIRE** — piel trigueña, pelo largo y liso con raya al medio, vestido rojo
entallado con falda acampanada y tacones, en pose relajada con una mano en la
cintura. Aparece haciendo la **«V» con los
dedos** mientras cruza la pantalla su viñeta *«Soy VIP Baby»*. Su arco: la
botaron del piso 3 por contestarle a un supervisor → junta a un grupo de
escondidos → los de abajo empiezan a llamarla «la doctora» → el supervisor da
con ellos y pierde a dos → se marcha con los suyos por una salida al este. Te
cura la mitad de la vida, o si llegas entero te deja escudo y la Furia cargada.

**DAVINCHI** — rizos oscuros, lentes de sol y chaqueta de camuflaje, de brazos
cruzados. Su arco: era el de seguridad hasta que le pidieron disparar contra la
gente → mapea los pisos y descubre un patrón → detrás de las puertas custodiadas
hay servidores con todo registrado → le queman el taller → te entrega lo último
que guardaba. Te pasa un **arma que te falte** o munición pesada al tope, más una
llamada a los Yanquis.

### Música por mundo

Cada mundo tiene su propia pista, todas con el ADN industrial de `doom` pero con
distinta tonalidad y tempo, más dos ambientes de descanso:

| Pista | Dónde suena | Carácter |
| --- | --- | --- |
| `m1oficina` | Mundo 1 · call center | corporativo enfermo, ostinato de teléfono que no para |
| `m2calle` | Mundo 2 · Caracas | rápido y callejero, bajo sincopado |
| `m3gobierno` | Mundos 3–4 · gobierno y refinería | marcial y solemne, frigia densa |
| `m4final` | Mundos 5–6 · salida y último turno | apocalíptico, lento, el bajo más grave del juego |
| `vip` | Sala VIP | lounge presumido |
| `secreta` | salas secretas | cálida y breve, un respiro |
| `jefe` | cualquier jefe | manda sobre la pista del mundo |

Los efectos también crecieron: `furia`, `furiaLista`, `bombardeo`, `escudo`,
`bolsa`, `clapBien`, `clapMal` y `secreto`.

### Catálogo de enemigos

| Tipo | Papel | Qué hace |
| --- | --- | --- |
| **CHAVISTA** | común | corre al cuerpo a cuerpo gritando consignas |
| **GORGOJO GIGANTE** | común | sale del arroz de la bolsa del CLAP: rápido y rabioso |
| **USUARIO MOLESTO** | común | tres variantes con cuadros, teclados y monitores |
| **MALANDRO** | común | Oakleys iridiscentes, dispara y se mueve en lateral. *«Mano, ya te la sabes»*, *«Suelta el teléfono»*, *«No me mires el rostro»* |
| **GENTE DE CALIDAD** | común | te lanza **planillas de evaluación**. *«Te faltó un punto»*, *«No maltrates al usuario»*, *«¡Respuesta fuera de parámetro!»* |
| **MOTORIZADO** | común | rapidísimo, embiste. *«¡Quítate!»*, *«Voy en contra»* |
| **BURÓCRATA** | común | lento y duro, lanza **sellos**. *«Vuelva mañana»*, *«Falta una copia»* |
| **COLECTIVO** | común | en moto, dispara y aguanta. *«¡Zona de paz!»* |
| **EL SUPERVISOR** | jefe `1-2` | invoca Gente de Calidad y dispara planillas |
| **EL PRANES** | jefe `2-2` | invoca malandros, cadenas de oro y diente de oro |
| **MADURO** | jefe `3-2` | invoca chavistas y lanza decretos |
| **CHÁVEZ** | jefe `4-2` | tres fases, chorros de petróleo y plumazo en área |
| **EL MANGUANGUA** | jefe `5-2` | se teletransporta y lanza un rayo de texto |
| **SR. M** | jefe final `6-2` | cuchara, charcos y *«¡A comer mierda con cuchara!»* |

## BLOCK BLAST: bloques especiales y objetivos

El bucle base —colocar pieza, completar línea— se queda corto, así que cada
colocación ahora es una decisión.

**Bloques especiales.** Cerca de una de cada cinco piezas trae **una celda
marcada**. No hace nada mientras está en el tablero: el efecto se dispara cuando
esa celda entra en una línea que se rompe. Eso obliga a elegir entre gastarla ya
o colocarla para que caiga dentro de una cadena mayor. Se ven tanto en la
bandeja como en el tablero, con halo palpitante.

| | Especial | Qué hace al estallar |
| --- | --- | --- |
| ✸ | **BOMBA** | revienta el 3×3 de alrededor, y parte la piedra de un solo golpe |
| ⚡ | **RAYO** | limpia su fila y su columna enteras |
| ◆ | **GEMA** | suma una gema y +200 × nivel |
| ★ | **ESTRELLA** | **dobla** la puntuación de toda la rotura |

**Objetivos por nivel.** Antes los seis niveles pedían lo mismo (N líneas). Ahora
son **ocho y cada uno pide algo distinto**, así que hay que cambiar de estrategia
en vez de repetir la misma jugada:

| Nivel | Objetivo |
| --- | --- |
| 1 | Rompe 5 líneas |
| 2 | Recoge 4 gemas |
| 3 | Rompe 9 líneas |
| 4 | Destruye 6 piedras |
| 5 | Encadena 3 roturas seguidas |
| 6 | Recoge 8 gemas |
| 7 | Rompe 18 líneas |
| 8 | Encadena 4 roturas seguidas |

Al subir de nivel aparece un cartel con el objetivo nuevo, y el panel lateral
lleva su barra de progreso y el contador de gemas.

### Paisajes de Block Blast

Cada mundo tiene ahora un decorado propio detrás de la rejilla, en silueta y muy
tenue para que nunca compita con las piezas. Se pinta una sola vez sobre el
sprite cacheado del tablero, así que **no cuesta nada por frame**:

| Mundo | Paisaje |
| --- | --- |
| **TALLER** | skyline de ciudad con ventanas encendidas y antena parpadeante |
| **FÁBRICA** | naves de techo en diente de sierra, chimeneas humeando y un engranaje asomando |
| **NÚCLEO** | pistas de circuito que trepan desde el suelo, con nodos y esporas flotando |
| **SINGULARIDAD** | agujero negro con horizonte de sucesos, disco de acreción elíptico y estrellas estiradas por la gravedad |

## Rendimiento del renderer Canvas

Los siguientes tiempos son el benchmark histórico de los nueve modos Canvas:
400 fotogramas por juego de `update()` + `render()` encadenados tras un
calentamiento de 60 en Chromium headless. **TURNO 404 no redibuja un canvas a
60 fps**: su oficina DOM se sincroniza en intervalos cortos durante la guardia y
al cambiar cámara, energía, cierre, escondite o registros, por lo que se valida
con la smoke test de interacción indicada en la sección anterior. Se reportan
percentiles porque la media se contamina con las pausas del propio entorno de medida:

| Juego | p50 | p95 | Margen sobre 60 fps |
| --- | --- | --- | --- |
| Snake | 0,1 ms | 0,2 ms | 83× |
| Invaders | 0,2 ms | 0,9 ms | 19× |
| Pong | 0,0 ms | 0,1 ms | 167× |
| Breaker | 0,2 ms | 1,0 ms | 17× |
| STACK | 0,3 ms | 5,5 ms | 3× |
| Chess | 0,1 ms | 0,4 ms | 42× |
| Block Blast | 0,1 ms | 0,4 ms | 42× |
| PAC 404 | 0,1 ms | 0,5 ms | 33× |
| Operación 404 | 0,1 ms | 0,3 ms | 56× |

El presupuesto para 60 fps es 16,7 ms por fotograma, así que los modos Canvas
medidos van sobrados. STACK es el más caro porque simula 12 800 granos de arena.

**Optimizaciones aplicadas:**

- **Chess** — las 32 piezas se dibujaban cada fotograma como glifos Unicode con
  `shadowBlur`, lo que obliga a rasterizar tipografía y desenfocar 32 veces por
  frame. Ahora cada pieza se rasteriza **una vez** a su propio canvas y luego
  sólo se copia; el tablero, que nunca cambia, también se cachea. Render de
  1,45 → 0,34 ms (**4,3× más rápido**) y el peor pico de 112 → 21 ms.
- **STACK** — se lleva la cuenta de la **fila más alta con arena** (`topRow`).
  La simulación y el pintado se saltan todo lo que hay por encima, que es vacío
  garantizado, y esa zona se limpia de golpe con `fill` en vez de grano a grano.
- **Invaders** — la nebulosa creaba dos gradientes radiales a pantalla completa
  en cada fotograma; ahora se rasteriza una vez y se copia.
- **Carga** — los 30 scripts llevan `defer`, así que no bloquean el parseo del
  documento. El manifiesto evita que el paquete de PNG/MP3 se descargue completo
  desde la portada: cada modo solicita sólo el arte que va a mostrar.

**Verificado además:**

- **Ciclo de vida explícito.** El shell avisa opcionalmente `pause()` / `resume()`
  a cada modo, pausa el audio local al terminar y `CanvasStage.destroy()` cancela
  cualquier reintento de `requestAnimationFrame` pendiente. Esto evita que un
  modo oculto siga animando o sonando al volver al hub.
- **La arena se conserva**: 80 granos siguen siendo 80 tras 400 pasos de
  simulación, y `topRow` nunca deja arena sin simular por encima.
- Cero `var`, un solo `console.log` (el cartel de bienvenida), y los `== null`
  que quedan son comparaciones laxas intencionales.

## Pantalla de juego: sólo el juego

Al entrar en una partida desaparecen la barra global, el pie y las esquinas de
sistema. Queda únicamente:

```
[← ARCADE]        GAME 01 · SNAKE            [❚❚] [↻] [♪]
        SCORE 000120   BEST 000450   LEN 8   SPEED 1.07x
        ┌────────────────────────────────────────────┐
        │                                            │
        │              TABLERO (máximo tamaño)        │
        │                                            │
        └────────────────────────────────────────────┘
WASD / FLECHAS — MOVER    P — PAUSA    ESC — SALIR
```

- El tablero se calcula con `min(100%, --stage-max, (100dvh - --stage-chrome) * --stage-ratio)`,
  de modo que **nunca hay scroll** y ocupa todo el alto disponible.
  El shell mide además el hueco libre y ajusta `--stage-ratio` (ver «Tablero XL»).
- El lienzo va en `position: absolute` dentro de su marco: así su tamaño intrínseco
  no realimenta el cálculo del marco (evita que el tablero crezca sin control).
- Cada juego sólo declara tres cosas: **`hud`** (stats en una línea), **`controls`**
  (opcional: selector de modo/dificultad, botón de deshacer…) y **`hint`** (pista de
  controles). El resto lo aporta el shell.

## El diablito burlón (y sus caras de neón)

Cuando pierdes contra la máquina aparece un overlay con una **cara de neón** que se
ríe de ti; cuando le ganas, la máquina **busca excusas** para no aceptar la derrota.

```
LA MÁQUINA SE BURLA                 LA MÁQUINA PROTESTA
      ¿EN SERIO?                          NO CUENTA
        (😈 / 🤡 / 😒 / 😪)              (😈 / 🤡 / 😒 / 😪 / 👨 pixel art)
  "La manzana estaba ahí.          "A comer mierda con cuchara.
   AHÍ."                            Has tenido suerte, nada más."
   SCORE 000120  BEST 000450        SCORE 000640  NEW RECORD!
      [↻ RETRY]  [ARCADE]              [↻ RETRY]  [ARCADE]
```

**Cinco caras**, cada una con su tono de neón y su animación:

| Cara | Emoji | Cuándo sale | Neón |
| --- | --- | --- | --- |
| `devil` | 😈 | te machaca (diablito SVG con halo) | magenta |
| `clown` | 🤡 | te toma el pelo | naranja |
| `meh` | 😒 | pasa de ti olímpicamente | cian |
| `sleepy` | 😪 | "estaba dormido, por eso perdí" | violeta |
| `gordo` | pixel art | **cuando TÚ GANAS** | ámbar |

Cada cara tiene varios títulos (`¿EN SERIO?`, `JA JA JA`, `QUÉ RISA`, `ME ABURRES`,
`ZZZ...`, `¡A COMER MIERDA!`…) y frases propias de cada juego; el 75% de las veces
sale una frase específica del juego y el resto del pool genérico.

### El gordo: pixel art hecho a mano

`js/core/pixelart.js` dibuja píxel a píxel (rejilla 32×32, primitivas `rect`,
`ellipse`, `line`, `frame`, contorno automático) a un **español regordete con
boina, lentes de neón y una cuchara en alto**. El mismo sprite se usa en tres
sitios:

1. **Burla al ganar** — `A.taunts.faceMarkup("gordo")` lo mete en el overlay con
   su bocadillo *«¡A COMER MIERDA CON CUCHARA!»*.
2. **Jefe de Invaders** — `A.pixelArt.draw(ctx, sprite, x, y, escala)` lo pinta en
   el lienzo con barra de vida, disparo dirigido y abanico.
3. Reutilizable como fondo o enemigo de cualquier mundo nuevo.

Salida disponible como SVG (`toSvg`, rectángulos por tramos horizontales, nítido a
cualquier tamaño) o pintado en canvas (`draw`).

- Se activa con `shell.gameOver({ taunt: true })` y `shell.win({ taunt: true })`:
  cualquier juego nuevo lo hereda gratis.
- Respeta `prefers-reduced-motion` (sin animaciones).

### La máquina tampoco acepta que subas de nivel

Cada vez que pasas de nivel (o vacías un nodo, o reventas una oleada) aparece un
**aviso flotante sobre el tablero** sin interrumpir la partida: la máquina suelta
una excusa con la misma cara de neón. Se dispara con `shell.levelUpTaunt()`.

```
ESTABA EN OTRA COSA
   NO CUENTA
"Has subido de nivel porque estaba actualizando el software."
```

Las frases van **por juego** (75%) y del pool genérico (25%): STACK dice que
estaba desfragmentando el disco, Snake que se fue a por café, Invaders que los
aliens tenían el wifi cortado, Breaker que puso ladrillos de oferta, Block Blast
que estaba contando píxeles y PAC 404 que los firewall estaban en mantenimiento.
Ninguna admite que hayas ganado: siempre estaba haciendo otra cosa.

## Tablero XL: la rejilla se adapta a tu pantalla

El marco del juego ya no tiene una proporción fija: el shell mide el hueco libre
real (ancho y alto disponibles) y calcula `--stage-ratio` dentro de los límites que
declara cada juego (`ratioMin` / `ratioMax`). Después cada juego **reconstruye su
rejilla** con `stage.setLogical(ancho, alto)`.

| | 1280×720 | 1440×900 | 1920×1080 |
| --- | --- | --- | --- |
| Snake | 1212×577 | 1392×757 | 1400×937 |
| Invaders | 866×577 | 1136×757 | 1200×803 |
| Pong | 1232×577 | 1340×729 | 1340×897 |
| Breaker | 866×577 | 1136×757 | 1160×776 |
| Chess | 750×577 | 984×757 | 1200×923 |

(Antes Snake era un cuadrado de 577×577 en 720p: el tablero pasa de 333k a 699k
píxeles de superficie, el doble, sin scroll en ninguna resolución.)

Snake pasa de 20 a hasta 42 columnas, Invaders de 10 a 18, Breaker estira sus
patrones a 13 columnas y Chess abre un **panel lateral** con las piezas capturadas
cuando sobra ancho.

## Mundos

| Juego | Mundos | Qué cambia |
| --- | --- | --- |
| **Snake** | `NEO` · `RUINAS` · `LABERINTO` · `NEXO` | NEO sin obstáculos; RUINAS con escombros aleatorios por nivel; LABERINTO con pasillos y huecos alternos; NEXO con pilares y **2 portales** que teletransportan |
| **Invaders** | `ÓRBITA` · `NEBULOSA` · `CIUDADELA` | Paleta, número de búnkeres (3/4/2), blindaje (CIUDADELA aguanta 2 golpes), cadencia de marcha y **cada cuántas oleadas sale el jefe** (3/3/2) |
| **Pong** | `CLÁSICO` · `ASTEROIDES` · `AGUJERO NEGRO` · `PÓRTAL` | CLÁSICO limpio; ASTEROIDES con 3 bloques móviles que rebotan la bola; AGUJERO NEGRO con gravedad que la atrae; PÓRTAL con topes arriba y abajo |
| **Breaker** | `CLÁSICO` · `ARCADE` · `TRÉBOL` · `NEÓN` | 15 patrones nuevos: corazón, calavera, flecha, zigzag blindado, **trébol de 4 hojas**, herradura, arcoíris, estrella, jaula de neón y hélice |
| **Block Blast** | `TALLER` · `FÁBRICA` · `NÚCLEO` · `SINGULARIDAD` | Paleta, patrón del fondo (rejilla, rayas, puntos, anillos) y color de la piedra. Cambian cada 3 roturas seguidas, con cartel y **burla del gordo** |
| **PAC 404** | `CIRCUITO` · `NEXO` · `SINGULARIDAD` | Un **laberinto distinto** por mundo (19×21, simétrico, validado: todos los paquetes alcanzables), paleta de neón y velocidad creciente en sus 2 nodos |
| **OPERACIÓN 404** | `SOPORTE TÉCNICO` · `EL BARRIO` · `EL PALACIO` · `LA REFINERÍA` · `LA CASA DEL MANGUANGUA` · `EL COMEDOR` | Tres texturas de pared por zona (pizarra, graffiti, retrato oficial, PDVSA, cuadro de la V, **bandera de España y Sagrada Familia**), techo, suelo y niebla propios |

### Patrones de formación de Invaders

Además de los jefes, **cada oleada cambia cómo se mueve la flota**. La primera es
siempre la clásica —que el jugador aprenda la regla antes de que se la rompan— y
a partir de ahí rotan cinco patrones, anunciados al empezar la oleada:

| Patrón | Cómo se comporta |
| --- | --- |
| **FORMACIÓN CERRADA** | la marcha de toda la vida |
| **VAIVÉN** | avanza despacio pero la formación se balancea de lado |
| **AVALANCHA** | pasos largos y caídas grandes: baja encima muy rápido |
| **SERPIENTE** | ondula con fuerza mientras avanza |
| **ACECHO** | lentísima y casi quieta, pero cada rebote baja un salto enorme |

### Jefes de Invaders — uno por mundo

Antes los tres mundos reutilizaban el mismo sprite, así que no había forma de
distinguirlos. Ahora cada uno tiene el suyo, con sprite, aguante y maneras
propias:

| Mundo | Jefe | Cómo pelea |
| --- | --- | --- |
| ÓRBITA | **NODRIZA** | nave nodriza con cúpula y pinzas; abanico de 5, ritmo normal |
| NEBULOSA | **CEREBRO** | cerebro flotante con tentáculos; abanico corto de 3 pero **apunta casi el doble de seguido** y se mueve un 45% más rápido |
| CIUDADELA | **FORTALEZA** | fortaleza acorazada; lenta (70% de velocidad) y con **40% más de vida**, pero descarga muros de **7 chorros** |



Cada cierto número de oleadas aparece **el jefe** (el gordo del pixel art): entra
en escena, patrulla de lado a lado, dispara **tiro dirigido** y **abanico de 5**,
tiene barra de vida (`A.ui.meter`) y al caer suelta 4 power-ups y 500×oleada puntos.

## Niveles, dificultad y power-ups

| Juego | Niveles | Dificultad | Power-ups |
| --- | --- | --- | --- |
| **Snake** | 1 nivel cada 4 manzanas (más velocidad y obstáculos) | `CALM / NORMAL / FURY` | ORO (×60), LENTO, RECORTE, ESCUDO, **FANTASMA** (atraviesa muros) |
| **Invaders** | Oleadas infinitas (+1 fila cada pocas oleadas) | `CALM / NORMAL / FURY` (cadencia y marcha) | TRIPLE, BARRERA, CONGELAR, BOMBA, VIDA |
| **Pong** | Partida a 11 puntos | Modo `1P vs CPU / 2P LOCAL` + CPU `EASY / NORMAL / HARD` | PALA GRANDE, MULTIBOLA, RIVAL LENTO |
| **Breaker** | 3-5 niveles por mundo (4 mundos) | Bloques de 1-5 golpes + bloques indestructibles | ANCHO, LENTO, MULTIBOLA, VIDA, LÁSER, PEGAMENTO |
| **STACK** (Sandtrix) | Sube de nivel cada 5 líneas; cada 2 niveles cambia de mundo y de paleta | Nivel de inicio `1 / 5 / 10` | **HOLD** (`C`), pieza fantasma y **combos** (varias líneas con la misma pieza) |
| **Chess** | Sin tablas: si se atasca, la CPU se rinde | `EASY 1 ply / NORMAL 2 ply / HARD 3 ply` | — (tiene deshacer, **rendirse** y registro SAN) |
| **Block Blast** | **8 niveles con objetivos distintos**: líneas, gemas, piedras destruidas y cadenas | `CALMA / NORMAL / RUIDO` (piedra, bombas y frecuencia de especiales) | **4 bloques especiales** (✸ ⚡ ◆ ★) · **BOMBA 3×3** (una cada 4 roturas seguidas, hasta 3) · cambio de mundo cada 3 |
| **PAC 404** | 3 mundos × 2 nodos (6 niveles): más velocidad y menos tiempo de reinicio | `LENTO / NORMAL / RÁPIDO` | CHIP (reinicia: 200 · 400 · 800 · 1600) y **el gordo** de bonus |
| **OPERACIÓN 404** | **12 zonas ampliadas a 34×32**: seis parejas; cada primer nivel no tiene jefe y cada segundo presenta un jefe existente nuevo; alas y rutas secundarias contienen secretos | `FÁCIL / NORMAL / DIFÍCIL` — HP, velocidad, daño, efectivo, drops y checkpoint por zona; se guarda por separado para OP404 | Arsenal: PISTOLA, ESCOPETA, AMETRALLADORA, LANZA-PASTICHO, **RIFLE DE PULSO** (perfora), **CRIO-PASTICHO** (área/lentitud) y **REBOTA-404** (3 rebotes); balas, cartuchos, pastichos y celdas. Cajas de arsenal con pool escalonada y Taller 3×3 por arma |

## Cada juego

| # | Juego | Detalles de implementación |
| --- | --- | --- |
| 01 | **Snake** | Rejilla adaptativa (hasta 42×20), cola de direcciones, 4 mundos con obstáculos y portales, niveles de velocidad, comida especial con caducidad, escudo y fantasma |
| 02 | **Invaders** | Sprites pixel a pixel, 3 mundos, oleadas infinitas, **jefe con barra de vida, tiro dirigido y abanico**, búnkeres destructibles (con blindaje en CIUDADELA), power-ups que caen |
| 03 | **Pong** | Física de rebote por punto de contacto, 4 mundos (bloques móviles, gravedad, topes), IA con error aleatorio y 3 niveles, modo 1P/2P, multibola, contador de peloteo |
| 04 | **Breaker** | 4 mundos con 15 patrones (corazón, calavera, flecha, **trébol de 4 hojas**, herradura, arcoíris, estrella, jaula, hélice), 6 power-ups, multibola, láser y bola pegada |
| 05 | **STACK** (Sandtrix) | Tablero de **80×160 granos** (cada celda del tetromino son 8×8 partículas). La pieza baja entera y, al tocar suelo o arena, **se desmorona en granos de su color** que caen y se **escurren en diagonal** hasta acumularse (autómata celular a 150 Hz). **Se limpia una línea cuando una capa continua de UN color une la pared izquierda con la derecha** (flood fill por componentes, aunque serpentee). Destello, puntuación por granos, combos si una misma pieza cierra varias capas, DAS, wall-kicks, fantasma, hold y 4 mundos con **paisaje** |
| 06 | **Chess** | Motor completo: enroque, al paso, promoción, jaque/mate, notación SAN, IA minimax con poda alfa-beta (1/2/3 plies), **piezas de neón**, panel de capturas y **nunca hay tablas** |
| 07 | **Block Blast** | Rejilla 8×8, bandeja de 3 piezas (18 poliominós con pesos), arrastre con ratón/dedo y modo teclado. Al reventar una fila **los bloques caen**: si la caída arma otra línea se **encadena un combo** (ROTO · DOBLE · TRIPLE… con multiplicador). **Bloques especiales**: algunas piezas traen una celda marcada que estalla al entrar en una línea — ✸ revienta el 3×3, ⚡ limpia fila y columna, ◆ suma una gema, ★ dobla los puntos de la rotura. **8 niveles con objetivos variados** (líneas, gemas, piedras, cadenas), cada uno con su cartel. Cada tres roturas seguidas (o cadena de 3) **cambia el mapa**: 4 mundos con paleta y patrón propios y **burla del gordo**. Bombas 3×3 y bloques de piedra |
| 09 | **OPERACIÓN 404** | **FPS de raycasting al estilo DOOM** (antes *Mierda 404*): selector persistente `FÁCIL / NORMAL / DIFÍCIL` que ajusta HP, velocidad, daño, drops y checkpoint de campo sin cambiar las 12 zonas ampliadas; al limpiar una zona hay **5 segundos de botín con movimiento** y transición automática. **Sil** puede aparecer en una sala cifrada con su PNG de cuerpo completo y aporta un fondo directo para la Sala VIP. Muros texturizados con DDA, sprites pixel art con z-buffer y recorte por columnas, minimapa, charcos y decals. **Inventario de armas**: pistola, escopeta, ametralladora, lanza-pasticho, Rifle de Pulso (perfora), Crio-Pasticho (área/lentitud) y Rebota-404 (tres rebotes), con balas, cartuchos, pastichos y celdas. Las cajas de arsenal varían su obtención dentro de una pool escalonada y el Taller mejora por separado impacto, ciclo y control de cada arma. El Companion equipado camina dentro del mapa, reacciona al peligro/jefe y escala recolección, alertas y buffs con la afinidad. Enemigos: **CHAVISTAS** (camisa PSUV y gorra roja, melee corriendo y gritando consignas), **USUARIOS MOLESTOS** (cuadros, teclados y monitores) y **MALANDROS** (franela de esqueleto, gorra al revés y **Oakleys iridiscentes**, disparan y se mueven en lateral). Jefes: **MADURO** (bigote, chaqueta tricolor, dedo arriba; esponja de daño que **invoca chavistas** y lanza decretos), **CHÁVEZ** (corona de laureles, túnica de decretos, sentado en un barril: **3 fases**, chorros de petróleo y plumazo en área), **EL MANGUANGUA** (gorra de la V, sonrisa esquelética: **se teletransporta** a rincones y suelta un **rayo de texto** que ralentiza y daña) y el secreto **SR. M** (gafas verde neón, camisa de cuadros, cuchara, bocadillo *«¡A COMER MIERDA CON CUCHARA!»*: persigue, golpea y su cucharada deja **charcos** que ralentizan) en un **comedor con bandera de España y Sagrada Familia**. Controles con `keyup` real: nada se queda pegado. **Ratón completo**: girar moviendo el puntero (con zona muerta central), disparar con clic, cambiar de arma con la rueda y bloqueo de puntero opcional con doble clic |
| 08 | **PAC 404** | El arcade de siempre: túnel lateral, cuatro firewalls con el targeting clásico (TRAZA persigue, PROXY embosca 4 casillas por delante, CACHE dobla el vector desde TRAZA, SPAM huye si te acercas), **fases de dispersión y persecución** con media vuelta al cambiar, chip que los reinicia para comértelos (200/400/800/1600), ojos volviendo a casa, **fruta: el gordo del pixel art** (+bonus y burla), vida extra cada 10.000, `¡LISTO!` entre vidas y **3 mundos con laberinto propio × 2 nodos** |

El motor de ajedrez está validado con **perft** sobre las 5 posiciones estándar
(inicio, Kiwipete, posiciones 3, 4 y 5), todas correctas hasta profundidad 3.

El enrutador es a prueba de fallos: si un juego lanzara una excepción al abrirse, la
pantalla se oculta y se vuelve al selector en lugar de dejar dos juegos visibles.

---

## Añadir un juego nuevo

1. Crea `js/games/mijuego.js` y regístralo:

```js
(function (A) {
    "use strict";

    class MiJuego {
        constructor(shell) {
            this.shell = shell;
            this.stage = A.createStage(shell.refs.stage, { width: 600, height: 600 });
            this.reset();

            shell.setTouchControls({
                mode: "dpad",                          // dpad | dpad-fire | pointer | none
                onDirection: (dir) => this.mover(dir)
            });
        }

        reset()   { /* estado inicial */ }
        start()   { this.reset(); }
        restart() { this.reset(); }
        update(dt) { /* lógica */ }
        render()   { /* dibujo */ }
        key(key, event) { /* devuelve true si la consume */ }
        destroy()  { this.stage.destroy(); }
    }

    A.registerGame({
        id: "mijuego",
        number: "07",
        name: "MI JUEGO",
        genre: "ARCADE / ACCIÓN",
        accent: "var(--color-cyan)",
        accentRgb: "34 211 238",
        cardRgb: "34 211 238",
        preview: `<span class="preview preview--mijuego"></span>`,

        hud: `
            ${A.ui.stat("score", "SCORE", "000000")}
            ${A.ui.stat("best", "BEST", "000000")}
            ${A.ui.divider()}
            ${A.ui.lives("lives", 3)}
        `,

        hint: "← → — MOVER    ESPACIO — ACCIÓN    P — PAUSA    ESC — SALIR",

        create: (shell) => new MiJuego(shell)
    });

})(window.Arcade404);
```

2. Añade la etiqueta `<script src="./js/games/mijuego.js"></script>` en `index.html`.
3. Si quieres ajustes propios, crea `css/games/mijuego.css` e impórtalo en `css/main.css`.

El juego hereda automáticamente: barra mínima (salir / pausa / reiniciar / sonido),
música según el campo `music` de su registro,
overlay de READY/PAUSA/GAME OVER, récord persistente, controles táctiles,
pista de controles y enrutado por hash.

Para terminar una partida basta con llamar a:

```js
this.shell.gameOver({ title: "GAME OVER", text: "...", score: this.score });
this.shell.win({ title: "YOU WIN", text: "...", score: this.score });
```

---

## Persistencia

- Récords por juego en `localStorage` bajo el prefijo `arcade404:best:<id>`.
- Ajustes (sonido, música y dificultad de ajedrez) en `arcade404:settings`; la dificultad de OPERACIÓN 404 se guarda de forma independiente en `arcade404:op404:difficulty`.
- Economía de **VIP Central** (FICHAS, inventario, compañeros, afinidad e historial) en `arcade404:vip-central:v1`; los tickets heredados se conservan pero las campañas están abiertas durante ajustes.
- Si el navegador bloquea el almacenamiento (modo privado), todo sigue funcionando
  en memoria sin errores.

---

## Detalles de calidad

- **Accesibilidad**: navegación completa por teclado, `:focus-visible` en todos los
  elementos interactivos, región `aria-live` para los cambios de pantalla y control de
  `prefers-reduced-motion` (desactiva animaciones y la intro).
- **Rendimiento**: paso fijo para la lógica, un solo `requestAnimationFrame`, un único
  listener de teclado y lienzo escalado a `devicePixelRatio` (máx. 2).
- **Multiplataforma**: rejilla de 3 / 2 / 1 columnas en el hub, paneles que se
  reubican bajo el tablero, metadatos web-app para inicio móvil, áreas seguras
  para notch, `visualViewport` para la barra dinámica del navegador y un modo
  compacto horizontal para teléfono.
- **Controles táctiles**: D-Pad, acción, pausa, arrastre donde aplica y captura de
  puntero; Tetris incorpora DROP para que la caída fuerte no dependa del teclado.
- **Sin scroll horizontal** y con `touch-action: none` sobre los lienzos.
