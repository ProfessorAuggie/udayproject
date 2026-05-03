/**
 * Vercel runs this Express app as a single serverless function.
 * Static UI comes from `client/dist` (outputDirectory); `/api/*` is handled here.
 */
import { createServerApp } from "./server/dist/app.js";

export default createServerApp(false);
