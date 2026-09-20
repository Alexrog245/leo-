/* =========================================================
   ARCADE 404 — HILO NARRATIVO

   Los nueve juegos cuentan UNA sola historia. Cuando un
   capítulo se desbloquea, la partida se pausa y cada viñeta
   espera una decisión del jugador: ESPACIO (o el botón de
   continuar) muestra la siguiente escena.

   La idea: entras a jugar tranquilo. Pero la primera vez
   que superas cierta puntuación en un juego, en lugar de
   la burla de siempre salta una CINEMÁTICA que avanza el
   relato a tu propio ritmo. Cada juego es un capítulo.

   El hilo, en orden:

     Cap. 0  (intro de OPERACIÓN 404)
             Caracas cae cuando una señal de conciencia colectiva
             toma las pantallas. Cinco canales de emergencia
             organizan la respuesta.

     Cap. 1  SNAKE — El turno de noche
             Rodríguez, agente de ATC, mata el rato con la
             culebrita. El supervisor Belisario lo pilla.

     Cap. 2  STACK — La torre de tickets
             Castigado a vaciar la cola. Los tickets caen
             como arena y no paran de subir.

     Cap. 3  BLOCK BLAST — Sótano de archivo
             Ordenando cajas encuentra expedientes que no
             deberían existir: el virus tiene nombre y
             presupuesto.

     Cap. 4  PONG — La videollamada
             Belisario le devuelve cada pregunta como una
             pelota. Nadie quiere quedarse el tema.

     Cap. 5  BREAKER — El muro del piso 12
             Rodríguez decide subir. El edificio no le deja.

     Cap. 6  PAC 404 — Los pasillos
             Huyendo por los conductos, perseguido por los
             ya infectados. Conoce a Desire y Davinchi.

     Cap. 7  CHESS — La partida con Belisario
             El supervisor lo espera con un tablero. No
             quiere pelear: quiere convencerlo.

     Cap. 8  INVADERS — El cielo
             El gobierno pide ayuda arriba. Bajan naves.
             Rodríguez descubre a quién sirven de verdad.

     Cap. 9  OPERACIÓN 404 — El asalto
             Los cinco canales trazan la ruta hacia el Palacio.
             La diadema se enciende; la campaña sigue hasta el
             Comedor y el último nodo.

   Cada capítulo se desbloquea UNA vez, se guarda en
   localStorage y se puede volver a ver desde el hub.
   ========================================================= */

