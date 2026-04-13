const catImage = document.getElementById("catImage");
const topCaption = document.getElementById("topCaption");
const bottomCaption = document.getElementById("bottomCaption");
const topCaptionPreview = document.getElementById("topCaptionPreview");
const bottomCaptionPreview = document.getElementById("bottomCaptionPreview");
const generateButton = document.getElementById("generateButton");
const downloadButton = document.getElementById("downloadButton");
const loadingState = document.getElementById("loadingState");
const statusMessage = document.getElementById("statusMessage");

const captionPairs = [
  { top: "I heard snacks", bottom: "and arrived immediately" },
  { top: "No thoughts", bottom: "just dramatic blinking" },
  { top: "You said one meeting", bottom: "this is meeting number four" },
  { top: "Trying to be productive", bottom: "catastrophically failing" },
  { top: "I live here now", bottom: "this is my box" },
  { top: "Woke up cute", bottom: "chose chaos anyway" },
  { top: "Human said no", bottom: "I accepted that as a suggestion" },
  { top: "Me acting normal", bottom: "for about six seconds" },
  { top: "Budgeting this month", bottom: "but then I saw treats" },
  { top: "When the wifi drops", bottom: "and so does my sanity" },
  { top: "I bring energy", bottom: "none of it useful" },
  { top: "That sound at 3am", bottom: "was absolutely me" },
  { top: "Typing like a professional", bottom: "sitting on the keyboard" },
  { top: "Yes I knocked it over", bottom: "and I would do it again" },
  { top: "Me reading instructions", bottom: "after making the mistake" },
  { top: "The plan was simple", bottom: "then the cat got involved" }
];

let currentMeme = {
  imageUrl: "",
  top: "",
  bottom: ""
};

function pickRandomItem(list) {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function buildCatImageUrl() {
  const cacheBust = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return `https://cataas.com/cat?width=900&height=900&nocache=${cacheBust}`;
}

function setLoadingState(isLoading) {
  loadingState.classList.toggle("hidden", !isLoading);
  generateButton.disabled = isLoading;
  downloadButton.disabled = isLoading;
}

function updateCaptionUI(top, bottom) {
  topCaption.textContent = top;
  bottomCaption.textContent = bottom;
  topCaptionPreview.textContent = top;
  bottomCaptionPreview.textContent = bottom;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load."));

    image.src = url;
  });
}

async function generateMeme() {
  const nextCaption = pickRandomItem(captionPairs);
  const nextImageUrl = buildCatImageUrl();

  setLoadingState(true);
  setStatus("Generating a fresh meme...");

  try {
    await loadImage(nextImageUrl);

    catImage.src = nextImageUrl;
    currentMeme = {
      imageUrl: nextImageUrl,
      top: nextCaption.top,
      bottom: nextCaption.bottom
    };

    updateCaptionUI(currentMeme.top, currentMeme.bottom);
    setStatus("New meme ready.");
  } catch (error) {
    console.error(error);
    setStatus("Could not load a new cat right now. Try again.");
  } finally {
    setLoadingState(false);
  }
}

function drawWrappedText(context, text, canvasWidth, y, baseline) {
  const maxWidth = canvasWidth - 40;
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = context.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  context.textAlign = "center";
  context.textBaseline = baseline;
  context.lineWidth = 6;
  context.strokeStyle = "#000000";
  context.fillStyle = "#ffffff";
  context.font = "bold 52px Impact, Haettenschweiler, Arial Narrow Bold, sans-serif";

  const lineHeight = 54;

  lines.forEach((line, index) => {
    const lineY = y + index * lineHeight;
    context.strokeText(line, canvasWidth / 2, lineY);
    context.fillText(line, canvasWidth / 2, lineY);
  });
}

async function downloadMeme() {
  if (!currentMeme.imageUrl) {
    setStatus("Generate a meme first.");
    return;
  }

  downloadButton.disabled = true;
  setStatus("Preparing your download...");

  try {
    const image = await loadImage(currentMeme.imageUrl);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = image.naturalWidth || 900;
    canvas.height = image.naturalHeight || 900;

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    drawWrappedText(context, currentMeme.top.toUpperCase(), canvas.width, 28, "top");

    const bottomTextLinesEstimate = Math.max(
      1,
      Math.ceil(context.measureText(currentMeme.bottom.toUpperCase()).width / (canvas.width - 40))
    );
    const bottomStartY = canvas.height - 28 - (bottomTextLinesEstimate - 1) * 54;

    drawWrappedText(
      context,
      currentMeme.bottom.toUpperCase(),
      canvas.width,
      bottomStartY,
      "top"
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus("Download failed. Please try again.");
        downloadButton.disabled = false;
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `cat-meme-${Date.now()}.png`;
      link.click();

      URL.revokeObjectURL(blobUrl);
      setStatus("Meme downloaded.");
      downloadButton.disabled = false;
    }, "image/png");
  } catch (error) {
    console.error(error);
    setStatus("Download failed because the image could not be processed.");
    downloadButton.disabled = false;
  }
}

generateButton.addEventListener("click", generateMeme);
downloadButton.addEventListener("click", downloadMeme);

window.addEventListener("load", generateMeme);
