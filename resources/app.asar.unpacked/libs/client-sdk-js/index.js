// Bridge CJS para mapear las exportaciones del SDK vendor al contrato esperado por el bot.
// Ajusta las rutas dentro de tryRequire si tu entry real difiere.

function tryRequire(p) {
  try { return require(p); } catch (e) { return null; }
}

const vendor =
  tryRequire('./dist/index.js') ||
  tryRequire('./index.cjs') ||
  tryRequire('./index.js') ||
  tryRequire('./build/index.js') ||
  tryRequire('../dist/index.js') ||
  tryRequire(require.resolve && (() => { try { return require.resolve('./dist/index.js'); } catch { return null; } })()) ||
  null;

if (!vendor) {
  throw new Error('[bridge client-sdk-js] No pude cargar el entry del SDK. Ajusta este bridge apuntando al entry real del SDK.');
}

const ClientSdk =
  vendor.ClientSdk ||
  vendor.Client ||
  vendor.ClientSDK ||
  (vendor.default && (vendor.default.ClientSdk || vendor.default.Client)) ||
  vendor.default; // a veces el default es la propia clase

const LoginPasswordAuthMethod =
  vendor.LoginPasswordAuthMethod ||
  vendor.LoginAuth ||
  (vendor.Auth && vendor.Auth.LoginPassword) ||
  vendor.Auth ||
  (vendor.default && vendor.default.LoginPasswordAuthMethod) ||
  (vendor.default && vendor.default.Auth);

// Exponer SsidAuthMethod si existe en el vendor
const SsidAuthMethod =
  vendor.SsidAuthMethod ||
  (vendor.Auth && vendor.Auth.SsidAuthMethod) ||
  (vendor.default && vendor.default.SsidAuthMethod);

const BalanceType =
  vendor.BalanceType ||
  vendor.Balance ||
  (vendor.default && vendor.default.BalanceType) ||
  { DEMO: 'DEMO', REAL: 'REAL' };

const BinaryOptionsDirection =
  vendor.BinaryOptionsDirection ||
  vendor.Direction ||
  (vendor.default && vendor.default.BinaryOptionsDirection) ||
  { CALL: 'CALL', PUT: 'PUT' };

module.exports = {
  ClientSdk,
  LoginPasswordAuthMethod,
  SsidAuthMethod,
  BalanceType,
  BinaryOptionsDirection,
};
