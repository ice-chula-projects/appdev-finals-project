import json
from math import floor
import os
from urllib import response
from flask import Flask, jsonify, request, Request
from flask_cors import CORS
from pymongo import MongoClient
from dataclasses import asdict

from settings import Settings
from user import UserManager, UserNameAlreadyExistsError, UserDoesNotExistError, InvalidUserCredentialsError
from session import SessionManager, SessionExpiredError, SessionDoesNotExistError
from thread import ThreadDoesNotExistError, ThreadManager
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

# max amount of "items" (threads/messages) in 1 "page"
items_per_page = 50

# validates that it contains a valid session token
# returns the user if successful
# otherwise returns the error message and status code
def authenticate_header_session_token(request: Request):
    session_token = request.headers.get("session-token")
    if session_token == None:
        return None, "Missing session-token in header.", 401
    try:
        user = session_manager.authenticate(session_token)
    except SessionDoesNotExistError:
        return None, "Invalid session token.", 401
    except SessionExpiredError:
        return None, "Session token expired.", 401
    except:
        return None, "Something went wrong.", 500

    return user, "Success", 200

#pages system
def calculate_indexes_from_page(page: int, item_count:int):
    if page < 1: page = 1

    if page * items_per_page > item_count:
        page = (item_count // items_per_page) + 1
    
    start_index = (page - 1) * items_per_page
    end_index = min(page * items_per_page, item_count) #is exclusive

    return (start_index, end_index)

@app.route("/")
def home():
    return jsonify({"message": "Hello World!"}), 200

@app.route("/ping")
def ping():
    return jsonify({"message": "pong"}), 200

@app.route("/get_user_profile", methods=["GET"])
def get_user_profile():
    user_uuid = request.args.get('uuid')
    if user_uuid == None:
        return jsonify({"error": "Missing uuid in parameters."}), 400
    
    try:
        user = user_manager.get_user_profile(user_uuid)
    except UserDoesNotExistError:
        return jsonify({"error": "User does not exist."}), 404
    except:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success.", "user": asdict(user)}), 200


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
       uuid = user_manager.create_user(name, passsword)
       
    except UserNameAlreadyExistsError:
        return jsonify({"error": "User name has already been taken."}), 409
    except:
        return jsonify({"error": "Something went wrong."}), 500
    
    session_token = user_manager.login(name, passsword)
    return jsonify({"message": "Success.", "session_token": session_token, "user_uuid": uuid}), 200

@app.route("/update_user", methods=["PATCH"])
def update_user():
    if not request.is_json:
        return None, "Missing JSON in request.", 400

    user, message, status_code = authenticate_header_session_token(request)
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
        user = session_manager.authenticate(session_token)
    except (UserDoesNotExistError, InvalidUserCredentialsError):
        return jsonify({"error": "Invalid name or password."}), 401
    except:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success.", "session_token": session_token, "user_uuid": user.uuid}), 200


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
    if not request.is_json:
        return None, "Missing JSON in request.", 400
    
    user, message, status_code = authenticate_header_session_token(request)
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
    except:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success.", "thread_uuid": thread_uuid}), 200

@app.route("/post_message", methods=["POST"])
def post_message():
    if not request.is_json:
        return None, "Missing JSON in request.", 400
    
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    data: dict = request.get_json()
    thread_uuid = data.get("thread_uuid")
    message = data.get("message")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400

    thread_manager.post_message(thread_uuid, user, message)
    return jsonify({"message": "Success."}), 200

@app.route("/search_threads", methods=["GET"])
def search_threads():
    search_str = request.args.get("search")
    page = request.args.get("page")

    try:
        page = int(page)
    except:
        page = 1

    threads = thread_manager.search_threads(search_str)
    
    threads.sort(key=lambda thread: thread.creation_date, reverse=True)
    display_threads = list(map(lambda thread: asdict(thread.to_display_thread()), threads))

    threads_count = len(display_threads)
    
    start_index, end_index = calculate_indexes_from_page(page, threads_count)  
    return jsonify({"message": "Success.", "threads": display_threads[start_index:end_index], "total_threads": threads_count, "page": page}), 200

@app.route("/get_thread", methods=["GET"])
def get_thread():
    thread_uuid = request.args.get("uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400
    
    try:    
        thread = thread_manager.get_thread_from_uuid(thread_uuid)   
    except ThreadDoesNotExistError:
        return jsonify({"error": "Thread does not exist"}), 404
    except:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success.", "thread": asdict(thread.to_display_thread())}), 200

@app.route("/get_thread_messages", methods=["GET"])
def get_thread_messages():
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    thread_uuid = request.args.get("uuid")
    page = request.args.get("page")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400

    try:
        page = int(page)
    except:
        page = 1
    
    try:    
        thread = thread_manager.get_thread_from_uuid(thread_uuid)   
    except ThreadDoesNotExistError:
        return jsonify({"error": "Thread does not exist"}), 404
    except:
        return jsonify({"error": "Something went wrong."}), 500
    
    if thread.private:
        password = request.headers.get("thread-password")

        if password == None:
            return jsonify({"error": "Missing thread-password in header"}), 401
        
        if not thread.authenticate(password):
            return jsonify({"error": "Invalid Password"}), 403
    
    
    # update thread history
    user_manager.update_thread_history(user.uuid, thread.uuid)

    messages = list(thread.messages.values())
    messages.sort(key = lambda message: message.creation_date, reverse=True)
    dict_messages = list(map(asdict, messages))

    #pages system
    messages_count = len(dict_messages)
    
    start_index, end_index = calculate_indexes_from_page(page, messages_count) 
    return jsonify({"message": "Success.", "messages": dict_messages[start_index:end_index], "total_messages": messages_count, "page": page}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=int(PORT))