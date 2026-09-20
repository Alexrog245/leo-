/* =========================================================
   ARCADE 404 — OPERACIÓN 404
   Cinemática de introducción

   Secuencia de viñetas pixel art con texto que se escribe
   letra a letra. Cuenta por qué un agente de Atención al
   Cliente acaba siendo lo único que queda en pie:

     1. Una señal despierta la ciudad.
     2. El programa colectivo entra por cada pantalla.
     3. La población queda en un solo canal.
     4. Los cinco canales: Sil, Rog, Desire, Davinchi y
        el Sr. de las Colinas se reparten la operación.
     5. La ruta: seis nodos, doce zonas y un ticket final.

   Se dibuja en el mismo lienzo del juego (640x400) para no
   añadir capas nuevas al DOM. Cada viñeta es una función de
   dibujo pura que recibe el contexto y el avance 0..1, así
   que el conjunto es fácil de ampliar con más escenas.
   ========================================================= */

(function (A) {

    "use strict";

    const WIDTH = 640;
    const HEIGHT = 400;

    /* Velocidad del texto: milisegundos por carácter */
    const CHAR_MS = 26;

    /* El tramo final completa la animación de entrada. No cambia la
       viñeta: cada escena espera el avance manual del jugador. */
    const HOLD_MS = 1500;

    const FADE_MS = 420;


    /* ---------------------------------------------------------
       Utilidades de dibujo
       --------------------------------------------------------- */

    function rect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }


    /* Silueta de edificio con ventanas encendidas. El patrón de
       ventanas es determinista (semilla) para que no parpadee. */
    function edificio(ctx, x, y, w, h, color, ventana, semilla, encendido) {

        rect(ctx, x, y, w, h, color);

        const cols = Math.max(1, Math.floor(w / 9));
        const rows = Math.max(1, Math.floor(h / 12));

        for (let r = 0; r < rows; r += 1) {

            for (let c = 0; c < cols; c += 1) {

                /* Hash barato y estable */
                const n = (semilla * 37 + r * 131 + c * 17) % 100;

                if (n < encendido) {

                    rect(
                        ctx,
                        x + 4 + c * 9,
                        y + 6 + r * 12,
                        4,
                        6,
                        ventana
                    );

                }

            }

        }

    }


    /* Personaje pixel art sencillo y reutilizable */
    function persona(ctx, x, y, escala, opts) {

        const p = escala;

        const piel = opts.piel || "#C98A5E";
        const ropa = opts.ropa || "#1E3A8A";
        const pelo = opts.pelo || "#2B1B12";

        /* Cabeza */
        rect(ctx, x - 3 * p, y - 14 * p, 6 * p, 6 * p, piel);

        /* Pelo */
        rect(ctx, x - 3 * p, y - 15 * p, 6 * p, 2 * p, pelo);

        /* Ojos: rojos si está infectado */
        if (opts.infectado) {

            rect(ctx, x - 2 * p, y - 12 * p, 2 * p, 2 * p, "#F43F5E");
            rect(ctx, x + 1 * p, y - 12 * p, 2 * p, 2 * p, "#F43F5E");

        } else {

            rect(ctx, x - 2 * p, y - 12 * p, 1 * p, 1 * p, "#0B0F1A");
            rect(ctx, x + 1 * p, y - 12 * p, 1 * p, 1 * p, "#0B0F1A");

        }

        /* Torso */
        rect(ctx, x - 4 * p, y - 8 * p, 8 * p, 8 * p, ropa);

        /* Piernas */
        rect(ctx, x - 3 * p, y, 2 * p, 5 * p, "#111827");
        rect(ctx, x + 1 * p, y, 2 * p, 5 * p, "#111827");

        /* Brazos: levantados si está infectado */
        if (opts.infectado) {

            rect(ctx, x - 6 * p, y - 13 * p, 2 * p, 6 * p, piel);
            rect(ctx, x + 4 * p, y - 13 * p, 2 * p, 6 * p, piel);

        } else {

            rect(ctx, x - 6 * p, y - 8 * p, 2 * p, 6 * p, piel);
            rect(ctx, x + 4 * p, y - 8 * p, 2 * p, 6 * p, piel);

        }

        /* Diadema de call center */
        if (opts.diadema) {

            rect(ctx, x - 4 * p, y - 16 * p, 8 * p, 1 * p, "#22D3EE");
            rect(ctx, x - 5 * p, y - 14 * p, 2 * p, 3 * p, "#22D3EE");
            rect(ctx, x + 3 * p, y - 14 * p, 2 * p, 3 * p, "#22D3EE");
            rect(ctx, x + 3 * p, y - 11 * p, 3 * p, 1 * p, "#22D3EE");

        }

        /* Corona VIP */
        if (opts.corona) {

            rect(ctx, x - 4 * p, y - 19 * p, 8 * p, 2 * p, "#FBBF24");
            rect(ctx, x - 4 * p, y - 21 * p, 2 * p, 2 * p, "#FBBF24");
            rect(ctx, x - 1 * p, y - 22 * p, 2 * p, 3 * p, "#FBBF24");
            rect(ctx, x + 2 * p, y - 21 * p, 2 * p, 2 * p, "#FBBF24");

        }

    }


    /* ---------------------------------------------------------
       Viñetas
       Cada una recibe (ctx, t) con t = 0..1
       --------------------------------------------------------- */

    function escenaCiudad(ctx, t) {

        /* Cielo nocturno tranquilo */
        const cielo = ctx.createLinearGradient(0, 0, 0, HEIGHT);

        cielo.addColorStop(0, "#0A1428");
        cielo.addColorStop(1, "#16233D");

        ctx.fillStyle = cielo;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        /* Luna */
        rect(ctx, 520, 46, 26, 26, "#E8EDF7");
        rect(ctx, 528, 52, 10, 12, "#CBD5E1");

        /* Estrellas fijas */
        for (let i = 0; i < 40; i += 1) {

            const x = (i * 97) % WIDTH;
            const y = (i * 53) % 150;

            rect(ctx, x, y, 2, 2, i % 3 ? "#8FA3C8" : "#E8EDF7");

        }

        /* Horizonte de Caracas: el Ávila detrás */
        ctx.fillStyle = "#101B30";

        ctx.beginPath();
        ctx.moveTo(0, 182);

        for (let x = 0; x <= WIDTH; x += 40) {

            ctx.lineTo(x, 158 - Math.sin(x / 90) * 28);

        }

        ctx.lineTo(WIDTH, HEIGHT);
        ctx.lineTo(0, HEIGHT);
        ctx.closePath();
        ctx.fill();

        /* Edificios: se encienden progresivamente */
        const luz = 20 + t * 45;

        edificio(ctx, 40, 170, 54, 98, "#0D1626", "#FDE68A", 3, luz);
        edificio(ctx, 110, 140, 62, 128, "#0B1322", "#FDE68A", 7, luz);
        edificio(ctx, 190, 182, 48, 86, "#0D1626", "#FDE68A", 11, luz);
        edificio(ctx, 250, 152, 70, 116, "#0B1322", "#FDE68A", 5, luz);
        edificio(ctx, 340, 176, 52, 92, "#0D1626", "#FDE68A", 13, luz);
        edificio(ctx, 404, 134, 66, 134, "#0B1322", "#FDE68A", 2, luz);
        edificio(ctx, 486, 174, 58, 94, "#0D1626", "#FDE68A", 17, luz);
        edificio(ctx, 556, 154, 56, 114, "#0B1322", "#FDE68A", 23, luz);

        /* Suelo */
        rect(ctx, 0, 268, WIDTH, HEIGHT - 268, "#070C16");

    }


    function escenaVirus(ctx, t) {

        /* Sala de control del gobierno */
        rect(ctx, 0, 0, WIDTH, HEIGHT, "#0A0710");

        /* Pared con paneles */
        for (let x = 0; x < WIDTH; x += 64) {
            rect(ctx, x, 0, 60, 214, "#161022");
        }

        /* Pantalla gigante con el virus */
        rect(ctx, 150, 26, 340, 168, "#0B0F1A");
        rect(ctx, 156, 32, 328, 156, "#12061A");

        /* Onda expansiva del virus */
        const pulso = 0.5 + Math.sin(t * Math.PI * 6) * 0.5;

        const cx = 320;
        const cy = 110;

        for (let i = 4; i >= 0; i -= 1) {

            const radio = 18 + i * 16 + pulso * 10;

            ctx.globalAlpha = 0.14 + (4 - i) * 0.12;

            ctx.fillStyle = "#A855F7";

            ctx.beginPath();
            ctx.arc(cx, cy, radio, 0, Math.PI * 2);
            ctx.fill();

        }

        ctx.globalAlpha = 1;

        /* Núcleo del virus */
        rect(ctx, cx - 12, cy - 12, 24, 24, "#D946EF");
        rect(ctx, cx - 6, cy - 18, 12, 6, "#D946EF");
        rect(ctx, cx - 6, cy + 12, 12, 6, "#D946EF");
        rect(ctx, cx - 18, cy - 6, 6, 12, "#D946EF");
        rect(ctx, cx + 12, cy - 6, 6, 12, "#D946EF");
        rect(ctx, cx - 5, cy - 5, 10, 10, "#F5D0FE");

        /* Consola y siluetas de funcionarios de espaldas */
        rect(ctx, 0, 214, WIDTH, 16, "#1E1630");
        rect(ctx, 0, 230, WIDTH, HEIGHT - 230, "#0C0814");

        /* Botones de la consola parpadeando */
        for (let i = 0; i < 14; i += 1) {

            const on = ((i * 7 + Math.floor(t * 10)) % 3) === 0;

            rect(ctx, 30 + i * 42, 218, 10, 8, on ? "#F43F5E" : "#4C1D3D");

        }

        persona(ctx, 150, 276, 2.3, { ropa: "#3F2A56", pelo: "#1B1226" });
        persona(ctx, 320, 280, 2.5, { ropa: "#4C1D95", pelo: "#140B1F" });
        persona(ctx, 492, 276, 2.3, { ropa: "#3F2A56", pelo: "#1B1226" });

    }


    function escenaCaos(ctx, t) {

        /* Calle tomada por infectados */
        const cielo = ctx.createLinearGradient(0, 0, 0, 216);

        cielo.addColorStop(0, "#2A0A12");
        cielo.addColorStop(1, "#5B1220");

        ctx.fillStyle = cielo;
        ctx.fillRect(0, 0, WIDTH, 216);

        /* Edificios en llamas */
        edificio(ctx, 20, 84, 70, 132, "#180A10", "#F43F5E", 3, 55);
        edificio(ctx, 110, 58, 64, 158, "#140810", "#FB923C", 9, 60);
        edificio(ctx, 470, 66, 70, 150, "#180A10", "#F43F5E", 15, 50);
        edificio(ctx, 556, 92, 60, 124, "#140810", "#FB923C", 21, 58);

        /* Humo */
        ctx.globalAlpha = 0.3;

        for (let i = 0; i < 7; i += 1) {

            const x = 60 + i * 84 + Math.sin(t * 4 + i) * 12;

            ctx.fillStyle = "#3B0A16";

            ctx.beginPath();
            ctx.arc(x, 48 + Math.cos(t * 3 + i) * 10, 24, 0, Math.PI * 2);
            ctx.fill();

        }

        ctx.globalAlpha = 1;

        /* Suelo: por encima de la caja de subtítulos */
        rect(ctx, 0, 214, WIDTH, HEIGHT - 214, "#2A1218");
        rect(ctx, 0, 214, WIDTH, 5, "#7F1D1D");

        /* Multitud infectada avanzando: bamboleo desfasado */
        const gente = [
            [64, 268, 2.1, "#7F1D1D"],
            [148, 276, 2.4, "#9F1239"],
            [230, 266, 2.2, "#7F1D1D"],
            [312, 280, 2.6, "#B91C1C"],
            [394, 270, 2.3, "#9F1239"],
            [472, 276, 2.4, "#7F1D1D"],
            [560, 266, 2.1, "#B91C1C"]
        ];

        gente.forEach((g, i) => {

            const salto = Math.abs(Math.sin(t * 8 + i * 1.3)) * 6;

            persona(ctx, g[0], g[1] - salto, g[2], {
                ropa: g[3],
                infectado: true,
                pelo: "#2A0A12"
            });

        });

    }


    function escenaInmunes(ctx, t) {

        /* Interior del call center: los únicos que aguantan */
        rect(ctx, 0, 0, WIDTH, HEIGHT, "#0B1220");

        /* Pared con paneles acústicos */
        for (let x = 0; x < WIDTH; x += 32) {

            for (let y = 0; y < 186; y += 32) {

                rect(ctx, x + 2, y + 2, 28, 28, (x + y) % 64 ? "#111C31" : "#0E1729");

            }

        }

        /* Cartel: nivel de servicio */
        rect(ctx, 190, 30, 260, 60, "#0A1120");
        rect(ctx, 194, 34, 252, 52, "#132038");

        ctx.fillStyle = "#22D3EE";
        ctx.font = "700 20px 'JetBrains Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("SLA 100%", 320, 58);

        ctx.fillStyle = "#A3E635";
        ctx.font = "600 12px 'JetBrains Mono', monospace";
        ctx.fillText("INMUNES: ATC + VIP", 320, 76);

        ctx.textAlign = "left";

        /* Cubículos */
        rect(ctx, 0, 186, WIDTH, 10, "#1E293B");
        rect(ctx, 0, 196, WIDTH, HEIGHT - 196, "#0E1626");

        for (let i = 0; i < 4; i += 1) {

            rect(ctx, 20 + i * 160, 200, 130, 7, "#334155");
            rect(ctx, 20 + i * 160, 207, 6, 30, "#1E293B");
            rect(ctx, 144 + i * 160, 207, 6, 30, "#1E293B");

            /* Monitor con el chat en verde */
            rect(ctx, 54 + i * 160, 168, 62, 36, "#0B1220");
            rect(ctx, 58 + i * 160, 172, 54, 28, "#052E1B");

            const parpadeo = ((i + Math.floor(t * 6)) % 2) === 0;

            rect(ctx, 62 + i * 160, 178, 30, 3, parpadeo ? "#22C55E" : "#14532D");
            rect(ctx, 62 + i * 160, 185, 40, 3, "#16A34A");
            rect(ctx, 62 + i * 160, 192, 22, 3, "#14532D");

        }

        /* Los cinco canales se reúnen: cada color se convierte luego en
           una voz del dossier de campaña. La presentación sigue siendo
           pixel-art y no bloquea la carga diferida de los PNG reales. */
        const brillo = 0.16 + Math.sin(t * Math.PI * 4) * 0.08;
        const crew = [
            { name: "SIL", role: "RED", x: 78, color: "#FB923C", ropa: "#9A3412", pelo: "#2B1B12" },
            { name: "ROG", role: "CAMPO", x: 198, color: "#38BDF8", ropa: "#155E75", pelo: "#3B2413", diadema: true },
            { name: "DESIRE", role: "REFUGIO", x: 320, color: "#F472B6", ropa: "#9D174D", pelo: "#2A1626" },
            { name: "DAVINCHI", role: "RUTA", x: 442, color: "#A3E635", ropa: "#3F6212", pelo: "#1A2410", diadema: true },
            { name: "COLINAS", role: "VIP", x: 562, color: "#FBBF24", ropa: "#F8FAFC", pelo: "#5B3A21", corona: true }
        ];

        crew.forEach((member, index) => {
            ctx.globalAlpha = Math.max(0, brillo + index * 0.012);
            ctx.fillStyle = member.color;
            ctx.beginPath();
            ctx.arc(member.x, 244, 31, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;

        crew.forEach((member) => {
            persona(ctx, member.x, 275, 1.75, {
                ropa: member.ropa,
                pelo: member.pelo,
                diadema: member.diadema,
                corona: member.corona
            });

            ctx.fillStyle = member.color;
            ctx.font = "700 7px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText(member.name, member.x, 237);
            ctx.fillStyle = "rgba(232, 237, 247, 0.72)";
            ctx.font = "600 6px 'JetBrains Mono', monospace";
            ctx.fillText(member.role, member.x, 247);
        });

        ctx.textAlign = "left";

    }


    function escenaMision(ctx, t) {

        /* Puerta del call center abriéndose a la ciudad */
        rect(ctx, 0, 0, WIDTH, HEIGHT, "#07080F");

        /* Marco de la puerta */
        rect(ctx, 60, 16, WIDTH - 120, 268, "#111827");
        rect(ctx, 74, 30, WIDTH - 148, 240, "#0A0E18");

        /* Hueco: la ciudad al otro lado, en rojo */
        const apertura = Math.min(1, t * 1.6);

        const w = (WIDTH - 200) * apertura;

        if (w > 4) {

            const luz = ctx.createLinearGradient(0, 60, 0, HEIGHT - 60);

            luz.addColorStop(0, "#7F1D1D");
            luz.addColorStop(0.5, "#B91C1C");
            luz.addColorStop(1, "#450A0A");

            ctx.fillStyle = luz;
            ctx.fillRect(320 - w / 2, 50, w, 220);

            /* Siluetas al fondo */
            ctx.globalAlpha = 0.55;

            for (let i = 0; i < 6; i += 1) {

                const x = 320 - w / 2 + 24 + i * (w / 6);

                if (x > 320 - w / 2 + 10 && x < 320 + w / 2 - 10) {

                    persona(ctx, x, 236, 1.7, {
                        ropa: "#450A0A",
                        infectado: true,
                        pelo: "#1F0708"
                    });

                }

            }

            ctx.globalAlpha = 1;

        }

        /* Tablero de ruta: adelanta que el Palacio es un nodo, no el final.
           La ruta se completa con el avance de la viñeta para que el último
           plano conecte visualmente con las seis parejas de la campaña. */
        if (w > 4) {
            const routeAlpha = Math.min(1, Math.max(0, (t - 0.18) * 2.4));
            const nodes = ["SOPORTE", "CALLE", "ARCHIVO", "NÚCLEO", "RELÉ", "COMEDOR"];
            const routeY = 122;
            const startX = 136;
            const step = 74;
            const unlocked = Math.min(nodes.length, Math.floor(t * 7));

            ctx.save();
            ctx.globalAlpha = routeAlpha * 0.88;
            rect(ctx, 112, 88, 416, 78, "#080B14");
            rect(ctx, 116, 92, 408, 3, "#FBBF24");
            ctx.fillStyle = "#FDE68A";
            ctx.font = "800 9px 'JetBrains Mono', monospace";
            ctx.textAlign = "center";
            ctx.fillText("RUTA 404 // SEIS NODOS", 320, 108);

            ctx.strokeStyle = "rgba(245, 247, 255, 0.42)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startX, routeY);
            ctx.lineTo(startX + step * (nodes.length - 1), routeY);
            ctx.stroke();

            nodes.forEach((node, index) => {
                const active = index < unlocked;
                const x = startX + index * step;

                ctx.fillStyle = active ? "#A3E635" : "#475569";
                ctx.fillRect(x - 4, routeY - 4, 8, 8);
                ctx.fillStyle = active ? "#F8FAFC" : "#94A3B8";
                ctx.font = "700 6px 'JetBrains Mono', monospace";
                ctx.fillText(node, x, routeY + 17);
            });

            ctx.restore();
            ctx.textAlign = "left";
        }

        /* El agente de espaldas, recortado a contraluz */
        const p = 2.9;
        const x = 320;
        const y = 276;

        rect(ctx, x - 4 * p, y - 8 * p, 8 * p, 8 * p, "#0B1220");
        rect(ctx, x - 3 * p, y - 14 * p, 6 * p, 6 * p, "#0B1220");
        rect(ctx, x - 3 * p, y, 2 * p, 5 * p, "#070C16");
        rect(ctx, x + 1 * p, y, 2 * p, 5 * p, "#070C16");
        rect(ctx, x - 6 * p, y - 8 * p, 2 * p, 6 * p, "#0B1220");
        rect(ctx, x + 4 * p, y - 8 * p, 2 * p, 6 * p, "#0B1220");

        /* Diadema iluminada por detrás */
        rect(ctx, x - 4 * p, y - 16 * p, 8 * p, 1 * p, "#22D3EE");
        rect(ctx, x - 5 * p, y - 14 * p, 2 * p, 3 * p, "#22D3EE");
        rect(ctx, x + 3 * p, y - 14 * p, 2 * p, 3 * p, "#22D3EE");

    }


    /* ---------------------------------------------------------
       Guion
       --------------------------------------------------------- */

    const SCENES = [
        {
            draw: escenaCiudad,
            title: "CARACAS, 03:00 AM",
            lines: [
                "La ciudad dormía. Las pantallas seguían encendidas.",
                "Entonces la misma imagen apareció en todos los barrios.",
                "No era una transmisión: era una orden buscando respuesta."
            ]
        },
        {
            draw: escenaVirus,
            title: "LA SEÑAL",
            lines: [
                "El programa de conciencia colectiva entró por cada monitor.",
                "Prometía silencio, respuestas fáciles y una sola voz.",
                "En segundos, la ciudad empezó a repetirla."
            ]
        },
        {
            draw: escenaCaos,
            title: "LA CIUDAD RESPONDE",
            lines: [
                "Usuarios, vecinos y funcionarios quedaron en el mismo canal.",
                "Las consignas reemplazaron toda conversación.",
                "Pero la señal no pudo doblar a quienes ya sabían escuchar."
            ]
        },
        {
            draw: escenaInmunes,
            title: "CINCO CANALES ABIERTOS",
            lines: [
                "Sil rastrea la señal. Rog sostiene el campo.",
                "Desire cuida el refugio y Davinchi abre las rutas.",
                "El Sr. de las Colinas mantiene los suministros VIP.",
                "Juntos pueden hacer lo imposible: cerrar el ticket."
            ]
        },
        {
            draw: escenaMision,
            title: "OPERACIÓN 404",
            lines: [
                "La señal tiene seis nodos, de Soporte hasta el Comedor.",
                "Cada jefe protege una pieza de la ruta, no una salida.",
                "Cruza las doce zonas. Apaga los nodos. Sigue al equipo.",
                "La ciudad no se salva sola. El chat sigue en espera."
            ]
        }
    ];


    /* ---------------------------------------------------------
       Reproductor de la cinemática
       --------------------------------------------------------- */

    class Intro {

        constructor(stage) {

            this.stage = stage;

            this.index = 0;
            this.elapsed = 0;
            this.done = false;

            /* Duración de cada viñeta según el texto que lleva */
            this.durations = SCENES.map((scene) => {

                const chars = scene.lines.reduce((a, l) => a + l.length, 0);

                return FADE_MS + chars * CHAR_MS + HOLD_MS;

            });

        }


        get scene() {
            return SCENES[this.index];
        }


        /* Salta a la siguiente viñeta; si es la última, termina */
        skipScene() {

            if (this.index >= SCENES.length - 1) {

                this.done = true;

                return;

            }

            this.index += 1;
            this.elapsed = 0;

            A.audio.play("select");

        }


        skipAll() {

            this.done = true;

        }


        update(dt) {

            if (this.done) {
                return;
            }

            /* La escena puede terminar de dibujar su texto, pero no se
               descarta sola. Así cada persona controla cuánto tiempo lee la
               introducción antes de pulsar ESPACIO o el control táctil. */
            const duration = this.durations[this.index] || 1;
            const delta = Math.max(0, Number(dt) || 0);

            this.elapsed = Math.min(duration, this.elapsed + delta);

        }


        render() {

            const { ctx } = this.stage;

            const scene = this.scene;

            const total = this.durations[this.index];

            const t = Math.min(1, this.elapsed / total);

            ctx.save();

            ctx.imageSmoothingEnabled = false;

            scene.draw(ctx, t);

            /* Viñeteado */
            const vig = ctx.createRadialGradient(
                WIDTH / 2, HEIGHT / 2, HEIGHT * 0.3,
                WIDTH / 2, HEIGHT / 2, HEIGHT * 0.78
            );

            vig.addColorStop(0, "rgba(0, 0, 0, 0)");
            vig.addColorStop(1, "rgba(0, 0, 0, 0.75)");

            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            /* Entrada en fundido */
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

            /* Caja inferior de subtítulos */
            const boxY = HEIGHT - 132;

            ctx.fillStyle = "rgba(4, 7, 14, 0.86)";
            ctx.fillRect(0, boxY, WIDTH, 132);

            ctx.fillStyle = "rgba(251, 191, 36, 0.75)";
            ctx.fillRect(0, boxY, WIDTH, 2);

            /* Título de la viñeta */
            ctx.font = "700 17px 'Orbitron', 'JetBrains Mono', monospace";
            ctx.fillStyle = "#FBBF24";
            ctx.textAlign = "left";

            ctx.fillText(scene.title, 26, boxY + 26);

            /* Texto escrito letra a letra */
            const shown = Math.max(
                0,
                Math.floor((this.elapsed - FADE_MS) / CHAR_MS)
            );

            ctx.font = "500 13px 'JetBrains Mono', monospace";
            ctx.fillStyle = "#E8EDF7";

            let budget = shown;

            scene.lines.forEach((line, i) => {

                if (budget <= 0) {
                    return;
                }

                const slice = line.slice(0, budget);

                budget -= line.length;

                ctx.fillText(slice, 26, boxY + 48 + i * 17);

                /* Cursor al final de la línea que se está escribiendo */
                if (budget <= 0 && slice.length < line.length) {

                    const blink = Math.floor(this.elapsed / 260) % 2 === 0;

                    if (blink) {

                        const w = ctx.measureText(slice).width;

                        ctx.fillStyle = "#FBBF24";
                        ctx.fillRect(27 + w, boxY + 38 + i * 17, 7, 12);
                        ctx.fillStyle = "#E8EDF7";

                    }

                }

            });

        }


        drawChrome(ctx) {

            /* Marcador de viñetas */
            for (let i = 0; i < SCENES.length; i += 1) {

                const on = i <= this.index;

                ctx.fillStyle = on
                    ? "rgba(251, 191, 36, 0.9)"
                    : "rgba(245, 247, 255, 0.22)";

                ctx.fillRect(WIDTH - 24 - (SCENES.length - i) * 14, 20, 9, 4);

            }

            /* Ayuda */
            ctx.font = "500 10px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(245, 247, 255, 0.5)";
            ctx.textAlign = "right";

            ctx.fillText("ESPACIO / TOCAR — SIGUIENTE · ESC — SALTAR", WIDTH - 22, HEIGHT - 8);

            ctx.textAlign = "left";

        }

    }


    A.op404 = A.op404 || {};

    A.op404.Intro = Intro;

    A.op404.INTRO_SCENES = SCENES;

})(window.Arcade404);
