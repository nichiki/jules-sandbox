// Global reference to the canvas and its context
let canvas;
let ctx;

// Game board DOM element
const gameBoardElement = document.getElementById('game-board');

function setupCanvas() {
    if (!gameBoardElement) {
        console.error("Error: 'game-board' element not found in the DOM.");
        return;
    }

    canvas = document.createElement('canvas');
    if (!canvas) {
        console.error("Error: Could not create canvas element.");
        return;
    }

    // Set canvas dimensions based on board constants
    // These constants are expected to be globally available from board.js
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    canvas.style.border = '1px solid #333'; // Simple border for visibility

    gameBoardElement.appendChild(canvas);
    ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error("Error: Could not get 2D rendering context.");
    }
}

// Function to draw a single block on the canvas
function drawBlock(x, y, color, context = ctx) {
    if (!context) {
        // console.warn("Canvas context not available for drawBlock.");
        return;
    }
    context.fillStyle = color;
    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // Adding a border to each block for better definition
    context.strokeStyle = 'var(--border-dark)'; // Use CSS variable if possible, or fallback
    try {
        context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-dark').trim() || '#000020';
    } catch (e) {
        context.strokeStyle = '#000020'; // Fallback for environments where CSS vars are not accessible this way
    }
    context.lineWidth = 1; // Thinner border for the main block
    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    // Subtle 3D/glossy effect
    const highlightFactor = 0.3; // 30% lighter
    const shadowFactor = 0.3;   // 30% darker

    // Function to adjust brightness of a hex color
    function adjustColor(col, factor) {
        let r = parseInt(col.slice(1, 3), 16);
        let g = parseInt(col.slice(3, 5), 16);
        let b = parseInt(col.slice(5, 7), 16);

        if (factor > 0) { // Lighter
            r = Math.min(255, Math.floor(r * (1 + factor)));
            g = Math.min(255, Math.floor(g * (1 + factor)));
            b = Math.min(255, Math.floor(b * (1 + factor)));
        } else { // Darker
            r = Math.floor(r * (1 + factor)); // factor is negative
            g = Math.floor(g * (1 + factor));
            b = Math.floor(b * (1 + factor));
        }
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    let lighterColor, darkerColor;
    // Check if color is a CSS variable (starts with 'var(')
    if (color.startsWith('var(')) {
        // Attempt to get the computed style. This is a bit complex for canvas.
        // For simplicity, we might need to pass resolved colors to drawBlock or have a mapping.
        // Fallback: use a generic highlight/shadow if color is a variable we can't resolve here.
        // For now, let's assume 'color' is a resolved hex value from TETROMINOES.
        // This part will need careful handling of CSS variables if they are passed directly.
        // Let's assume 'color' is always a hex string like '#FF00FF'
        try {
            // This path is taken if 'color' is a direct hex string
            lighterColor = adjustColor(color, highlightFactor);
            darkerColor = adjustColor(color, -shadowFactor);
        } catch (e) {
            // Fallback if color parsing fails (e.g. it's 'cyan' not '#00FFFF')
            // console.warn("Color parsing failed for 3D effect, using generic highlight/shadow", e);
            lighterColor = "rgba(255, 255, 255, 0.2)"; // Generic light highlight
            darkerColor = "rgba(0, 0, 0, 0.2)";       // Generic dark shadow
        }

    } else if (typeof color === 'string' && color.includes('#')) { // It's likely a hex color
         try {
            lighterColor = adjustColor(color, highlightFactor);
            darkerColor = adjustColor(color, -shadowFactor);
        } catch (e) {
            // console.warn("Color parsing failed for 3D effect (direct hex), using generic highlight/shadow", e);
            lighterColor = "rgba(255, 255, 255, 0.2)"; 
            darkerColor = "rgba(0, 0, 0, 0.2)";      
        }
    }
     else { // Fallback for named colors or other issues
        // console.warn("Color is not a direct hex value, using generic highlight/shadow for: ", color);
        lighterColor = "rgba(255, 255, 255, 0.2)";
        darkerColor = "rgba(0, 0, 0, 0.2)";
    }


    // Top and Left highlight
    context.fillStyle = lighterColor;
    context.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, 1); // Top bevel
    context.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, 1, BLOCK_SIZE - 2); // Left bevel

    // Bottom and Right shadow
    context.fillStyle = darkerColor;
    context.fillRect(x * BLOCK_SIZE + 1, (y + 1) * BLOCK_SIZE - 2, BLOCK_SIZE - 2, 1); // Bottom shadow
    context.fillRect((x + 1) * BLOCK_SIZE - 2, y * BLOCK_SIZE + 1, 1, BLOCK_SIZE - 2); // Right shadow
}

