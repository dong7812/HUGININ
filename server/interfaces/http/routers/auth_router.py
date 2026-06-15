from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status

from application.exceptions import DuplicateEmailError, InvalidCredentialsError
from application.use_cases.auth.login import LoginInput
from application.use_cases.auth.register import RegisterInput
from interfaces.http.middleware.rbac_middleware import get_current_user_id
from interfaces.http.schemas.auth_schema import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, request: Request):
    try:
        result = await request.app.state.register_uc.execute(
            RegisterInput(email=body.email, name=body.name, password=body.password)
        )
    except DuplicateEmailError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return TokenResponse(access_token=result.access_token, user_id=result.user_id)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request):
    try:
        result = await request.app.state.login_uc.execute(
            LoginInput(email=body.email, password=body.password)
        )
    except InvalidCredentialsError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    return TokenResponse(access_token=result.access_token, user_id=result.user_id)


@router.post("/service-token", response_model=TokenResponse)
async def create_service_token(
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    """MCP/Git hook 자동화용 장기 토큰 발급 (365일).

    현재 로그인 토큰으로 인증 후 호출. 발급된 토큰을 .mcp.json에 설정한다:

        { "mcpServers": { "huginin": { "url": "...", "type": "sse",
            "headers": { "Authorization": "Bearer <service-token>" } } } }
    """
    token = request.app.state.token_port.create_service_token(user_id)
    return TokenResponse(access_token=token, user_id=str(user_id))
