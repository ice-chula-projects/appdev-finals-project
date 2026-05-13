import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

from settings import Settings
from user import UserManager, UserNameAlreadyExistsError, UserDoesNotExistError, InvalidUserCredentialsError
from session import SessionManager, SessionExpiredError, SessionDoesNotExistError
from thread import ThreadManager

app = Flask(__name__)
CORS(app)

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
thread_manager = ThreadManager(db["threads"], settings)
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
    except (UserDoesNotExistError, InvalidUserCredentialsError):
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

@app.route("/auth", methods=["POST"])
def auth():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    data = request.get_json()
    session_token = data.get("session_token")
    try:
        session_manager.authenticate(session_token)
    except SessionDoesNotExistError:
        return jsonify({"error": "Invalid session token"}), 401
    except SessionExpiredError:
        return jsonify({"error": "Session token expired"}), 401

    return jsonify({"message": "Success"}), 200

@app.route("/create_thread", methods=["POST"])
def create_thread():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    data: dict = request.get_json()
    session_token = data.get("session_token")

    if session_token == None:
        return jsonify({"error": "Missing session token"}), 401
        
    try:
        user = session_manager.authenticate(session_token)
    except SessionDoesNotExistError:
        return jsonify({"error": "Invalid session token"}), 401
    except SessionExpiredError:
        return jsonify({"error": "Session token expired"}), 401
    
    thread_name = data.get("name")
    thread_description = data.get("description")

    if thread_name == None:
        thread_name = "Untitled Thread"
    if thread_description == None:
        thread_description = ""
    
    thread_uuid = thread_manager.create_thread(thread_name, thread_description, user)

    return jsonify({"message": "Success", "thread_uuid": thread_uuid}), 200

@app.route("/post_message", methods=["POST"])
def post_message():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    data: dict = request.get_json()
    session_token = data.get("session_token")

    if session_token == None:
        return jsonify({"error": "Missing session token"}), 401
    try:
        user = session_manager.authenticate(session_token)
    except SessionDoesNotExistError:
        return jsonify({"error": "Invalid session token"}), 401
    except SessionExpiredError:
        return jsonify({"error": "Session token expired"}), 401
    
    thread_uuid = data.get("thread_uuid")
    message = data.get("message")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid"}), 400

    print(1, user.uuid, 1)

    thread_manager.post_message(thread_uuid, user, message)
    return jsonify({"message": "Success"}), 200

@app.route("/get_thread", methods=["GET"])
def get_thread():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request"}), 400
    data: dict = request.get_json()
    session_token = data.get("session_token")

    if session_token == None:
        return jsonify({"error": "Missing session token"}), 401
    try:
        user = session_manager.authenticate(session_token)
    except SessionDoesNotExistError:
        return jsonify({"error": "Invalid session token"}), 401
    except SessionExpiredError:
        return jsonify({"error": "Session token expired"}), 401
    
    thread_uuid = data.get("thread_uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid"}), 400

    thread = thread_manager.get_thread_from_uuid(thread_uuid)

    return jsonify({"message": "Success", "thread": thread.to_database_representation()}), 200

@app.route("/get_users")
def get_users():

    users = []
    for user in user_manager.get_users():
        users.append(user.to_database_representation())

    return jsonify({"message": "Success", "users": users}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=int(PORT))