from __future__ import annotations
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from application.exceptions import DuplicateEmailError, InvalidCredentialsError
from application.use_cases.auth.login import LoginInput
from application.use_cases.auth.register import RegisterInput
from interfaces.http.middleware.rbac_middleware import get_current_user_id
from interfaces.http.schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


# ── 기본 인증 ──────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, request: Request):
    try:
        result = await request.app.state.register_uc.execute(
            RegisterInput(email=body.email, name=body.name, password=body.password)
        )
    except DuplicateEmailError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return TokenResponse(
        access_token=result.access_token,
        user_id=result.user_id,
        email_verified=result.email_verified,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request):
    try:
        result = await request.app.state.login_uc.execute(
            LoginInput(email=body.email, password=body.password)
        )
    except InvalidCredentialsError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    return TokenResponse(access_token=result.access_token, user_id=result.user_id)


# ── 이메일 인증 ────────────────────────────────────────────────────────────────

@router.get("/verify-email")
async def verify_email(token: str, request: Request):
    user_repo = request.app.state.user_repo
    frontend_url = request.app.state.frontend_url
    user = await user_repo.find_by_verification_token(token)
    if not user:
        return RedirectResponse(f"{frontend_url}/auth/verify?error=invalid")
    await user_repo.verify_email(user.id)
    jwt_token = request.app.state.token_port.create_access_token(user.id)
    return RedirectResponse(f"{frontend_url}/auth/verify?token={jwt_token}&user_id={user.id}")


# ── Google OAuth ───────────────────────────────────────────────────────────────

@router.get("/google")
async def google_login(request: Request, state: str = ""):
    google = request.app.state.google_oauth
    if not google.enabled:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    return RedirectResponse(google.get_auth_url(state=state))


@router.get("/google/callback")
async def google_callback(code: str, request: Request, state: str = ""):
    google = request.app.state.google_oauth
    if not google.enabled:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    try:
        info = await google.exchange_code(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google OAuth failed: {e}")

    user_repo = request.app.state.user_repo
    token_port = request.app.state.token_port
    frontend_url = request.app.state.frontend_url

    user = await user_repo.find_by_google_id(info["google_id"])
    if not user:
        user = await user_repo.find_by_email(info["email"])
        if user:
            await user_repo.set_google_id(user.id, info["google_id"])
        else:
            from domain.entities.user import User as UserEntity
            user = UserEntity.create_from_google(info["email"], info["name"], info["google_id"])
            await user_repo.save(user)

    jwt_token = token_port.create_access_token(user.id)

    # CLI session과 연결된 경우
    if state and state.startswith("cli_"):
        session_id = state[4:]
        try:
            await user_repo.complete_cli_session(session_id, user.id, jwt_token)
            return RedirectResponse(f"{frontend_url}/auth/cli?session={session_id}&done=1")
        except Exception:
            pass

    return RedirectResponse(f"{frontend_url}/auth/google/callback?token={jwt_token}&user_id={user.id}")


# ── CLI 브라우저 로그인 ────────────────────────────────────────────────────────

@router.post("/cli/session")
async def create_cli_session(request: Request):
    user_repo = request.app.state.user_repo
    session_id = await user_repo.create_cli_session()
    frontend_url = request.app.state.frontend_url
    return {
        "session_id": session_id,
        "auth_url": f"{frontend_url}/auth/cli?session={session_id}",
    }


@router.get("/cli/poll/{session_id}")
async def poll_cli_session(session_id: str, request: Request):
    user_repo = request.app.state.user_repo
    result = await user_repo.poll_cli_session(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="session not found or expired")
    return result


class AuthorizeBody(BaseModel):
    jwt_token: str
    user_id: str


@router.post("/cli/authorize/{session_id}")
async def authorize_cli_session(
    session_id: str,
    body: AuthorizeBody,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    user_repo = request.app.state.user_repo
    await user_repo.complete_cli_session(session_id, user_id, body.jwt_token)
    return {"ok": True}


# ── Service token ──────────────────────────────────────────────────────────────

@router.post("/service-token", response_model=TokenResponse)
async def create_service_token(
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    """MCP/Git hook 자동화용 장기 토큰 발급 (365일)."""
    token = request.app.state.token_port.create_service_token(user_id)
    return TokenResponse(access_token=token, user_id=str(user_id))
