// O vídeo fornece o relógio; o CSV contém as posições medidas pelo script 06.
export function sampleIndexAtTime(samples, time) {
  let first = 0;
  let last = samples.length - 1;
  while (first <= last) {
    const middle = Math.floor((first + last) / 2);
    if (samples[middle][0] <= time + 1e-7) first = middle + 1;
    else last = middle - 1;
  }
  return last;
}

async function mountVideoMeasurement(root) {
  const video = root.querySelector("video");
  const recognized = root.querySelector("[data-recognized]");
  const plot = root.querySelector("[data-position-plot]");
  const status = root.querySelector("[data-measurement-status]");
  const overlay = recognized.getContext("2d");
  const chart = plot.getContext("2d");
  let samples;
  try {
    const response = await fetch(new URL("./dados/pendulo_trena.csv", import.meta.url));
    if (!response.ok) throw new Error("CSV indisponível");
    const csv = await response.text();
    samples = csv.trim().split("\n").slice(1).map((line) => line.split(",").map(Number));
    if (!samples.length || samples.some((row) => row.length !== 3 || !row.every(Number.isFinite))) {
      throw new Error("CSV inválido");
    }
  } catch {
    status.textContent = "Não foi possível carregar as posições. O vídeo original continua disponível; recarregue a página para tentar novamente.";
    return;
  }

  const xValues = samples.map((sample) => sample[1]);
  const minimum = Math.floor(Math.min(...xValues) / 50) * 50;
  const maximum = Math.ceil(Math.max(...xValues) / 50) * 50;
  let displayedTime = 0;
  let colors;

  function updateColors() {
    const style = getComputedStyle(root);
    colors = {
      background: style.getPropertyValue("--surface").trim(),
      ink: style.getPropertyValue("--ink").trim(),
      grid: style.getPropertyValue("--line-strong").trim(),
      curve: style.getPropertyValue("--negative").trim(),
    };
  }

  function drawPlot(index, time) {
    const start = Math.max(0, time - 10);
    const left = 82, right = 610, top = 50, bottom = 350;
    const px = (t) => left + (t - start) / 10 * (right - left);
    const py = (x) => bottom - (x - minimum) / (maximum - minimum) * (bottom - top);
    chart.fillStyle = colors.background;
    chart.fillRect(0, 0, plot.width, plot.height);
    chart.font = "22px sans-serif";
    chart.fillStyle = colors.ink;
    chart.textAlign = "left";
    chart.fillText("x (pixels) · últimos 10 s", left, 28);
    for (let tick = 0; tick <= 4; tick++) {
      const x = minimum + tick * (maximum - minimum) / 4;
      chart.strokeStyle = colors.grid;
      chart.lineWidth = 1;
      chart.beginPath();
      chart.moveTo(left, py(x));
      chart.lineTo(right, py(x));
      chart.stroke();
      chart.textAlign = "right";
      chart.fillText(x.toFixed(0), left - 12, py(x) + 7);
      chart.textAlign = "center";
      const t = start + tick * 2.5;
      chart.fillText(t.toFixed(1), px(t), bottom + 30);
    }
    chart.fillText("Tempo (s)", (left + right) / 2, 405);
    chart.save();
    chart.beginPath();
    chart.rect(left, top, right - left, bottom - top);
    chart.clip();
    chart.strokeStyle = colors.curve;
    chart.lineWidth = 3;
    chart.beginPath();
    const first = Math.max(0, sampleIndexAtTime(samples, start));
    for (let point = first; point <= index; point++) {
      const [t, x] = samples[point];
      if (point === first) chart.moveTo(px(t), py(x));
      else chart.lineTo(px(t), py(x));
    }
    chart.stroke();
    if (index >= 0) {
      const [t, x] = samples[index];
      chart.fillStyle = colors.curve;
      chart.beginPath();
      chart.arc(px(t), py(x), 6, 0, Math.PI * 2);
      chart.fill();
    }
    chart.restore();
  }

  function draw(time) {
    displayedTime = time;
    const index = sampleIndexAtTime(samples, time);
    drawPlot(index, time);
    if (video.readyState < 2) return;
    overlay.drawImage(video, 0, 0, recognized.width, recognized.height);
    if (index < 0) return;
    const [t, x, y] = samples[index];
    // Um alvo de tamanho fixo assinala o centro, não o raio medido da bolinha.
    overlay.beginPath();
    overlay.arc(x, y, 18, 0, Math.PI * 2);
    overlay.moveTo(x - 26, y);
    overlay.lineTo(x + 26, y);
    overlay.moveTo(x, y - 26);
    overlay.lineTo(x, y + 26);
    overlay.strokeStyle = "#101620";
    overlay.lineWidth = 6;
    overlay.stroke();
    overlay.strokeStyle = "#a3ff12";
    overlay.lineWidth = 3;
    overlay.stroke();
    status.textContent = `t = ${t.toFixed(2)} s · x = ${x.toFixed(1)} px · y = ${y.toFixed(1)} px`;
    root.dataset.sampleIndex = String(index);
  }

  updateColors();
  status.textContent = "Use os controles do vídeo para acompanhar o reconhecimento e o gráfico.";
  draw(video.currentTime);
  video.addEventListener("loadeddata", () => draw(video.currentTime));
  video.addEventListener("seeked", () => draw(video.currentTime));
  new MutationObserver(() => {
    updateColors();
    draw(displayedTime);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  if ("requestVideoFrameCallback" in video) {
    const onFrame = (now, frame) => {
      draw(frame.mediaTime);
      video.requestVideoFrameCallback(onFrame);
    };
    video.requestVideoFrameCallback(onFrame);
  } else {
    let animation;
    const onFrame = () => {
      draw(video.currentTime);
      if (!video.paused && !video.ended) animation = requestAnimationFrame(onFrame);
    };
    video.addEventListener("play", () => {
      cancelAnimationFrame(animation);
      onFrame();
    });
    video.addEventListener("pause", () => {
      cancelAnimationFrame(animation);
      draw(video.currentTime);
    });
  }
}

if (typeof document !== "undefined") {
  const root = document.querySelector("[data-video-measurement]");
  if (root) mountVideoMeasurement(root);
}
