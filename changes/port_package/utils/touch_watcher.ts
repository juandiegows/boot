// utils/touch_watcher.ts
type Zone = { min:number; mid:number; max:number };

export function createTouchWatcher(deps:{
  getFeed: (symbol:string)=>{ on:(ev:string,fn:Function)=>void; off:(ev:string,fn:Function)=>void },
  buyWithExpiry: (symbol:string, side:'CALL'|'PUT', amount:number, expirySec:number)=>Promise<any>
}){
  const { getFeed, buyWithExpiry } = deps;

  function within(px:number, z:Zone) { return px>=z.min && px<=z.max; }

  function scheduleRetraceTouch(
    symbol: string,
    side: 'CALL'|'PUT',
    zone: Zone,
    windowMs: number,
    amount: number,
    expirySec: number,
    holdMs: number = 90,
    secondChance: boolean = true,
    callbacks?: { onDetected?: (info:{symbol:string,side:string,price:number,zone:Zone,ts:number})=>void, onResult?: (res:{ok:boolean,error?:any,info?:any})=>void }
  ) {
    const feed = getFeed(symbol);
    let fired = false, sinceIn = 0, widened=false;
    const start = Date.now();

    const onTick = async (t:{bid:number; ask:number}) => {
      if (fired) return;
      const now = Date.now();
      if (now - start > windowMs) { feed.off('tick', onTick); return; }

      const px = side==='CALL' ? t.ask : t.bid;

      if (secondChance && !widened && (now - start) < 8000) {
        const dist = Math.min(Math.abs(px - zone.min), Math.abs(px - zone.max));
        if (dist <= (zone.max-zone.min)*0.15) {
          const widen = (zone.max - zone.min)*0.25;
          zone = { min: zone.min - widen*0.5, mid: zone.mid, max: zone.max + widen*0.5 };
          widened = true;
        }
      }

      if (within(px, zone)) {
        if (!sinceIn) sinceIn = now;
        if (now - sinceIn >= holdMs) {
          fired = true; feed.off('tick', onTick);
          try {
            if (callbacks && typeof callbacks.onDetected === 'function') {
              try { callbacks.onDetected({ symbol, side, price: px, zone, ts: now }); } catch (e) {}
            }
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

    feed.on('tick', onTick);
    setTimeout(()=>{ if(!fired) feed.off('tick', onTick); }, windowMs+50);

    return {
      cancel(){ fired=true; try{ feed.off('tick', onTick)}catch(e){} }
    };
  }

  return { scheduleRetraceTouch };
}
