from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import os
from cerebras.cloud.sdk import Cerebras

router = APIRouter(prefix='/llm', tags=['llm'])

client = Cerebras(
    api_key="csk-chrxcp8pc98wk2vj8nvc585m9f3vx3xvfh5jrfydh6td9p58"
)

@router.get("/analysis")
def ai_analysis(lat: float, lon: float, crop_name: str, predicted_yield: float):
    prompt = f"""
Given the following data:
- Location: ({lat}, {lon})
- Crop: {crop_name}
- Predicted Yield: {predicted_yield}

Concisely recommend other suitable crops for this area for a better yield. Justify your answer with brief points on soil, weather, and other key factors.
Give the output which does use any markdown format.
"""

    def generate():
        stream = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": prompt
                }
            ],
            model="gpt-oss-120b",
            stream=True,
            max_completion_tokens=65536,
            temperature=1,
            top_p=1,
            reasoning_effort="medium"
        )
        for chunk in stream:
            yield chunk.choices[0].delta.content or ""

    return StreamingResponse(generate(), media_type="text/event-stream")