// Function to update the score display in the UI
function uiUpdateScore(currentScore) {
    const scoreElement = document.getElementById('score'); // Target the span with id 'score'
    if (scoreElement) {
        scoreElement.textContent = currentScore;
    } else {
        console.warn("Score element with id 'score' not found.");
    }
}

// Function to draw the entire game board
function drawBoard(boardGrid, context = ctx) { // Renamed boardArray to boardGrid for clarity
    if (!context) {
        // console.warn("Canvas context not available for drawBoard.");
        return;
    }
    // Clear the canvas first
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background grid lines (optional, but helpful for empty board)
    context.strokeStyle = '#000030'; // Slightly lighter than board background
    context.lineWidth = 0.5;
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
            context.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
    
    // Draw the filled blocks from the boardGrid
    for (let r = 0; r < boardGrid.length; r++) { // Iterate rows (y)
        for (let c = 0; c < boardGrid[r].length; c++) { // Iterate columns (x)
            if (boardGrid[r][c] !== 0) {
                // boardGrid[r][c] now stores the color string directly
                drawBlock(c, r, boardGrid[r][c], context);
            }
            // No need for an else case to draw empty cells if grid lines are already drawn
        }
    }
}

// Function to draw a Tetromino, potentially with lock animation
function drawTetromino(tetromino, drawX, drawY, context = ctx) {
    if (!context || !tetromino) {
        // console.warn("Canvas context or tetromino not available for drawTetromino.");
        return;
    }

    let displayTetromino = tetromino;
    let displayColor = tetromino.color;

    // Check for lock animation state
    if (tetrisLockAnimationCounter > 0 && tetrisPieceToAnimateLock &&
        tetrisPieceToAnimateLock.x === drawX && tetrisPieceToAnimateLock.y === drawY &&
        JSON.stringify(tetrisPieceToAnimateLock.tetromino.shape) === JSON.stringify(tetromino.shape) // More robust check
       ) {
        
        if (tetrisLockAnimationCounter % 2 === 0) { // On even counts (e.g., 2), flash. On odd (e.g., 1), draw original.
            displayColor = tetrisPieceToAnimateLock.color; // Use the flash color (e.g., white)
        }
        // On the next frame (tetrisLockAnimationCounter will be 1), it draws with original color
        // as per normal logic if this block isn't hit, or if tetrisLockAnimationCounter is odd.
        // The counter decrements externally or should be handled carefully.
        // For simplicity, let's assume it's a brief override.
        // The current implementation of uiAnimateLock sets it to 2.
        // So first call after lock: counter = 2 (flash), then it should become 1 (original), then 0 (clear).
        // This logic might need refinement based on when gameLoopDraw is called vs when counter is decremented.
        
        // Let's adjust the counter handling directly within drawTetromino for this effect:
        // The idea is: uiAnimateLock sets counter to 2.
        // 1. gameLoop calls drawTetromino: counter is 2. Draws white. counter becomes 1.
        // 2. gameLoop calls drawTetromino: counter is 1. Draws original. counter becomes 0. Piece locks.
        tetrisLockAnimationCounter--; // Decrement the counter as part of drawing the animation frame
        if (tetrisLockAnimationCounter === 0) {
            tetrisPieceToAnimateLock = null; // Clear animation state when done
        }
    }
    
    context.fillStyle = displayColor;
    displayTetromino.shape.forEach((row, yOffset) => {
        row.forEach((value, xOffset) => {
            if (value === 1) {
                drawBlock(drawX + xOffset, displayY + yOffset, displayColor, context);
            }
        });
    });
}

