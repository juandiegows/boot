// bundled bot by esbuild
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../src/sim_sdk.ts
var require_sim_sdk = __commonJS({
  "../src/sim_sdk.ts"(exports2, module2) {
    const BalanceType = { Practice: "DEMO", Real: "REAL" };
    const BinaryOptionsDirection2 = { Call: "CALL", Put: "PUT" };
    class LoginPasswordAuthMethod2 {
      constructor(email, password) {
        this.email = email;
        this.password = password;
      }
    }
    function nowSec() { return Math.floor(Date.now() / 1e3); }
    class CandlesFacade {
      async getCandles(activeId, sizeSec, opts) {
        const count = Math.max(10, Number((opts && opts.count) || 120));
        const from = Number((opts && opts.from) || (nowSec() - count * sizeSec));
        const onlyClosed = !!(opts && opts.onlyClosed);
        const out = [];
        let price = 1.1 + (activeId % 10) * 1e-3;
        for (let i = 0; i < count; i++) {
          const start = from + i * sizeSec;
          const end = start + sizeSec;
          const drift = Math.sin((i + activeId) * 0.25) * 5e-4;
          const noise = (Math.random() - 0.5) * 8e-4;
          const open = price;
          const close = price + drift + noise;
          const high = Math.max(open, close) + Math.random() * 5e-4;
          const low = Math.min(open, close) - Math.random() * 5e-4;
          price = close;
          out.push({ from: start, to: end, open, high, low, close });
        }
        if (!onlyClosed) {
          const last = out[out.length - 1];
          if (last && last.to > nowSec()) last.current = true;
        }
        return out;
      }
    }
    class SimpleInstrument {
      constructor(expirationSize) {
        this.expirationSize = expirationSize;
        this._purchaseEndOffsetMs = 15e3 + Math.random() * 1e4;
      }
      isAvailableForBuyAt(_date) { return true; }
      durationRemainingForPurchase(_date) { return this._purchaseEndOffsetMs; }
      purchaseEndTime() { return new Date(Date.now() + this._purchaseEndOffsetMs); }
    }
    class ActiveInstruments {
      constructor(expirationTimes) {
        this.expirationTimes = expirationTimes;
        this.instruments = expirationTimes.map((x) => new SimpleInstrument(x));
      }
      getAvailableForBuyAt(_date) { return this.instruments.filter(() => true); }
    }
    class Active {
      constructor(id, ticker, exp) {
        this.id = id;
        this.ticker = ticker;
        this.title = ticker;
        this._instruments = new ActiveInstruments(exp);
      }
      async instruments() { return this._instruments; }
    }
    class TurboOptions {
      constructor() {
        this._actives = [
          new Active(1, "EURUSD", [60, 300]),
          new Active(2, "EURGBP", [60, 300, 900]),
          new Active(4, "EURJPY", [60])
        ];
      }
      getActives() { return this._actives; }
      getActive(id) { return this._actives.find((a) => a.id === id); }
      async buy(_instrument, _direction, _amount, balance) {
        return { id: "SIM-TURBO-" + Math.floor(Math.random() * 1e6), status: "placed", balanceId: balance.id };
      }
    }
    class BinaryOptions {
      constructor() {
        this._actives = [
          new Active(1, "EURUSD", [300, 900]),
          new Active(2, "EURGBP", [900]),
                // Nota: se mantiene la ventana buyEndServer
        ];
      }
      getActives() { return this._actives; }
      getActive(id) { return this._actives.find((a) => a.id === id); }
      async buy(_instrument, _direction, _amount, balance) {
        return { id: "SIM-BINARY-" + Math.floor(Math.random() * 1e6), status: "placed", balanceId: balance.id };
      }
    }
    class DigitalOptionsUnderlyingInstrument {
      constructor(expiration) { this.expiration = expiration; }
      isAvailableForBuyAt(_d) { return true; }
      durationRemainingForPurchase(_d) { return 15e3 + Math.random() * 1e4; }
    }
    class DigitalOptionsUnderlyingInstruments {
      getAvailableForBuyAt(_date) {
        const now = Date.now();
        const five = 5 * 60 * 1e3;
        const next = Math.ceil(now / five) * five;
        return [0, 1, 2].map((k) => new DigitalOptionsUnderlyingInstrument(new Date(next + k * five)));
      }
    }
    class DigitalOptionsUnderlying {
      constructor(id) { this.id = id; this.assetId = id; }
      async instruments() { return new DigitalOptionsUnderlyingInstruments(); }
      static async create(id, _ws) { return new DigitalOptionsUnderlying(id); }
    }
    class DigitalOptions {
      constructor() { this.wsApiClient = {}; this.DigitalOptionsUnderlying = DigitalOptionsUnderlying; }
      getUnderlyingsAvailableForTradingAt(_d) { return [new DigitalOptionsUnderlying(1), new DigitalOptionsUnderlying(2), new DigitalOptionsUnderlying(4)]; }
      getUnderlying(id) { return new DigitalOptionsUnderlying(id); }
      async buySpotStrike(_ins, _direction, _amount, balance) { return { id: "SIM-DIGITAL-SPT-" + Math.floor(Math.random() * 1e6), status: "placed", balanceId: balance.id }; }
      async buy(_ins, _strike, _direction, _amount, balance) { return { id: "SIM-DIGITAL-" + Math.floor(Math.random() * 1e6), status: "placed", balanceId: balance.id }; }
    }
    class ClientSdk2 {
      constructor(opts) {
        this.broker = opts && opts.broker;
        this._balances = [
          { id: 111, type: BalanceType.Practice, amount: 1e4 },
          { id: 222, type: BalanceType.Real, amount: 0 }
        ];
      }
      async connect() { return true; }
      async authenticate(_auth) { return { ok: true }; }
      async balances() { return this._balances; }
      async candles() { return new CandlesFacade(); }
      async turboOptions() { return new TurboOptions(); }
      async binaryOptions() { return new BinaryOptions(); }
      async digitalOptions() { return new DigitalOptions(); }
    }
    module2.exports = { ClientSdk: ClientSdk2, LoginPasswordAuthMethod: LoginPasswordAuthMethod2, BalanceType, BinaryOptionsDirection: BinaryOptionsDirection2 };
  }
});

// ../src/sdk_adapter.ts
var require_sdk_adapter = __commonJS({
  "../src/sdk_adapter.ts"(exports2, module2) {
    var path2 = require("path");
    var fs2 = require("fs");
    var ENV_SDK = process.env.SDK_PATH ? path2.resolve(process.env.SDK_PATH) : null;
    var IN_ASAR = __dirname.includes("app.asar");
    var asarUnpackedBase = null;
    if (IN_ASAR) {
      try {
        const parts = __dirname.split(/app\.asar[\\/]/i)[0];
        asarUnpackedBase = parts + "app.asar.unpacked";
      } catch {
        asarUnpackedBase = null;
      }
    }
    var CANDIDATE_PATHS = [
      // 1) ruta absoluta por ENV (si se configuró)
      ENV_SDK,
      // 2) rutas relativas esperadas desde dist/src (lo que ya intentabas)
      path2.resolve(__dirname, "../libs/client-sdk-js/index.js"),
      path2.resolve(__dirname, "../libs/client-sdk-js/dist/index.js"),
      path2.resolve(__dirname, "../libs/client-sdk-js/src/index.js"),
      path2.resolve(__dirname, "../libs/client-sdk-js/build/index.js"),
      path2.resolve(__dirname, "../libs/client-sdk-js/lib/index.js"),
      // 3) subir dos niveles: útil cuando el build queda en dist/src y el SDK está en la raíz/libs
      path2.resolve(__dirname, "../../libs/client-sdk-js/index.js"),
      path2.resolve(__dirname, "../../libs/client-sdk-js/dist/index.js"),
      path2.resolve(__dirname, "../../libs/client-sdk-js/src/index.js"),
      // 4) comprobar directamente en la raíz del proyecto (por si ejecutas desde src)
      path2.resolve(process.cwd(), "libs", "client-sdk-js", "index.js"),
      path2.resolve(process.cwd(), "libs", "client-sdk-js", "dist", "index.js"),
      path2.resolve(process.cwd(), "libs", "client-sdk-js", "src", "index.js"),
      // 5) Si estamos dentro de app.asar, intentar rutas a app.asar.unpacked
      asarUnpackedBase ? path2.join(asarUnpackedBase, "libs", "client-sdk-js", "dist", "index.js") : null,
      asarUnpackedBase ? path2.join(asarUnpackedBase, "libs", "client-sdk-js", "index.js") : null,
      asarUnpackedBase ? path2.join(asarUnpackedBase, "libs", "client-sdk-js", "src", "index.js") : null
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
          if (fs2.existsSync(ENV_SDK)) {
            const mod = safeRequire(ENV_SDK);
            if (mod) return mod;
          }
        } catch (e) {
        }
      }
      for (const candidate of CANDIDATE_PATHS) {
        if (!candidate) continue;
        try {
          if (fs2.existsSync(candidate)) {
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
        const rootLib = path2.resolve(process.cwd(), "libs", "client-sdk-js");
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
    function getSdkExports2() {
      try {
        const cfgPath2 = path2.resolve(process.cwd(), "configs", "bot.config.json");
        if (fs2.existsSync(cfgPath2)) {
          const cfg = JSON.parse(fs2.readFileSync(cfgPath2, "utf-8"));
          if (cfg && cfg.simMode) {
            return require_sim_sdk();
          }
        }
      } catch (e) {
      }
      const mod = resolveSdkModule();
      try {
        console.log("[SDK Adapter] cargado OK keys=", Object.keys(mod || {}));
      } catch {
      }
      const ClientSdk2 = pickExport(mod, "ClientSdk") || pickExport(mod, "Client") || pickExport(mod, "ClientSDK");
      const LoginPasswordAuthMethod2 = pickExport(mod, "LoginPasswordAuthMethod") || pickExport(mod, "LoginAuth") || pickExport(mod, "Auth");
      const SsidAuthMethod = pickExport(mod, "SsidAuthMethod") || pickExport(mod, "SsidAuth") || mod.Auth && mod.Auth.SsidAuthMethod || mod.default && mod.default.SsidAuthMethod;
      const BalanceType = pickExport(mod, "BalanceType") || pickExport(mod, "Balance");
      const BinaryOptionsDirection2 = pickExport(mod, "BinaryOptionsDirection") || pickExport(mod, "Direction");
      if (!ClientSdk2 || !LoginPasswordAuthMethod2 || !BinaryOptionsDirection2) {
        const keys = [].concat(Object.keys(mod || {})).concat(Object.keys(mod && mod.default ? mod.default : {}));
        throw new Error("[SDK Adapter] No encontr\xE9 las exportaciones esperadas en el SDK. Exports vistos: " + keys.join(", "));
      }
      return { ClientSdk: ClientSdk2, LoginPasswordAuthMethod: LoginPasswordAuthMethod2, SsidAuthMethod, BalanceType, BinaryOptionsDirection: BinaryOptionsDirection2 };
    }
    module2.exports = { getSdkExports: getSdkExports2 };
    module2.exports.default = getSdkExports2;
  }
});

// ../src/replica_bot.ts
var replica_bot_exports = {};
module.exports = __toCommonJS(replica_bot_exports);

// ../src/helpers_trading.ts
function normalizeCandles(arr) {
  try {
    return arr.map((c) => {
      const hi = (c && (c.high ?? c.max));
      const lo = (c && (c.low ?? c.min));
      const high = typeof hi === 'number' ? hi : (isFinite(Number(hi)) ? Number(hi) : undefined);
      const low = typeof lo === 'number' ? lo : (isFinite(Number(lo)) ? Number(lo) : undefined);
      if (high != null && low != null) return { ...c, high, low };
      // fallback: if one side missing but we have open/close, approximate bounds
      const open = typeof c.open === 'number' ? c.open : Number(c.open);
      const close = typeof c.close === 'number' ? c.close : Number(c.close);
      const approxHigh = high != null ? high : (isFinite(open) && isFinite(close) ? Math.max(open, close) : undefined);
      const approxLow = low != null ? low : (isFinite(open) && isFinite(close) ? Math.min(open, close) : undefined);
      return { ...c, high: approxHigh, low: approxLow };
    });
  } catch {
    return arr;
  }
}
async function getCandlesFlexible(sdk, activeId, count, timeframeSec, opts) {
  const candlesFacade = await sdk.candles();
  const size = Number(timeframeSec);
  const kindsToTry = opts?.kind ? [opts.kind] : ["mid", "turbo-option", "binary-option"];
  const includeCurrent = !!opts?.includeCurrent;
  const now = Math.floor(Date.now() / 1e3);
  const total = includeCurrent ? count + 1 : count;
  const from = now - total * size;
  let lastErr = null;
  for (const k of kindsToTry) {
    try {
      const arr = await candlesFacade.getCandles(Number(activeId), size, {
        count: total,
        from,
        onlyClosed: !includeCurrent,
        kind: k,
        backoff: 10,
        splitNormalization: true
      });
      if (!Array.isArray(arr) || !arr.length) continue;
      if (includeCurrent && arr.length) {
        const end = arr[arr.length - 1].to;
        const nowSec = Math.floor(Date.now() / 1e3);
        if (end > nowSec) {
          arr[arr.length - 1] = { ...arr[arr.length - 1], current: true };
        }
      }
      return normalizeCandles(arr);
    } catch (e) {
      lastErr = e;
    }
  }
  const lastMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error("No se pudieron obtener velas. \xDAltimo error: " + lastMsg);
}
async function getCandlesWithMinHistory(sdk, activeId, timeframeSec, needCount, opts) {
  const size = timeframeSec;
  let acc = await getCandlesFlexible(sdk, activeId, needCount, timeframeSec, opts).catch(() => []);
  if (acc.length >= needCount || timeframeSec !== 60) return acc.slice(-needCount);
  const candlesFacade = await sdk.candles();
  const includeCurrent = !!opts?.includeCurrent;
  const kinds = opts?.kind ? [opts.kind] : ["mid", "turbo-option", "binary-option"];
  const maxPages = 5;
  let attempts = 0;
  let lastErr = null;
  while (acc.length < needCount && attempts < maxPages) {
    attempts++;
    const missing = needCount - acc.length;
    const earliest = acc.length ? acc[0].from : Math.floor(Date.now() / 1e3) - size * needCount;
    const from = earliest - missing * size - size;
    for (const k of kinds) {
      try {
        const page = await candlesFacade.getCandles(Number(activeId), size, {
          count: missing,
          from,
          onlyClosed: !includeCurrent,
          kind: k,
          backoff: 10,
          splitNormalization: true
        });
        if (Array.isArray(page) && page.length) {
          acc = [...normalizeCandles(page), ...acc];
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }
  }
  const seen = /* @__PURE__ */ new Set();
  acc = acc.sort((a, b) => a.from - b.from).filter((c) => {
    if (seen.has(c.to)) return false;
    seen.add(c.to);
    return true;
  });
  if (includeCurrent && acc.length) {
    const nowSec = Math.floor(Date.now() / 1e3);
    const last = acc[acc.length - 1];
    if (last.to > nowSec) acc[acc.length - 1] = { ...last, current: true };
  }
  return acc.slice(-needCount);
}

// ../src/logica_signales.ts
function sma(arr, period) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    if (i + 1 < period) {
      out.push(NaN);
      continue;
    }
    const window = arr.slice(i + 1 - period, i + 1);
    let sum = 0;
    let finiteCount = 0;
    for (const v of window) {
      if (!isFinite(v)) continue;
      sum += v;
      finiteCount++;
    }
    if (finiteCount < period) {
      out.push(NaN);
      continue;
    }
    out.push(sum / period);
  }
  return out;
}
function wma(arr, period) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    if (i + 1 < period) {
      out.push(NaN);
      continue;
    }
    let sum = 0, denom = 0, finiteCount = 0;
    for (let j = 0; j < period; j++) {
      const v = arr[i - j];
      if (!isFinite(v)) continue;
      sum += v * (period - j);
      denom += period - j;
      finiteCount++;
    }
    if (finiteCount < period || denom === 0) {
      out.push(NaN);
      continue;
    }
    out.push(sum / denom);
  }
  return out;
}
function decideSignal(candles, source = "close", MaFast_period = 1, MaSlow_period = 34, Signal_period = 5) {
  const need = MaSlow_period + Signal_period;
  if (!candles || candles.length < 1) return { signal: null };
  const series = candles.map((c) => {
    if (source === "high") return c.high;
    if (source === "low") return c.low;
    if (source === "hl2") return (c.high + c.low) / 2;
    return c.close;
  });
  const finiteCount = series.reduce((acc, v) => acc + (isFinite(v) ? 1 : 0), 0);
  if (finiteCount < need) {
    const smaFast2 = sma(series, MaFast_period);
    const smaSlow2 = sma(series, MaSlow_period);
    const buffer12 = smaFast2.map((v, i2) => v - (smaSlow2[i2] ?? 0));
    const buffer22 = wma(buffer12, Signal_period);
    return { signal: null, buffer1: buffer12, buffer2: buffer22 };
  }
  const smaFast = sma(series, MaFast_period);
  const smaSlow = sma(series, MaSlow_period);
  const buffer1 = smaFast.map((v, i2) => v - (smaSlow[i2] ?? 0));
  const buffer2 = wma(buffer1, Signal_period);
  const i = buffer1.length - 1;
  if (candles.length < need) return { signal: null, buffer1, buffer2 };
  for (let j = i; j >= Math.max(1, i - 3); j--) {
    if (!isFinite(buffer1[j]) || !isFinite(buffer2[j]) || !isFinite(buffer1[j - 1]) || !isFinite(buffer2[j - 1])) continue;
    if (buffer1[j] > buffer2[j] && buffer1[j - 1] < buffer2[j - 1]) return { signal: "CALL", buffer1, buffer2, signalIndex: j };
    if (buffer1[j] < buffer2[j] && buffer1[j - 1] > buffer2[j - 1]) return { signal: "PUT", buffer1, buffer2, signalIndex: j };
  }
  return { signal: null, buffer1, buffer2 };
}

