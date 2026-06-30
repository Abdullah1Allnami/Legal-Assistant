from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class KGEntitySchema(BaseModel):
    id: str
    name: str
    type: str
    properties: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class KGLinkSchema(BaseModel):
    id: str
    source: str
    target: str
    type: str
    properties: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class KGSubgraphResponse(BaseModel):
    nodes: List[KGEntitySchema]
    links: List[KGLinkSchema]
