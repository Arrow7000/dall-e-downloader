import { saveAs } from "file-saver";
import JSZip from "jszip";
import { imgSrcToBlob } from "blob-util";

const buttonId = "dall-e-images-downloader-button";

waitForGridToExist();

/**
 * This can never stop running, because we have to reattach the button every time the user clicks on a different task to the one they're viewing
 */
function waitForGridToExist() {
  setTimeout(() => {
    const imageGrid = document.querySelector(".task-page-generations-grid");
    const pagination = document.querySelector(".paginated-generations");
    if (imageGrid !== null) {
      // Once the container has loaded
      const button = document.getElementById(buttonId);

      if (button === null) {
        // Only reattach if the button doesn't already exist

        attachButton(imageGrid);
      }
    }
    else if (pagination !== null) {
      const button = document.getElementById(buttonId);

      if (button === null) {
        // Only reattach if the button doesn't already exist

        attachButton(pagination);
      }
    }
    else {
      waitForGridToExist();
    }
  }, 500);
}

function attachButton(imageGrid: Element) {
  const button = document.createElement("button");
  button.id = buttonId;

  // To get the styles from the rest of the page
  button.classList.add(
    "task-page-flag-desktop",
    "btn",
    "btn-small",
    "btn-filled",
    "btn-secondary",
    "surprise-button"
  );
  button.innerText = "Download prompt & results";

  imageGrid.after(button);

  button.addEventListener("click", downloadImagesAsZip);
}

async function downloadImagesAsZip() {
  var images = document.querySelectorAll<HTMLImageElement>(
    ".task-page .generated-image > img"
  );

  if (images.length <= 0) {
    images = document.querySelectorAll<HTMLImageElement>(
      ".pagination-content .generated-image > img"
    );
    if (images.length <= 0) {
      throw new Error("No generated images found");
    }
  }

  var titleFromPrompt = document
    .querySelector<HTMLInputElement>(".image-prompt-input")
    ?.value.trim();
  const title = titleFromPrompt === undefined ? "AllImages" : titleFromPrompt;

  const imgUrls = [...images.values()].map((img) => img.src);

  const folder = new JSZip();

  const blobsAndNames = await Promise.all(
    imgUrls.map((imgUrl, i) => {
      return imgSrcToBlob(imgUrl, "image/png", "Anonymous").then((blob) => {
        const name = `${title.slice(0, 30)} - ${i + 1}.png`;
        return { name, blob };
      });
    })
  );

  blobsAndNames.forEach(({ blob, name }) => {
    folder.file(name, blob);
  });

  folder.generateAsync({ type: "blob" }).then((content) => {
    saveAs(content, title + ".zip");
  });
}
