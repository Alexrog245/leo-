/* =========================================================
   ARCADE 404 — MOTOR DE SONIDO
   Sintetizador WebAudio: sin archivos, sin dependencias.
   ========================================================= */

(function (A) {

    "use strict";


    const settings = A.storage.getSettings();


    let context = null;
    let master = null;
    let musicBus = null;

    let enabled = settings.sound !== false;


    function ensureContext() {

        if (context) {

            if (context.state === "suspended") {
                context.resume();
            }

            return context;

        }

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            return null;
        }

        context = new AudioContextClass();

        master = context.createGain();
        master.gain.value = 0.14;
        master.connect(context.destination);

        /* La música va por su propio bus, más bajita que los efectos */
        musicBus = context.createGain();
        musicBus.gain.value = 0.55;
        musicBus.connect(master);

        return context;

    }


    /** Nota simple con envolvente ADSR mínima */
    function tone(options) {

        if (!enabled) {
            return;
        }

        const ctx = ensureContext();

        if (!ctx) {
            return;
        }

        const {
            freq = 440,
            to = null,
            type = "square",
            duration = 0.08,
            gain = 0.5,
            delay = 0,
            bus = null,
            when = null,
            sweepLinear = false
        } = options;

        const start = when !== null ? when : ctx.currentTime + delay;
        const end = start + duration;

        const osc = ctx.createOscillator();
        const amp = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);

        if (to) {

            if (sweepLinear) {
                osc.frequency.linearRampToValueAtTime(Math.max(20, to), end);
            } else {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), end);
            }

        }

        amp.gain.setValueAtTime(0.0001, start);
        amp.gain.exponentialRampToValueAtTime(gain, start + 0.008);
        amp.gain.exponentialRampToValueAtTime(0.0001, end);

        osc.connect(amp);
        amp.connect(bus || master);

        osc.start(start);
        osc.stop(end + 0.02);

        return osc;

    }


    /** Ruido blanco filtrado (explosiones, impactos) */
    function noise(options) {

        if (!enabled) {
            return;
        }

        const ctx = ensureContext();

        if (!ctx) {
            return;
        }

        const {
            duration = 0.18,
            gain = 0.4,
            freq = 900,
            q = 1,
            delay = 0,
            bus = null,
            when = null,
            filter: filterType = "lowpass",
            sweepTo = null
        } = options;

        const frames = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < frames; i += 1) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = freq;
        filter.Q.value = q;

        const amp = ctx.createGain();

        const start = when !== null ? when : ctx.currentTime + delay;

        if (sweepTo) {
            filter.frequency.setValueAtTime(freq, start);
            filter.frequency.exponentialRampToValueAtTime(
                Math.max(40, sweepTo), start + duration
            );
        }

        amp.gain.setValueAtTime(gain, start);
        amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        source.connect(filter);
        filter.connect(amp);
        amp.connect(bus || master);

        source.start(start);

    }


    /** Secuencia de notas (melodías cortas) */
    function melody(notes, options = {}) {

        const { type = "square", gain = 0.45, duration = 0.1, step = 0.09 } = options;

        notes.forEach((freq, index) => {

            tone({
                freq,
                type,
                gain,
                duration,
                delay: index * step
            });

        });

    }


    const sounds = {

        /* Interfaz */
        move:    () => tone({ freq: 520, to: 640, type: "square", duration: 0.045, gain: 0.22 }),
        select:  () => melody([660, 880], { duration: 0.07, step: 0.06, gain: 0.3 }),
        back:    () => tone({ freq: 420, to: 260, type: "square", duration: 0.09, gain: 0.28 }),
        start:   () => melody([440, 660, 880, 1180], { duration: 0.09, step: 0.075, gain: 0.34 }),
        pause:   () => melody([520, 380], { duration: 0.1, step: 0.09, gain: 0.3 }),

        /* Snake */
        eat:     () => melody([880, 1240], { duration: 0.06, step: 0.05, gain: 0.34 }),
        turn:    () => tone({ freq: 300, to: 380, type: "triangle", duration: 0.04, gain: 0.16 }),

        /* Acción */
        shoot:   () => tone({ freq: 1100, to: 420, type: "sawtooth", duration: 0.09, gain: 0.26 }),
        hit:     () => noise({ duration: 0.14, gain: 0.32, freq: 1400 }),
        bounce:  () => tone({ freq: 620, to: 520, type: "square", duration: 0.05, gain: 0.28 }),
        explode: () => noise({ duration: 0.34, gain: 0.45, freq: 620 }),
        brick:   () => tone({ freq: 780, to: 1180, type: "square", duration: 0.06, gain: 0.28 }),

        /* Tetris */
        rotate:  () => tone({ freq: 560, to: 700, type: "triangle", duration: 0.05, gain: 0.22 }),
        place:   () => tone({ freq: 240, to: 160, type: "square", duration: 0.07, gain: 0.26 }),
        line:    () => melody([784, 988, 1319], { duration: 0.09, step: 0.06, gain: 0.34 }),
        tetris:  () => melody([523, 659, 784, 1046, 1318], { duration: 0.11, step: 0.07, gain: 0.36 }),

        /* Chess */
        movePiece: () => tone({ freq: 300, to: 200, type: "triangle", duration: 0.07, gain: 0.3 }),
        capture:   () => noise({ duration: 0.16, gain: 0.35, freq: 900 }),
        check:     () => melody([880, 660, 880], { duration: 0.12, step: 0.11, gain: 0.32 }),

        /* Resultados */
        score:   () => melody([660, 990], { duration: 0.09, step: 0.07, gain: 0.3 }),
        gameover:() => melody([440, 350, 260, 180], { duration: 0.16, step: 0.13, gain: 0.34, type: "sawtooth" }),
        win:     () => melody([523, 659, 784, 1046], { duration: 0.13, step: 0.11, gain: 0.34 }),
        coin:    () => melody([988, 1319], { duration: 0.08, step: 0.07, gain: 0.32 }),


        /* ---------- OPERACIÓN 404: armas ---------- */

        /** Pistola de píxeles: chasquido corto y seco */
        pistola: () => {
            tone({ freq: 1500, to: 260, type: "square", duration: 0.07, gain: 0.3 });
            noise({ duration: 0.06, gain: 0.26, freq: 2600 });
        },

        /** Escopeta: golpe grave y ancho */
        escopeta: () => {
            noise({ duration: 0.3, gain: 0.5, freq: 1800, sweepTo: 220 });
            tone({ freq: 190, to: 60, type: "sawtooth", duration: 0.24, gain: 0.34 });
        },

        /** Ametralladora: seco, metálico, para repetir rápido */
        ametralladora: () => {
            tone({ freq: 720, to: 200, type: "square", duration: 0.045, gain: 0.22 });
            noise({ duration: 0.05, gain: 0.3, freq: 3200 });
        },

        /** Lanza-pasticho: lanzamiento blandito */
        pasticho: () => {
            tone({ freq: 300, to: 620, type: "sine", duration: 0.16, gain: 0.32 });
            noise({ duration: 0.12, gain: 0.2, freq: 700 });
        },

        /** Sin munición: clic hueco */
        vacio: () => tone({ freq: 180, to: 120, type: "square", duration: 0.05, gain: 0.2 }),

        /** Cambio de arma */
        arma: () => melody([420, 700], { duration: 0.05, step: 0.05, gain: 0.26, type: "square" }),

        /* ---------- OPERACIÓN 404: impactos y bichos ---------- */

        /** Impacto en enemigo: golpe húmedo */
        impacto: () => {
            noise({ duration: 0.1, gain: 0.34, freq: 1100, sweepTo: 300 });
            tone({ freq: 420, to: 180, type: "triangle", duration: 0.08, gain: 0.2 });
        },

        /** Enemigo abatido */
        muere: () => {
            noise({ duration: 0.26, gain: 0.4, freq: 900, sweepTo: 160 });
            tone({ freq: 340, to: 90, type: "sawtooth", duration: 0.3, gain: 0.26 });
        },

        /** Al jugador le dan */
        dano: () => {
            noise({ duration: 0.2, gain: 0.42, freq: 500, sweepTo: 140 });
            tone({ freq: 200, to: 110, type: "sawtooth", duration: 0.18, gain: 0.3 });
        },

        /* --- OPERACIÓN 404: habilidades --- */

        /** La Furia terminó de cargar: campanita metálica ascendente */
        furiaLista: () => melody([660, 880, 1180], {
            duration: 0.09,
            step: 0.06,
            gain: 0.3,
            type: "square"
        }),

        /** Se activa la Furia: rugido grave + sirena */
        furia: () => {

            noise({ duration: 0.5, gain: 0.4, freq: 340, sweepTo: 120 });

            tone({ freq: 180, to: 900, type: "sawtooth", duration: 0.4, gain: 0.3 });

        },

        /** Bombardeo de los Yanquis: silbido de caída y estallido */
        bombardeo: () => {

            tone({ freq: 1400, to: 200, type: "sine", duration: 0.45, gain: 0.22 });

            setTimeout(() => {
                noise({ duration: 0.7, gain: 0.5, freq: 480, sweepTo: 90 });
            }, 380);

        },

        /** El escudo de la Nutrivicha absorbe un golpe */
        escudo: () => melody([980, 1320], {
            duration: 0.1,
            step: 0.05,
            gain: 0.26,
            type: "sine"
        }),

        /** Abrir la bolsa del CLAP: plástico arrugado */
        bolsa: () => noise({ duration: 0.22, gain: 0.24, freq: 2600, sweepTo: 900 }),

        /** La bolsa trajo desgracia */
        clapMal: () => melody([420, 330, 240, 170], {
            duration: 0.14,
            step: 0.1,
            gain: 0.3,
            type: "sawtooth"
        }),

        /** La bolsa trajo algo bueno */
        clapBien: () => melody([523, 784, 1046], {
            duration: 0.11,
            step: 0.07,
            gain: 0.3
        }),

        /** Encontraste una sala secreta */
        secreto: () => melody([784, 988, 1319, 1568], {
            duration: 0.13,
            step: 0.09,
            gain: 0.32
        }),

        /** Consigna / grito de enemigo */
        grito: () => tone({ freq: 520, to: 300, type: "sawtooth", duration: 0.13, gain: 0.16 }),

        /** Línea telefónica imposible / señal rota de TURNO 404 */
        interferencia: () => {
            noise({ duration: 0.24, gain: 0.2, freq: 1750, q: 7, filter: "bandpass", sweepTo: 3100 });
            tone({ freq: 370, to: 980, type: "square", duration: 0.16, gain: 0.16, delay: 0.035 });
        },

        /** Susurro sintético del Manguangua: voz imposible, filtrada por un CRT.
            Es una textura original, no imita la voz de una persona. */
        manguanguaWhisper: () => {
            noise({ duration: 0.82, gain: 0.11, freq: 1250, q: 11, filter: "bandpass", sweepTo: 760 });
            tone({ freq: 146, to: 118, type: "sine", duration: 0.72, gain: 0.19 });
            tone({ freq: 690, to: 515, type: "triangle", duration: 0.18, gain: 0.1, delay: 0.08 });
            tone({ freq: 535, to: 760, type: "square", duration: 0.12, gain: 0.07, delay: 0.38 });
        },

        /** Grito agudo del Manguangua: doble chillido + estática rota.
            El nombre técnico se conserva por compatibilidad con el asset del jefe. */
        caprilesScream: () => {
            tone({ freq: 1320, to: 3180, type: "sawtooth", duration: 0.62, gain: 0.5 });
            tone({ freq: 2140, to: 980, type: "square", duration: 0.78, gain: 0.26, delay: 0.045 });
            tone({ freq: 2860, to: 3460, type: "sine", duration: 0.25, gain: 0.22, delay: 0.16 });
            noise({
                duration: 0.72,
                gain: 0.3,
                freq: 2100,
                q: 5,
                filter: "bandpass",
                sweepTo: 4800
            });
        },

        /** Rugido de jefe al aparecer */
        jefe: () => {
            tone({ freq: 150, to: 60, type: "sawtooth", duration: 0.7, gain: 0.34 });
            tone({ freq: 226, to: 88, type: "square", duration: 0.66, gain: 0.18, delay: 0.04 });
            noise({ duration: 0.6, gain: 0.28, freq: 400 });
        },

        /** Invocación de oleada */
        invocar: () => melody([180, 240, 300, 360], {
            duration: 0.14, step: 0.08, gain: 0.28, type: "sawtooth"
        }),

        /** Teletransporte del Manguangua */
        teleport: () => {
            tone({ freq: 200, to: 1800, type: "sine", duration: 0.22, gain: 0.26 });
            noise({ duration: 0.2, gain: 0.2, freq: 2400 });
        },

        /** Chorro de texto / discurso */
        discurso: () => noise({
            duration: 0.5, gain: 0.16, freq: 900, q: 6, filter: "bandpass"
        }),

        /** Cucharada del Sr. M */
        cuchara: () => {
            tone({ freq: 900, to: 1400, type: "triangle", duration: 0.09, gain: 0.24 });
            noise({ duration: 0.18, gain: 0.24, freq: 600 });
        },

        /** Pisar un charco */
        charco: () => noise({ duration: 0.16, gain: 0.2, freq: 420, sweepTo: 180 }),

        /* ---------- STACK: arena ---------- */

        /** La pieza se desmorona en arena */
        arena: () => noise({
            duration: 0.34, gain: 0.3, freq: 5200, sweepTo: 900, filter: "highpass"
        }),

        /** Granos asentándose */
        granos: () => noise({
            duration: 0.16, gain: 0.12, freq: 6000, filter: "highpass"
        })

    };


    /* =========================================================
       MÚSICA DE FONDO
       Secuenciador procedural: bajo + arpegio + percusión.
       Cada pista se programa por compases con lookahead, así no
       depende de setInterval preciso ni de archivos de audio.
       ========================================================= */

    const SCALE = {
        menor:    [0, 2, 3, 5, 7, 8, 10],
        frigia:   [0, 1, 3, 5, 7, 8, 10],
        menorArm: [0, 2, 3, 5, 7, 8, 11],
        mayor:    [0, 2, 4, 5, 7, 9, 11]
    };


    /** MIDI → Hz */
    function hz(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }


    const TRACKS = {

        /* Menú y hub: lento, ambiental */
        hub: {
            bpm: 96,
            root: 45,
            scale: "menor",
            wave: "triangle",
            bass: [0, null, 4, null, 2, null, 4, null],
            arp: [0, 4, 7, 11, 7, 4, 2, 4],
            drums: false,
            gain: 0.5
        },

        /* Arcades clásicos: chiptune saltarín */
        arcade: {
            bpm: 132,
            root: 45,
            scale: "menor",
            wave: "square",
            bass: [0, 0, 7, 0, 5, 5, 3, 7],
            arp: [12, 7, 10, 7, 12, 15, 12, 7],
            drums: true,
            gain: 0.42
        },

        /* STACK: arena que cae, más flotante */
        arena: {
            bpm: 104,
            root: 43,
            scale: "mayor",
            wave: "triangle",
            bass: [0, null, 5, null, 7, null, 4, null],
            arp: [7, 11, 14, 11, 9, 12, 16, 12],
            drums: true,
            gain: 0.44
        },

        /* Ajedrez: tenso y espaciado */
        tenso: {
            bpm: 76,
            root: 41,
            scale: "frigia",
            wave: "sine",
            bass: [0, null, null, null, 3, null, null, null],
            arp: [7, null, 8, null, 7, null, 3, null],
            drums: false,
            gain: 0.42
        },

        /* OPERACIÓN 404: metal industrial de DOOM */
        doom: {
            bpm: 150,
            root: 33,
            scale: "frigia",
            wave: "sawtooth",
            bass: [0, 0, 0, 1, 0, 0, 3, 1],
            arp: [12, 12, 15, 12, 18, 17, 15, 12],
            drums: true,
            heavy: true,
            gain: 0.5
        },

        /* ---- OPERACIÓN 404: una pista por mundo ----

           Todas comparten el ADN industrial de `doom`, pero cada
           mundo cambia de tonalidad, tempo y carácter para que se
           note dónde estás sin mirar el rótulo. */

        /* MUNDO 1 — oficinas: corporativo enfermo, tempo de reloj
           de fichar, ostinato repetitivo como el teléfono que no
           deja de sonar. */
        m1oficina: {
            bpm: 138,
            root: 35,
            scale: "menor",
            wave: "square",
            bass: [0, null, 0, 0, null, 3, 0, null],
            arp: [12, 14, 12, 10, 12, 14, 15, 14],
            drums: true,
            gain: 0.44
        },

        /* MUNDO 2 — la calle: más rápido y callejero, bajo
           sincopado con sabor a moto pasando. */
        m2calle: {
            bpm: 158,
            root: 33,
            scale: "menorArm",
            wave: "sawtooth",
            bass: [0, 0, 5, 0, 3, 0, 7, 5],
            arp: [12, 12, 17, 15, 12, 19, 17, 15],
            drums: true,
            heavy: true,
            gain: 0.48
        },

        /* MUNDO 3 — el gobierno: marcial y solemne, frigia densa,
           pasos de desfile. */
        m3gobierno: {
            bpm: 120,
            root: 29,
            scale: "frigia",
            wave: "sawtooth",
            bass: [0, null, 0, null, 1, null, 0, null],
            arp: [12, 13, 12, 8, 12, 13, 15, 13],
            drums: true,
            heavy: true,
            gain: 0.5
        },

        /* MUNDO 4 — la última cucharada: apocalíptico, lento y
           pesado, con el bajo más grave de todo el juego. */
        m4final: {
            bpm: 96,
            root: 26,
            scale: "frigia",
            wave: "sawtooth",
            bass: [0, 0, null, 1, 0, null, 3, 1],
            arp: [12, 15, 19, 15, 20, 19, 15, 12],
            drums: true,
            heavy: true,
            gain: 0.55
        },

        /* Sala VIP: lounge presumido, el mercader se lo tiene creído */
        vip: {
            bpm: 88,
            root: 40,
            scale: "mayor",
            wave: "triangle",
            bass: [0, null, 4, null, 5, null, 4, null],
            arp: [11, 14, 16, 14, 12, 16, 19, 16],
            drums: false,
            gain: 0.4
        },

        /* Sala secreta: cálida, breve, un respiro */
        secreta: {
            bpm: 104,
            root: 45,
            scale: "mayor",
            wave: "sine",
            bass: [0, null, null, 4, null, null, 5, null],
            arp: [7, 11, 14, 16, 14, 11, 9, 11],
            drums: false,
            gain: 0.38
        },

        /* Pelea de jefe: más rápido y agresivo */
        jefe: {
            bpm: 168,
            root: 31,
            scale: "menorArm",
            wave: "sawtooth",
            bass: [0, 0, 3, 0, 5, 3, 1, 0],
            arp: [12, 15, 12, 19, 18, 15, 12, 11],
            drums: true,
            heavy: true,
            gain: 0.55
        }

    };


    let musicTrack = null;
    let musicName = null;
    let musicTimer = null;
    let musicStep = 0;
    let musicNext = 0;
    let musicOn = settings.music !== false;


    function noteAt(track, degree) {

        const scale = SCALE[track.scale] || SCALE.menor;

        const octave = Math.floor(degree / 7);
        const index = ((degree % 7) + 7) % 7;

        return track.root + scale[index] + octave * 12;

    }


    /** Programa un paso de semicorchea del patrón */
    function scheduleStep(track, step, when) {

        const beat = step % 8;

        const bus = musicBus;

        /* Bajo */
        const bassDegree = track.bass[beat];

        if (bassDegree !== null && bassDegree !== undefined) {

            const freq = hz(noteAt(track, bassDegree) - 12);

            tone({
                freq,
                type: track.heavy ? "sawtooth" : "triangle",
                duration: 60 / track.bpm * 0.9,
                gain: track.heavy ? 0.26 : 0.2,
                when,
                bus
            });

            if (track.heavy) {

                /* Quinta baja: el "chug" metálico */
                tone({
                    freq: freq * 1.5,
                    type: "sawtooth",
                    duration: 60 / track.bpm * 0.5,
                    gain: 0.1,
                    when,
                    bus
                });

            }

        }

        /* Arpegio */
        const arpDegree = track.arp[beat];

        if (arpDegree !== null && arpDegree !== undefined) {

            tone({
                freq: hz(noteAt(track, arpDegree)),
                type: track.wave,
                duration: 60 / track.bpm * 0.45,
                gain: 0.11,
                when,
                bus
            });

        }

        /* Percusión */
        if (track.drums) {

            if (beat === 0 || beat === 4) {

                /* bombo */
                tone({
                    freq: 130,
                    to: 45,
                    type: "sine",
                    duration: 0.16,
                    gain: 0.3,
                    when,
                    bus,
                    sweepLinear: true
                });

            }

            if (beat === 2 || beat === 6) {

                /* caja */
                noise({ duration: 0.12, gain: 0.18, freq: 2200, when, bus });

            }

            if (beat % 2 === 1) {

                /* charles */
                noise({
                    duration: 0.04, gain: 0.06, freq: 8000,
                    filter: "highpass", when, bus
                });

            }

        }

    }


    function musicLoop() {

        const ctx = context;

        if (!ctx || !musicTrack) {
            return;
        }

        const stepTime = 60 / musicTrack.bpm / 2;   /* semicorcheas */

        /* Lookahead de 150 ms */
        while (musicNext < ctx.currentTime + 0.15) {

            scheduleStep(musicTrack, musicStep, musicNext);

            musicStep += 1;
            musicNext += stepTime;

        }

    }


    function startMusic(name) {

        if (!enabled || !musicOn) {
            musicName = name;
            return;
        }

        const track = TRACKS[name];

        if (!track) {
            return;
        }

        const ctx = ensureContext();

        if (!ctx) {
            return;
        }

        stopMusic(true);

        musicName = name;
        musicTrack = track;
        musicStep = 0;
        musicNext = ctx.currentTime + 0.08;

        musicBus.gain.cancelScheduledValues(ctx.currentTime);
        musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
        musicBus.gain.exponentialRampToValueAtTime(
            track.gain, ctx.currentTime + 0.9
        );

        musicLoop();

        musicTimer = setInterval(musicLoop, 50);

    }


    function stopMusic(immediate) {

        if (musicTimer) {
            clearInterval(musicTimer);
            musicTimer = null;
        }

        musicTrack = null;

        if (context && musicBus && !immediate) {

            musicBus.gain.cancelScheduledValues(context.currentTime);
            musicBus.gain.setValueAtTime(
                musicBus.gain.value, context.currentTime
            );
            musicBus.gain.exponentialRampToValueAtTime(
                0.0001, context.currentTime + 0.4
            );

        }

    }


    A.audio = {

        isEnabled() {
            return enabled;
        },


        /* ---------- Música ---------- */

        isMusicEnabled() {
            return musicOn;
        },


        setMusicEnabled(value) {

            musicOn = Boolean(value);

            A.storage.saveSettings({ music: musicOn });

            if (musicOn) {

                if (musicName) {
                    startMusic(musicName);
                }

            } else {

                stopMusic();

            }

        },


        toggleMusic() {

            this.setMusicEnabled(!musicOn);

            return musicOn;

        },


        /** Arranca la pista indicada (si ya suena esa, no reinicia) */
        music(name) {

            if (name === musicName && musicTrack) {
                return;
            }

            startMusic(name);

        },


        stopMusic() {

            musicName = null;

            stopMusic();

        },


        /** Silencia sin olvidar qué sonaba (pausa) */
        duckMusic(on) {

            if (!context || !musicBus || !musicTrack) {
                return;
            }

            const target = on ? 0.06 : (musicTrack.gain || 0.5);

            musicBus.gain.cancelScheduledValues(context.currentTime);
            musicBus.gain.setValueAtTime(
                Math.max(0.0001, musicBus.gain.value), context.currentTime
            );
            musicBus.gain.exponentialRampToValueAtTime(
                target, context.currentTime + 0.25
            );

        },



        setEnabled(value) {

            enabled = Boolean(value);

            A.storage.saveSettings({ sound: enabled });

            if (enabled) {

                ensureContext();

                if (musicOn && musicName) {
                    startMusic(musicName);
                }

            } else {

                stopMusic(true);

            }

        },


        toggle() {

            this.setEnabled(!enabled);

            return enabled;

        },


        play(name) {

            const sound = sounds[name];

            if (sound) {
                sound();
            }

        },


        /** Los navegadores exigen un gesto del usuario antes de sonar */
        unlock() {

            if (enabled) {
                ensureContext();
            }

        }

    };

})(window.Arcade404);
