const boardElement = document.getElementById('board');
const currentPlayerText = document.getElementById('current-player');
const whiteCountEl = document.getElementById('white-count');
const blackCountEl = document.getElementById('black-count');
const movesToDrawEl = document.getElementById('moves-to-draw');
const gameModeSelect = document.getElementById('game-mode');
const difficultySelect = document.getElementById('difficulty');
const difficultyContainer = document.getElementById('difficulty-container');

let selectedPiece = null; 
let turn = 1; 
let mustContinueJump = false; 
let movesWithoutCapture = 0; 
const MAX_MOVES_DRAW = 40;
let isCPUThinking = false;

let boardLayout = [
    [0, 2, 0, 2, 0, 2, 0, 2],
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 0]
];

function init() {
    const savedData = localStorage.getItem('damaSave');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        boardLayout = parsed.layout;
        turn = parsed.turn;
        movesWithoutCapture = parsed.movesWithoutCapture || 0;
        gameModeSelect.value = parsed.gameMode || "1vs1";
        difficultySelect.value = parsed.difficulty || "easy";
    }
    toggleDifficultyUI();
    updateUI();
    createBoard();
    if (turn === 2 && gameModeSelect.value === "1vsCPU") {
        isCPUThinking = true;
        setTimeout(makeCPUMove, 800);
    }
}

function toggleDifficultyUI() {
    difficultyContainer.style.display = (gameModeSelect.value === "1vsCPU") ? "flex" : "none";
}

function saveGame() {
    const data = { 
        layout: boardLayout, 
        turn: turn, 
        movesWithoutCapture: movesWithoutCapture,
        gameMode: gameModeSelect.value,
        difficulty: difficultySelect.value
    };
    localStorage.setItem('damaSave', JSON.stringify(data));
}

function createBoard() {
    boardElement.innerHTML = '';
    const validMoves = getValidMovesForSelected();
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = document.createElement('div');
            cell.className = `cell ${(r + c) % 2 === 0 ? 'white-cell' : 'black-cell'}`;
            cell.onclick = () => handleCellClick(r, c);
            if (validMoves.some(m => m.r === r && m.c === c)) {
                const dot = document.createElement('div');
                dot.className = 'hint-dot';
                cell.appendChild(dot);
            }
            const pType = boardLayout[r][c];
            if (pType !== 0) {
                const piece = document.createElement('div');
                piece.className = `piece ${ (pType === 1 || pType === 3) ? 'white-piece' : 'black-piece' }`;
                piece.id = `piece-${r}-${c}`;
                if (pType === 3 || pType === 4) piece.innerHTML = "👑";
                if (selectedPiece && selectedPiece.r === r && selectedPiece.c === c) piece.classList.add('piece-selected');
                cell.appendChild(piece);
            }
            boardElement.appendChild(cell);
        }
    }
}

function getValidMoves(r, c, customLayout = null) {
    const layout = customLayout || boardLayout;
    const type = layout[r][c];
    if (type === 0) return [];
    const pTurn = (type === 1 || type === 3) ? 1 : 2;
    const isKing = (type === 3 || type === 4);
    const moves = [];
    const eat = canPieceEat(r, c, pTurn, layout);
    if (eat) {
        moves.push({ r: eat.tarR, c: eat.tarC, isEat: true, midR: eat.midR, midC: eat.midC });
    } else if (!anyPieceMustEatByTurn(pTurn, layout)) {
        let directions = isKing ? [[1,1], [1,-1], [-1,1], [-1,-1]] : (pTurn === 1 ? [[-1,1], [-1,-1]] : [[1,1], [1,-1]]);
        directions.forEach(([dr, dc]) => {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && layout[nr][nc] === 0) {
                moves.push({ r: nr, c: nc, isEat: false });
            }
        });
    }
    return moves;
}

function getValidMovesForSelected() {
    if (!selectedPiece) return [];
    return getValidMoves(selectedPiece.r, selectedPiece.c);
}

function handleCellClick(r, c) {
    if (turn === 0 || isCPUThinking) return;
    if (turn === 2 && gameModeSelect.value === "1vsCPU") return;
    const isMyPiece = (turn === 1 && (boardLayout[r][c] === 1 || boardLayout[r][c] === 3)) || 
                      (turn === 2 && (boardLayout[r][c] === 2 || boardLayout[r][c] === 4));
    if (mustContinueJump) { if (boardLayout[r][c] === 0) movePiece(r, c); return; }
    if (isMyPiece) { selectedPiece = { r, c }; createBoard(); }
    else if (selectedPiece && boardLayout[r][c] === 0) movePiece(r, c);
}

function canPieceEat(r, c, pTurn, layout) {
    const isKing = (layout[r][c] === 3 || layout[r][c] === 4);
    const opponent = (pTurn === 1) ? [2, 4] : [1, 3];
    const dirs = [[1,1], [1,-1], [-1,1], [-1,-1]];
    for (let [dr, dc] of dirs) {
        if (!isKing && pTurn === 1 && dr > 0) continue; 
        if (!isKing && pTurn === 2 && dr < 0) continue; 
        const mR = r + dr, mC = c + dc, tR = r + (dr * 2), tC = c + (dc * 2);
        if (tR >= 0 && tR < 8 && tC >= 0 && tC < 8) {
            if (opponent.includes(layout[mR][mC]) && layout[tR][tC] === 0) return { midR: mR, midC: mC, tarR: tR, tarC: tC };
        }
    }
    return null;
}