// ===== VIP+ Helpers: EMA, ATR, ADX, Bollinger, Fractals, Regime =====
function emaSeries(arr, period) {
  const out = [];
  const k = 2 / (period + 1);
  let prev;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (!isFinite(v)) { out.push(NaN); continue; }
    if (prev == null) {
      // seed with SMA of first period if possible
      if (i + 1 < period) { out.push(NaN); continue; }
      let sum = 0, cnt = 0;
      for (let j = i - period + 1; j <= i; j++) { const x = arr[j]; if (isFinite(x)) { sum += x; cnt++; } }
      prev = cnt ? sum / cnt : v;
      out.push(prev);
    } else {
      const next = v * k + prev * (1 - k);
      out.push(next);
      prev = next;
    }
  }
  return out;
}
function trueRange(cPrev, c) {
  const hl = c.high - c.low;
  if (!cPrev) return Math.max(0, hl);
  const hcp = Math.abs(c.high - cPrev.close);
  const lcp = Math.abs(c.low - cPrev.close);
  return Math.max(0, Math.max(hl, hcp, lcp));
}
function atr(candles, period = 14) {
  const tr = [];
  for (let i = 0; i < candles.length; i++) tr.push(trueRange(candles[i - 1], candles[i]));
  const out = [];
  let sum = 0;
  for (let i = 0; i < tr.length; i++) {
    const v = tr[i];
    sum += v;
    if (i >= period) sum -= tr[i - period];
    out.push(i + 1 < period ? NaN : sum / period);
  }
  return out;
}
function adx(candles, period = 14) {
  const plusDM = [], minusDM = [], tr = [];
  for (let i = 0; i < candles.length; i++) {
    const prev = candles[i - 1];
    const cur = candles[i];
    const upMove = i === 0 ? 0 : cur.high - prev.high;
    const downMove = i === 0 ? 0 : prev.low - cur.low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(trueRange(prev, cur));
  }
  function smooth(arr, p) {
    const out = [];
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      sum += arr[i];
      if (i >= p) sum -= arr[i - p];
      out.push(i + 1 < p ? NaN : sum);
    }
    return out;
  }
  const trN = smooth(tr, period);
  const plusDMN = smooth(plusDM, period);
  const minusDMN = smooth(minusDM, period);
  const pDI = trN.map((t, i) => (i + 1 < period || t === 0 || !isFinite(t)) ? NaN : 100 * (plusDMN[i] / t));
  const mDI = trN.map((t, i) => (i + 1 < period || t === 0 || !isFinite(t)) ? NaN : 100 * (minusDMN[i] / t));
  const dx = pDI.map((p, i) => {
    const m = mDI[i];
    if (!isFinite(p) || !isFinite(m) || (p + m) === 0) return NaN;
    return 100 * Math.abs(p - m) / (p + m);
  });
  // simple moving average of DX for ADX
  const adxArr = sma(dx.map(x => isFinite(x) ? x : NaN), period);
  return adxArr;
}
function bollingerWidth(closes, period = 20, mult = 2) {
  const ma = sma(closes, period);
  const out = [];
  for (let i = 0; i < closes.length; i++) {
    if (i + 1 < period) { out.push(NaN); continue; }
    let mean = ma[i];
    let s2 = 0, cnt = 0;
    for (let j = i - period + 1; j <= i; j++) { const d = closes[j] - mean; if (isFinite(d)) { s2 += d * d; cnt++; } }
    const sd = cnt ? Math.sqrt(s2 / cnt) : 0;
    const upper = mean + mult * sd;
    const lower = mean - mult * sd;
    out.push(upper - lower);
  }
  return out;
}
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function getLastFractalsFlexible(candles, lookaheadBars = 2) {
  // Bill Williams fractals:
  // - lookaheadBars=2: confirmados (5 velas), requieren 2 velas futuras (no repaint)
  // - lookaheadBars=0: detección temprana sin futuras (más rápida, puede repintar)
  const n = candles.length;
  let lastUp = null, lastDn = null;
  if (n < 3) return { lastUp, lastDn };
  if (lookaheadBars >= 2) {
    for (let i = 2; i <= n - 3; i++) {
      const c = candles[i];
      const up = c.high > candles[i - 1].high && c.high > candles[i - 2].high && c.high > candles[i + 1].high && c.high > candles[i + 2].high;
      const dn = c.low < candles[i - 1].low && c.low < candles[i - 2].low && c.low < candles[i + 1].low && c.low < candles[i + 2].low;
      if (up) lastUp = { idx: i, price: c.high };
      if (dn) lastDn = { idx: i, price: c.low };
    }
  } else {
    // Detección temprana: usa solo historial (sin velas futuras). Pivot de 3 velas.
    for (let i = 2; i <= n - 1; i++) {
      const c = candles[i - 1]; // última cerrada en cada iteración
      const up = c.high > candles[i - 2].high && c.high > candles[i - 3]?.high;
      const dn = c.low < candles[i - 2].low && c.low < candles[i - 3]?.low;
      if (up) lastUp = { idx: i - 1, price: c.high };
      if (dn) lastDn = { idx: i - 1, price: c.low };
    }
  }
  return { lastUp, lastDn };
}
function computeRegimeScore(m5, cfg) {
  if (!m5 || m5.length < 30) return 0.5;
  const closes = m5.map(c => c.close);
  const emaFast = emaSeries(closes, 9);
  const emaSlow = emaSeries(closes, 21);
  const atr14 = atr(m5, cfg?.vipPlus?.adxPeriod || 14);
  const adx14 = adx(m5, cfg?.vipPlus?.adxPeriod || 14);
  const bbw = bollingerWidth(closes, 20, 2).map((w, i) => {
    const mid = emaSlow[i];
    return isFinite(w) && isFinite(mid) && mid !== 0 ? w / Math.abs(mid) : NaN;
  });
  const i = m5.length - 1;
  const adxNow = adx14[i];
  const atrNow = atr14[i];
  const sep = (isFinite(emaFast[i]) && isFinite(emaSlow[i]) && isFinite(atrNow) && atrNow > 0)
    ? Math.abs(emaFast[i] - emaSlow[i]) / atrNow : 0;
  const slope = (i >= 10 && isFinite(atrNow) && atrNow > 0 && isFinite(emaFast[i]) && isFinite(emaFast[i - 10]))
    ? Math.abs(emaFast[i] - emaFast[i - 10]) / (atrNow * 10) : 0;
  const bbwNow = bbw[i];
  const vp = cfg?.vipPlus || {};
  const sAdx = clamp01(((adxNow ?? 0) - 15) / (35 - 15));
  const sSep = clamp01(sep / (vp.sepNorm ?? 1.2));
  const sSlope = clamp01(slope / (vp.slopeNorm ?? 0.6));
  const sBbw = clamp01(((bbwNow ?? 0) - (vp.bbwLow ?? 0.004)) / ((vp.bbwHi ?? 0.02) - (vp.bbwLow ?? 0.004)));
  const wAdx = vp.adxWeight ?? 0.4, wSep = vp.sepWeight ?? 0.3, wSlope = vp.slopeWeight ?? 0.2, wBbw = vp.bbwWeight ?? 0.1;
  const score = (wAdx * sAdx) + (wSep * sSep) + (wSlope * sSlope) + (wBbw * sBbw);
  return clamp01(score);
}
function decideMode(prevMode, score, up, down) {
  if (prevMode === "TREND" && score < down) return "RANGE";
  if (prevMode === "RANGE" && score > up) return "TREND";
  return prevMode;
}
function applyVipPlusFilter(base, closedM1, cfg) {
  // base: { signal, buffer1, buffer2, signalIndex }
  if (!base?.signal) return { ok: false, mode: "RANGE", score: 0, reason: "base=null", immediate: false };
  const vp = cfg?.vipPlus || {};
  const lastIdx = closedM1.length - 1;
  const cNow = closedM1[lastIdx]; // última cerrada (anti-repaint)
  // Régimen en M5 a partir de M1 cerradas
  const c5 = aggregateTo5m(closedM1);
  const score = (vp.enableRegimeAutoSwitch === false) ? 1 : computeRegimeScore(filterClosed(c5), cfg);
  const mode = (vp.enableRegimeAutoSwitch === false) ? (vp.fixedMode || "TREND") : decideMode(vp.prevMode || "TREND", score, vp.regimeUp ?? 0.6, vp.regimeDown ?? 0.5);
  if (vp.enableFractals === false) return { ok: true, mode, score, reason: "fractals=off", immediate: false };
  const lookahead = Number(vp.fractalLookaheadBars ?? 2);
  const { lastUp, lastDn } = getLastFractalsFlexible(closedM1, lookahead);
  // Confluencia misma vela: si la señal y el fractal aparecen en la misma vela cerrada
  // CALL con fractal bajista (dn) en la misma vela, PUT con fractal alcista (up) en la misma vela
  if (vp.sameBarConfluenceImmediate) {
    const sameBarCall = base.signal === "CALL" && lastDn && lastDn.idx === lastIdx;
    const sameBarPut  = base.signal === "PUT"  && lastUp && lastUp.idx === lastIdx;
    if (sameBarCall || sameBarPut) {
      return { ok: true, mode, score, reason: "sameBar fractal+signal", immediate: true };
    }
  }
  const emaSlowArr = emaSeries(closedM1.map(c => c.close), vp.emaSlow ?? 21);
  const emaSlowNow = emaSlowArr[lastIdx];
  const bb = { breakBuf: vp.breakBufferPct ?? 0.0002, touchPct: vp.touchDistancePct ?? 0.0003 };
  const maxBars = vp.maxBarsSinceFractal ?? 30;
  const barsSinceUp = lastUp ? (lastIdx - lastUp.idx) : Infinity;
  const barsSinceDn = lastDn ? (lastIdx - lastDn.idx) : Infinity;
  if (mode === "TREND") {
    if (base.signal === "CALL") {
      if (!lastUp || barsSinceUp > maxBars) return { ok: false, mode, score, reason: "noUpFractal/freshness" };
      const need = lastUp.price * (1 + bb.breakBuf);
      const ok = cNow.close >= need;
  return { ok, mode, score, reason: ok ? `CALL break ${need.toFixed(6)}` : `noBreak ${need.toFixed(6)}`, immediate: !!ok };
    } else {
      if (!lastDn || barsSinceDn > maxBars) return { ok: false, mode, score, reason: "noDnFractal/freshness" };
      const need = lastDn.price * (1 - bb.breakBuf);
      const ok = cNow.close <= need;
      return { ok, mode, score, reason: ok ? `PUT break ${need.toFixed(6)}` : `noBreak ${need.toFixed(6)}`, immediate: !!ok };
    }
  } else { // RANGE
    if (base.signal === "CALL") {
      if (!lastDn || barsSinceDn > maxBars) return { ok: false, mode, score, reason: "noDnFractal/freshness" };
      const touchOk = cNow.low <= lastDn.price * (1 + bb.touchPct);
      const emaOk = isFinite(emaSlowNow) ? cNow.close > emaSlowNow : true;
      const ok = touchOk && emaOk;
  return { ok, mode, score, reason: ok ? `CALL bounce dn@${lastDn.price.toFixed(6)}` : `noBounce/ema`, immediate: !!ok };
    } else {
      if (!lastUp || barsSinceUp > maxBars) return { ok: false, mode, score, reason: "noUpFractal/freshness" };
      const touchOk = cNow.high >= lastUp.price * (1 - bb.touchPct);
      const emaOk = isFinite(emaSlowNow) ? cNow.close < emaSlowNow : true;
      const ok = touchOk && emaOk;
      return { ok, mode, score, reason: ok ? `PUT bounce up@${lastUp.price.toFixed(6)}` : `noBounce/ema`, immediate: !!ok };
    }
  }
}

