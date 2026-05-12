from __future__ import annotations

import string
import secrets
import hashlib
from uuid import uuid4
from pymongo.collection import Collection
from settings import Settings
from session import SessionManager

#contains code related to user management
class UserManager:
    users_collection: Collection
    settings: Settings
    session_manager: SessionManager

    def __init__(self, users_collection: Collection, session_manager: SessionManager, settings: Settings):
        self.users_collection = users_collection
        self.session_manager = session_manager
        self.settings = settings

    def get_user_from_uuid(self, uuid: str) -> User:
        user = self.users_collection.find_one({"_id": uuid})
        if user == None:
            raise UserDoesNotExistError()

        return User.from_database_representation(user)

    def get_user_from_name(self, name: str) -> User:
        user = self.users_collection.find_one({"name": name})
        if user == None:
            raise UserDoesNotExistError()
        
        return User.from_database_representation(user)

    # creates a user and adds them to the database
    def create_user(self, name: str, password: str) -> User:
        users_collection = self.users_collection
        user = User()
        
        # make sure that no user with that name already exists
        search = users_collection.find_one({"name": name})

        if search != None:
            raise UserNameAlreadyExistsError()

        # in theory this should only run once, but there is a very tiny chance that uuid4 could generate a collision
        # in that case just try again
        while True:
            uuid = str(uuid4())
            
            search = users_collection.find_one({"_id": uuid})
            if search == None:
                break
        
        user.uuid = uuid
        user.name = name
        user.password_salt = UserManager.generate_random_salt()
        user.password_hash = UserManager.calculate_password_hash(password, user.password_salt)

        users_collection.insert_one(user.to_database_representation())
        return user

    def get_users(self) -> list[User]:
        users: list[User] = []
        for user in self.users_collection.find():
            users.append(User.from_database_representation(user))
        
        return users
    
    # returns the session token
    def login(self, name: str, password: str) -> str:
        user = self.get_user_from_name(name)

        password_hash = UserManager.calculate_password_hash(password, user.password_salt)

        if password_hash != user.password_hash:
            raise InvalidPasswordError
        
        return self.session_manager.create_session(user)

    def logout(self, session_token: str):
        self.session_manager.delete_session(session_token)


    # simple hashing and salting to increase security
    # note: this is not secure against brute force attacks as sha256 is a fast algorithm to compute
    # but this is better than storing everything in plain text
    def calculate_password_hash(password:str, password_salt:str) -> str:
        sha256 = hashlib.sha256()
        sha256.update((password + password_salt).encode("utf-8"))
        return sha256.hexdigest()
    
    # returns a random salt of length 16
    def generate_random_salt() -> str:
        valid_letters = string.ascii_letters + string.digits
        return "".join([secrets.choice(valid_letters) for i in range(16)])

class UserNameAlreadyExistsError(Exception):
    pass

class UserDoesNotExistError(Exception):
    pass

class InvalidPasswordError(Exception):
    pass

class User:
    uuid: str = ""

    name: str = ""
    motd: str = ""
    profile_picture: str | None = None
    
    password_salt: str = ""
    password_hash: str = ""

    #list of thread uuids
    saved_threads: list[str] = []
    thread_history: list[str] = []

    def from_database_representation(database_representation:dict) -> User:
        user = User()

        user.uuid = database_representation.get("_id")
        user.name = database_representation.get("name")
        user.motd = database_representation.get("motd")
        user.profile_picture = database_representation.get("profile_picture")
        user.password_salt = database_representation.get("password_salt")
        user.password_hash = database_representation.get("password_hash")
        user.saved_threads = database_representation.get("saved_threads")
        user.thread_history = database_representation.get("thread_history")

        return user

    def to_database_representation(self) -> dict:
        return {
            "_id": self.uuid,
            "name": self.name,
            "motd": self.motd,
            "profile_picture": self.profile_picture,
            "password_salt": self.password_salt,
            "password_hash": self.password_hash,
            "saved_threads": self.saved_threads,
            "thread_history": self.thread_history
        }

# user information that gets sent to the client
class PublicUser:
    uuid: str
    name: str
    motd: str
    profile_picture:str

    saved_threads: str
    thread_history: str