function anyPieceMustEatByTurn(pTurn, layout) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = layout[r][c];
            if ((pTurn === 1 && (p===1||p===3)) || (pTurn === 2 && (p===2||p===4))) {
                if (canPieceEat(r, c, pTurn, layout)) return true;
            }
        }
    }
    return false;
}

function movePiece(targetR, targetC) {
    const moves = getValidMovesForSelected();
    const move = moves.find(m => m.r === targetR && m.c === targetC);
    if (move) {
        const r = selectedPiece.r, c = selectedPiece.c, type = boardLayout[r][c];
        if (move.isEat) {
            movesWithoutCapture = 0;
            animateAndExecute(r, c, targetR, targetC, type, true, move.midR, move.midC);
        } else {
            movesWithoutCapture++;
            animateAndExecute(r, c, targetR, targetC, type, false);
        }
    } else {
        boardElement.classList.add('shake');
        setTimeout(() => boardElement.classList.remove('shake'), 500);
    }
}

function animateAndExecute(sR, sC, eR, eC, type, didEat, mR, mC) {
    const pEl = document.getElementById(`piece-${sR}-${sC}`);
    if (!pEl) return;
    const size = pEl.parentElement.offsetWidth;
    pEl.style.transform = `translate(${(eC - sC) * size}px, ${(eR - sR) * size}px)`;
    setTimeout(() => {
        if (didEat) boardLayout[mR][mC] = 0;
        boardLayout[eR][eC] = type;
        boardLayout[sR][sC] = 0;
        if (turn === 1 && eR === 0) boardLayout[eR][eC] = 3;
        if (turn === 2 && eR === 7) boardLayout[eR][eC] = 4;
        
        if (didEat && canPieceEat(eR, eC, turn, boardLayout)) {
            mustContinueJump = true; selectedPiece = { r: eR, c: eC };
        } else {
            mustContinueJump = false; selectedPiece = null; turn = (turn === 1) ? 2 : 1;
        }
        
        saveGame(); updateUI(); createBoard(); checkEndGame();
        
        const lastP = document.getElementById(`piece-${eR}-${eC}`);
        if (lastP) lastP.style.animation = "piece-landing 0.3s ease-out";

        if (turn === 2 && gameModeSelect.value === "1vsCPU" && turn !== 0) {
            isCPUThinking = true; setTimeout(makeCPUMove, 800);
        } else isCPUThinking = false;
    }, 400);
}

// LOGICA CPU
function makeCPUMove() {
    let all = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (boardLayout[r][c] === 2 || boardLayout[r][c] === 4) {
                const ms = getValidMoves(r, c);
                ms.forEach(m => all.push({ fR: r, fC: c, tR: m.r, tC: m.c, isE: m.isEat, type: boardLayout[r][c] }));
            }
        }
    }
    if (all.length > 0) {
        const eats = all.filter(m => m.isE);
        let choices = eats.length > 0 ? eats : all;
        let choice;
        if (difficultySelect.value === "hard") {
            choice = choices.reduce((best, curr) => (evaluateMoveExpert(curr) > evaluateMoveExpert(best) ? curr : best));
        } else choice = choices[Math.floor(Math.random() * choices.length)];
        selectedPiece = { r: choice.fR, c: choice.fC };
        movePiece(choice.tR, choice.tC);
    }
}

function evaluateMoveExpert(m) {
    let s = 0;
    if (m.isE) s += 100;
    if (m.type === 2 && m.tR === 7) s += 80;
    let sim = JSON.parse(JSON.stringify(boardLayout));
    sim[m.tR][m.tC] = m.type; sim[m.fR][m.fC] = 0;
    if (m.isE) sim[(m.fR+m.tR)/2][(m.fC+m.tC)/2] = 0;
    if (canOpponentEatInSim(sim, 1)) s -= 150;
    s += m.tR;
    if (m.tC === 0 || m.tC === 7) s += 10;
    return s;
}

function canOpponentEatInSim(sim, oppT) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (sim[r][c] === oppT || sim[r][c] === oppT + 2) {
                if (canPieceEat(r, c, oppT, sim)) return true;
            }
        }
    }
    return false;
}

function updateUI() {
    let w = 0, b = 0;
    boardLayout.forEach(row => row.forEach(p => { if (p===1||p===3) w++; if (p===2||p===4) b++; }));
    whiteCountEl.innerText = w; blackCountEl.innerText = b;
    currentPlayerText.innerText = (turn === 1) ? "BIANCO" : (gameModeSelect.value === "1vsCPU" ? "CPU" : "NERO");
    movesToDrawEl.innerText = MAX_MOVES_DRAW - movesWithoutCapture;
}

function checkEndGame() {
    const w = parseInt(whiteCountEl.innerText), b = parseInt(blackCountEl.innerText);
    if (w === 0) finishGame("IL NERO HA VINTO!");
    else if (b === 0) finishGame("IL BIANCO HA VINTO!");
    else if (movesWithoutCapture >= MAX_MOVES_DRAW) finishGame("PARTITA PATTA!");
}

function finishGame(m) { alert(m); turn = 0; localStorage.removeItem('damaSave'); }

function resetGame() {
    const m = gameModeSelect.value, d = difficultySelect.value;
    localStorage.removeItem('damaSave');
    const data = { 
        layout: [[0,2,0,2,0,2,0,2],[2,0,2,0,2,0,2,0],[0,2,0,2,0,2,0,2],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[1,0,1,0,1,0,1,0],[0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0]],
        turn: 1, movesWithoutCapture: 0, gameMode: m, difficulty: d
    };
    localStorage.setItem('damaSave', JSON.stringify(data));
    location.reload();
}

init();