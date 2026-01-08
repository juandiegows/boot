// port_helpers.js
// Extracted helpers from replica_bot.js necessary to port adaptive retrace, quotes and caches.

const fs = require('fs');

// Minimal in-memory caches & globals
const CANDLES_CACHE_LIMIT = 2000;
const candlesCache = new Map();
const _tickBufferByActiveId = new Map();
let _sdkFactoryBySdk = new WeakMap();
const quoteMidsByActiveId = new Map();
const quoteAsksByActiveId = new Map();
const quoteBidsByActiveId = new Map();
const quoteOpenByActiveId = new Map();
const quoteSubbedActiveIds = new Set();
const quoteSubscribingActiveIds = new Set();
const _quoteObjByActiveId = new Map();
const quoteSubscribeLogged = new Set();
const quoteFirstTickLogged = new Set();

function candlesCacheKey(activeId, size, opts) {
  try { return `${activeId}|${size}|${String(opts && opts.count ? opts.count : '')}|${String(opts && opts.onlyClosed ? opts.onlyClosed : '')}|${String(opts && opts.kind ? opts.kind : '')}`; } catch(e){ return `${activeId}|${size}` }
}

async function getCandlesCached(sdk, activeId, size, opts = {}, ttlMs = 800) {
  const fallbackMs = Number(opts.fallbackMs ?? 150);
  try {
    const key = candlesCacheKey(activeId, size, opts);
    const now = Date.now();
    const e = candlesCache.get(key);
    if (e && (now - e.ts) <= ttlMs) return e.data;
    const fetchPromise = (async () => {
      const candlesFacade = await (async function getCachedCandlesFacade() {
        try {
          const map = _sdkFactoryBySdk.get(sdk) || {};
          if (map.candles) return map.candles;
          let f = null;
          try {
            if (sdk.candles) {
              f = await Promise.race([sdk.candles(), new Promise((res)=>setTimeout(()=>res(null), 1200))]);
            }
          } catch(e) { f = null }
          if (f) { map.candles = f; try{ _sdkFactoryBySdk.set(sdk, map) }catch(e){} }
          return f;
        } catch (e) { return null }
      })();
      let data = [];
      try {
        if (candlesFacade && typeof candlesFacade.getCandles === 'function') {
          try { data = await Promise.race([candlesFacade.getCandles(Number(activeId), Number(size), opts), new Promise((res)=>setTimeout(()=>res([]), 1200))]); } catch(e){ data = []; }
        } else if (typeof sdk.getCandles === 'function') {
          try { data = await Promise.race([sdk.getCandles(Number(activeId), Number(size), opts), new Promise((res)=>setTimeout(()=>res([]), 1200))]); } catch(e){ data = []; }
        } else data = [];
      } catch(e){ data = [] }
      try {
        if ((!Array.isArray(data) || !data.length) && (Number(size) === 60 || Number(size) === 300)) {
          const KEEP_MS = 3 * 60 * 1000 + 10 * 1000;
          const nowMs = Date.now();
          const bufAll = _tickBufferByActiveId.get(Number(activeId)) || [];
          const minTs = nowMs - KEEP_MS;
          if (bufAll.length) {
            const trimmed = bufAll.filter(t => t.tsMs >= minTs);
            if (trimmed.length !== bufAll.length) _tickBufferByActiveId.set(Number(activeId), trimmed);
          }
          const buf = _tickBufferByActiveId.get(Number(activeId)) || [];
          if (buf && buf.length) {
            const tfMs = Number(size) * 1000;
            let endBase = Math.floor(nowMs / tfMs) * tfMs;
            let count = Number(opts.count || 60);
            if (opts.from && opts.to) {
              const fromMs = Number(opts.from) * 1000;
              const toMs = Number(opts.to) * 1000;
              count = Math.max(1, Math.ceil((toMs - fromMs) / tfMs));
              endBase = Math.floor(toMs / tfMs) * tfMs;
            } else if (opts.from) {
              const fromMs = Number(opts.from) * 1000;
              count = Math.max(1, Math.ceil((nowMs - fromMs) / tfMs));
              endBase = Math.floor(nowMs / tfMs) * tfMs;
            }
            count = Math.min(500, Math.max(1, count));
            const out = [];
            for (let i = count - 1; i >= 0; i--) {
              const fromMs = endBase - (i + 1) * tfMs;
              const toMs = endBase - i * tfMs;
              const sliceTicks = [];
              for (let j = 0; j < buf.length; j++) {
                const t = buf[j];
                if (t.tsMs >= fromMs && t.tsMs < toMs) sliceTicks.push(t.price);
              }
              if (!sliceTicks.length) { out.push({ from: Math.floor(fromMs/1000), to: Math.floor(toMs/1000), open:null, high:null, low:null, close:null }); continue; }
              const open = sliceTicks[0];
              const close = sliceTicks[sliceTicks.length - 1];
              let high = -Infinity, low = Infinity;
              for (let v of sliceTicks) { if (v>high) high=v; if (v<low) low=v }
              out.push({ from: Math.floor(fromMs/1000), to: Math.floor(toMs/1000), open, high, low, close });
            }
            data = out;
          }
        }
      } catch(e){}
      try {
        if (candlesCache.size >= CANDLES_CACHE_LIMIT) {
          const firstKey = candlesCache.keys().next().value;
          if (firstKey) candlesCache.delete(firstKey);
        }
      } catch(e){}
      candlesCache.set(key, { ts: Date.now(), data });
      return data;
    })();

    if (e && (Date.now() - e.ts) > 0) {
      const race = Promise.race([fetchPromise, new Promise((res)=>setTimeout(()=>res('__FALLBACK_TIMEOUT__'), fallbackMs))]);
      const r = await race;
      if (r === '__FALLBACK_TIMEOUT__') {
        try {
          const staleCopy = e.data && Array.isArray(e.data) ? e.data.map(c => ({ ...c })) : e.data;
          if (Array.isArray(staleCopy) && staleCopy.length) {
            const last = staleCopy[staleCopy.length - 1];
            last.__stale = true;
          }
          fetchPromise.catch(()=>{});
          return staleCopy;
        } catch(err){ return await fetchPromise.catch(()=>[]) }
      } else return Array.isArray(r) ? r : await fetchPromise.catch(()=>[]);
    }
    return await fetchPromise.catch(()=>[]);
  } catch(e){ return [] }
}

