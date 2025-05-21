// Global game variables
let board;
let currentTetromino;
let nextTetromino; // For the next piece preview
let currentX, currentY;
let gameCtx; // To store the context from ui.js

let score = 0;
let dropCounter = 0;
const dropInterval = 1000; // milliseconds for 1-second drop
let lastTime = 0;
let animationFrameId;
let isGameOver = false;

// Ensure the DOM is fully loaded before starting the game
document.addEventListener('DOMContentLoaded', () => {
    if (typeof ctx === 'undefined') {
        console.error("Canvas context (ctx) is not defined. Make sure ui.js is loaded and initialized correctly.");
        return;
    }
    gameCtx = ctx;

    // Initial setup of score display
    if (typeof uiUpdateScore === 'function') {
        uiUpdateScore(score);
    } else {
        console.error("uiUpdateScore function is not defined. Make sure ui.js is loaded correctly.");
    }
    
    // Event listeners for buttons
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button'); // Placeholder for now
    const resetButton = document.getElementById('reset-button');

    if (startButton) startButton.addEventListener('click', startGame);
    if (resetButton) resetButton.addEventListener('click', startGame); // Reset is essentially a new start

    // Display initial empty board
    board = new Board(); // Create a board to draw initially
    drawBoard(board.grid, gameCtx); // Draw empty board
    
    // Initial UI state for game over (hidden)
    if (typeof uiHideGameOver === 'function') {
        uiHideGameOver();
    }
});

function updateScore(linesCleared) {
    const linePoints = [0, 100, 300, 500, 800]; // 0 lines, 1 line, 2 lines, 3 lines, 4 lines (Tetris)
    score += linePoints[linesCleared] || 0;
    if (typeof uiUpdateScore === 'function') {
        uiUpdateScore(score);
    }
}

function handleLockAndSpawn() {
    // Sound for locking the piece
    if (typeof SoundManager !== 'undefined' && SoundManager.playSound) {
        SoundManager.playSound('lock');
    }

    // Predict lines that will be cleared
    const rowsToClearIndices = [];
    // Create a temporary representation of the board with the current piece locked
    let tempGrid = board.grid.map(row => [...row]);
    currentTetromino.shape.forEach((row, r_offset) => {
        row.forEach((value, c_offset) => {
            if (value === 1) {
                const boardY = currentY + r_offset;
                const boardX = currentX + c_offset;
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    tempGrid[boardY][boardX] = currentTetromino.color; // Temporarily place piece
                }
            }
        });
    });

    for (let r = 0; r < ROWS; r++) {
        if (tempGrid[r].every(cell => cell !== 0)) {
            if (!rowsToClearIndices.includes(r)) {
                rowsToClearIndices.push(r);
            }
        }
    }
    rowsToClearIndices.sort((a, b) => a - b); // Ensure consistent order

    const afterAnimationCallback = () => {
        board.lockTetromino(currentTetromino, currentX, currentY); // Actual lock
        const linesCleared = board.clearLines(); // Actual clear (uses board.grid)
        if (linesCleared > 0) {
            updateScore(linesCleared);
            if (typeof SoundManager !== 'undefined' && SoundManager.playSound) {
                SoundManager.playSound('clear');
            }
        }
        if (!spawnNewTetromino()) {
            // Game over handled in spawnNewTetromino
            // uiShowGameOver is called in spawnNewTetromino
            gameLoopDraw(); // Draw final state
            return;
        }
        dropCounter = 0; // Reset drop counter for new piece
        gameLoopDraw(); // Ensure new piece and board state are drawn immediately
    };

    if (rowsToClearIndices.length > 0 && typeof uiAnimateLineClear === 'function') {
        // Pass the original board.grid to uiAnimateLineClear for it to draw original colors during animation
        // This is because uiAnimateLineClear is called BEFORE board.lockTetromino and board.clearLines
        uiAnimateLineClear(rowsToClearIndices, board.grid, afterAnimationCallback);
    } else {
        afterAnimationCallback(); // No lines to clear or animation function not available
    }
}

