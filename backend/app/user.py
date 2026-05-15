from __future__ import annotations

from security import Security
from uuid import uuid4
from pymongo.collection import Collection
from settings import Settings
from session import SessionManager
from attachment import validate_base64_image, InvalidBase64ImageError
from dataclasses import dataclass
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
    
    def get_user_profile(self, uuid: str) -> PublicUser:
        user = self.get_user_from_uuid(uuid)

        if user.profile_picture_base64 == None:
                user.profile_picture_base64 = self.settings.default_profile_picture
        return user.to_public_user()

    # meant for use when client needs names and pfps to display in messages
    def get_display_users(self, uuids: list[str]) -> list[DisplayUser]:
        users = self.users_collection.find({"_id":{"$in": uuids}})

        display_users = []
        for user in users:
            user: User = User.from_database_representation(user)

            if user.profile_picture_base64 == None:
                user.profile_picture_base64 = self.settings.default_profile_picture

            display_users.append(user.to_display_user())
        
        return display_users
    
    # creates a user and adds them to the database
    def create_user(self, name: str, password: str) -> str:
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
        user.password_salt = Security.generate_random_salt()
        user.password_hash = Security.calculate_password_hash(password, user.password_salt)

        users_collection.insert_one(user.to_database_representation())
        return user.uuid
    
    def update_user(self, user_uuid: str, name: str = None, motd: str = None, profile_picture_base64: str = None, password: str = None):
        user = self.get_user_from_uuid(user_uuid)

        update_map = {}

        if name != None:
            if name != user.name and self.users_collection.find_one({"name": name}) != None:
                raise UserNameAlreadyExistsError
            update_map["name"] = name
        
        if motd != None:
            user.motd = motd
            update_map["motd"] = motd
        
        if profile_picture_base64 != None:
            if not validate_base64_image(profile_picture_base64):
                raise InvalidBase64ImageError
            update_map["profile_picture_base64"] = profile_picture_base64

        if password != None:
            update_map["password_hash"] = Security.calculate_password_hash(password, user.password_salt)

        self.users_collection.update_one({"_id": user_uuid}, {"$set": update_map})

    def delete_user(self, user_uuid: str):
        self.users_collection.delete_one({"_id": user_uuid})

    def get_users(self) -> list[User]:
        users: list[User] = []
        for user in self.users_collection.find():
            users.append(User.from_database_representation(user))
        
        return users
    
    def update_thread_history(self, user_uuid: str, thread_uuid: str):
        user = self.get_user_from_uuid(user_uuid)
        thread_history = user.thread_history

        # remove the uuid from thread history if it's already in there so that when it gets readded
        # the thread just gets pushed to the top
        if thread_uuid in thread_history:
            thread_history.remove(thread_uuid)

        thread_history.insert(0, thread_uuid)
        if len(thread_history) > self.settings.max_thread_history_length:
            thread_history.pop()

        self.users_collection.update_one({"_id": user_uuid}, {"$set": {"thread_history": thread_history}})
        
    
    # returns the session token
    def login(self, name: str, password: str) -> str:
        user = self.get_user_from_name(name)

        if not Security.compare_hash(password, user.password_salt, user.password_hash):
            raise InvalidUserCredentialsError
        
        return self.session_manager.create_session(user)

    def logout(self, session_token: str):
        self.session_manager.delete_session(session_token)

class UserNameAlreadyExistsError(Exception):
    pass

class UserDoesNotExistError(Exception):
    pass

class InvalidUserCredentialsError(Exception):
    pass

class User:
    uuid: str = ""

    name: str = ""
    motd: str = ""
    profile_picture_base64: str | None = None
    
    password_salt: str = ""
    password_hash: str = ""

    #list of thread uuids
    saved_threads: list[str] = []
    thread_history: list[str] = []

    def from_database_representation(database_representation: dict) -> User:
        user = User()
        for key, value in database_representation.items():
            # rename id
            if key == "_id":
                key = "uuid"

            setattr(user, key, value)
        
        return user

    def to_database_representation(self) -> dict:
        database_representation = vars(self).copy()
        # mongodb excepts the id to be named _id
        database_representation["_id"] = database_representation.pop("uuid")
        return database_representation
    
    def to_display_user(self) -> DisplayUser:
        return DisplayUser(
            uuid = self.uuid,
            name = self.name,
            profile_picture_base64 = self.profile_picture_base64
        )
    
    def to_public_user(self) -> PublicUser:
        return PublicUser(
            uuid = self.uuid,
            name = self.name,
            motd = self.motd,
            profile_picture_base64 = self.profile_picture_base64,
            saved_threads=self.saved_threads,
            thread_history=self.thread_history
        )

# user information that gets sent to the client when someone visits a specific profile
@dataclass
class PublicUser:
    uuid: str = None
    name: str = None
    motd: str = None
    profile_picture_base64:str = None

    #list of uuids
    saved_threads: list[str] = None
    thread_history: list[str] = None

# user information that gets sent to the client for use when viewing a message from them
@dataclass
class DisplayUser:
    uuid: str = None
    name: str = None
    profile_picture_base64:str = None