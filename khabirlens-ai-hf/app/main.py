from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.analyze import router

import os
app = FastAPI(
    title="KhabirLens AI Service",
    description="YOLOv8l food detection + nutritional lookup",
    version="1.0.0",
)

origins = [
    "http://localhost:8081",           # local frontend
    "http://localhost:5173",           # local dev
    "https://khabirlens.vercel.app", # production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)