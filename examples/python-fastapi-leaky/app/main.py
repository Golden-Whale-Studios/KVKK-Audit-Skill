from fastapi import FastAPI

from .models import Patient
from .storage import export_patient

app = FastAPI()


@app.post("/patients")
def create_patient(full_name: str, email: str, diagnosis: str):
    patient = Patient(id=1, full_name=full_name, email=email, diagnosis=diagnosis)
    export_patient(patient)
    return {"ok": True}
