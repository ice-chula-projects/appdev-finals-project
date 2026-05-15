from enum import Enum
from dataclasses import dataclass
from PIL import Image
import io
import base64

def validate_base64_image(image_base64:str):
    try:
        decoded_bytes = base64.b64decode(image_base64, validate=True)

        with Image.open(io.BytesIO(decoded_bytes)) as image:
            image.verify()
        
        return True
    except:
        return False

def validate_base64_string(base64_str:str):
    try:
        base64.b64decode(base64_str, validate=True)
        return True
    except:
        return False

class InvalidBase64ImageError(Exception):
    pass

class AttachmentMediaTypes(Enum):
    TEXT = "text"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    APPLICATION = "application"

@dataclass
class Attachment:
    data_base64: str = ""
    # png/jpg etc
    extension_type: str = ""
    media_type: AttachmentMediaTypes = None
