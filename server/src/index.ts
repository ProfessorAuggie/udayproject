import { createServerApp } from "./app.js";

const app = createServerApp(true);
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
