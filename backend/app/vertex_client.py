"""Vertex AI Gemini client + Live session configuration."""
from __future__ import annotations

import functools

from google import genai
from google.genai import types
from google.oauth2 import service_account

from .config import settings
from .persona import SYSTEM_INSTRUCTION

_SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]


@functools.lru_cache(maxsize=1)
def get_client() -> genai.Client:
    """Create (once) an authenticated Vertex AI client from a service account."""
    credentials = service_account.Credentials.from_service_account_file(
        settings.google_application_credentials,
        scopes=_SCOPES,
    )
    return genai.Client(
        vertexai=True,
        project=settings.vertex_project_id,
        location=settings.vertex_location,
        credentials=credentials,
    )


def build_live_config() -> types.LiveConnectConfig:
    """Live session config: AUDIO out, both transcriptions on, persona + voice."""
    return types.LiveConnectConfig(
        response_modalities=[types.Modality.AUDIO],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name=settings.voice_name,
                ),
            ),
        ),
        system_instruction=types.Content(
            parts=[types.Part(text=SYSTEM_INSTRUCTION)],
        ),
        input_audio_transcription=types.AudioTranscriptionConfig(),
        output_audio_transcription=types.AudioTranscriptionConfig(),
    )
