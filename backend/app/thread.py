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

    def search_threads(self, query_str:str = None) -> list[Thread]:
        if query_str != None:
            filter = {
                "$or":[
                    {"name":{"$regex":query_str.lower(), "$options": "i"}},
                    {"description":{"$regex":query_str.lower(), "$options": "i"}}
                ]
            }
        else:
            filter = None

        return [Thread.from_database_representation(thread) for thread in self.threads_collection.find(filter)]

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
    
    def update_thread(self, thread_uuid: str, name: str = None, description: str = None, thumbnail_base64: str = None, password:str = None): 
        thread = self.get_thread_from_uuid(thread_uuid)
        update_map = {}

        if name != None:
            update_map["name"] = name
            
        if description != None:
            update_map["description"] = description
            
        if thumbnail_base64 != None:
            if not validate_base64_image(thumbnail_base64):
                raise InvalidBase64ImageError
            update_map["thumbnail_base64"] = thumbnail_base64
            
        if password != None:
            private = password == ""
            update_map["private"] = private
            if private:
                update_map["password_hash"] = Security.calculate_password_hash(password, thread.password_salt)
            else:
                update_map["password_hash"] = None
        
        update_map["last_modified_date"] = datetime.now()
        
        self.threads_collection.update_one({"_id": thread_uuid}, {"$set": update_map})

    def delete_thread(self, thread_uuid: str):
        self.threads_collection.delete_one({"_id": thread_uuid})
    
    def post_message(self, thread_uuid: str, author: User, message_body: str, attachment: Attachement = None):
        thread = self.get_thread_from_uuid(thread_uuid)

        message = thread.post_message(author, message_body, attachment)
        self.threads_collection.update_one({"_id": thread_uuid}, {"$set":{f"messages.{message.uuid}": asdict(message), "last_message_date": datetime.now()}})

    def update_message(self, thread_uuid: str, message_uuid: str,  message_body: str, attachment: Attachement = None):
        thread = self.get_thread_from_uuid(thread_uuid)

        message = thread.update_message(message_uuid, message_body, attachment)
        self.threads_collection.update_one({"_id": thread_uuid}, {"$set":{f"messages.{message.uuid}": asdict(message)}})

    def delete_message(self, thread_uuid: str, message_uuid: str):
        thread = self.get_thread_from_uuid(thread_uuid)
        message = thread.messages.get(message_uuid, None)
        if message == None:
            raise MessageDoesNotExistError
        
        self.threads_collection.update_one({"_id": thread_uuid}, {"$unset":{f"messages.{message_uuid}": ""}})
        
class Thread:
    uuid: str = None
    name: str = None
    description: str = None
    thumbnail_base64: str | None = None
    author_user_uuid: str = None

    creation_date: datetime = None
    last_modified_date: datetime = None
    last_message_date: datetime = None

    private: bool
    password_salt: str | None = None
    password_hash: str | None = None
    
    messages: dict[str, Message] = None

    def from_database_representation(database_representation: dict) -> Thread:
        thread = Thread()
        for key, value in database_representation.items():
            # rename id
            if key == "_id":
                key = "uuid"

            setattr(thread, key, value)
        
        if thread.messages == None:
            thread.messages = {}

        for message_uuid, message_dict in thread.messages.items():
            message = Message()
            for key, value in message_dict.items():
                setattr(message, key, value)
                
            thread.messages[message_uuid] = message 
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
    
    def update_message(self, message_uuid: str, message_body: str, attachment: Attachement = None) -> Message:
        message = self.messages.get(message_uuid, None)
        if message == None:
            raise MessageDoesNotExistError
        
        message.message = message_body
        message.attachment = attachment
        message.last_modified_date = datetime.now()

        return message
    
    def authenticate(self, password: str) -> bool:
        return Security.compare_hash(password, self.password_salt, self.password_hash)
    
    def to_display_thread(self) -> DisplayThread:
        return DisplayThread(
                uuid = self.uuid,
                name = self.name,
                description = self.description,
                thumbnail_base64 = self.thumbnail_base64,
                author_user_uuid = self.author_user_uuid,
                creation_date = self.creation_date,
                last_modified_date = self.last_modified_date,
                last_message_date = self.last_message_date,
                private = self.private
            )

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