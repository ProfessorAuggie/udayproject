import "dotenv/config.js";
import { createServerApp } from "../../server/dist/app.js";

const app = createServerApp(false);

export default app;
