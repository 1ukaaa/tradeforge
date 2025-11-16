// frontend/src/utils/accountUtils.js

export const ACCOUNT_IDS = {
  ALL: "all-accounts",
  FOREX: "forex-account",
  CRYPTO: "crypto-account",
};

export const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CHF: "CHF",
  JPY: "¥",
};

const ACCOUNT_DEFINITIONS = [
  {
    id: ACCOUNT_IDS.FOREX,
    type: "forex",
    color: "#6366f1",
    balanceKey: "capitalForex",
    currencyKey: "capitalForexCurrency",
    label: (settings) => `Forex (${settings?.capitalForexCurrency || "EUR"})`,
  },
  {
    id: ACCOUNT_IDS.CRYPTO,
    type: "crypto",
    color: "#8b5cf6",
    balanceKey: "capitalCrypto",
    currencyKey: "capitalCryptoCurrency",
    label: (settings) => `Crypto (${settings?.capitalCryptoCurrency || "USD"})`,
  },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const buildAccountsFromSettings = (settings = {}) => {
  return ACCOUNT_DEFINITIONS.map((definition) => {
    const initialBalance = toNumber(settings?.[definition.balanceKey]);
    return {
      id: definition.id,
      type: definition.type,
      name: definition.label(settings),
      currency:
        settings?.[definition.currencyKey] ||
        (definition.id === ACCOUNT_IDS.FOREX ? "EUR" : "USD"),
      color: definition.color,
      initialBalance,
    };
  });
};

export const getCurrencySymbol = (currency) =>
  currencySymbols[currency] || (currency ? `${currency} ` : "$");

export const getAccountById = (accounts, accountId) =>
  accounts.find((account) => account.id === accountId) || null;

export const getAccountName = (accounts, accountId) =>
  getAccountById(accounts, accountId)?.name || "Compte inconnu";
