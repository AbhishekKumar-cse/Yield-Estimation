from fastapi import APIRouter, status, HTTPException
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, field_serializer
from typing import Annotated
from database import db
from bson import ObjectId
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os

router = APIRouter(prefix="/complaint", tags=["complaint"])

def validate_object_id(v: str) -> ObjectId:
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid ObjectId")
    return ObjectId(v)

PyObjectId = Annotated[
    ObjectId, BeforeValidator(validate_object_id)
]

class Complaint(BaseModel):
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    name: str
    phone: str
    issue: str
    aadhaar: str
    pmfby: str
    crop: str
    details: str
    status: str = "complaint-registered" # Default status for new complaints
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    @field_serializer("id")
    def serialize_id(self, id: PyObjectId):
        return str(id)

class ComplaintStatus(BaseModel): # New model for status display
    id: PyObjectId = Field(default_factory=ObjectId, alias="_id")
    issue: str
    crop: str
    details: str
    status: str
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    @field_serializer("id")
    def serialize_id(self, id: PyObjectId):
        return str(id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_complaint(complaint: Complaint):
  """
  Receives complaint data and adds it to the 'complaints' collection in MongoDB.
  """
  complaint_data = complaint.model_dump(by_alias=True)
  db.complaints.insert_one(complaint_data)

  # Send email notification
  try:
      mail_username = os.getenv("MAIL_USERNAME")
      mail_password = os.getenv("MAIL_PASSWORD")
      mail_from = os.getenv("MAIL_FROM")
      mail_to = os.getenv("MAIL_TO") # The recipient address
      mail_server = os.getenv("MAIL_SERVER")
      mail_port = int(os.getenv("MAIL_PORT", 587))

      if not all([mail_username, mail_password, mail_from, mail_to, mail_server]):
          print("Email configuration is incomplete. Skipping email notification.")
      else:
          message = MIMEMultipart()
          message['From'] = mail_from
          message['To'] = mail_to
          message['Subject'] = f"New Complaint Registered: {complaint.issue}"

          body = f"""
          A new complaint has been registered.

          Details:
          Complaint ID: {str(complaint.id)}
          Name: {complaint.name}
          Phone: {complaint.phone}
          Issue: {complaint.issue}
          Aadhaar: {complaint.aadhaar}
          PMFBY ID: {complaint.pmfby}
          Crop: {complaint.crop}
          Details: {complaint.details}
          Status: {complaint.status}
          """
          message.attach(MIMEText(body, 'plain'))

          server = smtplib.SMTP(mail_server, mail_port)
          server.starttls()
          server.login(mail_username, mail_password)
          text = message.as_string()
          server.sendmail(mail_from, mail_to, text)
          server.quit()
          print("Email notification sent successfully.")

  except Exception as e:
      print(f"Failed to send email notification: {e}")

  return {"message": "Complaint submitted successfully", "complaint_id": str(complaint.id)}


@router.get("/check", response_model=ComplaintStatus)
def get_complaint_data(complaint_id: str):
    """
    Retrieves the status of a complaint by its ID, excluding sensitive data.
    """
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(status_code=400, detail="Invalid Complaint ID format")

    complaint_doc = db.complaints.find_one({"_id": complaint_id})

    if complaint_doc:
        # Ensure status is present, assign default if not (for older entries)
        if "status" not in complaint_doc:
            complaint_doc["status"] = "complaint-registered"
        return ComplaintStatus(**complaint_doc)
    raise HTTPException(status_code=404, detail="Complaint not found")