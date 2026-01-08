"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEndpointsFor = resolveEndpointsFor;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Nota: se agregó fallback de accountId=userId y endpoint /api/auth/authorized/raw para diagnóstico de licencias.
// Localización robusta del script del bot empaquetado
function resolveBotPath() {
    const candidates = [
        path_1.default.resolve(__dirname, 'bot', 'replica_bot.js'),
        path_1.default.resolve(process.cwd(), 'dist-server', 'bot', 'replica_bot.js'),
        // Cuando se ejecuta desde raíz pero el bundle empaquetado vive en app/dist-server
        path_1.default.resolve(process.cwd(), 'app', 'dist-server', 'bot', 'replica_bot.js'),
        path_1.default.join(path_1.default.dirname(process.execPath || ''), 'resources', 'app.asar.unpacked', 'dist-server', 'bot', 'replica_bot.js'),
        path_1.default.join(path_1.default.dirname(process.execPath || ''), 'resources', 'app', 'dist-server', 'bot', 'replica_bot.js'),
    ];
    for (const c of candidates) {
        try {
            if (fs_1.default.existsSync(c))
                return c;
        }
        catch { }
    }
    return candidates[0];
}
try {
    console.log('[DASH] botPath detectado =', resolveBotPath());
}
catch { }
// IMPORT CORREGIDO: estaba '../sdk_adapter' y en build dist-server/server.js quedaba require("../sdk_adapter") apuntando fuera del directorio, causando fallo al arrancar empaquetado.
// Debe ser './sdk_adapter' porque sdk_adapter.ts se compila al mismo folder dist-server.
// Ensure sdk_adapter.ts exists in the same directory or update the path accordingly.
// Carga dinámica tolerante del adaptador SDK (soporta ubicaciones ./sdk_adapter y ../sdk_adapter)
// Evita error TS2307 si el archivo no es resuelto por el lenguaje durante edición.
// eslint-disable-next-line @typescript-eslint/no-var-requires
let getSdkExports;
try {
    // Preferir mismo directorio (build plano dist-server)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    getSdkExports = require('./sdk_adapter').getSdkExports;
}
catch {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        getSdkExports = require('../sdk_adapter').getSdkExports;
    }
    catch (e) {
        throw new Error('No se pudo cargar sdk_adapter: ' + e?.message);
    }
}
try {
    console.log('[DASH]init sdk_adapter OK keys=', Object.keys(getSdkExports?.() || {}));
    // Crear marcador de inicio para diagnóstico rápido (se borra en nuevos runs, no crítico si falla)
    try {
        const marker = path_1.default.resolve(__dirname, 'server.started.' + process.pid + '.txt');
        fs_1.default.writeFileSync(marker, new Date().toISOString(), 'utf8');
    }
    catch { }
}
catch (e) {
    console.warn('[DASH]init sdk_adapter error post-load', e?.message);
}
const https_1 = __importDefault(require("https"));
const dns_1 = __importDefault(require("dns"));
// === Endpoints fijos por broker ===
const BROKER_ENDPOINTS = {
    exnova: { http: 'https://api.trade.exnova.com', ws: 'wss://ws.trade.exnova.com/echo/websocket', pid: 125, referer: 'https://trade.exnova.com', origin: 'https://trade.exnova.com' },
    iqoption: { http: 'https://iqoption.com', ws: 'wss://iqoption.com/echo/websocket', pid: 9, referer: 'https://iqoption.com', origin: 'https://iqoption.com' }
};
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT ?? process.env.DASH_PORT ?? 3000);
// Resolución robusta de STATIC_ROOT: en ejecución empaquetada puede variar la estructura.
let STATIC_ROOT = process.env.STATIC_ROOT || path_1.default.resolve(__dirname, '../../app/dist-react');
try {
    const candidates = Array.from(new Set([
        process.env.STATIC_ROOT,
        // relativa típica cuando se copia dashboard -> dist-server
        path_1.default.resolve(__dirname, '../dist-react'),
        path_1.default.resolve(__dirname, '../../dist-react'),
        path_1.default.resolve(__dirname, 'dist-react'),
        path_1.default.resolve(process.cwd(), 'dist-react'),
        process.resourcesPath ? path_1.default.join(process.resourcesPath, 'app', 'dist-react') : undefined,
        process.resourcesPath ? path_1.default.join(process.resourcesPath, 'dist-react') : undefined,
        // dentro del asar (cuando solo existe empaquetado)
        process.resourcesPath ? path_1.default.join(process.resourcesPath, 'app.asar', 'dist-react') : undefined,
        process.resourcesPath ? path_1.default.join(process.resourcesPath, 'app.asar', 'app', 'dist-react') : undefined,
    ].filter(Boolean)));
    const found = candidates.find(p => { try {
        return fs_1.default.existsSync(p) && fs_1.default.statSync(p).isDirectory();
    }
    catch {
        return false;
    } });
    if (found) {
        if (found !== STATIC_ROOT)
            console.log('[DASH] STATIC_ROOT resolved ->', found);
        STATIC_ROOT = found;
    }
    else {
        console.warn('[DASH] STATIC_ROOT no encontrado, usando (posible inválido):', STATIC_ROOT);
    }
    try {
        console.log('[DASH] STATIC_ROOT final =', STATIC_ROOT);
    }
    catch { }
}
catch (e) {
    console.warn('[DASH] Error resolviendo STATIC_ROOT', e?.message || e);
}
app.use((0, cors_1.default)({ origin: '*', credentials: false }));
app.use(express_1.default.json());
// Auto-salida opcional por inactividad (control simple a nivel HTTP)
// Forzado a 0 en entorno de desarrollo local para evitar salidas tempranas
const __idleSec = 0; // Number(process.env.AUTO_EXIT_IDLE_SEC || 0);
let __lastActivity = Date.now();
if (__idleSec > 0) {
    console.log('[DASH] AUTO_EXIT_IDLE_SEC habilitado', __idleSec, 's');
    app.use((req, _res, next) => { __lastActivity = Date.now(); next(); });
    setInterval(() => {
        if (Date.now() - __lastActivity > __idleSec * 1000) {
            console.log('[DASH] Exit por inactividad', __idleSec, 's');
            process.exit(0);
        }
    }, Math.min(30000, Math.max(5000, __idleSec * 500)));
}
// --- Wrapper global fetch: añade UA / Accept / Origin para dominios exnova & iqoption y log breve ante HTML inesperado ---
try {
    const origFetch = globalThis.fetch;
    if (origFetch) {
        globalThis.fetch = async (url, init = {}) => {
            try {
                const u = typeof url === 'string' ? url : (url?.url || '');
                if (typeof u === 'string' && (u.includes('exnova.com') || u.includes('iqoption.com'))) {
                    const h = { ...(init.headers || {}) };
                    if (!h['User-Agent'] && !h['user-agent'])
                        h['User-Agent'] = process.env.LOGIN_UA || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36';
                    if (!h['Accept'] && !h['accept'])
                        h['Accept'] = 'application/json, text/plain, */*';
                    if (!h['Accept-Language'] && !h['accept-language'])
                        h['Accept-Language'] = 'es-ES,es;q=0.9,en;q=0.8';
                    if (u.includes('exnova.com')) {
                        if (!h['Origin'] && !h['origin'])
                            h['Origin'] = 'https://trade.exnova.com';
                        if (!h['Referer'] && !h['referer'])
                            h['Referer'] = 'https://trade.exnova.com/';
                    }
                    if (u.includes('iqoption.com')) {
                        if (!h['Origin'] && !h['origin'])
                            h['Origin'] = 'https://iqoption.com';
                        if (!h['Referer'] && !h['referer'])
                            h['Referer'] = 'https://iqoption.com/';
                    }
                    init.headers = h;
                }
            }
            catch { }
            const resp = await origFetch(url, init);
            try {
                const ct = resp.headers.get('content-type') || '';
                if (ct.includes('text/html')) {
                    const clone = resp.clone();
                    const txt = await clone.text();
                    const snippet = txt.slice(0, 120).replace(/\s+/g, ' ');
                    console.warn('[fetch-html]', typeof url === 'string' ? url : (url?.url || ''), '-> HTML snippet:', snippet);
                }
            }
            catch { }
            return resp;
        };
    }
}
catch { }
// Manejadores globales para evitar caída silenciosa
process.on('unhandledRejection', (reason) => {
    console.error('[FATAL] UnhandledRejection', reason?.stack || reason);
});
process.on('uncaughtException', (err) => {
    console.error('[FATAL] UncaughtException', err?.stack || err);
});
// === Normalización EUR (brief) ===
const EUR_REAL = ['EURUSD', 'EURJPY', 'EURGBP', 'EURAUD', 'EURCAD', 'EURCHF'];
function normalizeTickers(input, useOtc) {
    const base = Array.isArray(input) ? input : [];
    const filtered = base
        .map(String)
        .map(s => s.replace(/-OTC$/i, ''))
        .filter((p) => EUR_REAL.includes(p));
    const out = useOtc ? filtered.map(p => `${p}-OTC`) : filtered;
    return Array.from(new Set(out));
}
// Sanea lista posiblemente mezclada (alguien guardó con y sin -OTC) respetando flag actual
function sanitizeTickersMixed(input, useOtc) {
    if (!Array.isArray(input))
        return [];
    const stripped = input.map((s) => String(s).replace(/-OTC$/i, '')).filter(s => EUR_REAL.includes(s));
    const uniq = Array.from(new Set(stripped));
    return useOtc ? uniq.map(p => `${p}-OTC`) : uniq;
}
function mergeConfig(base, override) {
    const out = { ...base, ...override };
    if (override && 'enabledTickers' in override) {
        out.enabledTickers = override.enabledTickers; // reemplazo total
    }
    return out;
}
function toNumberOrUndef(v) { const n = Number(v); return Number.isFinite(n) ? n : undefined; }
const BASE_LOGS = process.env.BOT_LOG_DIR || path_1.default.resolve(process.cwd(), 'logs');
if (!fs_1.default.existsSync(BASE_LOGS))
    try {
        fs_1.default.mkdirSync(BASE_LOGS, { recursive: true });
    }
    catch { }