(function (A) {

    "use strict";

    const WIDTH = 640;
    const HEIGHT = 400;

    const CHAR_MS = 26;
    const HOLD_MS = 1400;
    const FADE_MS = 400;

    const STORE_KEY = "story:seen";


    /* ---------------------------------------------------------
       Utilidades de dibujo compartidas
       --------------------------------------------------------- */

    function rect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }


    /* Ruido determinista: mismo x,y devuelve siempre lo mismo,
       así los fondos no parpadean entre fotogramas. */
    function noise(x, y) {

        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;

        return n - Math.floor(n);

    }


    /* Silueta de edificio con ventanas encendidas */
    function edificio(ctx, x, y, w, h, color, ventana, semilla) {

        rect(ctx, x, y, w, h, color);

        const cols = Math.max(1, Math.floor(w / 9));
        const rows = Math.max(1, Math.floor(h / 12));

        for (let r = 0; r < rows; r += 1) {

            for (let c = 0; c < cols; c += 1) {

                if (noise(semilla + c * 3.1, r * 7.7) > 0.55) {

                    rect(
                        ctx,
                        x + 4 + c * 9,
                        y + 5 + r * 12,
                        4,
                        6,
                        ventana
                    );

                }

            }

        }

    }


    /* Cielo en degradado vertical */
    function cielo(ctx, arriba, abajo) {

        const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);

        g.addColorStop(0, arriba);
        g.addColorStop(1, abajo);

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

    }


    /* Monitor de tubo: la pantalla donde trabaja Rodríguez */
    function monitor(ctx, x, y, w, h, glow, contenido) {

        /* Carcasa */
        rect(ctx, x - 6, y - 6, w + 12, h + 16, "#1B2130");
        rect(ctx, x - 3, y - 3, w + 6, h + 6, "#0A0D16");

        /* Pantalla */
        rect(ctx, x, y, w, h, "#060A12");

        ctx.save();

        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        if (contenido) {
            contenido();
        }

        /* Líneas de barrido */
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#000000";

        for (let sy = y; sy < y + h; sy += 3) {
            ctx.fillRect(x, sy, w, 1);
        }

        ctx.restore();

        /* Resplandor del tubo */
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = glow;
        ctx.fillRect(x - 14, y - 14, w + 28, h + 28);
        ctx.restore();

        /* Peana */
        rect(ctx, x + w / 2 - 14, y + h + 10, 28, 6, "#1B2130");

    }


    /* Personaje sentado de espaldas, en silueta */
    function oficinista(ctx, x, y, escala, color, pelo) {

        const s = escala;

        /* Respaldo de la silla */
        rect(ctx, x - 20 * s, y - 4 * s, 40 * s, 44 * s, "#141926");

        /* Hombros */
        rect(ctx, x - 17 * s, y + 6 * s, 34 * s, 30 * s, color);

        /* Cuello */
        rect(ctx, x - 5 * s, y - 2 * s, 10 * s, 8 * s, "#C68642");

        /* Cabeza */
        rect(ctx, x - 10 * s, y - 20 * s, 20 * s, 20 * s, "#C68642");

        /* Pelo */
        rect(ctx, x - 11 * s, y - 23 * s, 22 * s, 9 * s, pelo);

        /* Diadema de call center: el arma del agente */
        rect(ctx, x - 13 * s, y - 16 * s, 3 * s, 8 * s, "#22D3EE");
        rect(ctx, x + 10 * s, y - 16 * s, 3 * s, 8 * s, "#22D3EE");
        rect(ctx, x - 12 * s, y - 24 * s, 24 * s, 3 * s, "#22D3EE");

        /* Micrófono */
        rect(ctx, x - 13 * s, y - 8 * s, 8 * s, 2 * s, "#22D3EE");

    }


    /* Figura de pie, de frente, en silueta con contorno */
    function figura(ctx, x, y, escala, ropa, piel, pelo) {

        const s = escala;

        /* Piernas */
        rect(ctx, x - 9 * s, y + 22 * s, 7 * s, 26 * s, "#12161F");
        rect(ctx, x + 2 * s, y + 22 * s, 7 * s, 26 * s, "#12161F");

        /* Torso */
        rect(ctx, x - 13 * s, y - 4 * s, 26 * s, 28 * s, ropa);

        /* Brazos */
        rect(ctx, x - 18 * s, y - 2 * s, 6 * s, 24 * s, ropa);
        rect(ctx, x + 12 * s, y - 2 * s, 6 * s, 24 * s, ropa);

        /* Manos */
        rect(ctx, x - 18 * s, y + 22 * s, 6 * s, 5 * s, piel);
        rect(ctx, x + 12 * s, y + 22 * s, 6 * s, 5 * s, piel);

        /* Cuello y cabeza */
        rect(ctx, x - 4 * s, y - 9 * s, 8 * s, 6 * s, piel);
        rect(ctx, x - 9 * s, y - 26 * s, 18 * s, 18 * s, piel);

        /* Pelo */
        rect(ctx, x - 10 * s, y - 29 * s, 20 * s, 8 * s, pelo);

    }


    /* Retrato de los assets reales. La historia conserva las figuras
       pixeladas como respaldo mientras el PNG termina de descargarse. */
    function portrait(ctx, assetId, centerX, baseY, maxWidth, maxHeight, options = {}) {

        if (!A.assets) {
            return false;
        }

        const image = A.assets.readyImage(assetId);

        if (!image) {
            return false;
        }

        /* Algunos personajes de cuerpo completo llegan en lienzos grandes
           con bastante transparencia. Si Assets conoce el marco visible,
           la historia dibuja sólo esa silueta y evita miniaturas flotando. */
        const frame = typeof A.assets.canvasFrame === "function"
            ? A.assets.canvasFrame(assetId)
            : null;
        const sourceX = frame ? frame.x : 0;
        const sourceY = frame ? frame.y : 0;
        const sourceW = frame
            ? frame.width
            : (image.naturalWidth || image.width);
        const sourceH = frame
            ? frame.height
            : (image.naturalHeight || image.height);

        if (!sourceW || !sourceH) {
            return false;
        }

        const scale = Math.min(maxWidth / sourceW, maxHeight / sourceH);
        const width = sourceW * scale;
        const height = sourceH * scale;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = options.alpha == null ? 1 : options.alpha;

        if (options.shadow) {
            ctx.shadowColor = options.shadow;
            ctx.shadowBlur = options.shadowBlur || 12;
        }

        if (options.flip) {
            ctx.translate(centerX, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(
                image,
                sourceX,
                sourceY,
                sourceW,
                sourceH,
                -width / 2,
                baseY - height,
                width,
                height
            );
        } else {
            ctx.drawImage(
                image,
                sourceX,
                sourceY,
                sourceW,
                sourceH,
                centerX - width / 2,
                baseY - height,
                width,
                height
            );
        }

        ctx.restore();

        return true;

    }


    /* Bocadillo de diálogo con pico */
    function bocadillo(ctx, x, y, w, h, color, borde) {

        rect(ctx, x, y, w, h, color);

        ctx.strokeStyle = borde;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        /* Pico */
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + 18, y + h);
        ctx.lineTo(x + 30, y + h);
        ctx.lineTo(x + 20, y + h + 10);
        ctx.closePath();
        ctx.fill();

    }


    /* Texto pixelado centrado dentro de un ancho dado */
    function rotulo(ctx, text, x, y, size, color, align) {

        ctx.save();

        ctx.font = "700 " + size + "px 'JetBrains Mono', monospace";
        ctx.fillStyle = color;
        ctx.textAlign = align || "center";
        ctx.textBaseline = "middle";

        ctx.fillText(text, x, y);

        ctx.restore();

    }


    /* =========================================================
       CAPÍTULO 1 — SNAKE
       El turno de noche. Rodríguez juega. Lo pillan.
       ========================================================= */

    function escenaTurnoNoche(ctx, t) {

        /* Oficina a oscuras */
        rect(ctx, 0, 0, WIDTH, HEIGHT, "#070A12");

        /* Ventanal al fondo con la ciudad */
        rect(ctx, 40, 40, WIDTH - 80, 120, "#0B1020");

        for (let i = 0; i < 7; i += 1) {

            const bx = 52 + i * 78;
            const bh = 40 + noise(i * 3.3, 1) * 60;

            edificio(ctx, bx, 160 - bh, 54, bh, "#0F1626", "#1E3A5F", i * 5);

        }

        /* Marco del ventanal */
        ctx.strokeStyle = "#1B2130";
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 40, WIDTH - 80, 120);

        /* Hilera de cubículos vacíos */
        for (let i = 0; i < 4; i += 1) {
            rect(ctx, 30 + i * 150, 186, 130, 8, "#141926");
        }

        /* Mesa */
        rect(ctx, 0, 252, WIDTH, 148, "#0C111C");
        rect(ctx, 0, 252, WIDTH, 3, "#1B2130");

        /* El monitor con la culebrita, desplazado a la derecha
           para que no quede tapado por el personaje */
        monitor(ctx, 350, 150, 150, 100, "#39FF14", () => {

            rect(ctx, 350, 150, 150, 100, "#04140A");

            /* Rejilla */
            ctx.globalAlpha = 0.25;
            ctx.strokeStyle = "#39FF14";
            ctx.lineWidth = 1;

            for (let gx = 358; gx < 500; gx += 15) {
                ctx.beginPath();
                ctx.moveTo(gx, 150);
                ctx.lineTo(gx, 250);
                ctx.stroke();
            }

            ctx.globalAlpha = 1;

            /* La serpiente, que crece con el avance */
            const largo = 5 + Math.floor(t * 9);

            for (let i = 0; i < largo; i += 1) {

                const sx = 366 + ((i * 15) % 120);
                const sy = 170 + Math.floor((i * 15) / 120) * 16;

                rect(ctx, sx, sy, 12, 12, i === largo - 1 ? "#B6FF7A" : "#39FF14");

            }

            /* La manzana */
            rect(ctx, 470, 214, 10, 10, "#F43F5E");

        });

        /* Rodríguez, de espaldas, a la izquierda del monitor */
        oficinista(ctx, 250, 240, 1.25, "#2B3348", "#3A2A1E");

        /* La puerta al fondo: el supervisor entra a mitad de escena */
        const entrada = Math.max(0, (t - 0.42) / 0.58);

        if (entrada > 0) {

            /* Rectángulo de luz del pasillo */
            ctx.save();
            ctx.globalAlpha = Math.min(1, entrada * 2) * 0.5;
            rect(ctx, 512, 92, 74, 100, "#FBBF24");
            ctx.restore();

            /* Silueta de Belisario recortada contra la luz */
            const bx = 596 - entrada * 62;

            figura(ctx, bx, 118, 1.35, "#0A0D14", "#0A0D14", "#0A0D14");

            /* Contorno amarillo: contraluz */
            ctx.save();
            ctx.globalAlpha = 0.55;
            rect(ctx, bx - 19 * 1.35, 112, 2, 40, "#FBBF24");
            rect(ctx, bx + 17 * 1.35, 112, 2, 40, "#FBBF24");
            ctx.restore();

        }

        /* Reloj de pared: las 3 de la mañana */
        rect(ctx, 46, 52, 30, 30, "#0B0F18");
        ctx.strokeStyle = "#2B3348";
        ctx.lineWidth = 2;
        ctx.strokeRect(46, 52, 30, 30);
        rotulo(ctx, "3:00", 61, 67, 9, "#F43F5E");

    }


    function escenaRegano(ctx, t) {

        rect(ctx, 0, 0, WIDTH, HEIGHT, "#0A0D16");

        /* Foco cenital sobre la mesa */
        const foco = ctx.createRadialGradient(320, 90, 10, 320, 200, 260);

        foco.addColorStop(0, "rgba(251, 191, 36, 0.22)");
        foco.addColorStop(1, "rgba(251, 191, 36, 0)");

        ctx.fillStyle = foco;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        /* Mesa */
        rect(ctx, 0, 268, WIDTH, 132, "#0C111C");

        /* Rodríguez encogido a la izquierda */
        oficinista(ctx, 190, 300, 1.35, "#2B3348", "#3A2A1E");

        /* Belisario de pie, señalando */
        figura(ctx, 452, 214, 1.5, "#1A2234", "#C68642", "#20262E");

        /* Corbata roja: el detalle que lo delata */
        rect(ctx, 448, 212, 7, 26, "#8B1E2D");

        /* Brazo señalando hacia Rodríguez */
        rect(ctx, 396, 208, 42, 8, "#1A2234");
        rect(ctx, 384, 206, 14, 11, "#C68642");

        /* Gafas reflejando la pantalla */
        rect(ctx, 442, 190, 9, 5, "#22D3EE");
        rect(ctx, 456, 190, 9, 5, "#22D3EE");

        /* Bocadillo del supervisor, aparece al final */
        if (t > 0.35) {

            ctx.save();
            ctx.globalAlpha = Math.min(1, (t - 0.35) * 4);

            bocadillo(ctx, 300, 78, 300, 62, "#0F1626", "#F43F5E");

            rotulo(ctx, "¿JUGANDO EN HORARIO", 450, 100, 13, "#F5F7FF");
            rotulo(ctx, "LABORAL, RODRÍGUEZ?", 450, 120, 13, "#F5F7FF");

            ctx.restore();

        }

    }


    /* =========================================================
       CAPÍTULO 2 — STACK
       La cola de tickets no para de crecer.
       ========================================================= */

    function escenaTickets(ctx, t) {

        rect(ctx, 0, 0, WIDTH, HEIGHT, "#0A0810");

        /* Sala de servidores al fondo */
        for (let i = 0; i < 6; i += 1) {

            const rx = 24 + i * 102;

            rect(ctx, rx, 60, 74, 150, "#12101C");

            for (let l = 0; l < 9; l += 1) {

                const on = noise(i * 2.7, l * 1.3 + t * 3) > 0.5;

                rect(ctx, rx + 8, 70 + l * 15, 58, 5, on ? "#A855F7" : "#241E38");

            }

        }

        /* Montaña de tickets que sube con el avance */
        const altura = 60 + t * 150;

        for (let i = 0; i < 130; i += 1) {

            const px = noise(i * 1.7, 3) * WIDTH;
            const ph = noise(i * 2.3, 9) * altura;

            const py = HEIGHT - ph;

            /* Los de abajo, apagados; los de arriba, ardiendo */
            const caliente = ph > altura * 0.62;

            rect(ctx, px, py, 13, 9, caliente ? "#F59E0B" : "#7C3AED");
            rect(ctx, px, py, 13, 2, caliente ? "#FDE68A" : "#A855F7");

        }

        /* Rodríguez hundido hasta la cintura */
        const hundido = 316 - t * 40;

        oficinista(ctx, 320, hundido, 1.45, "#2B3348", "#3A2A1E");

        /* Contador de cola en rojo */
        rect(ctx, 400, 32, 208, 46, "#160A10");

        ctx.strokeStyle = "#F43F5E";
        ctx.lineWidth = 2;
        ctx.strokeRect(400, 32, 208, 46);

        rotulo(ctx, "EN COLA", 504, 46, 10, "#94A3B8");

        const cola = 1240 + Math.floor(t * 8600);

        rotulo(ctx, String(cola), 504, 65, 20, "#F43F5E");

    }


    /* =========================================================
       CAPÍTULO 3 — BLOCK BLAST
       El sótano de archivo y el expediente.
       ========================================================= */

    function escenaArchivo(ctx, t) {

        rect(ctx, 0, 0, WIDTH, HEIGHT, "#080A0E");

        /* Bombilla colgando */
        rect(ctx, 318, 0, 3, 44, "#2B3348");
        rect(ctx, 310, 44, 20, 14, "#FDE68A");

        const luz = ctx.createRadialGradient(320, 52, 8, 320, 220, 300);

        luz.addColorStop(0, "rgba(253, 230, 138, 0.26)");
        luz.addColorStop(1, "rgba(253, 230, 138, 0)");

        ctx.fillStyle = luz;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        /* Estanterías con cajas apiladas */
        for (let col = 0; col < 8; col += 1) {

            for (let fila = 0; fila < 5; fila += 1) {

                if (noise(col * 4.1, fila * 2.9) < 0.22) {
                    continue;
                }

                const cx = 14 + col * 78;
                const cy = 96 + fila * 54;

                rect(ctx, cx, cy, 66, 44, "#20293B");
                rect(ctx, cx, cy, 66, 5, "#2E3A52");
                rect(ctx, cx + 22, cy + 16, 22, 13, "#141B29");

            }

        }

        /* Una caja abierta en el suelo, iluminada */
        rect(ctx, 250, 300, 96, 60, "#2E3A52");
        rect(ctx, 250, 300, 96, 7, "#3E4C68");

        /* Rodríguez agachado leyendo */
        oficinista(ctx, 176, 322, 1.25, "#2B3348", "#3A2A1E");

        /* El expediente en su mano, brillando */
        if (t > 0.28) {

            const brillo = Math.min(1, (t - 0.28) * 3);

            ctx.save();
            ctx.globalAlpha = brillo;

            rect(ctx, 380, 214, 108, 138, "#F5F7FF");
            rect(ctx, 380, 214, 108, 18, "#F43F5E");

            /* Líneas de texto tachadas */
            for (let l = 0; l < 7; l += 1) {

                rect(ctx, 390, 244 + l * 14, 76 - l * 5, 5, "#1B2130");

            }

            /* Sello CONFIDENCIAL */
            ctx.save();
            ctx.translate(434, 300);
            ctx.rotate(-0.28);
            ctx.globalAlpha = brillo * 0.9;
            rotulo(ctx, "CLASIFICADO", 0, 0, 13, "#F43F5E");
            ctx.restore();

            /* Halo */
            ctx.globalAlpha = brillo * 0.2;
            ctx.fillStyle = "#F43F5E";
            ctx.fillRect(366, 200, 136, 166);

            ctx.restore();

        }

    }


    /* =========================================================
       CAPÍTULO 4 — PONG
       La videollamada. La pelota que nadie quiere.
       ========================================================= */

    function escenaLlamada(ctx, t) {

        rect(ctx, 0, 0, WIDTH, HEIGHT, "#06080F");

        /* Dos ventanas de videollamada enfrentadas */
        const oscila = Math.sin(t * Math.PI * 4) * 8;

        /* Ventana izquierda: Rodríguez */
        rect(ctx, 34, 74, 246, 186, "#0D1220");

        ctx.strokeStyle = "#22D3EE";
        ctx.lineWidth = 2;
        ctx.strokeRect(34, 74, 246, 186);

        rect(ctx, 34, 74, 246, 20, "#101828");
        rotulo(ctx, "RODRÍGUEZ · ATC", 157, 84, 9, "#22D3EE");

        oficinista(ctx, 157, 212, 1.25, "#2B3348", "#3A2A1E");

        /* Ventana derecha: Belisario */
        rect(ctx, 360, 74, 246, 186, "#0D1220");

        ctx.strokeStyle = "#F43F5E";
        ctx.lineWidth = 2;
        ctx.strokeRect(360, 74, 246, 186);

        rect(ctx, 360, 74, 246, 20, "#101828");
        rotulo(ctx, "BELISARIO · SUPERVISOR", 483, 84, 9, "#F43F5E");

        figura(ctx, 483, 168, 1.15, "#1A2234", "#C68642", "#20262E");
        rect(ctx, 479, 166, 6, 20, "#8B1E2D");

        /* La pelota rebotando entre las dos ventanas */
        const px = 320 + Math.sin(t * Math.PI * 5) * 150;

        rect(ctx, px - 7, 160 + oscila, 14, 14, "#FBBF24");

        /* Estela */
        ctx.save();
        ctx.globalAlpha = 0.3;
        rect(ctx, px - 22, 163 + oscila, 12, 8, "#FBBF24");
        ctx.globalAlpha = 0.15;
        rect(ctx, px - 36, 165 + oscila, 10, 5, "#FBBF24");
        ctx.restore();

        /* Etiqueta de lo que se están pasando */
        rect(ctx, 232, 292, 176, 32, "#160A10");

        ctx.strokeStyle = "#FBBF24";
        ctx.lineWidth = 2;
        ctx.strokeRect(232, 292, 176, 32);

        rotulo(ctx, "¿QUIÉN FIRMA ESTO?", 320, 308, 11, "#FBBF24");

        /* Contador de reenvíos */
        rotulo(
            ctx,
            "REENVIADO " + (3 + Math.floor(t * 26)) + " VECES",
            320,
            348,
            10,
            "#64748B"
        );

    }


    /* =========================================================
       CAPÍTULO 5 — BREAKER
       El muro del piso 12.
       ========================================================= */

    function escenaMuro(ctx, t) {

        cielo(ctx, "#120A1E", "#2A1020");

        /* Hueco de escalera: el muro tapiado */
        rect(ctx, 0, 0, WIDTH, HEIGHT, "rgba(4,6,12,0.35)");

        /* Ladrillos, que se van rompiendo con el avance */
        const filas = 9;
        const cols = 12;

        for (let f = 0; f < filas; f += 1) {

            for (let c = 0; c < cols; c += 1) {

                /* Los de arriba caen primero */
                const umbral = (f / filas) * 0.75;

                if (t > umbral && noise(c * 3.7, f * 5.1) < t) {
                    continue;
                }

                const desfase = (f % 2) * 26;

                const bx = -20 + c * 56 + desfase;
                const by = 66 + f * 30;

                rect(ctx, bx, by, 52, 26, "#3E2530");
                rect(ctx, bx, by, 52, 4, "#54313F");
                rect(ctx, bx + 2, by + 22, 48, 2, "#241520");

            }

        }

        /* Polvo de los ladrillos rotos */
        ctx.save();
        ctx.globalAlpha = 0.4;

        for (let i = 0; i < 40; i += 1) {

            const dx = noise(i * 1.9, 2) * WIDTH;
            const dy = 60 + noise(i * 2.7, 5) * 240 + t * 40;

            rect(ctx, dx, dy, 3, 3, "#8B6070");

        }

        ctx.restore();

        /* Rodríguez con un extintor como ariete */
        figura(ctx, 116, 292, 1.3, "#2B3348", "#C68642", "#3A2A1E");

        /* El extintor */
        rect(ctx, 138, 286, 34, 15, "#DC2626");
        rect(ctx, 168, 289, 12, 8, "#94A3B8");

        /* Luz de emergencia parpadeando */
        const parpadeo = Math.sin(t * Math.PI * 9) > 0 ? 0.5 : 0.12;

        ctx.save();
        ctx.globalAlpha = parpadeo;
        ctx.fillStyle = "#F43F5E";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.restore();

        /* Cartel del piso */
        rect(ctx, 520, 44, 84, 40, "#0B0F18");

        ctx.strokeStyle = "#FBBF24";
        ctx.lineWidth = 2;
        ctx.strokeRect(520, 44, 84, 40);

        rotulo(ctx, "PISO 12", 562, 64, 13, "#FBBF24");

    }


    /* =========================================================
       CAPÍTULO 6 — PAC 404
       Los conductos. Aparecen Desire y Davinchi.
       ========================================================= */

    function escenaConductos(ctx, t) {

        rect(ctx, 0, 0, WIDTH, HEIGHT, "#05070C");

        /* Conducto en perspectiva: rectángulos que se encogen */
        for (let i = 10; i >= 0; i -= 1) {

            const k = i / 10;

            const w = 90 + k * 520;
            const h = 60 + k * 340;

            const x = 320 - w / 2;
            const y = 200 - h / 2;

            const tono = Math.round(10 + (1 - k) * 26);

            ctx.strokeStyle = "rgb(" + tono + "," + (tono + 8) + "," + (tono + 18) + ")";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);

        }

        /* Rejilla al fondo, iluminada */
        rect(ctx, 276, 168, 88, 64, "#0B1220");

        ctx.strokeStyle = "#22D3EE";
        ctx.lineWidth = 1;

        for (let l = 0; l < 6; l += 1) {

            ctx.beginPath();
            ctx.moveTo(276, 172 + l * 11);
            ctx.lineTo(364, 172 + l * 11);
            ctx.stroke();

        }

        /* Ojos de los infectados en la oscuridad, detrás */
        for (let i = 0; i < 5; i += 1) {

            const ox = 90 + i * 116 + Math.sin(t * 3 + i) * 10;
            const oy = 108 + noise(i * 3.3, 1) * 30;

            const abre = Math.sin(t * Math.PI * 3 + i * 1.7) > -0.3;

            if (!abre) {
                continue;
            }

            rect(ctx, ox, oy, 7, 4, "#F43F5E");
            rect(ctx, ox + 13, oy, 7, 4, "#F43F5E");

        }

        /* Rodríguez arrastrándose, en primer plano */
        figura(ctx, 214, 292, 1.15, "#2B3348", "#C68642", "#3A2A1E");

        /* Desire y Davinchi apareciendo por la derecha */
        if (t > 0.4) {

            const ap = Math.min(1, (t - 0.4) * 2.6);

            ctx.save();
            ctx.globalAlpha = ap;

            /* Desire y Davinchi usan sus identidades definitivas. Los retratos reales
               se solicitan de forma diferida; las figuras originales
               mantienen la escena completa en una carga lenta. */
            const desireReady = portrait(
                ctx,
                "character.desire.full",
                424,
                292,
                132,
                158,
                { alpha: ap, shadow: "#F472B6", shadowBlur: 14 }
            );

            if (!desireReady) {
                figura(ctx, 424, 288, 1.15, "#C81E3A", "#C68642", "#2A1B12");
            }

            const davinchiReady = portrait(
                ctx,
                "character.davinchi.full",
                512,
                292,
                126,
                158,
                { alpha: ap, shadow: "#A3E635", shadowBlur: 14 }
            );

            if (!davinchiReady) {
                figura(ctx, 512, 290, 1.2, "#3F5A32", "#8B5A2B", "#1A1410");
                rect(ctx, 505, 266, 8, 4, "#0B0F18");
                rect(ctx, 516, 266, 8, 4, "#0B0F18");
            }

            ctx.restore();

        }

    }


    /* =========================================================
       CAPÍTULO 7 — CHESS
       Belisario no quiere pelear: quiere convencerlo.
       ========================================================= */

    function escenaPartida(ctx, t) {

        rect(ctx, 0, 0, WIDTH, HEIGHT, "#080B12");

        /* Foco sobre el tablero */
        const foco = ctx.createRadialGradient(320, 250, 20, 320, 250, 280);

        foco.addColorStop(0, "rgba(212, 175, 55, 0.20)");
        foco.addColorStop(1, "rgba(212, 175, 55, 0)");

        ctx.fillStyle = foco;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        /* Mesa */
        rect(ctx, 130, 262, 380, 90, "#161B27");
        rect(ctx, 130, 262, 380, 5, "#232A3B");

        /* Tablero en perspectiva plana */
        for (let f = 0; f < 8; f += 1) {

            for (let c = 0; c < 8; c += 1) {

                const claro = (f + c) % 2 === 0;

                rect(
                    ctx,
                    196 + c * 31,
                    256 + f * 11,
                    31,
                    11,
                    claro ? "#232A3B" : "#141824"
                );

            }

        }

        /* Piezas: dos filas de siluetas */
        for (let c = 0; c < 8; c += 1) {

            /* Las blancas van cayendo, pero siempre quedan varias:
               la partida está empezando, no perdida. */
            if (noise(c * 5.5, 1) > t * 0.45) {

                rect(ctx, 205 + c * 31, 300, 12, 20, "#7DF9FF");

            }

            rect(ctx, 205 + c * 31, 252, 12, 20, "#FF5CA8");

        }

        /* Rodríguez a la izquierda, de perfil */
        figura(ctx, 82, 214, 1.3, "#2B3348", "#C68642", "#3A2A1E");

        /* Belisario a la derecha */
        figura(ctx, 556, 210, 1.35, "#1A2234", "#C68642", "#20262E");
        rect(ctx, 552, 208, 7, 24, "#8B1E2D");

        /* Gafas con reflejo */
        rect(ctx, 547, 188, 8, 4, "#22D3EE");
        rect(ctx, 559, 188, 8, 4, "#22D3EE");

        /* Bocadillo con la oferta */
        if (t > 0.3) {

            ctx.save();
            ctx.globalAlpha = Math.min(1, (t - 0.3) * 3.4);

            bocadillo(ctx, 232, 54, 340, 74, "#0F1626", "#D4AF37");

            rotulo(ctx, "SIÉNTATE, RODRÍGUEZ.", 402, 78, 12, "#F5F7FF");
            rotulo(ctx, "TE VOY A EXPLICAR POR QUÉ", 402, 98, 11, "#D4AF37");
            rotulo(ctx, "ESTO NOS CONVIENE A LOS DOS.", 402, 114, 11, "#D4AF37");

            ctx.restore();

        }

    }


    /* =========================================================
       CAPÍTULO 8 — INVADERS
       El cielo. Las naves. A quién sirven de verdad.
       ========================================================= */

    function escenaCielo(ctx, t) {

        cielo(ctx, "#0A0618", "#1A0A24");

        /* Estrellas */
        for (let i = 0; i < 70; i += 1) {

            const sx = noise(i * 1.3, 7) * WIDTH;
            const sy = noise(i * 2.1, 3) * 240;

            rect(ctx, sx, sy, 2, 2, "rgba(245,247,255,0.5)");

        }

        /* Skyline abajo */
        for (let i = 0; i < 9; i += 1) {

            const bx = i * 74;
            const bh = 60 + noise(i * 4.7, 2) * 70;

            edificio(ctx, bx, HEIGHT - bh, 68, bh, "#0B0F1A", "#1E3A5F", i * 7);

        }

        /* Naves bajando en formación */
        const bajada = t * 90;

        for (let f = 0; f < 3; f += 1) {

            for (let c = 0; c < 7; c += 1) {

                const nx = 70 + c * 76;
                const ny = 30 + f * 46 + bajada;

                /* Cuerpo */
                rect(ctx, nx, ny, 38, 12, "#C084FC");
                rect(ctx, nx + 8, ny - 7, 22, 8, "#E9D5FF");

                /* Patas */
                rect(ctx, nx + 3, ny + 12, 5, 6, "#7C3AED");
                rect(ctx, nx + 30, ny + 12, 5, 6, "#7C3AED");

                /* Haz de luz */
                ctx.save();
                ctx.globalAlpha = 0.10;
                ctx.fillStyle = "#C084FC";
                ctx.beginPath();
                ctx.moveTo(nx + 12, ny + 16);
                ctx.lineTo(nx + 26, ny + 16);
                ctx.lineTo(nx + 40, HEIGHT);
                ctx.lineTo(nx - 2, HEIGHT);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

            }

        }

        /* La bandera del casco de las naves: el detalle revelador */
        if (t > 0.5) {

            const rev = Math.min(1, (t - 0.5) * 3);

            ctx.save();
            ctx.globalAlpha = rev;

            /* Zoom sobre una nave */
            rect(ctx, 380, 236, 210, 116, "#0B0F18");

            ctx.strokeStyle = "#FBBF24";
            ctx.lineWidth = 2;
            ctx.strokeRect(380, 236, 210, 116);

            rotulo(ctx, "AMPLIANDO CASCO", 485, 252, 9, "#FBBF24");

            /* El logo: el mismo del expediente */
            rect(ctx, 452, 268, 66, 46, "#F5F7FF");
            rect(ctx, 452, 268, 66, 9, "#F43F5E");

            rotulo(ctx, "MIN. DE", 485, 290, 9, "#1B2130");
            rotulo(ctx, "LA VERDAD", 485, 303, 9, "#1B2130");

            ctx.restore();

        }

    }


    /* =========================================================
       CAPÍTULO 9 — OPERACIÓN 404
       La decisión de los cinco canales. Enlaza con la intro y la ruta.
       ========================================================= */

    function escenaDecision(ctx, t) {

        rect(ctx, 0, 0, WIDTH, HEIGHT, "#07060E");

        /* Palacio al fondo, iluminado */
        const px = 236;

        rect(ctx, px, 96, 168, 200, "#101423");

        /* Cúpula */
        ctx.fillStyle = "#101423";
        ctx.beginPath();
        ctx.arc(px + 84, 96, 54, Math.PI, 0);
        ctx.fill();

        /* Columnas */
        for (let i = 0; i < 6; i += 1) {
            rect(ctx, px + 14 + i * 26, 160, 12, 136, "#161C2E");
        }

        /* Ventanas encendidas en rojo */
        for (let i = 0; i < 5; i += 1) {

            const on = Math.sin(t * Math.PI * 2 + i) > -0.4;

            rect(ctx, px + 20 + i * 30, 116, 16, 22, on ? "#F43F5E" : "#2A1520");

        }

        /* Haz del virus subiendo desde la cúpula */
        ctx.save();
        ctx.globalAlpha = 0.20 + Math.sin(t * Math.PI * 3) * 0.08;
        ctx.fillStyle = "#A855F7";
        ctx.beginPath();
        ctx.moveTo(px + 68, 60);
        ctx.lineTo(px + 100, 60);
        ctx.lineTo(px + 150, 0);
        ctx.lineTo(px + 18, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        /* Calle en ruinas */
        rect(ctx, 0, 296, WIDTH, 104, "#0A0D16");

        for (let i = 0; i < 16; i += 1) {

            const dx = noise(i * 2.9, 4) * WIDTH;

            rect(ctx, dx, 300 + noise(i * 1.7, 8) * 80, 14, 7, "#161C2E");

        }

        /* Los cinco canales miran el Palacio: este capítulo ya no presenta
           a tres siluetas sin contexto, sino al equipo que luego acompaña
           las transmisiones de las doce zonas de OPERACIÓN 404. */
        const team = [
            { name: "SIL", x: 112, y: 302, scale: 1.12, ropa: "#9A3412", piel: "#C68642", pelo: "#2A1B12", color: "#FB923C" },
            { name: "ROG", x: 218, y: 300, scale: 1.3, ropa: "#155E75", piel: "#C68642", pelo: "#3A2A1E", color: "#38BDF8" },
            { name: "DESIRE", x: 320, y: 304, scale: 1.16, ropa: "#9D174D", piel: "#C68642", pelo: "#2A1626", color: "#F472B6" },
            { name: "DAVINCHI", x: 422, y: 302, scale: 1.2, ropa: "#3F6212", piel: "#8B5A2B", pelo: "#1A1410", color: "#A3E635" },
            { name: "COLINAS", x: 528, y: 300, scale: 1.14, ropa: "#F8FAFC", piel: "#B77B50", pelo: "#5B3A21", color: "#FBBF24" }
        ];

        team.forEach((member) => {
            figura(ctx, member.x, member.y, member.scale, member.ropa, member.piel, member.pelo);
            rotulo(ctx, member.name, member.x, 248, 7, member.color);
        });

        /* La diadema de Rog se enciende al aceptar la operación. */
        if (t > 0.45) {

            const b = Math.min(1, (t - 0.45) * 3);

            ctx.save();
            ctx.globalAlpha = b;

            /* La figura de Rog tiene la cabeza sobre y-26*escala (1.3). */
            rect(ctx, 204, 264, 28, 4, "#22D3EE");
            rect(ctx, 202, 266, 4, 11, "#22D3EE");
            rect(ctx, 230, 266, 4, 11, "#22D3EE");

            /* Micrófono hacia la boca */
            rect(ctx, 206, 277, 8, 2, "#22D3EE");

            ctx.globalAlpha = b * 0.28;
            ctx.fillStyle = "#22D3EE";
            ctx.fillRect(194, 256, 50, 30);

            ctx.restore();

        }

    }


    /* =========================================================
       LOS CAPÍTULOS

       Cada uno se ata a un juego y a una puntuación. Al
       superarla por primera vez, salta.
       ========================================================= */

    const CHAPTERS = [

        {
            id: "snake",
            game: "snake",
            chapter: 1,
            score: 120,
            title: "CAPÍTULO 1 · EL TURNO DE NOCHE",
            scenes: [
                {
                    draw: escenaTurnoNoche,
                    title: "PISO 3 · ATENCIÓN AL CLIENTE",
                    lines: [
                        "Tres de la mañana. La cola de llamadas, vacía.",
                        "Rodríguez llevaba once horas con la diadema puesta.",
                        "Se puso a jugar con la culebrita del sistema."
                    ]
                },
                {
                    draw: escenaRegano,
                    title: "BELISARIO",
                    lines: [
                        "El supervisor no dormía nunca. Nadie sabía por qué.",
                        "\"¿Jugando en horario laboral, Rodríguez?\"",
                        "\"Baje al archivo. Y no toque nada que no sea suyo.\"",
                        "Fue el peor castigo que pudo ponerle. Para él."
                    ]
                }
            ]
        },

        {
            id: "tetris",
            game: "tetris",
            chapter: 2,
            score: 4000,
            title: "CAPÍTULO 2 · LA TORRE DE TICKETS",
            scenes: [
                {
                    draw: escenaTickets,
                    title: "LA COLA",
                    lines: [
                        "Antes del archivo tenía que vaciar la cola.",
                        "Los tickets caían más rápido de lo que podía cerrarlos.",
                        "Todos decían lo mismo, palabra por palabra:",
                        "\"MI TELEVISOR ME HABLA Y TIENE RAZÓN\"."
                    ]
                }
            ]
        },

        {
            id: "blockblast",
            game: "blockblast",
            chapter: 3,
            /* Medido: una partida completa ronda los 900 puntos, así
               que el umbral va a media partida decente. */
            score: 600,
            title: "CAPÍTULO 3 · SÓTANO DE ARCHIVO",
            scenes: [
                {
                    draw: escenaArchivo,
                    title: "LO QUE NO DEBÍA VER",
                    lines: [
                        "El archivo eran cajas hasta el techo, sin orden.",
                        "Ordenándolas encontró una que no encajaba.",
                        "Dentro: un expediente con presupuesto y fechas.",
                        "\"PROGRAMA DE CONCIENCIA COLECTIVA · FASE 3\".",
                        "La fase 3 empezaba esa misma semana."
                    ]
                }
            ]
        },

        {
            id: "pong",
            game: "pong",
            chapter: 4,
            score: 5,
            title: "CAPÍTULO 4 · LA VIDEOLLAMADA",
            scenes: [
                {
                    draw: escenaLlamada,
                    title: "NADIE FIRMA NADA",
                    lines: [
                        "Rodríguez reportó el expediente. Por el canal correcto.",
                        "Se lo devolvieron. Lo reenvió. Se lo devolvieron.",
                        "Belisario sonreía en cada videollamada:",
                        "\"Eso no es de su competencia, Rodríguez\".",
                        "Esa noche el país entero encendió el televisor."
                    ]
                }
            ]
        },

        {
            id: "breaker",
            game: "breaker",
            chapter: 5,
            /* ~50 ladrillos: algo menos de una pantalla completa */
            score: 2500,
            title: "CAPÍTULO 5 · EL MURO DEL PISO 12",
            scenes: [
                {
                    draw: escenaMuro,
                    title: "HACIA ARRIBA",
                    lines: [
                        "Cuando despertó, el edificio gritaba consignas.",
                        "Los ascensores, muertos. La escalera, tapiada.",
                        "Alguien no quería que nadie subiera al piso 12.",
                        "Rodríguez agarró un extintor y empezó a golpear."
                    ]
                }
            ]
        },

        {
            id: "pac404",
            game: "pac404",
            chapter: 6,
            /* Alrededor de un nivel completo */
            score: 2000,
            title: "CAPÍTULO 6 · LOS CONDUCTOS",
            scenes: [
                {
                    draw: escenaConductos,
                    title: "NO ESTABA SOLO",
                    lines: [
                        "Bajó por los conductos de ventilación.",
                        "Detrás, los ojos rojos de los que ya habían mirado.",
                        "En un cruce se topó con dos que tampoco cantaban:",
                        "Desire, de atención al cliente. Davinchi, de seguridad.",
                        "Ninguno de los tres había mirado la pantalla."
                    ]
                }
            ]
        },

        {
            id: "chess",
            game: "chess",
            chapter: 7,
            score: 1,
            title: "CAPÍTULO 7 · LA PARTIDA",
            scenes: [
                {
                    draw: escenaPartida,
                    title: "LA OFERTA",
                    lines: [
                        "En el piso 12 no había laboratorio. Había un tablero.",
                        "Belisario lo esperaba con las piezas ya colocadas.",
                        "\"No estoy infectado. Yo firmé el programa\".",
                        "\"La gente pedía que alguien pensara por ella\".",
                        "\"Siéntese. Le voy a explicar por qué nos conviene\"."
                    ]
                }
            ]
        },

        {
            id: "invaders",
            game: "invaders",
            chapter: 8,
            score: 8000,
            title: "CAPÍTULO 8 · EL CIELO",
            scenes: [
                {
                    draw: escenaCielo,
                    title: "REFUERZOS",
                    lines: [
                        "Rodríguez volcó el tablero y salió corriendo.",
                        "Afuera el cielo se había llenado de luces.",
                        "Dijeron que venían a ayudar con la emergencia.",
                        "Pero el casco llevaba el mismo sello del expediente:",
                        "MINISTERIO DE LA VERDAD. Venían a rematar."
                    ]
                }
            ]
        },

        {
            id: "op404",
            game: "op404",
            chapter: 9,
            /* Las primeras zonas del modo historia */
            score: 6000,
            title: "CAPÍTULO 9 · OPERACIÓN 404",
            scenes: [
                {
                    draw: escenaDecision,
                    title: "LA DECISIÓN",
                    lines: [
                        "La señal salía del Palacio. Todos lo sabían ya.",
                        "Sil trazó los nodos; Davinchi abrió las rutas.",
                        "Desire sostuvo el refugio y Colinas cargó las reservas.",
                        "Rog se ajustó la diadema: \"Vamos a cerrar el ticket\".",
                        "No era una salida. Era el comienzo de OPERACIÓN 404."
                    ]
                }
            ]
        }

    ];


    /* Índice rápido por juego */
    const BY_GAME = {};

    CHAPTERS.forEach((chapter) => {
        BY_GAME[chapter.game] = chapter;
    });


    /* ---------------------------------------------------------
       Progreso guardado
       --------------------------------------------------------- */

    function seen() {
        return A.storage.getObject(STORE_KEY, {}) || {};
    }


    function isSeen(id) {
        return seen()[id] === true;
    }


    function markSeen(id) {

        const current = seen();

        current[id] = true;

        A.storage.setObject(STORE_KEY, current);

    }


    function resetProgress() {
        A.storage.setObject(STORE_KEY, {});
    }


    /* Capítulos vistos, en orden de la historia */
    function unlocked() {

        const current = seen();

        return CHAPTERS.filter((chapter) => current[chapter.id] === true);

    }


    /* ¿Toca cinemática con esta puntuación?

       Devuelve el capítulo sólo la primera vez que se cruza el
       umbral. Después, nunca más: la historia no se repite sola. */
    function check(gameId, score) {

        const chapter = BY_GAME[gameId];

        if (!chapter) {
            return null;
        }

        if (score < chapter.score) {
            return null;
        }

        if (isSeen(chapter.id)) {
            return null;
        }

        return chapter;

    }


    /* ---------------------------------------------------------
       Reproductor

       Comparte el lenguaje visual de la intro de OPERACIÓN 404:
       viñeta arriba, subtítulos abajo escribiéndose letra a
       letra, y avance con cualquier tecla.
       --------------------------------------------------------- */

    class StoryPlayer {

        constructor(stage, chapter, onDone) {

            this.stage = stage;
            this.chapter = chapter;
            this.onDone = onDone;

            this.scenes = chapter.scenes;

            this.index = 0;
            this.elapsed = 0;
            this.done = false;

            this.durations = this.scenes.map((scene) => {

                const chars = scene.lines.reduce((a, l) => a + l.length, 0);

                return FADE_MS + chars * CHAR_MS + HOLD_MS;

            });

        }


        get scene() {
            return this.scenes[this.index];
        }


        /* Avanza a la siguiente viñeta, o termina */
        next() {

            if (this.index >= this.scenes.length - 1) {

                this.finish();

                return;

            }

            this.index += 1;
            this.elapsed = 0;

            A.audio.play("select");

        }


        skip() {
            this.finish();
        }


        finish() {

            if (this.done) {
                return;
            }

            this.done = true;

            markSeen(this.chapter.id);

            if (this.onDone) {
                this.onDone();
            }

        }


        update(dt) {

            if (this.done) {
                return;
            }

            /* La animación de entrada y el texto pueden terminar solos,
               pero la historia nunca cambia de viñeta por reloj. El tiempo
               se satura para mantener el cuadro quieto y legible hasta que
               el jugador pulse ESPACIO o toque CONTINUAR. */
            const duration = this.durations[this.index] || 1;
            const delta = Math.max(0, Number(dt) || 0);

            this.elapsed = Math.min(duration, this.elapsed + delta);

        }


        render() {

            const { ctx } = this.stage;

            const scene = this.scene;

            if (!scene) {
                return;
            }

            const total = this.durations[this.index];

            const t = Math.min(1, this.elapsed / total);

            const sw = this.stage.width;
            const sh = this.stage.height;

            /* Fondo opaco: tapa el juego que sigue vivo debajo */
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = "#04060C";
            ctx.fillRect(0, 0, sw, sh);
            ctx.restore();

            ctx.save();

            ctx.imageSmoothingEnabled = false;

            /* La viñeta se dibuja en 640x400 y se encaja centrada
               conservando la proporción: si el lienzo del juego es
               más ancho o más alto, sobran barras negras en vez de
               deformarse la escena. */
            const scale = Math.min(sw / WIDTH, sh / HEIGHT);

            const ox = (sw - WIDTH * scale) / 2;
            const oy = (sh - HEIGHT * scale) / 2;

            ctx.translate(ox, oy);
            ctx.scale(scale, scale);

            /* Recorte al marco de la viñeta */
            ctx.beginPath();
            ctx.rect(0, 0, WIDTH, HEIGHT);
            ctx.clip();

            scene.draw(ctx, t);

            /* Viñeteado */
            const vig = ctx.createRadialGradient(
                WIDTH / 2, HEIGHT / 2, HEIGHT * 0.3,
                WIDTH / 2, HEIGHT / 2, HEIGHT * 0.78
            );

            vig.addColorStop(0, "rgba(0, 0, 0, 0)");
            vig.addColorStop(1, "rgba(0, 0, 0, 0.45)");

            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            /* Fundido de entrada */
            if (this.elapsed < FADE_MS) {

                ctx.fillStyle = "rgba(0, 0, 0, " +
                    (1 - this.elapsed / FADE_MS).toFixed(3) + ")";

                ctx.fillRect(0, 0, WIDTH, HEIGHT);

            }

            this.drawText(ctx);

            this.drawChrome(ctx);

            ctx.restore();

        }


        drawText(ctx) {

            const scene = this.scene;

            const boxY = HEIGHT - 132;

            /* Caja de subtítulos */
            ctx.fillStyle = "rgba(4, 7, 14, 0.88)";
            ctx.fillRect(0, boxY, WIDTH, 132);

            ctx.fillStyle = "rgba(251, 191, 36, 0.75)";
            ctx.fillRect(0, boxY, WIDTH, 2);

            /* Título de la viñeta */
            ctx.font = "700 13px 'Orbitron', sans-serif";
            ctx.fillStyle = "#FBBF24";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";

            ctx.fillText(scene.title, 28, boxY + 14);

            /* Texto que se escribe letra a letra */
            const shown = Math.max(
                0,
                Math.floor((this.elapsed - FADE_MS) / CHAR_MS)
            );

            let left = shown;

            ctx.font = "13px 'JetBrains Mono', monospace";
            ctx.fillStyle = "#D6DBE8";

            scene.lines.forEach((line, i) => {

                if (left <= 0) {
                    return;
                }

                const part = line.slice(0, left);

                left -= line.length;

                ctx.fillText(part, 28, boxY + 42 + i * 19);

            });

        }


        drawChrome(ctx) {

            /* Rótulo del capítulo, arriba a la izquierda */
            ctx.font = "700 10px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";

            ctx.fillText(this.chapter.title, 24, 24);

            /* Marcas de progreso, arriba a la derecha */
            for (let i = 0; i < this.scenes.length; i += 1) {

                ctx.fillStyle = i <= this.index
                    ? "#FBBF24"
                    : "rgba(148, 163, 184, 0.3)";

                ctx.fillRect(
                    WIDTH - 24 - (this.scenes.length - i) * 14,
                    20,
                    9,
                    4
                );

            }

            /* La instrucción deja claro que no hay avance automático.
               El botón HTML del shell ofrece el mismo gesto en móvil. */
            ctx.font = "9px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(148, 163, 184, 0.62)";
            ctx.textAlign = "right";

            ctx.fillText("ESPACIO / TOCAR · SIGUIENTE · ESC SALTAR", WIDTH - 24, HEIGHT - 12);

        }

    }


    A.story = {

        CHAPTERS,
        BY_GAME,

        StoryPlayer,

        check,
        isSeen,
        markSeen,
        unlocked,
        resetProgress,

        total: CHAPTERS.length

    };

})(window.Arcade404);
