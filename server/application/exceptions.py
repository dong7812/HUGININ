class DuplicateEmailError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class NotFoundError(Exception):
    pass


class PermissionDeniedError(Exception):
    pass


class AlreadyMemberError(Exception):
    pass


class InvalidInviteCodeError(Exception):
    pass


class DuplicateEventError(Exception):
    """commit_hash 기반 멱등성: 동일 커밋 재전송 시 발생."""
    pass


class SoleOwnerError(Exception):
    """워크스페이스 유일 owner가 탈퇴/양도 불가 시 발생."""
    pass
