import secrets
import string
import hashlib

class Security:
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

    def compare_hash(password: str, password_salt: str, password_hash: str):
        calculated_hash = Security.calculate_password_hash(password, password_salt)
        
        return secrets.compare_digest(calculated_hash, password_hash)

class InvalidPasswordError(Exception):
    pass