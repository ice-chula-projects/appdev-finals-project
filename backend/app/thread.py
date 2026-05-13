from __future__ import annotations
from datetime import datetime
from security import Security
from uuid import uuid4
from pymongo.collection import Collection
from settings import Settings
from user import User
from dataclasses import dataclass, asdict
from attachment import Attachement, validate_base64_image, InvalidBase64ImageError

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

    def get_display_threads(self, query_str:str = None) -> list[DisplayThread]:
        if query_str != None:
            filter = {
                "$or":[
                    {"name":{"$regex":query_str.lower(), "$options": "i"}},
                    {"description":{"$regex":query_str.lower(), "$options": "i"}}
                ]
            }
        else:
            filter = None

        displayThreads = []
        for thread in self.threads_collection.find(filter):
            thread: Thread = Thread.from_database_representation(thread)

            displayThread = DisplayThread(
                uuid = thread.uuid,
                name = thread.name,
                description = thread.description,
                thumbnail_base64 = thread.thumbnail_base64,
                author_user_uuid = thread.author_user_uuid,
                creation_date = thread.creation_date,
                last_modified_date = thread.last_modified_date,
                last_message_date = thread.last_message_date,
                private = thread.private
            )
            displayThreads.append(displayThread)
        
        return displayThreads

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
            if not validate_base64_image(thumbnail_base64):
                raise InvalidBase64ImageError
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
    
    def post_message(self, thread_uuid: str, author: User, message_body: str, attachment: Attachement = None):
        thread = self.get_thread_from_uuid(thread_uuid)

        message = thread.post_message(author, message_body, attachment)
        self.threads_collection.update_one({"_id": thread_uuid}, {"$set":{f"messages.{message.uuid}": asdict(message)}})

    def update_message(self, thread_uuid: str, message_uuid: str, actor: User,  message_body: str, attachment: Attachement = None):
        thread = self.get_thread_from_uuid(thread_uuid)

        message = thread.update_message(actor, message_uuid, message_body, attachment)
        self.threads_collection.update_one({"_id": thread_uuid}, {"$set":{f"messages.{message.uuid}": asdict(message)}})

    def delete_message(self, thread_uuid: str, message_uuid: str, actor: User):
        thread = self.get_thread_from_uuid(thread_uuid)
        message = thread.messages.get(message_uuid, None)
        if message == None:
            raise MessageDoesNotExistError
        
        if message.author_user_uuid != actor.uuid:
            raise MessageAuthenticationError
        
        self.threads_collection.update_one({"_id": thread_uuid}, {"$unset":{f"messages.{message_uuid}": ""}})
        
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
    
    def post_message(self, author: User, message_body: str, attachment: Attachement = None) -> Message:
        messages = self.messages
        
        while True:
            uuid = str(uuid4())
            
            if messages.get(uuid) == None:
                break
        
        if message_body == None:
            message_body = ""

        message = Message(
            uuid = uuid,
            author_user_uuid = author.uuid,
            message = message_body,
            attachment = attachment,
            creation_date = datetime.now(),
            last_modified_date = datetime.now()
        )

        messages[uuid] = message

        return message
    
    def update_message(self, author: User, message_uuid: str, message_body: str, attachment: Attachement = None) -> Message:
        message = self.messages.get(message_uuid, None)
        if message == None:
            raise MessageDoesNotExistError
        
        if message.author_user_uuid != author.uuid:
            raise MessageAuthenticationError
        
        message.message = message_body
        message.attachment = attachment
        message.last_modified_date = datetime.now()

        return message

class ThreadDoesNotExistError(Exception):
    pass

@dataclass
class DisplayThread:
    uuid: str = ""
    name: str = ""
    description: str = ""
    thumbnail_base64: str | None = None
    author_user_uuid: str = ""

    creation_date: datetime = None
    last_modified_date: datetime = None
    last_message_date: datetime = None

    private: bool = None

@dataclass
class Message:
    uuid: str = ""
    author_user_uuid: str = ""
    message: str = ""
    attachment: Attachement = None

    creation_date: datetime = None
    last_modified_date: datetime = None

class MessageDoesNotExistError(Exception):
    pass

class MessageAuthenticationError(Exception):
    pass
