/* =========================================================
   ARCADE 404 — PIXEL ART
   Sprites dibujados a mano, píxel a píxel, sobre una rejilla
   lógica. Se pueden pintar en un <canvas> (ctx.fillRect) o
   exportar a SVG (rectángulos por tramos) para el DOM.

   Personaje estrella: EL GORDO — un español regordete con
   lentes y boina que te manda a comer mierda con cuchara.
   ========================================================= */

(function (A) {

    "use strict";


    /* ---------------------------------------------------------
       PALETA
       --------------------------------------------------------- */

    const PALETTE = {

        o: "#160A12",   /* contorno            */
        s: "#F2C197",   /* piel                */
        S: "#CE9257",   /* piel en sombra      */
        b: "#C0392B",   /* boina               */
        B: "#7C1D15",   /* boina en sombra     */
        h: "#3A2418",   /* pelo                */
        g: "#22D3EE",   /* lentes (neón)       */
        l: "#08222C",   /* cristal             */
        e: "#0B0D14",   /* pupila              */
        n: "#C9855A",   /* nariz               */
        m: "#5C1220",   /* boca                */
        t: "#F5F7FF",   /* dientes             */
        w: "#E3EAF6",   /* camisa              */
        W: "#9FB0CC",   /* camisa en sombra    */
        p: "#242E4B",   /* pantalón            */
        c: "#D9E7F2",   /* cuchara             */
        C: "#90A7BE",   /* cuchara en sombra   */
        d: "#7A4A22",   /* mierda              */
        D: "#53300F"    /* mierda en sombra    */

    };


    /* ---------------------------------------------------------
       REJILLA — primitivas de dibujo en píxeles
       --------------------------------------------------------- */

    function makeGrid(width, height, palette = null) {

        const data = [];

        /* Si hay paleta, cada clave ("o", "s"...) se traduce a su
           color real al recortar: así el sprite se puede pintar
           directamente en canvas o SVG. */
        const resolve = (value) => (
            palette && value && palette[value] ? palette[value] : value
        );

        for (let y = 0; y < height; y += 1) {
            data.push(new Array(width).fill(null));
        }

        const api = {

            width,
            height,
            data,

            set(x, y, color) {

                const px = Math.round(x);
                const py = Math.round(y);

                if (px < 0 || py < 0 || px >= width || py >= height) {
                    return api;
                }

                data[py][px] = color;

                return api;

            },


            rect(x, y, w, h, color) {

                for (let row = 0; row < h; row += 1) {
                    for (let col = 0; col < w; col += 1) {
                        api.set(x + col, y + row, color);
                    }
                }

                return api;

            },


            frame(x, y, w, h, color) {

                for (let col = 0; col < w; col += 1) {
                    api.set(x + col, y, color);
                    api.set(x + col, y + h - 1, color);
                }

                for (let row = 0; row < h; row += 1) {
                    api.set(x, y + row, color);
                    api.set(x + w - 1, y + row, color);
                }

                return api;

            },


            ellipse(cx, cy, rx, ry, color) {

                for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {

                    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {

                        const dx = (x + 0.5 - cx) / rx;
                        const dy = (y + 0.5 - cy) / ry;

                        if (dx * dx + dy * dy <= 1) {
                            api.set(x, y, color);
                        }

                    }

                }

                return api;

            },


            /** Línea gruesa (pincel cuadrado) */
            line(x0, y0, x1, y1, color, thickness = 1) {

                const steps = Math.max(
                    Math.abs(x1 - x0),
                    Math.abs(y1 - y0)
                ) * 2 + 1;

                const half = Math.floor((thickness - 1) / 2);

                for (let i = 0; i <= steps; i += 1) {

                    const t = steps === 0 ? 0 : i / steps;

                    const x = Math.round(x0 + (x1 - x0) * t);
                    const y = Math.round(y0 + (y1 - y0) * t);

                    for (let dy = -half; dy <= thickness - 1 - half; dy += 1) {
                        for (let dx = -half; dx <= thickness - 1 - half; dx += 1) {
                            api.set(x + dx, y + dy, color);
                        }
                    }

                }

                return api;

            },


            /** Contorno exterior automático */
            outline(color) {

                const add = [];

                for (let y = 0; y < height; y += 1) {

                    for (let x = 0; x < width; x += 1) {

                        if (data[y][x]) {
                            continue;
                        }

                        const neighbours = [
                            [x - 1, y], [x + 1, y],
                            [x, y - 1], [x, y + 1]
                        ];

                        const touches = neighbours.some(([nx, ny]) => {

                            if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
                                return false;
                            }

                            return Boolean(data[ny][nx]);

                        });

                        if (touches) {
                            add.push([x, y]);
                        }

                    }

                }

                add.forEach(([x, y]) => {
                    data[y][x] = color;
                });

                return api;

            },


            /** Recorta todo el sprite N píxeles (para el contorno) */
            crop() {

                let minX = width;
                let minY = height;
                let maxX = -1;
                let maxY = -1;

                for (let y = 0; y < height; y += 1) {

                    for (let x = 0; x < width; x += 1) {

                        if (!data[y][x]) {
                            continue;
                        }

                        if (x < minX) { minX = x; }
                        if (y < minY) { minY = y; }
                        if (x > maxX) { maxX = x; }
                        if (y > maxY) { maxY = y; }

                    }

                }

                if (maxX < 0) {
                    return { width: 0, height: 0, data: [] };
                }

                const out = [];

                for (let y = minY; y <= maxY; y += 1) {
                    out.push(data[y].slice(minX, maxX + 1).map(resolve));
                }

                return {
                    width: maxX - minX + 1,
                    height: maxY - minY + 1,
                    data: out
                };

            }

        };

        return api;

    }


    /* ---------------------------------------------------------
       EL GORDO
       Español regordete, boina, lentes, cuchara en alto.
       Rejilla de trabajo: 32 x 32.
       --------------------------------------------------------- */

    function buildGordo() {

        const g = makeGrid(32, 32, PALETTE);

        /* --- Cuerpo regordete (detrás de todo) --- */
        g.ellipse(13, 25, 10, 6, "w");
        g.ellipse(13, 26, 6.5, 4.2, "W");
        g.rect(4, 29, 18, 2, "p");

        /* --- Brazo izquierdo (caído) --- */
        g.line(4, 23, 2, 28, "w", 3);
        g.ellipse(2, 29, 1.8, 1.8, "s");

        /* --- Brazo derecho (en alto, sujetando la cuchara) --- */
        g.line(21, 23, 26, 17, "w", 3);
        g.ellipse(26.5, 16, 2, 2, "s");

        /* --- Melena / halo oscuro detrás de la cara --- */
        g.ellipse(13, 13, 9.6, 8.6, "h");

        /* --- Cabeza (regordeta) y orejas --- */
        g.ellipse(13, 13, 8.4, 7.4, "s");
        g.ellipse(3.6, 13.5, 1.7, 2.3, "s");
        g.ellipse(22.4, 13.5, 1.7, 2.3, "s");

        /* --- Patillas --- */
        g.rect(5, 12, 2, 5, "h");
        g.rect(20, 12, 2, 5, "h");

        /* --- Papada y mejillas --- */
        g.rect(8, 20, 11, 1, "S");
        g.rect(6, 16, 2, 2, "S");
        g.rect(19, 16, 2, 2, "S");

        /* --- Cejas --- */
        g.rect(6, 10, 6, 1, "h");
        g.rect(15, 10, 6, 1, "h");

        /* --- Lentes (neón) --- */
        g.rect(6, 11, 6, 5, "l");
        g.frame(6, 11, 6, 5, "g");

        g.rect(15, 11, 6, 5, "l");
        g.frame(15, 11, 6, 5, "g");

        g.rect(12, 12, 3, 1, "g");
        g.set(5, 11, "g");
        g.set(21, 11, "g");

        /* --- Pupilas --- */
        g.rect(8, 13, 2, 2, "e");
        g.rect(17, 13, 2, 2, "e");

        /* --- Nariz --- */
        g.rect(12, 16, 3, 2, "n");

        /* --- Boca abierta: berreando --- */
        g.rect(9, 18, 9, 3, "m");
        g.rect(9, 18, 9, 1, "t");
        g.rect(11, 17, 4, 1, "m");

        /* --- Cuchara --- */
        g.line(26, 15, 28, 8, "c", 1);

        g.ellipse(28, 6, 3, 2.4, "c");
        g.ellipse(28, 6, 2, 1.5, "C");

        /* --- Lo que hay en la cuchara --- */
        g.ellipse(28, 5, 2.2, 1.6, "d");
        g.ellipse(27.4, 4.5, 1.2, 0.9, "D");

        /* --- Boina (encima de todo) --- */
        g.ellipse(13, 5, 9.6, 4, "b");
        g.rect(3, 7, 20, 2, "B");
        g.set(12, 1, "B");
        g.set(13, 2, "B");

        /* --- Contorno --- */
        g.outline("o");

        return g.crop();

    }


    const GORDO = buildGordo();


    /* ---------------------------------------------------------
       FUENTE 3 x 5 — para rótulos dentro de los sprites
       --------------------------------------------------------- */

    const FONT = {
        A: "010101111101101", B: "110101110101110", C: "011100100100011",
        D: "110101101101110", E: "111100110100111", F: "111100110100100",
        G: "011100101101011", H: "101101111101101", I: "111010010010111",
        J: "001001001101010", K: "101101110101101", L: "100100100100111",
        M: "101111111101101", N: "110101101101101", O: "010101101101010",
        P: "110101110100100", Q: "010101101111011", R: "110101110101101",
        S: "011100010001110", T: "111010010010010", U: "101101101101111",
        V: "101101101101010", W: "101101111111101", X: "101101010101101",
        Y: "101101010010010", Z: "111001010100111",
        "0": "111101101101111", "1": "010110010010111", "2": "110001010100111",
        "3": "110001010001110", "4": "101101111001001", "5": "111100110001110",
        "6": "011100110101010", "7": "111001010010010", "8": "010101010101010",
        "9": "010101011001110",
        "!": "010010010000010", "¡": "010000010010010", "?": "110001010000010",
        ".": "000000000000010", "-": "000000111000000", ":": "000010000010000",
        "Á": "010101111101101", "É": "111100110100111", "Í": "111010010010111",
        "Ó": "010101101101010", "Ú": "101101101101111", "Ñ": "110101101101101",
        " ": "000000000000000"
    };


    /** Escribe `text` en la rejilla con la fuente 3x5 (1 px de aire) */
    function pixelText(grid, x, y, text, color) {

        let cursor = x;

        String(text).toUpperCase().split("").forEach((char) => {

            const glyph = FONT[char] || FONT["?"];

            for (let i = 0; i < 15; i += 1) {

                if (glyph[i] === "1") {
                    grid.set(cursor + (i % 3), y + Math.floor(i / 3), color);
                }

            }

            cursor += 4;

        });

        return cursor - x - 1;

    }


    /** Ancho en píxeles que ocupará un texto 3x5 */
    function pixelTextWidth(text) {
        return Math.max(0, String(text).length * 4 - 1);
    }


    /** Sprite → <canvas> a escala entera (1 px de rejilla = scale px) */
    function toCanvas(sprite, scale = 1) {

        const canvas = document.createElement("canvas");

        canvas.width = Math.max(1, sprite.width * scale);
        canvas.height = Math.max(1, sprite.height * scale);

        const ctx = canvas.getContext("2d");

        draw(ctx, sprite, 0, 0, scale);

        return canvas;

    }


    /* ---------------------------------------------------------
       SALIDAS
       --------------------------------------------------------- */

    /** Sprite → SVG (rectángulos agrupados por tramos horizontales) */
    function toSvg(sprite, options = {}) {

        const {
            scale = 6,
            className = "",
            title = ""
        } = options;

        if (!sprite || !sprite.data.length) {
            return "";
        }

        const { width, height, data } = sprite;

        const parts = [];

        for (let y = 0; y < height; y += 1) {

            let x = 0;

            while (x < width) {

                const color = data[y][x];

                if (!color) {
                    x += 1;
                    continue;
                }

                let run = 1;

                while (x + run < width && data[y][x + run] === color) {
                    run += 1;
                }

                parts.push(
                    `<rect x="${x * scale}" y="${y * scale}" ` +
                    `width="${run * scale}" height="${scale}" ` +
                    `fill="${color}"/>`
                );

                x += run;

            }

        }

        return (
            `<svg class="${className}" viewBox="0 0 ${width * scale} ${height * scale}" ` +
            `width="${width * scale}" height="${height * scale}" ` +
            `role="img" aria-label="${title}" shape-rendering="crispEdges">` +
            `${title ? `<title>${title}</title>` : ""}` +
            parts.join("") +
            `</svg>`
        );

    }


    /** Sprite → canvas */
    function draw(ctx, sprite, x, y, scale = 1, alpha = 1) {

        if (!sprite || !sprite.data.length) {
            return;
        }

        const { width, height, data } = sprite;

        ctx.save();

        /* Se multiplica por el alfa que ya traiga el contexto: si no,
           un save()+globalAlpha=1 pisaba la transparencia que había
           puesto quien llama (por eso el fondo del gordo salía
           opaco y tapaba el juego). */
        ctx.globalAlpha = ctx.globalAlpha * alpha;

        for (let row = 0; row < height; row += 1) {

            for (let col = 0; col < width; col += 1) {

                const color = data[row][col];

                if (!color) {
                    continue;
                }

                ctx.fillStyle = color;

                ctx.fillRect(
                    Math.round(x + col * scale),
                    Math.round(y + row * scale),
                    Math.ceil(scale),
                    Math.ceil(scale)
                );

            }

        }

        ctx.restore();

    }


    /** Marca de agua: el gordo gigante y translúcido de fondo */
    function drawBackdrop(ctx, stage, options = {}) {

        const {
            alpha = 0.07,
            fraction = 0.72,
            side = "right"
        } = options;

        if (!GORDO.data.length) {
            return;
        }

        const scale = (stage.height * fraction) / GORDO.height;

        const width = GORDO.width * scale;

        const x = side === "right"
            ? stage.width - width + width * 0.12
            : -width * 0.12;

        const y = (stage.height - GORDO.height * scale) / 2;

        ctx.save();

        ctx.globalAlpha = alpha;

        draw(ctx, GORDO, x, y, scale);

        ctx.restore();

    }


    A.pixelArt = {

        gordo: GORDO,

        drawBackdrop,

        palette: PALETTE,

        makeGrid,

        text: pixelText,

        textWidth: pixelTextWidth,

        toCanvas,

        toSvg,

        draw,

        /** Tamaño útil para centrar el sprite */
        size(sprite, scale = 1) {
            return {
                width: sprite.width * scale,
                height: sprite.height * scale
            };
        }

    };

})(window.Arcade404);
