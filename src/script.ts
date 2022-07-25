const origFetch = window.fetch;

/**
 * Alas they patched the API to reject any batch size greater than 4, so this
 * will no longer work 😢😢😢😢😢😢😢
 * Twas a beautiful dream.
 */
const replacementFetch: typeof fetch = (input, init) => {
  if (
    input === "https://labs.openai.com/api/labs/tasks" &&
    init &&
    init?.method === "POST"
  ) {
    console.log({ input, init });

    const { body } = init;

    const parsedBody = JSON.parse(body as string);

    parsedBody.prompt.batch_size = 6;

    console.log("Batch size changed to 6!");

    const newBody = JSON.stringify(parsedBody);
    init.body = newBody;
  }

  return origFetch(input, init);
};

window.fetch = replacementFetch;
