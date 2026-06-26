import requests

def get_token_prices(mint_addresses):
    if not mint_addresses:
        return {}

    ids = ",".join(mint_addresses)

    url = f"https://api.jup.ag/price/v3?ids={ids}"

    response = requests.get(url)
    response.raise_for_status()

    return response.json()