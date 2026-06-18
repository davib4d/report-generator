import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import io
load_dotenv()
app = FastAPI(title="Corporate Report Proxy API")
# Configuração de CORS para permitir requisições do React
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
CORSMiddleware,
allow_origins=origins,
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)
@app.get("/api/v1/relatorio")
def obter_relatorio(nome_relatorio: str):
    base_url = os.getenv("REPORTSERVER_URL")
    usuario = os.getenv("REPORTSERVER_USER")
    senha = os.getenv("REPORTSERVER_PASSWORD")

    params = {
        f"/{nome_relatorio}": None,
        "rs:Command": "Render",
        "rs:Format": "PDF"
    }

    try:
        response = requests.get(
            base_url,
            params=params,
            auth=(usuario, senha),
            timeout=30
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Erro ao gerar relatório no ReportServer interno."
        )# Transmite o binário do PDF diretamente para o Frontend
        return StreamingResponse(
        io.BytesIO(response.content),
        media_type="application/pdf"
        )
    
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=504, detail=f"Falha de comunicação com o servidor de relatórios: {str(e)}")