// Initialize canvas when the script loads
// Ensure this runs after the DOM is ready and board.js has loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof COLS === 'undefined' || typeof ROWS === 'undefined' || typeof BLOCK_SIZE === 'undefined') {
        console.error("Error: Board constants (COLS, ROWS, BLOCK_SIZE) not defined. Make sure board.js is loaded before ui.js.");
        // Fallback values to prevent crashing, but layout will be wrong.
        window.COLS = 10;
        window.ROWS = 20;
        window.BLOCK_SIZE = 30;
    }
    setupCanvas();

    // Example usage: Draw an empty board and a test tetromino
    // This is now handled by tetris.js initial setup or button press.
    // if (ctx) { 
    //     const emptyBoard = getEmptyBoard(); 
    //     drawBoard(emptyBoard, ctx);
    // } else {
    //     console.error("Canvas context not initialized. Cannot draw initial board/tetromino.");
    // }
});

function uiShowGameOver(finalScore) {
    if (!ctx || !canvas) {
        console.error("Canvas context or canvas not available for uiShowGameOver.");
        // Fallback to alert if canvas is not available
        alert(`GAME OVER! Final Score: ${finalScore}`);
        return;
    }

    // Dim the game board
    ctx.fillStyle = 'rgba(0, 0, 32, 0.75)'; // Dark blue, semi-transparent
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // "GAME OVER" text
    ctx.font = "bold 48px 'Roboto', 'Open Sans', system-ui, sans-serif";
    ctx.fillStyle = '#FF0000'; // Bright Red
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 30);

    // Final score text
    ctx.font = "normal 24px 'Roboto', 'Open Sans', system-ui, sans-serif";
    ctx.fillStyle = '#FFFF00'; // Neon Yellow
    ctx.fillText(`Final Score: ${finalScore}`, canvas.width / 2, canvas.height / 2 + 20);
}

function uiHideGameOver() {
    // The game over screen is drawn directly on the main canvas.
    // The next call to gameLoopDraw() in tetris.js (after a reset)
    // will clear the canvas and redraw the board, effectively hiding
    // the game over message. So, this function might not need to do anything
    // if the game over display doesn't involve separate HTML elements.
    // If we were, for example, showing a modal, we'd hide it here.
    // For now, clearing and redrawing is handled by the main game loop upon reset.
    // console.log("uiHideGameOver called - game screen will be redrawn by game loop.");
}

// --- Next Tetromino Display ---
let nextTetrominoCanvas;
let nextTetrominoCtx;
const NEXT_BLOCK_SIZE = 20; // Smaller block size for the preview

function setupNextTetrominoCanvas() {
    const nextArea = document.getElementById('next-tetromino-area');
    if (!nextArea) {
        console.error("Element with ID 'next-tetromino-area' not found.");
        return;
    }
    
    // Check if canvas already exists (e.g., after a game reset)
    let existingCanvas = document.getElementById('next-tetromino-canvas');
    if (existingCanvas) {
        nextTetrominoCanvas = existingCanvas;
    } else {
        nextTetrominoCanvas = document.createElement('canvas');
        nextTetrominoCanvas.id = 'next-tetromino-canvas'; // Use ID from HTML
        // Styles for this canvas are in CSS, but we can set dimensions here if dynamic
        // nextTetrominoCanvas.width = 4 * NEXT_BLOCK_SIZE; // Max width for I-shape
        // nextTetrominoCanvas.height = 4 * NEXT_BLOCK_SIZE; // Max height for I-shape
        // nextArea.appendChild(nextTetrominoCanvas); // Canvas is already in HTML
    }
    
    nextTetrominoCanvas = document.getElementById('next-tetromino-canvas'); // Ensure we have the element from HTML
    if (!nextTetrominoCanvas) {
        console.error("next-tetromino-canvas not found even after trying to get it by ID.");
        return;
    }
    nextTetrominoCtx = nextTetrominoCanvas.getContext('2d');

    if (!nextTetrominoCtx) {
        console.error("Could not get 2D rendering context for next tetromino canvas.");
    }
}

