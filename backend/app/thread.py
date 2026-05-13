from __future__ import annotations
from datetime import datetime
from enum import Enum
from security import Security
from uuid import uuid4
from pymongo.collection import Collection
from settings import Settings
from user import User
from dataclasses import dataclass, asdict

class ThreadManager:
    threads_collection: Collection
    settings: Settings
    
    def __init__(self, threads_collection: Collection, settings: Settings):
        self.threads_collection = threads_collection
        self.settings = settings

    def get_thread_from_uuid(self, uuid: str) -> Thread:
        thread = self.threads_collection.find_one({"_id": uuid})
        if thread == None:
            raise ThreadDoesNotExistError()

        return Thread.from_database_representation(thread)

    def create_thread(self, name: str, description: str, author: User, thumbnail_base64: str = None, password: str = None):
        threads_collection = self.threads_collection
        
        # in theory, still not needed
        while True:
            uuid = str(uuid4())
            
            search = threads_collection.find_one({"_id": uuid})
            if search == None:
                break
        
        thread = Thread()

        thread.uuid = uuid
        thread.name = name
        thread.description = description
        if thumbnail_base64 != None:
            thread.thumbnail_base64 = thumbnail_base64
        thread.author_user_uuid = author.uuid

        thread.creation_date = datetime.now()
        thread.last_modified_date = datetime.now()
        thread.last_message_date = datetime.now()

        thread.private = password != None
        if thread.private:
            thread.password_salt = Security.generate_random_salt()
            thread.password_hash = Security.calculate_password_hash(password, thread.password_salt)
        
        thread.messages = {}

        threads_collection.insert_one(thread.to_database_representation())
        return thread.uuid
    
    def post_message(self, thread_uuid: str, author: User, message: str, attachment: Attachement = None):
        thread = self.get_thread_from_uuid(thread_uuid)

        message = thread.post_message(author, message, attachment)
        self.threads_collection.update_one({"_id": thread_uuid}, {"$set":{f"messages.{message.uuid}": asdict(message)}})

class Thread:
    uuid: str = ""
    name: str = ""
    description: str = ""
    thumbnail_base64: str | None = None
    author_user_uuid: str = ""

    creation_date: datetime = None
    last_modified_date: datetime = None
    last_message_date: datetime = None

    private: bool
    password_salt: str | None = None
    password_hash: str | None = None
    
    messages: dict[str, Message]

    def from_database_representation(database_representation: dict) -> Thread:
        thread = Thread()
        for key, value in database_representation.items():
            # rename id
            if key == "_id":
                key = "uuid"

            setattr(thread, key, value)
        
        return thread

    def to_database_representation(self) -> dict:
        database_representation = vars(self).copy()
        # mongodb excepts the id to be named _id
        database_representation["_id"] = database_representation.pop("uuid")
        return database_representation
    
    def post_message(self, author: User, message: str, attachment: Attachement = None) -> Message:
        messages = self.messages
        
        while True:
            uuid = str(uuid4())
            
            if messages.get(uuid) == None:
                break
        
        if message == None:
            message = ""

        message = Message(
            uuid = uuid,
            author_user_uuid = author.uuid,
            message = message,
            attachment = attachment,
            creation_date = datetime.now(),
            last_modified_date = datetime.now()
        )

        messages[uuid] = message

        return message

class ThreadDoesNotExistError(Exception):
    pass

@dataclass
class Message:
    uuid: str = ""
    author_user_uuid: str = ""
    message: str = ""
    attachment: Attachement = None

    creation_date: datetime = None
    last_modified_date: datetime = None

class AttachmentMediaTypes(Enum):
    FILE = "file"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"

@dataclass
class Attachement:
    data_base64: str = ""
    # png/jpg etc
    extension_type: str = ""
    media_type: AttachmentMediaTypes = None

