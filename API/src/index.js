const { createApp } = require("./app");

const PORT = Number(process.env.PORT) || 3000;

createApp()
  .then(({ app }) => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Tasks & Reminders API listening on http://localhost:${PORT}/v1`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
