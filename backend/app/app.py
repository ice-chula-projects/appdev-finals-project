import os
from flask import Flask, jsonify, request, Request
from flask_cors import CORS
from pymongo import MongoClient
from dataclasses import asdict

from settings import Settings
from user import UserManager, UserNameAlreadyExistsError, UserDoesNotExistError, InvalidUserCredentialsError
from session import SessionManager, SessionExpiredError, SessionDoesNotExistError
from thread import ThreadManager
from attachment import InvalidBase64ImageError

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

# validates that the request contains JSON and that it contains a valid session token
# returns the user if successful
# otherwise returns the error message and status code
def authenticate_body_session_token(request: Request):
    if not request.is_json:
        return None, "Missing JSON in request.", 400
    data: dict = request.get_json()
    session_token = data.get("session_token")
    try:
        user = session_manager.authenticate(session_token)
    except SessionDoesNotExistError:
        return None, "Invalid session token.", 401
    except SessionExpiredError:
        return None, "Session token expired.", 401

    return user, "Success", 200

@app.route("/")
def home():
    return jsonify({"message": "Hello World!"}), 200

@app.route("/ping")
def ping():
    return jsonify({"message": "pong"}), 200

@app.route("/get_users", methods=["GET"])
def get_users():
    user_uuids = request.args.getlist('uuid')
    display_users = user_manager.get_display_users(user_uuids)
    dict_display_users = {}
    for display_user in display_users:
        dict_display_users[display_user.uuid] = asdict(display_user)

    return jsonify(({"message": "Success.", "users": dict_display_users})), 200

@app.route("/create_user", methods=["POST"])
def create_user():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400
    data: dict = request.get_json()

    name = data.get("name")
    passsword = data.get("password")

    if name == None or passsword == None:
        return jsonify({"error": "misformatted JSON."}), 400

    try:
       user_manager.create_user(name, passsword)
    except UserNameAlreadyExistsError:
        return jsonify({"error": "User name has already been taken."}), 409
    except:
        return jsonify({"error": "Something went wrong."}), 500
    
    session_token = user_manager.login(name, passsword)
    return jsonify({"message": "Success.", "session_token": session_token}), 200

@app.route("/update_user", methods=["UPDATE"])
def update_user():
    user, message, status_code = authenticate_body_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    data: dict = request.get_json()
    name = data.get("name", None)
    motd = data.get("motd", None)
    profile_picture_base64 = data.get("profile_picture_base64", None)
    password = data.get("password")

    try:
        user_manager.update_user(user.uuid, name, motd, profile_picture_base64, password)
    except UserNameAlreadyExistsError:
        return jsonify({"error": "User name has already been taken."}), 409
    except InvalidBase64ImageError:
        return jsonify({"error": "Provided image is invalid"}), 400
    except:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success."}), 200

@app.route("/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400
    data: dict = request.get_json()

    name = data.get("name")
    passsword = data.get("password")

    if name == None or passsword == None:
        return jsonify({"error": "misformatted JSON."}), 400
    
    try:
        session_token = user_manager.login(name, passsword)
    except (UserDoesNotExistError, InvalidUserCredentialsError):
        return jsonify({"error": "Invalid name or password."}), 401
    except Exception as e:
        print(e)
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success.", "session_token": session_token}), 200


@app.route("/logout", methods=["POST"])
def logout():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400
    data: dict = request.get_json()
    session_token = data.get("session_token")
    
    if session_token == None:
        return jsonify({"error": "Missing session_token."}), 400
    
    user_manager.logout(session_token)
    return jsonify({"message": "Success."}), 200

@app.route("/create_thread", methods=["POST"])
def create_thread():
    user, message, status_code = authenticate_body_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    data: dict = request.get_json()
    thread_name = data.get("name", None)
    thread_description = data.get("description", None)
    thread_thumbnail_base64 = data.get("thumbnail_base64", None)
    thread_password = data.get("password", None)

    if thread_name == None:
        thread_name = "Untitled Thread"
    if thread_description == None:
        thread_description = ""
    
    try:
        thread_uuid = thread_manager.create_thread(thread_name, thread_description, user, thumbnail_base64=thread_thumbnail_base64, password=thread_password)
    except InvalidBase64ImageError:
        return jsonify({"error": "Provided image is invalid"}), 400
    
    return jsonify({"message": "Success.", "thread_uuid": thread_uuid}), 200

@app.route("/post_message", methods=["POST"])
def post_message():
    user, message, status_code = authenticate_body_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    data: dict = request.get_json()
    thread_uuid = data.get("thread_uuid")
    message = data.get("message")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400

    thread_manager.post_message(thread_uuid, user, message)
    return jsonify({"message": "Success."}), 200

@app.route("/get_threads", methods=["GET"])
def get_threads():
    search_str = request.args.get("search")
    display_threads = thread_manager.get_display_threads(search_str)
    display_threads.sort(key=lambda thread: thread.creation_date, reverse=True)

    dict_display_threads = list(map(asdict, display_threads))

    return jsonify({"message": "Success.", "threads": dict_display_threads}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=int(PORT))