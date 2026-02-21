export const COMMON_ASSETS = [
    { group: "Énergies", value: "CL", label: "CL" },
    { group: "Énergies", value: "RB", label: "RB" },
    { group: "Énergies", value: "HO", label: "HO" },
    { group: "Indices", value: "MNQ", label: "MNQ" },
    { group: "Indices", value: "MES", label: "MES" },
    { group: "Indices", value: "MYM", label: "MYM" },
    { group: "Métaux", value: "GOLD", label: "GOLD" },
    { group: "Métaux", value: "SILVER", label: "SILVER" },
    { group: "Cryptomonnaies", value: "BTC", label: "BTC" },
    { group: "Cryptomonnaies", value: "ETH", label: "ETH" },
];

const ASSET_ALIASES = {
    // Énergies
    "USOIL": "CL",
    "WTI": "CL",
    "WTICOUSD": "CL",
    "BRENT": "CL",
    "UKOIL": "CL",

    // Indices
    "US100": "MNQ",
    "NAS100": "MNQ",
    "NDX": "MNQ",
    "NQ": "MNQ",
    "US500": "MES",
    "SPX500": "MES",
    "SPX": "MES",
    "ES": "MES",
    "US30": "MYM",
    "DOWJONES": "MYM",
    "WS30": "MYM",
    "YM": "MYM",

    // Métaux
    "XAUUSD": "GOLD",
    "XAGUSD": "SILVER",

    // Cryptos
    "BTCUSD": "BTC",
    "ETHUSD": "ETH",
};

export const cleanAssetName = (raw = "") => {
    if (!raw) return "";
    let cleaned = raw.replace(/[._-](cash|pro|raw|ecn|std|mini|micro|cfds?|spot)$/i, "").toUpperCase();

    // Reverse lookup or direct mapping
    return ASSET_ALIASES[cleaned] || cleaned;
};