let _balancesCache = { ts: 0, data: null };
async function getBalancesCached(sdk, ttlMs = 5000) {
  try {
    const now = Date.now();
    if (_balancesCache.data && (now - _balancesCache.ts) <= ttlMs) return _balancesCache.data;
    const b = await (sdk.balances ? sdk.balances().catch(()=>null) : Promise.resolve(null));
    if (b == null) return [];
    _balancesCache = { ts: now, data: b };
    return b;
  } catch(e) { try { return await getBalancesCached(sdk).catch(()=>[]) } catch { return [] } }
}

async function ensureQuoteSubscription(sdk, activeId, pairsGlobal = []) {
  try {
    const id = Number(activeId);
    if (!isFinite(id)) return false;
    if (quoteSubbedActiveIds.has(id)) return true;
    if (!sdk?.quotes) return false;
    if (quoteSubscribingActiveIds.has(id)) return true;
    quoteSubscribingActiveIds.add(id);
    (async ()=>{
      try{
        let map = _sdkFactoryBySdk.get(sdk) || {};
        let quotes = map.quotes;
        if (!quotes) {
          quotes = await (sdk.quotes ? sdk.quotes().catch(()=>null) : null);
          if (quotes) { map.quotes = quotes; try{ _sdkFactoryBySdk.set(sdk, map) }catch(e){} }
        }
        if (!quotes?.getCurrentQuoteForActive) return;
        try {
          const allowed = (pairsGlobal || []).some(p => Number(p.id) === Number(id));
          if (!allowed) return;
          if (!quoteSubscribeLogged.has(id)) {
            quoteSubscribeLogged.add(id);
            console.log(`[QUOTE] subscribing activeId=${id}`);
          }
        } catch{}
        let current = _quoteObjByActiveId.get(id);
        if (!current) {
          current = await quotes.getCurrentQuoteForActive(id);
          if (!current) return;
          _quoteObjByActiveId.set(id, current);
        }
        try {
          if (typeof current.subscribeOnUpdate === 'function') {
            const handler = (q)=>{
              try{
                const v = typeof q?.value === 'number' && isFinite(q.value) ? Number(q.value) : undefined;
                const a = typeof q?.ask === 'number' && isFinite(q.ask) ? Number(q.ask) : undefined;
                const b = typeof q?.bid === 'number' && isFinite(q.bid) ? Number(q.bid) : undefined;
                if (v != null) {
                  quoteMidsByActiveId.set(id, v);
                  quoteOpenByActiveId.set(id, { tsMs: Date.now(), mid: v, ask: a, bid: b });
                }
                if (a != null) quoteAsksByActiveId.set(id, a);
                if (b != null) quoteBidsByActiveId.set(id, b);
                try{
                  const buf = _tickBufferByActiveId.get(id) || [];
                  buf.push({ tsMs: Date.now(), price: v });
                  const cutoff = Date.now() - (3*60*1000 + 10*1000);
                  while (buf.length && buf[0].tsMs < cutoff) buf.shift();
                  _tickBufferByActiveId.set(id, buf);
                }catch{}
                try {
                  if (!quoteFirstTickLogged.has(id) && v != null) {
                    quoteFirstTickLogged.add(id);
                    console.log(`[QUOTE] first tick activeId=${id} mid=${v}`);
                  }
                } catch{}
              }catch{}
            };
            try{ const metaKey = `__handler__${id}`; if (!current[metaKey]) { current[metaKey] = handler; current.subscribeOnUpdate(handler); } }catch(e){}
          } else if (typeof current.on === 'function') {
            const handler2 = (q)=>{ try{ const v = typeof q?.value === 'number' && isFinite(q.value) ? Number(q.value) : undefined; if (v!=null) quoteMidsByActiveId.set(id,v);}catch{} };
            const metaKey2 = `__handler_on__${id}`;
            if (!current[metaKey2]) { try{ current[metaKey2] = handler2; current.on('update', handler2); }catch{} }
          }
        } catch(e){}
        try{ quoteSubbedActiveIds.add(id); }catch{}
      } catch(e) { try{ quoteSubbedActiveIds.delete(id); }catch{} }
      finally { try{ quoteSubscribingActiveIds.delete(id);}catch{} }
    })();
    return true;
  } catch(e){ return false }
}

