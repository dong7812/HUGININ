from dataclasses import dataclass

from application.exceptions import InvalidCredentialsError
from application.ports.password_port import PasswordPort
from application.ports.token_port import TokenPort
from domain.repositories.user_repository import UserRepository


@dataclass
class LoginInput:
    email: str
    password: str


@dataclass
class LoginOutput:
    access_token: str
    user_id: str


class LoginUseCase:
    def __init__(
        self,
        user_repo: UserRepository,
        token_port: TokenPort,
        password_port: PasswordPort,
    ) -> None:
        self._user_repo = user_repo
        self._token_port = token_port
        self._password_port = password_port

    async def execute(self, input: LoginInput) -> LoginOutput:
        user = await self._user_repo.find_by_email(input.email)
        if not user or not self._password_port.verify(input.password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")

        token = self._token_port.create_access_token(user.id)
        return LoginOutput(access_token=token, user_id=str(user.id))
