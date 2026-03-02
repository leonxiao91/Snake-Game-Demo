import { createInitialState, setDirection, step } from './gameLogic.js';

const boardEl = document.querySelector('#board');
const scoreEl = document.querySelector('#score');
const statusEl = document.querySelector('#status');
const restartBtn = document.querySelector('#restartBtn');
const controlButtons = document.querySelectorAll('[data-dir]');

const GRID = 16;
const TICK_MS = 140;

let state = createInitialState({ cols: GRID, rows: GRID });
let timerId = null;

function render() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${state.cols}, 1fr)`;

  const snakeSet = new Set(state.snake.map((segment) => `${segment.x},${segment.y}`));

  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const key = `${x},${y}`;

      if (snakeSet.has(key)) {
        cell.classList.add('snake');
      } else if (state.food.x === x && state.food.y === y) {
        cell.classList.add('food');
      }

      boardEl.appendChild(cell);
    }
  }

  scoreEl.textContent = String(state.score);
  statusEl.textContent = state.gameOver
    ? 'Game over. Press Restart to play again.'
    : 'Use arrow keys or WASD to move.';
}

function gameTick() {
  state = step(state);
  render();
  if (state.gameOver) {
    stop();
  }
}

function start() {
  if (timerId) return;
  timerId = window.setInterval(gameTick, TICK_MS);
}

function stop() {
  if (!timerId) return;
  window.clearInterval(timerId);
  timerId = null;
}

function restart() {
  state = createInitialState({ cols: GRID, rows: GRID });
  render();
  start();
}

function mapKeyToDirection(key) {
  const lookup = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right'
  };

  return lookup[key] || lookup[key.toLowerCase()] || null;
}

document.addEventListener('keydown', (event) => {
  const direction = mapKeyToDirection(event.key);
  if (!direction) return;

  event.preventDefault();
  state = setDirection(state, direction);
});

controlButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state = setDirection(state, button.dataset.dir);
  });
});

restartBtn.addEventListener('click', restart);

render();
start();
