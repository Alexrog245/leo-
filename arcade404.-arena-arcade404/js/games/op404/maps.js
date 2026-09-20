/* =========================================================
   ARCADE 404 — OPERACIÓN 404 · MAPAS Y NIVELES
   Leyenda de los mapas base (24 x 24), ampliados a 34 x 32 en runtime:

     #  muro principal      %  muro de acento A     &  muro de acento B
     v  escudo de señal / cobertura balística
     .  suelo               P  jugador
     C  chavista            U  usuario molesto      M  malandro
     G  gente de calidad    T  motorizado           R  burócrata
     K  colectivo
     B  jefe del nivel (el tipo lo decide la zona)
     h  arepa (vida)        b  balas   s  cartuchos   p  pastichos
     2–7 caja de arsenal aleatoria (pool por zona; 5–7 nacen como prototipo)
     x  escritorio          o  barril               t  mesa
   ========================================================= */

(function (A) {

    "use strict";


    const MAP_SOPORTE = [
        "########################",
        "#P.......#.............#",
        "#........#....U........#",
        "#..xx....#.............#",
        "#..xx....####..####....#",
        "#..............#..#..h.#",
        "#.....U........#..#....#",
        "#..............####....#",
        "#####..####............#",
        "#...#..#..#....U.......#",
        "#.s.#..#..#............#",
        "#...#..#..#..####......#",
        "#...####..#..#..%......#",
        "#............#..#...C..#",
        "#......U.....####......#",
        "#..xx..................#",
        "#..xx.......####.......#",
        "#...........#..#..U....#",
        "#....C......#2.#.......#",
        "#...........#..........#",
        "#..U........#..#..xx...#",
        "#...........####..xx.h.#",
        "#......................#",
        "########################"
    ];


    const MAP_BARRIO = [
        "########################",
        "#P.....#........#......#",
        "#......#...M....#..C...#",
        "#..b...#........%......#",
        "#......#..####..#......#",
        "#......#..#..#..#..#####",
        "####.###..#..#..#..#...#",
        "#.........####..#..#.h.#",
        "#...C...........#..#...#",
        "#..............##..##.##",
        "#....#####.............#",
        "#....#...#....M........#",
        "#....#.3.#.............#",
        "#....#...#....######...#",
        "#....##.##....#....#...#",
        "#.............#..M.#...#",
        "#..M..........#....#...#",
        "#.............##.###...#",
        "#......C...............#",
        "######..######.........#",
        "#............#....C....#",
        "#..M....b....%.........#",
        "#............#.......h.#",
        "########################"
    ];


    const MAP_PALACIO = [
        "########################",
        "#P.........#...........#",
        "#..........#....C......#",
        "#..s.......#...........#",
        "#..........#....%%.....#",
        "#.....######....%%.....#",
        "#.....#.........%%.....#",
        "#.....#..........h.....#",
        "#..C..#..........###.###",
        "#.....#..........#.....#",
        "####.##..........#..b..#",
        "#........#####...#.....#",
        "#..h.....#...#...#.....#",
        "#........#.B.#...##.####",
        "#........#...#.........#",
        "#....C...##.##.........#",
        "#......................#",
        "#####.#####......%.....#",
        "#.........#............#",
        "#..b......#.....######.#",
        "#.........#.....#....#.#",
        "#....s....%.....#.b..#.#",
        "#.........#.....#......#",
        "########################"
    ];


    const MAP_PDVSA = [
        "########################",
        "#P.....#...............#",
        "#......#..o.....M......#",
        "#..4...#...............#",
        "#......%......&&.......#",
        "#......#......&&...o...#",
        "#..o...#...............#",
        "#......#........#####..#",
        "####.###........#...#..#",
        "#...............#.p.#..#",
        "#.....o.........#...#..#",
        "#...............##.##..#",
        "#....######............#",
        "#....#....#....C.......#",
        "#....#.h..#............#",
        "#....#....#....o.......#",
        "#....##.###............#",
        "#..............###.##..#",
        "#...M..........#....#..#",
        "#..............#.B..%..#",
        "#..o......C....#....#..#",
        "#..............#....#..#",
        "#..p...........##.###..#",
        "########################"
    ];


    const MAP_CASA = [
        "########################",
        "#P....#.....#..........#",
        "#.....#..U..#....&.....#",
        "#.....#.....#..........#",
        "#..h..#.....##.###.....#",
        "#.....##.####..........#",
        "#......................#",
        "#####.######.....###.###",
        "#....b.....#.....#.....#",
        "#..........#.....#..b..#",
        "#....U.....#.....#.....#",
        "#..........#.....#.....#",
        "#..%.......##.####.....#",
        "#..........#.....#..h..#",
        "############.....##.####",
        "#.....#.....#..........#",
        "#..p..#..B..#..........#",
        "#.....#.....#....###...#",
        "#..........s#....#.#...#",
        "#.....#.....#....#.#...#",
        "#.....#.....#..........#",
        "#..U..#.....#.....&....#",
        "#.....#................#",
        "########################"
    ];


    const MAP_COMEDOR = [
        "########################",
        "#P.........%...........#",
        "#..........#...t...t...#",
        "#..........#...........#",
        "#....t.....#...t...t...#",
        "#..........#...........#",
        "#....t.....#.....h.....#",
        "#..........#####.#######",
        "#.....................&#",
        "#..b...................#",
        "#####.######..##########",
        "#..........#..#........#",
        "#..t...t...#..#...s....#",
        "#..........#..#........#",
        "#..t...t...&..#...t.t..#",
        "#..........#..#........#",
        "#.....h....#..#...t.t..#",
        "#..........#..#........#",
        "######.#####..###.######",
        "#......................#",
        "#..p.......B...........#",
        "#......................#",
        "#..........%.....&.....#",
        "########################"
    ];


    /* Zona sin jefe antes de entrar al Palacio. Reutiliza el elenco de
       enemigos ya entregado, con pasillos de archivo y puestos de control. */
    const MAP_ARCHIVO = [
        "########################",
        "#P......#.......#......#",
        "#.......#...R...#..G...#",
        "#..xx...#.......#......#",
        "#..xx...###.#####..###.#",
        "#...........#......#...#",
        "###.######..#..U...#...#",
        "#...#....#..#......#...#",
        "#.b.#.G..#..####.###...#",
        "#...#....#.............#",
        "#####.####.#######.#####",
        "#........#.....#.......#",
        "#..R.....#..C..#..h....#",
        "#........#.....#.......#",
        "####.#####.###.#####.###",
        "#....#.......#.....#...#",
        "#....#..U....#..R..#...#",
        "#....#.......#.....#...#",
        "#....#####.#######.#...#",
        "#..........#.......#...#",
        "#..G.......#...C...#...#",
        "#..........#.......#..s#",
        "#...........p..........#",
        "########################"
    ];


    /* Último pasillo sin jefe: mezcla el elenco existente antes del
       comedor final, sin exigir assets adicionales para esta expansión. */
    const MAP_ANTESALA = [
        "########################",
        "#P........#............#",
        "#.........#....U.......#",
        "#..t......#............#",
        "#.........#######.######",
        "#....G..........#......#",
        "#####.######.....#..h..#",
        "#...........#....#.....#",
        "#..T....R...#....###.###",
        "#...........#..........#",
        "#.b.######..######.#####",
        "#...#....#.......#.....#",
        "#...#..M.#...t...#..s..#",
        "#...#....#.......#.....#",
        "#.####.###.#######.#####",
        "#......#.....#.........#",
        "#..K...#..U..#....t....#",
        "#......#.....#.........#",
        "######.#####.######.####",
        "#......................#",
        "#..T....G.....M.....h..#",
        "#......................#",
        "#..........p...........#",
        "########################"
    ];


    const MAP_CUBICULOS = [
        "########################",
        "#P....#.......#........#",
        "#.....#...G...#....U...#",
        "#..xx.#.......#........#",
        "#..xx.#..#.#..#..xx....#",
        "#.....%..#.#..#..xx....#",
        "###.###..#.#..####..####",
        "#........#.#...........#",
        "#...U....#.#......G....#",
        "#.........s............#",
        "#####..####..###..######",
        "#...#..#......#..#.....#",
        "#.b.#..#..G...#.....h..#",
        "#...#..#......#..#.....#",
        "#...####..#####..#..####",
        "#.........#......#.....#",
        "#..t......#...U..%..2..#",
        "#..t......#......#.....#",
        "####..#####......#######",
        "#........#....G........#",
        "#...U....#.............#",
        "#........#....xx.....h.#",
        "#........#....xx.......#",
        "########################"
    ];


    const MAP_TORRE = [
        "########################",
        "#P.......#.............#",
        "#........#...R.........#",
        "#..xx....#........xx...#",
        "#..xx....%........xx...#",
        "#........#.............#",
        "####.#####....######...#",
        "#.............#....#...#",
        "#....G........#.b..#...#",
        "#.............#....#...#",
        "#...######....##.###...#",
        "#...#....#.............#",
        "#...#.3..#....R........#",
        "#...#....#.............#",
        "#...##.###......#####..#",
        "#...............#...#..#",
        "#....R..........#.B.#..#",
        "#...............#...#..#",
        "#####..####.....##.##..#",
        "#.........#............#",
        "#....G....#....G.......#",
        "#.........%........h...#",
        "#.........#............#",
        "########################"
    ];


    const MAP_AVENIDA = [
        "########################",
        "#P...#.........#.......#",
        "#....#....T....#...K...#",
        "#..b.#.........#.......#",
        "#....#..#####..#..###..#",
        "#....%..#...#..%..#....#",
        "##.###..#.h.#..#..#.##.#",
        "#.......#...#..#..#..#.#",
        "#...M...##.##..#..#..#.#",
        "#..............#..#..#.#",
        "#....######....#..#..#.#",
        "#....#....#.......#..#.#",
        "#....#.T..#....K..#..#.#",
        "#....#....#.......#..#.#",
        "#....##.###..........#.#",
        "#.................M....#",
        "#...oo........#..#.....#",
        "#...oo........#..#..3..#",
        "####..#########..#######",
        "#......................#",
        "#...K.....M.......T....#",
        "#..........s.......h...#",
        "#......................#",
        "########################"
    ];


    const MAP_PLAZA = [
        "########################",
        "#P......#........#.....#",
        "#.......#...M....#..K..#",
        "#..oo...#........#.....#",
        "#..oo...%...oo...%.....#",
        "#.......#...oo...#..b..#",
        "####.####........####.##",
        "#................#.....#",
        "#....K....####...#..T..#",
        "#.........#..#...#.....#",
        "#.........#..#...##.####",
        "#....######..#####.....#",
        "#....#.........#.......#",
        "#....#....M....#...M...#",
        "#....#.........#.......#",
        "#....###.#######...#####",
        "#..................#...#",
        "#....T........#....#.B.#",
        "#.............#....#...#",
        "####.####.....#....##.##",
        "#.......#..K..#........#",
        "#...h...#.....%....s...#",
        "#.......#.....#........#",
        "########################"
    ];


    /* ---------------------------------------------------------
       EXPANSIÓN DE RUTAS

       Las matrices históricas conservan su diseño central de 24 × 24,
       pero cada una se instala dentro de una cuadrícula de 34 × 32. Un
       anillo exterior conecta cuatro accesos reales del plano original:
       no es relleno visual, sino un desvío transitable con recursos,
       enemigos y huecos de pared suficientes para que las salas secretas
       tengan más lugares donde aparecer.
       --------------------------------------------------------- */

    const BASE_MAP_W = 24;
    const BASE_MAP_H = 24;
    const EXPANDED_MAP_W = 34;
    const EXPANDED_MAP_H = 32;
    const MAP_OFFSET_X = 5;
    const MAP_OFFSET_Y = 4;
    const BLOCKING_TILE = "#%&vxot";
    const ENEMY_TILES = "CUMGTRK";

    /*
       Tabla cerrada de reparto. Cada zona declara exactamente qué siluetas
       puede encontrar el jugador, incluso en los corredores añadidos por la
       expansión. No es una dificultad aleatoria global: el elenco acompaña
       el lugar (soporte, calle, archivo, planta…) y evita que una variante
       tardía se cuele en la primera oficina.

       `props` decora sólo las alas nuevas con el mobiliario de su entorno.
       Las barreras `v` abren puntos de cobertura que bloquean cuerpos, visión
       y proyectiles; ambos se colocan sobre un anillo de tres celdas de ancho,
       así que añaden decisiones de esquiva sin cerrar los desvíos.
    */
    const ENEMY_SPAWN_TABLE = Object.freeze({
        soporte: Object.freeze({
            world: "callcenter", theme: "MESAS DE SOPORTE", enemies: Object.freeze(["U", "C"]),
            props: Object.freeze(["x", "x", "t"])
        }),
        torre: Object.freeze({
            world: "callcenter", theme: "PISO GERENCIAL", enemies: Object.freeze(["U", "G", "R"]),
            props: Object.freeze(["x", "t", "x"])
        }),
        barrio: Object.freeze({
            world: "calles", theme: "CALLEJONES DEL BARRIO", enemies: Object.freeze(["M", "T", "K"]),
            props: Object.freeze(["o", "o", "t"])
        }),
        plaza: Object.freeze({
            world: "calles", theme: "PLAZA TOMADA", enemies: Object.freeze(["M", "T", "K"]),
            props: Object.freeze(["o", "t", "o"])
        }),
        archivo: Object.freeze({
            world: "gobierno", theme: "EXPEDIENTES Y VIGILANCIA", enemies: Object.freeze(["C", "G", "R"]),
            props: Object.freeze(["x", "x", "t"])
        }),
        palacio: Object.freeze({
            world: "gobierno", theme: "GUARDIA DEL PALACIO", enemies: Object.freeze(["C", "G", "R"]),
            props: Object.freeze(["t", "x", "t"])
        }),
        control: Object.freeze({
            world: "refineria", theme: "CONSOLAS DE CONTROL", enemies: Object.freeze(["C", "G", "R"]),
            props: Object.freeze(["x", "o", "x"])
        }),
        pdvsa: Object.freeze({
            world: "refineria", theme: "PLANTA Y PERÍMETRO", enemies: Object.freeze(["C", "G", "R"]),
            props: Object.freeze(["o", "o", "x"])
        }),
        avenida: Object.freeze({
            world: "escape", theme: "AVENIDA EN FUGA", enemies: Object.freeze(["M", "T", "K"]),
            props: Object.freeze(["o", "o", "t"])
        }),
        casa: Object.freeze({
            world: "escape", theme: "CASA Y RELÉ", enemies: Object.freeze(["U", "M", "T", "K"]),
            props: Object.freeze(["t", "t", "x"])
        }),
        antesala: Object.freeze({
            world: "final", theme: "ANTESALA DEL NODO", enemies: Object.freeze(["U", "G", "R", "M", "T", "K"]),
            props: Object.freeze(["t", "x", "t"])
        }),
        comedor: Object.freeze({
            world: "final", theme: "COMEDOR DEL NODO", enemies: Object.freeze(["C", "U", "G", "R", "M", "T", "K"]),
            props: Object.freeze(["t", "t", "t"])
        })
    });


    function zonedEnemyTile(tile, zone, seed, x, y) {
        if (ENEMY_TILES.indexOf(tile) === -1) {
            return tile;
        }

        const pool = zone && zone.enemies;
        if (!pool || !pool.length) {
            return ".";
        }

        if (pool.indexOf(tile) !== -1) {
            return tile;
        }

        /* Una marca heredada que no pertenece a la zona mantiene su punto
           de encuentro, pero se convierte en un miembro válido del elenco.
           El índice es determinista: cargar un mapa nunca cambia su reparto. */
        return pool[(seed * 11 + x * 5 + y * 3) % pool.length];
    }


    function isRouteFloor(tile) {
        return Boolean(tile) && BLOCKING_TILE.indexOf(tile) === -1;
    }


    function carve(grid, x, y, width, height, tile) {
        const fill = tile || ".";

        for (let row = Math.max(1, y); row < Math.min(EXPANDED_MAP_H - 1, y + height); row += 1) {
            for (let column = Math.max(1, x); column < Math.min(EXPANDED_MAP_W - 1, x + width); column += 1) {
                grid[row][column] = fill;
            }
        }
    }


    function edgeDoor(rows, edge, seed) {
        const candidates = [];
        const lastX = BASE_MAP_W - 1;
        const lastY = BASE_MAP_H - 1;

        for (let index = 2; index < (edge === "west" || edge === "east" ? lastY - 1 : lastX - 1); index += 1) {
            let x = index;
            let y = index;
            let innerX = index;
            let innerY = index;

            if (edge === "west") {
                x = 0;
                y = index;
                innerX = 1;
                innerY = index;
            } else if (edge === "east") {
                x = lastX;
                y = index;
                innerX = lastX - 1;
                innerY = index;
            } else if (edge === "north") {
                x = index;
                y = 0;
                innerX = index;
                innerY = 1;
            } else {
                x = index;
                y = lastY;
                innerX = index;
                innerY = lastY - 1;
            }

            if (isRouteFloor(rows[innerY][innerX])) {
                candidates.push({ x, y });
            }
        }

        return candidates.length
            ? candidates[(seed * 7 + candidates.length) % candidates.length]
            : { x: edge === "west" ? 0 : edge === "east" ? lastX : Math.floor(BASE_MAP_W / 2),
                y: edge === "north" ? 0 : edge === "south" ? lastY : Math.floor(BASE_MAP_H / 2) };
    }


    function expandedMap(base, seed, zone) {
        const source = base.map((row) => row.padEnd(BASE_MAP_W, "#").slice(0, BASE_MAP_W));
        const grid = Array.from({ length: EXPANDED_MAP_H }, () => (
            Array(EXPANDED_MAP_W).fill("#")
        ));

        /* El plano anterior conserva geometría, rutas y botín. Sólo las
           marcas de enemigos pasan por la tabla cerrada de la zona para que
           un viejo símbolo de mapa no cambie la temática al ampliarlo. */
        for (let y = 0; y < BASE_MAP_H; y += 1) {
            for (let x = 0; x < BASE_MAP_W; x += 1) {
                grid[MAP_OFFSET_Y + y][MAP_OFFSET_X + x] = zonedEnemyTile(
                    source[y][x], zone, seed, x, y
                );
            }
        }

        /* Corredor perimetral: cuatro alas con bifurcaciones horizontales y
           verticales. La anchura de tres casillas evita que un solo enemigo
           bloquee una ruta secundaria completa. */
        carve(grid, 1, 1, EXPANDED_MAP_W - 2, 3);
        carve(grid, 1, EXPANDED_MAP_H - 4, EXPANDED_MAP_W - 2, 3);
        carve(grid, 1, 1, 4, EXPANDED_MAP_H - 2);
        carve(grid, EXPANDED_MAP_W - 5, 1, 4, EXPANDED_MAP_H - 2);

        const doors = [
            edgeDoor(source, "west", seed),
            edgeDoor(source, "east", seed + 1),
            edgeDoor(source, "north", seed + 2),
            edgeDoor(source, "south", seed + 3)
        ];

        doors.forEach((door, index) => {
            const x = MAP_OFFSET_X + door.x;
            const y = MAP_OFFSET_Y + door.y;
            grid[y][x] = ".";

            if (index === 0) {
                carve(grid, 3, y, MAP_OFFSET_X - 2, 1);
            } else if (index === 1) {
                carve(grid, MAP_OFFSET_X + BASE_MAP_W - 1, y, 4, 1);
            } else if (index === 2) {
                carve(grid, x, 3, 1, MAP_OFFSET_Y - 2);
            } else {
                carve(grid, x, MAP_OFFSET_Y + BASE_MAP_H - 1, 1, 4);
            }
        });

        /* Pequeños separadores dan forma de salas al anillo sin cerrar las
           rutas. Los % permiten reconocer que son desvíos de exploración
           en el radar. */
        [[2, 8], [2, 19], [31, 11], [31, 22], [11, 2], [23, 29]].forEach((spot, index) => {
            const x = spot[0];
            const y = spot[1];
            if ((index + seed) % 2 === 0) {
                grid[y][x] = "%";
            }
        });

        const sideLoot = [
            [2, 5, "h"], [3, 14, "b"], [2, 26, "q"],
            [31, 6, "s"], [30, 17, "p"], [31, 26, "q"],
            [10, 2, "b"], [20, 2, "h"], [14, 29, "s"], [25, 29, "p"]
        ];
        sideLoot.forEach((spot, index) => {
            const x = spot[0];
            const y = spot[1];
            if (grid[y][x] === "." && (index + seed) % 3 !== 1) {
                grid[y][x] = spot[2];
            }
        });

        /* Las cajas de prototipo no se amontonan en el inicio: cada ala marca
           una fuente distinta y su reparto rota entre las doce zonas. Al
           cargar el nivel, GAME convierte la marca en un arma aleatoria de
           la pool ya permitida para ese capítulo. */
        const prototypes = ["5", "6", "7"];
        const prototypeSpot = [[3, 9], [30, 13], [17, 2]][seed % 3];
        if (seed >= 1 && grid[prototypeSpot[1]][prototypeSpot[0]] === ".") {
            grid[prototypeSpot[1]][prototypeSpot[0]] = prototypes[Math.floor(seed / 2) % prototypes.length];
        }

        /* Cobertura real para los corredores ampliados. `v` no es un adorno:
           GAME la trata como barrera de señal, por eso detiene movimiento,
           visión y balas de ambos bandos. Los puntos alternan en alas
           distintas y nunca cierran el anillo de tres celdas. */
        const shieldCover = [
            [2, 12], [3, 18], [31, 9],
            [30, 21], [18, 29], [14, 2]
        ];
        shieldCover.forEach((spot, index) => {
            const x = spot[0];
            const y = spot[1];
            if ((index + seed) % 2 === 0 && grid[y][x] === ".") {
                grid[y][x] = "v";
            }
        });

        /* Mobiliario de continuidad para las alas nuevas. Cada prop deja
           dos o más celdas de paso en el anillo, por lo que no convierte la
           expansión en un pasillo angosto ni borra oportunidades de esquiva. */
        const sideProps = zone && zone.props ? zone.props : [];
        [[2, 9], [2, 21], [31, 14], [30, 24], [14, 2], [24, 29]].forEach((spot, index) => {
            const x = spot[0];
            const y = spot[1];
            if (sideProps.length && grid[y][x] === ".") {
                grid[y][x] = sideProps[(seed + index) % sideProps.length];
            }
        });

        /* Los encuentros de los desvíos ya no toman una lista global. El
           mismo pool explícito filtra núcleo y alas, así los mapas iniciales
           no reciben motorizados, colectivos ni variantes de mundos tardíos. */
        const zoneEnemies = zone && zone.enemies ? zone.enemies : [];
        [[3, 11], [31, 20], [8, 2]].forEach((spot, index) => {
            const x = spot[0];
            const y = spot[1];
            if (zoneEnemies.length && grid[y][x] === ".") {
                grid[y][x] = zoneEnemies[(seed + index * 2) % zoneEnemies.length];
            }
        });

        return grid.map((row) => row.join(""));
    }


    /* ---------------------------------------------------------
       NIVELES
       ─ tex: texturas de pared [principal, acento %, acento &]
       ─ boss: jefe del nivel (marcado con B en el mapa)
       ─ speed / damage / hp: multiplicadores del nivel
       --------------------------------------------------------- */

    /* ---------------------------------------------------------
       MUNDOS

       La campaña se organiza en seis parejas temáticas: un mapa
       sin jefe seguido por un jefe existente. Así cada segundo
       nivel presenta un jefe nuevo y los seis se conservan en la
       ruta completa.

       Cada nivel declara:
         ─ world:   mundo al que pertenece
         ─ stage:   "1-2" para mostrar en pantalla
         ─ boss:    clave del jefe si lo hay
         ─ shop:    true si al terminar se entra en la Sala VIP
       --------------------------------------------------------- */

    const WORLDS = [
        {
            id: "callcenter",
            name: "MUNDO 1 — OFICINAS Y CALL CENTER",
            short: "CALL CENTER",
            intro: "Donde empezó todo. Tu turno no ha terminado."
        },
        {
            id: "calles",
            name: "MUNDO 2 — LAS CALLES DE CARACAS",
            short: "CARACAS",
            intro: "Afuera el virus ya se comió el barrio."
        },
        {
            id: "gobierno",
            name: "MUNDO 3 — ARCHIVOS DEL GOBIERNO",
            short: "GOBIERNO",
            intro: "El origen de la señal está enterrado entre expedientes."
        },
        {
            id: "refineria",
            name: "MUNDO 4 — CONTROL DE REFINERÍA",
            short: "REFINERÍA",
            intro: "Los monitores todavía obedecen a la señal."
        },
        {
            id: "escape",
            name: "MUNDO 5 — RUTA DE SALIDA",
            short: "SALIDA",
            intro: "La calle parece libre hasta que escuchas la estática."
        },
        {
            id: "final",
            name: "MUNDO 6 — EL ÚLTIMO TURNO",
            short: "FINAL",
            intro: "Solo queda cruzar la antesala y cerrar el último ticket."
        }
    ];


    const LEVELS = [

        /* Cada segundo nivel enfrenta uno de los seis jefes ya existentes.
           Los niveles impares expanden la ruta y usan el elenco entregado. */

        /* ===== MUNDO 1 — OFICINAS Y CALL CENTER ===== */
        {
            id: "soporte",
            world: "callcenter",
            stage: "1-1",
            name: "SOPORTE TÉCNICO",
            subtitle: "Los usuarios no quieren agarrar el chat",
            map: MAP_SOPORTE,
            tex: ["panel", "pizarra", "panel"],
            ceiling: "#1E2A44",
            floor: "#2C3554",
            fog: "#0B1020",
            light: "#38BDF8",
            speed: 1,
            damage: 1,
            hp: 1,
            boss: null,
            shop: true
        },
        {
            id: "torre",
            world: "callcenter",
            stage: "1-2",
            name: "PISO GERENCIAL",
            subtitle: "Jefe: EL SUPERVISOR",
            map: MAP_TORRE,
            tex: ["marmol", "pizarra", "panel"],
            ceiling: "#232E48",
            floor: "#303B58",
            fog: "#0C1222",
            light: "#818CF8",
            speed: 1.08,
            damage: 1.1,
            hp: 1.08,
            boss: "supervisor",
            shop: true
        },

        /* ===== MUNDO 2 — LAS CALLES DE CARACAS ===== */
        {
            id: "barrio",
            world: "calles",
            stage: "2-1",
            name: "EL BARRIO",
            subtitle: "Malandros con lentes de espejo",
            map: MAP_BARRIO,
            tex: ["bloque", "graffiti", "bloque"],
            ceiling: "#3B2F2F",
            floor: "#4A3F36",
            fog: "#140E0A",
            light: "#FBBF24",
            speed: 1.1,
            damage: 1.12,
            hp: 1.1,
            boss: null,
            shop: true
        },
        {
            id: "plaza",
            world: "calles",
            stage: "2-2",
            name: "LA PLAZA",
            subtitle: "Jefe: EL PRANES",
            map: MAP_PLAZA,
            tex: ["bloque", "graffiti", "marmol"],
            ceiling: "#2F2620",
            floor: "#433529",
            fog: "#100A07",
            light: "#FB923C",
            speed: 1.18,
            damage: 1.2,
            hp: 1.16,
            boss: "jefeBarrio",
            shop: true
        },

        /* ===== MUNDO 3 — ARCHIVOS DEL GOBIERNO ===== */
        {
            id: "archivo",
            world: "gobierno",
            stage: "3-1",
            name: "ARCHIVO CENTRAL",
            subtitle: "Expedientes que no debían existir",
            map: MAP_ARCHIVO,
            tex: ["marmol", "retrato", "panel"],
            ceiling: "#49391B",
            floor: "#604A23",
            fog: "#181005",
            light: "#FDE68A",
            speed: 1.22,
            damage: 1.24,
            hp: 1.2,
            boss: null,
            shop: true
        },
        {
            id: "palacio",
            world: "gobierno",
            stage: "3-2",
            name: "EL PALACIO",
            subtitle: "Jefe: MADURO",
            map: MAP_PALACIO,
            tex: ["marmol", "retrato", "marmol"],
            ceiling: "#4A3A1A",
            floor: "#6B5326",
            fog: "#1A1206",
            light: "#FDE68A",
            speed: 1.25,
            damage: 1.28,
            hp: 1.24,
            boss: "maduro",
            shop: true
        },

        /* ===== MUNDO 4 — CONTROL DE REFINERÍA ===== */
        {
            id: "control",
            world: "refineria",
            stage: "4-1",
            name: "SALA DE CONTROL",
            subtitle: "La refinería vigila desde los cubículos",
            map: MAP_CUBICULOS,
            tex: ["acero", "pdvsa", "tuberia"],
            ceiling: "#202027",
            floor: "#2D2D35",
            fog: "#060609",
            light: "#FB7185",
            speed: 1.27,
            damage: 1.31,
            hp: 1.27,
            boss: null,
            shop: true
        },
        {
            id: "pdvsa",
            world: "refineria",
            stage: "4-2",
            name: "LA REFINERÍA",
            subtitle: "Jefe: CHÁVEZ",
            map: MAP_PDVSA,
            tex: ["acero", "pdvsa", "tuberia"],
            ceiling: "#1F1F26",
            floor: "#2B2B33",
            fog: "#050508",
            light: "#F43F5E",
            speed: 1.31,
            damage: 1.35,
            hp: 1.31,
            boss: "chavez",
            shop: true
        },

        /* ===== MUNDO 5 — RUTA DE SALIDA ===== */
        {
            id: "avenida",
            world: "escape",
            stage: "5-1",
            name: "LA AVENIDA",
            subtitle: "La señal llegó hasta la calle",
            map: MAP_AVENIDA,
            tex: ["bloque", "graffiti", "acero"],
            ceiling: "#33291F",
            floor: "#463A2C",
            fog: "#120C08",
            light: "#F97316",
            speed: 1.33,
            damage: 1.37,
            hp: 1.34,
            boss: null,
            shop: true
        },
        {
            id: "casa",
            world: "escape",
            stage: "5-2",
            name: "LA CASA DEL MANGUANGUA",
            subtitle: "Jefe: EL MANGUANGUA",
            map: MAP_CASA,
            tex: ["papel", "cuadroV", "puerta"],
            ceiling: "#2E2040",
            floor: "#3D2B57",
            fog: "#0E0817",
            light: "#C084FC",
            speed: 1.36,
            damage: 1.41,
            hp: 1.38,
            boss: "manguangua",
            shop: true
        },

        /* ===== MUNDO 6 — EL ÚLTIMO TURNO ===== */
        {
            id: "antesala",
            world: "final",
            stage: "6-1",
            name: "ANTESALA DEL COMEDOR",
            subtitle: "El último turno todavía no termina",
            map: MAP_ANTESALA,
            tex: ["azulejo", "bandera", "sagrada"],
            ceiling: "#37291F",
            floor: "#52392A",
            fog: "#100A08",
            light: "#A3E635",
            speed: 1.39,
            damage: 1.44,
            hp: 1.42,
            boss: null,
            shop: true
        },
        {
            id: "comedor",
            world: "final",
            stage: "6-2",
            name: "EL COMEDOR",
            subtitle: "Jefe final: SR. M",
            map: MAP_COMEDOR,
            tex: ["azulejo", "bandera", "sagrada"],
            ceiling: "#3A2A1E",
            floor: "#5A3E2B",
            fog: "#120B06",
            light: "#39FF14",
            speed: 1.43,
            damage: 1.48,
            hp: 1.46,
            boss: "srm",
            secret: true,
            shop: false
        }

    ];


    /* Cada entrada de campaña recibe las alas ampliadas después de declarar
       el núcleo original. Mantener las bases arriba hace que las rutas y
       jefes existentes sigan siendo reconocibles, pero cada mundo gana
       espacio horizontal y vertical para explorar. */
    LEVELS.forEach((level, index) => {
        const zone = ENEMY_SPAWN_TABLE[level.id];

        /* Fallar temprano es preferible a que una zona nueva herede por
           accidente el elenco completo. También comprueba que id/mundo y
           temática sigan coordinados si se añade una campaña futura. */
        if (!zone || zone.world !== level.world) {
            throw new Error("OPERACIÓN 404: zona sin tabla de spawns válida: " + level.id);
        }

        level.enemyPool = Object.freeze(zone.enemies.slice());
        level.spawnTheme = zone.theme;
        level.map = expandedMap(level.map, index, zone);
        level.expanded = true;
    });


    /* ---------------------------------------------------------
       DOSSIER DE OPERACIÓN

       El raycaster no detiene al jugador entre zonas. En cambio,
       cada entrada recibe una transmisión corta del equipo: explica
       por qué importa la sala actual, adelanta el siguiente nodo y
       convierte las doce zonas en una sola ruta. `variants` distribuye pares
       alternos por capítulo y al repetir una zona, conservando el objetivo
       y la voz del personaje. `clear` sólo existe en los encuentros que cierran un jefe
       y se lee durante los cinco segundos de botín, sin comerse ese tiempo
       jugable.
       --------------------------------------------------------- */

    const DOSSIER = {
        soporte: {
            speaker: "sil",
            expression: "seria",
            channel: "CANAL 01 · SEÑAL INTERNA",
            objective: "APAGA LOS REPETIDORES DEL CALL CENTER",
            lines: [
                "Rastreo la señal. Empezó en las colas de soporte.",
                "Cada puesto activo retransmite el comando. Apágalos todos."
            ],
            variants: [
                {
                    expression: "nerviosa",
                    lines: [
                        "No es un error de cola: el sistema aprendió a repetir la orden.",
                        "Busca el zumbido más limpio; ahí está el repetidor que manda."
                    ]
                },
                {
                    expression: "preocupada",
                    lines: [
                        "Las llamadas vacías siguen marcando desde cubículos cerrados.",
                        "Corta las consolas iluminadas y deja que el silencio nos dé la ruta."
                    ]
                }
            ]
        },
        torre: {
            speaker: "davinchi",
            expression: "serio",
            channel: "CANAL 02 · RUTA BLOQUEADA",
            objective: "ROMPE EL BLOQUEO GERENCIAL",
            lines: [
                "El Supervisor cerró escaleras y ascensores desde arriba. Ya preparé el bypass, yeah.",
                "Si cae su llave maestra, la calle vuelve a estar abierta. Ruta limpia, yeah."
            ],
            variants: [
                {
                    expression: "enojado",
                    lines: [
                        "El Supervisor volvió la torre una jaula de métricas, yeah.",
                        "Que guarde sus planillas: rompe su llave y se queda sin pisos."
                    ]
                },
                {
                    expression: "nervioso",
                    lines: [
                        "Su ascensor llama refuerzos al detectar movimiento, yeah.",
                        "Muévete por los bordes, corta sus rutas y no le des el ritmo."
                    ]
                }
            ],
            clear: {
                speaker: "sil",
                expression: "emocionada",
                channel: "ENLACE RECUPERADO",
                lines: [
                    "Acceso abierto. La señal salió del edificio y se dividió. Anótalo.",
                    "Sigue las pantallas rojas. Todas apuntan al barrio."
                ],
                variants: [
                    {
                        expression: "seria",
                        lines: [
                            "Su llave maestra ya no responde. Tengo tres salidas y una sirve.",
                            "Marca la calle este: el siguiente pulso baja directo al barrio."
                        ]
                    },
                    {
                        expression: "preocupada",
                        lines: [
                            "La torre cayó, pero la señal se fragmentó como vidrio.",
                            "No persigas cada eco; el más fuerte ya se mueve hacia el barrio."
                        ]
                    }
                ]
            }
        },
        barrio: {
            speaker: "desire",
            expression: "preocupada",
            channel: "CANAL 03 · REFUGIO ESTE",
            objective: "CRUZA EL BARRIO Y PROTEGE LA RUTA",
            lines: [
                "Amor, hay gente escondida entre los locales. No dispares a ciegas.",
                "Busca los lentes espejo, amor. Marcan quién todavía oye la señal."
            ],
            variants: [
                {
                    expression: "seria",
                    lines: [
                        "Amor, los locales parecen vacíos, pero alguien está cuidando las persianas.",
                        "Camina con calma: quien se tape los oídos todavía puede salir de aquí."
                    ]
                },
                {
                    expression: "nerviosa",
                    lines: [
                        "Oigo radios detrás de las santamarías, amor. No todas son enemigas.",
                        "Sigue los lentes espejo y deja una ruta libre para los que se escondieron."
                    ]
                }
            ]
        },
        plaza: {
            speaker: "rog",
            expression: "serio",
            channel: "CANAL 04 · CAMPO",
            objective: "DESACTIVA EL AMPLIFICADOR DE LA PLAZA",
            lines: [
                "La plaza retransmite el comando para todo el barrio. Déjame pensarlo: hay que cortarla.",
                "El Pranes tiene el amplificador. Déjalo sin público y sin plan B."
            ],
            variants: [
                {
                    expression: "preocupado",
                    lines: [
                        "El altavoz de la plaza está reclutando oídos, no soldados.",
                        "Haz que se quede sin audiencia y quítale el amplificador primero."
                    ]
                },
                {
                    expression: "molesto",
                    lines: [
                        "Medí sus rondas: se mueve cuando las pantallas dan destello.",
                        "No pelees por la tarima; rompe la señal y el Pranes pierde el guion."
                    ]
                }
            ],
            clear: {
                speaker: "davinchi",
                expression: "emocionado",
                channel: "RUTA DESPEJADA",
                lines: [
                    "El ruido bajó. Encontré una credencial entre sus cosas, yeah.",
                    "Nos abre el Archivo Central y sus expedientes enterrados. La lectura no miente."
                ],
                variants: [
                    {
                        expression: "serio",
                        lines: [
                            "La credencial abre el Archivo Central, yeah. Qué detalle tan mal escondido.",
                            "Guárdala: sus expedientes dirán quién encendió los seis nodos."
                        ]
                    },
                    {
                        expression: "feliz",
                        lines: [
                            "La plaza quedó muda y el acceso ya canta verde, yeah.",
                            "Siguiente riff: Archivo Central. Ahí está la partitura de esta cosa."
                        ]
                    }
                ]
            }
        },
        archivo: {
            speaker: "sil",
            expression: "preocupada",
            channel: "CANAL 05 · ARCHIVO",
            objective: "RECUPERA LAS COORDENADAS DE LOS SEIS NODOS",
            lines: [
                "Los expedientes no hablan de un virus. Hablan de seis nodos.",
                "El Palacio guarda la coordenada del siguiente relé. Recupera el dato."
            ],
            variants: [
                {
                    expression: "seria",
                    lines: [
                        "Clasifiqué las carpetas: seis nodos, una misma firma y demasiados sellos.",
                        "No quemes el archivo; necesito la coordenada que apunta al Palacio."
                    ]
                },
                {
                    expression: "emocionada",
                    lines: [
                        "Encontré la secuencia entre actas borradas. La red tiene una columna vertebral.",
                        "Extrae el plano del relé; con eso abrimos la puerta del Palacio."
                    ]
                }
            ]
        },
        palacio: {
            speaker: "davinchi",
            expression: "enojado",
            channel: "CANAL 06 · ACCESO AL PALACIO",
            objective: "EXTRAE LA COORDENADA DE LA REFINERÍA",
            lines: [
                "El Palacio es un archivo con guardias, no el final. Su seguridad es puro teatro, yeah.",
                "Consigue la coordenada de la refinería; yo abro la salida por el panel, yeah."
            ],
            variants: [
                {
                    expression: "serio",
                    lines: [
                        "Las cámaras repiten un patrón de museo, yeah. Ya vi el hueco.",
                        "Entra, toma la coordenada de la refinería y deja el decorado sin energía."
                    ]
                },
                {
                    expression: "preocupado",
                    lines: [
                        "Este lugar protege papeles como si fueran reliquias, yeah.",
                        "No persigas al ruido: el panel central guarda la ruta hacia la refinería."
                    ]
                }
            ],
            clear: {
                speaker: "rog",
                expression: "serio",
                channel: "COORDENADA LEÍDA",
                lines: [
                    "La ruta cae al sur. Revisé el cálculo dos veces: el combustible alimenta la transmisión.",
                    "No apagamos una ciudad. Estamos siguiendo su corazón; mantente cubierto."
                ],
                variants: [
                    {
                        expression: "preocupado",
                        lines: [
                            "La coordenada coincide con los ductos del sur. El combustible es el pulso.",
                            "No dispares al azar ahí abajo; primero localiza quién regula el flujo."
                        ]
                    },
                    {
                        expression: "serio",
                        lines: [
                            "Confirmado: la transmisión bebe de la refinería.",
                            "Seguimos el corazón de la red. Respira, cubre esquinas y baja."
                        ]
                    }
                ]
            }
        },
        control: {
            speaker: "rog",
            expression: "serio",
            channel: "CANAL 07 · OPERACIONES",
            objective: "CORTA EL RITMO DEL NÚCLEO DE CONTROL",
            lines: [
                "El combustible no alimenta luces. Alimenta la transmisión.",
                "Entra a control, corta el ritmo y encuentra el núcleo. Sin improvisar."
            ],
            variants: [
                {
                    expression: "preocupado",
                    lines: [
                        "Los medidores suben al mismo compás que la señal. Ya tenemos el pulso.",
                        "Corta los reguladores uno por uno; no le regales una sobrecarga."
                    ]
                },
                {
                    expression: "molesto",
                    lines: [
                        "La sala de control está fingiendo ser rutina. No te creas las luces verdes.",
                        "Busca el tablero que no para de corregirse: ahí respira el núcleo."
                    ]
                }
            ]
        },
        pdvsa: {
            speaker: "desire",
            expression: "miedo",
            channel: "CANAL 08 · REFUGIO",
            objective: "DERRIBA AL GUARDIÁN DEL NÚCLEO",
            lines: [
                "Amor, el humo tapa el pasillo. No te confíes si deja de sonar.",
                "Chávez protege el núcleo, amor. Sin él, el canal pierde fuerza."
            ],
            variants: [
                {
                    expression: "seria",
                    lines: [
                        "Amor, el silencio de esa planta no significa que esté vacía.",
                        "Encuentra al guardián, corta su cobertura y no te quedes bajo el vapor."
                    ]
                },
                {
                    expression: "preocupada",
                    lines: [
                        "Te veo entre humo y cables, amor. No quiero que corras sin mirar.",
                        "Cuando el núcleo tiemble, aléjate un paso; él va a querer que te acerques."
                    ]
                }
            ],
            clear: {
                speaker: "sil",
                expression: "emocionada",
                channel: "PULSO INTERRUMPIDO",
                lines: [
                    "El corte rebotó hacia la avenida. La señal está escapando. Sigue el pulso.",
                    "Cada pantalla rota apunta a una sola casa. No es coincidencia."
                ],
                variants: [
                    {
                        expression: "seria",
                        lines: [
                            "La presión cayó y la señal salió de los ductos. Va hacia la avenida.",
                            "Sigue los monitores que parpadean; todos señalan la misma calle."
                        ]
                    },
                    {
                        expression: "nerviosa",
                        lines: [
                            "El núcleo dejó una estela en la red pública. Ya no puede esconderse.",
                            "La avenida recibe el rebote. Mantén el pulso a la vista y no lo pierdas."
                        ]
                    }
                ]
            }
        },
        avenida: {
            speaker: "sil",
            expression: "nerviosa",
            channel: "CANAL 09 · RASTRO EXTERNO",
            objective: "SIGUE EL RASTRO HASTA EL RELÉ OCULTO",
            lines: [
                "El pulso salta de semáforo en semáforo. Está buscando otra pared.",
                "Sigue las pantallas rotas; la casa que las llama es nuestro relé."
            ],
            variants: [
                {
                    expression: "seria",
                    lines: [
                        "La señal aprendió a viajar por el tráfico. Cada luz roja le presta un segundo.",
                        "No corras detrás del ruido: las pantallas que fallan forman una flecha."
                    ]
                },
                {
                    expression: "preocupada",
                    lines: [
                        "Perdí un eco y recuperé otro cerca de la avenida. Está cambiando de máscara.",
                        "Sigue el cable más nuevo; termina en el relé que nadie quiso registrar."
                    ]
                }
            ]
        },
        casa: {
            speaker: "davinchi",
            expression: "nervioso",
            channel: "CANAL 10 · RELÉ OCULTO",
            objective: "CORTA EL HAZ Y NO ESCUCHES EL DISCURSO",
            lines: [
                "Esto no es una casa. Es un proyector con paredes y cableado vivo, yeah.",
                "El Manguangua es una máscara. Corta su haz, no lo escuches, yeah."
            ],
            variants: [
                {
                    expression: "serio",
                    lines: [
                        "El cableado de esa casa late como un amplificador gigante, yeah.",
                        "No sigas el discurso: encuentra el haz, córtalo y la máscara se queda sin luz."
                    ]
                },
                {
                    expression: "preocupado",
                    lines: [
                        "Tiene proyectores escondidos hasta en las paredes, yeah. Esto es un truco de escenario.",
                        "Rompe la fuente, no la sombra. Si el haz cae, el Manguangua pierde la voz."
                    ]
                }
            ],
            clear: {
                speaker: "desire",
                expression: "seria",
                channel: "MÁSCARA CAÍDA",
                lines: [
                    "La estática cambió, amor. Ahora sabemos dónde se reúne todo.",
                    "Respira conmigo, amor. Queda el Comedor y quien sostiene el ticket."
                ],
                variants: [
                    {
                        expression: "emocionada",
                        lines: [
                            "La máscara ya no puede tapar la ruta, amor. Todo converge en un punto.",
                            "Toma aire conmigo. La Antesala nos lleva al Comedor y al final de esto."
                        ]
                    },
                    {
                        expression: "preocupada",
                        lines: [
                            "La casa quedó quieta, amor, pero el último canal sigue encendido.",
                            "No te sueltes ahora: la ruta termina en el Comedor y vamos juntos."
                        ]
                    }
                ]
            }
        },
        antesala: {
            speaker: "colinas",
            expression: "serio",
            channel: "CANAL 11 · SUMINISTROS VIP",
            objective: "CRUZA LA ANTESALA SIN QUEMAR EL ÚLTIMO ARSENAL",
            lines: [
                "Te guardé la última reserva. No es caridad; es inversión de categoría.",
                "El Comedor es el nodo madre. No gastes la rabia antes de la mesa principal."
            ],
            variants: [
                {
                    expression: "molesto",
                    lines: [
                        "Esta reserva cuesta más de lo que tu heroísmo aparenta, pero la mereces.",
                        "Guarda munición para la mesa final. Llegar elegante también es una estrategia."
                    ]
                },
                {
                    expression: "preocupado",
                    lines: [
                        "No confundas la Antesala con una invitación. Aquí se pierde el inventario mediocre.",
                        "Cruza limpio, conserva recursos y deja el espectáculo para el Comedor."
                    ]
                }
            ]
        },
        comedor: {
            speaker: "rog",
            expression: "gritando",
            channel: "CANAL 12 · CIERRE FINAL",
            objective: "CIERRA EL TICKET EN EL NODO MADRE",
            lines: [
                "Todos los canales llegan a esa mesa. Lo revisé tres veces: no hay desvíos.",
                "SR. M sostiene el ticket abierto. Ciérralo de una vez; después respiramos."
            ],
            variants: [
                {
                    expression: "serio",
                    lines: [
                        "La mesa concentra cada rebote de la ciudad. Esta vez el cálculo es simple.",
                        "SR. M es el último candado: cierra el ticket antes de que abra otro canal."
                    ]
                },
                {
                    expression: "preocupado",
                    lines: [
                        "No queda una ruta lateral. Todo lo que perseguimos termina en ese comedor.",
                        "Hazlo con cabeza: si el nodo cae, la ciudad recupera su propia voz."
                    ]
                }
            ],
            clear: {
                speaker: "sil",
                expression: "feliz",
                channel: "OPERACIÓN CERRADA",
                lines: [
                    "La señal cayó. Caracas vuelve a elegir su voz.",
                    "Ticket 404 cerrado. El equipo sigue de pie. Fin del cálculo."
                ],
                variants: [
                    {
                        expression: "emocionada",
                        lines: [
                            "Confirmo silencio en los seis nodos. La red vuelve a ser de la gente.",
                            "Operación 404 cerrada. Guardé la ruta, por si alguien intenta abrirla otra vez."
                        ]
                    },
                    {
                        expression: "seria",
                        lines: [
                            "El último pulso se apagó. Ya no queda una orden escondida en la línea.",
                            "Cerramos el ticket y conservamos el equipo. Eso también cuenta como victoria."
                        ]
                    }
                ]
            }
        }
    };


    A.op404 = A.op404 || {};

    A.op404.LEVELS = LEVELS;
    A.op404.DOSSIER = DOSSIER;
    A.op404.ENEMY_SPAWN_TABLE = ENEMY_SPAWN_TABLE;

    A.op404.WORLDS = WORLDS;

    A.op404.MAP_W = EXPANDED_MAP_W;
    A.op404.MAP_H = EXPANDED_MAP_H;

})(window.Arcade404);
