#!/usr/bin/env node
/* =========================================================
   ARCADE 404 — smoke de dock táctil compartido
   ---------------------------------------------------------
   Ejecuta GameShell con un DOM mínimo para comprobar que el stick
   normaliza el vector, conserva dirección/FIRE/PAUSE, limpia un
   gesto retenido y no aparece por el mero hecho de estrechar desktop.
   ========================================================= */

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const SHELL_SOURCE = fs.readFileSync(
    path.join(ROOT, "js", "core", "game-shell.js"),
    "utf8"
);

class FakeStyle {
    constructor() {
        this.values = new Map();
    }

    setProperty(name, value) {
        this.values.set(name, String(value));
    }

    getPropertyValue(name) {
        return this.values.get(name) || "";
    }
}

class FakeClassList {
    constructor() {
        this.values = new Set();
    }

    add(...names) {
        names.forEach((name) => {
            String(name).split(/\s+/).filter(Boolean).forEach((part) => {
                this.values.add(part);
            });
        });
    }

    remove(...names) {
        names.forEach((name) => this.values.delete(name));
    }

    contains(name) {
        return this.values.has(name);
    }

    toggle(name, force) {
        const next = force == null ? !this.values.has(name) : Boolean(force);
        if (next) {
            this.values.add(name);
        } else {
            this.values.delete(name);
        }
        return next;
    }

    reset(value) {
        this.values.clear();
        this.add(value || "");
    }

    toString() {
        return Array.from(this.values).join(" ");
    }
}

class FakeNode {
    constructor(tagName) {
        this.tagName = String(tagName || "div").toUpperCase();
        this.children = [];
        this.parentNode = null;
        this.attributes = new Map();
        this.dataset = {};
        this.style = new FakeStyle();
        this.classList = new FakeClassList();
        this.listeners = new Map();
        this.hidden = false;
        this._innerHTML = "";
        this._capturedPointer = null;
    }

    set className(value) {
        this.classList.reset(value);
    }

    get className() {
        return this.classList.toString();
    }

    set innerHTML(value) {
        this._innerHTML = String(value == null ? "" : value);
        this.children = [];
    }

    get innerHTML() {
        return this._innerHTML;
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    addEventListener(type, handler) {
        const handlers = this.listeners.get(type) || [];
        handlers.push(handler);
        this.listeners.set(type, handlers);
    }

    removeEventListener(type, handler) {
        const handlers = this.listeners.get(type) || [];
        this.listeners.set(type, handlers.filter((item) => item !== handler));
    }

    dispatch(type, values = {}) {
        const event = Object.assign({
            type,
            isPrimary: true,
            pointerId: 1,
            clientX: 50,
            clientY: 50,
            defaultPrevented: false,
            preventDefault() {
                this.defaultPrevented = true;
            }
        }, values);

        (this.listeners.get(type) || []).slice().forEach((handler) => handler(event));
        return event;
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
    }

    getAttribute(name) {
        return this.attributes.get(name) || null;
    }

    removeAttribute(name) {
        this.attributes.delete(name);
    }

    setPointerCapture(pointerId) {
        this._capturedPointer = pointerId;
    }

    releasePointerCapture(pointerId) {
        if (this._capturedPointer === pointerId) {
            this._capturedPointer = null;
        }
    }

    getBoundingClientRect() {
        return { left: 0, top: 0, width: 100, height: 100 };
    }
}

function findByClass(node, className) {
    if (node.classList && node.classList.contains(className)) {
        return node;
    }

    for (const child of node.children || []) {
        const found = findByClass(child, className);
        if (found) {
            return found;
        }
    }

    return null;
}

function createHarness() {
    let touchCapable = false;
    const staticNodes = new Map();
    const root = new FakeNode("section");

    [
        '[data-role="hud"]',
        '[data-role="overlay"]',
        '[data-role="stage"]',
        '[data-role="touch"]',
        '[data-role="narrative-control"]',
        '[data-role="narrative-label"]',
        '[data-role="hint"]',
        '[data-role="log"]',
        '[data-role="sound-glyph"]',
        '[data-action="back"]',
        '[data-action="pause"]',
        '[data-action="restart"]',
        '[data-action="sound"]'
    ].forEach((selector) => staticNodes.set(selector, new FakeNode("div")));

    root.querySelector = (selector) => staticNodes.get(selector) || null;
    root.querySelectorAll = () => [];

    const utils = {
        create(tag, className, html) {
            if (tag === "section" && className === "game-screen") {
                return root;
            }

            const node = new FakeNode(tag);
            node.className = className || "";
            if (html != null) {
                node.innerHTML = html;
            }
            return node;
        },
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },
        formatScore(value) {
            return String(value);
        },
        isTouchDevice() {
            return touchCapable;
        }
    };

    const A = {
        utils,
        storage: { getBest: () => 0 },
        audio: {
            play() {},
            toggle() {},
            stopMusic() {},
            duckMusic() {},
            music() {}
        },
        input: {
            clear() {},
            subscribe: () => () => {},
            subscribeUp: () => () => {}
        },
        Loop: class {
            constructor(options) {
                this.options = options;
            }
            start() {}
            stop() {}
            pause() {}
            resume() {}
        }
    };