function spawnNewTetromino() {
    // currentTetromino takes the value of the previously prepared nextTetromino
    currentTetromino = nextTetromino; 
    // If nextTetromino was null (e.g. very first piece before startGame fully init nextTetromino, or error), fallback
    if (!currentTetromino) {
        console.warn("currentTetromino was null at start of spawnNewTetromino, attempting recovery or initial spawn.");
        currentTetromino = getRandomTetromino(); // Fallback for safety or initial piece
    }

    // Generate the new nextTetromino for the upcoming piece
    nextTetromino = getRandomTetromino();
    if (!nextTetromino) {
        // This is less critical for the current piece, but indicates issues for the next one.
        console.warn("Could not generate a new nextTetromino. Game might end soon if this persists.");
        // Potentially, set a flag or use a placeholder if this becomes a problem.
        // For now, uiDrawNextTetromino will likely just clear the display or show nothing.
    }
    // Update the UI for the next piece
    if (typeof uiDrawNextTetromino === 'function') {
        uiDrawNextTetromino(nextTetromino); // Draw the *new* next piece
    }

    // This check is now for the piece that *was* next, and is now current.
    // This check is now for the piece that *was* next, and is now current.
    if (!currentTetromino) { 
        console.error("Failed to set currentTetromino in spawnNewTetromino (it was null after assignment from nextTetromino and fallback).");
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        if (typeof SoundManager !== 'undefined' && SoundManager.playSound) SoundManager.playSound('gameOver');
        if (typeof uiShowGameOver === 'function') uiShowGameOver(score);
        else alert("Game Over! Critical error: No Tetromino. Final Score: " + score);
        return false;
    }
    currentX = Math.floor(COLS / 2) - Math.floor(currentTetromino.shape[0].length / 2);
    currentY = 0;

    if (!isValidMove(currentTetromino.shape, currentX, currentY, board.grid)) {
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        if (typeof SoundManager !== 'undefined' && SoundManager.playSound) SoundManager.playSound('gameOver');
        if (typeof uiShowGameOver === 'function') uiShowGameOver(score);
        else alert("Game Over! Final Score: " + score);
        return false; // Indicate game over
    }
    return true; // Indicate success
}

function gameLoopDraw() {
    if (!gameCtx) {
        console.error("gameCtx not initialized in gameLoopDraw");
        return;
    }
    gameCtx.clearRect(0, 0, gameCtx.canvas.width, gameCtx.canvas.height);
    drawBoard(board.grid, gameCtx); // board.grid contains color strings or 0
    if (currentTetromino) {
        drawTetromino(currentTetromino, currentX, currentY, gameCtx);
    }
    
    // Decrement lock animation counter if it's active (managed in ui.js)
    // This assumes tetrisLockAnimationCounter is globally accessible or managed via ui.js functions
    if (typeof tetrisLockAnimationCounter !== 'undefined' && tetrisLockAnimationCounter > 0) {
        // This direct manipulation is not ideal if tetrisLockAnimationCounter is scoped to ui.js
        // For now, let's assume it's global for simplicity, or that drawTetromino handles its own decrement.
        // Based on current ui.js, drawTetromino only *reads* it. uiAnimateLock *sets* it.
        // So, tetris.js should manage its countdown.
        // However, the variable tetrisLockAnimationCounter is defined in ui.js.
        // To make this work as intended without making it global, drawTetromino itself should handle the decrement.
        // Let's modify drawTetromino in ui.js to handle this.
        // For now, I'll proceed with the tetris.js changes assuming drawTetromino will be updated.
    }
}

