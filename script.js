/* script.js */

/*
 * Configuration variables:
 * gridSize: The board will be gridSize x gridSize (6x6)
 * mineCount: Number of toxic mushrooms (mines) placed randomly.
 */
const gridSize = 6;
const mineCount = 6;

let board = [];      // 2D array to hold our cell objects
let gameOver = false;
let cellsRevealed = 0;
let totalSafeCells = gridSize * gridSize - mineCount;  // For win condition

// Initialize the game board
function initGame() {
  board = [];
  gameOver = false;
  cellsRevealed = 0;
  document.getElementById('message').innerText = '';
  const gridElement = document.getElementById('grid');
  gridElement.innerHTML = '';  // Clear any previous board

  // Create a 2D board filled with cell objects
  for (let row = 0; row < gridSize; row++) {
    let rowArray = [];
    for (let col = 0; col < gridSize; col++) {
      rowArray.push({
        row: row,
        col: col,
        mine: false,       // By default, cells are not toxic
        revealed: false,
        flagged: false,
        adjacentCount: 0,  // Will be calculated next
      });
    }
    board.push(rowArray);
  }

  // Randomly place toxic mushrooms (mines) in the board
  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    let r = Math.floor(Math.random() * gridSize);
    let c = Math.floor(Math.random() * gridSize);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      minesPlaced++;
    }
  }

  // Calculate the number of toxic neighbors for each cell
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      board[row][col].adjacentCount = getAdjacentMineCount(row, col);
    }
  }

  // Render the board in the HTML grid element
  renderBoard();
}

// Count adjacent mines (toxic mushrooms) for a given cell
function getAdjacentMineCount(row, col) {
  let count = 0;
  for (let i = row - 1; i <= row + 1; i++) {
    for (let j = col - 1; j <= col + 1; j++) {
      // Skip out-of-bound indices
      if (i < 0 || i >= gridSize || j < 0 || j >= gridSize) continue;
      if (board[i][j].mine) count++;
    }
  }
  return count;
}

// Render the board: create cell elements and attach event listeners
function renderBoard() {
  const gridElement = document.getElementById('grid');
  gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

  // Loop over board cells and create a div for each cell
  board.forEach(row => {
    row.forEach(cell => {
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');
      cellElement.setAttribute('data-row', cell.row);
      cellElement.setAttribute('data-col', cell.col);

      // Event listeners:
      // Left-click to reveal cell
      cellElement.addEventListener('click', handleCellClick);
      // Right-click to toggle flag; prevent default context menu
      cellElement.addEventListener('contextmenu', handleRightClick);

      gridElement.appendChild(cellElement);
    });
  });
}

// Handle left-click events to reveal a cell
function handleCellClick(e) {
  if (gameOver) return;

  const row = parseInt(e.target.getAttribute('data-row'));
  const col = parseInt(e.target.getAttribute('data-col'));
  const cell = board[row][col];

  // Do nothing if the cell is already revealed or flagged
  if (cell.revealed || cell.flagged) return;

  revealCell(row, col);

  // Check for win condition: all safe cells revealed
  if (cellsRevealed === totalSafeCells) {
    gameOver = true;
    document.getElementById('message').innerText = "You foraged safely!";
    revealAllMines();
  }
}

// Handle right-click events to toggle flag on a cell
function handleRightClick(e) {
  e.preventDefault(); // Prevent context menu from appearing
  if (gameOver) return;

  const row = parseInt(e.target.getAttribute('data-row'));
  const col = parseInt(e.target.getAttribute('data-col'));
  const cell = board[row][col];

  if (cell.revealed) return;

  // Toggle flagged state
  cell.flagged = !cell.flagged;
  updateCellUI(row, col);
}

// Reveal a cell and update game state
function revealCell(row, col) {
  const cell = board[row][col];
  if (cell.revealed || cell.flagged) return;

  cell.revealed = true;
  updateCellUI(row, col);

  // If the player clicked a toxic mushroom, the game is over!
  if (cell.mine) {
    gameOver = true;
    document.getElementById('message').innerText = "You stepped on a poison cap! Game Over!";
    revealAllMines();
    return;
  }

  cellsRevealed++;

  // If no toxic neighbors, recursively reveal adjacent cells
  if (cell.adjacentCount === 0) {
    revealNeighbors(row, col);
  }
}

// Recursively reveal neighboring cells if they have no adjacent toxic mushrooms
function revealNeighbors(row, col) {
  for (let i = row - 1; i <= row + 1; i++) {
    for (let j = col - 1; j <= col + 1; j++) {
      if (i < 0 || i >= gridSize || j < 0 || j >= gridSize) continue;
      if (!board[i][j].revealed) {
        revealCell(i, j);
      }
    }
  }
}

// Update the UI for a specific cell based on its state
function updateCellUI(row, col) {
  const gridElement = document.getElementById('grid');
  // Find the cell element by matching the data attributes
  const cellElements = gridElement.getElementsByClassName('cell');
  for (let cellElement of cellElements) {
    if (
      parseInt(cellElement.getAttribute('data-row')) === row &&
      parseInt(cellElement.getAttribute('data-col')) === col
    ) {
      const cell = board[row][col];
      if (cell.revealed) {
        cellElement.classList.add('revealed');
        cellElement.classList.remove('flagged');
        // Display a toxic mushroom if it is a mine or the number if safe
        if (cell.mine) {
          cellElement.innerText = "🍄☠️";
        } else if (cell.adjacentCount > 0) {
          cellElement.innerText = cell.adjacentCount;
        } else {
          cellElement.innerText = "";
        }
      } else if (cell.flagged) {
        cellElement.classList.add('flagged');
        cellElement.innerText = "🪵"; // Display twig flag emoji
      } else {
        cellElement.classList.remove('flagged');
        cellElement.innerText = "";
      }
      break;
    }
  }
}

// Reveal all toxic mushrooms when game ends (win or lose)
function revealAllMines() {
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col].mine) {
        board[row][col].revealed = true;
        updateCellUI(row, col);
      }
    }
  }
}

// Set up the reset button to restart the game
document.getElementById('reset').addEventListener('click', initGame);

// Initialize the game when the page loads
initGame();
