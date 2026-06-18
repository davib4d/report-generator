import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import io

load_dotenv()

app = FastAPI(title="Corporate Report Proxy API")

origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/relatorio/programa-tematico")
def obter_relatorio_reportserver(ppa: int, regiao: int):
    base_url = os.getenv("REPORTSERVER_URL")
    user = os.getenv("REPORTSERVER_USER")
    password = os.getenv("REPORTSERVER_PASSWORD")
    report_id = os.getenv("REPORTSERVER_REPORT_ID")
    
    # Endpoint de exportação nativo do ReportServer (InfoFabrik)
    endpoint = f"{base_url}/reportserver/reportexport"
    
    # O ReportServer aceita os parâmetros diretamente na URL
    # passamos o ID do relatório, o formato desejado (pdf) e os parâmetros do Jasper (ppa, regiao)
    params = {
        "id": report_id,
        "format": "pdf",
        "ppa": ppa,
        "regiao": regiao
    }
    
    try:
        # A autenticação padrão é via Basic Auth
        # (Se o seu ReportServer usar apikey, a lógica muda ligeiramente para enviar via Header ou na URL)
        response = requests.get(
            endpoint, 
            params=params, 
            auth=(user, password),
            timeout=60 # Relatórios pesados de SQL Server podem demorar
        )
        
        # O ReportServer costuma retornar 200 para sucesso
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Erro ao extrair PDF do ReportServer. Código: {response.status_code}"
            )
            
        # Pega o PDF gerado pelo ReportServer e faz o stream para o React
        return StreamingResponse(
            io.BytesIO(response.content), 
            media_type="application/pdf"
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=504, detail=f"Falha de conexão com o ReportServer interno: {str(e)}")