export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITES = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left'
};

export function createInitialState({ cols = 16, rows = 16 } = {}) {
  const head = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
  const snake = [
    head,
    { x: head.x - 1, y: head.y },
    { x: head.x - 2, y: head.y }
  ];

  return {
    cols,
    rows,
    snake,
    direction: 'right',
    pendingDirection: 'right',
    food: placeFood(cols, rows, snake),
    score: 0,
    gameOver: false
  };
}

export function setDirection(state, nextDirection) {
  if (!DIRECTIONS[nextDirection] || state.gameOver) {
    return state;
  }

  if (OPPOSITES[state.direction] === nextDirection) {
    return state;
  }

  return {
    ...state,
    pendingDirection: nextDirection
  };
}

export function step(state, randomFn = Math.random) {
  if (state.gameOver) {
    return state;
  }

  const direction = state.pendingDirection;
  const movement = DIRECTIONS[direction];
  const head = state.snake[0];
  const newHead = { x: head.x + movement.x, y: head.y + movement.y };

  const hitWall =
    newHead.x < 0 ||
    newHead.y < 0 ||
    newHead.x >= state.cols ||
    newHead.y >= state.rows;

  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y;
  const collisionBody = ateFood ? state.snake : state.snake.slice(0, -1);

  if (hitWall || intersects(newHead, collisionBody)) {
    return {
      ...state,
      direction,
      gameOver: true
    };
  }

  const body = ateFood ? state.snake : state.snake.slice(0, -1);
  const snake = [newHead, ...body];

  return {
    ...state,
    direction,
    snake,
    food: ateFood ? placeFood(state.cols, state.rows, snake, randomFn) : state.food,
    score: ateFood ? state.score + 1 : state.score,
    gameOver: false
  };
}

export function placeFood(cols, rows, snake, randomFn = Math.random) {
  const occupied = new Set(snake.map((point) => `${point.x},${point.y}`));
  const openCells = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return snake[0];
  }

  const index = Math.floor(randomFn() * openCells.length);
  return openCells[Math.min(index, openCells.length - 1)];
}

function intersects(point, snake) {
  return snake.some((segment) => segment.x === point.x && segment.y === point.y);
}
