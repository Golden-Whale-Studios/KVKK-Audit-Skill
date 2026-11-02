import json

import boto3

s3 = boto3.client("s3", region_name="us-east-1")


def export_patient(patient):
    body = json.dumps({"name": patient.full_name, "diagnosis": patient.diagnosis})
    s3.put_object(
        Bucket="fake-clinic-exports",
        Key=f"patients/{patient.id}.json",
        Body=body,
        ACL="public-read",
    )
