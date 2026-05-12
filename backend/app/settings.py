import json

class Settings:
    default_profile_picture:str
    session_length_hours:float

    def __init__(self, file):
        settings: dict = json.load(file)

        self.default_profile_picture = settings.get("defualt_profile_picture")
        self.session_length_hours = float(settings.get("session_length_hours"))