async function resubscribeAllActiveQuotes(sdkClient, pairsGlobal) {
  try{
    _quoteObjByActiveId.clear(); _sdkFactoryBySdk = new WeakMap();
    const staggerMs = Math.max(25, Number(process?.env?.QUOTE_RESUB_STAGGER_MS ?? 60));
    let idx = 0;
    for (const p of pairsGlobal || []) {
      try {
        const delay = idx * staggerMs;
        setTimeout(() => { try { ensureQuoteSubscription(sdkClient, p.id, pairsGlobal).catch(()=>{}); } catch {} }, delay);
      } catch {}
      idx++;
    }
  }catch(e){}
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
    if (isOtc) {
      if (otcMap && typeof otcMap === 'object') { const v = otcMap[base]; if (typeof v === 'number' && isFinite(v) && v > 0) return v; }
    } else {
      if (spotMap && typeof spotMap === 'object') { const v = spotMap[base]; if (typeof v === 'number' && isFinite(v) && v > 0) return v; }
      if (otcMap && typeof otcMap === 'object') { const v3 = otcMap[base]; if (typeof v3 === 'number' && isFinite(v3) && v3 > 0) return v3; }
    }
    if (legacyMap && typeof legacyMap === 'object') { const v2 = legacyMap[base]; if (typeof v2 === 'number' && isFinite(v2) && v2 > 0) return v2; }
  } catch {}
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
  } catch (e) { return Number(cfg?.retrace50?.targetAbs); }
}

function getTolerancePct(cfg, ticker) {
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
  } catch (e) { return defTol; }
}

module.exports = {
  getCandlesCached,
  getBalancesCached,
  ensureQuoteSubscription,
  resubscribeAllActiveQuotes,
  resolveAbsDelta,
  getTolerancePct,
  // exports to let caller access internal maps if needed
  __internals: {
    candlesCache, _tickBufferByActiveId, quoteMidsByActiveId, quoteAsksByActiveId, quoteBidsByActiveId, quoteOpenByActiveId
  }
};
