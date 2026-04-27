import { type Server } from "node:http";
declare const publicDir: string;
declare const app: import("express-serve-static-core").Express;
export declare function startWebServer(port?: number): Server;
export { app as webApp, publicDir };