function uiDrawNextTetromino(tetromino) {
    if (!nextTetrominoCtx || !nextTetrominoCanvas) {
        // console.warn("Next tetromino canvas/context not ready.");
        // Attempt to set it up if it's not ready (e.g. on first call)
        setupNextTetrominoCanvas();
        if (!nextTetrominoCtx || !nextTetrominoCanvas) { // If still not ready, abort
            console.error("Failed to initialize next tetromino canvas for drawing.");
            return;
        }
    }

    // Clear the small canvas
    nextTetrominoCtx.clearRect(0, 0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
    
    // Draw the tetromino shape
    if (tetromino && tetromino.shape) {
        const shape = tetromino.shape;
        const color = tetromino.color;
        const shapeWidth = shape[0].length;
        const shapeHeight = shape.length;

        // Calculate offsets to center the tetromino
        const offsetX = (nextTetrominoCanvas.width - (shapeWidth * NEXT_BLOCK_SIZE)) / 2;
        const offsetY = (nextTetrominoCanvas.height - (shapeHeight * NEXT_BLOCK_SIZE)) / 2;

        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value === 1) {
                    nextTetrominoCtx.fillStyle = color;
                    nextTetrominoCtx.fillRect(
                        offsetX + x * NEXT_BLOCK_SIZE,
                        offsetY + y * NEXT_BLOCK_SIZE,
                        NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE
                    );
                    // Optionally, add a smaller border or simplified 3D effect if desired
                    nextTetrominoCtx.strokeStyle = 'var(--border-dark)';
                     try {
                        nextTetrominoCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-dark').trim() || '#000020';
                    } catch (e) {
                        nextTetrominoCtx.strokeStyle = '#000020';
                    }
                    nextTetrominoCtx.lineWidth = 1;
                    nextTetrominoCtx.strokeRect(
                        offsetX + x * NEXT_BLOCK_SIZE,
                        offsetY + y * NEXT_BLOCK_SIZE,
                        NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE
                    );
                }
            });
        });
    } else {
        // console.log("No next tetromino to draw or shape is invalid.");
    }
}

// --- Line Clear Animation ---
// boardGrid is the state of the board *before* the current piece is locked.
function uiAnimateLineClear(rowsClearedIndices, boardGrid, callback) {
    if (!ctx || !canvas) {
        console.error("Main canvas context not available for line clear animation.");
        callback(); // Proceed without animation
        return;
    }

    let flashes = 0;
    const totalFlashes = 4; // e.g., White -> Original -> White -> Original
    const flashDuration = 80; // ms per flash state

    function flashStep() {
        rowsClearedIndices.forEach(rowIndex => {
            for (let c = 0; c < COLS; c++) {
                if (flashes % 2 === 0) { // Flash to white
                    drawBlock(c, rowIndex, 'white', ctx);
                } else { // Revert to original (or draw empty if board already cleared)
                    // This part is tricky: board.grid might be cleared by the time this runs
                    // if the callback is too fast. The animation should ideally "own" these rows.
                    // For simplicity, we'll just draw them as "empty" looking during the "off" flash.
                    // Or, better: draw the original color if we can still access it.
                    // However, tetris.js calls this *before* board.clearLines().
                    // So boardGrid[rowIndex][c] should still have the original color.
                    // This is the grid *before* the current piece has been locked into it.
                    // For the flashing effect, we want to show the colors of the blocks
                    // that are part of the completed lines.
                    if (boardGrid && boardGrid[rowIndex] && boardGrid[rowIndex][c] !== 0) {
                         drawBlock(c, rowIndex, boardGrid[rowIndex][c], ctx);
                    } else {
                        // If the original grid cell was empty, but is part of a line being cleared
                        // (which means the current falling piece fills it), we need its color.
                        // This case is complex as uiAnimateLineClear doesn't know about currentTetromino.
                        // For simplicity, we assume rowsClearedIndices are based on a grid *with* the piece.
                        // The tempGrid in tetris.js handleLockAndSpawn should be what boardGrid is.
                        // So, boardGrid[rowIndex][c] IS the color.
                        drawBlock(c, rowIndex, boardGrid[rowIndex][c] || '#080828', ctx); // Fallback to board background if something is wrong
                    }
                }
            }
        });

        flashes++;
        if (flashes < totalFlashes) {
            setTimeout(flashStep, flashDuration);
        } else {
            // Animation finished, call the callback
            callback();
        }
    }
    flashStep(); // Start the animation
}


