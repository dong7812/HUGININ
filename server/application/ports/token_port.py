from abc import ABC, abstractmethod
from uuid import UUID


class TokenPort(ABC):
    @abstractmethod
    def create_access_token(self, user_id: UUID) -> str: ...

    @abstractmethod
    def decode_user_id(self, token: str) -> UUID: ...
