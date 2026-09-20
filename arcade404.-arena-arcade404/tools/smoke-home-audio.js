#!/usr/bin/env node
/* =========================================================
   ARCADE 404 — smoke de audio HOME ↔ HUB sin dependencias

   Uso: node tools/smoke-home-audio.js

   Simula el bootstrap con un DOM mínimo. Comprueba que Inicio
   se solicite antes de window.load, no se reinicie si ya suena,
   se entregue con crossfade a la tensión del hub y conserve los
   respaldos invisibles ante políticas de autoplay restrictivas.
   ========================================================= */

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const APP_SOURCE = fs.readFileSync(path.join(ROOT, "js", "app.js"), "utf8");


function createEventTarget() {

    const listeners = new Map();

    return {
        addEventListener(type, callback) {

            const current = listeners.get(type) || [];
            current.push(callback);
            listeners.set(type, current);

        },


        emit(type, event = {}) {

            const current = listeners.get(type) || [];

            current.slice().forEach((callback) => {
                callback({ type, ...event });
            });

        }
    };

}


function createClassList() {

    const names = new Set();

    return {
        add(...items) {
            items.forEach((item) => names.add(item));
        },

        remove(...items) {
            items.forEach((item) => names.delete(item));
        },

        contains(item) {
            return names.has(item);
        },

        toggle(item, force) {
            const enabled = force === undefined ? !names.has(item) : Boolean(force);
            enabled ? names.add(item) : names.delete(item);
            return enabled;
        }
    };

}


function createHarness(canPlay, options = {}) {

    const document = createEventTarget();
    const window = createEventTarget();
    const tracks = [];
    const routeCallbacks = [];
    const nativeTrack = options.native
        ? Object.assign(createEventTarget(), {
            assetId: "audio.inicio",
            paused: Boolean(!options.nativePlaying),
            ended: false,
            volume: 0.16
        })
        : null;
    const tensionTrack = options.tensionNative
        ? Object.assign(createEventTarget(), {
            assetId: "audio.tension",
            paused: Boolean(!options.tensionPlaying),
            ended: false,
            volume: 0
        })
        : null;
    const enterButton = options.withEnter ? createEventTarget() : null;
    const curtain = options.withCurtain
        ? {
            hidden: true,
            offsetWidth: 1,
            classList: createClassList()
        }
        : null;
    const davinchiOperator = options.withDavinchi
        ? { classList: createClassList() }
        : null;
    const davinchiButton = options.withDavinchi
        ? Object.assign(createEventTarget(), {
            classList: createClassList(),
            parentElement: davinchiOperator,
            attributes: {},
            setAttribute(name, value) {
                this.attributes[name] = String(value);
            }
        })
        : null;
    const homeAudioStatus = options.withDavinchi ? { textContent: "" } : null;
    const attemptLog = [];
    const animationFrames = [];
    const timers = [];
    let frameTime = 0;
    let timerId = 0;
    let attempts = 0;
    let musicOn = options.musicEnabled !== false;

    document.readyState = "loading";
    document.body = { classList: createClassList() };
    document.hidden = false;

    const Arcade404 = {
        utils: {
            qs(selector) {
                if (selector === "#homeMusicNative") {
                    return nativeTrack;
                }

                if (selector === "#homeDavinchi") {
                    return davinchiButton;
                }

                if (selector === "#homeAudioStatus") {
                    return homeAudioStatus;
                }

                if (selector === "#hubTensionMusicNative") {
                    return tensionTrack;
                }

                if (selector === "#enterArcade") {
                    return enterButton;
                }

                if (selector === "#arcadeTransition") {
                    return curtain;
                }

                return null;
            },
            qsa: () => [],
            pad: (value, size) => String(value).padStart(size, "0"),
            debounce: (callback) => callback,
            prefersReducedMotion: () => options.reducedMotion !== false
        },

        audio: {
            isEnabled: () => true,
            isMusicEnabled: () => musicOn,
            unlock: () => {},
            play: () => {}
        },

        assets: {
            createAudio(id, options) {

                const track = Object.assign(createEventTarget(), {
                    id,
                    assetId: id,
                    options,
                    paused: true,
                    ended: false,
                    volume: options.volume
                });
                tracks.push(track);

                return track;

            },


            playAudio(audio) {
                attempts += 1;
                attemptLog.push(audio && (audio.assetId || audio.id));

                const started = canPlay(attempts, audio);

                if (started && audio && typeof audio.paused === "boolean") {
                    audio.paused = false;

                    if (typeof audio.emit === "function") {
                        audio.emit("playing");
                    }
                }

                return Promise.resolve(started);
            },


            stopAudio(audio) {
                if (audio && typeof audio.paused === "boolean") {
                    audio.paused = true;

                    if (typeof audio.emit === "function") {
                        audio.emit("pause");
                    }
                }
            }
        },

        countGames: () => 10,
        hub: {
            init: () => {},
            handleKey: () => false
        },
        input: { subscribe: () => {} },
        router: {
            current: { type: options.routeType || "home" },
            init: () => {},
            getCurrent() {
                return this.current;
            },
            onChange(callback) {
                routeCallbacks.push(callback);
            },
            pauseActive: () => {},
            getShell: () => null,
            go(target) {
                const previous = this.current;
                const type = String(target).replace(/^#?\/?/, "").split("/")[0] || "home";
                this.current = { type };
                routeCallbacks.forEach((callback) => callback(this.current, previous));
            }
        }
    };

    window.Arcade404 = Arcade404;
    window.setTimeout = options.virtualTimers
        ? (callback, delay = 0) => {
            timerId += 1;
            timers.push({ id: timerId, at: frameTime + delay, callback });
            return timerId;
        }
        : setTimeout;

    const context = vm.createContext({
        window,
        document,
        console: {
            log: () => {},
            error: console.error
        },
        setTimeout,
        requestAnimationFrame: options.reducedMotion === false
            ? (callback) => {
                animationFrames.push(callback);
                return animationFrames.length;
            }
            : (callback) => callback(),
        performance: {
            now: () => frameTime
        },
        Promise
    });

    vm.runInContext(APP_SOURCE, context, { filename: "js/app.js" });

    return {
        Arcade404,
        document,
        window,
        tracks,
        nativeTrack,
        tensionTrack,
        enterButton,
        curtain,
        davinchiButton,
        davinchiOperator,
        homeAudioStatus,
        setMusicEnabled(value) {
            musicOn = Boolean(value);
        },
        get attempts() {
            return attempts;
        },
        get homeAttempts() {
            return attemptLog.filter((id) => id === "audio.inicio").length;
        },
        get tensionAttempts() {
            return attemptLog.filter((id) => id === "audio.tension").length;
        },
        get attemptLog() {
            return attemptLog.slice();
        },
        get route() {
            return Arcade404.router.current;
        },
        advanceFrames(milliseconds) {
            frameTime += milliseconds;

            const pending = animationFrames.splice(0);
            pending.forEach((callback) => callback(frameTime));
        },

        advanceTime(milliseconds) {
            const target = frameTime + milliseconds;

            while (true) {
                timers.sort((a, b) => a.at - b.at);

                const next = timers[0];

                if (!next || next.at > target) {
                    break;
                }

                timers.shift();
                frameTime = next.at;
                next.callback();

                const pending = animationFrames.splice(0);
                pending.forEach((callback) => callback(frameTime));
            }

            frameTime = target;

            const pending = animationFrames.splice(0);
            pending.forEach((callback) => callback(frameTime));
        },

        changeRoute(route) {

            const previous = Arcade404.router.current;
            Arcade404.router.current = route;
            routeCallbacks.forEach((callback) => callback(route, previous));

        }
    };

}


async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
}