// ../src/replica_bot.ts
var fs = require("fs");
var path = require("path");
var { getSdkExports } = require_sdk_adapter();
var { ClientSdk, LoginPasswordAuthMethod, BinaryOptionsDirection } = getSdkExports();
var BOT_ID = process.env.BOT_ID || String(process.pid);
const SDK_TIMEOUT_FLOOR_MS = Math.max(0, Number(process?.env?.SDK_TIMEOUT_FLOOR_MS ?? 1200));
var DASH_URL = process.env.DASHBOARD_URL || process.env.DASH_URL || "http://localhost:3000";
var SSE_TOKEN = process.env.SSE_TOKEN || "";
function expiryForTf(tf, expirySecPerTimeframe) {
  const key = tf?.toLowerCase() === "m1" ? "1m" : tf?.toLowerCase() === "m5" ? "5m" : "1m";
  return expirySecPerTimeframe[key] ?? 60;
}
var openById = /* @__PURE__ */ new Map();
var WIN_COUNT = 0;
var LOSS_COUNT = 0;
var DRAW_COUNT = 0;
var START_BALANCE;
var LAST_BALANCE;
var CFG_REF = null;
var lossStreak = 0;
var cooldownUntilSec = 0;
var activesById = /* @__PURE__ */ new Map();
var activesByTicker = /* @__PURE__ */ new Map();
// Live quotes caches
var quoteMidsByActiveId = /* @__PURE__ */ new Map();
var quoteAsksByActiveId = /* @__PURE__ */ new Map();
var quoteBidsByActiveId = /* @__PURE__ */ new Map();
var quoteOpenByActiveId = /* @__PURE__ */ new Map();
var quoteSubscribingActiveIds = /* @__PURE__ */ new Set();
var quoteSubscribeLogged = /* @__PURE__ */ new Set();
var quoteFirstTickLogged = /* @__PURE__ */ new Set();
var quoteSubbedActiveIds = /* @__PURE__ */ new Set();
var serverDriftWarnTs = /* @__PURE__ */ new Map();
var serverDriftSince = /* @__PURE__ */ new Map();
var signalLagWarnTs = /* @__PURE__ */ new Map();
var payoutCache = /* @__PURE__ */ new Map();
var PAYOUT_TTL_MS = 6e4;
function cacheSetPayout(key, v) {
  payoutCache.set(key, { v, t: Date.now() });
}
function cacheGetPayout(key) {
  const e = payoutCache.get(key);
  if (!e) return void 0;
  if (Date.now() - e.t > PAYOUT_TTL_MS) {
    payoutCache.delete(key);
    return void 0;
  }
  return e.v;
}
async function report(type, payload) {
  if (!SSE_TOKEN) return;
  try {
    await fetch(`${DASH_URL}/api/executions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-sse-token": SSE_TOKEN },
      body: JSON.stringify({ botId: BOT_ID, type, ...payload })
    });
  } catch {
  }
}
var RESULT_ENGINE = process.env.RESULT_ENGINE ?? "legacy";
var EMIT_LEGACY_EXECUTION = process.env.EMIT_LEGACY_EXECUTION !== "false";
var QUIET_CLOSED_LOGS = false;
function normalizeCloseFields(p) {
  const amount = Number(p.amount ?? p.order_amount ?? p.invest ?? 0);
  const resultRaw = (p.result ?? p.close_result ?? "").toString().toUpperCase();
  let result = "UNKNOWN";
  if (["WIN", "LOSS", "DRAW", "EQUAL"].includes(resultRaw)) result = resultRaw === "EQUAL" ? "DRAW" : resultRaw;
  else if (typeof p.close_result === "number") {
    result = p.close_result > 0 ? "WIN" : p.close_result < 0 ? "LOSS" : "DRAW";
  } else if (typeof p.profit === "number") {
    result = p.profit > 0 ? "WIN" : p.profit < 0 ? "LOSS" : "DRAW";
  }
  let profit = typeof p.profit === "number" ? Number(p.profit) : void 0;
  if (profit == null && typeof p.close_profit === "number") profit = Number(p.close_profit);
  if (profit == null && typeof p.expectedPayoutPct === "number" && amount > 0 && result !== "UNKNOWN") {
    if (result === "WIN") profit = amount * p.expectedPayoutPct;
    else if (result === "LOSS") profit = -amount;
    else if (result === "DRAW") profit = 0;
  }
  return { result, profit };
}
function mapOpenToLegacy(p) {
  return { type: "open", id: p.id, ticker: p.ticker, tf: p.tf, side: p.side, amount: p.amount, expectedPayoutPct: p.expectedPayoutPct, openedAt: p.openedAt };
}
function mapClosedToLegacy(p) {
  const n = normalizeCloseFields(p);
  return { type: "closed", id: p.id, result: n.result, profit: n.profit, ticker: p.ticker, tf: p.tf, closedAt: p.closedAt };
}
async function reportOpen(payload) {
  if (RESULT_ENGINE !== "legacy") await report("open", payload);
  if (RESULT_ENGINE !== "new" && EMIT_LEGACY_EXECUTION) await report("execution", mapOpenToLegacy(payload));
}
async function reportClosed(payload) {
  const n = normalizeCloseFields(payload);
  const enriched = { ...payload, ...n };
  if (RESULT_ENGINE !== "legacy") await report("closed", enriched);
  if (RESULT_ENGINE !== "new" && EMIT_LEGACY_EXECUTION) await report("execution", mapClosedToLegacy(enriched));
}
async function reportSignal(ev) {
  await report("signal", ev);
}
function inferResult(profit) {
  if (typeof profit !== "number") return void 0;
  if (profit > 1e-9) return "WIN";
  if (profit < -1e-9) return "LOSS";
  return "DRAW";
}
function computeProfit(result, amount, expectedPayoutPct) {
  if (typeof amount !== "number" || !result) return void 0;
  if (result === "WIN") return amount * (expectedPayoutPct ?? 0);
  if (result === "LOSS") return -amount;
  return 0;
}
async function emitClosed(raw) {
  const id = raw.id ? String(raw.id) : void 0;
  const open = id ? openById.get(id) : void 0;
  const merged = {
    ticker: raw.ticker || open?.ticker || "\u2014",
    timeframe: raw.timeframe || open?.timeframe,
    side: raw.side || open?.side,
    amount: raw.amount || open?.amount,
    expectedPayoutPct: raw.expectedPayoutPct ?? open?.expectedPayoutPct ?? void 0,
    openTime: open?.openTime,
    signal: open?.signal
  };
    try {
      if (!QUIET_CLOSED_LOGS) console.log(`[CLOSED] recv id=${id ?? '<no-id>'} rawResult=${String(raw.result ?? '<none>')} rawProfit=${String(raw.profit ?? '<none>')} openExists=${open ? 'yes' : 'no'} openExec=${open && open.executionNumber ? open.executionNumber : '<na>'}`);
    } catch (e) {}
    let result = raw.result;
    let profit = raw.profit;
    if (result == null && profit != null) result = inferResult(profit);
    if (profit == null) profit = computeProfit(result, merged.amount, merged.expectedPayoutPct || void 0);
  const closeTime = raw.closeTime || Date.now();
  await reportClosed({ id, status: "CLOSED", ticker: merged.ticker, tf: merged.timeframe, side: merged.side, amount: merged.amount, expectedPayoutPct: merged.expectedPayoutPct, result, profit, closedAt: closeTime });
  if (id) openById.delete(id);
  // Si había una marca de retry para esta combinación, limpiarla al cerrar
  try {
    const k = merged.ticker && merged.timeframe ? keyFor(merged.ticker, merged.timeframe.toLowerCase() === "m1" ? "1m" : "5m") : null;
    if (k) scheduledRetryKeys.delete(k);
  } catch {}
  if (result === "WIN") WIN_COUNT++;
  else if (result === "LOSS") LOSS_COUNT++;
  else if (result === "DRAW") DRAW_COUNT++;
    try {
      const nowSec = Math.floor(Date.now() / 1e3);
      if (result === "LOSS") {
        // Feature disabled: no activar cooldown tras rachas de pérdidas.
        // Se mantiene el contador de racha por trazabilidad, pero no se usa para bloquear.
        lossStreak += 1;
      } else if (result === "WIN" || result === "DRAW") {
        lossStreak = 0;
      }
    } catch {}
  try {
    if (!QUIET_CLOSED_LOGS) console.log(`[CLOSED] processed id=${id ?? '<no-id>'} mergedResult=${result} profit=${profit}`);
  } catch (e) {}
  try {
    // Pasar executionNumber del open capturado para evitar encadenar retries
    scheduleRetryIfLoss({ id, result, profit, timeframe: merged.timeframe, ticker: merged.ticker, side: merged.side, executionNumber: open?.executionNumber });
  } catch (e) {}
  try {
    if (!QUIET_CLOSED_LOGS) console.log(`[CLOSED] scheduleRetryIfLoss invoked for id=${id ?? '<no-id>'}`);
  } catch (e) {}
  try {
    if (typeof profit === "number" && START_BALANCE != null) {
      if (LAST_BALANCE == null) LAST_BALANCE = START_BALANCE;
      LAST_BALANCE = Number((LAST_BALANCE + profit).toFixed(6));
    }
  } catch {
  }
  const total = WIN_COUNT + LOSS_COUNT + DRAW_COUNT;
  const pnl = LAST_BALANCE != null && START_BALANCE != null ? LAST_BALANCE - START_BALANCE : void 0;
  try {
    await report("metric", { counts: { wins: WIN_COUNT, losses: LOSS_COUNT, draws: DRAW_COUNT, total }, balance: { start: START_BALANCE, current: LAST_BALANCE, pnl } });
  } catch {
  }
}

// After an execution is closed, if it was the first execution and it LOST,
// schedule a single retry on the next candle with the same direction.
function scheduleRetryIfLoss(raw) {
  try {
    // User request: disable automatic retries when an operation is lost.
    // Return immediately to prevent any retry scheduling logic from running.
    return;
    const id = raw.id ? String(raw.id) : null;
    const open = id ? openById.get(id) : void 0;
  // Solo permitir retry si fue la PRIMERA ejecución
  const execNum = Number(open?.executionNumber ?? raw.executionNumber ?? 1);
    const tf = (raw.timeframe || open?.timeframe || "M1");
    const ticker = raw.ticker || open?.ticker;
    const side = raw.side || open?.side;
    if (!ticker || !tf || !side) return;
    // only retry if this was the first execution and it was a LOSS
    const normalizedExec = Number(execNum || 1);
    const normalizedTf = tf.toLowerCase() === "m1" ? "1m" : tf.toLowerCase() === "m5" ? "5m" : "1m";
    if (normalizedExec !== 1) {
      // No programar retries para ejecuciones >= 2
      return;
    }
    const n = (raw.result || open?.result || (raw.profit != null ? inferResult(raw.profit) : void 0)) || void 0;
    if (n !== "LOSS") return;
    const k = keyFor(ticker, normalizedTf);
    // evitar duplicar si ya hay un retry inmediato marcado
    if (scheduledRetryKeys.has(k)) return;
    // Programar el retry para la APERTURA de la siguiente vela
    const tfSeconds = normalizedTf === "1m" ? 60 : 300;
    const nextOpen = Math.floor(Date.now() / 1000 / tfSeconds) * tfSeconds; // apertura de la vela actual (que sigue a la pérdida)
    const slot = { tf: normalizedTf, baseTo: nextOpen, signal: side, seq: ++seqGlobal, executionsPlanned: 1, executionsDone: 0, execNumberOverride: 2, executeImmediately: true };
  const prev = pendingByKey.get(k);
  if (prev && !prev.executeImmediately) {
    // Reemplazar cualquier slot normal por el retry inmediato
    pendingByKey.set(k, slot);
    scheduledRetryKeys.add(k);
    console.log(`[RETRY] replaced pending slot with immediate retry for ${ticker} ${normalizedTf} baseTo=${nextBaseTo} side=${side}`);
  } else if (!prev) {
    pendingByKey.set(k, slot);
    scheduledRetryKeys.add(k);
  console.log(`[RETRY] scheduled retry for ${ticker} ${normalizedTf} at baseTo=${nextOpen} side=${side} immediate=true`);
  } else {
    // Ya hay un retry inmediato para esta clave
    return;
  }
    try {
      reportSignal({ type: "signal", ticker, timeframe: normalizedTf === "1m" ? "M1" : "M5", side, baseToSec: nextBaseTo, event: "RETRY_SCHEDULED", ts: Date.now() });
    } catch {
    }
  } catch (e) {
  }
}
async function wireCloseUpdates(sdk) {
  try {
    const positions = await sdk.positions();
    const handler = (p) => {
      if (!(p && p.status)) return;
      if (String(p.status).toUpperCase() !== "CLOSED") return;
      let ticker = p.ticker || p.asset;
      if (!ticker && p.activeId != null) {
        ticker = activesById.get(Number(p.activeId)) || `ACTIVE#${p.activeId}`;
      }
      const id = String(p.externalId || p.internalId || p.id || "");
      const o = id ? openById.get(id) : void 0;
      if (o?.closeTimer) {
        clearTimeout(o.closeTimer);
        o.closeTimer = void 0;
      }
      let profit;
      if (typeof p.pnlRealized === "number") profit = p.pnlRealized;
      else if (typeof p.pnlNet === "number") profit = p.pnlNet;
      else {
        let raw = p.closeProfit;
        const invest = typeof p.invest === "number" ? p.invest : void 0;
        if (typeof raw === "number" && typeof invest === "number") {
          if (raw === 0) {
            profit = -invest;
          } else if (raw > invest + 1e-6) {
            profit = raw - invest;
          } else if (raw > 0 && raw < invest) {
            profit = raw - invest;
          } else if (raw === invest) {
            profit = 0;
          } else {
            profit = raw;
          }
        } else if (typeof raw === "number") {
          profit = raw;
        }
        if (profit == null && typeof p.pnl === "number") profit = p.pnl;
      }
  emitClosedWithRisk({ id, ticker, amount: p.invest, profit, closeTime: p.closeTime ? p.closeTime.getTime() : void 0 });
    };
    if (typeof positions.subscribeOnUpdatePosition === "function") {
      positions.subscribeOnUpdatePosition(handler);
    } else if (typeof positions.onUpdate === "function") {
      positions.onUpdate(handler);
    } else if (typeof positions.on === "function") {
      positions.on("update", handler);
    }
  } catch (e) {
  }
}
async function fetchPositionDetail(sdk, id) {
  const tries = [
    async () => await sdk.positions?.().then((p) => typeof p?.getPosition === "function" ? p.getPosition(id) : null),
    async () => await sdk.positions?.().then((p) => typeof p?.get === "function" ? p.get(id) : null),
    async () => await sdk.position?.(id),
    async () => await sdk.getPosition?.(id),
    async () => {
      try {
        const p = await sdk.positions?.();
        if (p && typeof p.list === "function") {
          const list = await p.list();
          if (Array.isArray(list)) return list.find((x) => String(x.id || x.externalId || x.internalId) === id);
        }
      } catch {
      }
      return null;
    }
  ];
  for (const t of tries) {
    try {
      const r = await t();
      if (r) return r;
    } catch {
    }
  }
  return null;
}
async function pollForClosed(sdk) {
  const now = Date.now();
  for (const [id, ord] of Array.from(openById.entries())) {
    if (!ord.expectedCloseTs) continue;
    if (now < ord.expectedCloseTs + 1500) continue;
    let detail = await fetchPositionDetail(sdk, id).catch(() => null);
    if (!detail) {
      try { console.log(`[POLL] no detail for id=${id} ticker=${ord.ticker} expectedCloseTs=${ord.expectedCloseTs}`); } catch (e) {}
      // If detail not available yet, check if too late and emit fallback below later
    }
    if (!detail) continue;
    if (!detail) continue;
    const status = String(detail.status || detail.state || "").toUpperCase();
    if (status !== "CLOSED") continue;
    const invest = Number(detail.invest ?? detail.amount ?? detail.buyAmount ?? ord.amount);
    let rawProfit = detail.closeProfit ?? detail.pnlRealized ?? detail.pnl ?? detail.profit;
    if (typeof rawProfit === "number" && typeof invest === "number" && rawProfit > invest + 1e-6) {
      rawProfit = rawProfit - invest;
    }
    if (typeof rawProfit !== "number") {
      if (now > (ord.expectedCloseTs || 0) + 1e4 && typeof invest === "number") {
        try { console.log(`[POLL] fallback emitClosed for id=${id} ticker=${ord.ticker} after timeout expectedCloseTs=${ord.expectedCloseTs}`); } catch (e) {}
        await emitClosed({ id, ticker: ord.ticker, timeframe: ord.timeframe, side: ord.side, amount: invest, profit: -invest });
      }
      continue;
    }
    await emitClosed({ id, ticker: ord.ticker, timeframe: ord.timeframe, side: ord.side, amount: invest, profit: rawProfit });
  }
}
async function buildActivesMap(client, useOtc) {
  const tries = [
    async () => await client.market?.actives?.(),
    async () => await client.assets?.list?.(),
    async () => await client.getActives?.()
  ];
  const attemptLoad = async () => {
    for (const t of tries) {
      try {
        const list = await t();
        if (Array.isArray(list) && list.length) {
          for (const a of list) {
            const id = Number(a?.id ?? a?.active_id ?? a?.activeId);
            let tk = String(a?.ticker ?? a?.symbol ?? a?.asset ?? a?.name ?? "").toUpperCase();
            if (!useOtc && (/-OTC$/i.test(tk))) continue;
            if (id && tk) {
              activesById.set(id, tk);
              activesByTicker.set(tk, id);
            }
          }
          if (activesById.size) {
            return true;
          }
        }
      } catch {
      }
    }
    try {
    const turbo = await client.turboOptions?.();
      const acts = turbo?.getActives?.();
      if (Array.isArray(acts)) {
        for (const a of acts) {
          const id = Number(a?.id ?? a?.active_id ?? a?.activeId);
          let tk = String(a?.ticker ?? a?.symbol ?? "").toUpperCase();
      if (!useOtc && (/-OTC$/i.test(tk))) continue;
          if (id && tk) {
            activesById.set(id, tk);
            activesByTicker.set(tk, id);
          }
        }
      }
    } catch {
    }
    try {
    const bin = await client.binaryOptions?.();
      const acts = bin?.getActives?.();
      if (Array.isArray(acts)) {
        for (const a of acts) {
          const id = Number(a?.id ?? a?.active_id ?? a?.activeId);
          let tk = String(a?.ticker ?? a?.symbol ?? "").toUpperCase();
      if (!useOtc && (/-OTC$/i.test(tk))) continue;
          if (id && tk) {
            activesById.set(id, tk);
            activesByTicker.set(tk, id);
          }
        }
      }
    } catch {
    }
    try {
    const dig = await client.digitalOptions?.();
      const unders = dig?.getUnderlyingsAvailableForTradingAt?.(/* @__PURE__ */ new Date()) || [];
      if (Array.isArray(unders)) {
        for (const u of unders) {
          const id = Number(u?.activeId ?? u?.active_id);
          let tk = String(u?.ticker ?? u?.symbol ?? u?.underlying ?? "").toUpperCase();
      if (!useOtc && (/-OTC$/i.test(tk))) continue;
          if (id && tk) {
            activesById.set(id, tk);
            activesByTicker.set(tk, id);
          }
        }
      }
    } catch {
    }
    return activesById.size > 0;
  };
  for (let i = 0; i < 3 && !activesById.size; i++) {
    const ok = await attemptLoad();
    if (ok) {
      console.log("[bot] actives loaded:", activesById.size, "(attempt", i + 1, ")");
      return;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  if (!activesById.size) {
    console.log("[bot] actives a\xFAn no disponibles (se aprender\xE1n din\xE1micamente)");
  }
}
async function getExpectedPayoutPct(client, ticker, timeframe, side) {
  const key = `${String(ticker).toUpperCase()}|${String(timeframe || "")}`;
  const cached = cacheGetPayout(key);
  if (cached != null) return cached;
  const tries = [
    async () => await client.binary?.payout?.get?.({ ticker, timeframe, side }),
    async () => await client.market?.getPayout?.(ticker, timeframe),
    async () => await client.instruments?.payout?.(ticker, timeframe),
    async () => await client.digital?.payout?.get?.({ ticker, timeframe })
  ];
  for (const t of tries) {
    try {
      const r = await t();
      const pct = typeof r === "number" ? r : typeof r?.pct === "number" ? r.pct : typeof r?.payout === "number" ? r.payout : void 0;
      if (typeof pct === "number" && isFinite(pct) && pct > 0) {
        cacheSetPayout(key, pct);
        return pct;
      }
    } catch {
    }
  }
  return void 0;
}
var lastOperatedCandleTo = {};
var pendingByKey = /* @__PURE__ */ new Map();
var scheduledRetryKeys = /* @__PURE__ */ new Set();
var seqGlobal = 0;
var executedBaseKey = /* @__PURE__ */ new Set();
var lastSignalDebug = /* @__PURE__ */ new Map();
var lastCandleViewLogged = /* @__PURE__ */ new Map();
var lastTwoCompactLogged = /* @__PURE__ */ new Map();
// Bloqueos por baseTo cuando se detecta una señal opuesta consecutiva
var blockedBaseKey = /* @__PURE__ */ new Set();

// Safe deletion of pending slot: cancel associated watcher handle if present
function safeDeletePending(k) {
  try {
    const pend = pendingByKey.get(k);
    if (global && global.__replica_debug) {
      try { console.log(`[WATCHER] safeDeletePending key=${k} pendExists=${!!pend}`); } catch (e) {}
    }
    if (pend && pend.waitRetrace50) {
      const w = pend.waitRetrace50;
      try {
        const h = w._watcherHandle || pend._watcher;
        if (global && global.__replica_debug) {
          try { console.log(`[WATCHER] key=${k} watcherHandleExists=${!!h}`); } catch (e) {}
        }
        if (h && typeof h.cancel === 'function') {
          try { if (global && global.__replica_debug) try { console.log(`[WATCHER] cancelling handle for ${k}`); } catch(e){} } catch(e){}
          try { h.cancel(); } catch (e) { if (global && global.__replica_debug) try { console.log(`[WATCHER] cancel error for ${k}:`, e?.message || e); } catch(e){} }
          try { if (global && global.__replica_debug) try { console.log(`[WATCHER] cancelled handle for ${k}`); } catch(e){} } catch(e){}
        }
      } catch (e) {}
      try { delete w._watcherHandle; } catch (e) {}
      try { delete pend._watcher; } catch (e) {}
    }
  } catch (e) {}
  try { pendingByKey.delete(k); } catch (e) {}
}

// Subscribe to live quotes for an active and cache mid price.
// Safe to call multiple times; subscribes once per activeId.
async function ensureQuoteSubscription(sdk, activeId) {
  try {
    const id = Number(activeId);
    if (!isFinite(id)) return false;
    if (quoteSubscribingActiveIds.has(id)) return true;
    if (quoteSubbedActiveIds.has(id)) return true;
    if (!sdk?.quotes) return false;
    quoteSubscribingActiveIds.add(id);
    try {
      if (!quoteSubscribeLogged.has(id)) {
        quoteSubscribeLogged.add(id);
        console.log(`[QUOTE] subscribing activeId=${id}`);
      }
    } catch {}
    const quotes = await sdk.quotes();
    if (!quotes?.getCurrentQuoteForActive) return false;
    const current = await quotes.getCurrentQuoteForActive(id);
    if (!current?.subscribeOnUpdate && !current?.on) return false;
    const handler = (q) => {
      try {
        const v = typeof q?.value === 'number' && isFinite(q.value) ? Number(q.value) : undefined;
        const a = typeof q?.ask === 'number' && isFinite(q.ask) ? Number(q.ask) : undefined;
        const b = typeof q?.bid === 'number' && isFinite(q.bid) ? Number(q.bid) : undefined;
        const nowMs = Date.now();
        if (v != null) {
          quoteMidsByActiveId.set(id, v);
          quoteOpenByActiveId.set(id, { tsMs: nowMs, mid: v, ask: a, bid: b });
        }
        if (a != null) quoteAsksByActiveId.set(id, a);
        if (b != null) quoteBidsByActiveId.set(id, b);
        try {
          if (!quoteFirstTickLogged.has(id) && v != null) {
            quoteFirstTickLogged.add(id);
            console.log(`[QUOTE] first tick activeId=${id} mid=${v}`);
          }
        } catch {}
      } catch {}
    };
    if (typeof current.subscribeOnUpdate === 'function') current.subscribeOnUpdate(handler);
    else if (typeof current.on === 'function') current.on('update', handler);
    quoteSubbedActiveIds.add(id);
    return true;
  } catch {
    return false;
  } finally {
    try { quoteSubscribingActiveIds.delete(Number(activeId)); } catch {}
  }
}
function logExecution(cfg, data) {
  if (!cfg.logExecutions) return;
  const payload = { ts: (/* @__PURE__ */ new Date()).toISOString(), ...data };
  const line = JSON.stringify(payload);
  if (!cfg.quietConsole) console.log("[EXEC]", line);
  if (cfg.executionLogFile) {
    try {
      fs.appendFileSync(cfg.executionLogFile, line + "\n");
    } catch (e) {
      if (cfg.debugSignals) console.log("[LOG EXEC] fallo escribir archivo", e?.message);
    }
  }
}
function cfgPath() {
  return path.resolve(process.cwd(), "configs", "bot.config.json");
}
function loadConfig() {
  const tmp = process.env.BOT_CONFIG_PATH && fs.existsSync(process.env.BOT_CONFIG_PATH) ? process.env.BOT_CONFIG_PATH : cfgPath();
  return JSON.parse(fs.readFileSync(tmp, "utf-8"));
}
var keyFor = (ticker, tf) => `${ticker}:${tf}`;
var tfSec = (tf) => tf === "1m" ? 60 : 300;
var filterClosed = (arr) => arr.filter((c) => !c.current);

// Programa un slot retrace50 unificado para 1m
function scheduleRetraceSlot1m({ ticker, tf, candles, ds, cfg, fromLive }) {
  try {
    if (tf !== "1m") return false;
    if (!cfg?.retrace50?.enabled) return false;

    // VIP+ opcional: si se exige ok, validar
    if (cfg?.retrace50?.requireVipPlusOk) {
      const vipEnabled = cfg?.vipPlus?.enableFractals || cfg?.vipPlus?.enableRegimeAutoSwitch;
      if (vipEnabled) {
        const vf = applyVipPlusFilter(ds, candles, cfg);
        if (!vf.ok) return false;
      }
    }

    const lookback = Math.max(0, Number(cfg.retrace50.lookback ?? 1));
    const iRef = Math.max(0, (candles.length - 1) - lookback);
    let ref = candles[iRef];
    if (!(ref && isFinite(ref.high) && isFinite(ref.low))) ref = candles[candles.length - 1];
    if (!(ref && isFinite(ref.high) && isFinite(ref.low))) return false;

    const useBody = !!cfg?.retrace50?.useBodyMid;
    const bodyHi = Math.max(Number(ref.open), Number(ref.close));
    const bodyLo = Math.min(Number(ref.open), Number(ref.close));
    const midBody = (bodyHi + bodyLo) / 2;
    const midRange = (Number(ref.high) + Number(ref.low)) / 2;
    const tMode = String(cfg?.retrace50?.targetMode || (useBody ? 'body' : 'range'));
    const pct = Math.min(0.9999, Math.max(0.0001, Number(cfg?.retrace50?.targetPct ?? 0.5)));
    const deltaMode = String(cfg?.retrace50?.deltaMode || 'pct');
    const absDelta = resolveAbsDelta(cfg, ticker);
    const sideUp = String(ds.signal).toUpperCase() === 'CALL';
    let midPrev;
    if (tMode === 'closeOnly') {
      midPrev = Number(ref.close);
      if (deltaMode === 'abs' && isFinite(absDelta) && absDelta > 0) {
        midPrev = sideUp ? (midPrev - absDelta) : (midPrev + absDelta);
      }
    } else if (tMode === 'body') {
      midPrev = midBody;
    } else if (tMode === 'closeExtreme50') {
      midPrev = sideUp ? (Number(ref.close) + Number(ref.low)) / 2 : (Number(ref.close) + Number(ref.high)) / 2;
    } else {
      midPrev = midRange;
    }

    const tol = getTolerancePct(cfg, ticker);
    const winSec = Math.max(1, Number(cfg.retrace50.windowSec ?? 23));
    const tfSeconds = 60;
    const baseTo = candles[ds.signalIndex]?.to ?? candles[candles.length - 1]?.to;
    // Operar en la vela siguiente a la señal: por defecto entryOffset=2 (esperar una vela y entrar en la que sigue)
    const entryOffset = Math.max(1, Number(cfg?.retrace50?.entryOffsetCandles ?? 2));
    const nextOpenSec = baseTo + tfSeconds * (entryOffset - 1);
    const k2 = keyFor(ticker, tf);
    pendingByKey.set(k2, {
      tf,
      baseTo,
      signal: ds.signal,
      seq: ++seqGlobal,
      executionsPlanned: 1,
      executionsDone: 0,
      waitRetrace50: {
        midPrev,
        tol,
        windowSec: winSec,
        lookback,
        nextOpenSec,
        refHigh: Number(ref.high),
        refLow: Number(ref.low),
        baseClose: Number(ref.close)
      },
      fromLive: !!fromLive,
      needsConfirm: !!fromLive
    });
    return true;
  } catch {
    return false;
  }
}
function resolveAbsDelta(cfg, ticker) {
  try {
    if (cfg?.retrace50?.useAdaptiveTargets && global.__adaptiveTargets) {
      const k = String(ticker);
      const at = global.__adaptiveTargets[k];
      if (at && typeof at.targetAbs === 'number') return at.targetAbs;
    }
  } catch {}
  try {
    const base = String(ticker || '').toUpperCase().replace(/-OTC$/i, '');
    const isOtc = /-OTC$/i.test(String(ticker || ''));
    const otcMap = cfg?.retrace50?.targetAbsByTickerOtc;
    const spotMap = cfg?.retrace50?.targetAbsByTickerSpot || cfg?.retrace50?.targetAbsByTickerNormal;
    const legacyMap = cfg?.retrace50?.targetAbsByTicker;

    // 1) Preferir mapa específico según mercado
    if (isOtc) {
      if (otcMap && typeof otcMap === 'object') {
        const v = otcMap[base];
        if (typeof v === 'number' && isFinite(v) && v > 0) return v;
      }
    } else {
      if (spotMap && typeof spotMap === 'object') {
        const v = spotMap[base];
        if (typeof v === 'number' && isFinite(v) && v > 0) return v;
      }
      // 2) Fallback: si Spot no tiene valor usable para este par, usar OTC
      if (otcMap && typeof otcMap === 'object') {
        const v3 = otcMap[base];
        if (typeof v3 === 'number' && isFinite(v3) && v3 > 0) return v3;
      }
    }
    // 3) Fallback al mapa legado (único)
    if (legacyMap && typeof legacyMap === 'object') {
      const v2 = legacyMap[base];
      if (typeof v2 === 'number' && isFinite(v2) && v2 > 0) return v2;
    }
  } catch {}
  // 3) Fallback al valor absoluto global
  try {
    const base = String(ticker || '').toUpperCase().replace(/-OTC$/i, '');
    const fallback = Number(cfg?.retrace50?.targetAbs || 0);
    const mult = Number(cfg?.retrace50?.nonEurJpyMultiplier ?? cfg?.retrace50?.aggressiveNonEurJpyMultiplier ?? 1.5);
    if (base && base !== 'EURJPY' && isFinite(mult) && mult > 0) {
      const out = fallback * mult;
      if (cfg.debugSignals) console.log(`[${ticker}] resolveAbsDelta: non-EURJPY multiplier applied x${mult} -> ${out}`);
      return out;
    }
    return fallback;
  } catch (e) {
    return Number(cfg?.retrace50?.targetAbs);
  }
}

function getTolerancePct(cfg, ticker) {
  // Relajar tolerancia por defecto para generar más operaciones
  const defTol = Number(cfg?.retrace50?.tolerancePct ?? 0.00015);
  try {
    if (cfg?.retrace50?.useAdaptiveTargets && global.__adaptiveTargets) {
      const at = global.__adaptiveTargets[String(ticker)];
      if (at && typeof at.tolerancePct === 'number') return at.tolerancePct;
    }
    const isOtc = /-OTC$/i.test(String(ticker || ''));
    const tolSpot = cfg?.retrace50?.tolerancePctSpot;
    const tolOtc = cfg?.retrace50?.tolerancePctOtc;
    if (isOtc) {
      if (typeof tolOtc === 'number' && isFinite(tolOtc) && tolOtc >= 0) return tolOtc;
      return defTol;
    }
    if (typeof tolSpot === 'number' && isFinite(tolSpot) && tolSpot >= 0) return tolSpot;
    // Fallback: si no hay tolerancia Spot, permitir usar OTC como base si existe
    if (typeof tolOtc === 'number' && isFinite(tolOtc) && tolOtc >= 0) return tolOtc;
  } catch {}
  try {
    const base = String(ticker || '').toUpperCase().replace(/-OTC$/i, '');
    const mult = Number(cfg?.retrace50?.nonEurJpyMultiplier ?? cfg?.retrace50?.aggressiveNonEurJpyMultiplier ?? 1.5);
    if (base && base !== 'EURJPY' && isFinite(mult) && mult > 0) {
      const out = defTol * mult;
      if (cfg.debugSignals) console.log(`[${ticker}] getTolerancePct: non-EURJPY tolerance multiplier applied x${mult} -> ${out}`);
      return out;
    }
    return defTol;
  } catch (e) {
    return defTol;
  }
}

function recordSignalSlot(ticker, tf, closed, ds, cfg) {
  // Flujo simplificado: sólo 1m, señal en vela cerrada → programa retrace50 para la vela siguiente
  if (tf !== "1m") return;
  if (!ds?.signal) return;
  const lastIdx = closed.length - 1;
  const idxNum = Number(ds.signalIndex);
  const misaligned = ds.signalIndex == null || idxNum !== lastIdx;
  if (misaligned) {
    const diff = ds.signalIndex == null ? null : (lastIdx - idxNum);
    const driftKey = `${ticker}:${tf}`;
    const hasDrift = serverDriftSince.has(driftKey);
    if (diff === 1 || diff === 2 || (diff === 2 && hasDrift)) {
      ds = { ...ds, signalIndex: lastIdx };
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} ajusta señal lag diff=${diff}${hasDrift ? ' (drift server)' : ''}`);
    } else {
      try {
        const kLag = `${ticker}:${tf}`;
        const nowLag = Date.now();
        const lastWarn = signalLagWarnTs.get(kLag) || 0;
        if ((nowLag - lastWarn) > 60000) {
          signalLagWarnTs.set(kLag, nowLag);
          console.log(`[WARN] ${ticker} ${tf} signal lag diff=${diff} lastIdx=${lastIdx} signalIdx=${ds.signalIndex}`);
        }
      } catch {}
      return;
    }
  }
  const baseCandle = closed[ds.signalIndex];
  if (!baseCandle || baseCandle.to !== closed[lastIdx].to) return;
  const k = keyFor(ticker, tf);
  if (lastOperatedCandleTo[k] === baseCandle.to) return;

  // Filtro VIP opcional (fractals/regime). Si se exige requireVipPlusOk y no pasa, aborta.
  try {
    if (cfg?.vipPlus?.enableFractals || cfg?.vipPlus?.enableRegimeAutoSwitch) {
      const vf = applyVipPlusFilter(ds, closed, cfg);
      if (!vf.ok && cfg?.retrace50?.requireVipPlusOk) return;
    }
  } catch {}

  // Targets adaptativos: calcular targetAbs/tolerance dinámicos a partir de rangos recientes
  try {
    if (cfg?.retrace50?.useAdaptiveTargets && tf === '1m') {
      if (!global.__adaptiveTargets) global.__adaptiveTargets = {};
      if (!global.__adaptiveRanges) global.__adaptiveRanges = {};
      const kAd = String(ticker);
      const aCfg = cfg.retrace50.adaptive || {};
      const win = Number(aCfg.window || 60);
      const minWin = Number(aCfg.minWindow || 20);
      const percRange = Number(aCfg.percentileRange || 0.65);
      const alpha = Number(aCfg.alpha || 0.25);
      const coeff = Number(aCfg.targetCoeff || 0.5);
      const minAbs = Number(aCfg.minTargetAbs || 0.00005);
      const maxAbs = Number(aCfg.maxTargetAbs || 0.00035);
      const tolFactor = Number(aCfg.tolFactor || 0.35);
      const tolMin = Number(aCfg.tolMin || 0.00005);
      const tolMax = Number(aCfg.tolMax || 0.00012);
      const microWin = Number(aCfg.microWindow || 10);
      const microPerc = Number(aCfg.microPercentile || 0.4);
      const shockFactor = Number(aCfg.shockFactor || 2.5);
      const freezeMs = Number(aCfg.freezeMs || 60000);

      const arr = global.__adaptiveRanges[kAd] || (global.__adaptiveRanges[kAd] = []);
      const last = closed[closed.length - 1];
      if (last && !last.current && isFinite(last.high) && isFinite(last.low)) {
        const range = Math.max(0, Number(last.high) - Number(last.low));
        if (range > 0) arr.push(range);
        if (arr.length > win * 2) arr.splice(0, arr.length - win * 2);
      }
      if (arr.length >= minWin) {
        const sorted = [...arr].sort((a, b) => a - b);
        const pick = sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * percRange)))] ?? sorted[sorted.length - 1];
        const baseRange = pick || sorted[sorted.length - 1];
        const prev = global.__adaptiveTargets[kAd];
        const latestRange = arr[arr.length - 1];
        const recent = arr.slice(-microWin).sort((a, b) => a - b);
        const microPick = recent[Math.min(recent.length - 1, Math.max(0, Math.round((recent.length - 1) * microPerc)))] ?? recent[recent.length - 1];
        const lastClose = closed?.[closed.length - 1]?.close || 1;
        const microPct = (lastClose > 0 && isFinite(microPick)) ? (microPick / lastClose) : 0;
        const tolDyn = Math.min(tolMax, Math.max(tolMin, microPct * tolFactor));
        let targetAbsDyn = Math.min(maxAbs, Math.max(minAbs, baseRange * coeff));
        const frozen = prev && prev.frozenUntil && prev.frozenUntil > Date.now();
        if (!frozen && latestRange > baseRange * shockFactor) {
          targetAbsDyn = prev?.targetAbs || targetAbsDyn;
          const until = Date.now() + freezeMs;
          global.__adaptiveTargets[kAd] = { ...(prev || {}), targetAbs: targetAbsDyn, tolerancePct: tolDyn, frozenUntil: until, updatedAt: Date.now() };
        } else {
          const newTarget = prev ? (prev.targetAbs + alpha * (targetAbsDyn - prev.targetAbs)) : targetAbsDyn;
          const newTol = prev ? (prev.tolerancePct + alpha * (tolDyn - prev.tolerancePct)) : tolDyn;
          global.__adaptiveTargets[kAd] = { targetAbs: newTarget, tolerancePct: newTol, updatedAt: Date.now(), frozenUntil: prev?.frozenUntil || 0 };
        }
      }
    }
  } catch {}

  // Programar retrace50 para la vela siguiente
  try {
    const scheduled = scheduleRetraceSlot1m({ ticker, tf, candles: closed, ds, cfg, fromLive: false });
    if (scheduled && cfg.logSignals) {
      console.log(`[${ticker}] ${tf} SEÑAL (retrace) base=${new Date(baseCandle.to * 1e3).toISOString()} side=${ds.signal}`);
    }
    return;
  } catch {}
}

// Flujo LIVE desactivado: sólo se opera señal de vela cerrada
function recordLiveSignalImmediate(_ticker, _tf, _candles, _dsLive, _cfg) {
  return;
}

function recordLiveSignalImmediate(ticker, tf, candles, dsLive, cfg) {
  if (tf !== "1m") return;
  if (cfg?.disableLiveSignals) {
    if (cfg.debugSignals) console.log(`[${ticker}] ${tf} LIVE ignorada por configuración (disableLiveSignals=true)`);
    return;
  }
  if (!dsLive?.signal) return;
  const last = candles[candles.length - 1];
  if (!last?.current) return; // sólo si la última es vela en curso
  const liveIdx = dsLive.signalIndex;
  if (liveIdx == null || liveIdx !== candles.length - 1) return; // debe ser en la vela actual
  const baseTo = last.to; // cierre esperado de la vela actual
  const k = keyFor(ticker, tf);
  const baseKey = `${ticker}:${tf}:${baseTo}`;

  // Si retrace50 está habilitado, priorizar programar el slot especial para 1m
  try {
    const scheduled = scheduleRetraceSlot1m({ ticker, tf, candles, ds: dsLive, cfg, fromLive: true });
    if (scheduled) return;
  } catch (e) {
    if (cfg.debugSignals) console.log(`[${ticker}] ${tf} LIVE retrace50 scheduling error:`, e?.message || e);
  }

  // Política de opuestas para LIVE
  const policyRaw = (cfg.oppositeConsecutivePolicy || (cfg.cancelOnOppositeConsecutive ? "cancel" : "flip"));
  const policy = String(policyRaw).toLowerCase();
  if (policy === "cancel" && blockedBaseKey.has(baseKey)) {
    if (cfg.debugSignals) console.log(`[${ticker}] ${tf} LIVE ignorada por bloqueo (opuesta previa) baseTo=${baseTo}`);
    return;
  }
  if (scheduledRetryKeys.has(k)) {
    if (cfg.debugSignals) console.log(`[${ticker}] ${tf} LIVE ignorada por retry pendiente`);
    return;
  }
  const prev = pendingByKey.get(k);
  const slot = { tf, baseTo, signal: dsLive.signal, seq: ++seqGlobal, executionsPlanned: 1, executionsDone: 0, fromLive: true, needsConfirm: true };
  if (!prev || !prev.executeImmediately) {
    pendingByKey.set(k, slot);
    if (cfg.debugSignals) {
      const iso = new Date(baseTo * 1e3).toISOString();
      console.log(`[${ticker}] ${tf} LIVE diferida base=${iso} => ${dsLive.signal} (esperar cierre y confirmar)`);
    }
    try {
      reportSignal({
        type: "signal",
        ticker,
        timeframe: tf === "1m" ? "M1" : "M5",
        side: dsLive.signal,
        baseToSec: baseTo,
        baseIso: new Date(baseTo * 1e3).toISOString(),
        live: true,
        event: "LIVE_DEFERRED",
        ts: Date.now()
      });
    } catch {}
  }
}
async function tryExecuteSlot({ sdk, ticker, tf, closed, amount, activeId, balance, cfg }) {
  if (closed.length < 2) return false;
  const k = keyFor(ticker, tf);
  const pend = pendingByKey.get(k);
  if (!pend) return false;
  // Flujo VIP/retrace-only: si no hay contexto retrace, descartar
  if (!pend.waitRetrace50) {
    safeDeletePending(k);
    return false;
  }
  // Cooldown post-rachas de perdidas
  try {
    // Cooldown post-perdidas desactivado: ignorar bloqueo por cooldown.
    // Dejar este bloque en comentario funcional para facilitar revertir si se desea.
    /* const nowSecCool = Math.floor(Date.now() / 1e3);
    const cooldownActive = cooldownUntilSec && nowSecCool < cooldownUntilSec;
    if (cooldownActive) {
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} bloqueado por cooldown post-perdidas hasta ${cooldownUntilSec} now=${nowSecCool}`);
      safeDeletePending(k);
      return false;
    } */
  } catch {}
  const last = closed[closed.length - 1];
  const prev = closed[closed.length - 2];
  // Bloqueo anti-duplicado por vela: si ya se operó esta baseTo, no continuar
  if (cfg.strictOnePerCandle) {
    const ek = `${ticker}:${tf}:${pend.baseTo}`;
    if (executedBaseKey.has(ek)) {
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} bloqueado por strictOnePerCandle baseTo=${pend.baseTo}`);
      safeDeletePending(k);
      return false;
    }
  }
  let ready = false;
  // Para reintentos programados (executeImmediately) queremos ejecutar
  // en la vela SIGUIENTE al cierre anterior. Esto aplica tanto para 1m
  // como para 5m: los retries se ejecutan en la APERTURA de la siguiente
  // vela en lugar de esperar la confirmación por temporizador.
  const tfSeconds = tf === "1m" ? 60 : 300;
  const currentCandleTo = Math.floor(Date.now() / 1e3 / tfSeconds) * tfSeconds + tfSeconds;
  if (pend.executionsDone === 0) {
    if (pend.executeImmediately) {
      const nowSec = Math.floor(Date.now() / 1e3);
      if (nowSec >= pend.baseTo) ready = true;
    } else {
      // IMPORTANTE: si es retrace50, NO activar ready por cierre de vela; se controla por toque
      if (!pend.waitRetrace50) {
        if (last.to === pend.baseTo || last.to > pend.baseTo) ready = true;
      }
    }
  }
  // Si es un slot de tipo retrace50, gestionar ventana especial: ejecutar sólo si toca el 50% en los primeros windowSec de la vela siguiente
  if (!ready && pend.waitRetrace50) {
    const w = pend.waitRetrace50;
    // Esperar a la apertura de la siguiente vela
    const nowSec0 = Math.floor(Date.now() / 1e3);
    const openEps = Number(cfg?.retrace50?.openEpsilonSec ?? 0.4);
    if (nowSec0 < w.nextOpenSec + openEps) return false;
    // Validación adicional con el servidor para evitar drift local: exigir que la última cerrada del servidor
    // tenga to >= nextOpenSec (ya abrió la nueva vela)
    try {
      const requireServerOpenCheck = cfg?.retrace50?.requireServerOpenCheck === true; // por defecto desactivado (false)
      if (requireServerOpenCheck) {
        const candlesFacade = await sdk.candles();
        const serverCandles = await candlesFacade.getCandles(Number(activeId), tfSeconds, { count: 1, onlyClosed: true, kind: "mid" });
        const serverLast = Array.isArray(serverCandles) && serverCandles.length ? serverCandles[serverCandles.length - 1] : null;
        const buyWindowSec = Math.max(1, Number(cfg?.retrace50?.buyWindowSec ?? 30));
        const buyEndServer = (w.nextOpenSec || 0) + buyWindowSec;
        const driftGrace = Math.max(0, Number(cfg?.retrace50?.serverDriftGraceSec ?? 120));
        const driftMaxWaitMs = Math.max(0, Number(cfg?.retrace50?.serverDriftMaxWaitMs ?? 180000));
        const driftKey = `${ticker}:${tf}`;
        const nowWarn = Date.now();
        if (!serverLast || (serverLast.to < w.nextOpenSec)) {
          if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 esperando apertura de servidor serverLast.to=${serverLast ? serverLast.to : '<none>'} required=${w.nextOpenSec}`);
          try {
            const driftSec = (w.nextOpenSec || 0) - (serverLast ? serverLast.to : 0);
            if (driftSec > 20) {
              const keyWarn = `${ticker}:${tf}`;
              const lastWarn = serverDriftWarnTs.get(keyWarn) || 0;
              if ((nowWarn - lastWarn) > 60000) {
                serverDriftWarnTs.set(keyWarn, nowWarn);
                console.log(`[WARN] ${ticker} ${tf} server drift ${driftSec}s serverLast.to=${serverLast ? serverLast.to : '<none>'} required=${w.nextOpenSec}`);
              }
              if (!serverDriftSince.has(driftKey)) serverDriftSince.set(driftKey, nowWarn);
              const started = serverDriftSince.get(driftKey) || nowWarn;
              const waitedMs = nowWarn - started;
              if (driftGrace > 0 && driftSec <= driftGrace && waitedMs >= Math.min(driftMaxWaitMs, 15000)) {
                console.log(`[WARN] ${ticker} ${tf} tolerando drift servidor ${driftSec}s (grace=${driftGrace}s waitedMs=${waitedMs})`);
                // Permitimos continuar pese al drift para evitar quedarnos congelados
                // Sin este bypass no se arma el slot
                // Nota: se mantiene la ventana buyEndServer
              } else {
                return false;
              }
            }
          } catch {}
        }
        if (serverLast.to > buyEndServer) {
          if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 CANCEL ventana expirada en servidor serverLast.to=${serverLast.to} buyEnd=${buyEndServer}`);
          safeDeletePending(k);
          return false;
        }
        if (!serverLast) return false;
        try {
          if (serverLast && serverLast.to >= w.nextOpenSec) {
            serverDriftSince.delete(driftKey);
          }
        } catch {}
      }
    } catch (e) {
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 serverOpenCheck error:`, e?.message || e);
      // En error de red/SDK, preferimos ser conservadores y no iniciar aún
      return false;
    }
  // Recalcular objetivo al abrir la vela de ejecución según la estrategia configurada
    try {
      const tfSeconds2 = tf === '1m' ? 60 : 300;
  const targetFrom = String(cfg?.retrace50?.targetFrom || '').trim();
    const deltaModeExec = String(cfg?.retrace50?.deltaMode || 'pct');
  const absDeltaExec = resolveAbsDelta(cfg, ticker);
      if ((targetFrom === 'openToExtreme' || targetFrom === 'openOnly') && !w._recalcFromOpen && nowSec0 >= w.nextOpenSec) {
        const candlesFacade2 = await sdk.candles();
        const arr = await candlesFacade2.getCandles(Number(activeId), tfSeconds2, { count: 2, onlyClosed: false, kind: 'mid' });
        const cur = Array.isArray(arr) ? arr[arr.length - 1] : null; // vela de ejecución N+offset (en curso)
        const base = Array.isArray(arr) ? arr[arr.length - 2] : null; // previa cerrada
  const pct = Math.min(0.9999, Math.max(0.0001, Number(cfg?.retrace50?.targetPct ?? 0.2)));
        const sideUp = String(pend.signal).toUpperCase() === 'CALL';
        let openVal;
        if (cur && cur.current && base && base.to === w.nextOpenSec && isFinite(Number(cur.open))) {
          openVal = Number(cur.open);
        } else if (base && base.to === w.nextOpenSec && isFinite(Number(base.close))) {
          // Fallback robusto: si no hay vela current marcada, usar close de la base como apertura
          openVal = Number(base.close);
        }
        if (isFinite(openVal)) {
          w.execOpenVal = openVal;
          if (targetFrom === 'openOnly') {
            const newTarget = (deltaModeExec === 'abs' && isFinite(absDeltaExec) && absDeltaExec > 0)
              ? (sideUp ? (openVal - absDeltaExec) : (openVal + absDeltaExec))
              : (sideUp ? openVal * (1 - pct) : openVal * (1 + pct));
            w.midPrev = newTarget;
            w._recalcFromOpen = true;
            try { console.log(`[${ticker}] ${tf} retrace50 target recalculated at open (openOnly${(cur && cur.current) ? '' : ' baseClose-fallback'}) side=${sideUp ? 'CALL' : 'PUT'} open=${openVal.toFixed(6)} ${deltaModeExec==='abs'?`abs=${absDeltaExec}`:`pct=${pct}`} -> target=${newTarget.toFixed(6)}`); } catch {}
          } else {
            // openToExtreme
            const baseLow = isFinite(Number(w.refLow)) ? Number(w.refLow) : Number(base?.low);
            const baseHigh = isFinite(Number(w.refHigh)) ? Number(w.refHigh) : Number(base?.high);
            const extreme = sideUp ? baseLow : baseHigh;
            if (isFinite(extreme)) {
              const newTarget = openVal + (extreme - openVal) * pct;
              w.midPrev = newTarget;
              w._recalcFromOpen = true;
              try { console.log(`[${ticker}] ${tf} retrace50 target recalculated at open (openToExtreme${(cur && cur.current) ? '' : ' baseClose-fallback'}) side=${sideUp ? 'CALL' : 'PUT'} open=${openVal.toFixed(6)} extreme=${extreme.toFixed(6)} pct=${pct} -> target=${newTarget.toFixed(6)}`); } catch {}
            }
          }
        }
      }
    } catch {}
    // --- Integracion del touch_watcher (adaptador feed) ---
    try {
      const ph = require('./port_helpers');
      const twmod = require('./touch_watcher');
      if (!global.__touchWatcher) {
        const EventEmitter = require('events');
        const getFeed = (symbol) => {
          const ee = new EventEmitter();
          let lastTs = 0;
          const tk = String(symbol || '').toUpperCase();
          const idNum = (typeof activesByTicker !== 'undefined' && activesByTicker.get && activesByTicker.get(tk)) ? Number(activesByTicker.get(tk)) : void 0;
          try { if (isFinite(Number(idNum))) ph.ensureQuoteSubscription(sdk, Number(idNum)).catch(() => {}); } catch {}
          const pollMsLocal = Math.max(20, Number(cfg?.retrace50?.pollMs ?? 50));
          const poll = setInterval(() => {
            try {
              let q;
              if (isFinite(Number(idNum))) {
                q = ph.__internals?.quoteOpenByActiveId?.get(Number(idNum));
                if ((!q || !q.tsMs) && ph.__internals?.quoteMidsByActiveId) {
                  const v = ph.__internals.quoteMidsByActiveId.get(Number(idNum));
                  if (v != null) q = { tsMs: Date.now(), mid: v, ask: ph.__internals.quoteAsksByActiveId?.get(Number(idNum)), bid: ph.__internals.quoteBidsByActiveId?.get(Number(idNum)) };
                }
              } else {
                const entries = ph.__internals?.quoteOpenByActiveId ? Array.from(ph.__internals.quoteOpenByActiveId.entries()) : [];
                for (const [aid, val] of entries) {
                  try {
                    const tkLocal = activesById?.get ? activesById.get(aid) : null;
                    if (tkLocal && String(tkLocal).toUpperCase() === tk) { q = val; break; }
                  } catch {}
                }
              }
              if (q && q.tsMs && q.tsMs !== lastTs) {
                lastTs = q.tsMs;
                const emitted = { bid: Number(q.bid || q.mid || 0), ask: Number(q.ask || q.mid || 0), value: Number(q.mid || q.bid || q.ask || 0) };
                try { ee._last = emitted.value; ee.getLast = () => ({ value: emitted.value, ask: emitted.ask, bid: emitted.bid, tsMs: q.tsMs }); } catch {}
                ee.emit('tick', emitted);
              }
            } catch {}
          }, pollMsLocal);
          ee.off = (ev, fn) => { try { ee.removeListener(ev, fn); } catch {} };
          ee.cancel = () => { try { clearInterval(poll); } catch {} };
          return ee;
        };
        try {
          const buyWithExpiryReal = async (symbol, side, amount, expirySec) => {
            try {
              try {
                const tk2 = String(symbol || '').toUpperCase();
                const actId = activesByTicker?.get ? Number(activesByTicker.get(tk2)) : void 0;
                if (isFinite(Number(actId))) {
                  ph.__internals?.quoteMidsByActiveId?.get(Number(actId));
                }
              } catch {}
              const placed = await placeOrder({ sdk, activeId: void 0, ticker: symbol, direction: side, amount, balance: null, tfSec: expirySec, cfg, executionNumber: 1 });
              return placed;
            } catch (e) {
              return { ok: false, error: e?.message || String(e) };
            }
          };
          global.__touchWatcher = twmod.createTouchWatcher({ getFeed, buyWithExpiry: buyWithExpiryReal, getTolerancePct: ph.getTolerancePct.bind(null, cfg) });
        } catch (e) {
          global.__touchWatcher = null;
        }
      }
    } catch (e) {}

    // Si ya hubo toque previo, respetar delay posterior antes de ejecutar
    try {
      const delayMsAfterTouch = Math.max(0, Number(cfg?.retrace50?.delayAfterTouchMs ?? 0));
      if (typeof w.touchedAtMs === 'number') {
        const elapsed = Date.now() - w.touchedAtMs;
        const postTouchMaxMs = Math.max(0, Number(cfg?.retrace50?.postTouchMaxMs ?? 0));
        if (postTouchMaxMs > 0 && elapsed > postTouchMaxMs) {
          if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 cancela por postTouchMaxMs elapsed=${elapsed}ms max=${postTouchMaxMs}ms`);
          safeDeletePending(k);
          return false;
        }
        if (delayMsAfterTouch > 0 && elapsed < delayMsAfterTouch) {
          if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 esperando post-toque ${elapsed}ms/${delayMsAfterTouch}ms`);
          await new Promise(r => setTimeout(r, Math.max(40, Number(cfg?.retrace50?.pollMs ?? 100))));
          return false;
        } else {
          // Antes de habilitar ejecución, aseguremos estar dentro de la ventana de compra
          const buyWindowSec = Math.max(1, Number(cfg?.retrace50?.buyWindowSec ?? 30));
          const nowSecChk = Math.floor(Date.now() / 1e3);
          const buyEndSec = w.nextOpenSec + buyWindowSec;
          if (nowSecChk >= buyEndSec) {
            if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 toque pero fuera de ventana de compra (buyEnd=${buyEndSec} now=${nowSecChk})`);
            safeDeletePending(k);
            return false;
          }
          // listo para ejecutar (sin delay o ya cumplido)
          ready = true;
          pend.executeImmediately = true;
          pendingByKey.set(k, pend);
        }
      }
    } catch {}
    const deadlineSec = w.nextOpenSec + Number(w.windowSec);
    const buyWindowSec = Math.max(1, Number(cfg?.retrace50?.buyWindowSec ?? 30));
    const buyEndSec = w.nextOpenSec + buyWindowSec;
    const hadTouch = typeof w.touchedAtMs === 'number';
    // Corte duro: si se cerró la ventana de compra, cancelar siempre
    if (nowSec0 >= buyEndSec) {
      console.log(`[${ticker}] ${tf} retrace50 TIMEOUT ventana de compra cerrada (buyEnd=${buyEndSec} now=${nowSec0})`);
      safeDeletePending(k);
      return false;
    }
    if (!hadTouch && nowSec0 >= deadlineSec) {
      console.log(`[${ticker}] ${tf} retrace50 TIMEOUT sin toque (mid=${w.midPrev.toFixed(6)})`);
      safeDeletePending(k);
      return false;
    }
    if (hadTouch && nowSec0 >= deadlineSec) {
      // Si la ventana expiró pero ya hubo toque, continuar con la ejecución post-toque
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 ventana expirada tras toque; se mantiene slot para ejecutar post-toque`);
    }
    // Polling de precio vivo por velas en curso (fallback sencillo): tomar el close de la vela actual M1
    const pollMs = Math.max(60, Number(cfg?.retrace50?.pollMs ?? 120));
    const dir = String(pend.signal).toUpperCase();
    const nowSec1 = Math.floor(Date.now() / 1e3);
    // Preferir mid de cotización viva; fallback al close de la última vela
    await ensureQuoteSubscription(sdk, activeId);
    const idNum = Number(activeId);
    const mid = quoteMidsByActiveId.get(idNum);
    const askVal0 = quoteAsksByActiveId.get(idNum);
    const bidVal0 = quoteBidsByActiveId.get(idNum);
    const requireLiveMid = cfg?.retrace50?.requireLiveMid !== false; // por defecto, exigir mid vivo
    const allowCloseFallback = cfg?.retrace50?.allowCloseFallback === true;
    const fallbackMs = allowCloseFallback ? Math.max(0, Number(cfg?.retrace50?.fallbackToCloseAfterMs ?? 0)) : 0;
    const nowMs2 = Date.now();
    const openMs = (w.nextOpenSec || 0) * 1000;
    let useFallbackClose = false;

    // Freshness check: exigir mid con ts reciente (<500ms) si hay datos de quoteOpen
    let midTsMs = null;
    try {
      const qoLocal = quoteOpenByActiveId.get(idNum);
      if (qoLocal && qoLocal.tsMs) midTsMs = qoLocal.tsMs;
    } catch {}
    if (midTsMs == null) {
      try {
        const ph = require('./port_helpers');
        const qo = ph.__internals && ph.__internals.quoteOpenByActiveId ? ph.__internals.quoteOpenByActiveId.get(idNum) : null;
        if (qo && qo.tsMs) midTsMs = qo.tsMs;
      } catch {}
    }
    const staleMs = midTsMs ? (nowMs2 - midTsMs) : Infinity;
    const freshMid = (typeof mid === 'number' && isFinite(mid) && staleMs <= 500);

    if (requireLiveMid && !freshMid) {
      if (cfg.debugSignals) {
        try {
          const pend = pendingByKey.get(k);
          if (pend && !pend._loggedStaleMid) {
            console.log(`[${ticker}] ${tf} retrace50 espera mid fresco staleMs=${isFinite(staleMs)?staleMs.toFixed(0):'inf'} activeId=${activeId}`);
            pend._loggedStaleMid = true;
            pendingByKey.set(k, pend);
          }
        } catch {}
      }
      try {
        if (!quoteSubscribingActiveIds.has(idNum)) ensureQuoteSubscription(sdk, activeId).catch(() => {});
      } catch {}
      if (allowCloseFallback && fallbackMs > 0 && nowMs2 >= openMs + fallbackMs) {
        useFallbackClose = true;
      } else {
        await new Promise(r => setTimeout(r, pollMs));
        return false;
      }
    }
    // Determinar precio actual con fallbacks: preferir mid vivo; si no hay y
    // no se requiere estrictamente mid vivo, intentar la vela actual (kind: 'mid').
    let curPrice;
    let srcTag;
    if (typeof mid === 'number' && isFinite(mid)) {
      curPrice = Number(mid);
      srcTag = 'mid';
    } else {
      // Intentar obtener la vela en curso y usar su close como proxy del mid
      let usedLiveCandle = false;
      if (!requireLiveMid) {
        try {
          const candlesFacade3 = await sdk.candles();
          const arr3 = await candlesFacade3.getCandles(Number(activeId), tfSeconds, { count: 1, onlyClosed: false, kind: 'mid' });
          const cur3 = Array.isArray(arr3) ? arr3[arr3.length - 1] : null;
          const liveClose = cur3 && cur3.current ? Number(cur3.close) : NaN;
          if (isFinite(liveClose)) {
            curPrice = liveClose;
            srcTag = 'mid-candle';
            usedLiveCandle = true;
          }
        } catch {}
      }
      if (!usedLiveCandle) {
        // Fallback último recurso: close de la última vela cerrada
        curPrice = last.close;
        srcTag = (useFallbackClose ? 'close-fallback' : 'close');
      }
    }

    // Bloquear si el spread es demasiado ancho respecto a la tolerancia
    try {
      const hasAsk = typeof askVal0 === 'number' && isFinite(askVal0);
      const hasBid = typeof bidVal0 === 'number' && isFinite(bidVal0);
      if (hasAsk && hasBid) {
        const spreadVal = Number(askVal0) - Number(bidVal0);
        const maxSpreadTol = Number(w.midPrev) * Number(w.tol);
        const pip = /JPY/i.test(String(ticker)) ? 0.01 : 0.0001;
        const maxSpreadPips = Math.max(0, Number(cfg?.retrace50?.maxSpreadPips ?? 1.2)) * pip;
        const allowedSpread = Math.max(0, Math.min(maxSpreadTol, maxSpreadPips || maxSpreadTol));
        if (isFinite(spreadVal) && isFinite(allowedSpread) && spreadVal > allowedSpread) {
          if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 spread alto spread=${spreadVal.toFixed(6)} max=${allowedSpread.toFixed(6)} midPrev=${w.midPrev.toFixed(6)} tol=${w.tol}`);
          await new Promise(r => setTimeout(r, pollMs));
          return false;
        }
      }
    } catch {}
    const touchCall = (p) => p <= w.midPrev * (1 + w.tol);
    const touchPut  = (p) => p >= w.midPrev * (1 - w.tol);
    const crossOnly = !!cfg?.retrace50?.crossMidOnly;
    const prevSeenKey = `prevPrice:${ticker}:${tf}`;
    const prevSeen = lastTwoCompactLogged.get(prevSeenKey);
    lastTwoCompactLogged.set(prevSeenKey, curPrice);
    const touched = dir === 'CALL' ? touchCall(curPrice) : touchPut(curPrice);
    // Soporte de "hold por tiempo" en lugar de sólo toque
    const holdMs = Math.max(0, Number(cfg?.retrace50?.holdMs ?? 0));
    if (holdMs > 0) {
      const refLevel = (typeof w.execOpenVal === 'number' && isFinite(w.execOpenVal)) ? w.execOpenVal : (typeof w.baseClose === 'number' ? w.baseClose : w.midPrev);
      const sideUpHold = dir === 'CALL';
      const condNow = sideUpHold ? (curPrice <= refLevel) : (curPrice >= refLevel);
      if (!condNow) {
        // reiniciar cronómetro de hold si estaba corriendo
        delete w.holdStartMs;
        if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 HOLD reset condNow=${condNow} ref=${refLevel.toFixed(6)} px=${curPrice.toFixed(6)} side=${dir}`);
        await new Promise(r => setTimeout(r, pollMs));
        return false;
      }
      if (typeof w.holdStartMs !== 'number') {
        w.holdStartMs = Date.now();
        pend.waitRetrace50 = w;
        pendingByKey.set(k, pend);
        if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 HOLD start ref=${refLevel.toFixed(6)} side=${dir}`);
        await new Promise(r => setTimeout(r, pollMs));
        return false;
      }
      const heldFor = Date.now() - w.holdStartMs;
      if (heldFor < holdMs) {
        if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 HOLD progress ${heldFor}/${holdMs}ms ref=${refLevel.toFixed(6)} px=${curPrice.toFixed(6)} side=${dir}`);
        await new Promise(r => setTimeout(r, pollMs));
        return false;
      }
      // Hold cumplido: considerar esto como TOUCHED y continuar con delay post-toque
      try {
        const upper = (w.midPrev * (1 + w.tol)).toFixed(6);
        const lower = (w.midPrev * (1 - w.tol)).toFixed(6);
        const hasAsk = typeof askVal0 === 'number' && isFinite(askVal0);
        const hasBid = typeof bidVal0 === 'number' && isFinite(bidVal0);
        const spread = (hasAsk && hasBid) ? (Number(askVal0) - Number(bidVal0)) : undefined;
        const spreadStr = cfg?.retrace50?.logSpread ? ` ab=${hasAsk ? Number(askVal0).toFixed(6) : '-'}\/${hasBid ? Number(bidVal0).toFixed(6) : '-'} sp=${spread != null ? spread.toFixed(6) : '-'}` : '';
  const absUsed = resolveAbsDelta(cfg, ticker);
  const pctLog = (cfg?.retrace50?.deltaMode === 'abs') ? ` abs=${Number(absUsed).toFixed(6)}` : (cfg?.retrace50?.targetPct != null ? ` targetPct=${Number(cfg.retrace50.targetPct).toFixed(2)}` : '');
  console.log(`[${ticker}] ${tf} retrace50 TOUCHED(HOLD) side=${dir} px=${Number(curPrice).toFixed(6)} ref=${refLevel.toFixed(6)} src=${srcTag} target=${w.midPrev.toFixed(6)} band=[${lower},${upper}] crossOnly=${crossOnly}${pctLog}${spreadStr}`);
  w.touchedAtMs = Date.now();
  w.touchedPx = Number(curPrice);
  w.touchedSrc = srcTag;
  try { if (cfg?.retrace50?.enableRetry) pend.executeImmediately = true; } catch {}
  pend.waitRetrace50 = w;
  pendingByKey.set(k, pend);
      } catch {}
      await new Promise(r => setTimeout(r, Math.max(40, Number(cfg?.retrace50?.pollMs ?? 100))));
      return false;
    }
    const crossed = (() => {
      if (crossOnly) {
        const allowFirst = !!cfg?.retrace50?.allowFirstTickCross;
        if (typeof prevSeen !== 'number') return allowFirst ? touched : false;
        if (dir === 'CALL') {
          return prevSeen > w.midPrev && curPrice <= w.midPrev * (1 + w.tol);
        } else {
          return prevSeen < w.midPrev && curPrice >= w.midPrev * (1 - w.tol);
        }
      }
      return touched;
    })();
  if (!crossed) {
      // reintentar más adelante dentro de la ventana
      // Programar pequeño delay no bloqueante devolviendo false para que el ciclo vuelva a intentar
  if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 esperando toque target=${w.midPrev.toFixed(6)} px=${(Number(curPrice) || last.close).toFixed(6)}`);
      await new Promise(r => setTimeout(r, pollMs));
      return false;
    }
  // Log explícito de toque detectado con la banda permitida
    try {
      const upper = (w.midPrev * (1 + w.tol)).toFixed(6);
      const lower = (w.midPrev * (1 - w.tol)).toFixed(6);
      const hasAsk = typeof askVal0 === 'number' && isFinite(askVal0);
      const hasBid = typeof bidVal0 === 'number' && isFinite(bidVal0);
      const spread = (hasAsk && hasBid) ? (Number(askVal0) - Number(bidVal0)) : undefined;
      const spreadStr = cfg?.retrace50?.logSpread ? ` ab=${hasAsk ? Number(askVal0).toFixed(6) : '-'}\/${hasBid ? Number(bidVal0).toFixed(6) : '-'} sp=${spread != null ? spread.toFixed(6) : '-'}` : '';
  const pctLog = (cfg?.retrace50?.targetPct != null) ? ` targetPct=${Number(cfg.retrace50.targetPct).toFixed(2)}` : '';
  const winAgeMs = Math.max(0, Date.now() - (w.nextOpenSec * 1000));
  console.log(`[${ticker}] ${tf} retrace50 TOUCHED side=${dir} px=${Number(curPrice).toFixed(6)} src=${srcTag} target=${w.midPrev.toFixed(6)} band=[${lower},${upper}] crossOnly=${crossOnly}${pctLog}${spreadStr} winAgeMs=${winAgeMs} touchedAtMs=${Date.now()}`);
      // almacenar métricas del toque; si no hay delay ni hold, ejecutar inmediato
      try {
        w.touchedAtMs = Date.now();
        w.touchedPx = Number(curPrice);
        w.touchedSrc = srcTag;
        // Si enableRetry está activado, marcar para ejecutar inmediatamente en la siguiente apertura
        try { if (cfg?.retrace50?.enableRetry) pend.executeImmediately = true; } catch {}
        pend.waitRetrace50 = w;
        const noHold = !(Math.max(0, Number(cfg?.retrace50?.holdMs ?? 0)) > 0);
        const noDelay = !(Math.max(0, Number(cfg?.retrace50?.delayAfterTouchMs ?? 0)) > 0);
        if (noHold && noDelay) {
          ready = true;
          pend.executeImmediately = true;
        }
        pendingByKey.set(k, pend);
      } catch {}
    } catch {}
    // Si quedó listo (sin delay/hold), continuar a ejecución inmediata en este ciclo
    if (!ready) {
      await new Promise(r => setTimeout(r, Math.max(40, Number(cfg?.retrace50?.pollMs ?? 100))));
      return false;
    }
  }
  if (!ready) return false;
  if (!pend.executeImmediately && lastOperatedCandleTo[k] === last.to) {
    return false;
  }
  if (cfg.maxPlacementDelaySec) {
    const age = Date.now() / 1e3 - pend.baseTo;
    if (age > cfg.maxPlacementDelaySec) {
      safeDeletePending(k);
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} descartada por retraso ${age.toFixed(1)}s>` + cfg.maxPlacementDelaySec);
  // DEBUG: indicar por qué se descartó
  try { console.log(`[DEBUG][exec] ${ticker} ${tf} discarded due to maxPlacementDelaySec age=${age.toFixed(1)} max=${cfg.maxPlacementDelaySec}`); } catch (e) {}
      return false;
    }
  }
  // Si hay un retry inmediato pendiente para esta clave, dar prioridad y no ejecutar señal normal
  if (!pend.executeImmediately && scheduledRetryKeys.has(k)) {
    if (cfg.debugSignals) console.log(`[${ticker}] ${tf} ejecución normal aplazada por retry pendiente`);
    return false;
  }
  // Usar la señal detectada originalmente (pend.signal) y esperar un tiempo fijo
  // antes de enviar la orden. Para 1m -> 63s. Para 5m: esperar 300s (vela 5m)
  // y luego otros 5s más de confirmación, es decir 305s desde la base.
  const finalSignal = pend.signal;
  // Confirmación uniforme: ~3 segundos tras el cierre de la vela base para M1 y M5
  const requiredDelaySec = pend.executeImmediately ? 0 : 3;
  const ageSec = Date.now() / 1e3 - pend.baseTo;

  // Confirmaciones estándar deshabilitadas para retrace-only (operamos en la vela siguiente por diseño)
  if (!finalSignal) {
    safeDeletePending(k);
    return false;
  }
  // Safety: no intentar enviar la orden antes del inicio permitido de la vela de ejecución
  try {
    const nowSec = Date.now() / 1e3;
    let minAllowedSec = pend.baseTo - tfSeconds;
    if (pend.waitRetrace50) {
      const openEps2 = Number(cfg?.retrace50?.openEpsilonSec ?? 0.4);
      const w = pend.waitRetrace50 || {};
      // FIX retrace50: antes se usaba pend.baseTo + tfSeconds (equivalente a esperar una vela extra),
      // lo que hacía imposible ejecutar dentro de la buyWindow (anclada a nextOpenSec) y producía cancelaciones.
      // Ahora usamos la apertura planificada (w.nextOpenSec) + epsilon.
      const plannedOpen = (typeof w.nextOpenSec === 'number' && isFinite(w.nextOpenSec)) ? w.nextOpenSec : pend.baseTo;
      minAllowedSec = plannedOpen + openEps2;
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 minAllowedSec ajustado plannedOpen=${plannedOpen} eps=${openEps2}`);
    }
    if (nowSec < minAllowedSec - 0.5) {
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} evitando entrada antes del inicio permitido. now=${nowSec.toFixed(1)} minAllowed=${minAllowedSec}`);
      return false;
    }
  } catch (e) {
    // no bloquear en caso de error en la comprobación
  }
  if (cfg.strictOnePerCandle) {
    const ek = `${ticker}:${tf}:${pend.baseTo}`;
    if (!pend.executeImmediately && executedBaseKey.has(ek)) {
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} duplicado evitado baseTo=${pend.baseTo}`);
      safeDeletePending(k);
      return false;
    }
    if (pend.inFlight) {
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} inFlight evitando duplicado baseTo=${pend.baseTo}`);
      return false;
    }
    // Si este slot es un retry inmediato, limpiar la marca programada
    if (pend.executeImmediately) {
      // Corte duro ventana de compra (retrace50): no ejecutar si ya se cerró
      if (pend.waitRetrace50) {
        try {
          const w = pend.waitRetrace50 || {};
          const buyWindowSec = Math.max(1, Number(cfg?.retrace50?.buyWindowSec ?? 30));
          const nowSecCut = Math.floor(Date.now() / 1e3);
          const buyEndSec = (w.nextOpenSec || (pend.baseTo + tfSeconds)) + buyWindowSec;
          if (nowSecCut >= buyEndSec) {
            if (cfg.debugSignals) console.log(`[${ticker}] ${tf} retrace50 cancelado: ventana de compra cerrada antes de EXEC (buyEnd=${buyEndSec} now=${nowSecCut})`);
            safeDeletePending(k);
            return false;
          }
        } catch {}
      }
      // Confirmar VIP+/fractales/regimen en ejecución inmediata si así se requiere
      try {
        const requireVipAtExec = !!cfg?.retrace50?.requireVipPlusOk;
        const vipEnabled = (cfg?.vipPlus?.enableFractals || cfg?.vipPlus?.enableRegimeAutoSwitch);
        if (requireVipAtExec && vipEnabled) {
          const dsClosed = { signal: pend.signal, signalIndex: closed.length - 1, buffer1: [], buffer2: [] };
          const vfNow = applyVipPlusFilter(dsClosed, closed, cfg);
          if (!vfNow.ok) {
            if (cfg.debugSignals) console.log(`[${ticker}] ${tf} VIP+ no confirma en ejecución inmediata: ${vfNow.reason}. Cancela slot.`);
            safeDeletePending(k);
            return false;
          }
        }
      } catch (e) {
        if (cfg.debugSignals) console.log(`[${ticker}] ${tf} error VIP+ en ejecución inmediata:`, e?.message || e);
        safeDeletePending(k);
        return false;
      }
      try {
        if (pend.waitRetrace50) {
          const w = pend.waitRetrace50 || {};
          const nowMs = Date.now();
          const openMs = (w.nextOpenSec ? w.nextOpenSec * 1000 : pend.baseTo * 1000 + tfSeconds * 1000);
          const latOpenMs = Math.max(0, nowMs - openMs);
          const latTouchMs = typeof w.touchedAtMs === 'number' ? Math.max(0, nowMs - w.touchedAtMs) : -1;
          const touchInfo = (typeof w.touchedPx === 'number') ? ` touchedPx=${w.touchedPx?.toFixed?.(6)} src=${w.touchedSrc || '-'}` : '';
          console.log(`[${ticker}] ${tf} [retrace50] executing after touch baseTo=${pend.baseTo} latOpenMs=${latOpenMs} latTouchMs=${latTouchMs}${touchInfo}`);
        }
        else if (isRetry) console.log(`[RETRY] executing immediate retry for ${ticker} ${tf} baseTo=${pend.baseTo}`);
        else console.log(`[LIVE] executing immediate signal for ${ticker} ${tf} baseTo=${pend.baseTo}`);
      } catch (e) {}
      scheduledRetryKeys.delete(k);
      // Marcar lastOperated para no perder el retry por colisión con ejecución normal
      lastOperatedCandleTo[k] = pend.baseTo;
    }
    // Marcar clave de ejecución por vela ANTES de enviar la orden para evitar dobles en condiciones de carrera
    if (cfg.strictOnePerCandle) {
      const ek = `${ticker}:${tf}:${pend.baseTo}`;
      executedBaseKey.add(ek);
    }
    pend.inFlight = true;
    pendingByKey.set(k, pend);
    try {
      console.log(`[EXEC-START] ${ticker} ${tf} side=${finalSignal} baseTo=${pend.baseTo} retrace50=${pend.waitRetrace50 ? 'yes' : 'no'} immediate=${pend.executeImmediately ? 'yes' : 'no'} activeId=${activeId}`);
    } catch (e) {}
  }
  const execNum = pend.execNumberOverride || (pend.executionsDone ? pend.executionsDone + 1 : 1);
  // Sólo multiplicar monto en RETRY real (exec #2). Las señales LIVE inmediatas NO se multiplican.
  const isRetry = Number(execNum) === 2;
  const retryMult = Number(cfg.retryMultiplier || 2);
  const baseAmount = Math.max(0, Number(cfg.amount || amount));
  const orderAmount = isRetry ? baseAmount * retryMult : baseAmount;
  try {
    if (cfg.debugSignals) console.log(`[DEBUG][place] ${ticker} ${tf} amount=${orderAmount} execNum=${execNum} isRetry=${isRetry} immediate=${!!pend.executeImmediately}`);
  } catch {}

  // APLICAR “siguiente timer” SOLO PARA 5m (evita ejecuciones adelantadas)
  try {
    if (tf === "5m" && !pend.executeImmediately) {
      const nowSec2 = Math.floor(Date.now() / 1e3);
      const requiredOpen = pend.baseTo + tfSeconds; // apertura de la vela siguiente
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} comprobando temporizador local/servidor antes de enviar orden baseTo=${pend.baseTo} requiredOpen=${requiredOpen} now=${nowSec2}`);
      // Local time check: wait until the next slot is reached
      if (nowSec2 < requiredOpen) {
        if (cfg.debugSignals) console.log(`[${ticker}] ${tf} aún no alcanzó el siguiente timer localmente now=${nowSec2} < requiredOpen=${requiredOpen}`);
        return false;
      }
      // Server confirmation: ensure server reports the candle(s) closed
      try {
        const candlesFacade = await sdk.candles();
        // request 3 closed candles to be robust across providers
  const serverCandles = await candlesFacade.getCandles(Number(activeId), tfSeconds, { count: 3, onlyClosed: true, kind: "mid" });
        const serverLast = Array.isArray(serverCandles) && serverCandles.length ? serverCandles[serverCandles.length - 1] : null;
        if (!serverLast) {
          if (cfg.debugSignals) console.log(`[${ticker}] ${tf} no pude obtener velas cerradas del servidor; retrasa por seguridad`);
          return false;
        }
        if (cfg.debugSignals) console.log(`[${ticker}] ${tf} servidor last.to=${serverLast.to} requiredOpen=${requiredOpen}`);
        if (serverLast.to < requiredOpen) {
          if (cfg.debugSignals) console.log(`[${ticker}] ${tf} servidor indica last.to=${serverLast.to} < requiredOpen=${requiredOpen}; retrasa ejecución`);
          return false;
        }
      } catch (e) {
        if (cfg.debugSignals) console.log(`[${ticker}] ${tf} error comprobando velas servidor:`, e?.message || e);
        // En caso de error de red/SDK, ser conservadores y retrasar la ejecución
        return false;
      }
    }
  } catch (e) {}
  // Retardo previo al envío de orden (configurable).
  // Para ejecuciones "inmediatas" (siguiente vela sin confirmación), usar `preOrderImmediateMs`.
  try {
    let preMs = Number(cfg.preOrderDelayMs ?? 1000);
    if (pend.executeImmediately) {
      preMs = Number(cfg.preOrderImmediateMs ?? 0);
    }
    if (preMs > 0) {
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} esperando preOrderDelayMs=${preMs}ms antes de enviar orden`);
      await new Promise((r) => setTimeout(r, preMs));
    }
  } catch (e) {}
  let placed;
  if (cfg.studyOnly) {
    try {
      const latTouchMs = pend?.waitRetrace50 && typeof pend.waitRetrace50.touchedAtMs === 'number' ? Math.max(0, Date.now() - pend.waitRetrace50.touchedAtMs) : -1;
      const touchInfo = (pend?.waitRetrace50 && typeof pend.waitRetrace50.touchedPx === 'number') ? ` touchedPx=${pend.waitRetrace50.touchedPx?.toFixed?.(6)} src=${pend.waitRetrace50.touchedSrc || '-'}` : '';
      console.log(`[STUDY] ${ticker} ${tf} ${finalSignal} baseTo=${pend.baseTo} exec=${execNum} latTouchMs=${latTouchMs}${touchInfo}`);
    } catch {}
    placed = { ok: true, id: null, route: "STUDY" };
  } else {
    // Pre-send gate: si hubo toque previo registrado por retrace50, forzar execution inmediata
    try {
      if (pend && pend.waitRetrace50 && typeof pend.waitRetrace50.touchedAtMs === 'number') {
        try { if (!pend.executeImmediately) pend.executeImmediately = true; } catch {}
      }
    } catch (e) {}
    placed = await placeOrder({ sdk, activeId, ticker, direction: finalSignal, amount: orderAmount, balance, tfSec: tfSec(tf), cfg, executionNumber: execNum });
  }
  if (placed.ok) {
    lastOperatedCandleTo[k] = last.to;
    pend.executionsDone += 1;
    if (cfg.debugSignals) console.log(`[${ticker}] ${tf} ejecuci\xF3n ${pend.executionsDone}/${pend.executionsPlanned} slot ${pend.baseTo}`);
    if (pend.executionsDone >= pend.executionsPlanned) {
      safeDeletePending(k);
    } else {
      pendingByKey.set(k, pend);
    }
    // clear immediate flag after attempt and remove scheduled marker
    if (pend.executeImmediately) {
      try {
        if (isRetry) console.log(`[RETRY] immediate-exec performed for ${ticker} ${tf} exec=${execNum}`);
        else console.log(`[LIVE] immediate-exec performed for ${ticker} ${tf} exec=${execNum}`);
      } catch (e) {}
      scheduledRetryKeys.delete(k);
      delete pend.executeImmediately;
    }
    if (!cfg.quietConsole) console.log(`[${ticker}] ${tf} ORDEN ${finalSignal} via ${placed.route} id=${placed.id ?? "n/a"}`);
  // Ya se marcó executedBaseKey antes del envío; mantenerla para bloquear duplicados en la misma vela
    // Enriquecer EXEC con detalles del retrace si existen
    const w = pend?.waitRetrace50;
    const openMs = (w?.nextOpenSec ? w.nextOpenSec * 1000 : pend.baseTo * 1000 + tfSeconds * 1000);
    const nowMs = Date.now();
    const latOpenMs2 = Math.max(0, nowMs - openMs);
    const latTouchMs2 = (w && typeof w.touchedAtMs === 'number') ? Math.max(0, nowMs - w.touchedAtMs) : undefined;
    logExecution(cfg, {
      ticker,
      timeframe: tf,
      signal: finalSignal,
      route: placed.route,
      orderId: placed.id ?? null,
      execution: 1,
      executionsPlanned: 1,
      baseTo: pend.baseTo,
      baseIso: new Date(pend.baseTo * 1e3).toISOString(),
      lastCandleTo: last.to,
      lagSeconds: last.to - pend.baseTo,
      sim: cfg.simMode || false,
      target: w?.midPrev,
      targetPct: (cfg?.retrace50?.targetPct != null) ? Number(cfg.retrace50.targetPct) : undefined,
      touchedPx: w?.touchedPx,
      touchedSrc: w?.touchedSrc,
      latOpenMs: latOpenMs2,
      latTouchMs: latTouchMs2
    });
    return true;
  } else {
    try {
      const routeHint = (tf === "1m") ? "TURBO 60s" : (tf === "5m" ? "TURBO 300s" : "AUTO");
      console.log(`[EXEC-FAIL] ${ticker} ${tf} side=${finalSignal} baseTo=${pend.baseTo} routeHint=${routeHint} error=${placed.error}`);
    } catch (e) {}
    if (tf === "1m" && pend.executionsDone === 0 && pend.executionsPlanned > 1) {
      pend.executionsDone = 1;
      pendingByKey.set(k, pend);
      if (cfg.debugSignals) console.log(`[${ticker}] ${tf} fallo primera ejecuci\xF3n, se intentar\xE1 segunda al cierre pr\xF3xima.`);
    } else {
      safeDeletePending(k);
      scheduledRetryKeys.delete(k);
    }
  // clear immediate flag if present
  if (pend.executeImmediately) delete pend.executeImmediately;
    // Si falla la orden, liberar la marca para no bloquear ejecuciones futuras (siguiente vela)
    if (cfg.strictOnePerCandle) {
      executedBaseKey.delete(`${ticker}:${tf}:${pend.baseTo}`);
    }
    console.log(`[${ticker}] ${tf} fallo orden: ${placed.error}`);
    logExecution(cfg, { ticker, timeframe: tf, signal: finalSignal, route: placed.route, error: placed.error || "unknown", failed: true, baseTo: pend.baseTo });
    return false;
  }
}
function aggregateTo5m(c1) {
  const byKey = /* @__PURE__ */ new Map();
  for (const c of c1) {
    const bucketStart = Math.floor(c.from / 300) * 300;
    let b = byKey.get(bucketStart);
    if (!b) {
      b = { start: bucketStart, end: bucketStart + 300, candles: [] };
      byKey.set(bucketStart, b);
    }
    b.candles.push(c);
  }
  const out = [];
  for (const b of Array.from(byKey.values()).sort((a, b2) => a.start - b2.start)) {
    const s = b.candles.sort((a, b2) => a.from - b2.from);
    const last = s[s.length - 1];
    const complete = last.to >= b.end;
    out.push({
      from: b.start,
      to: b.end,
      // to fijo estable evita cambiar 1755478260 -> 1755478320 dentro misma ventana
      open: s[0].open,
      high: Math.max(...s.map((x) => x.high)),
      low: Math.min(...s.map((x) => x.low)),
      close: last.close,
      current: !complete
      // current solo si la ventana aún no se completó
    });
  }
  return out;
}
async function placeOrder({ sdk, activeId, ticker, direction, amount, balance, tfSec: tfSec2, cfg, executionNumber }) {
  if (cfg.simMode) {
  const id = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const openTime = Date.now();
    const timeframe = tfSec2 === 60 ? "M1" : "M5";
    const expectedPayoutPct = cacheGetPayout(`${ticker.toUpperCase()}|${timeframe}`) || 0.82;
    const expirySec = expiryForTf(timeframe, cfg.expirySecPerTimeframe);
    const expectedCloseTs = openTime + expirySec * 1e3;
  openById.set(id, { id, ticker, timeframe, side: direction, amount, expectedPayoutPct, openTime, expectedCloseTs, executionNumber: executionNumber || 1 });
    await reportOpen({ id, status: "OPEN", ticker, tf: timeframe, side: direction, amount, expectedPayoutPct, openedAt: openTime });
    const GRACE_MS = 7e3;
    const ord = openById.get(id);
    ord.closeTimer = setTimeout(() => {
      const o = openById.get(id);
      if (!o) return;
      emitClosed({ id: o.id, ticker: o.ticker, timeframe: o.timeframe, side: o.side, amount: o.amount, expectedPayoutPct: o.expectedPayoutPct, result: "UNKNOWN", profit: 0 });
    }, expirySec * 1e3 + GRACE_MS);
    setTimeout(() => {
      const win = Math.random() < 0.5;
      const result = win ? "WIN" : "LOSS";
      const profit = computeProfit(result, amount, expectedPayoutPct) || 0;
      emitClosedWithRisk({ id, ticker, timeframe: tfSec2 === 60 ? "M1" : "M5", amount, expectedPayoutPct, result, profit });
    }, 2500 + Math.random() * 1500);
    return { ok: true, id, route: "SIM" };
  }
  const dir = direction === "CALL" ? BinaryOptionsDirection.Call : BinaryOptionsDirection.Put;
  const now = /* @__PURE__ */ new Date();
  const tryTurbo = async () => {
    if (!sdk.turboOptions) return null;
    try {
      const turbo = await sdk.turboOptions();
      const act = turbo.getActive(Number(activeId));
      if (!act) return null;
      const insts = await act.instruments();
      // Intentar obtener instrumentos disponibles, esperando un corto periodo si es necesario
      let disp = [];
      try {
        const maxWait = Math.max(0, Number(cfg.turboAvailabilityWaitMs ?? 3000));
        const step = 250;
        const start = Date.now();
        while (true) {
          const nowLocal = new Date();
          disp = insts.getAvailableForBuyAt?.(nowLocal) || [];
          if (disp.length) break;
          if (Date.now() - start >= maxWait) break;
          await new Promise((r) => setTimeout(r, step));
        }
      } catch {}
      if (!disp.length) {
        try { console.log(`[TURBO] sin instrumentos disponibles tras espera corta (${Number(cfg.turboAvailabilityWaitMs ?? 3000)}ms)`); } catch {}
        return { ok: false, error: "Turbo no disponible" };
      }
      // Selección robusta del instrumento turbo: encontrar expiración cercana a la deseada
      let idx = 0;
      const desiredSec = tfSec2;
      if (desiredSec === 300) {
        // Force choosing index 4 (5th item) for 5-minute turbo entries.
        // If there are fewer than 5 instruments, pick the last available one.
        idx = disp.length >= 5 ? 4 : Math.max(0, disp.length - 1);

        // Helper: extract estimated expiration seconds from an instrument
        const extractExpirationSec = (item) => {
          try {
            if (!item) return void 0;
            if (typeof item.expirationSize === 'number') return Math.round(item.expirationSize);
            if (typeof item.expirationSize === 'string') {
              const n = Number(String(item.expirationSize).replace(/\D/g, ''));
              if (!isNaN(n)) return Math.round(n);
            }
            if (item.expiration && typeof item.expiration === 'object') {
              if (typeof item.expiration.seconds === 'number') return Math.round(item.expiration.seconds);
              if (typeof item.expiration.size === 'number') return Math.round(item.expiration.size);
            }
            const nowMs = Date.now();
            if (item.expiredAt) {
              const durMs = new Date(item.expiredAt).getTime() - nowMs;
              if (isFinite(durMs)) return Math.max(0, Math.round(durMs / 1000));
            }
            if (typeof item.durationRemainingForPurchase === 'function') {
              try {
                const durMs2 = item.durationRemainingForPurchase(new Date());
                if (typeof durMs2 === 'number' && isFinite(durMs2)) return Math.max(0, Math.round(durMs2 / 1000));
              } catch {}
            }
          } catch (e) {}
          return void 0;
        };

        // Dump available instruments for debugging when requested
        if (cfg.debugSignals) {
          try {
            console.log(`[TURBO] disp count=${disp.length} for ${ticker} (looking for ~300s)`);
            disp.forEach((it, i) => {
              const sec = extractExpirationSec(it);
              console.log(`[TURBO] #${i+1} expirationSize=${String(it.expirationSize)} expiration.seconds=${it.expiration && it.expiration.seconds} expiredAt=${it.expiredAt} durSec=${sec}`);
            });
          } catch (e) {}
        }

        // Validation strategy for Turbo 5m:
        // - Prefer the 5th item (index 4) when available (platform exposes slots as 60s indices)
        // - If the preferred item exposes explicit expiration data that matches ~300s, use it
        // - Otherwise, if some other instrument explicitly reports ~300s, pick that one
        // - If none report expiration but the preferred index exists, accept it (platform uses index mapping)
        const validateExpiration = (item) => {
          const s = extractExpirationSec(item);
          if (typeof s === 'number' && Math.abs(s - 300) <= 8) return true;
          return false;
        };

        const preferredIndex = disp.length >= 5 ? 4 : Math.max(0, disp.length - 1);
        // If preferred has explicit matching expiration, keep it
        if (validateExpiration(disp[preferredIndex])) {
          idx = preferredIndex;
        } else {
          // Try to find any instrument that explicitly matches ~300s
          let found = -1;
          for (let i = 0; i < disp.length; i++) {
            if (validateExpiration(disp[i])) { found = i; break; }
          }
          if (found !== -1) {
            if (cfg.debugSignals) console.log(`[TURBO] seleccionado idx ${found+1} porque indica expiraci\xF3n ~300s`);
            idx = found;
          } else {
            // No explicit expirations found: fall back to preferred index (index-based mapping used by platform)
            idx = preferredIndex;
            if (cfg.debugSignals) console.log(`[TURBO] sin metadata de expiraci\xF3n, usando idx ${idx+1} por mapeo (5th slot)`);
          }
        }
      } else if (desiredSec === 60) {
        // Para 1m, preferir instrumento con expiración ~60s. Si no hay metadata explícita
        // usar un índice de fallback por mapeo (por defecto el primero).
        const nowMs = Date.now();
        let found = -1;
        for (let i = 0; i < disp.length; i++) {
          const item = disp[i];
          try {
            if (typeof item.expirationSize === "number" && Math.abs(item.expirationSize - 60) <= 1) { found = i; break; }
            if (typeof item.expirationSize === "string") {
              const n = Number(String(item.expirationSize).replace(/\D/g, ""));
              if (!isNaN(n) && Math.abs(n - 60) <= 1) { found = i; break; }
            }
            if (item.expiration && typeof item.expiration === "object") {
              if (typeof item.expiration.seconds === "number" && Math.abs(item.expiration.seconds - 60) <= 1) { found = i; break; }
              if (typeof item.expiration.size === "number" && Math.abs(item.expiration.size - 60) <= 1) { found = i; break; }
            }
            let durMs;
            if (item.expiredAt) {
              durMs = new Date(item.expiredAt).getTime() - nowMs;
            } else if (typeof item.durationRemainingForPurchase === "function") {
              try { durMs = item.durationRemainingForPurchase(new Date()); } catch { durMs = void 0; }
            }
            if (typeof durMs === "number" && isFinite(durMs)) {
              const durSec = Math.round(durMs / 1000);
              if (Math.abs(durSec - 60) <= 5) { found = i; break; }
            }
          } catch (e) { /* ignore */ }
        }
        if (disp.length === 0) return { ok: false, error: "Turbo no disponible" };
        if (found === -1) {
          const fallbackIdx = Math.max(0, Math.min(disp.length - 1, Number(cfg.turbo60IndexFallback ?? 0)));
          idx = fallbackIdx;
          try { console.log(`[TURBO] 60s sin metadata; usando idx ${idx + 1}/${disp.length} por mapeo`); } catch (e) {}
        } else {
          idx = found;
        }
      } else {
        idx = 0;
      }
      if (disp.length === 0 || disp.length <= idx) return { ok: false, error: `Turbo \xEDndice ${idx + 1} no disponible (disp=${disp.length})` };
      try {
        if (cfg.debugSignals) console.log(`[TURBO] picking instrument idx=${idx + 1}/${disp.length} tfSec=${desiredSec}`);
      } catch {}
      const r = await turbo.buy(disp[idx], dir, amount, balance);
      return { ok: true, id: r?.id ?? r, route: "TURBO" };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
  const tryBinary = async () => {
    if (!sdk.binaryOptions) return null;
    try {
      const bin = await sdk.binaryOptions();
      const act = bin.getActive(Number(activeId));
      if (!act) return null;
      const insts = await act.instruments();
      const disp = insts.getAvailableForBuyAt?.(now) || [];
      if (!disp.length) return null;
      // Selección robusta del instrumento BINARIO: elegir expiración acorde a tf deseado
      let idx = 0;
      const desiredSec = tfSec2;
      if (desiredSec) {
        const nowMs = Date.now();
        let found = -1;
        for (let i = 0; i < disp.length; i++) {
          const item = disp[i];
          try {
            if (typeof item.expirationSize === "number" && Math.abs(item.expirationSize - desiredSec) <= 2) { found = i; break; }
            if (typeof item.expirationSize === "string") {
              const n = Number(String(item.expirationSize).replace(/\D/g, ""));
              if (!isNaN(n) && Math.abs(n - desiredSec) <= 2) { found = i; break; }
            }
            if (item.expiration && typeof item.expiration === "object") {
              if (typeof item.expiration.seconds === "number" && Math.abs(item.expiration.seconds - desiredSec) <= 2) { found = i; break; }
              if (typeof item.expiration.size === "number" && Math.abs(item.expiration.size - desiredSec) <= 2) { found = i; break; }
            }
            let durMs;
            if (item.expiredAt) {
              durMs = new Date(item.expiredAt).getTime() - nowMs;
            } else if (typeof item.durationRemainingForPurchase === "function") {
              try { durMs = item.durationRemainingForPurchase(new Date()); } catch { durMs = void 0; }
            }
            if (typeof durMs === "number" && isFinite(durMs)) {
              const durSec = Math.round(durMs / 1000);
              if (Math.abs(durSec - desiredSec) <= 5) { found = i; break; }
            }
          } catch (e) { /* ignore and continue */ }
        }
        if (found !== -1) idx = found; else idx = 0;
      }
  try { if (cfg.debugSignals) console.log(`[BINARY] picking instrument idx=${idx + 1}/${disp.length} tfSec=${desiredSec}`); } catch {}
  const r = await bin.buy(disp[idx], dir, amount, balance);
      return { ok: true, id: r?.id ?? r, route: "BINARY" };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
  const tryDigital = async () => {
    if (!sdk.digitalOptions || cfg.useOnlyTurboBinary) return null;
    try {
      const dig = await sdk.digitalOptions();
      const unders = dig.getUnderlyingsAvailableForTradingAt?.(now) || [];
      const u = unders.find((x) => x.activeId === Number(activeId));
      if (!u) return null;
      const insts = await u.instruments();
      const disp = insts.getAvailableForBuyAt?.(now) || [];
      if (!disp.length) return null;
      const r = await dig.buySpotStrike(disp[0], dir, amount, balance);
      return { ok: true, id: r?.id ?? r, route: "DIGITAL" };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
  // Selección de ruta por timeframe: 1m -> TURBO, 5m -> BINARY (fallbacks cruzados)
  const expectedPayout = await getExpectedPayoutPct(sdk, ticker, tfSec2 === 60 ? "M1" : "M5", direction);
  // Payout guard desactivado a pedido: no bloquear por payout bajo
  let res = null;
  if (tfSec2 === 60) {
    // Para 1m, solo TURBO 60s. Si no hay, no operar para evitar expiraciones erróneas.
    res = await tryTurbo();
    if (!res?.ok) return { ok: false, error: "Sin expiración TURBO 60s" };
  } else if (tfSec2 === 300) {
    // Para 5m: intentar TURBO exclusivamente. Si TURBO no está disponible, abortar
    // en lugar de caer a Binary para evitar expiraciones incorrectas.
    res = await tryTurbo();
    if (!res?.ok) {
      try { console.log(`[${ticker}] TURBO 5m no disponible o no válido: ${res?.error || 'unknown'}. Abortar en lugar de usar BINARY.`); } catch (e) {}
      return { ok: false, error: "Sin expiración TURBO 300s" };
    }
  } else {
    // Por defecto intentar Turbo y luego Binary
    res = await tryTurbo();
    if (!res?.ok) res = await tryBinary();
  }
  const t = res;
  if (t?.ok) {
  const id = String(t.id ?? "TBD-" + Date.now());
    const openTime = Date.now();
    const timeframe = tfSec2 === 60 ? "M1" : "M5";
    const expirySec = expiryForTf(timeframe, cfg.expirySecPerTimeframe);
    const expectedCloseTs = openTime + expirySec * 1e3;
  openById.set(id, { id, ticker, timeframe, side: direction, amount, expectedPayoutPct: expectedPayout ?? null, openTime, expectedCloseTs, executionNumber: executionNumber || 1 });
    await reportOpen({ id, status: "OPEN", ticker, tf: timeframe, side: direction, amount, expectedPayoutPct: expectedPayout, openedAt: openTime });
    const GRACE_MS = 7e3;
    const ord = openById.get(id);
    ord.closeTimer = setTimeout(() => {
      const o = openById.get(id);
      if (!o) return;
      emitClosedWithRisk({ id: o.id, ticker: o.ticker, timeframe: o.timeframe, side: o.side, amount: o.amount, expectedPayoutPct: o.expectedPayoutPct, result: "UNKNOWN", profit: 0 });
    }, expirySec * 1e3 + GRACE_MS);
    const activeId2 = Number(t?.activeId ?? t?.active_id);
    if (activeId2) {
      const tk = ticker.toUpperCase();
      if (!activesById.has(activeId2)) activesById.set(activeId2, tk);
      if (!activesByTicker.has(tk)) activesByTicker.set(tk, activeId2);
    }
    return t;
  }
  // Si ambas rutas fallaron
  return { ok: false, error: "Sin expiraciones" };
  return { ok: false, error: "Sin expiraciones" };
}
async function pickBalance(sdk, type) {
  const balances = await sdk.balances();
  const arr = typeof balances.getBalances === "function" ? balances.getBalances() : balances;
  if (!arr.length) throw new Error("Sin balances");
  const wanted = type.toUpperCase();
  return arr.find((b) => String(b.type).toUpperCase().includes(wanted)) || arr[0];
}
async function getActivesMap(sdk, useOtc) {
  const map = /* @__PURE__ */ new Map();
  try {
    const turbo = await sdk.turboOptions();
    for (const a of turbo.getActives()) {
      const tk = String(a.ticker || "").toUpperCase();
  // Excluir instrumentos OTC del mapeo si no se usa OTC
  if (!useOtc && (/-OTC$/i.test(tk))) continue;
      map.set(tk, a.id);
    }
  } catch {
  }
  try {
    const bin = await sdk.binaryOptions();
    for (const a of bin.getActives()) {
      const tk = String(a.ticker || "").toUpperCase();
  // Excluir instrumentos OTC del mapeo si no se usa OTC
  if (!useOtc && (/-OTC$/i.test(tk))) continue;
      map.set(tk, a.id);
    }
  } catch {
  }
  return map;
}
async function tradeOnce({ sdk, activeId, ticker, amount, balance, cfg }) {
  const need = (cfg.maSlowPeriod ?? 34) + (cfg.signalPeriod ?? 5);
  const historyTarget = Math.max(cfg.minHistory1m ?? need * 5, need * 5);
  let candles1m = await getCandlesWithMinHistory(sdk, activeId, 60, historyTarget, { includeCurrent: cfg.useCurrentCandle }).catch(() => []);
  if (!candles1m.length) {
    candles1m = await getCandlesFlexible(sdk, activeId, cfg.candlesPerScan, 60, { includeCurrent: cfg.useCurrentCandle });
  }
  const closed1m = filterClosed(candles1m);
  if (cfg.debugSignals) console.log(`[SCAN] ${ticker} 1m closed=${closed1m.length}/${historyTarget}`);
  const frames = [];
  if (cfg.oneMinuteSignals) frames.push({ tf: "1m", candles: candles1m, closed: closed1m });
  if (cfg.fiveMinuteSignals) {
    const c5 = aggregateTo5m(candles1m);
    const closed5 = filterClosed(c5);
    if (cfg.debugSignals) console.log(`[SCAN] ${ticker} 5m closed=${closed5.length}`);
    frames.push({ tf: "5m", candles: c5, closed: closed5 });
  }
  for (const frame of frames) {
    const { tf, closed } = frame;
    if (closed.length < need) continue;
    // Log compacto de las últimas 2 velas (prev cerrada + actual en curso) con señal
    try {
      if (cfg.logLast2Compact) {
        const all = frame.candles || [];
        const current = all[all.length - 1];
        const prevClosed = closed[closed.length - 1];
        if (current && current.current && prevClosed) {
          const key2 = `${ticker}:${tf}:${current.to}`;
          if (!lastTwoCompactLogged.get(key2)) {
            // Señal en la previa cerrada
            let prevSig = null;
            try {
              const dsPrev = decideSignal(closed, cfg.maSource || "close", cfg.maFastPeriod || 1, cfg.maSlowPeriod || 34, cfg.signalPeriod || 5);
              if (dsPrev && dsPrev.signalIndex === closed.length - 1) prevSig = dsPrev.signal || null;
            } catch {}
            // Datos de tiempo concisos
            const prevToIso = new Date(prevClosed.to * 1000).toISOString();
            const curToIso = new Date(current.to * 1000).toISOString();
            const nowSec = Math.floor(Date.now() / 1e3);
            const progressSec = Math.max(0, nowSec - Math.floor(current.from));
            const remainSec = Math.max(0, Math.floor(current.to) - nowSec);
            console.log(`[LAST2] ${ticker} ${tf} prev to=${prevToIso} C=${prevClosed.close} sig=${prevSig ?? '-'} | curr to=${curToIso} C=${current.close} +${progressSec}s rem=${remainSec}s`);
            lastTwoCompactLogged.set(key2, true);
          }
        }
      }
    } catch {}
    // Log de vela anterior y en curso (una vez por vela) si está habilitado
    try {
      if (cfg.logLastCandles) {
        const all = frame.candles || [];
        const current = all[all.length - 1];
        const prevClosed = closed[closed.length - 1];
        if (current && current.current && prevClosed) {
          const key = `${ticker}:${tf}:${current.to}`;
          if (lastCandleViewLogged.get(key) !== true) {
            const isoPrevFrom = new Date(prevClosed.from * 1000).toISOString();
            const isoPrevTo = new Date(prevClosed.to * 1000).toISOString();
            const isoCurFrom = new Date(current.from * 1000).toISOString();
            const isoCurTo = new Date(current.to * 1000).toISOString();
            const nowSec = Math.floor(Date.now() / 1e3);
            const progressSec = Math.max(0, nowSec - Math.floor(current.from));
            const remainSec = Math.max(0, Math.floor(current.to) - nowSec);
            console.log(`[CANDLE] ${ticker} ${tf} prev from=${isoPrevFrom} to=${isoPrevTo} O=${prevClosed.open} H=${prevClosed.high} L=${prevClosed.low} C=${prevClosed.close}`);
            console.log(`[CANDLE] ${ticker} ${tf} curr from=${isoCurFrom} to=${isoCurTo} O=${current.open} H=${current.high} L=${current.low} C=${current.close} progress=${progressSec}s remain=${remainSec}s`);
            lastCandleViewLogged.set(key, true);
          }
        }
      }
    } catch {}
    const ds = decideSignal(closed, cfg.maSource || "close", cfg.maFastPeriod || 1, cfg.maSlowPeriod || 34, cfg.signalPeriod || 5);
    recordSignalSlot(ticker, tf, closed, ds, cfg);
    // Flujo LIVE deshabilitado: sólo señales de vela cerrada
    await tryExecuteSlot({ sdk, ticker, tf, closed, amount, activeId, balance, cfg });
  }
  return { lastClosed1mTo: closed1m.length ? closed1m[closed1m.length - 1].to : void 0 };
}
var emitClosedWithRisk = emitClosed;
async function main() {
  const cfg = loadConfig();
  CFG_REF = cfg;
  // Aplicar bandera para silenciar logs de cierres
  try { QUIET_CLOSED_LOGS = !!cfg.quietClosedLogs; } catch {}
  const ORDER_AMOUNT = Number(cfg.amount ?? 1);
  const TICKERS = Array.isArray(cfg.enabledTickers) ? cfg.enabledTickers : [];
  const TF1 = !!cfg.oneMinuteSignals;
  const TF5 = !!cfg.fiveMinuteSignals;
  const EXP_1M = Number(cfg?.expirySecPerTimeframe?.["1m"] ?? cfg?.expirySecPerTimeframe?.["M1"] ?? 60);
  const EXP_5M = Number(cfg?.expirySecPerTimeframe?.["5m"] ?? cfg?.expirySecPerTimeframe?.["M5"] ?? 300);
  const TAKE_PROFIT = cfg.takeProfit == null ? null : Math.max(0, Number(cfg.takeProfit));
  const STOP_LOSS = cfg.stopLoss == null ? null : Math.max(0, Number(cfg.stopLoss));
  const ONLY_TURBO = !!cfg.useOnlyTurboBinary;
  // Normalizar tickers según preferencia OTC
  const allowed = ["EURUSD", "EURJPY", "EURGBP", "EURAUD", "EURCAD", "EURCHF"];
  // Blocklist temporal de bases a ignorar (vacía por defecto: sin bloqueos)
  const blockedBases = new Set();
  const normList = (list) => {
    const uniqBase = Array.from(new Set((list || []).map((s) => String(s).replace(/-OTC$/i, "").toUpperCase()))).filter((t) => allowed.includes(t));
    const filtered = uniqBase.filter((t) => !blockedBases.has(t));
    return cfg.useOtc ? filtered.map((t) => `${t}-OTC`) : filtered;
  };
  if (process.env.BOT_TICKERS) {
    cfg.enabledTickers = normList(process.env.BOT_TICKERS.split(/[,;\s]+/).filter(Boolean));
  } else if (Array.isArray(cfg.enabledTickers)) {
    cfg.enabledTickers = normList(cfg.enabledTickers);
  }
  if (process.env.BOT_BROKER) cfg.broker = process.env.BOT_BROKER;
  const envBal = process.env.BOT_BALANCE_TYPE || process.env.BALANCE_TYPE;
  if (envBal) cfg.balanceType = /REAL/i.test(envBal) ? "REAL" : "DEMO";
  if (process.env.BOT_TICKERS) cfg.enabledTickers = process.env.BOT_TICKERS.split(/[,;\s]+/).filter(Boolean);
  // Aplicar normalización final y blocklist, incluso si vino de variables de entorno
  cfg.enabledTickers = normList(cfg.enabledTickers);
  if (process.env.ACCOUNT_ID) console.log("[BOT] ACCOUNT_ID", process.env.ACCOUNT_ID);
  if (process.env.BOT_TF) {
    const set = new Set(process.env.BOT_TF.split(/[,;\s]+/));
    cfg.oneMinuteSignals = set.has("1m");
    cfg.fiveMinuteSignals = set.has("5m");
  }
  if (process.env.BOT_AMOUNT) {
    const n = Number(process.env.BOT_AMOUNT);
    if (!isNaN(n) && n > 0) cfg.amount = n;
  }
  if (process.env.BOT_TP) {
    const n = Number(process.env.BOT_TP);
    if (!isNaN(n)) cfg.takeProfit = n;
  }
  if (process.env.BOT_SL) {
    const n = Number(process.env.BOT_SL);
    if (!isNaN(n)) cfg.stopLoss = n;
  }
  cfg.simMode = false;
  // ===================== POLITICA INMUTABLE =====================
  // Las siguientes opciones se fijan obligatoriamente aquí y se ignoran
  // valores provenientes del archivo de configuración o variables de entorno.
  // El usuario NO podrá modificarlas en tiempo de ejecución.
  try {
    cfg.confirm1m = true;
    cfg.confirm5m = true;
    cfg.useCurrentCandle = true;
    // Forzar uso exclusivo de TURBO/BINARY-TURBO, impedir DIGITAL/BINARY
    cfg.useOnlyTurboBinary = true;
    // Asegurar que maxPlacementDelaySec no descarte los waits requeridos
    // (espera requerida 5m = 330s). Ponemos al menos 1 hora para seguridad.
    cfg.maxPlacementDelaySec = Math.max(Number(cfg.maxPlacementDelaySec || 0), 3600);
    // Margen mínimo para ejecutar señales LIVE inmediatamente (sino, esperar confirmación)
    cfg.liveImmediateMinLeadSec = Math.max(0, Number(cfg.liveImmediateMinLeadSec ?? 2));
    // Activar escaneo de precisión para lanzar ciclo justo en cierres
    cfg.precisionCloseScan = true;
    if (cfg.minPrecisionDelayMs == null) cfg.minPrecisionDelayMs = 25;
    if (cfg.precisionExtraMs == null) cfg.precisionExtraMs = 80;
    // Evitar órdenes duplicadas por vela y condiciones de carrera
    cfg.strictOnePerCandle = true;
  } catch (e) {
    // no debe fallar, pero en caso de error dejaremos los valores por defecto.
  }
  // Ajustes de efectividad: mid vivo, sin close-fallback, hold+cross, spread y payout minimo
  try {
    cfg.retrace50 = cfg.retrace50 || {};
    cfg.retrace50.requireLiveMid = true;
    cfg.retrace50.allowCloseFallback = false;
    cfg.retrace50.fallbackToCloseAfterMs = 0;
    cfg.retrace50.crossMidOnly = true;
    if (cfg.retrace50.holdMs == null || cfg.retrace50.holdMs < 5000) cfg.retrace50.holdMs = 5000;
    if (cfg.retrace50.maxSpreadPips == null) cfg.retrace50.maxSpreadPips = 1.2;
    if (cfg.minPayoutPct == null) cfg.minPayoutPct = 0.8;
    if (cfg.lossCooldownMinLosses == null) cfg.lossCooldownMinLosses = 2;
    if (cfg.lossCooldownSec == null) cfg.lossCooldownSec = 900;
  } catch (e) {}
  if (process.env.BOT_EMAIL) cfg.email = process.env.BOT_EMAIL;
  if (process.env.BOT_PASS) cfg.password = process.env.BOT_PASS;
  if ((!cfg.email || !cfg.password) && !cfg.simMode) {
    console.error("[INIT] Faltan credenciales (email/password). Configure v\xEDa variables BOT_EMAIL y BOT_PASS o archivo config.");
    process.exit(1);
  }
  console.log("=== BOT R\xC9PLICA ===");
  console.log("Broker:", cfg.broker, "| Balance Type:", cfg.balanceType, "| Monto:", cfg.amount);
  console.log("[bot] enabledTickers:", Array.isArray(cfg.enabledTickers) ? cfg.enabledTickers : []);
  try {
  await report("config", { amount: ORDER_AMOUNT, enabledTickers: cfg.enabledTickers || [], oneMinuteSignals: TF1, fiveMinuteSignals: TF5, expirySecPerTimeframe: { "1m": EXP_1M, "5m": EXP_5M }, takeProfit: TAKE_PROFIT, stopLoss: STOP_LOSS, useOnlyTurboBinary: ONLY_TURBO, balanceType: cfg.balanceType, useOtc: !!cfg.useOtc });
  } catch {
  }
  console.log("Se\xF1ales => 1m:", cfg.oneMinuteSignals, " 5m:", cfg.fiveMinuteSignals, " confirm1m: true (fijo)", " confirm5m: true (fijo)");
  const DEFAULT_ENDPOINTS = {
    exnova: { WS: "wss://ws.trade.exnova.com/echo/websocket", API: "https://api.trade.exnova.com", PLATFORM_ID: 125 },
    iqoption: { WS: "wss://iqoption.com/echo/websocket", API: "https://api.iqoption.com", PLATFORM_ID: 15 }
  };
  // Normalizar identificador de broker para aceptar variantes como "iq option", "IQ Option", etc.
  const brokerKeyNorm = String(cfg.broker || "").toLowerCase().replace(/\s+/g, "");
  const endpointDef = DEFAULT_ENDPOINTS[brokerKeyNorm];
  if (!endpointDef) throw new Error("Broker no soportado");
  const brokerConf = {
    WS: process.env.API_URL || endpointDef.WS,
    API: process.env.HTTP_API_URL || endpointDef.API,
    PLATFORM_ID: Number(process.env.PLATFORM_ID || endpointDef.PLATFORM_ID)
  };
  if (!brokerConf.WS || !brokerConf.API || isNaN(brokerConf.PLATFORM_ID)) {
    throw new Error("Endpoints/PLATFORM_ID inv\xE1lidos");
  }
  let sdk;
  let balance;
  let sdkConnectAttempts = 0;
  async function connectSdk() {
    sdkConnectAttempts++;
    const auth = new LoginPasswordAuthMethod(brokerConf.API, cfg.email, cfg.password);
    console.log("[CONNECT attempt]", sdkConnectAttempts, brokerConf.API, "WS=", brokerConf.WS, "PID=", brokerConf.PLATFORM_ID);
    sdk = await ClientSdk.create(brokerConf.WS, brokerConf.PLATFORM_ID, auth);
    balance = await pickBalance(sdk, cfg.balanceType);
  await buildActivesMap(sdk, !!cfg.useOtc);
    await wireCloseUpdates(sdk);
  }
  if (cfg.simMode) {
    console.log("[SIM] Usando SDK simulado.");
    sdk = { candles: async () => ({ getCandles: async (_id, size, opts) => {
      const total = Number(opts?.count || 100);
      const now = Math.floor(Date.now() / 1e3);
      const inc = !opts?.onlyClosed;
      const out = [];
      let base = 1.1;
      for (let i = 0; i < total; i++) {
        const to = now - (total - 1 - i) * size;
        const from = to - size;
        const open = base + (Math.random() - 0.5) * 2e-4;
        const close = open + (Math.random() - 0.5) * 4e-4;
        const high = Math.max(open, close) + Math.random() * 2e-4;
        const low = Math.min(open, close) - Math.random() * 2e-4;
        out.push({ from, to, open, high, low, close, current: inc && i === total - 1 });
        base = close;
      }
      return out;
    } }), turboOptions: async () => ({ getActives: () => (cfg.enabledTickers || []).map((t, i) => ({ ticker: t, id: i + 1 })), getActive(id) {
      return { id, instruments: async () => ({ getAvailableForBuyAt: () => [] }) };
    } }), binaryOptions: async () => ({ getActives: () => (cfg.enabledTickers || []).map((t, i) => ({ ticker: t, id: i + 1 })), getActive(id) {
      return { id, instruments: async () => ({ getAvailableForBuyAt: () => [] }) };
    } }), digitalOptions: async () => ({ getUnderlyingsAvailableForTradingAt: () => [] }), balances: async () => [{ id: "SIM", amount: 1e4, type: "DEMO" }] };
    balance = (await sdk.balances())[0];
  } else {
    try {
      await connectSdk();
    } catch (e) {
      console.log("[SDK] Error conexi\xF3n real:", e?.message);
      console.log("[SIM] Fallback simulado.");
      cfg.simMode = true;
      return main();
    }
  }
  console.log(`Balance ID=${balance.id} Amount=${balance.amount}`);
  const actives = await getActivesMap(sdk, !!cfg.useOtc);
  function resolveActiveId(map, requested, useOtcFlag){
    const base = String(requested).replace(/-OTC$/i, "").toUpperCase();
    const candidates = useOtcFlag ? [ `${base}-OTC`, base ] : [ base, `${base}-OTC` ];
    for (const c of candidates){
      const id = map.get(c);
      if (id) return { id, ticker: c };
    }
    try {
      // Fallback: escanear claves conocidas del mapa
      const keys = Array.from(map.keys());
      // 1) Coincidencia exacta case-insensitive
      const exact = keys.find(k => k.toUpperCase() === (useOtcFlag ? `${base}-OTC` : base));
      if (exact) return { id: map.get(exact), ticker: exact };
      // 2) Preferir claves que incluyan base y respete presencia de OTC
      const wantOtc = useOtcFlag;
      const k2 = keys.find(k => {
        const KU = k.toUpperCase();
        const hasOtc = /-OTC$/i.test(KU);
        if (wantOtc && !hasOtc) return false;
        if (!wantOtc && hasOtc) return false;
        return KU.replace(/-OTC$/i, "").includes(base);
      });
      if (k2) return { id: map.get(k2), ticker: k2 };
      // 3) Cualquier clave que contenga base, como último recurso
      const k3 = keys.find(k => k.toUpperCase().includes(base));
      if (k3) return { id: map.get(k3), ticker: k3 };
    } catch {}
    return { id: undefined, ticker: useOtcFlag ? `${base}-OTC` : base };
  }
  const pairs = (cfg.enabledTickers || []).map((t) => {
    const r = resolveActiveId(actives, t, !!cfg.useOtc);
    return { ticker: r.ticker, id: r.id };
  }).filter((p) => p.id);
  if (!pairs.length) {
    try {
      console.log("[bot] Sin actives para enabledTickers seleccionados.");
      const keys = Array.from(actives.keys());
      const total = keys.length;
      const otcCount = keys.filter((k) => /-OTC$/i.test(k)).length;
      const sample = keys.slice(0, Math.min(30, keys.length));
      console.log(`[bot] Actives disponibles: total=${total} (OTC=${otcCount}) sample=`, sample.join(","));
      const wantedBases = Array.from(new Set((cfg.enabledTickers || []).map((s) => String(s).replace(/-OTC$/i, "").toUpperCase())));
      const matches = keys.filter((k) => {
        const ku = k.toUpperCase().replace(/-OTC$/i, "");
        return wantedBases.some((w) => ku.includes(w));
      }).slice(0, 30);
      if (matches.length) console.log("[bot] Claves que contienen bases pedidas:", matches.join(","));
    } catch {}
    process.exit(1);
  }
  console.log("[bot] pairs activos:", pairs.map((p) => p.ticker).join(","));
  if (cfg.testMode) {
    console.log("[TEST] Mostrando expiraciones turbo del primer par y saliendo...");
    try {
      const p = pairs[0];
      const turbo = await sdk.turboOptions();
      const act = turbo.getActive(Number(p.id));
      if (act && act.instruments) {
        const inst = await act.instruments();
        const disp = inst.getAvailableForBuyAt?.(/* @__PURE__ */ new Date()) || [];
        disp.slice(0, 6).forEach((x, i) => console.log(`#${i + 1}`, x));
      }
    } catch (e) {
      console.log("[TEST] Error", e?.message);
    }
    process.exit(0);
  }
  const startAmount = balance.amount;
  let lastAmount = startAmount;
  let metricTick = 0;
  START_BALANCE = startAmount;
  LAST_BALANCE = lastAmount;
  const precisionTimers = /* @__PURE__ */ new Map();
  function schedulePrecision(pair, lastClosedTo) {
    if (!cfg.precisionCloseScan || !lastClosedTo) return;
    // Programar precisión tanto para 1m como para 5m
    const steps = [];
    if (cfg.oneMinuteSignals) steps.push(60);
    if (cfg.fiveMinuteSignals) steps.push(300);
    if (!steps.length) return;
    const nowSec = Date.now() / 1e3;
    const extra = cfg.precisionExtraMs ?? 80;
    const minDelay = cfg.minPrecisionDelayMs ?? 25;
    for (const step of steps) {
      const nextClose = lastClosedTo + step;
      let delayMs = (nextClose - nowSec) * 1e3 + extra;
      if (delayMs < minDelay) delayMs = minDelay;
      const key = `${pair.ticker}|${step}`;
      if (precisionTimers.has(key)) clearTimeout(precisionTimers.get(key));
      precisionTimers.set(key, setTimeout(async () => {
        try {
          await tradeOnce({ sdk, activeId: pair.id, ticker: pair.ticker, amount: cfg.amount, balance, cfg });
        } catch (e) {
          if (cfg.debugSignals) console.log(`[${pair.ticker}] precision error`, e?.message);
        }
      }, delayMs));
    }
  }
  class SessionRisk {
    constructor(tp, sl) {
      this.tp = tp;
      this.sl = sl;
      this.pnl = 0;
    }
    add(p) {
      this.pnl += Number(p || 0);
    }
    exceeded() {
      if (this.tp != null && this.pnl >= this.tp) return { reason: "takeProfit", pnl: this.pnl };
      if (this.sl != null && this.pnl <= -this.sl) return { reason: "stopLoss", pnl: this.pnl };
      return null;
    }
  }
  const risk = new SessionRisk(TAKE_PROFIT, STOP_LOSS);
  emitClosedWithRisk = async (raw) => {
    await emitClosed(raw);
    if (raw?.profit != null) {
      risk.add(raw.profit);
      const hit = risk.exceeded();
      if (hit) {
        try {
          await report("metric", { risk: { ...hit, tp: TAKE_PROFIT, sl: STOP_LOSS } });
        } catch {
        }
        try {
          await fetch(`${DASH_URL}/api/executions`, { method: "POST", headers: { "Content-Type": "application/json", "x-sse-token": SSE_TOKEN }, body: JSON.stringify({ botId: BOT_ID, type: "risk_stop", ...hit, tp: TAKE_PROFIT, sl: STOP_LOSS }) });
        } catch {
        }
        setTimeout(() => process.exit(0), 300);
      }
    }
  };
  let consecutiveWsErrors = 0;
  while (true) {
    if (cfg.heartbeatSec) {
      const nowSec = Math.floor(Date.now() / 1e3);
      if (nowSec % cfg.heartbeatSec === 0) {
        console.log(`[HEARTBEAT] ${(/* @__PURE__ */ new Date()).toISOString()} pendientes=${pendingByKey.size}`);
      }
    }
    const exceeded = risk.exceeded();
    if (exceeded) {
      console.log("[RISK] Stop por", exceeded.reason, "PnL=", exceeded.pnl.toFixed(2));
      break;
    }
    try {
      await pollForClosed(sdk);
    } catch {
    }
    for (const p of pairs) {
      try {
        if (risk.exceeded()) {
          break;
        }
        const res = await tradeOnce({ sdk, activeId: p.id, ticker: p.ticker, amount: ORDER_AMOUNT, balance, cfg });
        schedulePrecision(p, res.lastClosed1mTo);
      } catch (e) {
        const msg = e?.message || "";
        console.log(`[${p.ticker}] error ciclo:`, msg);
        if (/WebSocket is not open/i.test(msg)) {
          consecutiveWsErrors++;
        } else {
          consecutiveWsErrors = 0;
        }
      }
      await new Promise((r) => setTimeout(r, cfg.scanIntervalMs));
    }
    if (consecutiveWsErrors >= pairs.length) {
      console.log("[WS] Detectados errores de WS consecutivos, intentando reconectar...");
      try {
        if (typeof sdk?.shutdown === "function") await sdk.shutdown();
      } catch {
      }
      try {
        await connectSdk();
        consecutiveWsErrors = 0;
        console.log("[WS] Reconexion exitosa");
      } catch (e) {
        console.log("[WS] Reconexion fallida:", e?.message || e);
      }
    }
    metricTick++;
    if (metricTick % 40 === 0) {
      try {
        const balances = await sdk.balances();
        const b = balances.find((x) => x.id === balance.id) || balances[0];
        if (b) {
          lastAmount = b.amount;
          LAST_BALANCE = lastAmount;
          const pnl = lastAmount - startAmount;
          console.log(`[METRIC] balance=${lastAmount} pnl=${pnl} start=${startAmount}`);
          await report("metric", { counts: { wins: WIN_COUNT, losses: LOSS_COUNT, draws: DRAW_COUNT, total: WIN_COUNT + LOSS_COUNT + DRAW_COUNT }, balance: { start: startAmount, current: lastAmount, pnl } });
        }
      } catch {
      }
    }
    if (cfg.simMode) {
      console.log("SIM loop \xFAnico. Salir.");
      break;
    }
    try {
      const balances = await sdk.balances();
      const b = balances.find((x) => x.id === balance.id) || balances[0];
      if (b) {
        lastAmount = b.amount;
        LAST_BALANCE = lastAmount;
      }
      const pnl = lastAmount - startAmount;
      if (TAKE_PROFIT != null && pnl >= TAKE_PROFIT) {
        console.log(`[TP] +${pnl}. Stop.`);
        break;
      }
      if (STOP_LOSS != null && pnl <= -STOP_LOSS) {
        console.log(`[SL] ${pnl}. Stop.`);
        break;
      }
    } catch {
    }
  }
  console.log("Bot finalizado.");
  process.exit(0);
}
// --------------------------------------------------------------
// Modificación: leer credenciales seguras desde stdin (primera línea JSON)
// Formato esperado: { broker, email, password }
// Si no llegan credenciales en 5s, continuar con variables de entorno (modo legacy)
// --------------------------------------------------------------
const readline = require('readline');
let __booted = false;
function bootWithInjectedCreds(line){
  if (__booted) return; __booted = true;
  try {
    if (line) {
      try {
        const parsed = JSON.parse(line);
        if (parsed && typeof parsed === 'object') {
          if (parsed.email && !process.env.BOT_EMAIL) process.env.BOT_EMAIL = String(parsed.email);
          if (parsed.password && !process.env.BOT_PASS) process.env.BOT_PASS = String(parsed.password);
          if (parsed.broker && !process.env.BOT_BROKER) process.env.BOT_BROKER = String(parsed.broker);
        }
      } catch (e) {
        console.error('[STDIN] JSON inválido:', e?.message || e);
      }
    }
    console.log('READY');
    main().catch((e) => {
      console.error('Fatal:', e);
      process.exit(1);
    });
  } catch (e) {
    console.error('[BOOT] fallo inicialización', e?.message || e);
    process.exit(1);
  }
}
try {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  const timer = setTimeout(() => {
    rl.close();
    if (!__booted) bootWithInjectedCreds(null);
  }, 5000);
  rl.once('line', (l) => {
    clearTimeout(timer);
    rl.close();
    bootWithInjectedCreds(l);
  });
  rl.on('error', () => {
    clearTimeout(timer);
    if (!__booted) bootWithInjectedCreds(null);
  });
} catch (e) {
  // Si readline falla, fallback directo
  if (!__booted) bootWithInjectedCreds(null);
}
