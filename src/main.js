const imageInput = document.querySelector('#imageInput');
const cartoonBtn = document.querySelector('#cartoonBtn');
const downloadBtn = document.querySelector('#downloadBtn');
const statusEl = document.querySelector('#status');

const smoothnessRange = document.querySelector('#smoothnessRange');
const colorLevelsRange = document.querySelector('#colorLevelsRange');
const edgeStrengthRange = document.querySelector('#edgeStrengthRange');

const smoothnessValue = document.querySelector('#smoothnessValue');
const colorLevelsValue = document.querySelector('#colorLevelsValue');
const edgeStrengthValue = document.querySelector('#edgeStrengthValue');

const canvas = document.querySelector('#previewCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const sourceImage = new Image();
let hasImage = false;

function updateSliderLabel(slider, label) {
  label.textContent = slider.value;
}

function drawPlaceholder(text = '等待上传照片') {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

function fitImageToCanvas(img) {
  const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
  const drawWidth = Math.round(img.width * ratio);
  const drawHeight = Math.round(img.height * ratio);
  const x = Math.round((canvas.width - drawWidth) / 2);
  const y = Math.round((canvas.height - drawHeight) / 2);
  return { x, y, drawWidth, drawHeight };
}

function blurPixelChannel(data, width, height, radius) {
  if (radius <= 0) return;

  const source = new Uint8ClampedArray(data);
  const size = radius * 2 + 1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let dy = -radius; dy <= radius; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -radius; dx <= radius; dx += 1) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          const idx = (ny * width + nx) * 4;
          r += source[idx];
          g += source[idx + 1];
          b += source[idx + 2];
          count += 1;
        }
      }

      const write = (y * width + x) * 4;
      data[write] = r / count;
      data[write + 1] = g / count;
      data[write + 2] = b / count;
      data[write + 3] = source[write + 3];
    }
  }

  if (size > 9) {
    statusEl.textContent = '图片较大，处理中，请稍候...';
  }
}

function quantize(value, levels) {
  const bucket = 255 / (levels - 1);
  return Math.round(value / bucket) * bucket;
}

function cartoonize() {
  if (!hasImage) {
    statusEl.textContent = '请先上传照片再生成。';
    return;
  }

  drawPlaceholder('处理中...');

  requestAnimationFrame(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const { x, y, drawWidth, drawHeight } = fitImageToCanvas(sourceImage);
    ctx.drawImage(sourceImage, x, y, drawWidth, drawHeight);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    const smoothness = Number(smoothnessRange.value);
    const levels = Number(colorLevelsRange.value);
    const edgeThreshold = Number(edgeStrengthRange.value);

    blurPixelChannel(data, width, height, smoothness);

    for (let yPos = 1; yPos < height - 1; yPos += 1) {
      for (let xPos = 1; xPos < width - 1; xPos += 1) {
        const idx = (yPos * width + xPos) * 4;

        const r = quantize(data[idx], levels);
        const g = quantize(data[idx + 1], levels);
        const b = quantize(data[idx + 2], levels);

        const left = ((yPos * width + (xPos - 1)) * 4);
        const right = ((yPos * width + (xPos + 1)) * 4);
        const top = (((yPos - 1) * width + xPos) * 4);
        const bottom = (((yPos + 1) * width + xPos) * 4);

        const gx = Math.abs(data[left] - data[right])
          + Math.abs(data[left + 1] - data[right + 1])
          + Math.abs(data[left + 2] - data[right + 2]);
        const gy = Math.abs(data[top] - data[bottom])
          + Math.abs(data[top + 1] - data[bottom + 1])
          + Math.abs(data[top + 2] - data[bottom + 2]);

        const edgeStrength = (gx + gy) / 3;

        if (edgeStrength > edgeThreshold) {
          data[idx] = 35;
          data[idx + 1] = 35;
          data[idx + 2] = 35;
        } else {
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    downloadBtn.disabled = false;
    statusEl.textContent = '已生成卡通形象，可继续调参数后再次生成。';
  });
}

function drawImagePreview() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { x, y, drawWidth, drawHeight } = fitImageToCanvas(sourceImage);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sourceImage, x, y, drawWidth, drawHeight);
  statusEl.textContent = '图片已加载，点击“生成卡通”。';
}

imageInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const fileUrl = URL.createObjectURL(file);
  sourceImage.onload = () => {
    hasImage = true;
    drawImagePreview();
    URL.revokeObjectURL(fileUrl);
  };
  sourceImage.src = fileUrl;
});

cartoonBtn.addEventListener('click', cartoonize);

downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'cartoon-avatar.png';
  link.click();
});

[smoothnessRange, colorLevelsRange, edgeStrengthRange].forEach((slider) => {
  slider.addEventListener('input', () => {
    updateSliderLabel(smoothnessRange, smoothnessValue);
    updateSliderLabel(colorLevelsRange, colorLevelsValue);
    updateSliderLabel(edgeStrengthRange, edgeStrengthValue);
  });
});

drawPlaceholder();
updateSliderLabel(smoothnessRange, smoothnessValue);
updateSliderLabel(colorLevelsRange, colorLevelsValue);
updateSliderLabel(edgeStrengthRange, edgeStrengthValue);