const EXEC_LOG = path_1.default.resolve(BASE_LOGS, 'executions.log');
// SSE HMAC secret
const SSE_SECRET = process.env.SSE_SECRET || 'dev-secret';
function sign(payload) {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto_1.default.createHmac('sha256', SSE_SECRET).update(data).digest('base64url');
    return `${data}.${sig}`;
}
function verify(token) {
    const parts = String(token || '').split('.');
    if (parts.length !== 2)
        throw new Error('bad token');
    const [data, sig] = parts;
    const expect = crypto_1.default.createHmac('sha256', SSE_SECRET).update(data).digest('base64url');
    if (sig !== expect)
        throw new Error('bad sig');
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp)
        throw new Error('expired');
    return payload;
}
function normType(v) {
    const s = String(v || '').toUpperCase();
    if (s.includes('REAL'))
        return 'REAL';
    if (s.includes('PRACTICE') || s.includes('DEMO'))
        return 'DEMO';
    if (s.includes('TOURNAMENT'))
        return 'TOURNAMENT';
    return 'UNKNOWN';
}
async function fetchNormalizedBalances(client) {
    // 1) client.balances()?.getBalances?.() o array directo
    try {
        const b1 = await client.balances?.();
        const arr = await (typeof b1?.getBalances === 'function' ? b1.getBalances() : (Array.isArray(b1) ? b1 : null));
        if (Array.isArray(arr) && arr.length) {
            return arr.map((x) => ({
                type: normType(x.type ?? x.name ?? x.kind),
                id: x.id ?? x.balance_id ?? x._id,
                currency: x.currency ?? x.curr,
                available: Number(x.available ?? x.amount ?? x.balance ?? x.value ?? 0)
            })).filter(x => x.available !== undefined);
        }
    }
    catch { }
    // 2) client.getBalances?.()
    try {
        const arr = await client.getBalances?.();
        if (Array.isArray(arr) && arr.length) {
            return arr.map((x) => ({
                type: normType(x.type ?? x.name ?? x.kind),
                id: x.id ?? x.balance_id ?? x._id,
                currency: x.currency ?? x.curr,
                available: Number(x.available ?? x.amount ?? x.balance ?? x.value ?? 0)
            }));
        }
    }
    catch { }
    // 3) profile: account/profile/userProfile
    try {
        const prof = client.account ?? client.profile ?? await client.userProfile?.();
        const arr = prof?.balances;
        if (Array.isArray(arr) && arr.length) {
            return arr.map((x) => ({
                type: normType(x.type ?? x.name ?? x.kind),
                id: x.id ?? x.balance_id ?? x._id,
                currency: x.currency ?? x.curr,
                available: Number(x.available ?? x.amount ?? x.balance ?? x.value ?? 0)
            }));
        }
    }
    catch { }
    return [];
}
function pickBalance(list, want) {
    if (!list.length)
        return undefined;
    if (want) {
        const m = list.find(b => b.type === want);
        if (m)
            return m;
    }
    return list.find(b => b.type === 'REAL') ?? list.find(b => b.type === 'DEMO') ?? list[0];
}
let AUTH_CACHE = { ts: 0, list: [] };
const AUTH_FILE = path_1.default.resolve(process.cwd(), 'licenses', 'authorized.json');
const AUTH_TTL_MS = 15000; // recargar cada 15s como máximo
function loadAuthorized() {
    const now = Date.now();
    if (now - AUTH_CACHE.ts < AUTH_TTL_MS)
        return AUTH_CACHE.list;
    try {
        const raw = fs_1.default.readFileSync(AUTH_FILE, 'utf-8');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
            AUTH_CACHE = { ts: now, list: arr };
            return AUTH_CACHE.list;
        }
    }
    catch { /* ignore */ }
    AUTH_CACHE = { ts: now, list: [] };
    return [];
}
function isAuthorized(broker, accountId) {
    if (process.env.DISABLE_AUTHZ === '1')
        return { ok: true };
    const list = loadAuthorized();
    // Nueva regla: si hay lista con elementos y REQUIRE_AUTHZ != '0', se exige siempre.
    const require = process.env.REQUIRE_AUTHZ === '1' || (list.length > 0 && process.env.REQUIRE_AUTHZ !== '0');
    if (!list.length) {
        return require ? { ok: false, reason: 'lista de autorizados vacía' } : { ok: true };
    }
    const idStr = String(accountId);
    const now = Date.now();
    const hit = list.find(e => e.id === idStr && (!e.broker || e.broker.toLowerCase() === broker.toLowerCase()));
    if (!hit)
        return { ok: false, reason: 'accountId no autorizado' };
    if (hit.expires) {
        const expMs = Date.parse(hit.expires);
        if (!isNaN(expMs) && expMs < now)
            return { ok: false, reason: 'licencia expirada' };
    }
    return { ok: true };
}
function resolveEndpointsFor(broker) {
    const b = (broker || '').trim().toLowerCase();
    if (b === 'exnova')
        return { http: process.env.EXNOVA_HTTP || 'https://api.trade.exnova.com', ws: process.env.EXNOVA_WS || 'wss://ws.trade.exnova.com/echo/websocket', platformId: 125 };
    if (b === 'iq option' || b === 'iqoption' || b === 'iq')
        return { http: 'https://iqoption.com', ws: 'wss://iqoption.com/echo/websocket', platformId: 9 };
    return { http: broker, ws: '', platformId: 125 };
}
// Implementación simplificada (sin prelogin) usada por todas las rutas
async function createClientExactSignature({ broker, email, password }) {
    const { ClientSdk, LoginPasswordAuthMethod, SsidAuthMethod } = getSdkExports();
    const ep = resolveEndpointsFor(broker);
    if (!ep.ws)
        throw new Error('Endpoint WS no definido para broker');
    const lower = broker.toLowerCase();
    // Bases HTTP candidatas (iqoption: probar variante /api)
    const httpBases = (() => {
        const list = [ep.http];
        if (lower.startsWith('iq') && !/\/api\/?$/.test(ep.http))
            list.push(ep.http.replace(/\/$/, '') + '/api');
        return list;
    })();
    // 1) Intento manual primario multi-base (exnova e iqoption)
    if ((lower === 'exnova' || lower.startsWith('iq')) && SsidAuthMethod && process.env.DISABLE_MANUAL_LOGIN !== '1') {
        for (const base of httpBases) {
            try {
                const isExnova = lower === 'exnova';
                const hostBase = isExnova ? 'https://trade.exnova.com' : 'https://iqoption.com';
                const loginPaths = isExnova ? ['/v2/login'] : ['/v2/login', '/login'];
                const manualHeaders = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                    'Origin': hostBase,
                    'Referer': hostBase + '/',
                    'User-Agent': process.env.LOGIN_UA || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36'
                };
                const body = JSON.stringify({ identifier: email, password });
                for (const p of loginPaths) {
                    try {
                        console.log('[auth] manual-first', lower, 'base=', base, 'path=', p);
                        const resp = await fetch(base.replace(/\/$/, '') + p, { method: 'POST', headers: manualHeaders, body });
                        let data = {};
                        let parseErr = null;
                        try {
                            data = await resp.json();
                        }
                        catch (e) {
                            parseErr = e;
                        }
                        if (resp.status === 200 && data?.code === 'success' && data?.ssid) {
                            console.log('[auth] manual-first ssid OK', base, p);
                            const ssidAuth = new SsidAuthMethod(data.ssid);
                            const client = await ClientSdk.create(ep.ws, ep.platformId, ssidAuth);
                            return client;
                        }
                        else {
                            console.warn('[auth] manual-first fallo', base, p, resp.status, data?.code, parseErr ? 'parseErr' : '');
                        }
                    }
                    catch (e) {
                        console.warn('[auth] manual-first error', base, p, e?.message || e);
                    }
                }
            }
            catch (err) {
                console.warn('[auth] manual-first outer error', err?.message || err);
            }
        }
    }
    // 2) Flujo estándar SDK iterando bases
    let lastErr = null;
    for (const base of httpBases) {
        const auth = new LoginPasswordAuthMethod(base, email, password);
        console.log('[auth] sdk-flow', { broker: lower, http: base, ws: ep.ws, pid: ep.platformId });
        const start = Date.now();
        try {
            const client = await ClientSdk.create(ep.ws, ep.platformId, auth);
            console.log('[auth] sdk connected in', Date.now() - start, 'ms', 'base=', base);
            return client;
        }
        catch (e) {
            lastErr = e;
            console.error('[auth] sdk-flow failed', base, e?.message || e);
            if (String(e?.message || '').includes('Unexpected token')) {
                console.warn('[auth] hint: HTML recibido en base', base, 'probando siguiente si existe');
            }
        }
    }
    if (lower === 'exnova' && SsidAuthMethod && process.env.DISABLE_MANUAL_LOGIN === '1') {
        console.warn('[auth] manual login estaba deshabilitado (DISABLE_MANUAL_LOGIN=1)');
    }
    throw lastErr || new Error('Login falló en todos los métodos');
}
// botId -> rec
const BOT_PROCS = new Map();
// key (broker|email) -> botId
const BY_KEY = new Map();
// Mapa previo de SSE (por compatibilidad con código existente)
const sseClients = new Map();
// Señales (canal separado) con buffering
const signalClients = new Map();
const signalBuffers = new Map();
const signalFlushTimers = new Map();
// Nuevo bus de ejecuciones unificado
const CLIENTS = new Map();
const BACKLOG = new Map();
function broadcast(botId, ev) {
    const arr = BACKLOG.get(botId) || [];
    arr.push(ev);
    if (arr.length > 50)
        arr.shift();
    BACKLOG.set(botId, arr);
    const set = CLIENTS.get(botId);
    if (!set)
        return;
    const line = `event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`;
    for (const c of set) {
        try {
            c.write(line);
        }
        catch { }
    }
}
function flushSignals(botId) {
    const set = signalClients.get(botId);
    const buf = signalBuffers.get(botId);
    if (!set || !buf?.length)
        return;
    const payload = JSON.stringify(buf);
    const data = `event: signals\n` + `data: ${payload}\n\n`;
    for (const c of set) {
        try {
            c.write(data);
        }
        catch { }
    }
    buf.length = 0;
}
function scheduleFlush(botId, ms = 200) {
    if (signalFlushTimers.has(botId))
        return;
    const t = setTimeout(() => { signalFlushTimers.delete(botId); flushSignals(botId); }, ms);
    signalFlushTimers.set(botId, t);
}
const TRADES = {};
const TRADES_DIR = path_1.default.join(process.cwd(), 'var', 'trades');
function ensureDir(p) { if (!fs_1.default.existsSync(p))
    fs_1.default.mkdirSync(p, { recursive: true }); }
