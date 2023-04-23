from pydantic import BaseModel
from typing import Optional

class RegisteredAddress(BaseModel):
    state: str
    country_code: str

class Person(BaseModel):
    email: str
    last_name: str
    first_name: str
    id: Optional[int]
    sex: str
    signup_type: int
    employer: str
    party: str
    registered_address: RegisteredAddress

class HasPerson(BaseModel):
    person: Person
