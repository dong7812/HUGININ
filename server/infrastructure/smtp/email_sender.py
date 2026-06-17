"""비동기 SMTP 이메일 발송."""
from __future__ import annotations

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


class EmailSender:
    def __init__(self, host: str, port: int, user: str, password: str, from_addr: str) -> None:
        self._host = host
        self._port = port
        self._user = user
        self._password = password
        self._from = from_addr
        self._enabled = bool(host and user and password)

    async def send_verification(self, to_email: str, name: str, token: str, frontend_url: str) -> None:
        if not self._enabled:
            logger.warning("SMTP not configured — verification email skipped for %s", to_email)
            return

        verify_url = f"{frontend_url}/auth/verify?token={token}"
        subject = "HUGININ 이메일 인증"
        html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="font-size:20px;font-weight:700;color:#111;margin-bottom:8px">안녕하세요, {name}님</h2>
          <p style="color:#555;font-size:14px;line-height:1.6;margin-bottom:24px">
            아래 버튼을 눌러 이메일 인증을 완료하세요.<br>
            링크는 24시간 동안 유효합니다.
          </p>
          <a href="{verify_url}"
             style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
                    padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">
            이메일 인증하기
          </a>
          <p style="color:#aaa;font-size:12px;margin-top:32px">
            본인이 요청하지 않은 경우 이 이메일을 무시하세요.
          </p>
        </div>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = self._from
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html", "utf-8"))

        try:
            import aiosmtplib
            await aiosmtplib.send(
                msg,
                hostname=self._host,
                port=self._port,
                username=self._user,
                password=self._password,
                start_tls=True,
            )
            logger.info("Verification email sent to %s", to_email)
        except Exception as e:
            logger.error("Failed to send verification email to %s: %s", to_email, e)