// --- Tetromino Lock Animation ---
let tetrisPieceToAnimateLock = null; // Stores { tetromino, x, y }
let tetrisLockAnimationCounter = 0;

function uiAnimateLock(tetromino, x, y) {
    // Store the piece and its position for drawTetromino to pick up
    tetrisPieceToAnimateLock = {
        tetromino: JSON.parse(JSON.stringify(tetromino)), // Deep copy to avoid mutation issues
        x: x,
        y: y,
        color: 'white' // Flash color
    };
    tetrisLockAnimationCounter = 2; // Flash for 2 frames (draw white, then original color by gameLoop)
    
    // The actual drawing change happens in drawTetromino
    // We might need to trigger a redraw immediately if gameLoop is too slow.
    // However, gameLoop usually runs via requestAnimationFrame, so it should be quick.
}

// Modify drawTetromino to check for lock animation
// Original drawTetromino function signature:
// function drawTetromino(tetromino, drawX, drawY, context = ctx) {

// We need to replace the existing drawTetromino function entirely.
// This is a bit risky with replace_with_git_merge_diff if the search block isn't perfect.
// Let's assume the subtask implies I should add this logic to the existing drawTetromino.
// I will attempt this by targeting a line inside drawTetromino and adding the logic there.
// This is not ideal. A full overwrite of drawTetromino would be safer if the tool supported it well
// without needing the exact old content.

// For now, I will create a new drawTetromino and then try to replace the old one.
// This is a placeholder to make the plan clear. The actual replacement will be in a subsequent step.
// The actual implementation will be to modify the existing drawTetromino function.
// The content of the new drawTetromino function will be integrated into the existing one.
// The following is a conceptual new function, which will be merged into the existing one.

/*
function drawTetromino_MODIFIED(tetromino, drawX, drawY, context = ctx) {
    if (!context || !tetromino) {
        return;
    }

    let displayTetromino = tetromino;
    let displayX = drawX;
    let displayY = drawY;
    let displayColor = tetromino.color;

    if (tetrisLockAnimationCounter > 0 && tetrisPieceToAnimateLock && 
        tetrisPieceToAnimateLock.tetromino.shape.toString() === tetromino.shape.toString() && // Basic check
        tetrisPieceToAnimateLock.x === drawX && tetrisPieceToAnimateLock.y === drawY) {
        
        if (tetrisLockAnimationCounter % 2 === 0) { // Flash frame
            displayColor = tetrisPieceToAnimateLock.color;
        }
        // On the next frame (tetrisLockAnimationCounter % 2 !== 0), it draws with original color
        // and then counter becomes 0.
        tetrisLockAnimationCounter--;
        if (tetrisLockAnimationCounter === 0) {
            tetrisPieceToAnimateLock = null; // Clear animation state
        }
    }

    context.fillStyle = displayColor;
    displayTetromino.shape.forEach((row, yOffset) => {
        row.forEach((value, xOffset) => {
            if (value === 1) {
                drawBlock(displayX + xOffset, displayY + yOffset, displayColor, context);
            }
        });
    });
}
*/

// Call setup for next tetromino canvas once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setupNextTetrominoCanvas();
    // Initial draw of an empty next tetromino box or a placeholder
    if (nextTetrominoCtx) {
        nextTetrominoCtx.fillStyle = 'var(--board-bg)';
        try {
            nextTetrominoCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--board-bg').trim() || '#080828';
        } catch(e) { nextTetrominoCtx.fillStyle = '#080828'; }
        nextTetrominoCtx.fillRect(0,0, nextTetrominoCanvas.width, nextTetrominoCanvas.height);
        nextTetrominoCtx.strokeStyle = 'var(--neon-cyan)';
        try {
            nextTetrominoCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan').trim() || '#00FFFF';
        } catch(e) { nextTetrominoCtx.strokeStyle = '#00FFFF'; }
        nextTetrominoCtx.strokeRect(2,2, nextTetrominoCanvas.width-4, nextTetrominoCanvas.height-4);
    }
});
