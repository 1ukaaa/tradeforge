#!/usr/bin/env python3
"""Fetch HyperLiquid trades and balances for a public address."""

import argparse
import json
import sys
from typing import Any, Dict, List

import requests


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Synchronisation HyperLiquid")
    parser.add_argument("--address", required=True, help="Adresse publique HyperLiquid")
    parser.add_argument("--since", type=int, default=None, help="Timestamp (ms) de début")
    parser.add_argument("--until", type=int, default=None, help="Timestamp (ms) de fin")
    parser.add_argument(
        "--network",
        default="mainnet",
        choices=["mainnet", "testnet"],
        help="Réseau HyperLiquid",
    )
    return parser.parse_args()


def request_info(base_url: str, payload: Dict[str, Any]) -> Any:
    resp = requests.post(base_url, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_trades_and_balance(address: str, since: int | None, until: int | None, network: str) -> Dict[str, Any]:
    base_url = "https://api.hyperliquid.xyz/info"
    if network == "testnet":
        base_url = "https://api.hyperliquid-testnet.xyz/info"

    trade_payload: Dict[str, Any] = {"type": "userFills", "user": address}
    if since is not None:
        trade_payload = {
            "type": "userFillsByTime",
            "user": address,
            "startTime": since,
        }
    if until is not None:
        trade_payload["endTime"] = until

    raw_trades = request_info(base_url, trade_payload)
    parsed_trades: List[Dict[str, Any]] = []
    for trade in raw_trades or []:
        trade_id = str(trade.get("tid") or trade.get("hash"))
        timestamp = trade.get("time")
        pnl_value = trade.get("closedPnl")
        pnl = None
        if pnl_value is not None:
            try:
                pnl = float(pnl_value)
            except (ValueError, TypeError):
                pnl = None
        parsed_trades.append(
            {
                "externalTradeId": trade_id,
                "symbol": trade.get("coin"),
                "direction": (trade.get("dir") or trade.get("side") or "").upper(),
                "volume": trade.get("sz"),
                "entryPrice": trade.get("px"),
                "pnl": pnl,
                "pnlCurrency": trade.get("feeToken") or "USDC",
                "openedAt": timestamp,
                "closedAt": timestamp,
                "raw": trade,
              }
        )

    balance_payload = {"type": "spotClearinghouseState", "user": address}
    balance_response = request_info(base_url, balance_payload)
    balances = balance_response.get("balances") or []
    account_value = 0.0
    for entry in balances:
        total = entry.get("total")
        if total is None:
            continue
        try:
            account_value += float(total)
        except (ValueError, TypeError):
            continue

    return {
        "account": {
            "externalId": f"hyper-{address}",
            "currentBalance": account_value,
            "currency": "USDT",
        },
        "trades": parsed_trades,
    }


def main() -> None:
    args = parse_arguments()
    try:
        payload = fetch_trades_and_balance(args.address, args.since, args.until, args.network)
    except Exception as exc:  # pragma: no cover
        sys.stderr.write(f"Erreur HyperLiquid: {exc}\n")
        sys.exit(2)

    json.dump(payload, sys.stdout)


if __name__ == "__main__":
    main()
