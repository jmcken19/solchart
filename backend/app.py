import os
import requests
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

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
            "displayOptions": {"showFungible": True, "showNativeBalance": True}
        }
    }

    data = requests.post(url, json=payload).json()
    result = data.get("result", {})

    sol = result.get("nativeBalance", {}).get("lamports", 0) / 1_000_000_000

    tokens = []
    for item in result.get("items", []):
        if item.get("interface") == "FungibleToken":
            metadata = item.get("content", {}).get("metadata", {})
            token_info = item.get("token_info", {})
            decimals = token_info.get("decimals", 0)
            balance = token_info.get("balance", 0) / (10 ** decimals) if decimals else token_info.get("balance", 0)

            if balance > 0:
                tokens.append({
                    "name": metadata.get("name", "Unknown"),
                    "symbol": metadata.get("symbol", "Unknown"),
                    "balance": balance
                })

    return jsonify({"sol": sol, "tokens": tokens})

if __name__ == "__main__":
    app.run(debug=True)