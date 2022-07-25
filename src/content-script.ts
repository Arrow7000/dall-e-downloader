import { saveAs } from "file-saver";
import JSZip from "jszip";
import { imgSrcToBlob } from "blob-util";

import patcherScript from "url:./script";

const buttonId = "dall-e-images-downloader-button";

waitForGridToExist();

/**
 * This can never stop running, because we have to reattach the button every time the user clicks on a different task to the one they're viewing
 */
function waitForGridToExist() {
  setTimeout(() => {
    const imageGrid = document.querySelector(".task-page-generations-grid");
    if (imageGrid !== null) {
      // Once the container has loaded
      const button = document.getElementById(buttonId);

      if (button === null) {
        // Only reattach if the button doesn't already exist

        attachButton(imageGrid);
      }
    }

    waitForGridToExist();
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
  const images = document.querySelectorAll<HTMLImageElement>(
    ".task-page .generated-image > img"
  );

  if (images.length <= 0) {
    throw new Error("No generated images found");
  }

  const title = document
    .querySelector<HTMLInputElement>(".image-prompt-input")
    ?.value.trim();

  if (title === undefined) {
    throw new Error(
      "Cannot find the prompt input field so unable to generate a title for the download"
    );
  } else {
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
}

/**
 * The below code injects the contents of script.ts into the page with regular
 * access to everything! Which means the window.fetch function can be
 * monkeypatched!!!!!
 */

// To remove the prefix of `chrome-extension://nfjhecfhccemmdcdcfhemhljbjjhakim/` and just get the filename directly
const filename = patcherScript.replace(/^.*[\\\/]/, "");

const s = document.createElement("script");
s.src = chrome.runtime.getURL(filename);
s.onload = function () {
  this.remove();
};
(document.head || document.documentElement).appendChild(s);
