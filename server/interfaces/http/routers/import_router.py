from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel

from application.exceptions import NotFoundError
from application.use_cases.collect.import_doc import DocSection, ImportDocInput
from interfaces.http.middleware.rbac_middleware import get_current_user_id

router = APIRouter(prefix="/workspace", tags=["import"])


class SectionPayload(BaseModel):
    heading: str
    content: str
    codebase_snippets: str = ""


class ImportDocRequest(BaseModel):
    doc_path: str
    sections: list[SectionPayload]
    project_id: UUID | None = None


class ReviewRequest(BaseModel):
    validation_status: str          # reviewed | rejected | outdated
    what_was_decided: str | None = None
    why: str | None = None


@router.post("/{workspace_id}/import-doc", status_code=status.HTTP_202_ACCEPTED)
async def import_doc(
    workspace_id: UUID,
    body: ImportDocRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    sections = [
        DocSection(heading=s.heading, content=s.content, codebase_snippets=s.codebase_snippets)
        for s in body.sections
    ]
    try:
        result = await request.app.state.import_doc_uc.execute(
            ImportDocInput(
                workspace_id=workspace_id,
                user_id=user_id,
                doc_path=body.doc_path,
                sections=sections,
                project_id=body.project_id,
            )
        )
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"event_ids": result.event_ids, "section_count": result.section_count}


@router.get("/{workspace_id}/docs/pending")
async def list_doc_pending(
    workspace_id: UUID,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    rows = await request.app.state.event_repo.list_doc_pending(workspace_id)
    return {"items": [_serialize_doc_row(r) for r in rows]}


@router.patch("/{workspace_id}/docs/{event_id}/review", status_code=status.HTTP_200_OK)
async def review_doc(
    workspace_id: UUID,
    event_id: UUID,
    body: ReviewRequest,
    request: Request,
    user_id: UUID = Depends(get_current_user_id),
):
    allowed = {"reviewed", "rejected", "outdated"}
    if body.validation_status not in allowed:
        raise HTTPException(status_code=400, detail=f"validation_status must be one of {allowed}")
    await request.app.state.event_repo.update_doc_review(
        event_id=event_id,
        validation_status=body.validation_status,
        what_was_decided=body.what_was_decided,
        why=body.why,
    )
    return {"ok": True}


def _serialize_doc_row(r: dict) -> dict:
    return {
        "event_id": str(r["id"]),
        "doc_path": r["doc_path"],
        "validation_status": r["validation_status"],
        "created_at": r["created_at"].isoformat() if r["created_at"] else None,
        "what_was_decided": r["what_was_built"],
        "why": r["problem_solved"],
        "alternatives": r["rejected_alternatives"],
        "constraints": r["implicit_constraints"],
        "validation_note": r["tradeoffs"],
        "decision_type": r["decision_type"],
        "status": r["status"],
        "section_content": r["section_content"],
    }
