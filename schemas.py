from typing import List
from pydantic import BaseModel, EmailStr


class SignUpSchema(BaseModel):
    display_name: str
    username: str
    email: EmailStr
    password: str


class SignInSchema(BaseModel):
    username: str
    password: str


class UserPreferencesSchema(BaseModel):
    travel_styles: List[str]
    budget: str
    interests: List[str]
    travel_frequency: str