    const window = {
        Arcade404: A,
        innerWidth: 390,
        innerHeight: 700,
        addEventListener() {},
        removeEventListener() {}
    };

    vm.runInNewContext(SHELL_SOURCE, {
        window,
        document: { fonts: null },
        console,
        Math,
        Number,
        String,
        Boolean,
        Array,
        Object,
        Map,
        Set,
        Date,
        setInterval,
        clearInterval,
        setTimeout,
        clearTimeout
    }, { filename: "js/core/game-shell.js" });

    const shell = new A.GameShell({
        id: "touch-smoke",
        name: "TOUCH SMOKE",
        number: "00",
        accent: "#22d3ee",
        accentRgb: "34 211 238"
    });

    return {
        shell,
        touch: staticNodes.get('[data-role="touch"]'),
        setTouchCapable(value) {
            touchCapable = Boolean(value);
        }
    };
}

function run() {
    const { shell, touch, setTouchCapable } = createHarness();
    const moves = [];
    const directions = [];
    const actions = [];

    shell.setTouchControls({
        mode: "dpad-fire",
        onMove: (move) => moves.push(move),
        onDirection: (direction) => directions.push(direction),
        onAction: (action) => {
            actions.push(action);
            return action === "pause" || false;
        }
    });

    assert.strictEqual(touch.classList.contains("is-visible"), false,
        "un escritorio estrecho no muestra el dock sólo por su ancho");
    assert.ok(touch.classList.contains("touch-controls--analog"),
        "los modos de dirección construyen el joystick compartido");
    assert.ok(findByClass(touch, "touch-btn--action"),
        "el modo de acción conserva el botón FIRE separado");
    assert.ok(findByClass(touch, "touch-btn--utility"),
        "el dock conserva un botón PAUSE compacto");

    setTouchCapable(true);
    shell._updateTouchVisibility();
    assert.strictEqual(touch.classList.contains("is-visible"), true,
        "un dispositivo táctil sí recibe el dock");

    const stick = findByClass(touch, "touch-stick");
    assert.ok(stick, "el shell monta un stick radial en vez del D-pad");
    assert.strictEqual(stick.getAttribute("role"), "group",
        "el stick expone una agrupación semántica para asistencia");
    assert.ok(stick.getAttribute("aria-keyshortcuts").includes("ArrowLeft"),
        "el stick comunica las flechas de teclado disponibles");

    stick.dispatch("pointerdown", { pointerId: 7, clientX: 96, clientY: 50 });
    const pushed = moves[moves.length - 1];
    assert.ok(pushed.x > 0.99 && Math.abs(pushed.y) < 0.01,
        "el stick normaliza un arrastre lateral al vector X máximo");
    assert.strictEqual(pushed.direction, "right",
        "el vector normalizado conserva dirección cardinal para ROMs discretas");
    assert.strictEqual(directions[0], "right",
        "el primer gesto emite la dirección inmediatamente");
    assert.notStrictEqual(stick.style.getPropertyValue("--stick-x"), "0px",
        "el pulgar visual acompaña el vector táctil");

    stick.dispatch("pointerup", { pointerId: 7 });
    const released = moves[moves.length - 1];
    assert.deepStrictEqual(
        { x: released.x, y: released.y, magnitude: released.magnitude },
        { x: 0, y: 0, magnitude: 0 },
        "soltar el stick devuelve movimiento continuo a cero"
    );

    const fire = findByClass(touch, "touch-btn--action");
    fire.dispatch("pointerdown", { pointerId: 8 });
    assert.ok(actions.includes("fire"), "FIRE llama la acción propia de la ROM");

    const pause = findByClass(touch, "touch-btn--utility");
    pause.dispatch("click");
    assert.ok(actions.includes("pause"), "PAUSE se entrega antes al hook de la ROM");

    stick.dispatch("pointerdown", { pointerId: 9, clientX: 50, clientY: 4 });
    shell._clearTouchTimers();
    const cleared = moves[moves.length - 1];
    assert.strictEqual(cleared.magnitude, 0,
        "pausar o salir limpia un stick retenido sin esperar pointerup");
    assert.strictEqual(shell.touchTimers.size, 0,
        "la limpieza no deja intervalos táctiles en segundo plano");

    shell.setTouchControls({
        mode: "pointer",
        hint: "ARRASTRA PARA MOVER"
    });
    assert.ok(findByClass(touch, "touch-hint"),
        "los juegos de arrastre conservan su guía de gesto directa");
    assert.ok(findByClass(touch, "touch-btn--utility"),
        "los juegos de arrastre también reciben PAUSE sin un joystick innecesario");
    assert.strictEqual(findByClass(touch, "touch-stick"), null,
        "el joystick no compite con las ROMs que usan puntero directo");
}

run();
console.log("✓ Touch smoke: joystick normalizado, FIRE/PAUSE, limpieza y visibilidad táctil verificados");