async function run() {

    /* El <audio autoplay> declarado puede empezar durante el parseo, antes
       de app.js. El gestor debe reutilizarlo sin crear otra pista ni exigir
       un gesto. */
    const native = createHarness(() => false, {
        native: true,
        nativePlaying: true
    });

    native.document.emit("DOMContentLoaded");

    assert.equal(native.attempts, 0,
        "a parser-started native track must not be restarted during initialization");
    assert.equal(native.tracks.length, 0,
        "HOME must reuse the native audio element instead of duplicating Inicio");
    assert.equal(native.nativeTrack.autoplay, true,
        "the reused native track must retain autoplay");
    assert.equal(native.nativeTrack.loop, true,
        "the reused native track must retain loop");
    assert.equal(native.nativeTrack.preload, "auto",
        "the reused native track must retain eager preload");
    assert.equal(native.Arcade404.homeMusic.isPlaying(), true,
        "a parser-started native track must be recognized as playing automatically");


    /* Si se abre un enlace directo al hub, el autoplay declarativo no se
       filtra fuera de HOME mientras el router termina de arrancar. */
    const nativeHub = createHarness(() => true, {
        native: true,
        nativePlaying: true,
        routeType: "hub"
    });

    nativeHub.document.emit("DOMContentLoaded");

    assert.equal(nativeHub.homeAttempts, 0,
        "a direct hub route must not request HOME music programmatically");
    assert.equal(nativeHub.tensionAttempts, 1,
        "a direct hub route must request the tension ambience instead");
    assert.equal(nativeHub.nativeTrack.paused, true,
        "a parser-started track must be paused immediately outside HOME");


    /* El relevo principal no crea una segunda pista de Inicio: la baja,
       inicia tensión en silencio dentro del gesto y la sube al llegar al hub. */
    const handoff = createHarness(() => true, {
        native: true,
        nativePlaying: true,
        tensionNative: true,
        tensionPlaying: false,
        withEnter: true
    });

    handoff.document.emit("DOMContentLoaded");
    handoff.enterButton.emit("click");
    await flushMicrotasks();

    assert.equal(handoff.route.type, "hub",
        "ENTER must route to the selector through the shared handoff path");
    assert.equal(handoff.nativeTrack.paused, true,
        "HOME music must be paused after its outgoing crossfade");
    assert.equal(handoff.nativeTrack.volume, 0.16,
        "HOME volume must reset for a later return after the crossfade");
    assert.equal(handoff.tensionTrack.paused, false,
        "tension must already be playing when the hub is revealed");
    assert.equal(handoff.tensionTrack.volume, 0.14,
        "tension must fade to its hub listening level");
    assert.equal(handoff.homeAttempts, 0,
        "the parser-started HOME source must not be duplicated during handoff");
    assert.equal(handoff.tensionAttempts, 1,
        "the prepared tension source must receive one gesture-safe play request");

    handoff.changeRoute({ type: "game", id: "snake" });

    assert.equal(handoff.tensionTrack.paused, true,
        "tension must stop when leaving the selector for a game");


    /* Sin motion-reduction se verifica el cruce real: durante el relevo
       ambas pistas están presentes, una baja y la otra sube gradualmente. */
    const smoothHandoff = createHarness(() => true, {
        native: true,
        nativePlaying: true,
        tensionNative: true,
        tensionPlaying: false,
        reducedMotion: false
    });

    smoothHandoff.document.emit("DOMContentLoaded");
    smoothHandoff.Arcade404.homeMusic.fadeOut();
    smoothHandoff.Arcade404.hubMusic.prepareTransition();
    smoothHandoff.changeRoute({ type: "hub" });

    smoothHandoff.advanceFrames(320);

    assert(smoothHandoff.nativeTrack.volume > 0 && smoothHandoff.nativeTrack.volume < 0.16,
        "HOME volume must be partway through its outgoing fade at the module swap");
    assert(smoothHandoff.tensionTrack.volume > 0 && smoothHandoff.tensionTrack.volume < 0.14,
        "tension volume must rise gradually instead of cutting in at full level");

    smoothHandoff.advanceFrames(620);

    assert.equal(smoothHandoff.nativeTrack.paused, true,
        "HOME must finish fading and pause after the crossfade window");
    assert.equal(smoothHandoff.tensionTrack.volume, 0.14,
        "tension must finish at the intended listening level");


    /* El botón real comparte el handoff y espera a que los listones cubran
       HOME antes de mutar la ruta. El test usa un reloj virtual para no
       dormir durante la animación. */
    const shutter = createHarness(() => true, {
        native: true,
        nativePlaying: true,
        tensionNative: true,
        withEnter: true,
        withCurtain: true,
        reducedMotion: false,
        virtualTimers: true
    });

    shutter.document.emit("DOMContentLoaded");
    shutter.enterButton.emit("click");

    assert.equal(shutter.route.type, "home",
        "HOME must remain mounted while the slats are closing");
    assert.equal(shutter.curtain.hidden, false,
        "the slat curtain must become visible immediately after ENTER");
    assert.equal(shutter.curtain.classList.contains("is-closing"), true,
        "ENTER must start the closing listones phase");

    shutter.advanceTime(589);

    assert.equal(shutter.route.type, "home",
        "the route must not switch before the visual cover completes");

    shutter.advanceTime(1);

    assert.equal(shutter.route.type, "hub",
        "the hub route must switch at the covered midpoint");
    assert.equal(shutter.curtain.classList.contains("is-opening"), true,
        "the listones must open after mounting the selector behind them");

    shutter.advanceTime(670);

    assert.equal(shutter.curtain.hidden, true,
        "the curtain must clean itself after the selector is revealed");
    assert.equal(shutter.document.body.classList.contains("is-arcade-transitioning"), false,
        "the transition body lock must be cleared after the reveal");


    const allowed = createHarness(() => true);

    allowed.document.emit("DOMContentLoaded");

    assert.equal(
        allowed.attempts,
        1,
        "Inicio must attempt playback during DOM initialization, before window.load"
    );
    assert.equal(allowed.tracks.length, 1, "HOME must create a single Inicio track");
    assert.equal(allowed.tracks[0].id, "audio.inicio");
    assert.deepEqual(allowed.tracks[0].options, {
        autoplay: true,
        loop: true,
        preload: "auto",
        volume: 0.16
    });

    await flushMicrotasks();

    assert.equal(allowed.Arcade404.homeMusic.isPlaying(), true,
        "accepted autoplay must mark Inicio as active");

    allowed.window.emit("load");
    await flushMicrotasks();

    assert.equal(allowed.attempts, 1,
        "window.load must not restart a track that is already playing");

    allowed.changeRoute({ type: "hub" });

    assert.equal(allowed.Arcade404.homeMusic.isPlaying(), false,
        "leaving HOME must pause Inicio");

    allowed.changeRoute({ type: "home" });

    assert.equal(allowed.homeAttempts, 2,
        "returning to HOME must resume Inicio automatically");


    /* `canplay` debe reintentar solo cuando el primer play llegó antes de
       que el decoder de la pista estuviera listo. */
    const decoder = createHarness((attempt) => attempt > 1, {
        native: true,
        nativePlaying: false
    });

    decoder.document.emit("DOMContentLoaded");
    await flushMicrotasks();

    assert.equal(decoder.attempts, 1,
        "the native track must receive an immediate pre-decoder attempt");
    assert.equal(decoder.Arcade404.homeMusic.isPlaying(), false,
        "a pre-decoder refusal must not be treated as active playback");

    decoder.nativeTrack.emit("canplay");
    await flushMicrotasks();

    assert.equal(decoder.attempts, 2,
        "canplay must retry Inicio automatically without a gesture");
    assert.equal(decoder.Arcade404.homeMusic.isPlaying(), true,
        "canplay retry must mark Inicio as active when media becomes ready");


    let gestureCanPlay = false;
    const blocked = createHarness(() => gestureCanPlay);

    blocked.document.emit("DOMContentLoaded");

    assert.equal(blocked.attempts, 1,
        "a restrictive policy must still receive the immediate autoplay attempt");

    await flushMicrotasks();

    assert.equal(blocked.Arcade404.homeMusic.isPlaying(), false,
        "blocked autoplay must not be reported as active");

    blocked.window.emit("load");
    await flushMicrotasks();

    assert.equal(blocked.attempts, 2,
        "window.load must supply a second automatic media-pipeline attempt");

    blocked.window.emit("pageshow");
    await flushMicrotasks();

    assert.equal(blocked.attempts, 3,
        "pageshow must supply another automatic retry without a gesture");

    gestureCanPlay = true;
    blocked.document.emit("pointerdown");
    await flushMicrotasks();

    assert.equal(blocked.attempts, 4,
        "the first gesture must remain an invisible final fallback");
    assert.equal(blocked.Arcade404.homeMusic.isPlaying(), true,
        "the invisible gesture fallback must start Inicio when policy permits it");


    /* Davinchi no crea una descarga extra hasta que se pulsa su figura. La
       pista entra progresivamente y baja Inicio, sin convertirse en ruta u
       overlay; Música global puede detenerla sin romper la portada. */
    const davinchi = createHarness(() => true, {
        native: true,
        nativePlaying: true,
        withDavinchi: true,
        reducedMotion: false
    });

    davinchi.document.emit("DOMContentLoaded");
    assert.equal(davinchi.tracks.length, 0,
        "Davinchi must not create audio before the user presses the character");

    davinchi.davinchiButton.emit("click");
    await flushMicrotasks();

    const davinchiTrack = davinchi.tracks.find((track) => track.id === "audio.davinchi");
    assert.ok(davinchiTrack,
        "pressing Davinchi must request the delivered audio.davinchi track");
    assert.equal(davinchi.Arcade404.homeDavinchiAudio.isPlaying(), true,
        "Davinchi playback must be marked active after the user gesture");
    assert.equal(davinchi.davinchiButton.attributes["aria-pressed"], "true",
        "the Davinchi control must expose active playback to assistive tech");
    assert.match(davinchi.homeAudioStatus.textContent, /Davinchi/,
        "the character interaction must announce its playback state accessibly");

    davinchi.advanceFrames(320);
    assert(davinchi.nativeTrack.volume > 0 && davinchi.nativeTrack.volume < 0.16,
        "Inicio must duck gradually while Davinchi is playing");
    assert(davinchiTrack.volume > 0.01 && davinchiTrack.volume < 0.48,
        "Davinchi must fade in instead of appearing at full volume");

    davinchi.setMusicEnabled(false);
    davinchi.Arcade404.homeDavinchiAudio.sync();
    assert.equal(davinchiTrack.paused, true,
        "the global music setting must stop the Davinchi test track");
    assert.equal(davinchi.Arcade404.homeDavinchiAudio.isPlaying(), false,
        "the Davinchi state must clear after global music is disabled");

    console.log("✓ HOME/HUB audio smoke: parser autoplay, crossfade de tensión, Davinchi y fallbacks invisibles");

}


run().catch((error) => {

    console.error(error.stack || error);
    process.exitCode = 1;

});
