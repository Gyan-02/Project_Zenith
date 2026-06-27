import { createApp } from "./app.js";
import { config } from "./config.js";

createApp().listen(config.port, () => {
  console.log(`Zenith backend listening on http://localhost:${config.port}`);
});
