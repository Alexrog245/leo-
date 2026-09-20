/* =========================================================
   ARCADE 404 — OPERACIÓN 404 · SPRITES PIXEL ART
   Todos los personajes, armas y objetos se dibujan píxel a
   píxel sobre la rejilla de A.pixelArt (estilo DOOM de baja
   resolución) y se convierten en <canvas> para el raycaster.
   ========================================================= */

(function (A) {

    "use strict";


    const P = A.pixelArt;


    /* ---------------------------------------------------------
       PALETA COMÚN
       --------------------------------------------------------- */

    const C = {

        o: "#120A10",     /* contorno            */
        s: "#F2C197",     /* piel                */
        S: "#CE9257",     /* piel en sombra      */
        s2: "#C98A5E",    /* piel morena         */
        S2: "#8E5B36",    /* piel morena sombra  */
        s3: "#C68642",    /* piel trigueña       */
        S3: "#96602C",    /* piel trigueña sombra*/
        s3L: "#E0A063",   /* piel trigueña brillo*/
        pale: "#E9E3DC",  /* piel pálida         */
        paleS: "#BFB2A8",
        h: "#2B1B12",     /* pelo oscuro         */
        hg: "#6B7280",    /* pelo canoso         */
        e: "#0B0D14",     /* pupila              */
        w: "#F5F7FF",     /* blanco              */
        m: "#5C1220",     /* boca                */
        t: "#F5F7FF",     /* dientes             */
        red: "#DC2626",
        redD: "#8F1414",
        redL: "#F87171",
        yel: "#FACC15",
        yelD: "#B8860B",
        blue: "#1D4ED8",
        blueD: "#1E3A8A",
        blueL: "#60A5FA",
        grn: "#22C55E",
        grnN: "#39FF14",  /* verde neón          */
        grnD: "#14532D",
        gry: "#6B7280",
        gryD: "#374151",
        gryL: "#D1D5DB",
        blk: "#111827",
        brn: "#7A4A22",
        brnD: "#53300F",
        brnL: "#A16B3A",
        tan: "#D9B382",
        pur: "#7C3AED",
        cyan: "#22D3EE",
        pink: "#F472B6",
        org: "#F97316",
        stl: "#9CA3AF",
        stlL: "#E5E7EB",
        stlD: "#4B5563",
        wood: "#8B5A2B",
        woodD: "#5C3A17",
        paper: "#FDF6E3",
        paperD: "#D9CBA8",
        oil: "#0F0F14",
        oilL: "#2E2E3A",
        gold: "#F5C542",
        lime: "#A3E635",
        teal: "#14B8A6"

    };


    function grid(w, h) {
        return P.makeGrid(w, h, C);
    }


    function finish(g, scale) {

        g.outline("o");

        const sprite = g.crop();

        return P.toCanvas(sprite, scale || 3);

    }


    /* ---------------------------------------------------------
       PIEZAS COMUNES
       --------------------------------------------------------- */

    /** Ojos con cejas de furia */
    function angryEyes(g, x, y, gap, color = "e") {

        g.rect(x, y, 2, 2, "w");
        g.rect(x + gap, y, 2, 2, "w");
        g.set(x + 1, y + 1, color);
        g.set(x + gap, y + 1, color);

        /* cejas en V */
        g.set(x - 1, y - 2, "h");
        g.set(x, y - 1, "h");
        g.set(x + 1, y - 1, "h");
        g.set(x + gap + 2, y - 2, "h");
        g.set(x + gap + 1, y - 1, "h");
        g.set(x + gap, y - 1, "h");

    }


    /** Boca abierta gritando */
    function shoutMouth(g, x, y, w) {

        g.rect(x, y, w, 3, "m");
        g.rect(x, y, w, 1, "t");

    }


    /** Piernas + zapatos */
    function legs(g, cx, y, color, shoe = "blk", spread = 2) {

        g.rect(cx - spread - 3, y, 3, 8, color);
        g.rect(cx + spread, y, 3, 8, color);
        g.rect(cx - spread - 4, y + 8, 4, 2, shoe);
        g.rect(cx + spread, y + 8, 4, 2, shoe);

    }


    /* =========================================================
       ENEMIGOS COMUNES
       ========================================================= */

    /** CHAVISTA — camisa y gorra rojas, "PSUV", ojos de Chávez */
    function chavista(frame = 0) {

        const g = grid(30, 44);

        const cx = 14;
        const step = frame === 1 ? 1 : 0;

        /* piernas (pantalón oscuro) */
        g.rect(cx - 5, 32, 4, 9 - step, "blueD");
        g.rect(cx + 1, 32 + step, 4, 9 - step, "blueD");
        g.rect(cx - 6, 41 - step, 5, 2, "blk");
        g.rect(cx + 1, 41, 5, 2, "blk");

        /* camisa roja */
        g.rect(cx - 7, 18, 14, 15, "red");
        g.rect(cx - 7, 30, 14, 3, "redD");

        /* brazos levantados (corre gritando) */
        g.line(cx - 8, 20, cx - 11, 12, "red", 3);
        g.line(cx + 8, 20, cx + 11, 12, "red", 3);
        g.rect(cx - 12, 9, 3, 3, "s2");
        g.rect(cx + 10, 9, 3, 3, "s2");

        /* "PSUV" (texto ilegible pixelado) */
        P.text(g, cx - 6, 21, "PSUV", "w");

        /* ojos de Chávez (dos rayitas blancas) */
        g.rect(cx - 4, 27, 3, 1, "w");
        g.rect(cx + 2, 27, 3, 1, "w");
        g.set(cx - 3, 28, "w");
        g.set(cx + 3, 28, "w");

        /* cabeza */
        g.ellipse(cx, 11, 5.4, 6, "s2");
        g.rect(cx - 5, 15, 11, 1, "S2");

        /* cara ruidosa */
        angryEyes(g, cx - 3, 10, 4);
        shoutMouth(g, cx - 2, 14, 5);

        /* gorra roja */
        g.ellipse(cx, 6, 6, 3, "red");
        g.rect(cx - 6, 6, 12, 2, "red");
        g.rect(cx - 9, 8, 8, 1, "redD");     /* visera */
        g.set(cx, 4, "yel");                 /* estrella */

        return finish(g, 3);

    }


    /** USUARIO MOLESTO — camisa de cuadros, teclado o monitor */
    function usuario(frame = 0, variant = 0) {

        const g = grid(32, 44);

        const cx = 14;
        const step = frame === 1 ? 1 : 0;

        const shirt = variant === 0 ? "blue" : variant === 1 ? "grn" : "org";
        const shirtD = variant === 0 ? "blueD" : variant === 1 ? "grnD" : "brnD";

        legs(g, cx, 33 - step, "gryD");

        /* camisa de cuadros */
        g.rect(cx - 7, 18, 14, 15, shirt);

        for (let y = 18; y < 33; y += 3) {
            g.rect(cx - 7, y, 14, 1, shirtD);
        }

        for (let x = cx - 7; x < cx + 7; x += 3) {
            g.rect(x, 18, 1, 15, shirtD);
        }

        /* brazos sujetando el arma improvisada */
        g.rect(cx - 10, 20, 3, 8, shirt);
        g.rect(cx + 7, 20, 3, 8, shirt);
        g.rect(cx - 10, 28, 3, 2, "s");
        g.rect(cx + 7, 28, 3, 2, "s");

        if (variant === 2) {

            /* monitor en alto */
            g.rect(cx - 8, 2, 16, 11, "gryD");
            g.rect(cx - 7, 3, 14, 8, "cyan");
            g.rect(cx - 6, 4, 6, 1, "w");
            g.rect(cx - 2, 12, 4, 2, "gryD");

        } else {

            /* teclado en alto */
            g.rect(cx - 10, 12, 20, 5, "gryL");

            for (let x = cx - 9; x < cx + 9; x += 2) {
                g.set(x, 13, "gryD");
                g.set(x, 15, "gryD");
            }

        }

        /* cabeza */
        g.ellipse(cx, 12 + (variant === 2 ? 4 : 0), 5, 5.5, "s");

        const hy = variant === 2 ? 4 : 0;

        g.rect(cx - 5, 7 + hy, 10, 2, variant === 1 ? "yelD" : "h");
        g.rect(cx - 5, 9 + hy, 1, 3, variant === 1 ? "yelD" : "h");
        g.rect(cx + 4, 9 + hy, 1, 3, variant === 1 ? "yelD" : "h");

        angryEyes(g, cx - 3, 11 + hy, 4, "red");

        shoutMouth(g, cx - 2, 15 + hy, 5);

        /* venas de furia */
        g.set(cx + 5, 8 + hy, "red");
        g.set(cx + 6, 9 + hy, "red");

        return finish(g, 3);

    }


    /** GENTE DE CALIDAD — camisa formal, gafas, carpeta y planilla.
        Son los supervisores que te evalúan la llamada. */
    function calidad(frame = 0, variant = 0) {

        const g = grid(32, 44);

        const cx = 15;
        const step = frame === 1 ? 1 : 0;

        legs(g, cx, 33 - step, "blueD");

        /* camisa formal celeste con corbata */
        g.rect(cx - 7, 18, 14, 15, "blueL");
        g.rect(cx - 7, 18, 14, 2, "w");

        /* corbata */
        g.rect(cx - 1, 19, 2, 9, variant ? "red" : "pur");
        g.rect(cx - 2, 28, 4, 3, variant ? "redD" : "pur");

        /* carné colgado */
        g.rect(cx + 3, 22, 3, 4, "w");
        g.set(cx + 4, 23, "cyan");

        /* brazos: uno sostiene la carpeta */
        g.rect(cx - 10, 20, 3, 8, "blueL");
        g.rect(cx + 7, 20, 3, 8, "blueL");
        g.rect(cx - 10, 28, 3, 2, "s");

        /* carpeta con la planilla, se agita al atacar */
        const cy = frame === 1 ? 14 : 16;

        g.rect(cx + 6, cy, 10, 12, "brnD");
        g.rect(cx + 7, cy + 1, 8, 10, "paper");

        for (let i = 0; i < 4; i += 1) {
            g.rect(cx + 8, cy + 3 + i * 2, 6, 1, "gryD");
        }

        /* cabeza */
        g.ellipse(cx, 12, 5, 5.5, "s");

        /* pelo peinado a un lado */
        g.rect(cx - 5, 7, 10, 3, "h");
        g.rect(cx + 1, 6, 4, 2, "h");

        /* gafas de pasta */
        g.rect(cx - 5, 11, 4, 3, "blk");
        g.rect(cx + 1, 11, 4, 3, "blk");
        g.rect(cx - 1, 12, 2, 1, "blk");
        g.set(cx - 4, 12, "cyan");
        g.set(cx + 2, 12, "cyan");

        /* boca de desaprobación */
        g.rect(cx - 2, 16, 5, 1, "m");

        return finish(g, 3);

    }


    /** MOTORIZADO — casco, chaqueta y moto en marcha */
    function motorizado(frame = 0) {

        const g = grid(34, 44);

        const cx = 16;
        const bump = frame === 1 ? 1 : 0;

        /* rueda trasera y delantera */
        g.ellipse(cx - 8, 36 - bump, 5, 5, "blk");
        g.ellipse(cx + 8, 36 - bump, 5, 5, "blk");
        g.ellipse(cx - 8, 36 - bump, 2, 2, "stl");
        g.ellipse(cx + 8, 36 - bump, 2, 2, "stl");

        /* cuadro de la moto */
        g.rect(cx - 8, 30 - bump, 17, 4, "red");
        g.rect(cx + 6, 26 - bump, 3, 6, "stl");

        /* manillar */
        g.rect(cx + 4, 24 - bump, 8, 2, "stl");

        /* cuerpo inclinado hacia delante */
        g.rect(cx - 6, 18 - bump, 12, 13, "blk");
        g.rect(cx - 6, 18 - bump, 12, 3, "red");

        /* brazos al manillar */
        g.rect(cx + 2, 21 - bump, 8, 3, "blk");
        g.rect(cx + 9, 23 - bump, 3, 2, "s");

        /* casco integral */
        g.ellipse(cx, 12 - bump, 6, 6, "red");
        g.rect(cx - 6, 11 - bump, 12, 3, "blk");
        g.rect(cx - 5, 11 - bump, 10, 2, "cyan");
        g.ellipse(cx, 10 - bump, 6, 4, "redD");
        g.ellipse(cx, 9 - bump, 5, 3, "red");

        /* estela de velocidad */
        if (frame === 1) {
            g.rect(cx - 16, 22, 4, 1, "yel");
            g.rect(cx - 16, 27, 5, 1, "org");
        }

        return finish(g, 3);

    }


    /** BURÓCRATA — traje gris, sellos y torre de papeles */
    function burocrata(frame = 0) {

        const g = grid(32, 46);

        const cx = 15;
        const step = frame === 1 ? 1 : 0;

        legs(g, cx, 34 - step, "gryD");

        /* traje gris cruzado */
        g.rect(cx - 8, 18, 16, 17, "gry");
        g.rect(cx - 8, 18, 16, 2, "gryD");
        g.rect(cx - 1, 20, 2, 15, "gryD");

        /* camisa y corbata */
        g.rect(cx - 3, 19, 6, 5, "w");
        g.rect(cx - 1, 20, 2, 6, "redD");

        /* brazos */
        g.rect(cx - 11, 20, 3, 9, "gry");
        g.rect(cx + 8, 20, 3, 9, "gry");

        /* sello en alto, golpea al atacar */
        const sy = frame === 1 ? 10 : 13;

        g.rect(cx + 7, sy, 7, 4, "wood");
        g.rect(cx + 8, sy + 4, 5, 3, "brnD");
        g.rect(cx + 8, sy + 7, 5, 2, "red");

        /* torre de expedientes en la otra mano */
        g.rect(cx - 14, 24, 9, 3, "paper");
        g.rect(cx - 14, 27, 9, 3, "paperD");
        g.rect(cx - 14, 30, 9, 3, "paper");

        /* cabeza calva con corona de pelo canoso */
        g.ellipse(cx, 12, 5, 5.5, "s");
        g.rect(cx - 5, 9, 10, 2, "hg");
        g.rect(cx - 5, 9, 1, 4, "hg");
        g.rect(cx + 4, 9, 1, 4, "hg");

        /* gafas de leer en la punta de la nariz */
        g.rect(cx - 4, 13, 3, 2, "stlL");
        g.rect(cx + 1, 13, 3, 2, "stlL");

        /* ceño y boca */
        g.rect(cx - 4, 11, 3, 1, "hg");
        g.rect(cx + 1, 11, 3, 1, "hg");
        g.rect(cx - 2, 17, 4, 1, "m");

        return finish(g, 3);

    }


    /** COLECTIVO — gorra roja, pasamontañas y pistola */
    function colectivo(frame = 0) {

        const g = grid(32, 44);

        const cx = 15;
        const step = frame === 1 ? 1 : 0;

        legs(g, cx, 33 - step, "blk");

        /* chaqueta roja */
        g.rect(cx - 8, 18, 16, 15, "red");
        g.rect(cx - 8, 18, 16, 2, "redD");
        g.rect(cx - 1, 19, 2, 14, "redD");

        /* brazo extendido con la pistola */
        const ay = frame === 1 ? 21 : 22;

        g.rect(cx + 8, ay, 9, 3, "red");
        g.rect(cx + 16, ay, 4, 3, "s");
        g.rect(cx + 19, ay, 5, 2, "blk");
        g.rect(cx + 21, ay + 2, 2, 2, "blk");

        if (frame === 1) {
            g.rect(cx + 24, ay - 1, 3, 3, "yel");
            g.set(cx + 26, ay, "w");
        }

        g.rect(cx - 11, 20, 3, 9, "red");

        /* cabeza con pasamontañas */
        g.ellipse(cx, 12, 5, 5.5, "blk");
        g.rect(cx - 5, 11, 10, 3, "s");
        g.rect(cx - 4, 11, 3, 2, "w");
        g.rect(cx + 1, 11, 3, 2, "w");
        g.set(cx - 3, 12, "e");
        g.set(cx + 2, 12, "e");

        /* gorra roja con estrella */
        g.rect(cx - 6, 6, 12, 3, "red");
        g.rect(cx - 6, 9, 9, 1, "redD");
        g.set(cx, 7, "yel");

        return finish(g, 3);

    }


    /** EL SUPERVISOR — sub-jefe del mundo 1, diadema y tablero */
    function supervisor(frame = 0) {

        const g = grid(40, 54);

        const cx = 19;
        const step = frame === 1 ? 1 : 0;

        legs(g, cx, 42 - step, "blueD", "blk", 3);

        /* camisa blanca con chaleco */
        g.rect(cx - 10, 22, 20, 20, "w");
        g.rect(cx - 10, 22, 20, 20, "w");
        g.rect(cx - 7, 22, 14, 20, "blueD");
        g.rect(cx - 1, 23, 2, 12, "red");

        /* placa de SUPERVISOR */
        g.rect(cx + 2, 26, 6, 3, "gold");

        /* brazos */
        g.rect(cx - 14, 24, 4, 11, "w");
        g.rect(cx + 10, 24, 4, 11, "w");

        /* tablero con métricas en rojo */
        const ty = frame === 1 ? 16 : 18;

        g.rect(cx + 10, ty, 14, 17, "brnD");
        g.rect(cx + 11, ty + 1, 12, 15, "paper");
        g.rect(cx + 12, ty + 3, 10, 2, "red");
        g.rect(cx + 12, ty + 7, 8, 1, "gryD");
        g.rect(cx + 12, ty + 10, 9, 1, "gryD");
        g.rect(cx + 12, ty + 13, 5, 1, "red");

        /* cabeza */
        g.ellipse(cx, 15, 6, 6.5, "s");

        /* pelo engominado */
        g.rect(cx - 6, 9, 12, 3, "h");
        g.rect(cx - 6, 12, 2, 3, "h");
        g.rect(cx + 4, 12, 2, 3, "h");

        /* diadema de call center: es del gremio, pero traidor */
        g.rect(cx - 7, 10, 14, 2, "gryD");
        g.rect(cx - 8, 12, 2, 5, "gryD");
        g.rect(cx + 6, 12, 2, 5, "gryD");
        g.rect(cx + 6, 17, 4, 2, "gryD");
        g.set(cx + 9, 18, "red");

        /* gafas y ceño */
        g.rect(cx - 6, 14, 5, 3, "blk");
        g.rect(cx + 1, 14, 5, 3, "blk");
        g.set(cx - 5, 15, "cyan");
        g.set(cx + 2, 15, "cyan");

        g.rect(cx - 3, 20, 6, 1, "m");

        return finish(g, 3);

    }


    /** EL PRANES — sub-jefe del mundo 2, cadenas de oro y pistola */
    function jefeBarrio(frame = 0) {

        const g = grid(40, 54);

        const cx = 19;
        const step = frame === 1 ? 1 : 0;

        legs(g, cx, 42 - step, "blk", "w", 3);

        /* torso corpulento sin camisa, chaleco abierto */
        g.rect(cx - 11, 22, 22, 20, "s");
        g.rect(cx - 11, 22, 5, 20, "blk");
        g.rect(cx + 6, 22, 5, 20, "blk");

        /* tatuajes */
        g.rect(cx - 4, 26, 3, 1, "blueD");
        g.rect(cx - 5, 28, 5, 1, "blueD");
        g.rect(cx + 1, 31, 4, 1, "blueD");

        /* cadenas de oro */
        for (let i = 0; i < 7; i += 1) {
            g.set(cx - 3 + i, 23 + Math.abs(3 - i), "gold");
        }

        g.rect(cx - 1, 27, 3, 3, "gold");

        /* brazos */
        g.rect(cx - 15, 24, 4, 12, "s");

        const ay = frame === 1 ? 23 : 25;

        g.rect(cx + 11, ay, 10, 4, "s");
        g.rect(cx + 20, ay, 6, 3, "blk");
        g.rect(cx + 23, ay + 3, 2, 2, "blk");

        if (frame === 1) {
            g.rect(cx + 26, ay - 1, 4, 4, "yel");
            g.rect(cx + 29, ay, 2, 2, "w");
        }

        /* cabeza */
        g.ellipse(cx, 15, 6, 6.5, "s");

        /* gorra plana ladeada */
        g.rect(cx - 7, 8, 14, 4, "blk");
        g.rect(cx + 3, 12, 6, 2, "blk");
        g.rect(cx - 6, 9, 5, 1, "gold");

        /* Oakleys iridiscentes */
        g.rect(cx - 6, 14, 13, 3, "blk");
        g.set(cx - 5, 15, "cyan");
        g.set(cx - 3, 15, "pur");
        g.set(cx + 1, 15, "pink");
        g.set(cx + 4, 15, "cyan");

        /* barba y mueca */
        g.rect(cx - 4, 19, 9, 3, "h");
        g.rect(cx - 2, 20, 5, 1, "m");

        /* diente de oro */
        g.set(cx + 2, 20, "gold");

        return finish(g, 3);

    }


    /** MALANDRO — tatuado, franela negra, gorra al revés, Oakleys */
    function malandro(frame = 0) {

        const g = grid(30, 46);

        const cx = 14;
        const step = frame === 1 ? 1 : 0;

        /* pantalón caído con calzoncillos a la vista */
        g.rect(cx - 6, 30, 12, 3, "w");
        g.rect(cx - 6, 30, 12, 1, "blueL");
        g.rect(cx - 6, 33, 5, 9 - step, "blue");
        g.rect(cx + 1, 33 + step, 5, 9 - step, "blue");
        g.rect(cx - 7, 42 - step, 6, 2, "w");
        g.rect(cx + 1, 42, 6, 2, "w");

        /* torso delgado con franela de esqueleto negra */
        g.rect(cx - 5, 17, 10, 14, "s2");
        g.rect(cx - 4, 17, 8, 13, "blk");
        g.rect(cx - 5, 17, 2, 4, "s2");
        g.rect(cx + 3, 17, 2, 4, "s2");

        /* brazos tatuados: piel con manchas oscuras */
        g.rect(cx - 9, 18, 3, 12, "s2");
        g.rect(cx + 6, 18, 3, 8, "s2");

        [[cx - 8, 20], [cx - 9, 23], [cx - 7, 26], [cx + 7, 20], [cx + 6, 23]]
            .forEach(([x, y]) => {
                g.set(x, y, "blueD");
                g.set(x + 1, y + 1, "gryD");
            });

        /* pistola en la mano derecha (hacia el jugador) */
        g.rect(cx + 6, 26, 3, 2, "s2");
        g.rect(cx + 8, 25, 6, 3, "gryD");
        g.rect(cx + 8, 28, 2, 3, "gryD");
        g.set(cx + 13, 26, "stl");

        /* cuello tatuado */
        g.rect(cx - 2, 15, 4, 2, "s2");
        g.set(cx - 1, 15, "blueD");
        g.set(cx + 1, 16, "gryD");

        /* cabeza */
        g.ellipse(cx, 10, 5, 5.5, "s2");

        /* gorra hacia atrás (oscura con detalle) */
        g.ellipse(cx, 6, 5.8, 2.6, "blk");
        g.rect(cx - 6, 6, 12, 2, "blk");
        g.rect(cx + 5, 6, 4, 2, "gryD");     /* visera hacia atrás */
        g.set(cx - 2, 5, "red");
        g.set(cx + 1, 5, "red");

        /* OAKLEYS de espejo: iridiscente verde/azul/cian */
        g.rect(cx - 6, 9, 12, 3, "blk");
        g.rect(cx - 5, 9, 5, 3, "cyan");
        g.rect(cx + 1, 9, 5, 3, "cyan");
        g.set(cx - 5, 9, "w");
        g.set(cx + 1, 9, "w");
        g.set(cx - 3, 10, "grn");
        g.set(cx + 3, 10, "grn");
        g.set(cx - 2, 11, "blue");
        g.set(cx + 4, 11, "blue");
        g.set(cx - 1, 11, "pur");
        g.set(cx + 5, 11, "pur");

        /* perilla y boca torcida */
        g.rect(cx - 1, 14, 3, 1, "m");
        g.rect(cx - 1, 15, 3, 1, "h");

        return finish(g, 3);

    }


    /* =========================================================
       JEFES
       ========================================================= */

    /** MADURO — corpulento, bigote, chaqueta tricolor, índice arriba */
    function maduro() {

        const g = grid(40, 56);

        const cx = 19;

        /* piernas */
        g.rect(cx - 8, 44, 6, 9, "blk");
        g.rect(cx + 2, 44, 6, 9, "blk");
        g.rect(cx - 9, 53, 8, 2, "gryD");
        g.rect(cx + 2, 53, 8, 2, "gryD");

        /* torso corpulento: chaqueta tricolor */
        g.ellipse(cx, 33, 12, 13, "yel");
        g.rect(cx - 12, 30, 24, 6, "blue");
        g.rect(cx - 12, 36, 24, 9, "red");
        g.rect(cx - 12, 43, 24, 2, "redD");

        /* estrellas en el pecho (arco sobre el azul) */
        [[cx - 8, 31], [cx - 5, 30], [cx - 2, 29], [cx + 1, 29], [cx + 4, 30], [cx + 7, 31]]
            .forEach(([x, y]) => g.set(x, y, "w"));

        /* cremallera */
        g.rect(cx, 22, 1, 22, "yelD");

        /* brazo izquierdo caído */
        g.line(cx - 12, 26, cx - 16, 40, "yel", 4);
        g.rect(cx - 18, 40, 4, 4, "s2");

        /* brazo derecho en alto con el ÍNDICE levantado */
        g.line(cx + 12, 26, cx + 16, 12, "yel", 4);
        g.rect(cx + 14, 8, 5, 5, "s2");
        g.rect(cx + 15, 2, 2, 6, "s2");     /* dedo índice */

        /* cuello */
        g.rect(cx - 3, 18, 6, 3, "s2");

        /* cabeza grande */
        g.ellipse(cx, 11, 7, 8, "s2");
        g.rect(cx - 7, 15, 14, 3, "S2");

        /* pelo negro corto */
        g.ellipse(cx, 5, 7, 3, "h");
        g.rect(cx - 7, 5, 14, 3, "h");
        g.rect(cx - 7, 8, 1, 4, "h");
        g.rect(cx + 6, 8, 1, 4, "h");

        /* ojos */
        g.rect(cx - 4, 9, 2, 2, "w");
        g.rect(cx + 2, 9, 2, 2, "w");
        g.set(cx - 3, 10, "e");
        g.set(cx + 2, 10, "e");
        g.rect(cx - 5, 7, 4, 1, "h");
        g.rect(cx + 1, 7, 4, 1, "h");

        /* nariz */
        g.rect(cx - 1, 11, 2, 2, "S2");

        /* BIGOTE prominente */
        g.rect(cx - 6, 13, 12, 3, "h");
        g.rect(cx - 7, 14, 14, 2, "h");
        g.set(cx - 7, 16, "h");
        g.set(cx + 6, 16, "h");

        /* boca bajo el bigote */
        g.rect(cx - 2, 17, 4, 1, "m");

        return finish(g, 3);

    }


    /** CHÁVEZ — corona de laureles, túnica de decretos, sobre un barril */
    function chavez() {

        const g = grid(48, 64);

        const cx = 23;

        /* BARRIL de petróleo */
        g.rect(cx - 13, 44, 26, 18, "blk");
        g.rect(cx - 13, 46, 26, 2, "gryD");
        g.rect(cx - 13, 52, 26, 2, "gryD");
        g.rect(cx - 13, 58, 26, 2, "gryD");
        g.ellipse(cx, 44, 13, 3, "gryD");
        P.text(g, cx - 5, 48, "OIL", "yel");

        /* chorreón de petróleo */
        g.rect(cx + 8, 44, 3, 10, "oilL");
        g.set(cx + 9, 55, "oilL");

        /* piernas colgando */
        g.rect(cx - 9, 40, 5, 8, "red");
        g.rect(cx + 4, 40, 5, 8, "red");
        g.rect(cx - 10, 48, 6, 2, "blk");
        g.rect(cx + 4, 48, 6, 2, "blk");

        /* túnica de DECRETOS (papeles superpuestos) */
        g.ellipse(cx, 31, 13, 12, "paper");

        for (let i = 0; i < 6; i += 1) {

            const px = cx - 11 + (i % 3) * 8;
            const py = 22 + Math.floor(i / 3) * 10;

            g.rect(px, py, 7, 9, i % 2 ? "paper" : "paperD");
            g.rect(px + 1, py + 2, 5, 1, "gryD");
            g.rect(px + 1, py + 4, 4, 1, "gryD");
            g.rect(px + 1, py + 6, 5, 1, "gryD");

        }

        /* banda roja presidencial */
        g.line(cx - 10, 22, cx + 8, 40, "red", 3);

        /* brazo izquierdo apoyado */
        g.line(cx - 12, 26, cx - 17, 36, "paper", 4);
        g.rect(cx - 19, 36, 4, 4, "s2");

        /* brazo derecho con PLUMA gigante */
        g.line(cx + 12, 26, cx + 17, 16, "paper", 4);
        g.rect(cx + 16, 12, 5, 5, "s2");

        g.line(cx + 19, 14, cx + 22, 2, "gold", 2);
        g.rect(cx + 21, 0, 3, 4, "blk");      /* plumín */
        g.line(cx + 18, 14, cx + 13, 22, "blueD", 2);

        /* cuello */
        g.rect(cx - 3, 18, 6, 3, "s2");

        /* cabeza exagerada (caricatura) */
        g.ellipse(cx, 11, 8, 8, "s2");
        g.rect(cx - 8, 15, 16, 3, "S2");
        g.ellipse(cx, 16, 6, 3, "S2");      /* mandíbula ancha */

        /* pelo muy corto */
        g.ellipse(cx, 5, 8, 2.5, "h");

        /* cejas pobladas */
        g.rect(cx - 6, 7, 5, 2, "h");
        g.rect(cx + 1, 7, 5, 2, "h");

        /* ojos */
        g.rect(cx - 5, 9, 3, 2, "w");
        g.rect(cx + 2, 9, 3, 2, "w");
        g.set(cx - 4, 10, "e");
        g.set(cx + 3, 10, "e");

        /* nariz grande */
        g.rect(cx - 2, 11, 4, 3, "S2");

        /* boca enorme, hablando */
        g.rect(cx - 5, 15, 10, 3, "m");
        g.rect(cx - 5, 15, 10, 1, "t");

        /* CORONA DE LAURELES verde */
        [[cx - 8, 6], [cx - 7, 4], [cx - 5, 3], [cx - 3, 2], [cx - 1, 2],
         [cx + 1, 2], [cx + 3, 2], [cx + 5, 3], [cx + 7, 4], [cx + 8, 6]]
            .forEach(([x, y]) => {
                g.rect(x, y, 2, 2, "grn");
                g.set(x, y, "lime");
            });

        return finish(g, 3);

    }


    /** EL MANGUANGUA — busto pálido, gorra de la V, sonrisa mecánica */
    function manguangua() {

        const g = grid(40, 44);

        const cx = 19;

        /* hombros (camisa blanca, busto) */
        g.ellipse(cx, 40, 16, 8, "w");
        g.rect(cx - 16, 40, 32, 4, "gryL");
        g.rect(cx - 2, 32, 4, 8, "paleS");     /* cuello */

        /* cara pálida y alargada */
        g.ellipse(cx, 19, 9, 12, "pale");
        g.rect(cx - 8, 26, 16, 5, "paleS");

        /* orejas */
        g.rect(cx - 10, 17, 2, 4, "pale");
        g.rect(cx + 8, 17, 2, 4, "pale");

        /* ojos hundidos */
        g.rect(cx - 6, 14, 4, 4, "gryD");
        g.rect(cx + 2, 14, 4, 4, "gryD");
        g.rect(cx - 5, 15, 2, 2, "w");
        g.rect(cx + 3, 15, 2, 2, "w");
        g.set(cx - 4, 16, "e");
        g.set(cx + 3, 16, "e");

        /* lentes de montura fina */
        g.frame(cx - 7, 13, 6, 6, "gryD");
        g.frame(cx + 1, 13, 6, 6, "gryD");
        g.set(cx, 15, "gryD");
        g.set(cx - 1, 15, "gryD");

        /* nariz larga */
        g.rect(cx - 1, 18, 2, 5, "paleS");

        /* SONRISA mecánica, esquelética: fila de dientes */
        g.rect(cx - 7, 25, 14, 4, "m");
        g.rect(cx - 6, 26, 12, 2, "t");

        for (let x = cx - 6; x < cx + 6; x += 2) {
            g.set(x, 26, "gryL");
            g.set(x + 1, 27, "gryL");
        }

        g.set(cx - 8, 24, "m");
        g.set(cx + 7, 24, "m");

        /* pómulos marcados */
        g.rect(cx - 8, 21, 2, 1, "paleS");
        g.rect(cx + 6, 21, 2, 1, "paleS");

        /* GORRA de la "V" tricolor */
        g.ellipse(cx, 8, 10, 4, "w");
        g.rect(cx - 10, 8, 20, 3, "w");
        g.rect(cx - 13, 11, 10, 2, "gryL");      /* visera */

        /* logo V: amarillo / azul / rojo */
        g.line(cx - 4, 4, cx - 1, 9, "yel", 1);
        g.line(cx - 3, 4, cx, 9, "blue", 1);
        g.line(cx + 4, 4, cx + 1, 9, "red", 1);
        g.line(cx + 3, 4, cx, 9, "blue", 1);

        return finish(g, 3);

    }


    /** SR. M — gordo español, gafas verde neón, camisa de cuadros,
        cuchara con mierda y bocadillo "¡A COMER MIERDA CON CUCHARA!" */
    function srm() {

        const g = grid(64, 72);

        const cx = 30;
        const top = 22;   /* espacio superior para el bocadillo */

        /* BOCADILLO persistente */
        const bubbleW = 63;

        g.rect(0, 0, bubbleW, 15, "w");
        g.rect(1, 15, bubbleW - 2, 1, "w");
        g.set(cx - 6, 16, "w");
        g.rect(cx - 7, 16, 3, 1, "w");
        g.set(cx - 6, 17, "w");

        P.text(g, 3, 2, "¡A COMER MIERDA", "o");
        P.text(g, 9, 8, "CON CUCHARA!", "o");

        /* piernas */
        g.rect(cx - 8, top + 38, 6, 9, "blueD");
        g.rect(cx + 2, top + 38, 6, 9, "blueD");
        g.rect(cx - 9, top + 47, 8, 2, "blk");
        g.rect(cx + 2, top + 47, 8, 2, "blk");

        /* barriga: camisa de CUADROS (rojo / blanco) */
        g.ellipse(cx, top + 28, 13, 12, "w");
        g.rect(cx - 13, top + 24, 26, 15, "w");

        for (let y = top + 17; y < top + 40; y += 3) {
            g.rect(cx - 13, y, 26, 1, "red");
        }

        for (let x = cx - 12; x < cx + 13; x += 3) {
            g.rect(x, top + 17, 1, 23, "red");
        }

        /* botones */
        g.rect(cx, top + 18, 1, 20, "gryL");

        /* brazo izquierdo caído */
        g.line(cx - 13, top + 21, cx - 17, top + 34, "w", 4);
        g.rect(cx - 19, top + 34, 4, 4, "s");

        /* brazo derecho con la CUCHARA en alto */
        g.line(cx + 13, top + 21, cx + 19, top + 10, "w", 4);
        g.rect(cx + 18, top + 6, 5, 5, "s");

        g.line(cx + 21, top + 7, cx + 24, top - 1, "stlL", 2);
        g.ellipse(cx + 25, top - 3, 3.5, 2.6, "stlL");
        g.ellipse(cx + 25, top - 4, 2.8, 1.8, "brn");
        g.set(cx + 24, top - 5, "brnD");

        /* cuello y papada */
        g.rect(cx - 4, top + 13, 8, 4, "s");
        g.ellipse(cx, top + 16, 6, 2, "S");

        /* cabeza redonda */
        g.ellipse(cx, top + 6, 8, 8, "s");
        g.rect(cx - 8, top + 10, 16, 3, "S");

        /* pelo oscuro, entradas */
        g.ellipse(cx, top - 1, 8, 2.5, "h");
        g.rect(cx - 8, top - 1, 3, 4, "h");
        g.rect(cx + 5, top - 1, 3, 4, "h");
        g.rect(cx - 2, top - 2, 4, 1, "s");   /* entradas */

        /* cejas de FURIA absoluta */
        g.line(cx - 7, top + 1, cx - 2, top + 4, "h", 1);
        g.line(cx + 7, top + 1, cx + 2, top + 4, "h", 1);

        /* GAFAS VERDE NEÓN */
        g.rect(cx - 7, top + 3, 6, 5, "blk");
        g.rect(cx + 1, top + 3, 6, 5, "blk");
        g.frame(cx - 7, top + 3, 6, 5, "grnN");
        g.frame(cx + 1, top + 3, 6, 5, "grnN");
        g.rect(cx - 1, top + 5, 2, 1, "grnN");
        g.set(cx - 8, top + 4, "grnN");
        g.set(cx + 7, top + 4, "grnN");

        /* pupilas furiosas dentro */
        g.rect(cx - 5, top + 5, 2, 2, "w");
        g.rect(cx + 3, top + 5, 2, 2, "w");
        g.set(cx - 4, top + 5, "red");
        g.set(cx + 3, top + 5, "red");

        /* nariz */
        g.rect(cx - 1, top + 8, 3, 2, "S");

        /* boca gritando */
        g.rect(cx - 5, top + 10, 10, 3, "m");
        g.rect(cx - 5, top + 10, 10, 1, "t");

        /* mejillas rojas de rabia */
        g.set(cx - 7, top + 9, "redL");
        g.set(cx + 6, top + 9, "redL");

        return finish(g, 3);

    }


    /* =========================================================
       PROYECTILES Y OBJETOS
       ========================================================= */

    function bala() {

        const g = grid(8, 6);

        g.rect(1, 2, 5, 2, "yel");
        g.set(6, 2, "org");
        g.set(6, 3, "org");
        g.set(0, 2, "w");

        return finish(g, 3);

    }


    /* Munición de las armas experimentales: colores muy distintos incluso
       en los píxeles del raycaster para comunicar sus efectos antes del hit. */
    function pulso() {

        const g = grid(12, 8);

        g.line(1, 4, 10, 4, "cyan", 2);
        g.rect(3, 2, 5, 4, "blueL");
        g.set(1, 4, "w");
        g.set(10, 4, "w");

        return finish(g, 3);

    }


    function crio() {

        const g = grid(14, 14);

        g.ellipse(7, 7, 5.5, 5.5, "blueD");
        g.ellipse(6, 6, 3.4, 3.4, "blueL");
        g.set(4, 4, "w");
        g.set(9, 8, "cyan");
        g.set(7, 1, "w");

        return finish(g, 3);

    }


    function rebote() {

        const g = grid(12, 12);

        g.ellipse(6, 6, 5, 5, "pur");
        g.ellipse(6, 6, 3, 3, "pink");
        g.set(6, 2, "w");
        g.set(9, 6, "cyan");
        g.set(6, 9, "w");
        g.set(2, 6, "cyan");

        return finish(g, 3);

    }


    /** PLANILLA de evaluación: la tiran girando como un frisbee */
    function planilla() {

        const g = grid(14, 16);

        g.rect(1, 1, 12, 14, "paper");
        g.rect(1, 1, 12, 2, "cyan");

        /* casillas de evaluación, una marcada en rojo */
        for (let i = 0; i < 4; i += 1) {
            g.rect(3, 5 + i * 2, 1, 1, "gryD");
            g.rect(5, 5 + i * 2, 6, 1, "gryD");
        }

        g.rect(3, 11, 1, 1, "red");
        g.rect(2, 10, 3, 3, "red");

        return finish(g, 3);

    }


    /** SELLO burocrático: "RECHAZADO" en tinta roja */
    function sello() {

        const g = grid(14, 14);

        g.ellipse(7, 7, 6, 6, "redD");
        g.ellipse(7, 7, 4.5, 4.5, "red");
        g.rect(2, 6, 10, 3, "w");
        g.rect(3, 7, 8, 1, "redD");

        return finish(g, 3);

    }


    /* =========================================================
       DINERO — lo que sueltan los enemigos al caer
       ========================================================= */

    /** Moneda de bolívar girando (4 fotogramas) */
    function moneda(frame = 0) {

        const g = grid(12, 12);

        /* El ancho cambia por fotograma para simular el giro */
        const w = [5, 3.2, 1.4, 3.2][frame % 4];

        g.ellipse(6, 6, w, 5, "gold");

        if (w > 2.5) {

            g.ellipse(6, 6, w - 1.4, 3.6, "yel");

            /* estrella central */
            g.set(6, 5, "yelD");
            g.set(5, 6, "yelD");
            g.set(6, 6, "yelD");
            g.set(7, 6, "yelD");
            g.set(6, 7, "yelD");

        }

        return finish(g, 3);

    }


    /** Fajo de billetes */
    function billete() {

        const g = grid(16, 12);

        g.rect(1, 3, 14, 7, "grnD");
        g.rect(1, 2, 14, 7, "grn");
        g.rect(2, 3, 12, 5, "lime");
        g.ellipse(8, 5, 2.4, 2, "grnD");
        g.rect(3, 4, 1, 3, "grnD");
        g.rect(12, 4, 1, 3, "grnD");

        return finish(g, 3);

    }


    function decreto() {

        const g = grid(12, 14);

        g.rect(1, 1, 10, 12, "paper");
        g.rect(2, 3, 7, 1, "gryD");
        g.rect(2, 5, 8, 1, "gryD");
        g.rect(2, 7, 6, 1, "gryD");
        g.rect(2, 9, 8, 1, "gryD");
        g.rect(3, 11, 3, 1, "red");

        return finish(g, 3);

    }


    function petroleo() {

        const g = grid(12, 12);

        g.ellipse(6, 6, 5, 5, "oil");
        g.ellipse(4, 4, 1.5, 1.5, "oilL");
        g.set(8, 8, "pur");

        return finish(g, 3);

    }


    function textoRuido() {

        const g = grid(20, 12);

        g.rect(0, 0, 20, 12, "w");

        for (let y = 2; y < 11; y += 3) {

            for (let x = 2; x < 18; x += 1) {

                if (Math.random() < 0.7) {
                    g.set(x, y, Math.random() < 0.3 ? "pur" : "o");
                }

            }

        }

        return finish(g, 3);

    }


    function cucharada() {

        const g = grid(14, 14);

        g.ellipse(6, 6, 4.5, 3.4, "stlL");
        g.line(9, 8, 13, 13, "stlL", 2);
        g.ellipse(6, 5, 3.6, 2.4, "brn");
        g.set(5, 4, "brnD");

        return finish(g, 3);

    }


    function charco() {

        const g = grid(24, 10);

        g.ellipse(12, 5, 11, 4.5, "brn");
        g.ellipse(8, 4, 4, 2, "brnD");
        g.ellipse(16, 6, 3, 1.5, "brnL");

        return finish(g, 3);

    }


    function pasticho() {

        const g = grid(16, 12);

        g.rect(2, 4, 12, 6, "org");
        g.rect(2, 3, 12, 1, "yel");
        g.rect(2, 6, 12, 1, "red");
        g.rect(2, 8, 12, 1, "yel");
        g.rect(1, 10, 14, 1, "gryL");
        g.set(5, 2, "w");
        g.set(9, 2, "w");

        return finish(g, 3);

    }


    /* Objetos de suelo */

    function arepa() {

        const g = grid(16, 12);

        g.ellipse(8, 6, 7, 4.5, "tan");
        g.ellipse(8, 5, 6, 3, "paper");
        g.rect(3, 6, 10, 1, "grn");
        g.rect(4, 7, 8, 1, "yel");
        g.set(11, 4, "brnL");
        g.set(5, 4, "brnL");

        return finish(g, 3);

    }


    function cajaBalas() {

        const g = grid(14, 12);

        g.rect(1, 3, 12, 8, "brn");
        g.rect(1, 3, 12, 2, "brnL");

        for (let x = 3; x < 12; x += 2) {
            g.set(x, 6, "yel");
            g.set(x, 8, "yel");
        }

        return finish(g, 3);

    }


    function cajaCartuchos() {

        const g = grid(14, 12);

        g.rect(1, 2, 12, 9, "red");
        g.rect(1, 2, 12, 2, "redD");

        for (let x = 3; x < 12; x += 3) {
            g.rect(x, 5, 2, 5, "yel");
            g.set(x, 5, "org");
        }

        return finish(g, 3);

    }


    function cajaPastichos() {

        const g = grid(14, 12);

        g.rect(1, 2, 12, 9, "paper");
        g.rect(2, 4, 10, 5, "org");
        g.rect(2, 6, 10, 1, "red");
        P.text(g, 3, 9, "P", "o");

        return finish(g, 3);

    }


    function cajaCeldas() {

        const g = grid(14, 13);

        g.rect(1, 3, 12, 9, "blueD");
        g.rect(2, 2, 10, 2, "cyan");
        g.rect(3, 5, 8, 5, "blk");
        g.rect(4, 6, 2, 3, "blueL");
        g.rect(8, 6, 2, 3, "cyan");
        g.set(6, 4, "w");

        return finish(g, 3);

    }


    function armaSuelo(kind) {

        const g = grid(20, 10);

        if (kind === "escopeta") {

            g.rect(0, 4, 18, 2, "gryD");
            g.rect(0, 3, 12, 1, "stl");
            g.rect(12, 5, 7, 4, "wood");
            g.rect(4, 6, 5, 2, "wood");

        } else if (kind === "ametralladora") {

            g.rect(0, 3, 19, 3, "gryD");
            g.rect(0, 2, 8, 1, "stl");
            g.rect(6, 6, 5, 4, "gryD");
            g.rect(13, 6, 6, 3, "blk");
            g.rect(2, 5, 4, 1, "stl");

        } else if (kind === "riflepulso") {

            g.rect(0, 3, 19, 3, "blueD");
            g.rect(2, 2, 14, 1, "cyan");
            g.rect(10, 6, 6, 3, "blk");
            g.set(3, 4, "w");
            g.set(7, 4, "blueL");

        } else if (kind === "criopasticho") {

            g.rect(0, 3, 17, 4, "blueD");
            g.rect(2, 2, 13, 1, "blueL");
            g.ellipse(5, 5, 3, 3, "cyan");
            g.rect(12, 7, 8, 3, "gryD");

        } else if (kind === "rebotador") {

            g.rect(0, 3, 18, 3, "pur");
            g.rect(1, 2, 12, 1, "pink");
            g.rect(10, 6, 6, 4, "blk");
            g.set(4, 4, "cyan");
            g.set(7, 4, "w");

        } else {

            /* lanza-pasticho: tubo con bandeja */
            g.rect(0, 3, 16, 4, "red");
            g.rect(0, 2, 16, 1, "org");
            g.rect(12, 7, 8, 3, "gryD");
            g.rect(2, 4, 6, 2, "yel");

        }

        return finish(g, 3);

    }


    /* =========================================================
       ARMAS EN PRIMERA PERSONA (vista del jugador)
       ========================================================= */

    function armaMano(kind) {

        const g = grid(40, 36);

        if (kind === "pistola") {

            /* mano */
            g.rect(14, 22, 12, 14, "s");
            g.rect(14, 22, 12, 2, "S");

            /* pistola de píxeles */
            g.rect(16, 4, 8, 20, "gryD");
            g.rect(17, 2, 6, 4, "stl");
            g.rect(12, 16, 16, 6, "blk");
            g.rect(19, 0, 2, 3, "cyan");        /* mira */

        } else if (kind === "escopeta") {

            g.rect(12, 20, 16, 16, "wood");
            g.rect(12, 20, 16, 2, "woodD");

            g.rect(14, 0, 5, 22, "gryD");
            g.rect(21, 0, 5, 22, "gryD");
            g.rect(14, 0, 12, 2, "stl");
            g.rect(10, 22, 20, 6, "wood");
            g.rect(6, 26, 8, 10, "s");          /* mano en la bomba */

        } else if (kind === "ametralladora") {

            g.rect(8, 22, 24, 14, "blk");
            g.rect(8, 22, 24, 2, "gryD");

            for (let i = 0; i < 3; i += 1) {
                g.rect(11 + i * 7, 0, 4, 24, "gryD");
                g.rect(11 + i * 7, 0, 4, 2, "stl");
            }

            g.rect(6, 18, 28, 6, "stlD");
            g.rect(2, 24, 6, 12, "s");
            g.rect(32, 24, 6, 12, "s");

        } else if (kind === "riflepulso") {

            /* Rifle liviano de señal: riel cyan y celda visible. */
            g.rect(9, 20, 22, 16, "blueD");
            g.rect(11, 4, 18, 19, "blk");
            g.rect(13, 2, 14, 3, "cyan");
            g.rect(17, 6, 6, 13, "blueL");
            g.rect(19, 8, 2, 8, "w");
            g.rect(4, 26, 7, 10, "s");
            g.rect(29, 26, 7, 10, "s");

        } else if (kind === "criopasticho") {

            /* Cañón corto con cápsula de frío: comunica la salpicadura. */
            g.rect(8, 21, 24, 15, "blueD");
            g.rect(11, 3, 18, 20, "blueD");
            g.ellipse(20, 8, 6, 5, "cyan");
            g.ellipse(18, 7, 3, 3, "blueL");
            g.rect(4, 27, 7, 9, "s");
            g.rect(29, 27, 7, 9, "s");

        } else if (kind === "rebotador") {

            /* Tubo violeta con prisma: su munición rebota en las paredes. */
            g.rect(8, 21, 24, 15, "pur");
            g.rect(12, 2, 16, 21, "blk");
            g.rect(14, 3, 12, 3, "pink");
            g.ellipse(20, 10, 5, 5, "pur");
            g.ellipse(20, 10, 2, 2, "cyan");
            g.rect(4, 27, 7, 9, "s");
            g.rect(29, 27, 7, 9, "s");

        } else {

            /* lanza-pasticho: tubo rojo con bandeja humeante */
            g.rect(8, 20, 24, 16, "red");
            g.rect(8, 20, 24, 2, "redD");
            g.rect(12, 2, 16, 20, "red");
            g.rect(12, 2, 16, 2, "org");
            g.rect(14, 4, 12, 6, "org");
            g.rect(14, 6, 12, 1, "yel");
            g.rect(14, 8, 12, 1, "redD");
            g.set(17, 0, "w");
            g.set(23, 1, "w");
            g.rect(4, 26, 6, 10, "s");
            g.rect(30, 26, 6, 10, "s");

        }

        return finish(g, 3);

    }


    /* =========================================================
       DECORACIÓN DEL COMEDOR (sprites de pared/suelo)
       ========================================================= */

    function mesa() {

        const g = grid(24, 18);

        g.rect(1, 4, 22, 4, "wood");
        g.rect(1, 4, 22, 1, "brnL");
        g.rect(3, 8, 3, 10, "woodD");
        g.rect(18, 8, 3, 10, "woodD");
        g.rect(8, 2, 8, 3, "w");            /* plato */
        g.rect(10, 3, 4, 1, "brn");

        return finish(g, 3);

    }


    function escritorio() {

        const g = grid(24, 18);

        g.rect(1, 6, 22, 4, "gryD");
        g.rect(2, 10, 3, 8, "gryD");
        g.rect(19, 10, 3, 8, "gryD");
        g.rect(7, 0, 10, 7, "blk");
        g.rect(8, 1, 8, 5, "cyan");
        g.rect(9, 2, 4, 1, "w");

        return finish(g, 3);

    }


    function barril() {

        const g = grid(16, 22);

        g.rect(1, 1, 14, 20, "blk");
        g.rect(1, 4, 14, 1, "gryD");
        g.rect(1, 11, 14, 1, "gryD");
        g.rect(1, 18, 14, 1, "gryD");
        g.ellipse(8, 1, 7, 1.5, "gryD");
        g.rect(4, 7, 8, 3, "yel");

        return finish(g, 3);

    }


    /* =========================================================
       TEXTURAS DE PARED (64 x 64, pintadas en canvas)
       ========================================================= */

    const TEX = 64;

    function makeTex(draw) {

        const canvas = document.createElement("canvas");

        canvas.width = TEX;
        canvas.height = TEX;

        const c = canvas.getContext("2d");

        draw(c, TEX, TEX);

        return canvas;

    }


    function bricks(c, w, h, base, mortar, jitter) {

        c.fillStyle = mortar;
        c.fillRect(0, 0, w, h);

        const bh = 8;
        const bw = 16;

        for (let y = 0; y < h; y += bh) {

            const offset = (y / bh) % 2 === 0 ? 0 : bw / 2;

            for (let x = -bw; x < w; x += bw) {

                const t = (Math.random() - 0.5) * jitter;

                c.fillStyle = shade(base, t);
                c.fillRect(x + offset + 1, y + 1, bw - 2, bh - 2);

            }

        }

    }


    function shade(hex, delta) {

        const v = parseInt(hex.slice(1), 16);

        const r = Math.max(0, Math.min(255, ((v >> 16) & 255) + delta));
        const g = Math.max(0, Math.min(255, ((v >> 8) & 255) + delta));
        const b = Math.max(0, Math.min(255, (v & 255) + delta));

        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

    }


    function pixelSprite(c, sprite, x, y, scale) {

        P.draw(c, sprite, x, y, scale);

    }


    const TEXTURES = {

        panel: () => makeTex((c, w, h) => {

            c.fillStyle = "#2A3550";
            c.fillRect(0, 0, w, h);

            for (let y = 0; y < h; y += 16) {

                for (let x = 0; x < w; x += 16) {

                    c.fillStyle = shade("#34415F", (Math.random() - 0.5) * 20);
                    c.fillRect(x + 1, y + 1, 14, 14);
                    c.fillStyle = "#1B2438";
                    c.fillRect(x + 4, y + 12, 8, 1);

                }

            }

            /* cables */
            c.fillStyle = "#38BDF8";
            c.fillRect(0, 30, w, 2);
            c.fillStyle = "#F43F5E";
            c.fillRect(0, 34, w, 1);

        }),

        /* Barrera de señal de OPERACIÓN 404. Se usa como muro bajo control
           del mapa: la cuadrícula cian comunica cobertura tecnológica sin
           confundirla con la arquitectura propia de cada mundo. */
        escudo: () => makeTex((c, w, h) => {

            c.fillStyle = "#071A2B";
            c.fillRect(0, 0, w, h);

            c.fillStyle = "#123E5E";
            for (let y = 2; y < h; y += 10) {
                c.fillRect(0, y, w, 2);
            }

            c.fillStyle = "#22D3EE";
            for (let x = 4; x < w; x += 16) {
                c.fillRect(x, 0, 2, h);
            }

            c.fillStyle = "#BAE6FD";
            c.fillRect(0, 5, w, 2);
            c.fillRect(0, h - 7, w, 2);

            c.globalAlpha = 0.72;
            c.fillStyle = "#A78BFA";
            for (let x = -8; x < w; x += 20) {
                c.fillRect(x, 23, 12, 3);
                c.fillRect(x + 5, 42, 12, 3);
            }
            c.globalAlpha = 1;

        }),

        pizarra: () => makeTex((c, w, h) => {

            c.fillStyle = "#1F2937";
            c.fillRect(0, 0, w, h);
            c.fillStyle = "#0F172A";
            c.fillRect(6, 6, w - 12, h - 12);

            c.fillStyle = "#F5F7FF";

            for (let y = 12; y < h - 12; y += 6) {

                let x = 10;

                while (x < w - 12) {

                    const len = 3 + Math.floor(Math.random() * 8);

                    c.fillRect(x, y, Math.min(len, w - 12 - x), 2);
                    x += len + 3;

                }

            }

            c.fillStyle = "#F43F5E";
            c.fillRect(10, 20, 24, 2);

        }),

        bloque: () => makeTex((c, w, h) => {
            bricks(c, w, h, "#8A7A66", "#4A4038", 30);
        }),

        graffiti: () => makeTex((c, w, h) => {

            bricks(c, w, h, "#7A6A58", "#3E352E", 24);

            c.fillStyle = "#F43F5E";
            c.font = "bold 22px monospace";
            c.fillText("404", 6, 40);

            c.fillStyle = "#22D3EE";
            c.font = "bold 12px monospace";
            c.fillText("OK", 38, 56);

            c.fillStyle = "#FBBF24";
            c.fillRect(4, 8, 30, 3);

        }),

        marmol: () => makeTex((c, w, h) => {

            c.fillStyle = "#E7DDC7";
            c.fillRect(0, 0, w, h);

            c.strokeStyle = "#B8A98A";
            c.lineWidth = 1;

            for (let i = 0; i < 9; i += 1) {

                c.beginPath();
                c.moveTo(Math.random() * w, 0);
                c.lineTo(Math.random() * w, h);
                c.stroke();

            }

            c.fillStyle = "#C9A227";
            c.fillRect(0, 0, w, 4);
            c.fillRect(0, h - 4, w, 4);

        }),

        retrato: () => makeTex((c, w, h) => {

            c.fillStyle = "#E7DDC7";
            c.fillRect(0, 0, w, h);

            c.fillStyle = "#C9A227";
            c.fillRect(10, 6, 44, 52);
            c.fillStyle = "#7F1D1D";
            c.fillRect(13, 9, 38, 46);

            /* bigote con boina, retrato oficial */
            c.fillStyle = "#C98A5E";
            c.fillRect(24, 18, 16, 18);
            c.fillStyle = "#2B1B12";
            c.fillRect(24, 16, 16, 5);
            c.fillRect(26, 29, 12, 3);
            c.fillStyle = "#FACC15";
            c.fillRect(18, 38, 28, 4);
            c.fillStyle = "#1D4ED8";
            c.fillRect(18, 42, 28, 4);
            c.fillStyle = "#DC2626";
            c.fillRect(18, 46, 28, 4);

        }),

        acero: () => makeTex((c, w, h) => {

            c.fillStyle = "#3B3B45";
            c.fillRect(0, 0, w, h);

            for (let y = 0; y < h; y += 32) {

                for (let x = 0; x < w; x += 32) {

                    c.fillStyle = shade("#4A4A56", (Math.random() - 0.5) * 16);
                    c.fillRect(x + 2, y + 2, 28, 28);
                    c.fillStyle = "#9CA3AF";
                    c.fillRect(x + 4, y + 4, 2, 2);
                    c.fillRect(x + 26, y + 4, 2, 2);
                    c.fillRect(x + 4, y + 26, 2, 2);
                    c.fillRect(x + 26, y + 26, 2, 2);

                }

            }

        }),

        pdvsa: () => makeTex((c, w, h) => {

            c.fillStyle = "#3B3B45";
            c.fillRect(0, 0, w, h);

            c.fillStyle = "#DC2626";
            c.fillRect(6, 10, 52, 44);
            c.fillStyle = "#F5F7FF";
            c.font = "bold 13px monospace";
            c.fillText("PDVSA", 10, 36);
            c.fillStyle = "#0F0F14";
            c.fillRect(10, 42, 44, 6);
            c.fillStyle = "#FACC15";
            c.fillRect(10, 42, 22, 6);

        }),

        tuberia: () => makeTex((c, w, h) => {

            c.fillStyle = "#3B3B45";
            c.fillRect(0, 0, w, h);

            for (let x = 4; x < w; x += 20) {

                c.fillStyle = "#6B7280";
                c.fillRect(x, 0, 12, h);
                c.fillStyle = "#9CA3AF";
                c.fillRect(x + 2, 0, 3, h);
                c.fillStyle = "#374151";
                c.fillRect(x - 1, 14, 14, 4);
                c.fillRect(x - 1, 46, 14, 4);

            }

            c.fillStyle = "#0F0F14";
            c.fillRect(30, 40, 10, 24);

        }),

        papel: () => makeTex((c, w, h) => {

            c.fillStyle = "#D8C7E8";
            c.fillRect(0, 0, w, h);

            c.fillStyle = "#B79BD1";

            for (let y = 4; y < h; y += 16) {

                for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) {
                    c.fillRect(x + 2, y, 6, 6);
                    c.fillRect(x + 4, y - 2, 2, 2);
                }

            }

            c.fillStyle = "#6B5B7B";
            c.fillRect(0, h - 8, w, 8);

        }),

        cuadroV: () => makeTex((c, w, h) => {

            c.fillStyle = "#D8C7E8";
            c.fillRect(0, 0, w, h);

            c.fillStyle = "#6B5B7B";
            c.fillRect(12, 8, 40, 48);
            c.fillStyle = "#F5F7FF";
            c.fillRect(15, 11, 34, 42);

            c.lineWidth = 5;
            c.strokeStyle = "#FACC15";
            c.beginPath();
            c.moveTo(20, 16);
            c.lineTo(32, 48);
            c.stroke();
            c.strokeStyle = "#1D4ED8";
            c.beginPath();
            c.moveTo(26, 16);
            c.lineTo(32, 34);
            c.stroke();
            c.strokeStyle = "#DC2626";
            c.beginPath();
            c.moveTo(44, 16);
            c.lineTo(32, 48);
            c.stroke();

        }),

        puerta: () => makeTex((c, w, h) => {

            c.fillStyle = "#D8C7E8";
            c.fillRect(0, 0, w, h);

            c.fillStyle = "#5C3A17";
            c.fillRect(10, 4, 44, 60);
            c.fillStyle = "#8B5A2B";
            c.fillRect(14, 8, 36, 24);
            c.fillRect(14, 36, 36, 24);
            c.fillStyle = "#FACC15";
            c.fillRect(44, 34, 4, 4);

        }),

        azulejo: () => makeTex((c, w, h) => {

            c.fillStyle = "#E8DCC8";
            c.fillRect(0, 0, w, h);

            for (let y = 0; y < h; y += 16) {

                for (let x = 0; x < w; x += 16) {

                    const alt = ((x + y) / 16) % 2 === 0;

                    c.fillStyle = alt ? "#F5EBDD" : "#CFE0E8";
                    c.fillRect(x + 1, y + 1, 14, 14);

                    if (!alt) {
                        c.fillStyle = "#3B82F6";
                        c.fillRect(x + 6, y + 6, 4, 4);
                    }

                }

            }

        }),

        bandera: () => makeTex((c, w, h) => {

            c.fillStyle = "#E8DCC8";
            c.fillRect(0, 0, w, h);

            /* BANDERA DE ESPAÑA colgada */
            c.fillStyle = "#5C3A17";
            c.fillRect(6, 6, 52, 3);
            c.fillStyle = "#C60B1E";
            c.fillRect(8, 9, 48, 12);
            c.fillStyle = "#FFC400";
            c.fillRect(8, 21, 48, 22);
            c.fillStyle = "#C60B1E";
            c.fillRect(8, 43, 48, 12);
            c.fillStyle = "#AD1519";
            c.fillRect(18, 26, 8, 12);

        }),

        sagrada: () => makeTex((c, w, h) => {

            c.fillStyle = "#E8DCC8";
            c.fillRect(0, 0, w, h);

            /* cuadro de la SAGRADA FAMILIA */
            c.fillStyle = "#8B5A2B";
            c.fillRect(14, 10, 36, 44);
            c.fillStyle = "#87CEEB";
            c.fillRect(17, 13, 30, 38);

            c.fillStyle = "#9A8B7A";

            [[20, 30, 5, 21], [27, 22, 5, 29], [34, 26, 5, 25], [41, 32, 4, 19]]
                .forEach(([x, y, tw, th]) => {

                    c.fillRect(x, y, tw, th);
                    c.beginPath();
                    c.moveTo(x, y);
                    c.lineTo(x + tw / 2, y - 6);
                    c.lineTo(x + tw, y);
                    c.fill();

                });

            c.fillStyle = "#FACC15";
            c.fillRect(29, 16, 1, 5);
            c.fillRect(27, 18, 5, 1);

        })

    };


    /* =========================================================
       SALIDA
       ========================================================= */

    let cache = null;

    /** GORGOJO GIGANTE — el bicho que salió del arroz del CLAP.
        Escarabajo marrón del tamaño de un perro, con antenas
        temblorosas y unas mandíbulas que no auguran nada bueno. */
    function gorgojo(frame = 0) {

        const g = grid(34, 30);

        const cx = 16;
        const step = frame === 1 ? 1 : 0;

        /* patas (tres por lado, alternan con el frame) */
        for (let i = 0; i < 3; i += 1) {

            const px = cx - 9 + i * 9;
            const lift = (i % 2 === step) ? 1 : 0;

            g.line(px, 20, px - 5, 27 - lift, "brnD", 2);
            g.line(px + 2, 20, px + 7, 27 - (1 - lift), "brnD", 2);

        }

        /* abdomen: caparazón ovalado */
        g.ellipse(cx, 16, 12, 8, "brn");
        g.ellipse(cx, 17, 10, 6, "brnL");

        /* línea de separación de los élitros */
        g.rect(cx - 1, 10, 2, 14, "brnD");

        /* manchitas del caparazón */
        g.set(cx - 6, 14, "brnD");
        g.set(cx + 5, 15, "brnD");
        g.set(cx - 4, 20, "brnD");
        g.set(cx + 7, 19, "brnD");

        /* tórax y cabeza */
        g.ellipse(cx, 8, 7, 5, "brnD");
        g.ellipse(cx, 5, 5, 4, "blk");

        /* ojos rojos, muy poco amistosos */
        g.rect(cx - 3, 4, 2, 2, "redL");
        g.rect(cx + 2, 4, 2, 2, "redL");

        /* mandíbulas */
        g.line(cx - 4, 8, cx - 7, 11 + step, "stl", 2);
        g.line(cx + 4, 8, cx + 7, 11 - step, "stl", 2);

        /* antenas */
        g.line(cx - 3, 2, cx - 8, -2 + step, "brnD", 1);
        g.line(cx + 3, 2, cx + 8, -2 - step, "brnD", 1);

        return finish(g, 3);

    }


    /** DESIRE — aliada VIP de las salas secretas.

        Piel trigueña, pelo largo y liso con raya al medio que le cae
        por delante del hombro, vestido rojo entallado de tirantes con
        falda acampanada y tacones. Pose relajada y coqueta: peso en
        una cadera, una mano en la cintura y la otra jugando con un
        mechón. Nada de brazos en alto. */
    function desire(frame = 0) {

        const g = grid(42, 62);

        const cx = 20;

        /* Respiración suave: el frame 1 sube un pelo el torso */
        const lift = frame === 1 ? 1 : 0;

        /* La cadera carga a un lado: es lo que da la curva */
        const hip = 1;

        /* --- Piernas: una recta de apoyo, otra relajada --- */
        g.rect(cx - 5 + hip, 43, 4, 12, "s3");
        g.rect(cx + 2 + hip, 43, 4, 12, "s3");

        /* brillo que redondea la pierna */
        g.rect(cx - 5 + hip, 43, 1, 12, "s3L");
        g.rect(cx + 2 + hip, 43, 1, 12, "s3L");

        /* sombra interior */
        g.rect(cx - 1 + hip, 45, 1, 10, "S3");

        /* rodillas insinuadas */
        g.set(cx - 4 + hip, 48, "s3L");
        g.set(cx + 3 + hip, 48, "s3L");

        /* tacones negros */
        g.rect(cx - 6 + hip, 55, 5, 2, "blk");
        g.rect(cx + 2 + hip, 55, 5, 2, "blk");
        g.set(cx - 6 + hip, 57, "blk");
        g.set(cx + 6 + hip, 57, "blk");

        /* --- Falda acampanada, ladeada por la cadera --- */
        g.rect(cx - 6 + hip, 32, 12, 3, "red");
        g.rect(cx - 8 + hip, 35, 16, 3, "red");
        g.rect(cx - 10 + hip, 38, 20, 4, "red");

        /* pliegues verticales */
        g.rect(cx - 6 + hip, 36, 1, 6, "redD");
        g.rect(cx - 1 + hip, 35, 1, 7, "redD");
        g.rect(cx + 4 + hip, 36, 1, 6, "redD");

        /* brillo de la tela */
        g.rect(cx - 4 + hip, 36, 2, 5, "redL");

        /* dobladillo */
        g.rect(cx - 10 + hip, 41, 20, 1, "redD");
        g.set(cx - 11 + hip, 40, "red");
        g.set(cx + 10 + hip, 40, "red");

        /* --- Cintura: el punto más estrecho --- */
        g.rect(cx - 3, 29 - lift, 6, 4, "red");
        g.rect(cx - 4, 30 - lift, 1, 3, "redD");
        g.rect(cx + 3, 30 - lift, 1, 3, "redD");

        /* cinturón fino negro */
        g.rect(cx - 4, 29 - lift, 8, 1, "blk");

        /* --- Corpiño: se abre en el pecho y cierra en la cintura --- */
        g.rect(cx - 6, 21 - lift, 12, 5, "red");
        g.rect(cx - 5, 26 - lift, 10, 3, "red");

        /* sombra lateral */
        g.rect(cx - 6, 21 - lift, 1, 5, "redD");
        g.rect(cx + 5, 21 - lift, 1, 5, "redD");
        g.rect(cx - 5, 26 - lift, 1, 3, "redD");
        g.rect(cx + 4, 26 - lift, 1, 3, "redD");

        /* brillo central */
        g.rect(cx - 3, 23 - lift, 2, 4, "redL");

        /* escote recto y tirantes finos */
        g.rect(cx - 4, 20 - lift, 8, 1, "red");
        g.rect(cx - 5, 18 - lift, 1, 3, "red");
        g.rect(cx + 4, 18 - lift, 1, 3, "red");

        /* piel del pecho y hombros */
        g.rect(cx - 3, 18 - lift, 6, 2, "s3");
        g.rect(cx - 7, 19 - lift, 2, 3, "s3");
        g.rect(cx + 6, 19 - lift, 2, 3, "s3");
        g.set(cx - 7, 19 - lift, "s3L");
        g.set(cx + 7, 19 - lift, "s3L");

        /* clavículas */
        g.set(cx - 2, 19 - lift, "S3");
        g.set(cx + 2, 19 - lift, "S3");

        /* --- Melena lisa: la coronilla es redonda, no un ladrillo --- */
        g.ellipse(cx, 9, 9.5, 8, "h");
        g.rect(cx - 9, 9, 18, 10, "h");

        /* cae recta por la espalda, más larga del lado del hombro */
        g.rect(cx - 10, 12, 4, 18, "h");
        g.rect(cx + 7, 12, 4, 14, "h");

        /* puntas en pico */
        g.rect(cx - 10, 30, 3, 3, "h");
        g.rect(cx + 8, 26, 3, 3, "h");
        g.set(cx - 9, 33, "h");
        g.set(cx + 9, 29, "h");

        /* brillo liso continuo */
        g.rect(cx - 8, 8, 2, 9, "brnL");
        g.rect(cx + 7, 9, 1, 7, "brnL");

        /* --- Brazo izquierdo: mano en la cintura --- */
        g.line(cx - 7, 22 - lift, cx - 11, 27 - lift, "s3", 3);
        g.line(cx - 11, 27 - lift, cx - 6, 31 - lift, "s3", 3);

        /* la mano apoyada */
        g.rect(cx - 6, 30 - lift, 3, 2, "s3");

        /* --- Brazo derecho: cae relajado a lo largo del cuerpo --- */
        g.line(cx + 7, 21 - lift, cx + 9, 27 - lift, "s3", 3);
        g.line(cx + 9, 27 - lift, cx + 10, 33 - lift, "s3", 3);

        /* brillo del brazo */
        g.set(cx + 8, 23 - lift, "s3L");
        g.set(cx + 9, 28 - lift, "s3L");

        /* mano abierta, dedos sueltos */
        g.rect(cx + 9, 33 - lift, 3, 3, "s3");
        g.set(cx + 9, 36 - lift, "s3");
        g.set(cx + 11, 36 - lift, "s3");

        /* uñas rojas */
        g.set(cx + 9, 37 - lift, "redL");
        g.set(cx + 11, 37 - lift, "redL");

        /* --- Cuello --- */
        g.rect(cx - 2, 16 - lift, 4, 3, "s3");
        g.rect(cx - 2, 16 - lift, 1, 3, "S3");

        /* --- Cara --- */
        g.ellipse(cx, 12, 5.4, 6.4, "s3");

        /* frente y mentón afinado: óvalo, no bola */
        g.set(cx - 4, 8, "s3");
        g.set(cx + 4, 8, "s3");
        g.rect(cx - 1, 17, 3, 1, "s3");
        g.set(cx - 2, 17, "S3");
        g.set(cx + 2, 17, "S3");

        /* pómulos altos */
        g.set(cx - 5, 12, "s3L");
        g.set(cx + 5, 12, "s3L");
        g.set(cx - 5, 14, "S3");
        g.set(cx + 5, 14, "S3");

        /* rubor suave */
        g.set(cx - 4, 13, "brnL");
        g.set(cx + 4, 13, "brnL");

        /* mechones lisos por delante, raya al medio */
        g.rect(cx - 6, 6, 5, 2, "h");
        g.rect(cx + 2, 6, 5, 2, "h");
        g.rect(cx - 7, 7, 2, 10, "h");
        g.rect(cx + 6, 7, 2, 8, "h");
        g.set(cx, 6, "S3");

        /* --- Ojos: pequeños y almendrados --- */

        /* blanco justo de 2px */
        g.rect(cx - 4, 11, 2, 1, "w");
        g.rect(cx + 3, 11, 2, 1, "w");

        /* iris ámbar */
        g.set(cx - 3, 11, "brnL");
        g.set(cx + 3, 11, "brnL");

        /* delineado superior que los almendra */
        g.rect(cx - 4, 10, 2, 1, "e");
        g.rect(cx + 3, 10, 2, 1, "e");

        /* rabillo hacia fuera */
        g.set(cx - 5, 10, "e");
        g.set(cx + 5, 10, "e");

        /* cejas finas y arqueadas */
        g.rect(cx - 4, 8, 2, 1, "h");
        g.set(cx - 2, 7, "h");
        g.rect(cx + 3, 8, 2, 1, "h");
        g.set(cx + 2, 7, "h");

        /* nariz mínima */
        g.set(cx, 13, "S3");

        /* --- Labios: pequeños y definidos --- */
        g.rect(cx - 1, 15, 3, 1, "red");
        g.set(cx, 16, "redD");
        g.set(cx - 1, 14, "redL");

        /* lunar coqueto, junto al labio */
        g.set(cx + 2, 16, "S3");

        return finish(g, 3);

    }


    /** DAVINCHI — aliado frontal de las salas secretas.
        Joven de rizos oscuros, lentes de sol, chaqueta de
        camuflaje y sonrisa de quien ya lo vio todo. */
    function davinchi(frame = 0) {

        const g = grid(34, 46);

        const cx = 16;
        const step = frame === 1 ? 1 : 0;

        /* piernas: pantalón deportivo oscuro */
        g.rect(cx - 5, 33, 4, 9, "gryD");
        g.rect(cx + 1, 33, 4, 9, "gryD");
        g.rect(cx - 5, 33, 1, 9, "w");     /* franja deportiva */
        g.rect(cx + 5, 33, 1, 9, "w");
        g.rect(cx - 6, 42, 5, 2, "w");
        g.rect(cx + 1, 42, 5, 2, "w");

        /* chaqueta de camuflaje */
        g.rect(cx - 8, 18, 16, 16, "grnD");

        /* manchas del camuflaje */
        const spots = [
            [-6, 20], [-2, 19], [3, 22], [-5, 26],
            [1, 27], [5, 25], [-3, 31], [4, 30], [-7, 29]
        ];

        spots.forEach((spot, i) => {

            const tone = i % 3 === 0 ? "grn" : (i % 3 === 1 ? "brnD" : "lime");

            g.rect(cx + spot[0], spot[1], 3, 2, tone);

        });

        /* camiseta negra bajo la chaqueta */
        g.rect(cx - 2, 18, 4, 14, "blk");

        /* brazos cruzados: postura de "ya sé lo que hay" */
        g.line(cx - 8, 24 + step, cx + 6, 27, "grnD", 4);
        g.line(cx + 8, 24 - step, cx - 6, 28, "grn", 4);
        g.rect(cx + 5, 25, 3, 3, "s2");
        g.rect(cx - 7, 26, 3, 3, "s2");

        /* cuello */
        g.rect(cx - 2, 15, 4, 3, "s2");

        /* cabeza */
        g.ellipse(cx, 11, 5.2, 6, "s2");

        /* rizos oscuros */
        g.ellipse(cx, 6, 6.5, 4, "h");
        g.set(cx - 6, 7, "h");
        g.set(cx + 6, 7, "h");
        g.set(cx - 5, 4, "h");
        g.set(cx + 5, 4, "h");
        g.set(cx - 2, 3, "h");
        g.set(cx + 2, 3, "h");

        /* lentes de sol oscuros */
        g.rect(cx - 5, 9, 4, 3, "blk");
        g.rect(cx + 1, 9, 4, 3, "blk");
        g.rect(cx - 1, 10, 2, 1, "blk");
        g.set(cx - 4, 9, "cyan");          /* reflejo */
        g.set(cx + 2, 9, "cyan");

        /* sonrisa ladeada */
        g.rect(cx - 2, 14, 4, 1, "m");
        g.set(cx + 2, 13, "m");

        return finish(g, 3);

    }


    /** SIL — contacto secreto de red.
        Fallback completo para conexiones lentas: sentada sobre un maletín,
        con chaqueta violeta, pelo oscuro y un terminal cifrado. El PNG
        recortado ocupa el mundo normalmente; este sprite evita que el
        encuentro desaparezca si el asset externo aún está decodificando. */
    function sil(frame = 0) {

        const g = grid(42, 52);
        const cx = 19;
        const sway = frame === 1 ? 1 : 0;

        /* Maletín / reserva recuperada que hace legible el rol de Sil. */
        g.rect(cx - 12, 39, 23, 8, "gryD");
        g.rect(cx - 11, 40, 21, 5, "blk");
        g.rect(cx - 3, 38, 6, 2, "stl");
        g.rect(cx - 9, 42, 17, 1, "cyan");
        g.set(cx + 8, 45, "org");

        /* Piernas en pose sentada: una baja y la otra recoge la rodilla. */
        g.line(cx - 2, 33, cx + 11, 39 + sway, "blueD", 5);
        g.line(cx + 11, 39 + sway, cx + 15, 45, "blueD", 4);
        g.line(cx - 4, 34, cx - 10, 42 - sway, "blue", 5);
        g.rect(cx + 13, 45, 6, 2, "blk");
        g.rect(cx - 13, 41 - sway, 6, 2, "blk");

        /* Chaqueta amplia con banda naranja de seguridad. */
        g.rect(cx - 8, 20, 16, 15, "pur");
        g.rect(cx - 7, 21, 2, 13, "blueL");
        g.rect(cx + 5, 21, 2, 13, "blueD");
        g.rect(cx - 7, 29, 14, 2, "org");
        g.rect(cx - 2, 21, 4, 13, "blk");

        /* Terminal apoyado en las piernas, con una señal que parpadea. */
        g.rect(cx - 11, 31 + sway, 14, 7, "gryD");
        g.rect(cx - 10, 32 + sway, 12, 4, "cyan");
        g.set(cx - 8, 33 + sway, "w");
        g.set(cx - 5, 34 + sway, frame === 1 ? "org" : "grnN");
        g.rect(cx - 12, 38 + sway, 16, 1, "stl");

        /* Brazos hacia el teclado, en vez de una pose de combate. */
        g.line(cx - 8, 23, cx - 10, 32 + sway, "pur", 3);
        g.line(cx + 8, 23, cx + 3, 31 + sway, "pur", 3);
        g.rect(cx - 11, 32 + sway, 3, 2, "s3");
        g.rect(cx + 1, 31 + sway, 3, 2, "s3");

        /* Cuello, rostro y melena. */
        g.rect(cx - 2, 17, 4, 4, "s3");
        g.ellipse(cx, 12, 5.6, 6.3, "s3");
        g.ellipse(cx, 7, 7, 4, "h");
        g.rect(cx - 7, 8, 3, 13, "h");
        g.rect(cx + 4, 8, 3, 15, "h");
        g.set(cx - 5, 19, "brnL");
        g.set(cx + 5, 20, "brnL");
        g.rect(cx - 5, 7, 10, 2, "h");
        g.set(cx, 6, "S3");

        /* Mirada alerta y auricular de radio. */
        g.rect(cx - 4, 11, 2, 1, "w");
        g.rect(cx + 3, 11, 2, 1, "w");
        g.set(cx - 3, 11, "cyan");
        g.set(cx + 3, 11, "cyan");
        g.rect(cx - 4, 9, 2, 1, "h");
        g.rect(cx + 3, 9, 2, 1, "h");
        g.rect(cx - 1, 15, 3, 1, "m");
        g.line(cx + 6, 10, cx + 8, 15, "stl", 1);
        g.set(cx + 8, 16, "org");

        return finish(g, 3);

    }


    /* Sprites compactos de campo para el Companion VIP. Acompañan dentro
       del mapa y nunca sustituyen los PNG de cuerpo completo que se usan
       en diálogos y encuentros principales. */
    function companionMini(id, frame = 0, mood = "follow") {

        const g = grid(24, 30);
        const cx = 11;
        const step = frame % 2 ? 1 : 0;
        const profiles = {
            rog: { shirt: "blueD", accent: "cyan", skin: "s", hair: "h" },
            desire: { shirt: "red", accent: "pink", skin: "s3", hair: "h" },
            davinchi: { shirt: "grnD", accent: "lime", skin: "s2", hair: "h" },
            sil: { shirt: "pur", accent: "cyan", skin: "s3", hair: "h" },
            colinas: { shirt: "brn", accent: "gold", skin: "s", hair: "hg" }
        };
        const profile = profiles[id] || profiles.rog;
        const armsUp = mood === "cheer" || mood === "danger";
        const glow = mood === "support" || mood === "focus";

        /* sombra cromática / aura de apoyo */
        if (glow) {
            g.ellipse(cx, 25, 10, 2, mood === "focus" ? "yel" : profile.accent);
            g.set(cx - 9, 13, profile.accent);
            g.set(cx + 9, 13, profile.accent);
        }

        /* piernas caminantes */
        g.rect(cx - 5, 20 + step, 4, 7 - step, "gryD");
        g.rect(cx + 1, 20, 4, 7 - step, "gryD");
        g.rect(cx - 6, 27, 5, 2, "blk");
        g.rect(cx + 1, 27 - step, 5, 2, "blk");

        /* cuerpo y placa / detalle individual */
        g.rect(cx - 7, 13, 14, 9, profile.shirt);
        g.rect(cx - 6, 14, 2, 7, profile.accent);
        g.rect(cx + 4, 14, 2, 7, id === "colinas" ? "gold" : "blk");
        g.rect(cx - 1, 16, 3, 3, "w");

        if (armsUp) {
            g.line(cx - 7, 15, cx - 10, 8, profile.shirt, 3);
            g.line(cx + 7, 15, cx + 10, 8, profile.shirt, 3);
            g.set(cx - 10, 7, profile.skin);
            g.set(cx + 10, 7, profile.skin);
        } else {
            g.line(cx - 7, 15, cx - 9, 21, profile.shirt, 3);
            g.line(cx + 7, 15, cx + 9, 21, profile.shirt, 3);
        }

        /* cara y peinado reconocible por color/silueta */
        g.ellipse(cx, 8, 5.5, 5.8, profile.skin);
        g.ellipse(cx, 4, 6.4, 3.1, profile.hair);
        g.rect(cx - 6, 5, 2, id === "desire" || id === "sil" ? 8 : 4, profile.hair);
        g.rect(cx + 4, 5, 2, id === "desire" || id === "sil" ? 7 : 4, profile.hair);

        if (id === "rog") {
            g.rect(cx - 5, 8, 4, 2, "blk");
            g.rect(cx + 1, 8, 4, 2, "blk");
            g.set(cx - 3, 8, "cyan");
            g.set(cx + 2, 8, "cyan");
        } else if (id === "davinchi") {
            g.rect(cx - 5, 8, 4, 2, "blk");
            g.rect(cx + 1, 8, 4, 2, "blk");
            g.set(cx - 3, 8, "lime");
            g.set(cx + 2, 8, "lime");
        } else if (id === "colinas") {
            g.rect(cx - 6, 5, 12, 2, "gold");
            g.set(cx - 5, 7, "gold");
            g.set(cx + 5, 7, "gold");
            g.rect(cx - 4, 9, 3, 1, "blk");
            g.rect(cx + 2, 9, 3, 1, "blk");
        } else {
            g.rect(cx - 3, 9, 2, 1, "w");
            g.rect(cx + 2, 9, 2, 1, "w");
            g.set(cx - 2, 9, mood === "danger" ? "red" : profile.accent);
            g.set(cx + 2, 9, mood === "danger" ? "red" : profile.accent);
        }

        g.rect(cx - 1, 11, 3, 1, mood === "cheer" ? "m" : "S");

        /* Reacciones visibles sin generar DOM extra. */
        if (mood === "danger") {
            g.rect(cx - 1, 0, 3, 4, "red");
            g.set(cx, 5, "red");
        } else if (mood === "cheer") {
            g.set(cx - 4, 1, "yel");
            g.set(cx + 4, 1, "yel");
        } else if (mood === "focus") {
            g.rect(cx - 3, 0, 7, 1, "yel");
        }

        return finish(g, 3);

    }


    /** BOLSA DEL CLAP — bolsa de plástico con la caja ciega dentro.
        Nadie sabe qué trae hasta que la abre, y esa es la tragedia. */
    /* Marcador de transmisión: mientras un PNG externo se decodifica no
       mostramos la silueta procedural antigua. Esta baliza es una lectura
       diegética de señal incompleta, no un reemplazo de ningún enemigo. */
    function assetSignal(frame = 0) {

        const g = grid(30, 44);
        const pulse = frame ? "pink" : "cyan";

        g.frame(4, 2, 22, 38, "stl");
        g.rect(6, 5, 18, 5, "blk");
        g.rect(8, 7, 14, 1, pulse);
        g.rect(7, 13, 16, 12, "blk");
        g.rect(9, 15, 12, 2, "pur");
        g.rect(9, 19, 8, 2, pulse);
        g.rect(9, 23, 11, 1, "stlL");
        g.rect(7, 29, 16, 6, "blk");
        g.rect(9, 31, 12, 2, pulse);
        g.rect(12, 40, 6, 2, "stl");

        return finish(g, 3);

    }


    function bolsaClap() {

        const g = grid(24, 26);

        const cx = 11;

        /* cuerpo de la bolsa, blanco sucio y abultado */
        g.rect(cx - 8, 8, 17, 16, "gryL");
        g.rect(cx - 8, 20, 17, 4, "gry");

        /* bultos del contenido */
        g.ellipse(cx - 3, 15, 3, 3, "w");
        g.ellipse(cx + 4, 17, 3, 2.5, "w");

        /* asas */
        g.line(cx - 6, 8, cx - 4, 2, "gryL", 2);
        g.line(cx + 6, 8, cx + 4, 2, "gryL", 2);
        g.line(cx - 4, 2, cx + 4, 2, "gryL", 2);

        /* franja tricolor y las siglas */
        g.rect(cx - 8, 11, 17, 1, "yel");
        g.rect(cx - 8, 12, 17, 1, "blue");
        g.rect(cx - 8, 13, 17, 1, "red");

        P.text(g, cx - 6, 16, "CLAP", "blk");

        /* remiendo de cinta: ya viene medio rota */
        g.rect(cx + 2, 21, 4, 1, "brnD");

        return finish(g, 3);

    }


    function build() {

        if (cache) {
            return cache;
        }

        cache = {

            enemies: {
                gorgojo: [gorgojo(0), gorgojo(1)],
                chavista: [chavista(0), chavista(1)],
                usuario: [usuario(0, 0), usuario(1, 0)],
                usuario2: [usuario(0, 1), usuario(1, 1)],
                usuario3: [usuario(0, 2), usuario(1, 2)],
                malandro: [malandro(0), malandro(1)],
                calidad: [calidad(0, 0), calidad(1, 0)],
                calidad2: [calidad(0, 1), calidad(1, 1)],
                motorizado: [motorizado(0), motorizado(1)],
                burocrata: [burocrata(0), burocrata(1)],
                colectivo: [colectivo(0), colectivo(1)],
                supervisor: [supervisor(0), supervisor(1)],
                jefeBarrio: [jefeBarrio(0), jefeBarrio(1)],
                maduro: [maduro(), maduro()],
                chavez: [chavez(), chavez()],
                manguangua: [manguangua(), manguangua()],
                srm: [srm(), srm()]
            },

            allies: {
                desire: [desire(0), desire(1)],
                davinchi: [davinchi(0), davinchi(1)],
                sil: [sil(0), sil(1)]
            },

            /* La mascota de campo se resuelve enteramente en canvas. Cada
               estado tiene dos pasos para que siga al jugador de verdad. */
            companions: ["rog", "desire", "davinchi", "sil", "colinas"].reduce((out, id) => {
                out[id] = ["follow", "danger", "cheer", "support", "focus"].reduce((moods, mood) => {
                    moods[mood] = [companionMini(id, 0, mood), companionMini(id, 1, mood)];
                    return moods;
                }, {});
                return out;
            }, {}),

            shots: {
                bala: bala(),
                decreto: decreto(),
                petroleo: petroleo(),
                texto: textoRuido(),
                cucharada: cucharada(),
                pasticho: pasticho(),
                pulso: pulso(),
                crio: crio(),
                rebote: rebote(),
                planilla: planilla(),
                sello: sello()
            },

            money: {
                moneda: [moneda(0), moneda(1), moneda(2), moneda(3)],
                billete: billete()
            },

            /* Se alterna muy sutilmente para indicar que el arte definitivo
               está llegando, sin volver a dibujar la silueta anterior. */
            pendingEnemy: [assetSignal(0), assetSignal(1)],

            items: {
                arepa: arepa(),
                clap: bolsaClap(),
                balas: cajaBalas(),
                cartuchos: cajaCartuchos(),
                pastichos: cajaPastichos(),
                celdas: cajaCeldas(),
                escopeta: armaSuelo("escopeta"),
                ametralladora: armaSuelo("ametralladora"),
                lanzapasticho: armaSuelo("lanzapasticho"),
                riflepulso: armaSuelo("riflepulso"),
                criopasticho: armaSuelo("criopasticho"),
                rebotador: armaSuelo("rebotador")
            },

            hands: {
                pistola: armaMano("pistola"),
                escopeta: armaMano("escopeta"),
                ametralladora: armaMano("ametralladora"),
                lanzapasticho: armaMano("lanzapasticho"),
                riflepulso: armaMano("riflepulso"),
                criopasticho: armaMano("criopasticho"),
                rebotador: armaMano("rebotador")
            },

            props: {
                mesa: mesa(),
                escritorio: escritorio(),
                barril: barril(),
                charco: charco()
            },

            textures: Object.keys(TEXTURES).reduce((out, key) => {
                out[key] = TEXTURES[key]();
                return out;
            }, {})

        };

        return cache;

    }


    A.op404 = A.op404 || {};

    A.op404.sprites = build;

    A.op404.TEX_SIZE = TEX;

})(window.Arcade404);
