import { loadDotEnvFile } from "../env/loadDotEnv.js";
import { startWebServer } from "./server.js";

loadDotEnvFile();
startWebServer();
