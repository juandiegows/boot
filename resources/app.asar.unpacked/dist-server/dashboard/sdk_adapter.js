"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSdkExports = void 0;
// Stub para corregir ruta de import en build.
// Reexporta getSdkExports desde src/sdk_adapter.ts (CommonJS) ubicado un nivel arriba.
// Usamos require para evitar que TypeScript exija que el archivo origen sea un módulo ESM.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sdk = require('../sdk_adapter');
// Exponemos getSdkExports con export nombrado para TypeScript.
exports.getSdkExports = sdk.getSdkExports;
