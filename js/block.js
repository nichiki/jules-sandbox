// Tetromino shapes
const I_SHAPE = [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
];

const O_SHAPE = [
    [1, 1],
    [1, 1]
];

const T_SHAPE = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
];

const L_SHAPE = [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
];

// Tetromino colors
const COLORS = {
    'I': 'cyan',
    'O': 'yellow',
    'T': 'magenta',
    'L': 'orange',
    'J': 'blue', // Adding J for future use
    'S': 'lime', // Adding S for future use
    'Z': 'red'   // Adding Z for future use
};

// Tetromino class
function Tetromino(shape, color) {
    this.shape = shape;
    this.color = color;
    // Additional properties like x, y position on the board can be added later
    this.x = 0;
    this.y = 0;
}

Tetromino.prototype.rotate = function() {
    // Transpose the matrix
    const newShape = this.shape[0].map((_, colIndex) => this.shape.map(row => row[colIndex]));

    // Reverse each row to complete the clockwise rotation
    newShape.forEach(row => row.reverse());

    this.shape = newShape;
};

// Predefined Tetromino types
const TETROMINOES = {
    'I': new Tetromino(I_SHAPE, COLORS.I),
    'O': new Tetromino(O_SHAPE, COLORS.O),
    'T': new Tetromino(T_SHAPE, COLORS.T),
    'L': new Tetromino(L_SHAPE, COLORS.L)
};

// Function to get a random Tetromino
function getRandomTetromino() {
    const keys = Object.keys(TETROMINOES);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const selectedShape = TETROMINOES[randomKey].shape;
    const selectedColor = TETROMINOES[randomKey].color;
    
    // Create a new Tetromino object to avoid modifying the original
    return new Tetromino(selectedShape, selectedColor);
}
