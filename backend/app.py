from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
from fetch_data import get_token_prices

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return send_from_directory(ROOT_DIR, "index.html")


@app.route("/style.css")
def style():
    return send_from_directory(ROOT_DIR, "style.css")


@app.route("/script.js")
def script():
    return send_from_directory(ROOT_DIR, "script.js")


@app.route("/api/wallet", methods=["POST"])
def wallet():
    data = request.get_json()
    wallet_address = data.get("wallet")

    return jsonify({
        "wallet": wallet_address,
        "message": "Wallet received"
    })


@app.route("/api/wallet/<wallet_address>/balance")
def get_wallet_balance(wallet_address):
    api_key = os.getenv("HELIUS_API_KEY")
    url = f"https://mainnet.helius-rpc.com/?api-key={api_key}"

    payload = {
        "jsonrpc": "2.0",
        "id": "1",
        "method": "getAssetsByOwner",
        "params": {
            "ownerAddress": wallet_address,
            "page": 1,
            "limit": 1000,
            "displayOptions": {
                "showFungible": True,
                "showNativeBalance": True
            }
        }
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()

        data = response.json()
        result = data.get("result", {})

        sol = result.get("nativeBalance", {}).get("lamports", 0) / 1_000_000_000

        tokens = []

        for item in result.get("items", []):
            if item.get("interface") == "FungibleToken":
                metadata = item.get("content", {}).get("metadata", {})
                token_info = item.get("token_info", {})

                decimals = token_info.get("decimals", 0)
                raw_balance = token_info.get("balance", 0)

                balance = raw_balance / (10 ** decimals) if decimals else raw_balance

                if balance > 0:
                    tokens.append({
                        "name": metadata.get("name", "Unknown"),
                        "symbol": metadata.get("symbol", "Unknown"),
                        "mint": item.get("id"),
                        "balance": balance
                    })

        mint_addresses = [token["mint"] for token in tokens if token.get("mint")]

        prices = get_token_prices(mint_addresses)

        print("Prices from Jupiter:", prices)

        for token in tokens:
            mint = token.get("mint")
            price_data = prices.get(mint, {})

            usd_price = price_data.get("usdPrice", 0)
            usd_value = token["balance"] * usd_price

            token["usdPrice"] = usd_price
            token["usdValue"] = usd_value

        sol_mint = "So11111111111111111111111111111111111111112"
        sol_price_data = get_token_prices([sol_mint])
        sol_price = sol_price_data.get(sol_mint, {}).get("usdPrice", 0)
        sol_usd_value = sol * sol_price

        return jsonify({
            "sol": sol,
            "solUsdValue": sol_usd_value,
            "tokens": tokens
        })

    except Exception as e:
        print(f"Error fetching balance: {e}")
        return jsonify({
            "error": "Failed to fetch balance"
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)