function gameLoop(timestamp) {
    if (isGameOver) return; // Stop game logic if game is over

    // If timestamp is undefined (e.g. first call from a source not providing it, like a button)
    // or if lastTime was reset, initialize it.
    if (!timestamp || lastTime === 0) { // lastTime can be 0 if gameLoop is called directly after reset
        lastTime = performance.now();
    }

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        currentY++;
        if (!isValidMove(currentTetromino.shape, currentX, currentY, board.grid)) {
            currentY--; // Revert move
            
            if (typeof uiAnimateLock === 'function') {
                uiAnimateLock(currentTetromino, currentX, currentY);
                // gameLoopDraw(); // Draw once to show the start of the lock animation (white flash)
                                // This might make the drop feel laggy if not handled well with timeouts.
            }
            // The actual locking and spawning will occur after a brief moment for animation,
            // or uiAnimateLock will set a state that gameLoopDraw uses for a couple of frames.
            // The current uiAnimateLock sets tetrisLockAnimationCounter = 2;
            // The idea is:
            // 1. This move is invalid. Call uiAnimateLock(). tetrisLockAnimationCounter = 2.
            // 2. gameLoopDraw() runs: drawTetromino sees counter=2, draws white. (counter should become 1 in drawTetromino)
            // 3. Next frame gameLoopDraw() runs: drawTetromino sees counter=1, draws original. (counter should become 0 in drawTetromino)
            // 4. Then handleLockAndSpawn() proceeds.
            // This requires drawTetromino to manage the counter.
            // For now, let's assume uiAnimateLock starts an animation that gameLoopDraw respects.
            // We will call handleLockAndSpawn directly. The animation is visual within drawTetromino.
            handleLockAndSpawn(); 
            if (isGameOver) { 
                gameLoopDraw(); 
                return; 
            }
        }
        dropCounter = 0;
    }

    gameLoopDraw();
    if (!isGameOver) { 
       animationFrameId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    isGameOver = false; // Reset game over state
    if (typeof uiHideGameOver === 'function') { // Hide game over message if visible
        uiHideGameOver();
    }

    score = 0;
    if (typeof uiUpdateScore === 'function') {
        uiUpdateScore(score);
    }

    board = new Board(); // Creates a new board instance with an empty grid

    // Initialize nextTetromino first
    nextTetromino = getRandomTetromino();
    if (typeof uiDrawNextTetromino === 'function') {
        uiDrawNextTetromino(nextTetromino);
    } else {
        console.error("uiDrawNextTetromino is not defined. Make sure ui.js is loaded.");
    }

    // Start background music
    if (typeof SoundManager !== 'undefined' && SoundManager.playSound) {
        // Ensure music is set to loop, might have been done in sound.js already
        if (SoundManager.sounds['music']) SoundManager.sounds['music'].loop = true;
        SoundManager.playSound('music');
    }

    if (!spawnNewTetromino()) { // Handles initial spawn and game over check
        // spawnNewTetromino will set isGameOver and call uiShowGameOver if needed
        gameLoopDraw(); // Draw the board in its final (game over) state
        return; // Stop if game over on start
    }

    lastTime = performance.now(); // Initialize lastTime
    dropCounter = 0;
    
    animationFrameId = requestAnimationFrame(gameLoop);
    // gameLoopDraw(); // Initial draw is handled by the first call to gameLoop
}


// Keyboard event listeners
document.addEventListener('keydown', (event) => {
    if (isGameOver || !currentTetromino) return; // Stop input if game over or no piece

    let moved = false;
    switch (event.key) {
        case 'ArrowLeft':
            currentX--;
            if (!isValidMove(currentTetromino.shape, currentX, currentY, board.grid)) {
                currentX++; // Revert move
            } else {
                if (typeof SoundManager !== 'undefined' && SoundManager.playSound) SoundManager.playSound('move');
                moved = true;
            }
            break;
        case 'ArrowRight':
            currentX++;
            if (!isValidMove(currentTetromino.shape, currentX, currentY, board.grid)) {
                currentX--; // Revert move
            } else {
                if (typeof SoundManager !== 'undefined' && SoundManager.playSound) SoundManager.playSound('move');
                moved = true;
            }
            break;
        case 'ArrowUp': // Rotate
            const originalShape = JSON.parse(JSON.stringify(currentTetromino.shape)); // Deep copy
            currentTetromino.rotate();
            if (!isValidMove(currentTetromino.shape, currentX, currentY, board.grid)) {
                currentTetromino.shape = originalShape; // Revert rotation
            } else {
                if (typeof SoundManager !== 'undefined' && SoundManager.playSound) SoundManager.playSound('rotate');
                moved = true;
            }
            break;
        case 'ArrowDown': // Soft drop
            currentY++;
            if (!isValidMove(currentTetromino.shape, currentX, currentY, board.grid)) {
                currentY--; // Move back
                if (typeof uiAnimateLock === 'function') {
                    uiAnimateLock(currentTetromino, currentX, currentY);
                    // gameLoopDraw(); // Optionally trigger immediate redraw for flash
                }
                handleLockAndSpawn(); 
            } else {
                dropCounter = 0; // Reset counter on manual drop
                moved = true;
            }
            break;
    }
    if (moved && !isGameOver && currentTetromino) { 
        gameLoopDraw(); 
    }
});
