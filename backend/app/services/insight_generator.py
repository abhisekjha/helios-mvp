import os
from openai import OpenAI
import pandas as pd
from pymongo.database import Database
from app.core.config import settings
from app.crud import crud_data_upload
from app.models.data_upload import DataUpload


def generate_insight(db: Database, *, data_upload_id: str) -> DataUpload:
    """
    Generate insights for a data upload.
    """
    data_upload = crud_data_upload.get(db, id=data_upload_id)
    if not data_upload:
        raise Exception("Data upload not found")

    try:
        with open(data_upload.file_path, "r") as f:
            file_content = f.read()
    except FileNotFoundError:
        raise Exception("File not found")

    client = OpenAI(api_key=settings.LLM_API_KEY)

    prompt = f"""
        Based on the following data, please generate some insights:

        {file_content}
    """

    response = client.completions.create(
        model="text-davinci-003",
        prompt=prompt,
        max_tokens=500,
    )

    insights = response.choices.text.strip()

    updated_data_upload = crud_data_upload.update(
        db, db_obj=data_upload, obj_in={"insights": insights}
    )

    return updated_data_upload