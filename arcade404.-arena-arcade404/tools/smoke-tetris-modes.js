#!/usr/bin/env node
/* =========================================================
   ARCADE 404 — smoke de STACK
   ---------------------------------------------------------
   Comprueba los dos modos de Tetris sin navegador: selector de modo,
   tablero clásico 10×20, limpieza tradicional, puente de arena y perfil
   de rendimiento adaptativo para Sandtrix.
   ========================================================= */

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = fs.readFileSync(path.join(ROOT, "js", "games", "tetris.js"), "utf8");

function control(value, key) {
    const classes = new Set();
    const listeners = {};

    return {
        dataset: { [key]: value },
        classList: {
            toggle(name, enabled) {
                enabled ? classes.add(name) : classes.delete(name);
            },
            contains(name) {
                return classes.has(name);
            }
        },
        addEventListener(type, listener) {
            listeners[type] = listener;
        },
        click() {
            if (listeners.click) listeners.click();
        }
    };
}

function createGame() {
    const modeControls = [
        control("arena", "tetrismode"),
        control("classic", "tetrismode")
    ];
    const levelControls = [
        control("1", "startlevel"),
        control("5", "startlevel"),
        control("10", "startlevel")
    ];
    const stats = new Map();
    let definition = null;
    let touchConfig = null;

    const makeContext = () => ({
        save() {}, restore() {}, scale() {}, translate() {},
        fillRect() {}, strokeRect() {}, beginPath() {}, moveTo() {},
        lineTo() {}, rect() {}, arcTo() {}, closePath() {}, clip() {}, setLineDash() {}, fill() {}, stroke() {},
        arc() {}, ellipse() {}, drawImage() {}, putImageData() {},
        createLinearGradient() { return { addColorStop() {} }; },
        createImageData(width, height) {
            return { data: new Uint8ClampedArray(width * height * 4) };
        }
    });
    const stageContext = makeContext();

    const A = {
        utils: {
            clamp(value, min, max) {
                return Math.max(min, Math.min(max, value));
            },
            formatScore(value) {
                return String(Math.round(value));
            },
            qsa(selector) {
                if (selector === "[data-tetrismode]") return modeControls;
                if (selector === "[data-startlevel]") return levelControls;
                return [];
            }
        },
        canvasKit: {
            roundRect() {},
            fillRoundRect() {},
            text() {}
        },
        createStage() {
            return { ctx: stageContext, destroy() {} };
        },
        audio: { play() {} },
        ui: {
            stat() { return ""; },
            divider() { return ""; },
            meter() { return ""; },
            switcher() { return ""; }
        },
        registerGame(value) {
            definition = value;
        }
    };

    const document = {
        createElement() {
            const context = makeContext();
            return {
                width: 0,
                height: 0,
                getContext() {
                    return context;
                }
            };
        }
    };

    vm.runInNewContext(SOURCE, {
        window: { Arcade404: A, devicePixelRatio: 1 },
        document,
        console,
        Math,
        Number,
        Object,
        Array,
        Uint8Array,
        Uint8ClampedArray,
        Int32Array,
        parseInt
    }, { filename: "js/games/tetris.js" });

    assert.ok(definition, "STACK se registra correctamente");
    const shell = {
        refs: { stage: {} },
        root: {},
        setTouchControls(config) { touchConfig = config; },
        setStatus() {},
        setStat(name, value) { stats.set(name, value); },
        setMeter() {},
        checkStory() {},
        levelUpTaunt() {},
        gameOver() {}
    };

    return {
        game: definition.create(shell),
        definition,
        modeControls,
        levelControls,
        stats,
        getTouchConfig() { return touchConfig; }
    };
}

