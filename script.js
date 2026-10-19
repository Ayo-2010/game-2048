const SIZE = 4;
const BEST_KEY = 'best2048';

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const statusEl = document.getElementById('status');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const newBtn = document.getElementById('newBtn');
const againBtn = document.getElementById('againBtn');

let grid = [];
let score = 0;
let best = Number(localStorage.getItem(BEST_KEY) || 0);
let won = false;
let over = false;
let started = false;

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function spawn() {
  const open = [];

  grid.forEach((row, r) => {
    row.forEach((value, c) => {
      if (value === 0) open.push([r, c]);
    });
  });

  if (!open.length) return;

  const [r, c] = open[Math.floor(Math.random() * open.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function render() {
  scoreEl.textContent = score;
  bestEl.textContent = best;

  boardEl.innerHTML = '';

  grid.forEach((row) => {
    row.forEach((value) => {
      const cell = document.createElement('div');
      cell.className = 'cell';

      if (value > 0) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.v = String(value);
        tile.textContent = value;
        cell.appendChild(tile);
      }

      boardEl.appendChild(cell);
    });
  });
}

function slide(line) {
  const numbers = line.filter((value) => value !== 0);
  const result = [];
  let gained = 0;

  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] === numbers[i + 1]) {
      const merged = numbers[i] * 2;
      result.push(merged);
      gained += merged;
      i++;
    } else {
      result.push(numbers[i]);
    }
  }

  while (result.length < SIZE) result.push(0);

  return { result, gained };
}

function canMove() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function showOverlay(message, action) {
  overlayText.textContent = message;
  againBtn.textContent = action;
  overlay.hidden = false;
}

function move(direction) {
  if (over) return;
  if (!started) started = true;

  const before = JSON.stringify(grid);
  let gained = 0;

  if (direction === 'left' || direction === 'right') {
    for (let r = 0; r < SIZE; r++) {
      let line = grid[r].slice();
      if (direction === 'right') line.reverse();

      const moved = slide(line);
      gained += moved.gained;

      if (direction === 'right') moved.result.reverse();
      grid[r] = moved.result;
    }
  } else {
    for (let c = 0; c < SIZE; c++) {
      let line = grid.map((row) => row[c]);
      if (direction === 'down') line.reverse();

      const moved = slide(line);
      gained += moved.gained;

      if (direction === 'down') moved.result.reverse();
      for (let r = 0; r < SIZE; r++) grid[r][c] = moved.result[r];
    }
  }

  if (JSON.stringify(grid) === before) {
    statusEl.textContent = 'That move changes nothing.';
    return;
  }

  score += gained;

  if (score > best) {
    best = score;
    localStorage.setItem(BEST_KEY, String(best));
  }

  spawn();
  render();

  statusEl.textContent = 'Use the arrow keys or swipe.';

  if (!won && grid.flat().includes(2048)) {
    won = true;
    showOverlay('You reached 2048!', 'Keep going');
    return;
  }

  if (!canMove()) {
    over = true;
    showOverlay('No moves left', 'Try again');
  }
}

function newGame() {
  grid = emptyGrid();
  score = 0;
  won = false;
  over = false;
  started = false;
  overlay.hidden = true;
  statusEl.textContent = 'Use the arrow keys or swipe.';

  spawn();
  spawn();
  render();
}

const KEYS = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  d: 'right',
  w: 'up',
  s: 'down',
};

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const direction = KEYS[event.key] || KEYS[event.key.toLowerCase()];
  if (!direction) return;
  event.preventDefault();
  move(direction);
});

let touchStart = null;

boardEl.addEventListener('pointerdown', (event) => {
  touchStart = { x: event.clientX, y: event.clientY };
});

boardEl.addEventListener('pointerup', (event) => {
  if (!touchStart) return;

  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? 'right' : 'left');
  } else {
    move(dy > 0 ? 'down' : 'up');
  }
});

newBtn.addEventListener('click', newGame);

againBtn.addEventListener('click', () => {
  if (over) newGame();
  else overlay.hidden = true;
});

bestEl.textContent = best;
newGame();
