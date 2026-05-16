import math
import os
from flask import Flask, jsonify, request, Request
from flask_cors import CORS
from pymongo import MongoClient
from dataclasses import asdict

from settings import Settings
from user import User, UserManager, UserNameAlreadyExistsError, UserDoesNotExistError, InvalidUserCredentialsError
from session import SessionManager, SessionExpiredError, SessionDoesNotExistError
from thread import ThreadDoesNotExistError, ThreadManager
from attachment import Attachment, AttachmentMediaTypes, InvalidBase64ImageError, validate_base64_string

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
def authenticate_header_session_token(request: Request) -> tuple[User | None, str, int]:
    session_token = request.headers.get("session-token")
    if session_token == None:
        return None, "Missing session-token in header.", 401
    try:
        user = session_manager.authenticate(session_token)
    except SessionDoesNotExistError:
        return None, "Invalid session token.", 401
    except SessionExpiredError:
        return None, "Session token expired.", 401
    except Exception:
        return None, "Something went wrong.", 500

    return user, "Success", 200

#pages system
def calculate_indexes_from_page(page: int, item_count:int):
    if page < 1: page = 1

    if page * items_per_page > item_count:
        page = max(1, math.ceil(item_count / items_per_page))
    
    start_index = (page - 1) * items_per_page
    end_index = min(page * items_per_page, item_count) #is exclusive

    return (start_index, end_index, page)

# validates that the attachment contains the required fields and turns it into an attachment
# returns the attachment if successful
# otherwise returns the error message and status code
def validate_attachment(attachment) -> tuple[Attachment | None, str, int]:
    if not isinstance(attachment, dict):
        return None, "Attachment must be a json object.", 400
    
    data_base64 = attachment.get("data_base64")
    extension_type = attachment.get("extension_type")
    media_type = attachment.get("media_type")

    if data_base64 == None or extension_type == None or media_type == None:
        return None, "Attachment missing required fields.", 400
    
    if not validate_base64_string(data_base64):
        return None, "Attachment data is not valid base64.", 400

    match media_type:
        case "image":
            media_type = AttachmentMediaTypes.IMAGE
        case "audio":
            media_type = AttachmentMediaTypes.AUDIO
        case "video":
            media_type = AttachmentMediaTypes.VIDEO
        case "text":
            media_type = AttachmentMediaTypes.TEXT
        case "application" | "file":
            media_type = AttachmentMediaTypes.APPLICATION
        case _:
            return None, "Attachment media type is invalid.", 400
    
    return Attachment(data_base64 = data_base64,extension_type = extension_type, media_type = media_type), "Success.", 200

@app.route("/")
def home():
    return jsonify({"message": "Hello World!"}), 200

@app.route("/ping")
def ping():
    return jsonify({"message": "pong"}), 200

@app.route("/get_board_info", methods=["GET"])
def get_board_info():
    return jsonify({"name": settings.name, "is_appdev_finals_message_board": True}), 200


@app.route("/get_user_profile", methods=["GET"])
def get_user_profile():
    user_uuid = request.args.get('uuid')
    if user_uuid == None:
        return jsonify({"error": "Missing uuid in parameters."}), 400
    
    try:
        user = user_manager.get_user_profile(user_uuid)
    except UserDoesNotExistError:
        return jsonify({"error": "User does not exist."}), 404
    except Exception:
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
    password = data.get("password")

    if name == None or password == None:
        return jsonify({"error": "misformatted JSON."}), 400

    try:
       uuid = user_manager.create_user(name, password)
       
    except UserNameAlreadyExistsError:
        return jsonify({"error": "User name has already been taken."}), 409
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    session_token = user_manager.login(name, password)
    return jsonify({"message": "Success.", "session_token": session_token, "user_uuid": uuid}), 200

@app.route("/update_user", methods=["PATCH"])
def update_user():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400

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
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success."}), 200

@app.route("/delete_user", methods=["DELETE"])
def delete_user():
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code

    try:
        user_manager.delete_user(user.uuid)
        session_manager.delete_session(request.headers.get("session-token"))
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success."}), 200

@app.route("/login", methods=["POST"])
def login():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400
    data: dict = request.get_json()

    name = data.get("name")
    password = data.get("password")

    if name == None or password == None:
        return jsonify({"error": "misformatted JSON."}), 400
    
    try:
        session_token = user_manager.login(name, password)
        user = session_manager.authenticate(session_token)
    except (UserDoesNotExistError, InvalidUserCredentialsError):
        return jsonify({"error": "Invalid name or password."}), 401
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success.", "session_token": session_token, "user_uuid": user.uuid}), 200

