// Game board constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // pixels

// Function to get an empty game board
function getEmptyBoard() {
    const board = [];
    for (let row = 0; row < ROWS; row++) {
        board.push(Array(COLS).fill(0));
    }
    return board;
}

// Board class
function Board() {
    this.grid = getEmptyBoard(); // this.grid is part of the instance
    // Additional properties like current tetromino, score etc. can be added later
}

Board.prototype.lockTetromino = function(tetromino, x, y) {
    tetromino.shape.forEach((row, r_offset) => {
        row.forEach((value, c_offset) => {
            if (value === 1) {
                const boardY = y + r_offset;
                const boardX = x + c_offset;
                // Ensure the piece is within the board boundaries before locking
                if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                    this.grid[boardY][boardX] = tetromino.color;
                }
            }
        });
    });
};

Board.prototype.clearLines = function() {
    let linesCleared = 0;
    for (let r = this.grid.length - 1; r >= 0; r--) {
        if (this.grid[r].every(cell => cell !== 0)) {
            this.grid.splice(r, 1); // Remove the full row
            this.grid.unshift(Array(COLS).fill(0)); // Add a new empty row at the top
            linesCleared++;
            r++; // Re-check the current row index as rows have shifted down
        }
    }
    return linesCleared;
};

// Function to check if a move is valid
function isValidMove(pieceGrid, x, y, boardGrid) {
    for (let row = 0; row < pieceGrid.length; row++) {
        for (let col = 0; col < pieceGrid[row].length; col++) {
            if (pieceGrid[row][col] === 1) { // Check only filled cells of the tetromino
                const boardX = x + col;
                const boardY = y + row;

                // Check bounds
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return false; // Out of bounds (left, right, bottom)
                }

                // Check collision with existing blocks on the board
                // Ensure boardY is not negative before checking boardGrid[boardY]
                if (boardY >= 0 && boardGrid[boardY] && boardGrid[boardY][boardX] !== 0) {
                    return false; // Collision with another piece
                }
            }
        }
    }
    return true;
}


// Example usage (can be removed later)
// const gameBoard = new Board();
// console.log(gameBoard.grid);
