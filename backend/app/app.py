import os
from flask import Flask, jsonify, request
from pymongo import MongoClient

from settings import Settings
from user import UserManager, UserNameAlreadyExistsError, UserDoesNotExistError, InvalidPasswordError
from session import SessionManager

app = Flask(__name__)

#get environmental variables
MONGO_URI = os.environ.get("MONGO_URI")
PORT = os.environ.get("PORT")

#load db
client = MongoClient(MONGO_URI)
db = client["message_board"]

#load settings
with open("settings.json", "r") as file:
    settings = Settings(file)


#initialize helper classes
session_manager = SessionManager(settings)
user_manager = UserManager(db["users"], session_manager, settings)


@app.route("/")
def home():
    return jsonify({"message": "Hello World!"}), 200

@app.route("/ping")
def ping():
    return jsonify({"message": "pong"}), 200

@app.route("/create_user", methods=["POST"])
def create_user():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    data = request.get_json()

    name = data.get("name")
    passsword = data.get("password")

    if name == None or passsword == None:
        return jsonify({"error": "misformatted JSON"}), 400

    try:
       user_manager.create_user(name, passsword)
    except UserNameAlreadyExistsError:
        return jsonify({"error": "User already exists"}), 409
    except:
        return jsonify({"error": "Something went wrong"}), 500
    
    return jsonify({"message": "Success"}), 200

@app.route("/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    data = request.get_json()

    name = data.get("name")
    passsword = data.get("password")

    if name == None or passsword == None:
        return jsonify({"error": "misformatted JSON"}), 400
    
    try:
        session_token = user_manager.login(name, passsword)
    except (UserDoesNotExistError, InvalidPasswordError):
        return jsonify({"error": "Invalid name or password"}), 401
    except Exception as e:
        print(e)
        return jsonify({"error": "Something went wrong"}), 500
    
    return jsonify({"message": "Success", "session_token": session_token}), 200


@app.route("/logout", methods=["POST"])
def logout():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    data = request.get_json()
    session_token = data.get("session_token")
    
    if session_token == None:
        return jsonify({"error": "Missing session_token"}), 400
    
    user_manager.logout(session_token)
    return jsonify({"message": "Success"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=int(PORT))