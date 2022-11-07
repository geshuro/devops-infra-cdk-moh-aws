import { build } from "esbuild";
import { esbuildDecorators } from "@anatine/esbuild-decorators";

const tsconfig = "./tsconfig.json";

build({
  platform: "node",
  target: "node14",
  bundle: true,
  sourcemap: "external",
  plugins: [
    esbuildDecorators({
      tsconfig,
      cwd: process.cwd(),
    }),
  ],
  tsconfig,
  entryPoints: ["./lib/index.ts"],
  outfile: "dist/index.js",

  external: [
    "aws-sdk",
    "@nestjs/microservices",
    "@nestjs/websockets",
    "class-transformer/storage",
  ],
});
