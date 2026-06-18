import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import io

load_dotenv()

app = FastAPI(title="Corporate Report Proxy API")

# Configuração de CORS para o React
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/relatorio/programa-tematico")
def obter_relatorio_jasper(ppa: int, regiao: int):
    # A URL base e credenciais do JasperServer mapeadas no seu .env
    # Ex: JASPER_URL=http://localhost:8888/jasperserver-pro
    jasper_url = os.getenv("JASPER_URL") 
    user = os.getenv("JASPER_USER", "jasperadmin")
    password = os.getenv("JASPER_PASSWORD")
    
    # Caminho exato extraído do seu arquivo .jrxml
    report_uri = "/reports/GepPAAnexo_ProgramaTematicoPoderExecutivo_Principal"
    
    # Endpoint da API REST v2 do Jasper para exportar em PDF
    endpoint = f"{jasper_url}/rest_v2/reports{report_uri}.pdf"
    
    # Parâmetros que a procedure do SQL Server está esperando
    params = {
        "ppa": ppa,
        "regiao": regiao
    }
    
    try:
        # Faz a chamada autenticada (Basic Auth é o padrão do JasperServer)
        response = requests.get(
            endpoint, 
            params=params, 
            auth=(user, password),
            timeout=60 # Relatórios complexos podem demorar
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail="Erro ao processar relatório no JasperServer. Verifique os parâmetros."
            )
            
        # Devolve o PDF em tempo real para o React
        return StreamingResponse(
            io.BytesIO(response.content), 
            media_type="application/pdf"
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=504, detail=f"Falha de comunicação com o JasperServer: {str(e)}")