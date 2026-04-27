import assert from "node:assert/strict";
import { test } from "node:test";
import { transformFile } from "../../dist/codemods/index.js";

test("@ethersproject/abi import becomes ethers", () => {
  const before = "import { Interface } from '@ethersproject/abi'\n";
  const ch = transformFile("swapRouter.ts", before);
  assert.ok(ch);
  assert.match(ch.after, /from "ethers"/);
});

test("JsonRpcProvider from @ethersproject/providers", () => {
  const before = 'import { JsonRpcProvider } from "@ethersproject/providers"\n';
  const ch = transformFile("a.ts", before);
  assert.ok(ch);
  assert.match(ch.after, /from "ethers"/);
});
