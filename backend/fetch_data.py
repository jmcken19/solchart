import os
import requests
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("HELIUS_API_KEY")

wallet = "FuUKjgQRuBe7zsNcdnUyRx4kwh8hCSBrjL8AAcgzTxeP"

url = f"https://mainnet.helius-rpc.com/?api-key={api_key}"

payload = {
    "jsonrpc": "2.0",
    "id": "1",
    "method": "getAssetsByOwner",
    "params": {
        "ownerAddress": wallet,
        "page": 1,
        "limit": 1000,
        "displayOptions": {
            "showFungible": True,
            "showNativeBalance": True
        }
    }
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

print("Status code:", response.status_code)

data = response.json()
items = data["result"]["items"]

tokens = []

for item in items:
    interface_type = item.get("interface")

    if interface_type == "FungibleToken":
        content = item.get("content", {})
        metadata = content.get("metadata", {})
        token_info = item.get("token_info", {})

        name = metadata.get("name", "Unknown")
        symbol = metadata.get("symbol", "Unknown")

        raw_balance = token_info.get("balance", 0)
        decimals = token_info.get("decimals", 0)

        scaled_balance = raw_balance / (10 ** decimals) if decimals else raw_balance

        if scaled_balance > 0:
            tokens.append({
                "name": name,
                "symbol": symbol,
                "balance": scaled_balance
            })

print(tokens)
