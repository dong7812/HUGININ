from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from application.ports.password_port import PasswordPort

_ph = PasswordHasher()


class Argon2PasswordService(PasswordPort):
    def hash(self, plain: str) -> str:
        return _ph.hash(plain)

    def verify(self, plain: str, hashed: str) -> bool:
        try:
            return _ph.verify(hashed, plain)
        except VerifyMismatchError:
            return False