function smokeModeSelectorAndClassicBoard() {
    const { game, definition, modeControls, stats, getTouchConfig } = createGame();

    assert.match(definition.genre, /DOS MODOS/,
        "la tarjeta de STACK comunica que ofrece los dos tipos de partida");
    assert.strictEqual(game.mode, "arena",
        "Sandtrix conserva ARENA como modo inicial para no cambiar partidas existentes");
    assert.ok(modeControls[0].classList.contains("is-active"),
        "el selector deja ARENA marcado al abrir el juego");
    assert.doesNotThrow(() => game.render(),
        "la arena se sigue dibujando con su fondo y panel propios");

    modeControls[1].click();
    assert.strictEqual(game.mode, "classic",
        "el selector activa el modo de Tetris tradicional sin salir de STACK");
    assert.ok(modeControls[1].classList.contains("is-active"),
        "CLÁSICO refleja su selección visualmente");
    assert.strictEqual(game.classicBoard.length, 200,
        "el modo tradicional usa el tablero ligero de 10 × 20 celdas");
    assert.strictEqual(stats.get("mode"), "CLÁSICO",
        "el HUD identifica el modo tradicional durante la partida");
    assert.doesNotThrow(() => game.render(),
        "el tablero clásico se puede dibujar sin tocar la física de arena");

    const touch = getTouchConfig();
    const startX = game.piece.x;
    assert.strictEqual(game.key("ArrowLeft"), true,
        "el teclado sigue consumiendo la flecha en Tetris clásico");
    assert.strictEqual(game.piece.x, startX - 1,
        "la flecha mueve un bloque sólido a la izquierda");
    game.keyUp("ArrowLeft");

    assert.strictEqual(touch.mode, "dpad-fire",
        "el dock táctil compartido conserva joystick direccional y la acción DROP");
    touch.onDirection("right");
    assert.strictEqual(game.piece.x, startX,
        "el joystick táctil pasa por la misma ruta clásica de movimiento");

    for (let x = 0; x < 10; x += 1) {
        game.classicBoard[190 + x] = 1;
    }
    assert.strictEqual(game.clearClassicRows(), 1,
        "una fila completa se reconoce y limpia con la regla tradicional");
    assert.ok(Array.from(game.classicBoard.slice(190, 200)).every((cell) => cell === 0),
        "la limpieza clásica compacta el tablero sin dejar residuos");

    assert.strictEqual(game.key(" "), true,
        "ESPACIO conserva el hard drop del Tetris clásico");
    assert.ok(game.classicBoard.some((cell) => cell !== 0),
        "ESPACIO fija un tetromino real en el tablero clásico");

    game.update(200);
    assert.ok(game.piece, "una pieza clásica vuelve tras el breve retraso de spawn");
    touch.onAction("fire");
    assert.strictEqual(game.piece, null,
        "DROP táctil fija la siguiente pieza sin ruta alternativa");

    game.onFps(20);
    game.onFps(20);
    assert.ok(!game.performanceProfile.constrained,
        "el perfil de arena no reduce el Tetris clásico ya ligero");

    modeControls[0].click();
    assert.strictEqual(game.mode, "arena",
        "se puede volver a Sandtrix desde el mismo selector");
}

function smokeArenaBridgeAndAdaptiveBudget() {
    const { game } = createGame();

    /* Una franja de arena del mismo color de pared a pared debe registrar
       exactamente sus granos, no barrer todo el buffer al terminar. */
    game.color.fill(0);
    game.topRow = 159;
    for (let x = 0; x < 80; x += 1) {
        game.color[159 * 80 + x] = 1;
    }

    assert.strictEqual(game.findClears(), 80,
        "ARENA detecta el puente de un color a través de todo el tablero");
    assert.strictEqual(game.flash.count, 80,
        "la limpieza conserva una lista exacta de granos para evitar escanear 12.800 celdas");
    game.finishFlash();
    assert.strictEqual(game.topRow, 160,
        "tras limpiar, el límite superior se recalcula y la física vuelve a omitir filas vacías");

    game.onFps(35);
    game.onFps(34);
    assert.ok(game.performanceProfile.constrained,
        "dos muestras de FPS bajos habilitan el perfil de arena contenido");
    assert.strictEqual(game.performanceProfile.sandHz, 72,
        "el perfil contenido reduce la frecuencia de arena antes de que el juego se congele");
    assert.strictEqual(game.performanceProfile.maxSandSteps, 3,
        "el perfil contenido limita el trabajo de física pendiente por frame");
    assert.ok(game.performanceProfile.particleLimit <= 72,
        "el perfil contenido también acota partículas transitorias");
}

function smokeStaticContracts() {
    assert.ok(SOURCE.includes("data-tetrismode")
        && SOURCE.includes("resetClassic()")
        && SOURCE.includes("classicBoard")
        && SOURCE.includes("CLASSIC_LINE_SCORES")
        && SOURCE.includes("SAND_HZ_ECO")
        && SOURCE.includes("refreshTopRow()")
        && SOURCE.includes("clearList"),
    "STACK conserva selector, reglas clásicas y rutas de rendimiento observables");
}

smokeModeSelectorAndClassicBoard();
smokeArenaBridgeAndAdaptiveBudget();
smokeStaticContracts();
console.log("✓ STACK smoke: modos clásico/arena, limpieza y presupuesto de rendimiento");