@app.route("/logout", methods=["POST"])
def logout():
    session_token = request.headers.get("session-token")

    if session_token == None:
        return jsonify({"error": "Missing session-token in header."}), 401
    
    user_manager.logout(session_token)
    return jsonify({"message": "Success."}), 200

@app.route("/create_thread", methods=["POST"])
def create_thread():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400
    
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
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success.", "thread_uuid": thread_uuid}), 200

@app.route("/update_thread", methods=["PATCH"])
def update_thread():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400
    
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    thread_uuid = request.args.get("uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400

    data: dict = request.get_json()
    thread_name = data.get("name", None)
    thread_description = data.get("description", None)
    thread_thumbnail_base64 = data.get("thumbnail_base64", None)
    remove_thumbnail = data.get("remove_thumbnail", False)
    thread_password = data.get("password", None)
    
    try:
        thread = thread_manager.get_thread_from_uuid(thread_uuid)
    except ThreadDoesNotExistError:
        return jsonify({"error": "Thread does not exist."}), 404
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    if thread.author_user_uuid != user.uuid:
        return jsonify({"error": "Cannot update threads from a different user."}), 403

    try:
        thread_manager.update_thread(thread_uuid, name= thread_name, description=thread_description, thumbnail_base64=thread_thumbnail_base64, password=thread_password, remove_thumbnail=remove_thumbnail)
    except InvalidBase64ImageError:
        return jsonify({"error": "Provided image is invalid"}), 400
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success."}), 200

@app.route("/delete_thread", methods=["DELETE"])
def delete_thread():
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    thread_uuid = request.args.get("uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400
    
    try:
        thread = thread_manager.get_thread_from_uuid(thread_uuid)
    except ThreadDoesNotExistError:
        return jsonify({"error": "Thread does not exist."}), 404
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    if thread.author_user_uuid != user.uuid:
        return jsonify({"error": "Cannot delete a thread from a different user."}), 403

    try:
        thread_manager.delete_thread(thread_uuid)
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success."}), 200

@app.route("/create_message", methods=["POST"])
def create_message():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400
    
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    thread_uuid = request.args.get("uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400
    
    data: dict = request.get_json()
    message_body= data.get("message")
    attachment = data.get("attachment")

    if attachment != None:
        attachment, message, status_code = validate_attachment(attachment)
        if attachment == None:
            return jsonify({"error": message}), status_code

    if (message_body == None or message_body.strip() == "") and attachment == None:
        return jsonify({"error": "Message cannot be empty"}), 400

    try:    
        thread = thread_manager.get_thread_from_uuid(thread_uuid)   
    except ThreadDoesNotExistError:
        return jsonify({"error": "Thread does not exist."}), 404
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    if thread.private:
        password = request.headers.get("thread-password")

        if password == None:
            return jsonify({"error": "Missing thread-password in header"}), 401
        
        if not thread.authenticate(password):
            return jsonify({"error": "Invalid Password"}), 403
        
    message_uuid = thread_manager.create_message(thread_uuid, user, message_body, attachment)

    return jsonify({"message": "Success.", "message_uuid": message_uuid}), 200

@app.route("/update_message", methods=["PATCH"])
def update_message():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400
    
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    thread_uuid = request.args.get("uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400
    
    data: dict = request.get_json()
    message_uuid = data.get("message_uuid", None)

    message_body = data.get("message", None)
    remove_message_body = data.get("remove_message", False)
    attachment = data.get("attachment", None)
    remove_attachment = data.get("remove_attachment", False)
    
    if message_uuid == None:
        return jsonify({"error": "Missing message uuid."}), 400

    if attachment != None:
        attachment, message, status_code = validate_attachment(attachment)
        if attachment == None:
            return jsonify({"error": message}), status_code

    try:    
        thread = thread_manager.get_thread_from_uuid(thread_uuid)   
    except ThreadDoesNotExistError:
        return jsonify({"error": "Thread does not exist."}), 404
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    message = thread.messages.get(message_uuid, None)
    if message == None:
        return jsonify({"error": "Message does not exist."}), 404
    if message.author_user_uuid != user.uuid:
        return jsonify({"error": "Cannot update a message from a different user."}), 403
    
    if (remove_message_body or (message_body != None and message_body.strip() == "")) and message.attachment == None or remove_attachment and message.message == None:
        return jsonify({"error": "Message cannot be empty"}), 400

    thread_manager.update_message(thread_uuid, message_uuid, message_body=message_body, remove_message_body=remove_message_body, attachment=attachment, remove_attachment=remove_attachment)

    return jsonify({"message": "Success."}), 200

@app.route("/delete_message", methods=["DELETE"])
def delete_message():
    if not request.is_json:
        return jsonify({"error": "Missing JSON in request."}), 400
    
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    thread_uuid = request.args.get("uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400
    
    data: dict = request.get_json()
    message_uuid = data.get("message_uuid", None)

    if message_uuid == None:
        return jsonify({"error": "Missing message uuid."}), 400

    try:    
        thread = thread_manager.get_thread_from_uuid(thread_uuid)   
    except ThreadDoesNotExistError:
        return jsonify({"error": "Thread does not exist."}), 404
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    message = thread.messages.get(message_uuid, None)
    if message == None:
        return jsonify({"error": "Message does not exist."}), 404
    if message.author_user_uuid != user.uuid:
        return jsonify({"error": "Cannot delete a message from a different user."}), 403
    
    thread_manager.delete_message(thread_uuid, message_uuid)
    return jsonify({"message": "Success."}), 200

@app.route("/search_threads", methods=["GET"])
def search_threads():
    search_str = request.args.get("search")
    page = request.args.get("page")

    try:
        page = int(page)
    except Exception:
        page = 1

    threads = thread_manager.search_threads(search_str)
    
    threads.sort(key=lambda thread: thread.creation_date, reverse=True)
    display_threads = list(map(lambda thread: asdict(thread.to_display_thread()), threads))

    threads_count = len(display_threads)
    
    start_index, end_index, clamped_page = calculate_indexes_from_page(page, threads_count)  
    return jsonify({"message": "Success.", "threads": display_threads[start_index:end_index], "total_threads": threads_count, "page": clamped_page}), 200

@app.route("/get_thread", methods=["GET"])
def get_thread():
    thread_uuid = request.args.get("uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400
    
    try:    
        thread = thread_manager.get_thread_from_uuid(thread_uuid)   
    except ThreadDoesNotExistError:
        return jsonify({"error": "Thread does not exist."}), 404
    except Exception:
        return jsonify({"error": "Something went wrong."}), 500
    
    return jsonify({"message": "Success.", "thread": asdict(thread.to_display_thread())}), 200

@app.route("/get_threads", methods=["GET"])
def get_threads():
    thread_uuids = request.args.getlist("uuid")

    threads = thread_manager.get_theads(thread_uuids)
    
    dict_display_threads = {}

    for thread in threads:
        dict_display_threads[thread.uuid] = asdict(thread.to_display_thread())

    return jsonify({"message": "Success.", "threads": dict_display_threads}), 200

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
    except Exception:
        page = 1
    
    try:    
        thread = thread_manager.get_thread_from_uuid(thread_uuid)   
    except ThreadDoesNotExistError:
        return jsonify({"error": "Thread does not exist."}), 404
    except Exception:
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
    
    start_index, end_index ,clamped_page= calculate_indexes_from_page(page, messages_count) 
    return jsonify({"message": "Success.", "messages": dict_messages[start_index:end_index], "total_messages": messages_count, "page": clamped_page}), 200

@app.route("/save_thread", methods=["POST"])
def save_thread():
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    thread_uuid = request.args.get("uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400
    
    if not thread_manager.thread_exists(thread_uuid):
        return jsonify({"error": "Thread does not exist."}), 404
    
    user_manager.update_saved_thread(user.uuid, thread_uuid, True)

    return jsonify({"message": "Success."}), 200

@app.route("/unsave_thread", methods=["POST"])
def unsave_thread():
    user, message, status_code = authenticate_header_session_token(request)
    if user == None:
        return jsonify({"error": message}), status_code
    
    thread_uuid = request.args.get("uuid")

    if thread_uuid == None:
        return jsonify({"error": "Missing thread uuid."}), 400
    
    user_manager.update_saved_thread(user.uuid, thread_uuid, False)

    return jsonify({"message": "Success."}), 200
    
if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=False, port=int(PORT))