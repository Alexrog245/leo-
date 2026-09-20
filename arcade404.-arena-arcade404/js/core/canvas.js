/* =========================================================
   ARCADE 404 — LIENZO
   Crea un canvas con coordenadas lógicas fijas (diseño),
   escalado a alta densidad de píxeles y centrado.
   ========================================================= */

(function (A) {

    "use strict";


    /* ---------------------------------------------------------
       Utilidades de dibujo compartidas
       --------------------------------------------------------- */

    const kit = {

        roundRect(ctx, x, y, width, height, radius = 4) {

            const r = Math.min(radius, width / 2, height / 2);

            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + width, y, x + width, y + height, r);
            ctx.arcTo(x + width, y + height, x, y + height, r);
            ctx.arcTo(x, y + height, x, y, r);
            ctx.arcTo(x, y, x + width, y, r);
            ctx.closePath();

        },


        fillRoundRect(ctx, x, y, width, height, radius, fill) {

            kit.roundRect(ctx, x, y, width, height, radius);

            ctx.fillStyle = fill;
            ctx.fill();

        },


        glow(ctx, color, blur, draw) {

            ctx.save();

            ctx.shadowColor = color;
            ctx.shadowBlur = blur;

            draw();

            ctx.restore();

        },


        grid(stage, cell, color = "rgba(255,255,255,0.035)") {

            const ctx = stage.ctx;

            ctx.save();

            ctx.strokeStyle = color;
            ctx.lineWidth = 1;

            for (let x = 0; x <= stage.width; x += cell) {

                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, stage.height);
                ctx.stroke();

            }

            for (let y = 0; y <= stage.height; y += cell) {

                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(stage.width, y);
                ctx.stroke();

            }

            ctx.restore();

        },


        text(ctx, value, x, y, options = {}) {

            const {
                font = "700 16px 'JetBrains Mono', monospace",
                color = "#F5F7FF",
                align = "center",
                baseline = "middle",
                shadow = null,
                shadowBlur = 0
            } = options;

            ctx.save();

            ctx.font = font;
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.textBaseline = baseline;

            if (shadow) {
                ctx.shadowColor = shadow;
                ctx.shadowBlur = shadowBlur;
            }

            ctx.fillText(value, x, y);

            ctx.restore();

        },


        /** Estrellas / partículas de fondo para los escenarios */
        starfield(stage, stars, speed, dt) {

            const ctx = stage.ctx;

            ctx.save();

            stars.forEach((star) => {

                star.y += star.speed * speed * (dt / 16.67);

                if (star.y > stage.height) {
                    star.y = -2;
                    star.x = Math.random() * stage.width;
                }

                ctx.globalAlpha = star.alpha;
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(star.x, star.y, star.size, star.size);

            });

            ctx.restore();

        },


        createStars(stage, count = 60) {

            const stars = [];

            for (let i = 0; i < count; i += 1) {

                stars.push({
                    x: Math.random() * stage.width,
                    y: Math.random() * stage.height,
                    size: Math.random() < 0.85 ? 1 : 2,
                    alpha: 0.08 + Math.random() * 0.22,
                    speed: 0.15 + Math.random() * 0.6
                });

            }

            return stars;

        }

    };


    /**
     * Crea el lienzo dentro de `container`.
     * El juego dibuja siempre en coordenadas width x height.
     */
    function createStage(container, options = {}) {

        const width = options.width || 600;
        const height = options.height || 600;
        const background = options.background || "#070A10";

        const canvas = document.createElement("canvas");
        canvas.className = "stage-canvas";

        container.appendChild(canvas);

        /* Los juegos de acción pueden pedir un contexto opaco y de baja
           latencia sin cambiar el comportamiento de los demás lienzos. */
        const ctx = canvas.getContext("2d", options.contextOptions || undefined);


        const stage = {

            canvas,
            ctx,
            width,
            height,
            scale: 1,
            dpr: 1,

            clear(color = background) {

                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();

            },


            resize,


            /** Convierte coordenadas de puntero al sistema lógico */
            toLogical(clientX, clientY) {

                const rect = canvas.getBoundingClientRect();

                return {
                    x: ((clientX - rect.left) / rect.width) * stage.width,
                    y: ((clientY - rect.top) / rect.height) * stage.height
                };

            },


            /** Cambia el tamaño lógico del lienzo (rejillas adaptativas) */
            setLogical(nextWidth, nextHeight) {

                stage.width = Math.max(1, Math.round(nextWidth));
                stage.height = Math.max(1, Math.round(nextHeight));

                resize();

            },


            destroy() {

                if (observer) {
                    observer.disconnect();
                }

                /* Si el escenario se destruye antes de recibir medidas
                   reales, cancela el reintento pendiente para no dejar un
                   frame intentando redimensionar un lienzo desmontado. */
                if (retryId !== null) {
                    cancelAnimationFrame(retryId);
                    retryId = null;
                }

                window.removeEventListener("resize", resize);

                if (canvas.parentNode) {
                    canvas.parentNode.removeChild(canvas);
                }

            }

        };


        let retryId = null;
        let retries = 0;

        function resize() {

            const rect = container.getBoundingClientRect();

            const cssWidth = Math.max(1, Math.floor(rect.width));
            const cssHeight = Math.max(1, Math.floor(rect.height));

            /* El contenedor aún no tiene tamaño (pantalla oculta o
               primer frame): se reintenta en el siguiente frame. */
            if (cssWidth < 2 || cssHeight < 2) {

                if (retryId === null && retries < 60) {

                    retries += 1;

                    retryId = requestAnimationFrame(() => {

                        retryId = null;

                        resize();

                    });

                }

                return;

            }

            retries = 0;

            /* Un canvas de raycasting no gana detalle real al multiplicar
               todos sus píxeles por 2 en un móvil. El límite es opcional:
               los minijuegos que sí necesitan alta densidad conservan 2x. */
            const requestedMaxDpr = Number.isFinite(options.maxDpr)
                ? options.maxDpr
                : 2;
            const maxDpr = Math.max(0.5, requestedMaxDpr);
            const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

            canvas.width = Math.floor(cssWidth * dpr);
            canvas.height = Math.floor(cssHeight * dpr);

            const scale = Math.min(
                canvas.width / stage.width,
                canvas.height / stage.height
            );

            const offsetX = (canvas.width - stage.width * scale) / 2;
            const offsetY = (canvas.height - stage.height * scale) / 2;

            ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

            stage.scale = scale;
            stage.dpr = dpr;

            if (options.onResize) {
                options.onResize(stage);
            }

        }


        let observer = null;

        if (typeof ResizeObserver === "function") {

            observer = new ResizeObserver(() => resize());
            observer.observe(container);

        }

        window.addEventListener("resize", resize);

        resize();

        stage.clear();

        return stage;

    }


    A.canvasKit = kit;
    A.createStage = createStage;

})(window.Arcade404);
