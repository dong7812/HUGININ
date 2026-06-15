from datetime import datetime, timedelta
from uuid import UUID

from jose import JWTError, jwt

from application.exceptions import InvalidCredentialsError
from application.ports.token_port import TokenPort

_ALGORITHM = "HS256"
_EXPIRE_DAYS = 30
_SERVICE_TOKEN_DAYS = 365


class JwtService(TokenPort):
    def __init__(self, secret: str) -> None:
        self._secret = secret

    def create_access_token(self, user_id: UUID) -> str:
        payload = {
            "sub": str(user_id),
            "exp": datetime.utcnow() + timedelta(days=_EXPIRE_DAYS),
        }
        return jwt.encode(payload, self._secret, algorithm=_ALGORITHM)

    def create_service_token(self, user_id: UUID) -> str:
        """MCP/CLI 자동화용 장기 토큰 (365일)."""
        payload = {
            "sub": str(user_id),
            "exp": datetime.utcnow() + timedelta(days=_SERVICE_TOKEN_DAYS),
            "type": "service",
        }
        return jwt.encode(payload, self._secret, algorithm=_ALGORITHM)

    def decode_user_id(self, token: str) -> UUID:
        try:
            payload = jwt.decode(token, self._secret, algorithms=[_ALGORITHM])
            return UUID(payload["sub"])
        except (JWTError, KeyError, ValueError):
            raise InvalidCredentialsError("Invalid or expired token")
