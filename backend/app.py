from flask import Flask, send_from_directory, request, jsonify
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

app = Flask(__name__)

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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)