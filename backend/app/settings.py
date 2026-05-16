import json

class Settings:
    default_profile_picture:str
    session_length_hours:float
    max_thread_history_length: int
    name: str

    def __init__(self, file):
        settings: dict = json.load(file)

        self.default_profile_picture = settings.get("default_profile_picture")
        self.session_length_hours = float(settings.get("session_length_hours"))
        self.max_thread_history_length = int(settings.get("max_thread_history_length"))
        self.name = settings.get("name")