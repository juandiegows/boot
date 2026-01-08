Port package for adaptive retrace + touch watcher + quote/candle helpers

Contenido del paquete:
- `utils/touch_watcher.ts` : watcher TypeScript original (puedes compilar o portarlo a JS)
- `port_helpers.js` : funciones JS extraídas: `getCandlesCached`, `getBalancesCached`, `ensureQuoteSubscription`, `resubscribeAllActiveQuotes`, `resolveAbsDelta`, `getTolerancePct` y mapas internos.

Instrucciones rápidas para portar:
1) Copia `utils/touch_watcher.ts` a tu repo. Si tu proyecto es JS, transpílalo o conviértelo a JS (es muy pequeño).
2) Copia `port_helpers.js` junto al módulo que usará las funciones. Ajusta `sdk` calls si tu SDK expone APIs distintas.
3) En tu bot principal, importa `createTouchWatcher` (o crea un shim) y construye el watcher:

```js
const { createTouchWatcher } = require('./utils/touch_watcher'); // transpila a CommonJS si es TS
const { getCandlesCached, ensureQuoteSubscription, resolveAbsDelta } = require('./port_helpers');

const touchWatcher = createTouchWatcher({
  getFeed: (symbol) => {
    // Devuelve un objeto con .on('tick',fn) y .off('tick',fn) basado en tu fuente de ticks
  },
  buyWithExpiry: async (symbol, side, amount, expirySec) => {
    // Adapter: llama a tu función de creación de órdenes con expiry y devuelve resultado
  }
});
```

Prueba local mínima (PowerShell):

```powershell
# Desde el root del repo destino
# Copiar archivos:
Copy-Item -Path "d:\esposotrader_portableeditado\changes\port_package\utils\touch_watcher.ts" -Destination ".\utils\touch_watcher.ts"
Copy-Item -Path "d:\esposotrader_portableeditado\changes\port_package\port_helpers.js" -Destination ".\utils\port_helpers.js"
Copy-Item -Path "d:\esposotrader_portableeditado\changes\port_package\README.md" -Destination ".\changes\port_package\README.md"

# Ejecutar tu app (ajusta según proyecto)
node .\index.js
```

Notas y riesgos:
- Asegúrate de exportar/compatibilizar la API del `feed` que use `touch_watcher` (tick con {bid,ask}).
- `port_helpers.js` asume que `sdk.candles()`, `sdk.quotes()` y `sdk.balances()` siguen la semántica del proyecto original. Si no, adapta los puntos donde llama a `quotes.getCurrentQuoteForActive` o `candles.getCandles`.
- Copia las claves de configuración `retrace50.*` de tu `bot.config.json` para mantener el mismo comportamiento.

Si quieres, puedo:
- Convertir `touch_watcher.ts` a JS automáticamente.
- Generar un archivo zip con el paquete listo para copiar.
- Crear parches (.patch) para aplicar automáticamente en el otro repo (si me das la ruta destino aquí puedo escribir allí).