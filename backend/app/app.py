from flask import Flask, jsonify, request
from pymongo import MongoClient
import os

app = Flask(__name__)

#get URI supplied by the docker
MONGO_URI = os.environ.get("MONGO_URI")
print(MONGO_URI)
client = MongoClient(MONGO_URI)
db = client["message_board"]

#temporary, for testing docker
messages = db["messages"]

@app.route("/")
def home():
    return jsonify({"message": "Hello World!"}), 200

@app.route("/ping")
def ping():
    return jsonify({"message": "pong"}), 200

#temporary, for testing docker
@app.route("/get_messages", methods=["GET"])
def get_messages():
    message_list = []
    for message in messages.find():
        message["_id"] = str(message["_id"])
        message_list.append(dict(message))
    return jsonify({"messages": message_list}), 200

@app.route("/post_message", methods=["POST"])
def post_message():
    data = request.get_json()
    messages.insert_one(data)
    return jsonify({"message": "success"}), 200

@app.route("/delete_messages", methods=["DELETE"])
def delete_messages():
    messages.delete_many({})
    return jsonify({"message": "success"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)