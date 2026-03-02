import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, setDirection, step, placeFood } from '../src/gameLogic.js';

test('snake moves one cell in current direction', () => {
  const initial = createInitialState({ cols: 10, rows: 10 });
  const moved = step(initial, () => 0);

  assert.deepEqual(moved.snake[0], { x: initial.snake[0].x + 1, y: initial.snake[0].y });
  assert.equal(moved.snake.length, initial.snake.length);
});

test('snake grows and score increments when eating food', () => {
  const initial = {
    ...createInitialState({ cols: 8, rows: 8 }),
    snake: [{ x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 }],
    direction: 'right',
    pendingDirection: 'right',
    food: { x: 5, y: 4 }
  };

  const next = step(initial, () => 0);

  assert.equal(next.score, 1);
  assert.equal(next.snake.length, initial.snake.length + 1);
  assert.deepEqual(next.snake[0], { x: 5, y: 4 });
});

test('wall collisions end the game', () => {
  const initial = {
    ...createInitialState({ cols: 5, rows: 5 }),
    snake: [{ x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }],
    direction: 'right',
    pendingDirection: 'right'
  };

  const next = step(initial);
  assert.equal(next.gameOver, true);
});

test('reverse direction input is ignored', () => {
  const initial = createInitialState();
  const next = setDirection(initial, 'left');

  assert.equal(next.pendingDirection, initial.pendingDirection);
});

test('food placement avoids occupied cells', () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ];

  const food = placeFood(2, 2, snake, () => 0);
  assert.deepEqual(food, { x: 1, y: 1 });
});
