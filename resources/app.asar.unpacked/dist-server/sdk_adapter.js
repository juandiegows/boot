// sdk adapter by esbuild
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
const path = require("path");
const fs = require("fs");
const ENV_SDK = process.env.SDK_PATH ? path.resolve(process.env.SDK_PATH) : null;
const IN_ASAR = __dirname.includes("app.asar");
let asarUnpackedBase = null;
if (IN_ASAR) {
  try {
    const parts = __dirname.split(/app\.asar[\\/]/i)[0];
    asarUnpackedBase = parts + "app.asar.unpacked";
  } catch {
    asarUnpackedBase = null;
  }
}
const CANDIDATE_PATHS = [
  // 1) ruta absoluta por ENV (si se configuró)
  ENV_SDK,
  // 2) rutas relativas esperadas desde dist/src (lo que ya intentabas)
  path.resolve(__dirname, "../libs/client-sdk-js/index.js"),
  path.resolve(__dirname, "../libs/client-sdk-js/dist/index.js"),
  path.resolve(__dirname, "../libs/client-sdk-js/src/index.js"),
  path.resolve(__dirname, "../libs/client-sdk-js/build/index.js"),
  path.resolve(__dirname, "../libs/client-sdk-js/lib/index.js"),
  // 3) subir dos niveles: útil cuando el build queda en dist/src y el SDK está en la raíz/libs
  path.resolve(__dirname, "../../libs/client-sdk-js/index.js"),
  path.resolve(__dirname, "../../libs/client-sdk-js/dist/index.js"),
  path.resolve(__dirname, "../../libs/client-sdk-js/src/index.js"),
  // 4) comprobar directamente en la raíz del proyecto (por si ejecutas desde src)
  path.resolve(process.cwd(), "libs", "client-sdk-js", "index.js"),
  path.resolve(process.cwd(), "libs", "client-sdk-js", "dist", "index.js"),
  path.resolve(process.cwd(), "libs", "client-sdk-js", "src", "index.js"),
  // 5) Si estamos dentro de app.asar, intentar rutas a app.asar.unpacked
  asarUnpackedBase ? path.join(asarUnpackedBase, "libs", "client-sdk-js", "dist", "index.js") : null,
  asarUnpackedBase ? path.join(asarUnpackedBase, "libs", "client-sdk-js", "index.js") : null,
  asarUnpackedBase ? path.join(asarUnpackedBase, "libs", "client-sdk-js", "src", "index.js") : null
  // 5) intentar nombre de paquete en node_modules (opcional)
  // NOTE: esto no es un path, se usa solo con require.resolve más abajo
].filter(Boolean);
function safeRequire(p) {
  try {
    return require(p);
  } catch (e) {
    return null;
  }
}
function resolveSdkModule() {
  const tried = [];
  if (ENV_SDK) {
    try {
      if (fs.existsSync(ENV_SDK)) {
        const mod = safeRequire(ENV_SDK);
        if (mod) return mod;
      }
    } catch (e) {
    }
  }
  for (const candidate of CANDIDATE_PATHS) {
    if (!candidate) continue;
    try {
      if (fs.existsSync(candidate)) {
        const mod = safeRequire(candidate);
        if (mod) return mod;
      }
    } catch (e) {
    }
    try {
      const resolved = require.resolve(candidate);
      const mod = safeRequire(resolved);
      if (mod) return mod;
    } catch (e) {
    }
    tried.push(candidate);
  }
  try {
    const byName = require.resolve("client-sdk-js");
    const mod = safeRequire(byName);
    if (mod) return mod;
  } catch (e) {
  }
  try {
    const rootLib = path.resolve(process.cwd(), "libs", "client-sdk-js");
    const mod = safeRequire(rootLib);
    if (mod) return mod;
  } catch (e) {
  }
  console.error("[SDK Adapter] candidatos probados sin \xE9xito:", tried);
  throw new Error("[SDK Adapter] No pude cargar el SDK. Aseg\xFArate de pegarlo en libs/client-sdk-js/ o define SDK_PATH.");
}
function pickExport(mod, name) {
  if (!mod) return null;
  if (Object.prototype.hasOwnProperty.call(mod, name)) return mod[name];
  if (mod.default) {
    if (Object.prototype.hasOwnProperty.call(mod.default, name)) return mod.default[name];
    if (typeof mod.default === "function" && (mod.default.name === name || mod.default.name === name.replace(/^./, (c) => c.toUpperCase()))) {
      return mod.default;
    }
    if (typeof mod.default === "object" && mod.default[name]) return mod.default[name];
  }
  const lower = name.charAt(0).toLowerCase() + name.slice(1);
  if (mod[lower]) return mod[lower];
  if (mod.default && mod.default[lower]) return mod.default[lower];
  return null;
}
function getSdkExports() {
  try {
    const cfgPath = path.resolve(process.cwd(), "configs", "bot.config.json");
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
      if (cfg && cfg.simMode) {
        return require("./sim_sdk");
      }
    }
  } catch (e) {
  }
  const mod = resolveSdkModule();
  try {
    console.log("[SDK Adapter] cargado OK keys=", Object.keys(mod || {}));
  } catch {
  }
  const ClientSdk = pickExport(mod, "ClientSdk") || pickExport(mod, "Client") || pickExport(mod, "ClientSDK");
  const LoginPasswordAuthMethod = pickExport(mod, "LoginPasswordAuthMethod") || pickExport(mod, "LoginAuth") || pickExport(mod, "Auth");
  const SsidAuthMethod = pickExport(mod, "SsidAuthMethod") || pickExport(mod, "SsidAuth") || mod.Auth && mod.Auth.SsidAuthMethod || mod.default && mod.default.SsidAuthMethod;
  const BalanceType = pickExport(mod, "BalanceType") || pickExport(mod, "Balance");
  const BinaryOptionsDirection = pickExport(mod, "BinaryOptionsDirection") || pickExport(mod, "Direction");
  if (!ClientSdk || !LoginPasswordAuthMethod || !BinaryOptionsDirection) {
    const keys = [].concat(Object.keys(mod || {})).concat(Object.keys(mod && mod.default ? mod.default : {}));
    throw new Error("[SDK Adapter] No encontr\xE9 las exportaciones esperadas en el SDK. Exports vistos: " + keys.join(", "));
  }
  return { ClientSdk, LoginPasswordAuthMethod, SsidAuthMethod, BalanceType, BinaryOptionsDirection };
}
module.exports = { getSdkExports };
module.exports.default = getSdkExports;
