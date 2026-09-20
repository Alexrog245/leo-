/* =========================================================
   ARCADE 404 — BIBLIOTECA DE ASSETS
   Manifiesto único para el arte y el audio local. Los recursos
   se solicitan sólo cuando un juego los necesita: así los PNG
   grandes de OPERACIÓN 404 no pesan en la portada.
   ========================================================= */

(function (A) {

    "use strict";


    /* ---------------------------------------------------------
       MANIFIESTO

       Las claves son estables y legibles; los nombres originales
       (incluidos espacios o erratas) quedan encapsulados aquí para
       no propagarlos por el código de los juegos.
       --------------------------------------------------------- */

    const IMAGES = {

        /* ---------- Personajes / expresiones ---------- */
        "character.davinchi.full": "./assets/Davinchi/Davinchi.png",
        "character.davinchi.gritando": "./assets/Davinchi/Davinchi Grito.png",
        "character.davinchi.despreocupado": "./assets/Davinchi/Davinchi desprocupado.png",
        "character.davinchi.dormido": "./assets/Davinchi/Davinchi dormido.png",
        "character.davinchi.emocionado": "./assets/Davinchi/Davinchi emocionado.png",
        "character.davinchi.enamorado": "./assets/Davinchi/Davinchi enamorado.png",
        "character.davinchi.enojado": "./assets/Davinchi/Davinchi enojado.png",
        "character.davinchi.feliz": "./assets/Davinchi/Davinchi feliz.png",
        "character.davinchi.llorando": "./assets/Davinchi/Davinchi llorando.png",
        "character.davinchi.miedo": "./assets/Davinchi/Davinchi miedo.png",
        "character.davinchi.nervioso": "./assets/Davinchi/Davinchi nervioso.png",
        "character.davinchi.preocupado": "./assets/Davinchi/Davinchi preocupado.png",
        "character.davinchi.serio": "./assets/Davinchi/Davinchi serio.png",
        "character.davinchi.triste": "./assets/Davinchi/Davinchi triste.png",

        "character.desire.full": "./assets/Desire/Desire.png",
        "character.desire.despreocupada": "./assets/Desire/Desire  desprocupada.png",
        "character.desire.dormida": "./assets/Desire/Desire dormida.png",
        "character.desire.emocionada": "./assets/Desire/Desire emocionada.png",
        "character.desire.enamorada": "./assets/Desire/Desire enamorada.png",
        "character.desire.feliz": "./assets/Desire/Desire feliz.png",
        "character.desire.gritando": "./assets/Desire/Desire gritando.png",
        "character.desire.llorando": "./assets/Desire/Desire llorando.png",
        "character.desire.miedo": "./assets/Desire/Desire miedo.png",
        "character.desire.molesta": "./assets/Desire/Desire molesta.png",
        "character.desire.nerviosa": "./assets/Desire/Desire nerviosa.png",
        "character.desire.preocupada": "./assets/Desire/Desire preocupada.png",
        "character.desire.seria": "./assets/Desire/Desire seria.png",
        "character.desire.triste": "./assets/Desire/Desire triste.png",

        "character.rog.full": "./assets/Rog/Rog.png",
        "character.rog.despreocupado": "./assets/Rog/Rog desprocupado.png",
        "character.rog.dormido": "./assets/Rog/Rog dormido.png",
        "character.rog.emocionado": "./assets/Rog/Rog emocionado.png",
        "character.rog.enamorado": "./assets/Rog/Rog enamorado.png",
        "character.rog.feliz": "./assets/Rog/Rog feliz.png",
        "character.rog.gritando": "./assets/Rog/Rog gritando.png",
        "character.rog.llorando": "./assets/Rog/Rog llorando.png",
        "character.rog.miedo": "./assets/Rog/Rog miedo.png",
        "character.rog.molesto": "./assets/Rog/Rog molesto.png",
        "character.rog.nervioso": "./assets/Rog/Rog nervioso.png",
        "character.rog.preocupado": "./assets/Rog/Rog preocupado.png",
        "character.rog.serio": "./assets/Rog/Rog serio.png",
        "character.rog.triste": "./assets/Rog/Rog triste.png",

        "character.sil.full": "./assets/Sil/Sil.png",
        "character.sil.despreocupada": "./assets/Sil/Sil desprocupada.png",
        "character.sil.dormida": "./assets/Sil/Sil durmiendo.png",
        "character.sil.emocionada": "./assets/Sil/Sil emocionada.png",
        "character.sil.enamorada": "./assets/Sil/Sil enamorada.png",
        "character.sil.feliz": "./assets/Sil/Sil feliz.png",
        "character.sil.gritando": "./assets/Sil/Sil gritando.png",
        "character.sil.llorando": "./assets/Sil/Sil llorando.png",
        "character.sil.miedo": "./assets/Sil/Sil miedo.png",
        "character.sil.molesta": "./assets/Sil/Sil molesta.png",
        "character.sil.nerviosa": "./assets/Sil/Sil nerviosa.png",
        "character.sil.preocupada": "./assets/Sil/Sil preocupada.png",
        "character.sil.seria": "./assets/Sil/Sil seria.png",
        "character.sil.triste": "./assets/Sil/Sil triste.png",

        "character.colinas.full": "./assets/Sr de las colinas/Sr de las colinas.png",
        "character.colinas.despreocupado": "./assets/Sr de las colinas/desprocupado.png",
        "character.colinas.dormido": "./assets/Sr de las colinas/durmiendo.png",
        "character.colinas.emocionado": "./assets/Sr de las colinas/emocionado.png",
        "character.colinas.enamorado": "./assets/Sr de las colinas/Enamorado.png",
        "character.colinas.feliz": "./assets/Sr de las colinas/feliz.png",
        "character.colinas.gritando": "./assets/Sr de las colinas/Gritando.png",
        "character.colinas.llorando": "./assets/Sr de las colinas/Llorando.png",
        "character.colinas.miedo": "./assets/Sr de las colinas/miedo.png",
        "character.colinas.molesto": "./assets/Sr de las colinas/molesto.png",
        "character.colinas.nervioso": "./assets/Sr de las colinas/Nervioso.png",
        "character.colinas.preocupado": "./assets/Sr de las colinas/preocupado.png",
        "character.colinas.serio": "./assets/Sr de las colinas/serio.png",
        "character.colinas.triste": "./assets/Sr de las colinas/triste.png",

        /* ---------- OPERACIÓN 404 · enemigos ---------- */
        "enemy.backoffice": "./assets/Enemigos/BackOffice.png",
        "enemy.calidad-f": "./assets/Enemigos/Calidad F.png",
        "enemy.calidad": "./assets/Enemigos/Calidad.png",
        "enemy.chavista": "./assets/Enemigos/Chavista.png",
        "enemy.chavista-f": "./assets/Enemigos/Chavizta F.png",
        "enemy.malandro-f": "./assets/Enemigos/Malandr F.png",
        "enemy.malandro": "./assets/Enemigos/Malandro.png",
        "enemy.militar": "./assets/Enemigos/Militar.png",
        "enemy.usuario-f": "./assets/Enemigos/usuario molesto f.png",
        "enemy.usuario": "./assets/Enemigos/usuario molesto.png",

        /* ---------- OPERACIÓN 404 · jefes ---------- */
        "boss.ampa": "./assets/Jefes/Ampa.png",
        "boss.capriles": "./assets/Jefes/Capriles.png",
        "boss.chavez": "./assets/Jefes/Chavez.png",
        "boss.maduro": "./assets/Jefes/Maduro.png",
        "boss.srm": "./assets/Jefes/Sr M.png",
        "boss.supervisor": "./assets/Jefes/Supervisor.png",

        /* ---------- Home / salón VIP ---------- */
        "home.vip-lounge": "./assets/Home/inicio-neon-base.png",

        /* ---------- Marca ---------- */
        "brand.logo": "./assets/logo.png"
    };


    const AUDIO = {
        "audio.tension": "./assets/Sonido/Abiente  de tension.mp3",
        "audio.horror": "./assets/Sonido/Horror.mp3",
        "audio.turno404-horror": "./assets/Sonido/horror-turno404.mp3",
        "audio.turno404-scream": "./assets/Sonido/gritos turno404-562425.mp3",
        "audio.davinchi": "./assets/Sonido/Davinchi.mp3",
        "audio.inicio": "./assets/Sonido/Inicio.mp3",
        "audio.click": "./assets/Sonido/click.mp3"
    };


    /* Los enemigos/jefes se entregaron sobre lienzos de tamaños muy
       distintos y con márgenes transparentes generosos. El raycaster
       dibuja estas ventanas, no el PNG completo: pies al suelo y altura
       coherente sin duplicar ni modificar los archivos originales. */
    const CANVAS_FRAMES = {
        "enemy.backoffice": { x: 183, y: 99, width: 647, height: 1345 },
        "enemy.calidad-f": { x: 293, y: 192, width: 424, height: 1205 },
        "enemy.calidad": { x: 286, y: 180, width: 435, height: 1211 },
        "enemy.chavista": { x: 109, y: 99, width: 738, height: 1298 },
        "enemy.chavista-f": { x: 98, y: 84, width: 794, height: 1333 },
        "enemy.malandro-f": { x: 99, y: 192, width: 656, height: 1210 },
        "enemy.malandro": { x: 279, y: 187, width: 456, height: 1215 },
        "enemy.militar": { x: 119, y: 99, width: 729, height: 1314 },
        "enemy.usuario-f": { x: 122, y: 76, width: 794, height: 1418 },
        "enemy.usuario": { x: 101, y: 96, width: 798, height: 1366 },
        "boss.ampa": { x: 111, y: 51, width: 734, height: 1383 },
        "boss.capriles": { x: 153, y: 294, width: 730, height: 878 },
        "boss.chavez": { x: 227, y: 142, width: 741, height: 1075 },
        "boss.maduro": { x: 166, y: 143, width: 693, height: 1371 },
        "boss.srm": { x: 183, y: 70, width: 618, height: 1406 },
        "boss.supervisor": { x: 210, y: 132, width: 557, height: 1341 },

        /* Los PNG base de Desire y Davinchi tienen lienzos transparentes
           de tamaño desigual. OP404 usa estas ventanas de cuerpo completo
           para no escalar el vacío y apoyar ambos personajes en el suelo. */
        "character.desire.full": { x: 0, y: 273, width: 333, height: 482 },
        "character.davinchi.full": { x: 4, y: 18, width: 297, height: 496 },
        /* Sil llega sentada en un lienzo horizontal muy amplio. Recortar el
           cuerpo completo evita escalar el vacío transparente y permite que
           quede apoyada en el suelo del raycaster como Desire y Davinchi. */
        "character.sil.full": { x: 538, y: 89, width: 562, height: 829 }
    };


    const CHARACTERS = {
        davinchi: {
            id: "davinchi",
            name: "DAVINCHI",
            role: "SEGURIDAD / RUTA",
            color: "#A3E635",
            pronoun: "él",
            voice: {
                style: "ROQUERO / TÉCNICO",
                signature: "yeah",
                guide: "Lee sistemas y rutas con entusiasmo compacto; mezcla jerga tecnológica con un yeah seguro."
            },
            expressions: [
                "full", "gritando", "despreocupado", "dormido", "emocionado",
                "enamorado", "enojado", "feliz", "llorando", "miedo",
                "nervioso", "preocupado", "serio", "triste"
            ]
        },
        desire: {
            id: "desire",
            name: "DESIRE",
            role: "ATENCIÓN / REFUGIO",
            color: "#F472B6",
            pronoun: "ella",
            voice: {
                style: "AFECTUOSA / PROTECTORA",
                signature: "amor",
                guide: "Habla con delicadeza y cercanía; cuida, calma y llama amor incluso bajo presión."
            },
            expressions: [
                "full", "despreocupada", "dormida", "emocionada", "enamorada",
                "feliz", "gritando", "llorando", "miedo", "molesta",
                "nerviosa", "preocupada", "seria", "triste"
            ]
        },
        rog: {
            id: "rog",
            name: "ROG",
            role: "OPERACIONES / CAMPO",
            color: "#38BDF8",
            pronoun: "él",
            voice: {
                style: "TACTICO / PROTECTOR",
                signature: "déjame pensarlo",
                guide: "Sobrepiensa para proteger al grupo; es serio y tímido, con chistes secos cuando la tensión lo permite."
            },
            expressions: [
                "full", "despreocupado", "dormido", "emocionado", "enamorado",
                "feliz", "gritando", "llorando", "miedo", "molesto",
                "nervioso", "preocupado", "serio", "triste"
            ]
        },
        sil: {
            id: "sil",
            name: "SIL",
            role: "RED / INTELIGENCIA",
            color: "#FB923C",
            pronoun: "ella",
            voice: {
                style: "CALCULADA / CORTANTE",
                signature: "dato primero",
                guide: "Observa, calcula y habla sólo lo necesario; es reflexiva, precisa y corta cuando decide."
            },
            expressions: [
                "full", "despreocupada", "dormida", "emocionada", "enamorada",
                "feliz", "gritando", "llorando", "miedo", "molesta",
                "nerviosa", "preocupada", "seria", "triste"
            ]
        },
        colinas: {
            id: "colinas",
            name: "SR. DE LAS COLINAS",
            role: "VIP / SUMINISTROS",
            color: "#FBBF24",
            pronoun: "él",
            voice: {
                style: "VIP / ESTATUS",
                signature: "nivel VIP",
                guide: "Mordaz, pretencioso y obsesionado con estatus; su clasismo es sátira sobre privilegio, precios y exclusividad."
            },
            expressions: [
                "full", "despreocupado", "dormido", "emocionado", "enamorado",
                "feliz", "gritando", "llorando", "miedo", "molesto",
                "nervioso", "preocupado", "serio", "triste"
            ]
        }
    };


    const CHARACTER_ORDER = ["rog", "sil", "desire", "davinchi", "colinas"];

    const ENEMIES = [
        "enemy.backoffice", "enemy.calidad-f", "enemy.calidad",
        "enemy.chavista", "enemy.chavista-f", "enemy.malandro-f",
        "enemy.malandro", "enemy.militar", "enemy.usuario-f", "enemy.usuario"
    ];

    const BOSSES = [
        "boss.ampa", "boss.capriles", "boss.chavez", "boss.maduro",
        "boss.srm", "boss.supervisor"
    ];


    const imageCache = new Map();


    function has(id) {
        return Boolean(IMAGES[id] || AUDIO[id]);
    }


    function url(id) {

        const path = IMAGES[id] || AUDIO[id];

        if (!path) {
            return "";
        }

        /* URL codifica espacios de forma segura sin obligar a cambiar
           los nombres de los archivos que ya están en el repositorio. */
        try {
            return new URL(path, document.baseURI).href;
        } catch (error) {
            return path;
        }

    }


    function requestImage(id) {

        if (!IMAGES[id]) {
            return null;
        }

        const existing = imageCache.get(id);

        if (existing) {
            return existing.image;
        }

        const image = new Image();

        const record = {
            image,
            status: "loading",
            promise: null
        };

        record.promise = new Promise((resolve) => {

            image.addEventListener("load", () => {
                record.status = "ready";
                resolve(image);
            }, { once: true });

            image.addEventListener("error", () => {
                record.status = "error";
                resolve(null);
            }, { once: true });

        });

        image.decoding = "async";
        image.src = url(id);

        imageCache.set(id, record);

        return image;

    }


    function readyImage(id) {

        const image = requestImage(id);

        return image && image.complete && image.naturalWidth > 0
            ? image
            : null;

    }


    function loadImage(id) {

        const image = requestImage(id);

        if (!image) {
            return Promise.resolve(null);
        }

        return imageCache.get(id).promise;

    }


    function preload(ids) {
        return Promise.all((ids || []).map((id) => loadImage(id)));
    }


    function canvasFrame(id) {
        return CANVAS_FRAMES[id] || null;
    }


    function character(id) {
        return CHARACTERS[id] || null;
    }


    function characterImageId(id, expression) {

        const entry = character(id);

        if (!entry) {
            return "";
        }

        const fallback = entry.expressions.indexOf("serio") >= 0
            ? "serio"
            : entry.expressions[0];

        const normalized = entry.expressions.indexOf(expression) >= 0
            ? expression
            : fallback;

        return `character.${id}.${normalized}`;

    }


    function characterImageIds(id) {

        const entry = character(id);

        return entry
            ? entry.expressions.map((expression) => `character.${id}.${expression}`)
            : [];

    }


    function createAudio(id, options = {}) {

        if (!AUDIO[id] || typeof Audio !== "function") {
            return null;
        }

        /* Se define preload antes de asignar src: usar new Audio(url)
           permitiría que algunos navegadores inicien la descarga antes
           de que podamos pedir el modo diferido. */
        const audio = new Audio();

        /* Las pistas pueden pesar varios MB; por defecto se descargan al
           necesitarlas. Un consumidor puede solicitar preload explícito,
           como HOME para su única pista de arranque automático. */
        audio.preload = options.preload || "none";
        audio.autoplay = Boolean(options.autoplay);
        audio.src = url(id);
        audio.loop = Boolean(options.loop);
        audio.volume = typeof options.volume === "number"
            ? Math.max(0, Math.min(1, options.volume))
            : 0.35;

        return audio;

    }


    function playAudio(audio, restart = false) {

        if (!audio) {
            return Promise.resolve(false);
        }

        if (restart) {
            try {
                audio.currentTime = 0;
            } catch (error) { /* navegador aún no tiene metadatos */ }
        }

        try {

            const playing = audio.play();

            /* HTMLMediaElement.play() devuelve una promesa en navegadores
               actuales. Exponer el resultado permite que HOME detecte un
               bloqueo de autoplay y espere el primer gesto del usuario.
               Los consumidores existentes pueden ignorar el retorno. */
            if (playing && typeof playing.then === "function") {
                return playing
                    .then(() => true)
                    .catch(() => false);
            }

            return Promise.resolve(true);

        } catch (error) {
            /* Sin soporte de audio: el resto del juego nunca se detiene. */
            return Promise.resolve(false);
        }

    }


    function stopAudio(audio, rewind = false) {

        if (!audio) {
            return;
        }

        try {
            audio.pause();
        } catch (error) { /* navegador sin soporte de audio */ }

        if (rewind) {
            try {
                audio.currentTime = 0;
            } catch (error) { /* no-op */ }
        }

    }


    A.assets = {
        has,
        url,
        requestImage,
        readyImage,
        loadImage,
        preload,
        canvasFrame,
        character,
        characterImageId,
        characterImageIds,
        createAudio,
        playAudio,
        stopAudio,
        characters: CHARACTERS,
        characterOrder: CHARACTER_ORDER,
        enemies: ENEMIES,
        bosses: BOSSES,
        imageIds: Object.keys(IMAGES),
        audioIds: Object.keys(AUDIO)
    };

})(window.Arcade404);
