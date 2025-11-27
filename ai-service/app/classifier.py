import os
import requests
import cv2
import numpy as np
from PIL import Image
from io import BytesIO
from typing import Dict, Any

class WasteClassifier:
    """
    Clasificador de residuos sólidos
    
    Soporta múltiples modelos:
    - rule_based: Clasificación basada en reglas (por defecto)
    - google_vision: Google Cloud Vision API
    - tensorflow: Modelo TensorFlow personalizado
    - yolo: YOLOv8 para detección de objetos
    """
    
    def __init__(self):
        self.model_type = os.getenv("AI_MODEL", "rule_based")
        self.ready = True
        
        # Cargar modelo según tipo
        if self.model_type == "google_vision":
            self._init_google_vision()
        elif self.model_type == "tensorflow":
            self._init_tensorflow()
        elif self.model_type == "yolo":
            self._init_yolo()
        else:
            # Modelo basado en reglas (no requiere carga)
            pass
    
    def is_ready(self) -> bool:
        return self.ready
    
    def _init_google_vision(self):
        """Inicializar Google Vision API"""
        api_key = os.getenv("GOOGLE_VISION_API_KEY")
        if not api_key:
            print("⚠️  Google Vision API key no configurada, usando modelo basado en reglas")
            self.model_type = "rule_based"
        else:
            print("✅ Google Vision API configurada")
    
    def _init_tensorflow(self):
        """Inicializar modelo TensorFlow"""
        # TODO: Cargar modelo TensorFlow personalizado
        print("⚠️  Modelo TensorFlow no implementado, usando reglas")
        self.model_type = "rule_based"
    
    def _init_yolo(self):
        """Inicializar YOLOv8"""
        # TODO: Cargar modelo YOLO
        print("⚠️  Modelo YOLO no implementado, usando reglas")
        self.model_type = "rule_based"
    
    async def classify(self, image_url: str) -> Dict[str, Any]:
        """
        Clasificar imagen de residuos
        """
        # Descargar imagen
        image = self._download_image(image_url)
        
        # Clasificar según modelo
        if self.model_type == "google_vision":
            return await self._classify_google_vision(image_url)
        elif self.model_type == "tensorflow":
            return self._classify_tensorflow(image)
        elif self.model_type == "yolo":
            return self._classify_yolo(image)
        else:
            return self._classify_rule_based(image)
    
    def _download_image(self, url: str) -> np.ndarray:
        """Descargar imagen desde URL"""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Convertir a numpy array
            image = Image.open(BytesIO(response.content))
            image = image.convert('RGB')
            image_np = np.array(image)
            
            return image_np
        except Exception as e:
            raise Exception(f"Error descargando imagen: {str(e)}")
    
    def _classify_rule_based(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Clasificación basada en reglas simples
        Analiza características de la imagen como:
        - Colores predominantes
        - Textura
        - Tamaño de objetos
        """
        # Convertir a HSV para análisis de color
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        
        # Calcular histograma de colores
        h_hist = cv2.calcHist([hsv], [0], None, [180], [0, 180])
        s_hist = cv2.calcHist([hsv], [1], None, [256], [0, 256])
        v_hist = cv2.calcHist([hsv], [2], None, [256], [0, 256])
        
        # Normalizar
        h_hist = h_hist.flatten() / h_hist.sum()
        s_hist = s_hist.flatten() / s_hist.sum()
        v_hist = v_hist.flatten() / v_hist.sum()
        
        # Detectar bordes para estimar cantidad
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        
        # Calcular brillo promedio
        brightness = np.mean(v_hist * np.arange(256))
        
        # Clasificar tipo de residuo basado en colores
        waste_type = self._determine_waste_type(h_hist, s_hist, v_hist)
        
        # Determinar severidad basado en densidad de bordes
        severity = self._determine_severity(edge_density, brightness)
        
    def _classify_tensorflow(self, image: np.ndarray) -> Dict[str, Any]:
        """Clasificación usando TensorFlow"""
        # TODO: Implementar predicción con modelo TensorFlow
        return self._classify_rule_based(image)
    
    def _classify_yolo(self, image: np.ndarray) -> Dict[str, Any]:
        """Clasificación usando YOLO"""
        # TODO: Implementar detección con YOLO
        return self._classify_rule_based(image)
