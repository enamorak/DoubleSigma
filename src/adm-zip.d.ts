declare module "adm-zip" {
  import type { Buffer } from "node:buffer";

  export default class AdmZip {
    constructor(raw?: string | Buffer);
    extractAllTo(targetPath: string, overwrite: boolean): void;
  }
}
