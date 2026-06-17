from __future__ import annotations
import secrets
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
    email_verified: bool


class RegisterUseCase:
    def __init__(
        self,
        user_repo: UserRepository,
        token_port: TokenPort,
        password_port: PasswordPort,
        email_sender=None,
        frontend_url: str = "https://huginin.vercel.app",
    ) -> None:
        self._user_repo = user_repo
        self._token_port = token_port
        self._password_port = password_port
        self._email_sender = email_sender
        self._frontend_url = frontend_url

    async def execute(self, input: RegisterInput) -> RegisterOutput:
        if await self._user_repo.find_by_email(input.email):
            raise DuplicateEmailError(f"{input.email} is already registered")

        hashed = self._password_port.hash(input.password)
        verification_token = secrets.token_urlsafe(32)
        user = User.create(input.email, input.name, hashed, email_verified=False)
        user.verification_token = verification_token
        await self._user_repo.save(user)

        if self._email_sender:
            import asyncio
            asyncio.create_task(
                self._email_sender.send_verification(
                    input.email, input.name, verification_token, self._frontend_url
                )
            )

        token = self._token_port.create_access_token(user.id)
        return RegisterOutput(
            access_token=token,
            user_id=str(user.id),
            email_verified=False,
        )
