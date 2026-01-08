// touch_watcher.js
// Transpiled from changes/port_package/utils/touch_watcher.ts to CommonJS

function createTouchWatcher(deps) {
  const { getFeed, buyWithExpiry, getTolerancePct } = deps;

  function within(px, z) { return px >= z.min && px <= z.max; }

  function scheduleRetraceTouch(
    symbol,
    side,
    zone,
    windowMs,
    amount,
    expirySec,
    holdMs = 90,
    secondChance = true,
    callbacks
  ) {
    const feed = getFeed(symbol);
    let fired = false, sinceIn = 0, widened = false;
    const start = Date.now();

  const onTick = async (t) => {
      if (fired) return;
      const now = Date.now();
      if (now - start > windowMs) { try{ feed.off('tick', onTick); }catch{}; return; }

      const px = side === 'CALL' ? t.ask : t.bid;

      if (secondChance && !widened && (now - start) < 8000) {
        const dist = Math.min(Math.abs(px - zone.min), Math.abs(px - zone.max));
        if (dist <= (zone.max - zone.min) * 0.15) {
          const widen = (zone.max - zone.min) * 0.25;
          zone = { min: zone.min - widen * 0.5, mid: zone.mid, max: zone.max + widen * 0.5 };
          widened = true;
        }
      }

      if (within(px, zone)) {
        if (!sinceIn) sinceIn = now;
        if (now - sinceIn >= holdMs) {
          fired = true; try{ feed.off('tick', onTick); }catch{};
          try {
            if (callbacks && typeof callbacks.onDetected === 'function') {
              try { callbacks.onDetected({ symbol, side, price: px, zone, ts: now }); } catch (e) {}
            }
            // Pre-send drift check: obtener tick actual y tolerancia
            try {
              const tol = (typeof getTolerancePct === 'function') ? Number(getTolerancePct(symbol) || 0) : 0;
              // intentar obtener tick actual vía feed (si el feed expone estado) o usar px (detección)
              let current = px;
              try {
                const feedNow = getFeed(symbol);
                // intentar leer una propiedad interna si existe
                if (feedNow && typeof feedNow._last === 'number') {
                  current = feedNow._last;
                } else if (feedNow && typeof feedNow.getLast === 'function') {
                  const v = feedNow.getLast(); if (v && typeof v.value === 'number') current = v.value;
                }
                try{ if (feedNow && typeof feedNow.cancel === 'function') feedNow.cancel(); } catch(e){}
              } catch(e){}
              // comparación según side: para CALL no queremos comprar si current > target+tol; para PUT no queremos vender si current < target-tol
              const target = px;
              const tolAbs = Math.abs(tol) * Math.abs(target || 1);
              const driftPct = (current - target) / (target || 1);
              if ((side === 'CALL' && current > target + tolAbs) || (side === 'PUT' && current < target - tolAbs)) {
                if (global && global.__replica_debug) try { console.log(`[WATCHER] pre-send canceled for ${symbol} side=${side} target=${target} current=${current} tol=${tol}`); } catch(e){}
                if (callbacks && typeof callbacks.onResult === 'function') {
                  try { callbacks.onResult({ ok: false, error: 'drift_exceeded', detail: { current, target, tol } }); } catch (e) {}
                }
                return;
              }
            } catch(e){}
            const r = await buyWithExpiry(symbol, side, amount, expirySec);
            if (callbacks && typeof callbacks.onResult === 'function') {
              try { callbacks.onResult({ ok: true, info: r }); } catch (e) {}
            }
          } catch (e) {
            if (callbacks && typeof callbacks.onResult === 'function') {
              try { callbacks.onResult({ ok: false, error: e }); } catch (e2) {}
            }
          }
        }
      } else {
        sinceIn = 0;
      }
    };

    try {
      if (feed && typeof feed.on === 'function') {
        feed.on('tick', onTick);
        try { if (global && global.__replica_debug) console.log(`[WATCHER] scheduleRetraceTouch subscribed feed for ${symbol} side=${side} windowMs=${windowMs}`); } catch(e) {}
      }
    } catch {}
    setTimeout(() => { if (!fired) try { feed.off('tick', onTick); } catch (e) {} }, windowMs + 50);

    return {
      cancel() { fired = true; try { feed.off('tick', onTick) } catch (e) {} try { if (global && global.__replica_debug) console.log(`[WATCHER] scheduleRetraceTouch cancel called for ${symbol} side=${side}`); } catch(e) {} }
    };
  }

  return { scheduleRetraceTouch };
}

module.exports = { createTouchWatcher };
