/* =========================================================
   ARCADE 404 — BUCLE DE JUEGO
   Paso fijo para la lógica + render por frame + medidor FPS.
   ========================================================= */

(function (A) {

    "use strict";


    class Loop {

        constructor(options = {}) {

            this.step = options.step || (1000 / 60);
            this.onUpdate = options.onUpdate || function () {};
            this.onRender = options.onRender || function () {};
            this.onFps = options.onFps || null;

            this.running = false;
            this.paused = false;

            this.accumulator = 0;
            this.lastTime = 0;
            this.frameId = null;

            this.fps = 0;
            this._frames = 0;
            this._fpsTime = 0;

            this._tick = this._tick.bind(this);

        }


        start() {

            if (this.running) {
                return;
            }

            this.running = true;
            this.paused = false;

            this.lastTime = performance.now();
            this.accumulator = 0;

            this.frameId = requestAnimationFrame(this._tick);

        }


        stop() {

            this.running = false;

            if (this.frameId !== null) {
                cancelAnimationFrame(this.frameId);
                this.frameId = null;
            }

        }


        pause() {
            this.paused = true;
        }


        resume() {

            if (!this.paused) {
                return;
            }

            this.paused = false;

            /* Evita que el tiempo en pausa se acumule */
            this.lastTime = performance.now();
            this.accumulator = 0;

        }


        _tick(now) {

            if (!this.running) {
                return;
            }

            const delta = Math.min(now - this.lastTime, 250);

            this.lastTime = now;

            /* Contador de FPS */
            this._frames += 1;
            this._fpsTime += delta;

            if (this._fpsTime >= 500) {

                this.fps = Math.round(
                    (this._frames * 1000) / this._fpsTime
                );

                this._frames = 0;
                this._fpsTime = 0;

                if (this.onFps) {
                    this.onFps(this.fps);
                }

            }


            if (!this.paused) {

                this.accumulator += delta;

                let guard = 0;

                while (
                    this.accumulator >= this.step &&
                    guard < 8
                ) {

                    this.onUpdate(this.step);

                    this.accumulator -= this.step;
                    guard += 1;

                }

                /* Si un frame muy caro deja varios pasos pendientes, no
                   intentamos pagarlos todos indefinidamente en los frames
                   siguientes. Descartar tiempo viejo permite recuperarse en
                   vez de entrar en una espiral de "se queda pegado". */
                if (guard === 8 && this.accumulator >= this.step) {
                    this.accumulator = Math.min(this.accumulator, this.step);
                }

                this.onRender();

            }


            this.frameId = requestAnimationFrame(this._tick);

        }

    }


    A.Loop = Loop;

})(window.Arcade404);
