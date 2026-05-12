from __future__ import annotations
import secrets
from datetime import timedelta, datetime
from settings import Settings

# i hate this
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from user import User

class SessionManager:
    settings: Settings

    # how long to wait minimum before attempting another expired sessions cleanup
    cleanup_interval: timedelta = timedelta(hours=3)

    sessions: dict[str, Session] = {}
    last_clean_up_time: datetime = None
    
    def __init__(self, settings: Settings):
        self.settings = settings
    
    def clean_expired_sessions(self):
        expired_tokens = []
        for token, session in self.sessions.items():
            if datetime.now() > session.expiry_date:
                expired_tokens.append(token)
        
        for expired_token in expired_tokens:
            self.sessions.pop(expired_token)
        
        self.last_clean_up_time = datetime.now()

    # returns the session token
    def create_session(self, user: User) -> str:
        # periodically clean up expired sessions when creating a new session
        if self.last_clean_up_time == None or datetime.now() - self.last_clean_up_time:
            self.clean_expired_sessions()

        # generate token
        # chance of a collision is insanely low, so we can just check and retry if it occurs
        while True:
            session_token = secrets.token_urlsafe(32)
            if self.sessions.get(session_token) == None:
                break
        
        session = Session(user, datetime.now() + timedelta(hours = self.settings.session_length_hours))
        self.sessions[session_token] = session

        return session_token
    
    # will raise an error if authenication fails
    # otherwise returns the User
    def authenticate(self, session_token: str) -> User:
        session = self.sessions.get(session_token)
        if session == None:
            raise SessionDoesNotExistError()
        
        if datetime.now() > session.expiry_date:
            raise SessionExpiredError()
        
        # update expiry date so that actively used tokens dont expire
        session.expiry_date = datetime.now() + timedelta(hours = self.settings.session_length_hours)

        return session.user
    
    def delete_session(self, session_token: str):
        self.sessions.pop(session_token)
        
class Session:
    user: User
    expiry_date:datetime

    def __init__(self, user: User, expiry_date:datetime):
        self.user = user
        self.expiry_date = expiry_date

class SessionExpiredError(Exception):
    pass

class SessionDoesNotExistError(Exception):
    pass