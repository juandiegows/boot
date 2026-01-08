# Trading Bot Replica (SDK oficial)

Replica el comportamiento de la app de referencia **sin backend Python**, usando tu **SDK oficial** (IQ Option/Exnova).  
Incluye:
- Señales **1m/5m**
- Expiración **5m** con fallback a **Digital (ATM)** si no existe 300s en Turbo/Binary
- Pullback a HH/LL recientes
- TP/SL
- Selección por tickers

## Estructura

```
trading-bot-replica/
├─ configs/
│  └─ bot.config.json        # Configuración del bot
├─ libs/
│  └─ client-sdk-js/         # ← Pega aquí tu SDK oficial (carpeta con src/index.js)
├─ src/
│  ├─ replica_bot.ts         # Entrada principal
│  ├─ helpers_trading.ts     # getCandlesFlexible + buyWithExpiry (Digital fallback)
│  └─ logica_signales.ts     # RSI, MA cross, Engulfing, Pinbar, HH/LL y decideSignal
├─ .gitignore
├─ package.json
├─ tsconfig.json
└─ README.md
```

> **Importante:** copia tu SDK oficial dentro de `libs/client-sdk-js/` de forma que exista `libs/client-sdk-js/src/index.js`.

## Requisitos

- Node 18+ (ideal 20+)
- Tener el SDK oficial

## Instalación

```bash
npm i
```

## Configuración

Edita `configs/bot.config.json`:

```jsonc
{
  "broker": "exnova",             // exnova | iqoption
  "email": "tu@email",
  "password": "tu_password",
  "balanceType": "DEMO",          // DEMO | REAL
  "amount": 1.0,
  "enabledTickers": ["EURUSD"],
  "oneMinuteSignals": false,
  "fiveMinuteSignals": true,
  "expirySecPerTimeframe": { "1m": 300, "5m": 300 },
  "delayMs": 0,
  "tolerancePullback": 0.0005,
  "takeProfit": null,
  "stopLoss": null,
  "stopLossWorstCase": false,
  "preferDigital": true,
  "scanIntervalMs": 2500,
  "candlesPerScan": 180,
  "useCurrentCandle": true
}
```

## Ejecutar

### Desarrollo (TypeScript directo)
```bash
npx ts-node src/replica_bot.ts
```

### Producción (compilado)
```bash
npm run build
npm start
```

> Ejecuta desde la **raíz del proyecto** para que encuentre `configs/bot.config.json`.

## Notas
- No requiere backend Python.
- El helper `buyWithExpiry` intenta **Turbo 300s → Binary 300s → Digital (spot/ATM)**.
- Si quieres forzar siempre Digital, pon `"preferDigital": true`.

## Confirmación de vela (nuevo)
- Tras detectar una señal (CALL/PUT), el bot **espera 1 vela** de confirmación.
- **CALL**: la **siguiente vela** debe cerrar **verde** (close > open).
- **PUT**: la **siguiente vela** debe cerrar **roja** (close < open).
- Si confirma, **opera al inicio de la vela siguiente** a la de confirmación.
- Se eliminó el **pullback**.


### Modo simulación
- `simMode: true` en `configs/bot.config.json` → usa `src/sim_sdk.ts` (sin conexión a broker).
- Para operar real, pon `simMode: false` y pega tu SDK en `libs/client-sdk-js/`.