function tradesKey(broker, email, balanceType) {
    const key = `${broker}|${email}|${balanceType}`;
    return {
        key,
        file: path_1.default.join(TRADES_DIR, crypto_1.default.createHash('md5').update(key).digest('hex') + '.jsonl')
    };
}
function appendJsonl(file, obj) {
    ensureDir(path_1.default.dirname(file));
    fs_1.default.appendFileSync(file, JSON.stringify(obj) + '\n', 'utf8');
}
function loadTradesFromDisk(file, max = 2000) {
    if (!fs_1.default.existsSync(file))
        return [];
    const lines = fs_1.default.readFileSync(file, 'utf8').trim().split('\n');
    const slice = lines.slice(Math.max(0, lines.length - max));
    return slice.map(l => { try {
        return JSON.parse(l);
    }
    catch {
        return null;
    } }).filter(Boolean);
}
// ---- CONFIG STORE (persistente por broker+email) ----
const VAR_DIR = path_1.default.join(process.cwd(), 'var', 'configs');
fs_1.default.mkdirSync(VAR_DIR, { recursive: true });
function cfgKey(broker, email) { return crypto_1.default.createHash('md5').update(`${broker}|${email}`.toLowerCase()).digest('hex'); }
function cfgPath(key) { return path_1.default.join(VAR_DIR, `${key}.json`); }
function loadCfg(key) { try {
    return JSON.parse(fs_1.default.readFileSync(cfgPath(key), 'utf8'));
}
catch {
    return null;
} }
function saveCfg(key, value) { fs_1.default.writeFileSync(cfgPath(key), JSON.stringify(value ?? {}, null, 2), 'utf8'); return value ?? {}; }
async function killChild(rec) {
    return new Promise(resolve => {
        if (!rec || rec.exited)
            return resolve(true);
        const done = () => resolve(true);
        if (process.platform === 'win32') {
            try {
                const k = (0, child_process_1.spawn)('taskkill', ['/PID', String(rec.pid), '/T', '/F'], { windowsHide: true });
                k.on('exit', done);
                k.on('error', done);
            }
            catch {
                done();
            }
            return;
        }
        try {
            process.kill(-rec.pid, 'SIGTERM');
        }
        catch { }
        try {
            rec.child.kill('SIGTERM');
        }
        catch { }
        setTimeout(() => {
            try {
                process.kill(-rec.pid, 'SIGKILL');
            }
            catch { }
            try {
                rec.child.kill('SIGKILL');
            }
            catch { }
            done();
        }, 1200);
    });
}
function startBotProcess(botId, sseToken, { broker, email, password, balanceType, enabledTickers, config, botPath }) {
    // Usar ruta resuelta (si no viene, recalcular). Antes se usaba process.cwd() generando fallo cuando el bundle vive en app/dist-server.
    const finalBotPath = botPath && fs_1.default.existsSync(botPath) ? botPath : resolveBotPath();
    if (!fs_1.default.existsSync(finalBotPath)) {
        throw new Error('Bot script no encontrado en ' + finalBotPath);
    }
    const tmpPath = path_1.default.join(VAR_DIR, `run_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
    try {
        fs_1.default.writeFileSync(tmpPath, JSON.stringify(config || {}, null, 2), 'utf8');
    }
    catch { }
    const env = { ...process.env,
        BROKER: broker, EMAIL: email, PASSWORD: password,
        // Mantener BALANCE_TYPE (legacy) y añadir BOT_BALANCE_TYPE que es lo que el bot lee
        BALANCE_TYPE: balanceType || 'REAL',
        BOT_BALANCE_TYPE: balanceType || 'REAL',
        ENABLED_TICKERS: (enabledTickers || []).join(','),
        BOT_TICKERS: (enabledTickers || []).join(','),
        BOT_CONFIG_PATH: tmpPath, BOT_ID: botId, SSE_TOKEN: sseToken
    };
    const child = (0, child_process_1.spawn)(process.execPath, [finalBotPath], {
        env, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32', windowsHide: true
    });
    child.stdout?.on('data', (d) => { process.stdout.write(`[BOT ${child.pid}] ${d}`); });
    child.stderr?.on('data', (d) => { process.stderr.write(`[BOT ${child.pid} ERR] ${d}`); });
    const rec = { botId, sseToken, child, pid: child.pid, key: `${broker}|${email}`.toLowerCase() };
    child.once('exit', () => {
        rec.exited = true;
        BOT_PROCS.delete(botId);
        if (BY_KEY.get(rec.key) === botId)
            BY_KEY.delete(rec.key);
    });
    BOT_PROCS.set(botId, rec);
    BY_KEY.set(rec.key, botId);
    return rec;
}
// Helper to append to executions log
function appendExecLog(obj) { try {
    fs_1.default.appendFileSync(EXEC_LOG, JSON.stringify(obj) + "\n");
}
catch (e) { } }
// 1) Verify credentials without session (stateless)
app.post('/api/auth/verify', async (req, res) => {
    const { broker, email, password } = req.body || {};
    if (!broker || !email || !password)
        return res.status(400).json({ ok: false, error: 'faltan broker/email/password' });
    const bNorm = String(broker).trim().toLowerCase();
    const redactEmail = (em) => {
        try {
            const [u, d] = em.split('@');
            if (!d)
                return em;
            return (u.slice(0, 3) + '***@' + d);
        }
        catch {
            return em;
        }
    };
    const meta = { broker: bNorm, email: redactEmail(String(email)) };
    try {
        let accountId = null;
        let userId = null;
        let stage = 'login';
        try {
            const client = await createClientExactSignature({ broker: bNorm, email, password });
            stage = 'profile';
            try {
                const up = client.userProfile;
                let profile = null;
                if (typeof up === 'function') {
                    profile = await Promise.race([
                        up.call(client),
                        new Promise((_r, reject) => setTimeout(() => reject(new Error('profile_timeout')), Number(process.env.PROFILE_TIMEOUT_MS || 5000)))
                    ]).catch(() => null);
                }
                else if (up)
                    profile = up;
                if (profile) {
                    const idCandidate = profile.id || profile.userId || profile.uid || profile.user_id;
                    if (idCandidate != null) {
                        accountId = String(idCandidate);
                        userId = accountId;
                    }
                    console.log('[auth] verify profile', { ...meta, accountId, profileKeys: Object.keys(profile || {}) });
                }
                else {
                    console.warn('[auth] verify sin profile', meta);
                }
            }
            catch (err) {
                console.warn('[auth] verify error obteniendo profile', meta, err?.message || err);
            }
            try {
                if (typeof client.shutdown === 'function')
                    await client.shutdown();
            }
            catch { }
        }
        catch (e) {
            console.warn('[auth] verify login fallo', { ...meta, stage: 'login' }, e?.message || e);
            return res.status(401).json({ ok: false, error: 'credenciales_invalidas', stage: 'login', details: e?.message || String(e) });
        }
        if (!accountId) {
            return res.status(403).json({ ok: false, broker: bNorm, userId, accountId, authorized: false, authReason: 'sin accountId', stage: 'profile' });
        }
        const authz = isAuthorized(broker, accountId);
        if (!authz.ok) {
            return res.status(403).json({ ok: false, broker: bNorm, userId, accountId, authorized: false, authReason: authz.reason, stage: 'authz' });
        }
        return res.json({ ok: true, broker: bNorm, userId, accountId, authorized: true });
    }
    catch (e) {
        return res.status(500).json({ ok: false, error: 'fallo_verify', details: e?.message || String(e) });
    }
});
// Listado de autorizados (diagnóstico). No incluye lógica de seguridad adicional; solo lectura.
app.get('/api/auth/authorized', (req, res) => {
    try {
        const list = loadAuthorized();
        const now = Date.now();
        const items = list.map(e => {
            let status = 'activo';
            if (e.expires) {
                const ms = Date.parse(e.expires);
                if (!isNaN(ms) && ms < now)
                    status = 'expirado';
            }
            return { id: e.id, broker: e.broker || null, label: e.label || null, expires: e.expires || null, status };
        });
        res.json({ ok: true, count: items.length, items });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
});
// Diagnóstico: contenido bruto del archivo de licencias
app.get('/api/auth/authorized/raw', (_req, res) => {
    try {
        if (!fs_1.default.existsSync(AUTH_FILE))
            return res.status(404).json({ ok: false, error: 'authorized.json no encontrado', path: AUTH_FILE });
        const raw = fs_1.default.readFileSync(AUTH_FILE, 'utf-8');
        let parsed = null;
        try {
            parsed = JSON.parse(raw);
        }
        catch { /* ignore */ }
        res.json({ ok: true, path: AUTH_FILE, size: raw.length, parsed });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
});
// Endpoint diagnóstico para Exnova: prueba DNS, HTTPS y POST /v2/login
app.get('/api/diag/exnova', async (req, res) => {
    const out = { ts: new Date().toISOString(), host: 'api.trade.exnova.com' };
    const startAll = Date.now();
    try {
        const dnsStart = Date.now();
        const addrs = await new Promise((resolve) => dns_1.default.lookup('api.trade.exnova.com', { all: true }, (err, addresses) => resolve(err ? { error: err.message } : addresses)));
        out.dns = { tookMs: Date.now() - dnsStart, result: addrs };
    }
    catch (e) {
        out.dns = { error: e?.message || String(e) };
    }
    // HEAD/GET status (si existe)
    try {
        const httpStart = Date.now();
        await new Promise((resolve) => {
            const req = https_1.default.get('https://api.trade.exnova.com/status', (r) => { out.httpStatus = { code: r.statusCode, headers: r.headers, tookMs: Date.now() - httpStart }; resolve(); });
            req.on('error', (err) => { out.httpStatus = { error: err.message, tookMs: Date.now() - httpStart }; resolve(); });
            req.setTimeout(5000, () => { req.destroy(new Error('timeout')); });
        });
    }
    catch (e) {
        out.httpStatus = { error: e?.message || String(e) };
    }
    // POST /v2/login con credenciales dummy (debe devolver error de login pero confirmar conectividad)
    try {
        const postStart = Date.now();
        const resp = await fetch('https://api.trade.exnova.com/v2/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'https://trade.exnova.com', 'Referer': 'https://trade.exnova.com/' }, body: JSON.stringify({ identifier: 'dummy@example.com', password: 'dummy' }) });
        let body = null;
        try {
            body = await resp.json();
        }
        catch {
            body = await resp.text();
        }
        out.postLogin = { status: resp.status, body, tookMs: Date.now() - postStart };
    }
    catch (e) {
        out.postLogin = { error: e?.message || String(e) };
    }
    out.totalMs = Date.now() - startAll;
    res.json(out);
});
// Cargar config base por defecto (para merge) una sola vez
// ---- DEFAULT_BOT_CONFIG ampliado (riesgo, expiries, timeframes, sólo Turbo/Binary) ----
let DEFAULT_BOT_CONFIG = {};
const BASE_DEFAULTS = {
    amount: 1.0,
    enabledTickers: ['EURUSD-OTC'], // se normaliza luego según useOtc
    useOtc: false,
    oneMinuteSignals: true,
    fiveMinuteSignals: false,
    expirySecPerTimeframe: { '1m': 60, '5m': 300 },
    takeProfit: null,
    stopLoss: 3,
    useOnlyTurboBinary: true
};
try {
    const loaded = JSON.parse(fs_1.default.readFileSync(path_1.default.resolve(process.cwd(), 'configs', 'bot.config.json'), 'utf8'));
    DEFAULT_BOT_CONFIG = { ...BASE_DEFAULTS, ...loaded };
}
catch {
    DEFAULT_BOT_CONFIG = { ...BASE_DEFAULTS };
}
function sanitizeBotConfig(cfg) {
    const out = { ...BASE_DEFAULTS, ...(cfg || {}) };
    out.oneMinuteSignals = !!out.oneMinuteSignals;
    out.fiveMinuteSignals = !!out.fiveMinuteSignals;
    if (!out.oneMinuteSignals && !out.fiveMinuteSignals) {
        out.oneMinuteSignals = true;
    }
    // expirySecPerTimeframe
    const exp = out.expirySecPerTimeframe || {};
    const e1 = parseInt(String(exp['1m'] ?? exp['m1'] ?? 60), 10);
    out.expirySecPerTimeframe['1m'] = Number.isFinite(e1) && e1 > 0 ? e1 : 60;
    const e5 = parseInt(String(exp['5m'] ?? exp['m5'] ?? 300), 10);
    out.expirySecPerTimeframe['5m'] = Number.isFinite(e5) && e5 > 0 ? e5 : 300;
    // Risk numbers
    const tp = out.takeProfit;
    out.takeProfit = (tp == null || tp === '') ? null : Math.max(0, Number(tp));
    if (Number.isNaN(out.takeProfit))
        out.takeProfit = null;
    const sl = out.stopLoss;
    out.stopLoss = (sl == null || sl === '') ? null : Math.max(0, Number(sl));
    if (Number.isNaN(out.stopLoss))
        out.stopLoss = 3;
    out.useOnlyTurboBinary = !!out.useOnlyTurboBinary;
    return out;
}
// 2) Start bot (nuevo flujo con mergeConfig que reemplaza enabledTickers)
app.post('/api/bot/start', async (req, res) => {
    const { broker, email, password, balanceType = 'REAL', config } = req.body || {};
    if (!broker || !email || !password)
        return res.status(400).json({ error: 'Faltan broker/email/password' });
    const bNorm = String(broker).toLowerCase();
    const botPath = resolveBotPath();
    if (!fs_1.default.existsSync(botPath)) {
        console.error('[bot] botPath no existe', botPath);
        return res.status(400).json({ error: 'No encontrado build del bot. Ejecuta npm run build' });
    }
    let accountId = null;
    try {
        const client = await createClientExactSignature({ broker: bNorm, email, password });
        try {
            const profile = client.userProfile || (typeof client.userProfile === 'function' ? await client.userProfile() : null);
            accountId = profile?.id || profile?.userId || profile?.uid;
        }
        catch (err) {
            console.warn('[bot] profile error', err?.message || err);
        }
        try {
            if (typeof client.shutdown === 'function')
                await client.shutdown();
        }
        catch { }
    }
    catch (e) {
        console.warn('[bot] login fallo', e?.message || e);
        return res.status(401).json({ error: 'Credenciales no válidas: ' + (e?.message || e) });
    }
    if (!accountId) {
        console.warn('[bot] sin accountId tras login');
        return res.status(401).json({ error: 'No se obtuvo accountId tras login' });
    }
    const authz = isAuthorized(broker, accountId);
    if (!authz.ok) {
        console.warn('[bot] no autorizado', accountId, authz.reason);
        return res.status(403).json({ error: authz.reason || 'No autorizado', accountId });
    }
    const key = cfgKey(broker, email);
    const persisted = loadCfg(key) || {};
    if (Array.isArray(persisted.enabledTickers)) {
        persisted.enabledTickers = sanitizeTickersMixed(persisted.enabledTickers, !!persisted.useOtc);
    }
    let override = config || {};
    if ('enabledTickers' in override) {
        const useOtc = !!override.useOtc;
        override.enabledTickers = normalizeTickers(override.enabledTickers, useOtc);
    }
    if ('amount' in override) {
        const n = toNumberOrUndef(override.amount);
        if (!(n && n > 0))
            delete override.amount;
        else
            override.amount = n;
    }
    let effective = mergeConfig(DEFAULT_BOT_CONFIG, mergeConfig(persisted, override));
    effective = sanitizeBotConfig(effective);
    effective.enabledTickers = sanitizeTickersMixed(effective.enabledTickers, !!effective.useOtc);
    if (!effective.enabledTickers.length)
        effective.enabledTickers = normalizeTickers(['EURUSD', 'EURJPY'], !!effective.useOtc);
    // Si existe anterior para mismo usuario reiniciar
    const existing = BY_KEY.get(`${broker}|${email}`.toLowerCase());
    if (existing && BOT_PROCS.has(existing)) {
        try {
            await killChild(BOT_PROCS.get(existing));
        }
        catch { }
        BOT_PROCS.delete(existing);
        BY_KEY.delete(`${broker}|${email}`.toLowerCase());
    }
    const botId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const token = crypto_1.default.randomBytes(16).toString('hex');
    startBotProcess(botId, token, { broker: bNorm, email, password, balanceType, enabledTickers: effective.enabledTickers, config: effective, botPath });
    console.log('[start] botId=%s broker=%s amount=%s balanceType=%s enabled=%j path=%s', botId, bNorm, effective.amount, balanceType, effective.enabledTickers, botPath);
    return res.json({ ok: true, botId, sseToken: token });
});
app.post('/api/bot/stop', async (req, res) => {
    const { botId, broker, email } = req.body || {};
    let rec;
    if (botId) {
        rec = BOT_PROCS.get(String(botId));
    }
    else if (broker && email) {
        const k = `${broker}|${email}`.toLowerCase();
        const id = BY_KEY.get(k);
        if (id)
            rec = BOT_PROCS.get(id);
    }
    if (!rec)
        return res.status(404).json({ ok: false, error: 'not-running' });
    await killChild(rec);
    BOT_PROCS.delete(rec.botId);
    if (BY_KEY.get(rec.key) === rec.botId)
        BY_KEY.delete(rec.key);
    sseClients.delete(rec.botId);
    signalClients.delete(rec.botId);
    res.json({ ok: true, stopped: true, botId: rec.botId });
});
// Estado rápido de un bot
app.get('/api/bot/status', (req, res) => {
    const { botId } = req.query;
    if (!botId)
        return res.status(400).json({ ok: false, error: 'missing botId' });
    const running = BOT_PROCS.has(String(botId)) && !BOT_PROCS.get(String(botId))?.exited;
    res.json({ ok: true, running });
});
// ---- GET config ----
app.get('/api/bot/config', (req, res) => {
    const { broker, email } = req.query;
    if (!broker || !email)
        return res.status(400).json({ error: 'broker y email requeridos' });
    const key = cfgKey(broker, email);
    const cfg = loadCfg(key) || {};
    if (Array.isArray(cfg.enabledTickers))
        cfg.enabledTickers = sanitizeTickersMixed(cfg.enabledTickers, !!cfg.useOtc);
    return res.json({ ok: true, config: cfg });
});
// ---- POST config (guardar reemplazando enabledTickers y reiniciar si corre) ----
app.post('/api/bot/config', async (req, res) => {
    const { broker, email, password, config } = req.body || {};
    if (!broker || !email || !password)
        return res.status(400).json({ ok: false, error: 'missing-creds' });
    const keyHash = cfgKey(broker, email);
    const useOtc = !!config?.useOtc;
    const enabledTickers = normalizeTickers(config?.enabledTickers, useOtc);
    const cfgToSave = sanitizeBotConfig({ ...config, useOtc, enabledTickers });
    saveCfg(keyHash, cfgToSave);
    // Reiniciar si está corriendo
    const key = `${broker}|${email}`.toLowerCase();
    const runningId = BY_KEY.get(key);
    if (runningId && BOT_PROCS.has(runningId)) {
        try {
            await killChild(BOT_PROCS.get(runningId));
        }
        catch { }
        BOT_PROCS.delete(runningId);
        BY_KEY.delete(key);
        // Arrancar nuevo proceso con config persistida
        const botId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const token = crypto_1.default.randomBytes(16).toString('hex');
        const persisted = loadCfg(keyHash) || {};
        startBotProcess(botId, token, { broker, email, password, balanceType: req.body.balanceType, enabledTickers: persisted.enabledTickers, config: persisted });
    }
    return res.json({ ok: true, saved: { enabledTickers, useOtc } });
});
// SSE without cookies: token in query
app.get('/stream/executions', (req, res) => {
    const botId = String(req.query.botId || '');
    const token = String(req.query.token || '');
    const rec = BOT_PROCS.get(botId);
    if (!rec || token !== rec.sseToken)
        return res.status(401).end();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write('retry: 2000\n\n');
    // backlog inicial
    const backlog = BACKLOG.get(botId) || [];
    for (const ev of backlog) {
        res.write(`event: ${ev.type}\ndata: ${JSON.stringify(ev)}\n\n`);
    }
    // registrar
    const set = CLIENTS.get(botId) || new Set();
    set.add(res);
    CLIENTS.set(botId, set);
    const ping = setInterval(() => { try {
        res.write('event: ping\ndata: {}\n\n');
    }
    catch { } }, 25000);
    req.on('close', () => { clearInterval(ping); set.delete(res); });
});
app.post('/api/executions', (req, res) => {
    const { botId, type } = req.body || {};
    const token = String(req.headers['x-sse-token'] || (req.body && req.body.token) || '');
    if (!botId || !type)
        return res.status(400).json({ ok: false, error: 'missing botId/type' });
    const rec = BOT_PROCS.get(String(botId));
    if (!rec || token !== rec.sseToken)
        return res.status(401).json({ ok: false, error: 'unauthorized' });
    const ev = { ...req.body, ts: Date.now() };
    broadcast(String(botId), ev);
    // === Persistencia de operaciones cerradas ===
    // Determinar broker/email/balanceType
    const broker = ev.broker || process.env.BROKER || 'unknown';
    const email = ev.email || process.env.EMAIL || 'unknown';
    const balanceType = ev.balanceType || process.env.BALANCE_TYPE || 'REAL';
    const accountId = ev.accountId || undefined;
    const { key, file } = tradesKey(broker, email, balanceType);
    // Detectar cierre en formato nuevo o legacy:
    const isClosedNew = ev?.type === 'closed';
    const isClosedLegacy = ev?.type === 'execution' && (ev?.status === 'CLOSED' || ev?.status === 'closed');
    if (isClosedNew || isClosedLegacy) {
        const trade = {
            id: ev?.id || ev?.orderId || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ts: ev?.ts || ev?.closeTime || Date.now(),
            broker,
            balanceType,
            accountId,
            ticker: ev?.ticker || ev?.active || ev?.activeId || 'UNKNOWN',
            tf: ev?.tf || ev?.timeframe || ev?.expiry || undefined,
            side: ev?.side || ev?.direction || undefined,
            amount: ev?.amount ?? ev?.investment ?? undefined,
            payoutPct: ev?.expectedPayoutPct ?? ev?.payoutPct ?? null,
            result: ev?.result || (typeof ev?.profit === 'number' ? (ev.profit > 0 ? 'WIN' : ev.profit < 0 ? 'LOSS' : 'DRAW') : 'UNKNOWN'),
            profit: typeof ev?.profit === 'number' ? ev.profit : null
        };
        // Memoria
        if (!TRADES[key])
            TRADES[key] = [];
        TRADES[key].push(trade);
        if (TRADES[key].length > 2000)
            TRADES[key] = TRADES[key].slice(-1500);
        // Disco
        appendJsonl(file, trade);
    }
    return res.json({ ok: true });
});
// === Endpoint de historial de operaciones ===
app.get('/api/trades', async (req, res) => {
    try {
        const broker = String(req.query.broker || '').toLowerCase();
        const email = String(req.query.email || '');
        const balance = String(req.query.balance || 'REAL').toUpperCase();
        if (!broker || !email)
            return res.status(400).json({ ok: false, error: 'missing broker/email' });
        const { key, file } = tradesKey(broker, email, balance);
        if (!TRADES[key])
            TRADES[key] = loadTradesFromDisk(file);
        let arr = TRADES[key];
        const pair = String(req.query.pair || '').trim();
        const side = String(req.query.side || '').toUpperCase();
        if (pair)
            arr = arr.filter(t => String(t.ticker).toUpperCase() === pair.toUpperCase());
        if (side === 'CALL' || side === 'PUT')
            arr = arr.filter(t => t.side === side);
        const limit = Math.max(1, Math.min(500, Number(req.query.limit || 100)));
        const offset = Math.max(0, Number(req.query.offset || 0));
        const total = arr.length;
        const page = arr.slice(Math.max(0, total - offset - limit), total - offset);
        res.json({ ok: true, total, items: page });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || 'server error' });
    }
});
// Historial de trades cerrados paginado
app.get('/api/trades/history', (req, res) => {
    const { broker, email } = req.query;
    const limit = Math.min(parseInt(String(req.query.limit || '50'), 10), 500);
    const afterTs = parseInt(String(req.query.afterTs || '0'), 10);
    const result = String(req.query.result || '');
    if (!broker || !email)
        return res.status(400).json({ error: 'broker y email requeridos' });
    // Usar tradesKey para compatibilidad con la nueva persistencia
    const { file } = tradesKey(broker, email, 'REAL'); // Por defecto REAL, legacy no soporta DEMO
    if (!fs_1.default.existsSync(file))
        return res.json({ ok: true, items: [], nextAfterTs: 0 });
    const lines = fs_1.default.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
    const items = [];
    for (let i = lines.length - 1; i >= 0 && items.length < limit; i--) {
        try {
            const ev = JSON.parse(lines[i]);
            if (afterTs && ev.ts && ev.ts <= afterTs)
                break;
            if (result && ev.result !== result)
                continue;
            if (ev.status && ev.status !== 'CLOSED')
                continue;
            items.push(ev);
        }
        catch { }
    }
    const nextAfterTs = items.length ? items[items.length - 1].ts : 0;
    res.json({ ok: true, items, nextAfterTs });
});
// SSE de señales
app.get('/stream/signals', (req, res) => {
    const botId = Number(req.query.botId);
    const token = String(req.query.token || '');
    try {
        const p = verify(token);
        if (p.botId !== botId)
            throw new Error('bot mismatch');
    }
    catch {
        return res.status(401).end('unauthorized');
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    if (!signalClients.has(botId))
        signalClients.set(botId, new Set());
    signalClients.get(botId).add(res);
    req.on('close', () => {
        const set = signalClients.get(botId);
        if (set) {
            set.delete(res);
            if (!set.size)
                signalClients.delete(botId);
        }
    });
});
app.post('/api/signals', (req, res) => {
    const { botId, token } = req.query;
    const bid = Number(botId);
    try {
        const p = verify(String(token || ''));
        if (p.botId != bid)
            throw new Error('bad token');
    }
    catch {
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (!signalBuffers.has(bid))
        signalBuffers.set(bid, []);
    signalBuffers.get(bid).push(req.body);
    // Enviar también evento individual inmediato (opcional) -> comentado para reducir tráfico
    // const set = signalClients.get(bid); if(set){ const single = `event: signal\n` + `data: ${JSON.stringify(req.body)}\n\n`; for(const c of set){ try{ c.write(single) } catch{} } }
    scheduleFlush(bid, 200);
    res.json({ ok: true });
});
// Obtener balance actual (requiere credenciales stateless)
// NUEVO: GET /api/account/balance (stateless, devuelve lista completa y balance seleccionado)
app.get('/api/account/balance', async (req, res) => {
    const { broker, email, password, type } = req.query;
    if (!broker || !email || !password)
        return res.status(400).json({ ok: false, error: 'broker, email y password requeridos' });
    const t0 = Date.now();
    try {
        const client = await createClientExactSignature({ broker, email, password });
        const t1 = Date.now();
        const list = await fetchNormalizedBalances(client);
        const t2 = Date.now();
        const sel = pickBalance(list, type === 'DEMO' ? 'DEMO' : (type === 'REAL' ? 'REAL' : undefined));
        try {
            if (typeof client?.shutdown === 'function')
                await client.shutdown();
        }
        catch { }
        if (!sel)
            return res.status(404).json({ ok: false, error: 'No se encontraron balances' });
        console.log('[balance] ok broker=%s email=%s (#balances=%d) loginMs=%d listMs=%d', broker, email, list.length, t1 - t0, t2 - t1);
        return res.json({ ok: true, balance: sel, balances: list });
    }
    catch (e) {
        console.error('[balance] error broker=%s email=%s msg=%s stack=%s', broker, email, e?.message || e, e?.stack?.split('\n')[0]);
        const msg = String(e?.message || e || 'error');
        const code = /timeout|ECONN|ENOTFOUND|Unexpected token/i.test(msg) ? 'NET_OR_PARSE' : 'GENERIC';
        return res.status(500).json({ ok: false, error: msg, code });
    }
});
// NUEVO: POST /api/account/balance (misma funcionalidad con body)
app.post('/api/account/balance', async (req, res) => {
    const { broker, email, password, type } = req.body || {};
    if (!broker || !email || !password)
        return res.status(400).json({ ok: false, error: 'broker, email y password requeridos' });
    const t0 = Date.now();
    try {
        const client = await createClientExactSignature({ broker, email, password });
        const t1 = Date.now();
        const list = await fetchNormalizedBalances(client);
        const t2 = Date.now();
        const sel = pickBalance(list, type === 'DEMO' ? 'DEMO' : (type === 'REAL' ? 'REAL' : undefined));
        try {
            if (typeof client?.shutdown === 'function')
                await client.shutdown();
        }
        catch { }
        if (!sel)
            return res.status(404).json({ ok: false, error: 'No se encontraron balances' });
        console.log('[balance] ok POST broker=%s email=%s (#balances=%d) loginMs=%d listMs=%d', broker, email, list.length, t1 - t0, t2 - t1);
        return res.json({ ok: true, balance: sel, balances: list });
    }
    catch (e) {
        console.error('[balance] error POST broker=%s email=%s msg=%s stack=%s', broker, email, e?.message || e, e?.stack?.split('\n')[0]);
        const msg = String(e?.message || e || 'error');
        const code = /timeout|ECONN|ENOTFOUND|Unexpected token/i.test(msg) ? 'NET_OR_PARSE' : 'GENERIC';
        return res.status(500).json({ ok: false, error: msg, code });
    }
});
// Endpoint debug para validar login/balances paso a paso sin devolver balances completos
app.get('/api/debug/balance', async (req, res) => {
    const { broker, email, password } = req.query;
    if (!broker || !email || !password)
        return res.status(400).json({ ok: false, error: 'falta broker/email/password' });
    const t0 = Date.now();
    try {
        const client = await createClientExactSignature({ broker, email, password });
        const t1 = Date.now();
        let profile = null;
        try {
            const p = client.userProfile;
            profile = typeof p === 'function' ? await p.call(client) : p;
        }
        catch { }
        let list = [];
        let fetchErr = null;
        let t2;
        try {
            list = await fetchNormalizedBalances(client);
            t2 = Date.now();
        }
        catch (e) {
            fetchErr = e;
        }
        try {
            if (typeof client?.shutdown === 'function')
                await client.shutdown();
        }
        catch { }
        return res.json({ ok: true, timings: { loginMs: t1 - t0, listMs: t2 ? t2 - t1 : null }, profileKeys: profile ? Object.keys(profile) : [], balancesCount: list.length, fetchErr: fetchErr ? String(fetchErr.message || fetchErr) : null });
    }
    catch (e) {
        return res.status(500).json({ ok: false, stage: 'login', error: String(e?.message || e) });
    }
});
// Cambiar tipo de balance: no persiste nada, sólo valida credenciales y responde ok
app.post('/api/account/switch', async (req, res) => {
    const { broker, email, password, type = 'REAL' } = req.body || {};
    if (!broker || !email || !password)
        return res.status(400).json({ error: 'missing broker/email/password' });
    try {
        const client = await createClientExactSignature({ broker, email, password });
        try {
            if (typeof client.shutdown === 'function')
                await client.shutdown();
        }
        catch { }
        res.json({ ok: true, switched: type });
    }
    catch (e) {
        res.status(500).json({ error: e?.message || 'error' });
    }
});
// Health check rápido
app.get('/api/health', (req, res) => {
    res.json({ ok: true, pid: process.pid, uptimeSec: Math.round(process.uptime()), bots: Array.from(BOT_PROCS.keys()) });
});
// Endpoint para solicitar cierre limpio (solo localhost)
app.post('/api/exit', (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    if (!/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(ip))
        return res.status(403).json({ ok: false, error: 'forbidden' });
    res.json({ ok: true, exiting: true });
    setTimeout(() => process.exit(0), 150);
});
// === Static frontend (React build) con STATIC_ROOT ===
try {
    if (fs_1.default.existsSync(STATIC_ROOT)) {
        app.use(express_1.default.static(STATIC_ROOT));
        app.get('*', (req, res) => {
            if (req.path.startsWith('/api') || req.path.startsWith('/stream'))
                return res.status(404).end();
            res.sendFile(path_1.default.join(STATIC_ROOT, 'index.html'));
        });
        console.log('[DASH] Frontend estático servido desde', STATIC_ROOT);
    }
    else {
        console.log('[DASH] STATIC_ROOT no encontrado', STATIC_ROOT);
    }
}
catch (e) {
    console.warn('[DASH] Error montando frontend estático:', e?.message);
}
// Health plano para Electron
app.get('/health', (_req, res) => res.send('ok'));
// ensure log exists
try {
    if (!fs_1.default.existsSync(EXEC_LOG))
        fs_1.default.writeFileSync(EXEC_LOG, '');
}
catch (e) {
    console.warn('[LOG] no pudo crear executions.log', e?.message);
}
// Forzar bind explícito para entornos donde localhost no expone correctamente
// Por seguridad y para evitar colisiones en máquinas con múltiples instalaciones,
// usar localhost por defecto. Puede sobrescribirse con la variable de entorno DASH_HOST.
const HOST = process.env.DASH_HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
    try {
        console.log(`[DASH] listening on http://${HOST}:${PORT}`);
    }
    catch { }
});
// Diagnóstico de salidas tempranas: loguear señales y motivos de exit
try {
    // Removido listener de SIGINT para evitar cierre inmediato cuando se invoca desde powershell.
    const signals = ['SIGTERM', 'SIGHUP', 'SIGBREAK'];
    for (const sig of signals) {
        process.on(sig, () => { console.log('[DASH] señal recibida', sig, '-> exit'); process.exit(0); });
    }
    process.on('exit', (code) => { console.log('[DASH] process exit code', code); });
}
catch { }
