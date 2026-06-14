from dataclasses import dataclass

from application.exceptions import DuplicateEmailError
from application.ports.password_port import PasswordPort
from application.ports.token_port import TokenPort
from domain.entities.user import User
from domain.repositories.user_repository import UserRepository


@dataclass
class RegisterInput:
    email: str
    name: str
    password: str


@dataclass
class RegisterOutput:
    access_token: str
    user_id: str


class RegisterUseCase:
    def __init__(
        self,
        user_repo: UserRepository,
        token_port: TokenPort,
        password_port: PasswordPort,
    ) -> None:
        self._user_repo = user_repo
        self._token_port = token_port
        self._password_port = password_port

    async def execute(self, input: RegisterInput) -> RegisterOutput:
        if await self._user_repo.find_by_email(input.email):
            raise DuplicateEmailError(f"{input.email} is already registered")

        hashed = self._password_port.hash(input.password)
        user = User.create(input.email, input.name, hashed)
        await self._user_repo.save(user)

        token = self._token_port.create_access_token(user.id)
        return RegisterOutput(access_token=token, user_id=str(user.id))
