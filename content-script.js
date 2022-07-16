waitForGridToExist();

const callback = function (mutationList, observer) {
  console.log({ mutationList });
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      waitForGridToExist();
    }
  }
};
const observer = new MutationObserver(callback);

function waitForGridToExist() {
  setTimeout(() => {
    const imageGrid = document.querySelector(".task-page-generations-grid");
    if (imageGrid === null) {
      waitForGridToExist();
    } else {
      observer.disconnect();
      const observerTarget = document.querySelector(".task-page-generations");
      const config = { childList: true };

      observer.observe(observerTarget, config);

      attachButton(imageGrid);
    }
  }, 500);
}

/**
 * @TODO: need to sort out the lifecycle of the waiter and the observer to ensure we don't have an infinite loop of button creations, as we do now.
 */

function attachButton(imageGrid) {
  const button = document.createElement("button");
  button.id = "download-button";
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

  button.addEventListener("click", getImagesAndTitle);
}

async function getImagesAndTitle() {
  const images = document.querySelectorAll(".task-page .generated-image > img");

  const title = document.querySelector(".image-prompt-input").value;

  const imgUrls = [...images.values()].map((img) => img.src);

  const zip = new JSZip();
  const folder = zip.folder(title);

  const blobsAndNames = await Promise.all(
    imgUrls.map((imgUrl, i) => {
      return blobUtil
        .imgSrcToBlob(imgUrl, "image/png", "Anonymous")
        .then((blob) => {
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
