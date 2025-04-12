/* script.js */

/*
 * Global configuration variables.
 * They will be set dynamically from the user’s selections.
 */
let gridSize = 6;
let mineCount = 6;
let board = [];       // 2D array to hold our cell objects
let gameOver = false;
let cellsRevealed = 0;
let totalSafeCells = gridSize * gridSize - mineCount;  // For win condition

let timer = 0;
let timerInterval;

// Initialize the game board
function initGame() {
  // Read user-selected grid size and difficulty
  const gridSizeSelect = document.getElementById('grid-size-select');
  gridSize = parseInt(gridSizeSelect.value);

  const difficultySelect = document.getElementById('difficulty-select');
  const difficulty = difficultySelect.value;
  let mineDensity = 0.15;  // Default: Medium
  if (difficulty === 'easy') {
    mineDensity = 0.10;
  } else if (difficulty === 'hard') {
    mineDensity = 0.20;
  }
  
  // Calculate mine count based on grid size and mine density
  mineCount = Math.ceil(gridSize * gridSize * mineDensity);
  totalSafeCells = gridSize * gridSize - mineCount;
  
  // Reset game state and UI elements
  board = [];
  gameOver = false;
  cellsRevealed = 0;
  document.getElementById('message').innerText = '';
  document.getElementById('message').classList.remove('lost', 'won');
  
  // Update grid dimensions in case the size changed
  const gridElement = document.getElementById('grid');
  gridElement.innerHTML = '';  // Clear any previous board
  gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  
  // Create a new 2D board filled with cell objects
  for (let row = 0; row < gridSize; row++) {
    let rowArray = [];
    for (let col = 0; col < gridSize; col++) {
      rowArray.push({
        row: row,
        col: col,
        mine: false,       // By default, cells are safe
        revealed: false,
        flagged: false,
        adjacentCount: 0,  // To be calculated next
      });
    }
    board.push(rowArray);
  }
  
  // Randomly place toxic mushrooms (mines) on the board
  let minesPlaced = 0;
  while (minesPlaced < mineCount) {
    const r = Math.floor(Math.random() * gridSize);
    const c = Math.floor(Math.random() * gridSize);
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
  
  // Initialize timer
  timer = 0;
  clearInterval(timerInterval);
  document.getElementById('timer').innerText = '0s';
  timerInterval = setInterval(() => {
    timer++;
    document.getElementById('timer').innerText = timer + 's';
  }, 1000);
  
  // Update flag counter display
  updateFlagCounter();
}

// Count adjacent mines for a given cell
function getAdjacentMineCount(row, col) {
  let count = 0;
  for (let i = row - 1; i <= row + 1; i++) {
    for (let j = col - 1; j <= col + 1; j++) {
      if (i < 0 || i >= gridSize || j < 0 || j >= gridSize) continue;
      if (board[i][j].mine) count++;
    }
  }
  return count;
}

// Render the board: create cell elements and attach event listeners
function renderBoard() {
  const gridElement = document.getElementById('grid');
  board.forEach(row => {
    row.forEach(cell => {
      const cellElement = document.createElement('div');
      cellElement.classList.add('cell');
      cellElement.setAttribute('data-row', cell.row);
      cellElement.setAttribute('data-col', cell.col);
      
      // Attach click and contextmenu (right-click) event listeners
      cellElement.addEventListener('click', handleCellClick);
      cellElement.addEventListener('contextmenu', handleRightClick);
      
      gridElement.appendChild(cellElement);
    });
  });
}

// Handle left-click (cell reveal)
function handleCellClick(e) {
  if (gameOver) return;
  
  const row = parseInt(e.target.getAttribute('data-row'));
  const col = parseInt(e.target.getAttribute('data-col'));
  const cell = board[row][col];
  
  if (cell.revealed || cell.flagged) return;
  
  revealCell(row, col);
  
  // Check win condition: all safe cells have been revealed
  if (cellsRevealed === totalSafeCells) {
    gameOver = true;
    clearInterval(timerInterval);
    document.getElementById('message').innerText = "You foraged safely!";
    document.getElementById('message').classList.add('won');
    revealAllMines();
  }
}

// Handle right-click for flagging cells
function handleRightClick(e) {
  e.preventDefault(); // Prevent the context menu
  if (gameOver) return;
  
  const row = parseInt(e.target.getAttribute('data-row'));
  const col = parseInt(e.target.getAttribute('data-col'));
  const cell = board[row][col];
  
  if (cell.revealed) return;
  
  cell.flagged = !cell.flagged;
  updateCellUI(row, col);
  updateFlagCounter();
}

// Reveal a cell and update the game state
function revealCell(row, col) {
  const cell = board[row][col];
  if (cell.revealed || cell.flagged) return;
  
  cell.revealed = true;
  updateCellUI(row, col);
  
  // If a mine is revealed, game over!
  if (cell.mine) {
    gameOver = true;
    clearInterval(timerInterval);
    document.getElementById('message').innerText = "You stepped on a poison cap! Game Over!";
    document.getElementById('message').classList.add('lost');
    revealAllMines();
    return;
  }
  
  cellsRevealed++;
  
  // If no adjacent mines, recursively reveal neighbors
  if (cell.adjacentCount === 0) {
    revealNeighbors(row, col);
  }
}

// Recursively reveal neighbors when there are no adjacent mines
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

// Update the UI for a specific cell
function updateCellUI(row, col) {
  const gridElement = document.getElementById('grid');
  const cellElements = gridElement.getElementsByClassName('cell');
  for (let cellElement of cellElements) {
    if (parseInt(cellElement.getAttribute('data-row')) === row &&
        parseInt(cellElement.getAttribute('data-col')) === col) {
      const cell = board[row][col];
      if (cell.revealed) {
        cellElement.classList.add('revealed');
        cellElement.classList.remove('flagged');
        if (cell.mine) {
          cellElement.innerText = "🍄☠️";
        } else if (cell.adjacentCount > 0) {
          cellElement.innerText = cell.adjacentCount;
        } else {
          cellElement.innerText = "";
        }
      } else if (cell.flagged) {
        cellElement.classList.add('flagged');
        cellElement.innerText = "🪵";
      } else {
        cellElement.classList.remove('flagged');
        cellElement.innerText = "";
      }
      break;
    }
  }
}

// Update the flag counter display in the scoreboard
function updateFlagCounter() {
  let flagCount = 0;
  board.forEach(row => {
    row.forEach(cell => {
      if (cell.flagged) flagCount++;
    });
  });
  let flagsRemaining = mineCount - flagCount;
  document.getElementById('flag-counter').innerText = flagsRemaining;
}

// Reveal all mines (for game over)
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

// Reset button event listener to restart the game
document.getElementById('reset').addEventListener('click', initGame);

// Initialize the game when the page loads
initGame();
