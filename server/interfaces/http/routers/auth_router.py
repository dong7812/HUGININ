from fastapi import APIRouter, HTTPException, Request, status

from application.exceptions import DuplicateEmailError, InvalidCredentialsError
from application.use_cases.auth.login import LoginInput
from application.use_cases.auth.register import RegisterInput
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
