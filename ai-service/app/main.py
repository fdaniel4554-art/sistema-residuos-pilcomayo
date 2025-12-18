from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional
from .classifier import WasteClassifier

app = FastAPI(
    title="AI Service - Waste Classification",
    description="Servicio de IA para clasificación de residuos sólidos",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar clasificador
classifier = WasteClassifier()

# ==========================================
# MODELOS
# ==========================================
class AnalyzeRequest(BaseModel):
    imageUrl: str

class AnalyzeResponse(BaseModel):
    wasteType: str
    severity: str
    confidence: float
    priority: int
    description: Optional[str] = None
    details: Optional[dict] = None

class AnalyzeTextRequest(BaseModel):
    text: str

class AnalyzeTextResponse(BaseModel):
    wasteType: str
    severity: str
    priority: int

# ==========================================
# RUTAS
# ==========================================
@app.get("/")
async def root():
    return {
        "service": "AI Waste Classification Service",
        "version": "1.0.0",
        "status": "running",
        "model": os.getenv("AI_MODEL", "rule_based")
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": classifier.is_ready()
    }

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_image(request: AnalyzeRequest):
    """
    Analiza una imagen de residuos y retorna:
    - Tipo de residuo
    - Nivel de severidad
    - Confianza de la predicción
    - Prioridad para atención
    """
    try:
        result = await classifier.classify(request.imageUrl)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al analizar imagen: {str(e)}"
        )

@app.post("/batch-analyze")
async def batch_analyze(image_urls: list[str]):
    """
    Analiza múltiples imágenes en lote
    """
    try:
        results = []
        for url in image_urls:
            result = await classifier.classify(url)
            results.append(result)
        return {"results": results}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en análisis por lote: {str(e)}"
        )

@app.post("/analyze-text", response_model=AnalyzeTextResponse)
async def analyze_text(request: AnalyzeTextRequest):
    """
    Analiza el texto de un reporte ciudadano para clasificarlo
    """
    text = request.text.lower()
    
    # Clasificación simple por palabras clave (Simulando IA entrenada)
    waste_type = "MIXED"
    severity = "MEDIUM"
    priority = 1
    
    if any(word in text for word in ["hospital", "quimico", "peligroso", "jeringa"]):
        waste_type = "HAZARDOUS"
        severity = "HIGH"
        priority = 3
    elif any(word in text for word in ["escombro", "construccion", "ladrillo"]):
        waste_type = "CONSTRUCTION"
        priority = 2
    elif any(word in text for word in ["organico", "comida", "fruta"]):
        waste_type = "ORGANIC"
    elif any(word in text for word in ["plastico", "botella"]):
        waste_type = "PLASTIC"
        
    return {
        "wasteType": waste_type,
        "severity": severity,
        "priority": priority
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
