from pydantic import BaseModel

class Contact(BaseModel):
    type_id: int
    sender_id: int
    person_id: int
    status: str
    method: str
    note: str

class HasContact(BaseModel):
    contact: Contact
