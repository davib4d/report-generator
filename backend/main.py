import os
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
import io

# Carrega as variáveis do ficheiro .env
load_dotenv()

# Inicializa a aplicação FastAPI
app = FastAPI(title="Corporate Report Proxy API")

# Configuração de CORS para permitir que o React (Vite) converse com o backend
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/relatorio/programa-tematico")
def obter_relatorio_reportserver(ppa: str, regiao: str):
    # Puxamos o utilizador, a API Key e as restantes configurações do .env
    base_url = os.getenv("REPORTSERVER_URL", "http://localhost:81").rstrip('/')
    user = os.getenv("REPORTSERVER_USER")
    apikey = os.getenv("REPORTSERVER_APIKEY") 
    report_id = os.getenv("REPORTSERVER_REPORT_ID")
    
    # Garante que a base termine em /reportserver para não duplicar caminhos
    if not base_url.endswith("reportserver"):
        base_url = f"{base_url}/reportserver"
        
    # Endpoint específico para autenticação silenciosa via API Key no ReportServer
    endpoint = f"{base_url}/reportserver/httpauthexport"
    
    # Parâmetros enviados diretamente na URL
    params = {
        "id": report_id,
        "format": "pdf",
        "p_ppa": ppa,
        "p_regiao": regiao,
        "user": user,
        "apikey": apikey
    }
    
    try:
        # Faz a requisição HTTP (já não precisamos do 'auth=' pois a apikey e o utilizador vão nos params)
        response = requests.get(
            endpoint, 
            params=params, 
            timeout=120 # Timeout estendido para relatórios pesados no SQL Server
        )
        
        # A BLINDAGEM DE CONTEÚDO: Verifica se o servidor enviou um PDF verdadeiro
        content_type = response.headers.get("Content-Type", "")
        
        if "application/pdf" not in content_type:
            # Imprime os detalhes no terminal do VS Code para facilitar o debug caso falhe
            print("================ ERRO DO REPORTSERVER ================")
            print(f"A URL acessada foi: {response.url}")
            print(f"Status Code: {response.status_code}")
            print(f"Resposta do Servidor:\n{response.text}")
            print("======================================================")
            
            raise HTTPException(
                status_code=400, 
                detail="O ReportServer devolveu um erro em vez do PDF. Verifica o terminal do Python para ver o motivo."
            )
            
        # Se for realmente um PDF válido, envia em formato de Stream (Blob) para o React exibir
        return StreamingResponse(
            io.BytesIO(response.content), 
            media_type="application/pdf"
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=504, detail=f"Falha de ligação com o ReportServer: {str(e)}")