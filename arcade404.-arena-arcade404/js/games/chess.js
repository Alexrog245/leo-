/* =========================================================
   ARCADE 404 — GAME 06 · CHESS
   Motor completo (enroque, paso, promoción, jaque/mate)
   con IA minimax + poda alfa-beta y tres niveles.
   ========================================================= */

(function (A) {

    "use strict";


    const { utils, canvasKit } = A;


    /* ---------------------------------------------------------
       CONSTANTES
       ========================================================= */

    const SIZE = 620;
    const BOARD = 544;
    const SQUARE = BOARD / 8;          /* 68 */
    const OFFSET = (SIZE - BOARD) / 2; /* 38 */

    const FILES = "abcdefgh";

    const VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };

    const GLYPHS = {
        K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
        k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟"
    };

    const MATE = 100000;

    /* Panel lateral (capturas + registro) cuando sobra ancho */
    const PANEL_W = 168;
    const PANEL_X = OFFSET + BOARD + 22;
    const START_COUNT = { P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1 };

    const START_FEN =
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";


    /* ---------------------------------------------------------
       TABLAS DE POSICIÓN (perspectiva blanca, índice 0 = a8)
       --------------------------------------------------------- */

    const PST = {

        P: [
            0, 0, 0, 0, 0, 0, 0, 0,
            50, 50, 50, 50, 50, 50, 50, 50,
            10, 10, 20, 30, 30, 20, 10, 10,
            5, 5, 10, 25, 25, 10, 5, 5,
            0, 0, 0, 20, 20, 0, 0, 0,
            5, -5, -10, 0, 0, -10, -5, 5,
            5, 10, 10, -20, -20, 10, 10, 5,
            0, 0, 0, 0, 0, 0, 0, 0
        ],

        N: [
            -50, -40, -30, -30, -30, -30, -40, -50,
            -40, -20, 0, 0, 0, 0, -20, -40,
            -30, 0, 10, 15, 15, 10, 0, -30,
            -30, 5, 15, 20, 20, 15, 5, -30,
            -30, 0, 15, 20, 20, 15, 0, -30,
            -30, 5, 10, 15, 15, 10, 5, -30,
            -40, -20, 0, 5, 5, 0, -20, -40,
            -50, -40, -30, -30, -30, -30, -40, -50
        ],

        B: [
            -20, -10, -10, -10, -10, -10, -10, -20,
            -10, 0, 0, 0, 0, 0, 0, -10,
            -10, 0, 5, 10, 10, 5, 0, -10,
            -10, 5, 5, 10, 10, 5, 5, -10,
            -10, 0, 10, 10, 10, 10, 0, -10,
            -10, 10, 10, 10, 10, 10, 10, -10,
            -10, 5, 0, 0, 0, 0, 5, -10,
            -20, -10, -10, -10, -10, -10, -10, -20
        ],

        R: [
            0, 0, 0, 0, 0, 0, 0, 0,
            5, 10, 10, 10, 10, 10, 10, 5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            -5, 0, 0, 0, 0, 0, 0, -5,
            0, 0, 0, 5, 5, 0, 0, 0
        ],

        Q: [
            -20, -10, -10, -5, -5, -10, -10, -20,
            -10, 0, 0, 0, 0, 0, 0, -10,
            -10, 0, 5, 5, 5, 5, 0, -10,
            -5, 0, 5, 5, 5, 5, 0, -5,
            0, 0, 5, 5, 5, 5, 0, -5,
            -10, 5, 5, 5, 5, 5, 0, -10,
            -10, 0, 5, 0, 0, 0, 0, -10,
            -20, -10, -10, -5, -5, -10, -10, -20
        ],

        K: [
            -30, -40, -40, -50, -50, -40, -40, -30,
            -30, -40, -40, -50, -50, -40, -40, -30,
            -30, -40, -40, -50, -50, -40, -40, -30,
            -30, -40, -40, -50, -50, -40, -40, -30,
            -20, -30, -30, -40, -40, -30, -30, -20,
            -10, -20, -20, -20, -20, -20, -20, -10,
            20, 20, 0, 0, 0, 0, 20, 20,
            20, 30, 10, 0, 0, 10, 30, 20
        ]

    };


    const KNIGHT_DIRS = [
        [1, 2], [2, 1], [2, -1], [1, -2],
        [-1, -2], [-2, -1], [-2, 1], [-1, 2]
    ];

    const KING_DIRS = [
        [1, 0], [1, 1], [0, 1], [-1, 1],
        [-1, 0], [-1, -1], [0, -1], [1, -1]
    ];

    const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];


    /* ---------------------------------------------------------
       HELPERS DE TABLERO
       --------------------------------------------------------- */

    function fileOf(index) {
        return index % 8;
    }

    function rankOf(index) {
        return Math.floor(index / 8);
    }

    function isInside(file, rank) {
        return file >= 0 && file < 8 && rank >= 0 && rank < 8;
    }

    function toIndex(file, rank) {
        return rank * 8 + file;
    }

    function algebraic(index) {
        return FILES[fileOf(index)] + (8 - rankOf(index));
    }

    function colorOf(piece) {
        if (!piece) {
            return null;
        }
        return piece === piece.toUpperCase() ? "w" : "b";
    }

    function mirror(index) {
        return (7 - rankOf(index)) * 8 + fileOf(index);
    }

    function opposite(color) {
        return color === "w" ? "b" : "w";
    }


    /* ---------------------------------------------------------
       POSICIÓN
       --------------------------------------------------------- */

    function createPosition(fen) {

        const position = {
            board: new Array(64).fill(null),
            turn: "w",
            castling: { wk: true, wq: true, bk: true, bq: true },
            ep: null,
            halfmove: 0,
            fullmove: 1
        };

        if (!fen) {
            return position;
        }

        const parts = fen.trim().split(/\s+/);

        const placement = parts[0];

        let index = 0;

        for (let i = 0; i < placement.length; i += 1) {

            const char = placement[i];

            if (char === "/") {
                continue;
            }

            if (/\d/.test(char)) {

                index += parseInt(char, 10);

            } else {

                position.board[index] = char;
                index += 1;

            }

        }

        position.turn = parts[1] === "b" ? "b" : "w";

        const rights = parts[2] || "-";

        position.castling = {
            wk: rights.indexOf("K") !== -1,
            wq: rights.indexOf("Q") !== -1,
            bk: rights.indexOf("k") !== -1,
            bq: rights.indexOf("q") !== -1
        };

        if (parts[3] && parts[3] !== "-") {

            const file = FILES.indexOf(parts[3][0]);
            const rank = 8 - parseInt(parts[3][1], 10);

            position.ep = toIndex(file, rank);

        }

        position.halfmove = parseInt(parts[4], 10) || 0;
        position.fullmove = parseInt(parts[5], 10) || 1;

        return position;

    }


    function clonePosition(position) {

        return {
            board: position.board.slice(),
            turn: position.turn,
            castling: Object.assign({}, position.castling),
            ep: position.ep,
            halfmove: position.halfmove,
            fullmove: position.fullmove
        };

    }


    function kingIndex(position, color) {

        const target = color === "w" ? "K" : "k";

        return position.board.indexOf(target);

    }


    /* ---------------------------------------------------------
       ATAQUES
       --------------------------------------------------------- */

    function pawnAttacksSquare(position, index, byColor) {

        const file = fileOf(index);
        const rank = rankOf(index);

        const pawnDir = byColor === "w" ? 1 : -1;

        for (let df = -1; df <= 1; df += 2) {

            const f = file + df;
            const r = rank + pawnDir;

            if (!isInside(f, r)) {
                continue;
            }

            const piece = position.board[toIndex(f, r)];

            if (
                piece &&
                colorOf(piece) === byColor &&
                piece.toUpperCase() === "P"
            ) {

                return true;

            }

        }

        return false;

    }


    function isAttackedSafe(position, index, byColor) {

        if (pawnAttacksSquare(position, index, byColor)) {
            return true;
        }

        const file = fileOf(index);
        const rank = rankOf(index);


        for (let i = 0; i < KNIGHT_DIRS.length; i += 1) {

            const f = file + KNIGHT_DIRS[i][0];
            const r = rank + KNIGHT_DIRS[i][1];

            if (!isInside(f, r)) {
                continue;
            }

            const piece = position.board[toIndex(f, r)];

            if (
                piece &&
                colorOf(piece) === byColor &&
                piece.toUpperCase() === "N"
            ) {
                return true;
            }

        }


        for (let i = 0; i < KING_DIRS.length; i += 1) {

            const f = file + KING_DIRS[i][0];
            const r = rank + KING_DIRS[i][1];

            if (!isInside(f, r)) {
                continue;
            }

            const piece = position.board[toIndex(f, r)];

            if (
                piece &&
                colorOf(piece) === byColor &&
                piece.toUpperCase() === "K"
            ) {
                return true;
            }

        }


        const groups = [
            { dirs: ROOK_DIRS, types: ["R", "Q"] },
            { dirs: BISHOP_DIRS, types: ["B", "Q"] }
        ];

        for (let g = 0; g < groups.length; g += 1) {

            const group = groups[g];

            for (let d = 0; d < group.dirs.length; d += 1) {

                const [df, dr] = group.dirs[d];

                let f = file + df;
                let r = rank + dr;

                while (isInside(f, r)) {

                    const piece = position.board[toIndex(f, r)];

                    if (piece) {

                        if (
                            colorOf(piece) === byColor &&
                            group.types.indexOf(piece.toUpperCase()) !== -1
                        ) {
                            return true;
                        }

                        break;

                    }

                    f += df;
                    r += dr;

                }

            }

        }


        return false;

    }


    function inCheck(position, color) {

        const target = color || position.turn;

        const index = kingIndex(position, target);

        if (index === -1) {
            return false;
        }

        return isAttackedSafe(position, index, opposite(target));

    }


    /* ---------------------------------------------------------
       GENERACIÓN DE MOVIMIENTOS
       --------------------------------------------------------- */

    function generatePseudoMoves(position) {

        const moves = [];

        const color = position.turn;

        for (let from = 0; from < 64; from += 1) {

            const piece = position.board[from];

            if (!piece || colorOf(piece) !== color) {
                continue;
            }

            const type = piece.toUpperCase();

            const file = fileOf(from);
            const rank = rankOf(from);


            if (type === "P") {

                const dir = color === "w" ? -1 : 1;
                const startRank = color === "w" ? 6 : 1;
                const promoRank = color === "w" ? 0 : 7;


                /* Avance */
                const oneRank = rank + dir;

                if (
                    isInside(file, oneRank) &&
                    !position.board[toIndex(file, oneRank)]
                ) {

                    addPawn(moves, from, toIndex(file, oneRank), oneRank === promoRank);

                    const twoRank = rank + dir * 2;

                    if (
                        rank === startRank &&
                        isInside(file, twoRank) &&
                        !position.board[toIndex(file, twoRank)]
                    ) {

                        moves.push({
                            from,
                            to: toIndex(file, twoRank),
                            double: true
                        });

                    }

                }


                /* Capturas */
                [-1, 1].forEach((df) => {

                    const f = file + df;
                    const r = rank + dir;

                    if (!isInside(f, r)) {
                        return;
                    }

                    const to = toIndex(f, r);

                    const target = position.board[to];

                    if (target && colorOf(target) !== color) {

                        addPawn(moves, from, to, r === promoRank, target);

                    } else if (position.ep === to) {

                        moves.push({
                            from,
                            to,
                            epCapture: true,
                            captured: color === "w" ? "p" : "P"
                        });

                    }

                });

            }


            if (type === "N" || type === "K") {

                const dirs = type === "N" ? KNIGHT_DIRS : KING_DIRS;

                dirs.forEach(([df, dr]) => {

                    const f = file + df;
                    const r = rank + dr;

                    if (!isInside(f, r)) {
                        return;
                    }

                    const to = toIndex(f, r);

                    const target = position.board[to];

                    if (!target || colorOf(target) !== color) {
                        moves.push({ from, to, captured: target || null });
                    }

                });

            }


            if (type === "B" || type === "R" || type === "Q") {

                const dirs =
                    type === "B" ? BISHOP_DIRS :
                    type === "R" ? ROOK_DIRS :
                    ROOK_DIRS.concat(BISHOP_DIRS);

                dirs.forEach(([df, dr]) => {

                    let f = file + df;
                    let r = rank + dr;

                    while (isInside(f, r)) {

                        const to = toIndex(f, r);

                        const target = position.board[to];

                        if (!target) {

                            moves.push({ from, to, captured: null });

                        } else {

                            if (colorOf(target) !== color) {
                                moves.push({ from, to, captured: target });
                            }

                            break;

                        }

                        f += df;
                        r += dr;

                    }

                });

            }

        }


        /* Enroques */
        addCastles(position, moves);

        return moves;

    }


    function addPawn(moves, from, to, promotion, captured) {

        if (promotion) {

            ["q", "r", "b", "n"].forEach((piece) => {

                moves.push({
                    from,
                    to,
                    promotion: piece,
                    captured: captured || null
                });

            });

            return;

        }

        moves.push({ from, to, captured: captured || null });

    }


    function addCastles(position, moves) {

        const color = position.turn;

        const enemy = opposite(color);

        const kingFrom = color === "w" ? 60 : 4;

        if (position.board[kingFrom] !== (color === "w" ? "K" : "k")) {
            return;
        }

        if (isAttackedSafe(position, kingFrom, enemy)) {
            return;
        }

        const rights = position.castling;

        const kingSide = color === "w" ? rights.wk : rights.bk;
        const queenSide = color === "w" ? rights.wq : rights.bq;

        const rookK = color === "w" ? 63 : 7;
        const rookQ = color === "w" ? 56 : 0;


        if (kingSide && position.board[rookK] === (color === "w" ? "R" : "r")) {

            const between = [kingFrom + 1, kingFrom + 2];

            const empty = between.every((sq) => !position.board[sq]);

            const safe = between.every(
                (sq) => !isAttackedSafe(position, sq, enemy)
            );

            if (empty && safe) {

                moves.push({
                    from: kingFrom,
                    to: kingFrom + 2,
                    castle: "K"
                });

            }

        }


        if (queenSide && position.board[rookQ] === (color === "w" ? "R" : "r")) {

            const between = [kingFrom - 1, kingFrom - 2, kingFrom - 3];

            const empty = between.every((sq) => !position.board[sq]);

            const safe = [kingFrom - 1, kingFrom - 2].every(
                (sq) => !isAttackedSafe(position, sq, enemy)
            );

            if (empty && safe) {

                moves.push({
                    from: kingFrom,
                    to: kingFrom - 2,
                    castle: "Q"
                });

            }

        }

    }


    /* ---------------------------------------------------------
       APLICAR / DESHACER
       --------------------------------------------------------- */

    function makeMove(position, move) {

        const undo = {
            castling: Object.assign({}, position.castling),
            ep: position.ep,
            halfmove: position.halfmove,
            fullmove: position.fullmove,
            captured: position.board[move.to] || null,
            capturedIndex: move.to,
            epCapturedIndex: null,
            epCaptured: null
        };

        const piece = position.board[move.from];

        const color = colorOf(piece);

        position.board[move.from] = null;


        /* Captura al paso */
        if (move.epCapture) {

            const index = move.to + (color === "w" ? 8 : -8);

            undo.epCapturedIndex = index;
            undo.epCaptured = position.board[index];

            position.board[index] = null;

        }


        /* Promoción */
        position.board[move.to] = move.promotion
            ? (color === "w" ? move.promotion.toUpperCase() : move.promotion)
            : piece;


        /* Enroque: mueve la torre */
        if (move.castle === "K") {

            const rookFrom = move.to + 1;
            const rookTo = move.to - 1;

            position.board[rookTo] = position.board[rookFrom];
            position.board[rookFrom] = null;

        }

        if (move.castle === "Q") {

            const rookFrom = move.to - 2;
            const rookTo = move.to + 1;

            position.board[rookTo] = position.board[rookFrom];
            position.board[rookFrom] = null;

        }


        /* Derechos de enroque */
        if (piece === "K") {
            position.castling.wk = false;
            position.castling.wq = false;
        }

        if (piece === "k") {
            position.castling.bk = false;
            position.castling.bq = false;
        }

        if (move.from === 63 || move.to === 63) {
            position.castling.wk = false;
        }

        if (move.from === 56 || move.to === 56) {
            position.castling.wq = false;
        }

        if (move.from === 7 || move.to === 7) {
            position.castling.bk = false;
        }

        if (move.from === 0 || move.to === 0) {
            position.castling.bq = false;
        }


        /* Peón al paso */
        position.ep = move.double
            ? move.from + (color === "w" ? -8 : 8)
            : null;


        /* Contadores */
        if (piece.toUpperCase() === "P" || undo.captured || move.epCapture) {
            position.halfmove = 0;
        } else {
            position.halfmove += 1;
        }

        if (color === "b") {
            position.fullmove += 1;
        }

        position.turn = opposite(color);

        return undo;

    }


    function undoMove(position, move, undo) {

        const color = opposite(position.turn);

        const piece = position.board[move.to];


        /* Deshacer promoción */
        position.board[move.from] = move.promotion
            ? (color === "w" ? "P" : "p")
            : piece;

        position.board[move.to] = undo.captured;


        if (undo.epCapturedIndex !== null) {

            position.board[undo.epCapturedIndex] = undo.epCaptured;
            position.board[move.to] = null;

        }


        if (move.castle === "K") {

            const rookTo = move.to + 1;
            const rookFrom = move.to - 1;

            position.board[rookTo] = position.board[rookFrom];
            position.board[rookFrom] = null;

        }

        if (move.castle === "Q") {

            const rookTo = move.to - 2;
            const rookFrom = move.to + 1;

            position.board[rookTo] = position.board[rookFrom];
            position.board[rookFrom] = null;

        }


        position.castling = undo.castling;
        position.ep = undo.ep;
        position.halfmove = undo.halfmove;
        position.fullmove = undo.fullmove;
        position.turn = color;

    }


    function legalMoves(position) {

        const moves = generatePseudoMoves(position);

        const legal = [];

        for (let i = 0; i < moves.length; i += 1) {

            const move = moves[i];

            const undo = makeMove(position, move);

            if (!inCheck(position, opposite(position.turn))) {
                legal.push(move);
            }

            undoMove(position, move, undo);

        }

        return legal;

    }


    /* ---------------------------------------------------------
       EVALUACIÓN
       --------------------------------------------------------- */

    function evaluate(position) {

        let score = 0;

        for (let i = 0; i < 64; i += 1) {

            const piece = position.board[i];

            if (!piece) {
                continue;
            }

            const type = piece.toUpperCase();

            const table = PST[type];

            const positional = table
                ? table[colorOf(piece) === "w" ? i : mirror(i)]
                : 0;

            if (colorOf(piece) === "w") {

                score += VALUES[type] + positional;

            } else {

                score -= VALUES[type] + positional;

            }

        }

        return position.turn === "w" ? score : -score;

    }


    function scoreMove(position, move) {

        let score = 0;

        const victim = position.board[move.to];

        if (victim) {

            const attacker = position.board[move.from];

            score += 10 * VALUES[victim.toUpperCase()] -
                VALUES[attacker.toUpperCase()];

        }

        if (move.promotion) {
            score += 8000;
        }

        return score;

    }


    /* ---------------------------------------------------------
       BÚSQUEDA (negamax + poda alfa-beta)
       --------------------------------------------------------- */

    function search(position, depth, alpha, beta, ply) {

        if (position.halfmove >= 100) {
            return 0;
        }

        const moves = legalMoves(position);

        if (!moves.length) {

            if (inCheck(position, position.turn)) {
                return -MATE + ply;
            }

            return 0;

        }

        if (depth <= 0) {
            return evaluate(position);
        }

        moves.sort((a, b) => scoreMove(position, b) - scoreMove(position, a));

        let best = -Infinity;

        for (let i = 0; i < moves.length; i += 1) {

            const move = moves[i];

            const undo = makeMove(position, move);

            const score = -search(
                position,
                depth - 1,
                -beta,
                -alpha,
                ply + 1
            );

            undoMove(position, move, undo);

            if (score > best) {
                best = score;
            }

            if (best > alpha) {
                alpha = best;
            }

            if (alpha >= beta) {
                break;
            }

        }

        return best;

    }


    function findBestMove(position, depth) {

        const moves = legalMoves(position);

        if (!moves.length) {
            return null;
        }

        moves.sort((a, b) => scoreMove(position, b) - scoreMove(position, a));

        let bestMove = moves[0];
        let bestScore = -Infinity;

        let alpha = -Infinity;

        const scored = [];

        for (let i = 0; i < moves.length; i += 1) {

            const move = moves[i];

            const undo = makeMove(position, move);

            const score = -search(
                position,
                depth - 1,
                -Infinity,
                -alpha,
                1
            );

            undoMove(position, move, undo);

            scored.push({ move, score });

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }

            if (score > alpha) {
                alpha = score;
            }

        }

        /* En nivel fácil se permite cierta aleatoriedad */
        if (depth <= 1) {

            const pool = scored.filter(
                (item) => item.score >= bestScore - 45
            );

            if (pool.length > 1) {
                return utils.pick(pool).move;
            }

        }

        return bestMove;

    }


    /* ---------------------------------------------------------
       NOTACIÓN
       --------------------------------------------------------- */

    function toSan(position, move, moves) {

        if (move.castle) {
            return move.castle === "K" ? "O-O" : "O-O-O";
        }

        const piece = position.board[move.from];

        const type = piece.toUpperCase();

        let text = "";

        if (type === "P") {

            if (position.board[move.to] || move.epCapture) {
                text += FILES[fileOf(move.from)] + "x";
            }

            text += algebraic(move.to);

            if (move.promotion) {
                text += "=" + move.promotion.toUpperCase();
            }

            return text;

        }


        text += type;


        /* Desambiguación */
        const others = (moves || legalMoves(position)).filter((item) => {

            return (
                item !== move &&
                item.to === move.to &&
                position.board[item.from] === piece &&
                !item.castle
            );

        });

        if (others.length) {

            const sameFile = others.some(
                (item) => fileOf(item.from) === fileOf(move.from)
            );

            const sameRank = others.some(
                (item) => rankOf(item.from) === rankOf(move.from)
            );

            if (!sameFile) {

                text += FILES[fileOf(move.from)];

            } else if (!sameRank) {

                text += String(8 - rankOf(move.from));

            } else {

                text += algebraic(move.from);

            }

        }


        if (position.board[move.to]) {
            text += "x";
        }

        text += algebraic(move.to);

        return text;

    }


    /* ---------------------------------------------------------
       JUEGO
       --------------------------------------------------------- */

    class ChessGame {

        constructor(shell) {

            this.shell = shell;

            this.panel = false;
            this.W = SIZE;
            this.H = SIZE;

            this.stage = A.createStage(shell.refs.stage, {
                width: this.W,
                height: this.H,
                background: "#0B0D14"
            });

            this.measure();

            this.human = "w";
            this.depth = 2;

            this.reset();

            this.bindBoard();
            this.bindDifficulty();
            this.bindUndo();
            this.bindResign();

            shell.setTouchControls({ mode: "none" });

        }


        /* ---------------------------------------------------------
           Medidas — en pantallas anchas se abre un panel lateral
           con las piezas capturadas y el registro de jugadas.
           --------------------------------------------------------- */

        measure() {

            const ratio = this.shell.stageRatio || 1;

            const withPanel = ratio >= 1.12;

            const width = withPanel ? SIZE + PANEL_W : SIZE;

            const changed = width !== this.W || withPanel !== this.panel;

            this.W = width;
            this.H = SIZE;
            this.panel = withPanel;

            if (this.stage) {
                this.stage.setLogical(width, SIZE);
            }

            return changed;

        }


        layout() {

            if (this.shell.state === "running") {
                return;
            }

            if (this.measure()) {
                this.render();
            }

        }


        /* ---------------------------------------------------------
           Estado
           --------------------------------------------------------- */

        reset() {

            this.pos = createPosition(START_FEN);

            this.history = [];

            this.selected = null;
            this.legalFor = [];
            this.legalCache = null;

            this.thinking = false;
            this.finished = false;

            this.captured = { w: 0, b: 0 };

            this.moveCount = 0;

            this.updateStats();

            this.render();

        }


        start() {
            this.reset();
        }


        restart() {
            this.reset();
        }


        destroy() {

            if (this.aiTimer) {
                clearTimeout(this.aiTimer);
            }

            this.stage.destroy();

        }


        /* ---------------------------------------------------------
           Interacción
           --------------------------------------------------------- */

        bindBoard() {

            const canvas = this.stage.canvas;

            this._onClick = (event) => {

                const point = this.stage.toLogical(
                    event.clientX,
                    event.clientY
                );

                const file = Math.floor((point.x - OFFSET) / SQUARE);
                const rank = Math.floor((point.y - OFFSET) / SQUARE);

                if (!isInside(file, rank)) {
                    return;
                }

                this.tapSquare(toIndex(file, rank));

            };

            canvas.addEventListener("click", this._onClick);

        }


        bindDifficulty() {

            const buttons = utils.qsa("[data-difficulty]", this.shell.root);

            const saved = A.storage.getSettings().difficulty || "normal";

            const map = { easy: 1, normal: 2, hard: 3 };

            this.depth = map[saved] || 2;

            buttons.forEach((button) => {

                button.classList.toggle(
                    "is-active",
                    button.dataset.difficulty === saved
                );

                button.addEventListener("click", () => {

                    buttons.forEach((item) => {

                        item.classList.toggle(
                            "is-active",
                            item === button
                        );

                    });

                    const level = button.dataset.difficulty;

                    this.depth = map[level] || 2;

                    A.storage.saveSettings({ difficulty: level });

                    A.audio.play("select");

                    this.updateStats();

                });

            });

        }


        bindUndo() {

            const button = this.shell.q("[data-action='undo']");

            if (button) {

                button.addEventListener("click", () => {
                    this.undo();
                });

            }

        }


        /** El jugador tira la toalla: la máquina se burla */
        bindResign() {

            const button = this.shell.q("[data-action='resign']");

            if (button) {

                button.addEventListener("click", () => {
                    this.resign();
                });

            }

        }


        resign() {

            if (this.finished) {
                return;
            }

            this.finished = true;

            this.shell.gameOver({
                taunt: true,
                title: "TE RENDISTE",
                eyebrow: "DEFEAT",
                text: "Has abandonado la partida. La máquina ya lo sabía.",
                score: Math.max(
                    100,
                    this.captured[this.human] - this.moveCount * 5
                )
            });

        }


        tapSquare(index) {

            if (this.finished || this.thinking) {
                return;
            }

            if (this.pos.turn !== this.human) {
                return;
            }


            /* ¿Mover a una casilla legal? */
            if (this.selected !== null) {

                const move = this.legalFor.find(
                    (item) => item.to === index
                );

                if (move) {

                    this.play(move);

                    return;

                }

            }


            const piece = this.pos.board[index];

            if (piece && colorOf(piece) === this.human) {

                this.selected = index;

                this.legalFor = this.legalMoves().filter(
                    (item) => item.from === index
                );

                A.audio.play("select");

            } else {

                this.selected = null;
                this.legalFor = [];

            }

            this.render();

        }


        legalMoves() {

            if (!this.legalCache) {
                this.legalCache = legalMoves(this.pos);
            }

            return this.legalCache;

        }


        /* ---------------------------------------------------------
           Partida
           --------------------------------------------------------- */

        play(move) {

            const moves = this.legalMoves();

            const san = toSan(this.pos, move, moves);

            const mover = this.pos.turn;

            const undo = makeMove(this.pos, move);

            const check = inCheck(this.pos, this.pos.turn);

            const hasReply = legalMoves(this.pos).length > 0;

            const suffix = check ? (hasReply ? "+" : "#") : "";

            this.history.push({
                move,
                undo,
                san: san + suffix,
                mover,
                captured: undo.captured || undo.epCaptured || null
            });

            if (undo.captured || undo.epCaptured) {

                const value = VALUES[
                    (undo.captured || undo.epCaptured).toUpperCase()
                ];

                this.captured[mover] += value;

                A.audio.play("capture");

            } else {

                A.audio.play("movePiece");

            }

            this.selected = null;
            this.legalFor = [];
            this.legalCache = null;

            this.moveCount += 1;

            this.render();
            this.updateLog();
            this.updateStats();


            /* ¿Fin de partida? */
            const replies = legalMoves(this.pos);

            if (!replies.length) {

                this.finish(check ? mover : null, check);

                return;

            }

            if (this.pos.halfmove >= 100) {

                this.finish(null, false, "TABLAS POR 50 MOVIMIENTOS");

                return;

            }

            if (check) {
                A.audio.play("check");
            }


            /* Turno de la CPU */
            if (this.pos.turn !== this.human) {

                this.thinking = true;

                this.setStatus("CPU THINKING");

                this.render();

                this.aiTimer = setTimeout(() => {

                    this.aiTimer = null;

                    this.aiMove();

                }, 260);

            } else {

                this.setStatus(check ? "CHECK!" : "YOUR TURN");

            }

        }


        aiMove() {

            /* La partida pudo abandonarse mientras la CPU pensaba */
            if (this.finished || this.shell.root.hidden) {
                this.thinking = false;
                return;
            }

            const move = findBestMove(this.pos, this.depth);

            this.thinking = false;

            if (!move) {

                const check = inCheck(this.pos, this.pos.turn);

                this.finish(check ? opposite(this.pos.turn) : null, check);

                return;

            }

            this.play(move);

        }


        undo() {

            if (this.thinking || this.finished) {
                return;
            }

            let steps = 0;

            while (this.history.length && steps < 2) {

                const entry = this.history.pop();

                undoMove(this.pos, entry.move, entry.undo);

                if (entry.captured) {

                    this.captured[entry.mover] -= VALUES[
                        entry.captured.toUpperCase()
                    ];

                    this.captured[entry.mover] = Math.max(
                        0,
                        this.captured[entry.mover]
                    );

                }

                this.moveCount = Math.max(0, this.moveCount - 1);

                steps += 1;

                if (this.pos.turn === this.human) {
                    break;
                }

            }

            this.selected = null;
            this.legalFor = [];
            this.legalCache = null;

            A.audio.play("back");

            this.setStatus("YOUR TURN");

            this.render();
            this.updateLog();
            this.updateStats();

        }


        finish(winner, check, reason) {

            this.finished = true;

            const playerWon = winner === this.human;

            const score = Math.max(
                100,
                1000 +
                this.captured[this.human] -
                this.captured[opposite(this.human)] -
                this.moveCount * 5
            );


            /* Nada de tablas: si la partida se encalla, la CPU
               se rinde y la victoria es tuya. */
            if (winner === null) {

                this.shell.win({
                    taunt: true,
                    title: "LA CPU SE RINDE",
                    eyebrow: "NO HAY TABLAS",
                    text: reason
                        ? `${reason}. La máquina se rinde: victoria para ti.`
                        : "Posición sin salida. La máquina se rinde y te da la partida.",
                    score: score
                });

                return;

            }


            if (playerWon) {

                /* Hilo narrativo: ganarle a la CPU es el hito del
                   capítulo 7, la partida contra Belisario. */
                if (this.shell.checkStory && this.shell.checkStory(1)) {
                    return;
                }

                this.shell.win({
                    taunt: true,
                    title: "CHECKMATE",
                    eyebrow: "VICTORY",
                    text: "Has dado jaque mate a la CPU.",
                    score: score
                });

            } else {

                this.shell.gameOver({
                    taunt: true,
                    title: "CHECKMATE",
                    eyebrow: "DEFEAT",
                    text: "La CPU te ha dado jaque mate.",
                    score: score
                });

            }

        }


        /* ---------------------------------------------------------
           Paneles
           --------------------------------------------------------- */

        setStatus(text) {
            this.shell.setStatus(text);
        }


        updateStats() {

            const diff = this.captured[this.human] -
                this.captured[opposite(this.human)];

            this.shell.setStat("turn", this.pos.turn === "w" ? "WHITE" : "BLACK");
            this.shell.setStat("moves", this.moveCount);
            this.shell.setStat("material", diff >= 0 ? `+${diff}` : String(diff));
            this.shell.setStat("depth", this.depth);

            const king = kingIndex(this.pos, this.pos.turn);

            this.shell.setStat(
                "state",
                king !== -1 && isAttackedSafe(this.pos, king, opposite(this.pos.turn))
                    ? "CHECK"
                    : "OK"
            );

        }


        updateLog() {

            const total = this.history.length;

            const recent = this.history.slice(Math.max(0, total - 6));

            let text = "";

            for (let i = 0; i < recent.length; i += 1) {

                const entry = recent[i];

                const index = total - recent.length + i;

                if (index % 2 === 0) {
                    text += `${Math.floor(index / 2) + 1}. `;
                }

                text += `${entry.san} `;

            }

            this.shell.setLog(text.trim() || "SIN MOVIMIENTOS");

        }


        /* ---------------------------------------------------------
           Dibujo
           --------------------------------------------------------- */

        render() {

            const { ctx } = this.stage;

            this.stage.clear("#0B0D14");

            this.drawBoard();
            this.drawCoordinates();
            this.drawHighlights();
            this.drawPieces();

            if (this.panel) {
                this.drawPanel();
            }

        }


        /** Piezas que le faltan a un bando = capturadas por el otro */
        missingPieces(color) {

            const have = { P: 0, N: 0, B: 0, R: 0, Q: 0, K: 0 };

            for (let index = 0; index < 64; index += 1) {

                const piece = this.pos.board[index];

                if (piece && colorOf(piece) === color) {
                    have[piece.toUpperCase()] += 1;
                }

            }

            const out = [];

            Object.keys(have).forEach((type) => {

                const diff = START_COUNT[type] - have[type];

                for (let i = 0; i < diff; i += 1) {
                    out.push(type);
                }

            });

            return out;

        }


        drawPanel() {

            const { ctx } = this.stage;

            const width = PANEL_W;
            const x = PANEL_X;
            const y = OFFSET;
            const height = BOARD;

            ctx.save();

            canvasKit.fillRoundRect(
                ctx, x, y, width, height, 10, "rgba(10, 12, 20, 0.72)"
            );

            ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
            ctx.lineWidth = 1;

            canvasKit.roundRect(ctx, x, y, width, height, 10);
            ctx.stroke();

            ctx.restore();

            const titleFont = "700 10px 'JetBrains Mono', monospace";

            canvasKit.text(ctx, "CAPTURADAS", x + width / 2, y + 22, {
                font: titleFont,
                color: "rgba(212, 175, 55, 0.9)"
            });


            /* Tus capturas (piezas negras que faltan) */
            let cursor = y + 44;

            canvasKit.text(ctx, "TÚ", x + 12, cursor, {
                font: "700 9px 'JetBrains Mono', monospace",
                color: "#7DF9FF",
                align: "left"
            });

            cursor += 18;

            this.drawCapturedRow(
                this.missingPieces("b"),
                x + 12,
                cursor,
                width - 24,
                "b"
            );

            cursor += 56;


            /* Capturas de la CPU */
            canvasKit.text(ctx, "CPU", x + 12, cursor, {
                font: "700 9px 'JetBrains Mono', monospace",
                color: "#FF5CA8",
                align: "left"
            });

            cursor += 18;

            this.drawCapturedRow(
                this.missingPieces("w"),
                x + 12,
                cursor,
                width - 24,
                "w"
            );


            /* Registro de jugadas */
            const last = this.history[this.history.length - 1];

            canvasKit.text(
                ctx,
                "ÚLTIMA",
                x + width / 2,
                y + height - 62,
                { font: titleFont, color: "rgba(133,137,154,0.8)" }
            );

            canvasKit.text(
                ctx,
                last ? last.san : "—",
                x + width / 2,
                y + height - 40,
                {
                    font: "700 20px 'JetBrains Mono', monospace",
                    color: "#F5F7FF",
                    shadow: "rgba(212, 175, 55, 0.5)",
                    shadowBlur: 12
                }
            );

            canvasKit.text(
                ctx,
                `MOV ${this.moveCount} · NVL ${this.depth}`,
                x + width / 2,
                y + height - 16,
                { font: "700 9px 'JetBrains Mono', monospace", color: "rgba(133,137,154,0.85)" }
            );

        }


        drawCapturedRow(list, x, y, width, color) {

            const { ctx } = this.stage;

            if (!list.length) {

                canvasKit.text(ctx, "—", x + 4, y + 8, {
                    font: "700 11px 'JetBrains Mono', monospace",
                    color: "rgba(133,137,154,0.5)",
                    align: "left"
                });

                return;

            }

            const size = 20;

            const perRow = Math.max(1, Math.floor(width / size));

            list.slice(0, 32).forEach((type, index) => {

                const col = index % perRow;
                const row = Math.floor(index / perRow);

                const px = x + col * size + size / 2;
                const py = y + row * size + size / 2;

                const glyph = GLYPHS[color === "w" ? type : type.toLowerCase()];

                ctx.save();

                ctx.font = `${Math.floor(size * 0.95)}px "Segoe UI Symbol", "Arial Unicode MS", "DejaVu Sans", serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                ctx.shadowColor = color === "w" ? "#FF5CA8" : "#7DF9FF";
                ctx.shadowBlur = 8;

                ctx.fillStyle = "rgba(8, 10, 18, 0.95)";
                ctx.fillText(glyph, px, py);

                ctx.lineWidth = 1.2;
                ctx.strokeStyle = color === "w" ? "#FF5CA8" : "#7DF9FF";
                ctx.strokeText(glyph, px, py);

                ctx.restore();

            });

        }


        /* El tablero nunca cambia: se pinta una vez y se reutiliza */
        boardSprite() {

            if (this._boardSprite) {
                return this._boardSprite;
            }

            const pad = 4;

            const size = BOARD + pad * 2;

            const canvas = document.createElement("canvas");

            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = size * dpr;
            canvas.height = size * dpr;

            const c = canvas.getContext("2d");

            c.scale(dpr, dpr);

            for (let rank = 0; rank < 8; rank += 1) {

                for (let file = 0; file < 8; file += 1) {

                    const light = (file + rank) % 2 === 0;

                    c.fillStyle = light ? "#232A3B" : "#141824";

                    c.fillRect(
                        pad + file * SQUARE,
                        pad + rank * SQUARE,
                        SQUARE,
                        SQUARE
                    );

                }

            }

            /* Marco */
            c.strokeStyle = "rgba(212, 175, 55, 0.45)";
            c.lineWidth = 2;

            c.strokeRect(pad - 1, pad - 1, BOARD + 2, BOARD + 2);

            this._boardSprite = { canvas, size, pad };

            return this._boardSprite;

        }


        drawBoard() {

            const { ctx } = this.stage;

            const sprite = this.boardSprite();

            ctx.drawImage(
                sprite.canvas,
                OFFSET - sprite.pad,
                OFFSET - sprite.pad,
                sprite.size,
                sprite.size
            );

        }


        drawCoordinates() {

            const { ctx } = this.stage;

            const style = {
                font: "500 12px 'JetBrains Mono', monospace",
                color: "rgba(133,137,154,0.7)"
            };

            for (let file = 0; file < 8; file += 1) {

                canvasKit.text(
                    ctx,
                    FILES[file],
                    OFFSET + file * SQUARE + SQUARE / 2,
                    OFFSET + BOARD + 18,
                    style
                );

            }

            for (let rank = 0; rank < 8; rank += 1) {

                canvasKit.text(
                    ctx,
                    String(8 - rank),
                    OFFSET - 18,
                    OFFSET + rank * SQUARE + SQUARE / 2,
                    style
                );

            }

        }


        drawHighlights() {

            const { ctx } = this.stage;


            /* Último movimiento */
            const last = this.history[this.history.length - 1];

            if (last) {

                [last.move.from, last.move.to].forEach((index) => {

                    ctx.fillStyle = "rgba(34, 211, 238, 0.12)";

                    ctx.fillRect(
                        OFFSET + fileOf(index) * SQUARE,
                        OFFSET + rankOf(index) * SQUARE,
                        SQUARE,
                        SQUARE
                    );

                });

            }


            /* Jaque */
            const king = kingIndex(this.pos, this.pos.turn);

            if (
                king !== -1 &&
                isAttackedSafe(this.pos, king, opposite(this.pos.turn))
            ) {

                ctx.save();

                ctx.fillStyle = "rgba(244, 63, 94, 0.28)";
                ctx.fillRect(
                    OFFSET + fileOf(king) * SQUARE,
                    OFFSET + rankOf(king) * SQUARE,
                    SQUARE,
                    SQUARE
                );

                ctx.restore();

            }


            /* Selección */
            if (this.selected !== null) {

                ctx.save();

                ctx.strokeStyle = "rgba(212, 175, 55, 0.9)";
                ctx.lineWidth = 2;

                ctx.strokeRect(
                    OFFSET + fileOf(this.selected) * SQUARE + 1,
                    OFFSET + rankOf(this.selected) * SQUARE + 1,
                    SQUARE - 2,
                    SQUARE - 2
                );

                ctx.restore();

            }


            /* Movimientos legales */
            this.legalFor.forEach((move) => {

                const cx = OFFSET + fileOf(move.to) * SQUARE + SQUARE / 2;
                const cy = OFFSET + rankOf(move.to) * SQUARE + SQUARE / 2;

                ctx.save();

                if (this.pos.board[move.to] || move.epCapture) {

                    ctx.strokeStyle = "rgba(212, 175, 55, 0.85)";
                    ctx.lineWidth = 3;

                    ctx.beginPath();
                    ctx.arc(cx, cy, SQUARE * 0.36, 0, Math.PI * 2);
                    ctx.stroke();

                } else {

                    ctx.fillStyle = "rgba(212, 175, 55, 0.55)";

                    ctx.beginPath();
                    ctx.arc(cx, cy, SQUARE * 0.13, 0, Math.PI * 2);
                    ctx.fill();

                }

                ctx.restore();

            });

        }


        /* Piezas de neón: relleno oscuro + trazo brillante */
        /* Sprite cacheado de cada pieza.

           Antes cada frame dibujaba 32 glifos Unicode con shadowBlur
           activo: eso obliga al motor a rasterizar tipografía y
           aplicar desenfoque 32 veces por fotograma, y provocaba
           tirones de más de 100 ms. Ahora cada pieza se rasteriza
           una sola vez a un canvas propio y luego sólo se copia. */
        pieceSprite(piece) {

            if (!this._pieceCache) {
                this._pieceCache = new Map();
            }

            const cached = this._pieceCache.get(piece);

            if (cached) {
                return cached;
            }

            /* Margen para que el halo no se recorte */
            const pad = 14;

            const size = SQUARE + pad * 2;

            const canvas = document.createElement("canvas");

            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = size * dpr;
            canvas.height = size * dpr;

            const c = canvas.getContext("2d");

            c.scale(dpr, dpr);

            const isWhite = colorOf(piece) === "w";

            const neon = isWhite ? "#7DF9FF" : "#FF5CA8";
            const core = isWhite ? "rgba(8, 32, 40, 0.92)" : "rgba(38, 8, 26, 0.92)";

            c.font = `${Math.floor(SQUARE * 0.74)}px "Segoe UI Symbol", "Arial Unicode MS", "Noto Sans Symbols 2", "DejaVu Sans", serif`;
            c.textAlign = "center";
            c.textBaseline = "middle";

            const cx = size / 2;
            const cy = size / 2;

            /* Halo */
            c.shadowColor = neon;
            c.shadowBlur = 18;

            /* Cuerpo oscuro: hace que el neón resalte */
            c.fillStyle = core;
            c.fillText(GLYPHS[piece], cx, cy);

            /* Trazo de neón */
            c.lineWidth = 2;
            c.strokeStyle = neon;
            c.strokeText(GLYPHS[piece], cx, cy);

            /* Segundo trazo fino para el brillo interior */
            c.shadowBlur = 0;
            c.lineWidth = 0.8;
            c.strokeStyle = isWhite
                ? "rgba(224, 255, 255, 0.9)"
                : "rgba(255, 214, 235, 0.9)";
            c.strokeText(GLYPHS[piece], cx, cy);

            const sprite = { canvas, size, pad };

            this._pieceCache.set(piece, sprite);

            return sprite;

        }


        drawPieces() {

            const { ctx } = this.stage;

            for (let index = 0; index < 64; index += 1) {

                const piece = this.pos.board[index];

                if (!piece) {
                    continue;
                }

                const sprite = this.pieceSprite(piece);

                const x = OFFSET + fileOf(index) * SQUARE + SQUARE / 2;
                const y = OFFSET + rankOf(index) * SQUARE + SQUARE / 2 + 2;

                ctx.drawImage(
                    sprite.canvas,
                    x - sprite.size / 2,
                    y - sprite.size / 2,
                    sprite.size,
                    sprite.size
                );

            }

        }

    }


    /* ---------------------------------------------------------
       API DEL MOTOR
       Expuesta para pruebas (perft) y depuración.
       --------------------------------------------------------- */

    A.chessEngine = {
        createPosition,
        legalMoves,
        makeMove,
        undoMove,
        inCheck,
        findBestMove,
        evaluate,
        toSan
    };


    /* ---------------------------------------------------------
       REGISTRO
       --------------------------------------------------------- */

    A.registerGame({

        id: "chess",
        number: "06",
        name: "CHESS",
        genre: "STRATEGY / CLASSIC",
        mode: "VS CPU",

        music: "tenso",

        accent: "var(--color-gold)",
        accentRgb: "212 175 55",
        cardRgb: "212 175 55",

        preview: `
            <span class="preview preview--chess">
                <span class="preview__board">
                    ${new Array(64).fill("<i></i>").join("")}
                </span>
                <i class="preview__knight">♞</i>
            </span>
        `,

        readyTitle: "CHECK",
        readyText: "Juegas con blancas. Piezas de neón, sin tablas: si la partida se atasca, la CPU se rinde. Tú también puedes rendirte.",
        readyHint: "ENTER — EMPEZAR    ESC — SALIR",

        hud: `
            ${A.ui.stat("turn", "TURN", "WHITE", { text: true })}
            ${A.ui.stat("status", "CPU", "READY", { text: true })}
            ${A.ui.stat("state", "STATE", "OK", { text: true })}
            ${A.ui.divider()}
            ${A.ui.stat("moves", "MOVES", "0")}
            ${A.ui.stat("material", "MAT", "+0", { text: true })}
        `,

        /* Con pantalla ancha se abre el panel de capturas */
        ratioMin: 1,
        ratioMax: 1.3,

        controls: `
            ${A.ui.switcher("difficulty", [
                { value: "easy", label: "EASY" },
                { value: "normal", label: "NORMAL" },
                { value: "hard", label: "HARD" }
            ])}
            ${A.ui.action("undo", "DESHACER", "↺")}
            ${A.ui.action("resign", "RENDIRSE", "⚑")}
        `,

        hint: "CLIC EN LA PIEZA Y LUEGO EN SU DESTINO    ESC — SALIR",


        create(shell) {
            return new ChessGame(shell);
        }

    });

})(window.Arcade404);
