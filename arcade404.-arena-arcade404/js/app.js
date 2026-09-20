/* =========================================================
   ARCADE 404 — BOOTSTRAP
   Punto de entrada: arranque, reloj, sonido, rutas y
   enrutado global de teclado.
   ========================================================= */

(function (A) {

    "use strict";


    const { utils } = A;


    /* ---------------------------------------------------------
       ELEMENTOS
       --------------------------------------------------------- */

    const dom = {

        boot: utils.qs("#boot"),
        bootBar: utils.qs("#bootBar"),
        bootLog: utils.qs("#bootLog"),

        soundToggle: utils.qs("#soundToggle"),
        musicToggle: utils.qs("#musicToggle"),
        hubButton: utils.qs("#hubButton"),
        vipButton: utils.qs("#vipButton"),
        vipHubButton: utils.qs("#vipHubButton"),
        homeVipColinas: utils.qs("#homeVipColinas"),
        homeDavinchi: utils.qs("#homeDavinchi"),
        homeAudioStatus: utils.qs("#homeAudioStatus"),
        vipBalance: utils.qs("#vipBalance"),

        brand: utils.qs("#brandHome"),
        enter: utils.qs("#enterArcade"),
        arcadeTransition: utils.qs("#arcadeTransition"),
        homeMusicNative: utils.qs("#homeMusicNative"),
        hubTensionMusicNative: utils.qs("#hubTensionMusicNative"),

        screenHome: utils.qs("#screen-home"),
        screenHub: utils.qs("#screen-hub"),
        screenVip: utils.qs("#screen-vip"),
        vipCentral: utils.qs("#vipCentral"),
        gameRoot: utils.qs("#gameRoot"),

        grid: utils.qs("#gameGrid"),
        hubCount: utils.qs("#hubCount"),

        clock: utils.qs("#clock"),
        liveRegion: utils.qs("#liveRegion")

    };


    /* Se asigna durante initNavigation y también lo usa el atajo ENTER de
       HOME para que ratón y teclado compartan exactamente la misma cortina. */
    let enterArcade = null;


    const BOOT_LINES = [
        "BOOTING ARCADE 404",
        "LOADING GAME ROMS",
        "CALIBRATING CONTROLS",
        "SYSTEM ONLINE"
    ];


    /* ---------------------------------------------------------
       ARRANQUE
       --------------------------------------------------------- */

    function runBoot() {

        if (!dom.boot) {
            return;
        }

        const instant = utils.prefersReducedMotion();

        const duration = instant ? 0 : 1100;

        let finished = false;


        function finish() {

            if (finished) {
                return;
            }

            finished = true;

            dom.boot.classList.add("is-done");

            setTimeout(() => {

                if (dom.boot.parentNode) {
                    dom.boot.setAttribute("hidden", "");
                }

            }, 600);

        }


        if (instant) {

            dom.bootLog.textContent = BOOT_LINES[BOOT_LINES.length - 1];

            finish();

            return;

        }


        dom.bootBar.style.transition =
            `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;

        requestAnimationFrame(() => {
            dom.bootBar.style.transform = "scaleX(1)";
        });


        const step = duration / BOOT_LINES.length;

        BOOT_LINES.forEach((line, index) => {

            setTimeout(() => {

                dom.bootLog.textContent = line;

            }, index * step);

        });


        setTimeout(finish, duration + 220);


        /* El usuario puede saltar la intro */
        const skip = () => finish();

        document.addEventListener("keydown", skip, { once: true });
        document.addEventListener("pointerdown", skip, { once: true });

    }


    /* ---------------------------------------------------------
       SONIDO
       --------------------------------------------------------- */

    function initSound() {

        const button = dom.soundToggle;

        if (!button) {
            return;
        }

        /* Única fuente de verdad para el estado del sonido en la UI */
        A.syncSoundUI = function syncSoundUI() {

            const enabled = A.audio.isEnabled();

            const targets = utils.qsa("#soundToggle");

            utils.qsa('[data-role="sound-glyph"]').forEach((glyph) => {

                glyph.textContent = enabled ? "♪" : "✕";

                const holder = glyph.closest(".icon-button");

                if (holder) {
                    targets.push(holder);
                }

            });

            targets.forEach((node) => {

                node.setAttribute("aria-pressed", enabled ? "true" : "false");

                node.title = enabled
                    ? "Silenciar efectos"
                    : "Activar efectos de sonido";

                const glyph = node.querySelector(".icon-button__glyph");

                if (glyph && !glyph.hasAttribute("data-role")) {
                    glyph.textContent = enabled ? "♪" : "✕";
                }

            });

        };


        button.addEventListener("click", () => {

            const enabled = A.audio.toggle();

            A.syncSoundUI();

            if (!enabled && typeof A.stopInterfaceClick === "function") {
                A.stopInterfaceClick();
            }

            if (enabled) {
                A.audio.play("coin");
            }

        });


        /* Música: interruptor propio, para poder jugar con efectos
           pero sin la banda sonora (o al revés). */
        if (dom.musicToggle) {

            A.syncMusicUI = function syncMusicUI() {

                const on = A.audio.isMusicEnabled();

                dom.musicToggle.setAttribute("aria-pressed", on ? "true" : "false");

                dom.musicToggle.title = on
                    ? "Silenciar la música"
                    : "Activar la música";

                dom.musicToggle.classList.toggle("is-off", !on);

                const glyph = dom.musicToggle.querySelector(".icon-button__glyph");

                if (glyph) {
                    glyph.textContent = on ? "♫" : "✕";
                }

                if (A.homeMusic && typeof A.homeMusic.sync === "function") {
                    A.homeMusic.sync();
                }

                if (A.hubMusic && typeof A.hubMusic.sync === "function") {
                    A.hubMusic.sync();
                }

                if (A.homeDavinchiAudio && typeof A.homeDavinchiAudio.sync === "function") {
                    A.homeDavinchiAudio.sync();
                }

            };

            dom.musicToggle.addEventListener("click", () => {

                A.audio.toggleMusic();

                A.syncMusicUI();

            });

            A.syncMusicUI();

        }


        A.syncSoundUI();


        /* Los navegadores exigen un gesto previo */
        const unlock = () => A.audio.unlock();

        document.addEventListener("pointerdown", unlock, { once: true });
        document.addEventListener("keydown", unlock, { once: true });

    }


    /* ---------------------------------------------------------
       AUDIO LOCAL DE INTERFAZ, HOME Y HUB

       El click entregado se comparte en toda la interfaz. Se crea
       sólo en la primera interacción y respeta el interruptor SFX.
       Inicio es exclusiva de HOME; tensión se prepara para el selector.
       Ambas se coordinan con un crossfade al pulsar ENTER y conservan sus
       reintentos/fallbacks de política sin mostrar controles adicionales.
       --------------------------------------------------------- */

    function initLocalAudio() {

        const HOME_VOLUME = 0.16;
        const HUB_VOLUME = 0.14;
        /* El cierre termina a los 590ms; Inicio conserva un tramo de
           caída durante la apertura para solaparse con tensión de verdad. */
        const HOME_TO_HUB_FADE_MS = 900;
        const HUB_FADE_IN_MS = 720;
        const HUB_FADE_OUT_MS = 340;
        const DAVINCHI_VOLUME = 0.48;
        const DAVINCHI_DUCKED_HOME_VOLUME = HOME_VOLUME * 0.36;
        const DAVINCHI_FADE_IN_MS = 620;
        const DAVINCHI_FADE_OUT_MS = 360;

        let clickTrack = null;

        let homeTrack = null;
        let homeRequested = false;
        let homeManuallyPaused = false;
        let homePlaying = false;
        let homeNeedsGesture = false;
        let homePlayPending = false;
        let homePlaybackVersion = 0;
        let homeFadeVersion = 0;
        let homeTransitionFading = false;

        /* La pista de Davinchi se crea sólo al pulsar su silueta: no añade
           descarga ni autoplay a HOME y puede apagarse con Música global. */
        let davinchiTrack = null;
        let davinchiPlaying = false;
        let davinchiPlayPending = false;
        let davinchiPlaybackVersion = 0;
        let davinchiFadeVersion = 0;

        let tensionTrack = null;
        let tensionRequested = false;
        let tensionPrepared = false;
        let tensionPlaying = false;
        let tensionPlayPending = false;
        let tensionPlaybackVersion = 0;
        let tensionFadeVersion = 0;


        function currentRouteType() {

            const route = A.router && A.router.getCurrent
                ? A.router.getCurrent()
                : null;

            return route && route.type ? route.type : "";

        }


        function isHomeRoute() {
            return currentRouteType() === "home";
        }


        function isHubRoute() {
            return currentRouteType() === "hub";
        }


        function musicEnabled() {
            return !A.audio || typeof A.audio.isMusicEnabled !== "function"
                ? true
                : A.audio.isMusicEnabled();
        }


        function soundEnabled() {
            return !A.audio || typeof A.audio.isEnabled !== "function"
                ? true
                : A.audio.isEnabled();
        }


        function clampVolume(value) {
            const numeric = Number(value);

            return Number.isFinite(numeric)
                ? Math.max(0, Math.min(1, numeric))
                : 0;
        }


        function setTrackVolume(track, value) {

            if (!track) {
                return;
            }

            try {
                track.volume = clampVolume(value);
            } catch (error) { /* media sin volumen programable */ }

        }


        function stopTrack(track, rewind = false) {

            if (!track) {
                return;
            }

            if (A.assets && typeof A.assets.stopAudio === "function") {
                A.assets.stopAudio(track, rewind);
                return;
            }

            try {
                track.pause();
            } catch (error) { /* navegador sin medios */ }

            if (rewind) {
                try {
                    track.currentTime = 0;
                } catch (error) { /* no-op */ }
            }

        }


        function rewindTrack(track) {

            if (!track) {
                return;
            }

            try {
                track.currentTime = 0;
            } catch (error) { /* decoder todavía sin metadatos */ }

        }


        function isTrackPlaying(track) {
            return Boolean(
                track
                && typeof track.paused === "boolean"
                && !track.paused
                && !track.ended
            );
        }


        function prefersReducedMotion() {
            return Boolean(
                utils
                && typeof utils.prefersReducedMotion === "function"
                && utils.prefersReducedMotion()
            );
        }


        function mediaNow() {
            return typeof performance !== "undefined" && performance.now
                ? performance.now()
                : Date.now();
        }


        function requestMediaFrame(callback) {

            const frame = typeof window.requestAnimationFrame === "function"
                ? window.requestAnimationFrame.bind(window)
                : (typeof requestAnimationFrame === "function"
                    ? requestAnimationFrame
                    : null);

            if (frame) {
                return frame(callback);
            }

            return window.setTimeout(() => callback(mediaNow()), 16);

        }


        /* Fundido lineal-eased sobre HTMLMediaElement.volume. Se usa para
           que Inicio y la pista de tensión se crucen sin un corte audible. */
        function fadeTrackVolume(track, target, duration, onFinish, stillCurrent) {

            if (!track) {
                return;
            }

            const from = clampVolume(track.volume);
            const to = clampVolume(target);

            const finish = () => {

                if (stillCurrent && !stillCurrent()) {
                    return;
                }

                setTrackVolume(track, to);

                if (typeof onFinish === "function") {
                    onFinish();
                }

            };

            if (
                prefersReducedMotion()
                || duration <= 0
                || Math.abs(to - from) < 0.002
            ) {
                finish();
                return;
            }

            const startedAt = mediaNow();

            const step = (frameTime) => {

                if (stillCurrent && !stillCurrent()) {
                    return;
                }

                const time = typeof frameTime === "number" ? frameTime : mediaNow();
                const progress = Math.max(0, Math.min(1, (time - startedAt) / duration));
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                setTrackVolume(track, from + (to - from) * eased);

                if (progress < 1) {
                    requestMediaFrame(step);
                } else {
                    finish();
                }

            };

            requestMediaFrame(step);

        }


        function ensureClickTrack() {

            if (!clickTrack && A.assets) {
                clickTrack = A.assets.createAudio("audio.click", {
                    volume: 0.2
                });
            }

            return clickTrack;

        }


        /* =========================================================
           DAVINCHI · prueba de interacción de personaje en HOME
           ========================================================= */

        function setDavinchiAudioState(active, announcement = "") {

            davinchiPlaying = Boolean(active);

            const button = dom.homeDavinchi;

            if (button) {
                if (button.classList && typeof button.classList.toggle === "function") {
                    button.classList.toggle("is-audio-playing", davinchiPlaying);
                }

                if (typeof button.setAttribute === "function") {
                    button.setAttribute("aria-pressed", davinchiPlaying ? "true" : "false");
                    button.setAttribute(
                        "aria-label",
                        davinchiPlaying
                            ? "Reiniciar la pista de Davinchi"
                            : "Reproducir la pista de Davinchi"
                    );
                }

                const operator = typeof button.closest === "function"
                    ? button.closest(".hero__operator")
                    : button.parentElement;

                if (operator && operator.classList && typeof operator.classList.toggle === "function") {
                    operator.classList.toggle("is-audio-playing", davinchiPlaying);
                }
            }

            if (announcement && dom.homeAudioStatus) {
                dom.homeAudioStatus.textContent = announcement;
            }

        }


        function restoreHomeMix(duration = DAVINCHI_FADE_OUT_MS) {

            if (
                !homeTrack ||
                !isHomeRoute() ||
                !musicEnabled() ||
                homeTransitionFading
            ) {
                return;
            }

            const version = davinchiFadeVersion;

            fadeTrackVolume(homeTrack, HOME_VOLUME, duration, null, () =>
                version === davinchiFadeVersion &&
                !homeTransitionFading &&
                isHomeRoute() &&
                musicEnabled()
            );

        }


        function duckHomeForDavinchi(version) {

            if (
                !homeTrack ||
                !isHomeRoute() ||
                !musicEnabled() ||
                homeTransitionFading
            ) {
                return;
            }

            fadeTrackVolume(homeTrack, DAVINCHI_DUCKED_HOME_VOLUME, 380, null, () =>
                version === davinchiFadeVersion &&
                !homeTransitionFading &&
                isHomeRoute() &&
                musicEnabled()
            );

        }


        function observeDavinchiTrack(track) {

            if (!track || typeof track.addEventListener !== "function") {
                return;
            }

            track.addEventListener("playing", () => {
                if (track === davinchiTrack) {
                    davinchiPlayPending = false;
                    setDavinchiAudioState(true);
                }
            });

            track.addEventListener("ended", () => {
                if (track !== davinchiTrack) {
                    return;
                }

                davinchiPlayPending = false;
                davinchiFadeVersion += 1;
                setDavinchiAudioState(false, "La pista de Davinchi terminó.");
                restoreHomeMix();
            });

            /* Si el archivo no puede decodificarse o descargarse, no bloquea
               HOME: se retira la mezcla y queda disponible el resto del juego. */
            track.addEventListener("error", () => {
                if (track !== davinchiTrack) {
                    return;
                }

                davinchiPlayPending = false;
                davinchiPlaybackVersion += 1;
                davinchiFadeVersion += 1;
                stopTrack(track, false);
                setDavinchiAudioState(false, "No se pudo reproducir la pista de Davinchi.");
                restoreHomeMix(0);
            });

        }


        function ensureDavinchiTrack() {

            if (!davinchiTrack && A.assets && typeof A.assets.createAudio === "function") {
                davinchiTrack = A.assets.createAudio("audio.davinchi", {
                    loop: false,
                    preload: "metadata",
                    volume: 0.01
                });
                observeDavinchiTrack(davinchiTrack);
            }

            return davinchiTrack;

        }


        function stopDavinchiPreview(options = {}) {

            const settings = Object.assign({
                rewind: false,
                fade: false,
                restoreHome: true
            }, options);
            const track = davinchiTrack;

            davinchiPlaybackVersion += 1;
            davinchiPlayPending = false;
            const version = ++davinchiFadeVersion;

            const finish = () => {

                if (version !== davinchiFadeVersion) {
                    return;
                }

                stopTrack(track, settings.rewind);
                setTrackVolume(track, 0.01);
                setDavinchiAudioState(false);

                if (settings.restoreHome) {
                    restoreHomeMix(0);
                }

            };

            if (settings.fade && isTrackPlaying(track) && !prefersReducedMotion()) {
                fadeTrackVolume(track, 0, DAVINCHI_FADE_OUT_MS, finish, () =>
                    version === davinchiFadeVersion
                );
            } else {
                finish();
            }

        }


        function playDavinchiPreview() {

            if (!isHomeRoute()) {
                return false;
            }

            if (!musicEnabled()) {
                setDavinchiAudioState(false, "Activa la música para escuchar la pista de Davinchi.");
                return false;
            }

            const track = ensureDavinchiTrack();

            if (!track || !A.assets || typeof A.assets.playAudio !== "function") {
                setDavinchiAudioState(false, "La pista de Davinchi no está disponible en este navegador.");
                return false;
            }

            const playbackVersion = ++davinchiPlaybackVersion;
            const fadeVersion = ++davinchiFadeVersion;
            davinchiPlayPending = true;

            rewindTrack(track);
            setTrackVolume(track, 0.01);
            setDavinchiAudioState(true, "Reproduciendo la pista de Davinchi.");
            duckHomeForDavinchi(fadeVersion);

            Promise.resolve(A.assets.playAudio(track, false))
                .then((started) => {

                    if (playbackVersion !== davinchiPlaybackVersion) {
                        return;
                    }

                    davinchiPlayPending = false;

                    if (!started) {
                        setDavinchiAudioState(false, "No se pudo reproducir la pista de Davinchi.");
                        restoreHomeMix(0);
                        return;
                    }

                    setDavinchiAudioState(true);
                    fadeTrackVolume(track, DAVINCHI_VOLUME, DAVINCHI_FADE_IN_MS, null, () =>
                        playbackVersion === davinchiPlaybackVersion &&
                        fadeVersion === davinchiFadeVersion &&
                        musicEnabled() &&
                        isHomeRoute()
                    );

                })
                .catch(() => {

                    if (playbackVersion !== davinchiPlaybackVersion) {
                        return;
                    }

                    davinchiPlayPending = false;
                    setDavinchiAudioState(false, "No se pudo reproducir la pista de Davinchi.");
                    restoreHomeMix(0);

                });

            return true;

        }


        A.homeDavinchiAudio = {

            play: playDavinchiPreview,

            stop(options) {
                stopDavinchiPreview(options);
            },

            sync() {
                if (!musicEnabled() || !isHomeRoute() || document.hidden) {
                    stopDavinchiPreview({ rewind: false, fade: false, restoreHome: false });
                }
            },

            isPlaying() {
                return davinchiPlaying || davinchiPlayPending;
            }

        };


        /* =========================================================
           INICIO · pista declarativa que puede arrancar con parser
           ========================================================= */

        function observeHomeTrack(track) {

            if (!track || typeof track.addEventListener !== "function") {
                return;
            }

            /* Un <audio> declarativo puede comenzar antes de que llegue
               app.js. Estos eventos sincronizan ese arranque nativo con el
               estado interno sin necesitar ninguna interacción. */
            track.addEventListener("playing", () => {
                homePlaying = true;
                homePlayPending = false;
                homeNeedsGesture = false;
            });

            track.addEventListener("pause", () => {
                if (!homePlayPending && !homeTransitionFading) {
                    homePlaying = false;
                }
            });

            /* Algunos navegadores rechazan play() mientras el decoder aún
               prepara la pista. `canplay` aporta un reintento automático
               pero acotado, separado del fallback por gesto. */
            track.addEventListener("canplay", () => {
                if (!homePlaying && !homePlayPending) {
                    requestAutomaticHomePlayback();
                }
            }, { once: true });

        }


        function configureHomeTrack(track) {

            if (!track) {
                return null;
            }

            track.autoplay = true;
            track.loop = true;
            track.preload = "auto";
            track.playsInline = true;
            setTrackVolume(track, HOME_VOLUME);

            observeHomeTrack(track);

            return track;

        }


        function ensureHomeTrack() {

            if (homeTrack) {
                return homeTrack;
            }

            /* El elemento está en el HTML para que el parser y el motor de
               medios tengan una oportunidad de autoplay antes del bootstrap.
               Se conserva la creación programática como respaldo si falta. */
            if (dom.homeMusicNative) {
                homeTrack = configureHomeTrack(dom.homeMusicNative);
            } else if (A.assets) {
                homeTrack = configureHomeTrack(A.assets.createAudio("audio.inicio", {
                    autoplay: true,
                    loop: true,
                    preload: "auto",
                    volume: HOME_VOLUME
                }));
            }

            return homeTrack;

        }


        function pauseHomeTrack() {

            /* Invalida una promesa de play() que pueda resolverse después
               de salir de HOME o de silenciar la música. */
            homePlaybackVersion += 1;
            homeFadeVersion += 1;
            homePlayPending = false;
            homeTransitionFading = false;

            stopDavinchiPreview({
                rewind: false,
                fade: false,
                restoreHome: false
            });

            if (homeTrack) {
                stopTrack(homeTrack, false);
                setTrackVolume(homeTrack, HOME_VOLUME);
            }

            homePlaying = false;

        }


        function resumeHomeTrack() {

            homeFadeVersion += 1;
            homeTransitionFading = false;

            const canPlay =
                homeRequested
                && !homeManuallyPaused
                && musicEnabled()
                && isHomeRoute()
                && !document.hidden;

            if (!canPlay) {
                pauseHomeTrack();
                return;
            }

            const track = ensureHomeTrack();

            if (!track || !A.assets) {
                homePlaying = false;
                return;
            }

            setTrackVolume(track, HOME_VOLUME);

            /* Si el autoplay declarativo ya fue aceptado durante el parseo,
               no volvemos a invocar play() ni reiniciamos la pista. */
            if (isTrackPlaying(track)) {
                homePlaying = true;
                homePlayPending = false;
                homeNeedsGesture = false;
                return;
            }

            /* Evita carreras entre el intento inmediato, canplay, pageshow y
               window.load; el siguiente evento reintenta si este falla. */
            if (homePlayPending) {
                return;
            }

            const version = homePlaybackVersion + 1;
            homePlaybackVersion = version;
            homePlayPending = true;
            homePlaying = true;

            const playback = A.assets.playAudio(track, false);

            Promise.resolve(playback)
                .then((started) => {

                    if (version !== homePlaybackVersion) {
                        return;
                    }

                    homePlayPending = false;
                    homePlaying = Boolean(started);
                    homeNeedsGesture = !started;

                })
                .catch(() => {

                    if (version !== homePlaybackVersion) {
                        return;
                    }

                    homePlayPending = false;
                    homePlaying = false;
                    homeNeedsGesture = true;

                });

        }


        function requestAutomaticHomePlayback() {

            if (
                !isHomeRoute()
                || homeManuallyPaused
                || (homePlaying && !homePlayPending)
            ) {
                return;
            }

            homeRequested = true;
            homeNeedsGesture = false;
            resumeHomeTrack();

        }


        function fadeHomeForHub(duration = HOME_TO_HUB_FADE_MS) {

            /* Si Davinchi está sonando, sale en paralelo con Inicio. Así no
               queda una voz/pista aislada detrás de la cortina del selector. */
            stopDavinchiPreview({
                rewind: false,
                fade: true,
                restoreHome: false
            });

            const track = ensureHomeTrack();

            homePlaybackVersion += 1;
            homePlayPending = false;
            homeNeedsGesture = false;
            homeFadeVersion += 1;
            homeTransitionFading = true;

            const version = homeFadeVersion;

            if (!track || (!homePlaying && !isTrackPlaying(track))) {
                homeTransitionFading = false;
                homePlaying = false;
                return;
            }

            fadeTrackVolume(track, 0, duration, () => {

                if (version !== homeFadeVersion) {
                    return;
                }

                stopTrack(track, false);
                setTrackVolume(track, HOME_VOLUME);
                homePlaying = false;
                homeTransitionFading = false;

            }, () => version === homeFadeVersion);

        }


        function activateHomeFromGesture() {

            if (!isHomeRoute() || homeManuallyPaused) {
                return;
            }

            /* Es el respaldo obligatorio de las políticas de autoplay:
               no se muestra un botón de ambiente, pero cualquier gesto
               válido vuelve a intentar la pista si el navegador la vetó. */
            if (homePlaying && !homePlayPending && !homeNeedsGesture) {
                return;
            }

            homeRequested = true;
            homeNeedsGesture = false;
            resumeHomeTrack();

        }


        A.homeMusic = {

            start() {
                homeRequested = true;
                homeManuallyPaused = false;
                homeNeedsGesture = false;
                resumeHomeTrack();
            },


            pause() {
                homeManuallyPaused = true;
                pauseHomeTrack();
            },


            /* No es una pausa manual: conserva la posibilidad de que Inicio
               vuelva al regresar a HOME, pero lo retira suavemente al hub. */
            fadeOut(duration) {
                fadeHomeForHub(duration);
            },


            isFading() {
                return homeTransitionFading;
            },


            toggle() {
                if (homePlaying && !homePlayPending) {
                    this.pause();
                } else {
                    this.start();
                }
            },


            sync() {
                resumeHomeTrack();
            },


            isPlaying() {
                return homePlaying;
            }

        };


        /* =========================================================
           HUB · Ambiente de tensión local con relevo en crossfade
           ========================================================= */

        function observeTensionTrack(track) {

            if (!track || typeof track.addEventListener !== "function") {
                return;
            }

            track.addEventListener("playing", () => {
                tensionPlaying = true;
                tensionPlayPending = false;
            });

            track.addEventListener("pause", () => {
                if (!tensionPlayPending) {
                    tensionPlaying = false;
                }
            });

            /* Durante la transición aún estamos visualmente en HOME, por eso
               `tensionPrepared` también autoriza este reintento de decoder. */
            track.addEventListener("canplay", () => {
                if (
                    tensionRequested
                    && !tensionPlaying
                    && !tensionPlayPending
                    && (tensionPrepared || isHubRoute())
                ) {
                    requestTensionPlayback(tensionPrepared);
                }
            }, { once: true });

        }


        function configureTensionTrack(track) {

            if (!track) {
                return null;
            }

            track.autoplay = false;
            track.loop = true;
            track.preload = "auto";
            track.playsInline = true;
            setTrackVolume(track, 0);

            observeTensionTrack(track);

            return track;

        }


        function ensureTensionTrack() {

            if (tensionTrack) {
                return tensionTrack;
            }

            /* Este audio no usa autoplay: se precarga, y ENTER lo inicia
               en volumen cero dentro del gesto antes de subirlo en el swap. */
            if (dom.hubTensionMusicNative) {
                tensionTrack = configureTensionTrack(dom.hubTensionMusicNative);
            } else if (A.assets) {
                tensionTrack = configureTensionTrack(A.assets.createAudio("audio.tension", {
                    autoplay: false,
                    loop: true,
                    preload: "auto",
                    volume: 0
                }));
            }

            return tensionTrack;

        }


        function requestTensionPlayback(allowBeforeHub = false) {

            const canPlay =
                tensionRequested
                && musicEnabled()
                && !document.hidden
                && (allowBeforeHub || isHubRoute());

            if (!canPlay) {
                return null;
            }

            const track = ensureTensionTrack();

            if (!track || !A.assets) {
                tensionPlaying = false;
                return null;
            }

            if (isTrackPlaying(track)) {
                tensionPlaying = true;
                tensionPlayPending = false;
                return track;
            }

            if (tensionPlayPending) {
                return track;
            }

            const version = tensionPlaybackVersion + 1;
            tensionPlaybackVersion = version;
            tensionPlayPending = true;

            const playback = A.assets.playAudio(track, false);

            Promise.resolve(playback)
                .then((started) => {

                    if (version !== tensionPlaybackVersion) {
                        return;
                    }

                    tensionPlayPending = false;
                    tensionPlaying = Boolean(started);

                })
                .catch(() => {

                    if (version !== tensionPlaybackVersion) {
                        return;
                    }

                    tensionPlayPending = false;
                    tensionPlaying = false;

                });

            return track;

        }


        function stopTensionTrack(duration = 0) {

            tensionRequested = false;
            tensionPrepared = false;
            tensionPlaybackVersion += 1;
            tensionPlayPending = false;
            tensionFadeVersion += 1;

            const track = tensionTrack;
            const version = tensionFadeVersion;

            if (!track) {
                tensionPlaying = false;
                return;
            }

            const finish = () => {

                if (version !== tensionFadeVersion) {
                    return;
                }

                stopTrack(track, true);
                setTrackVolume(track, 0);
                tensionPlaying = false;

            };

            if (duration > 0 && isTrackPlaying(track)) {
                fadeTrackVolume(track, 0, duration, finish,
                    () => version === tensionFadeVersion);
            } else {
                finish();
            }

        }


        function prepareTensionForHub() {

            if (!musicEnabled() || document.hidden) {
                return false;
            }

            tensionRequested = true;
            tensionPrepared = true;

            const track = ensureTensionTrack();

            if (!track) {
                tensionPrepared = false;
                return false;
            }

            tensionFadeVersion += 1;
            setTrackVolume(track, 0);

            if (!isTrackPlaying(track)) {
                rewindTrack(track);
                requestTensionPlayback(true);
            }

            return true;

        }


        function startHubTension() {

            const canPlay = musicEnabled() && isHubRoute() && !document.hidden;

            if (!canPlay) {
                stopTensionTrack();
                return;
            }

            tensionRequested = true;

            const track = ensureTensionTrack();

            if (!track) {
                tensionPlaying = false;
                return;
            }

            const wasPrepared = tensionPrepared;

            if (!wasPrepared && !isTrackPlaying(track)) {
                setTrackVolume(track, 0);
                rewindTrack(track);
            }

            requestTensionPlayback(wasPrepared);
            tensionPrepared = false;

            tensionFadeVersion += 1;
            const version = tensionFadeVersion;

            fadeTrackVolume(track, HUB_VOLUME, HUB_FADE_IN_MS, null,
                () => version === tensionFadeVersion);

        }


        function activateTensionFromGesture() {

            if (!isHubRoute() || !tensionRequested || tensionPlaying) {
                return;
            }

            startHubTension();

        }


        A.hubMusic = {

            /* Se llama dentro del click de ENTER. play() ocurre mientras el
               gesto sigue activo y permanece inaudible hasta el swap visual. */
            prepareTransition() {
                return prepareTensionForHub();
            },


            start() {
                startHubTension();
            },


            stop(options = {}) {
                stopTensionTrack(options.fade ? HUB_FADE_OUT_MS : 0);
            },


            sync() {
                if (isHubRoute() && musicEnabled() && !document.hidden) {
                    startHubTension();
                } else {
                    stopTensionTrack();
                }
            },


            isPrepared() {
                return tensionPrepared;
            },


            isPlaying() {
                return tensionPlaying;
            }

        };


        A.playInterfaceClick = function playInterfaceClick() {

            if (!soundEnabled() || !A.assets) {
                return;
            }

            A.assets.playAudio(ensureClickTrack(), true);

        };


        A.stopInterfaceClick = function stopInterfaceClick() {

            if (clickTrack && A.assets) {
                A.assets.stopAudio(clickTrack, false);
            }

        };


        /* Un clic/tap sobre cualquier control recibe el sample real.
           Captura primero para cubrir botones generados dinámicamente,
           overlays, el hub y los controles de cada juego. */
        document.addEventListener("click", (event) => {

            const target = event.target && typeof event.target.closest === "function"
                ? event.target.closest(
                    "button, a[href], [role='button'], summary, "
                    + "input[type='button'], input[type='submit'], input[type='reset'], "
                    + "input[type='checkbox'], input[type='radio'], select, [data-action]"
                )
                : null;

            if (!target || target.disabled || target.closest("[data-no-interface-click]")) {
                return;
            }

            A.playInterfaceClick();

        }, true);


        /* Inicio ya recibió un intento declarativo durante el parseo. Aquí
           se hace el intento explícito inmediato y, si hace falta, los de
           canplay, window.load y pageshow sin esperar un gesto del usuario. */
        if (isHomeRoute()) {
            requestAutomaticHomePlayback();
        } else if (isHubRoute()) {
            /* Un enlace directo al selector puede haber alcanzado Inicio
               antes de que app.js lea el hash: se corta antes de encender
               la tensión correspondiente al módulo actual. */
            if (dom.homeMusicNative) {
                ensureHomeTrack();
                pauseHomeTrack();
            }

            startHubTension();
        } else if (dom.homeMusicNative) {
            /* Un enlace directo a un juego puede haber alcanzado el autoplay
               declarativo antes de que el router se inicialice. */
            ensureHomeTrack();
            pauseHomeTrack();
        }

        if (document.readyState !== "complete") {
            window.addEventListener("load", () => {
                requestAutomaticHomePlayback();

                if (isHubRoute()) {
                    startHubTension();
                }
            }, { once: true });
        }

        /* pageshow cubre restauraciones desde bfcache y navegadores que
           liberan el pipeline de medios justo cuando la página se presenta. */
        window.addEventListener("pageshow", () => {
            requestAutomaticHomePlayback();

            if (isHubRoute()) {
                startHubTension();
            }
        });


        /* Si una política del navegador rechazó los intentos automáticos,
           el primer gesto sirve de fallback. No hay botón extra en HOME ni
           en el selector: la tensión se reintenta con cualquier gesto. */
        document.addEventListener("pointerdown", activateHomeFromGesture, {
            capture: true,
            passive: true
        });
        document.addEventListener("pointerdown", activateTensionFromGesture, {
            capture: true,
            passive: true
        });
        document.addEventListener("keydown", activateHomeFromGesture, true);
        document.addEventListener("keydown", activateTensionFromGesture, true);


        if (A.router && typeof A.router.onChange === "function") {
            A.router.onChange((route, previous) => {

                if (route && route.type === "home") {

                    A.hubMusic.stop({
                        fade: Boolean(previous && previous.type === "hub")
                    });

                    if (!homeManuallyPaused) {
                        requestAutomaticHomePlayback();
                    }

                    return;

                }

                if (route && route.type === "hub") {

                    /* La entrada animada ya pudo iniciar el fundido. Si se
                       llega por otra ruta, se crea el mismo relevo seguro. */
                    if (previous && previous.type === "home" && !homeTransitionFading) {
                        A.homeMusic.fadeOut();
                    } else if (!previous || previous.type !== "home") {
                        pauseHomeTrack();
                    }

                    A.hubMusic.start();
                    return;

                }

                pauseHomeTrack();
                A.hubMusic.stop();

            });
        }

    }


    /* ---------------------------------------------------------
       RELOJ
       --------------------------------------------------------- */

    function initClock() {

        if (!dom.clock) {
            return;
        }

        function tick() {

            const now = new Date();

            dom.clock.textContent = [
                utils.pad(now.getHours(), 2),
                utils.pad(now.getMinutes(), 2),
                utils.pad(now.getSeconds(), 2)
            ].join(":");

        }

        tick();

        setInterval(tick, 1000);

    }


    /* ---------------------------------------------------------
       NAVEGACIÓN
       --------------------------------------------------------- */

    function initNavigation() {

        const HUB_SWAP_DELAY = 590;
        const HUB_TRANSITION_END = 1260;
        let enteringArcade = false;


        /* HOME no desaparece de golpe: la cortina de listones cubre la
           portada, el router monta el hub bajo ella y luego lo revela.
           La tensión se pone en play a volumen cero dentro del gesto para
           conservar permiso de audio antes de que venza la activación. */
        enterArcade = function enterArcade() {

            const route = A.router && A.router.getCurrent
                ? A.router.getCurrent()
                : null;

            if (enteringArcade || !route || route.type !== "home") {
                return;
            }

            enteringArcade = true;

            A.audio.unlock();
            A.audio.play("select");

            if (A.homeMusic && typeof A.homeMusic.fadeOut === "function") {
                A.homeMusic.fadeOut();
            }

            if (A.hubMusic && typeof A.hubMusic.prepareTransition === "function") {
                A.hubMusic.prepareTransition();
            }

            const curtain = dom.arcadeTransition;
            const instant = utils.prefersReducedMotion() || !curtain;

            if (instant) {
                A.router.go("hub");
                enteringArcade = false;
                return;
            }

            document.body.classList.add("is-arcade-transitioning");

            curtain.hidden = false;
            curtain.classList.remove("is-closing", "is-opening");
            curtain.classList.add("is-active");

            /* El reflow separa display:none del primer frame de la animación. */
            void curtain.offsetWidth;
            curtain.classList.add("is-closing");

            window.setTimeout(() => {

                if (!enteringArcade) {
                    return;
                }

                curtain.classList.remove("is-closing");
                curtain.classList.add("is-opening");

                /* En este punto los listones ya cubrieron HOME: el hub y el
                   fade-in de tensión nacen exactamente detrás de la cortina. */
                A.router.go("hub");

            }, HUB_SWAP_DELAY);

            window.setTimeout(() => {

                curtain.classList.remove("is-active", "is-opening");
                curtain.hidden = true;

                document.body.classList.remove("is-arcade-transitioning");
                enteringArcade = false;

            }, HUB_TRANSITION_END);

        };


        if (dom.enter) {
            dom.enter.addEventListener("click", enterArcade);
        }


        if (dom.hubButton) {

            dom.hubButton.addEventListener("click", () => {

                A.audio.play("back");

                A.router.go("hub");

            });

        }


        const openVipCentral = (source) => {
            /* La sala sabe si llegaste por el anfitrión o por la navegación
               normal. Sólo la llegada desde su personaje activa su recibo
               personal; los otros accesos conservan una bienvenida breve. */
            if (A.vipCentral) {
                if (source === "colinas" && typeof A.vipCentral.receiveFromColinas === "function") {
                    A.vipCentral.receiveFromColinas();
                } else if (typeof A.vipCentral.receiveNormally === "function") {
                    A.vipCentral.receiveNormally();
                }
            }

            A.audio.play("select");
            A.router.go("vip");
        };

        [
            [dom.vipButton, "menu"],
            [dom.vipHubButton, "hub"],
            [dom.homeVipColinas, "colinas"]
        ].forEach(([button, source]) => {
            if (button) {
                button.addEventListener("click", () => openVipCentral(source));
            }
        });

        /* Davinchi es una prueba de interacción de personaje: no navega ni
           abre overlays; sólo inicia su pista local con el gesto del usuario. */
        if (dom.homeDavinchi) {
            dom.homeDavinchi.addEventListener("click", () => {
                A.audio.unlock();

                if (A.homeDavinchiAudio && typeof A.homeDavinchiAudio.play === "function") {
                    A.homeDavinchiAudio.play();
                }
            });

            dom.homeDavinchi.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                }
            });
        }

        /* HOME usa ENTER como acceso general al arcade. Al enfocar a
           Colinas, ENTER/ESPACIO deben activar sólo su botón VIP nativo y
           no disparar en paralelo la cortina hacia el hub. */
        if (dom.homeVipColinas) {
            dom.homeVipColinas.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                }
            });
        }


        if (dom.brand) {

            dom.brand.addEventListener("click", () => {
                A.audio.play("back");
            });

        }

    }


    /* ---------------------------------------------------------
       TECLADO GLOBAL
       --------------------------------------------------------- */

    function initKeyboard() {

        A.input.subscribe((key, event) => {

            const route = A.router.getCurrent();

            if (!route) {
                return;
            }


            /* Silenciar con M en cualquier pantalla */
            if (key === "m" || key === "M") {

                if (dom.soundToggle) {
                    dom.soundToggle.click();
                }

                return;

            }


            if (route.type === "home") {

                if (key === "Enter" || key === " ") {

                    event.preventDefault();

                    if (typeof enterArcade === "function") {
                        enterArcade();
                    }

                }

                return;

            }


            if (route.type === "hub") {

                if (key === "v" || key === "V") {
                    event.preventDefault();
                    if (A.vipCentral && typeof A.vipCentral.receiveNormally === "function") {
                        A.vipCentral.receiveNormally();
                    }
                    A.router.go("vip");
                    return;
                }

                if (key === "Escape") {

                    event.preventDefault();

                    A.audio.play("back");

                    A.router.go("home");

                    return;

                }

                if (A.hub.handleKey(key)) {
                    event.preventDefault();
                }

                return;

            }


            if (route.type === "vip") {
                /* La sala tiene su propia cinemática y menús desplegables.
                   Antes de salir al hub, ENTER/flechas/ESC se ofrecen a ese
                   flujo para que la introducción se pueda recorrer íntegra
                   con teclado y ESC cierre primero el panel abierto. */
                if (A.vipCentral && typeof A.vipCentral.handleKey === "function"
                    && A.vipCentral.handleKey(key, event)) {
                    event.preventDefault();
                    return;
                }

                if (key === "Escape") {
                    event.preventDefault();
                    A.audio.play("back");
                    A.router.go("hub");
                }
                return;
            }


            /* En partida manda el shell del juego */
            if (key === "Escape") {
                A.audio.play("back");
            }

        });

    }


    /* ---------------------------------------------------------
       CICLO DE VIDA
       --------------------------------------------------------- */

    function initLifecycle() {

        document.addEventListener("visibilitychange", () => {

            if (document.hidden) {
                A.router.pauseActive();
            }

            if (A.homeMusic && typeof A.homeMusic.sync === "function") {
                A.homeMusic.sync();
            }

            if (A.hubMusic && typeof A.hubMusic.sync === "function") {
                A.hubMusic.sync();
            }

            if (A.homeDavinchiAudio && typeof A.homeDavinchiAudio.sync === "function") {
                A.homeDavinchiAudio.sync();
            }

        });


        window.addEventListener("resize", utils.debounce(() => {

            const route = A.router.getCurrent();

            if (route && route.type === "game") {

                const shell = A.router.getShell(route.id);

                if (shell) {
                    shell._updateTouchVisibility();
                }

            }

        }, 200));

    }


    /* ---------------------------------------------------------
       INIT
       --------------------------------------------------------- */

    let initialized = false;


    function init() {

        /* Evita registrar atajos, timers y audio dos veces si un
           contenedor vuelve a emitir DOMContentLoaded. */
        if (initialized) {
            return;
        }

        initialized = true;

        A.hub.init({
            grid: dom.grid,
            counter: dom.hubCount
        });

        if (A.vipCentral && typeof A.vipCentral.init === "function") {
            A.vipCentral.init({
                root: dom.vipCentral,
                balance: dom.vipBalance
            });
        }


        A.router.init({
            home: dom.screenHome,
            hub: dom.screenHub,
            vip: dom.screenVip,
            gameRoot: dom.gameRoot,
            liveRegion: dom.liveRegion
        });


        initSound();
        initLocalAudio();
        initNavigation();
        initKeyboard();
        initLifecycle();
        initClock();

        runBoot();


        console.log(
            "%c ARCADE 404 %c SYSTEM ONLINE ",
            "background:#8B5CF6;color:#06070B;font-weight:700",
            "background:#22D3EE;color:#06070B;font-weight:700"
        );

    }


    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})(window.Arcade404);
