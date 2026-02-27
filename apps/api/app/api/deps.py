from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.auth.supabase_jwt import UserContext, get_current_user
from app.db.session import get_db_session

DbSession = Annotated[Session, Depends(get_db_session)]
CurrentUser = Annotated[UserContext, Depends(get_current_user)]
