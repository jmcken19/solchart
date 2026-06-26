import os
import requests
import psycopg2
from dotenv import load_dotenv

# Load variables from the .env file
load_dotenv()

wallet_address = "FuUKjgQRuBe7zsNcdnUyRx4kwh8hCSBrjL8AAcgzTxeP"

# Step 1: Connect straight to your running Docker PostgreSQL container
def get_db_connection():
    return psycopg2.connect(
        host="localhost",
        port="5432",
        database="wallet_analytics",
        user="phantom_analyzer",
        password="supersecurepassword123"
    )

# Step 2: Fetch tokens from Helius and write them to SQL
def sync_wallet_to_database(wallet_address):
    api_key = os.getenv("HELIUS_API_KEY")
    url = f"https://mainnet.helius-rpc.com/?api-key={api_key}"
    
    # Payload for getting all tokens (Using the Helius DAS API)
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
    
    response = requests.post(url, json=payload)
    items = response.json().get("result", {}).get("items", [])
    
    db_conn = get_db_connection()
    cursor = db_conn.cursor()
    
    # SQL UPSERT statement: saves data, or updates it if the entry already exists
    insert_query = """
        INSERT INTO wallet_assets (wallet_address, token_mint, token_name, token_symbol, current_balance)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET current_balance = EXCLUDED.current_balance;
    """
    
    for item in items:
        if item.get("interface") == "FungibleToken":
            token_info = item.get("token_info", {})
            raw_balance = token_info.get("balance", 0)
            decimals = token_info.get("decimals", 0)
            
            # Convert raw numbers to real-world crypto balance (e.g., handling decimals)
            scaled_balance = raw_balance / (10 ** decimals) if decimals else raw_balance
            
            if scaled_balance > 0:
                cursor.execute(insert_query, (
                    wallet_address,
                    item.get("id"),  # Token mint address acts as unique asset ID
                    item.get("content", {}).get("metadata", {}).get("name", "Unknown"),
                    item.get("content", {}).get("metadata", {}).get("symbol", "Unknown"),
                    scaled_balance
                ))
                
    db_conn.commit()
    cursor.close()
    db_conn.close()
    print(f"✅ Successfully synced and updated database for wallet: {wallet_address}")

# Step 3: Run the script manually to test it
if __name__ == "__main__":
    # Your target wallet address
    test_wallet = "FuUKjgQRuBe7zsNcdnUyRx4kwh8hCSBrjL8AAcgzTxeP"
    sync_wallet_to_database(test_wallet)