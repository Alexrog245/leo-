#!/usr/bin/env node
/* =========================================================
   ARCADE 404 — smoke de lectura manual
   ---------------------------------------------------------
   Comprueba que las escenas del hilo compartido y la apertura
   de OPERACIÓN 404 terminan de animarse, pero nunca avanzan
   ni cierran por un temporizador. Sólo next()/ESPACIO puede
   pasar una viñeta.
   ========================================================= */

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const STORY_SOURCE = fs.readFileSync(path.join(ROOT, "js", "core", "story.js"), "utf8");
const INTRO_SOURCE = fs.readFileSync(path.join(ROOT, "js", "games", "op404", "intro.js"), "utf8");

function createStoryHarness() {
    const saved = {};
    const tones = [];
    const A = {
        audio: { play: (name) => tones.push(name) },
        storage: {
            getObject: (key, fallback) => saved[key] || fallback,
            setObject: (key, value) => { saved[key] = value; }
        }
    };
    const window = { Arcade404: A };

    vm.runInNewContext(STORY_SOURCE, {
        window,
        Math,
        Number,
        Object,
        Array,
        Date,
        console
    }, { filename: "js/core/story.js" });

    return { A, window, saved, tones };
}

function smokeSharedStory() {
    const { A, saved, tones } = createStoryHarness();
    const stage = { width: 640, height: 400, ctx: {} };
    const chapter = {
        id: "manual-smoke",
        title: "LECTURA MANUAL",
        scenes: [
            { title: "PRIMERA", lines: ["Esta línea debe seguir aquí."], draw: () => {} },
            { title: "SEGUNDA", lines: ["El jugador decide cuándo terminar."], draw: () => {} }
        ]
    };
    const player = new A.story.StoryPlayer(stage, chapter);

    player.update(120000);
    assert.strictEqual(player.index, 0,
        "un capítulo compartido no cambia de viñeta aunque termine toda su animación");
    assert.strictEqual(player.done, false,
        "un capítulo compartido no se cierra por tiempo");

    player.next();
    assert.strictEqual(player.index, 1,
        "next(), invocado por ESPACIO, avanza exactamente una viñeta");
    assert.ok(tones.includes("select"),
        "el avance manual conserva la señal sonora de confirmación");

    player.update(120000);
    assert.strictEqual(player.index, 1,
        "la última viñeta se mantiene abierta hasta una nueva pulsación");
    assert.strictEqual(player.done, false,
        "la última viñeta no termina el capítulo automáticamente");

    player.next();
    assert.strictEqual(player.done, true,
        "la segunda pulsación manual cierra el capítulo al terminar de leer");
    assert.strictEqual(saved["story:seen"]["manual-smoke"], true,
        "la historia se marca como vista sólo después del cierre manual");
}

function smokeOp404Intro() {
    const tones = [];
    const A = { op404: {}, audio: { play: (name) => tones.push(name) } };
    const window = { Arcade404: A };

    vm.runInNewContext(INTRO_SOURCE, { window, Math, Number, console }, {
        filename: "js/games/op404/intro.js"
    });

    const intro = new A.op404.Intro({ width: 640, height: 400, ctx: {} });
    intro.update(120000);
    assert.strictEqual(intro.index, 0,
        "la introducción de OP404 no salta escenas después de su antigua duración");
    assert.strictEqual(intro.done, false,
        "la introducción de OP404 no entrega el control sin una pulsación");

    for (let index = 0; index < A.op404.INTRO_SCENES.length - 1; index += 1) {
        intro.skipScene();
        assert.strictEqual(intro.index, index + 1,
            "cada avance manual de OP404 muestra una sola escena siguiente");
    }

    intro.update(120000);
    assert.strictEqual(intro.done, false,
        "la última escena de OP404 también espera la confirmación final");
    intro.skipScene();
    assert.strictEqual(intro.done, true,
        "la confirmación manual final permite comenzar la operación");
    assert.ok(tones.filter((name) => name === "select").length >= 4,
        "las transiciones manuales de OP404 conservan feedback de audio");
}

smokeSharedStory();
smokeOp404Intro();
console.log("✓ Story smoke: hilo global y OP404 esperan ESPACIO/tocar, sin avance automático");
