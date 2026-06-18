import os
import sqlite3
import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

# Inicializa a aplicação FastAPI
app = FastAPI(title="Gerador de Relatórios Universal com ReportServer")

# Configuração de CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# CONFIGURAÇÃO DO BANCO DE DADOS (SQLite)
# ==============================================================================
DB_FILE = "sigplan_reports.db"

def init_db():
    """Cria a tabela de configurações de relatórios se ela não existir."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome_exibicao TEXT NOT NULL,
            rs_url TEXT NOT NULL,
            rs_report_id TEXT NOT NULL,
            api_key TEXT NOT NULL,
            parametros_exigidos TEXT NOT NULL -- Salvo como string separada por vírgulas (ex: "ppa,regiao")
        )
    ''')
    conn.commit()
    conn.close()

# Executa a criação do banco ao iniciar o Python
init_db()

# Modelos Pydantic para receber dados do Admin via POST
class ReportConfig(BaseModel):
    nome_exibicao: str
    rs_url: str
    rs_report_id: str
    api_key: str
    parametros_exigidos: str

# ==============================================================================
# ROTAS ADMINISTRATIVAS (Para configurar a plataforma)
# ==============================================================================

@app.post("/api/v1/admin/reports")
def cadastrar_relatorio(config: ReportConfig):
    """Salva a configuração de um novo relatório no banco de dados."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO reports (nome_exibicao, rs_url, rs_report_id, api_key, parametros_exigidos)
        VALUES (?, ?, ?, ?, ?)
    ''', (config.nome_exibicao, config.rs_url, config.rs_report_id, config.api_key, config.parametros_exigidos))
    conn.commit()
    novo_id = cursor.lastrowid
    conn.close()
    return {"message": "Relatório configurado com sucesso!", "id": novo_id}

@app.get("/api/v1/admin/reports")
def listar_relatorios():
    """Lista todos os relatórios disponíveis para o frontend criar o menu."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, nome_exibicao, parametros_exigidos FROM reports")
    reports = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return reports

# ==============================================================================
# ROTA GENÉRICA DE GERAÇÃO (A Mágica Universal)
# ==============================================================================

@app.get("/api/v1/generate/{local_report_id}")
def gerar_relatorio_dinamico(local_report_id: int, request: Request):
    """
    Rota universal. Ela busca como conectar no ReportServer pelo banco de dados
    e aceita QUALQUER parâmetro enviado pelo React.
    """
    # 1. Busca as configurações secretas no banco
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE id = ?", (local_report_id,))
    config = cursor.fetchone()
    conn.close()

    if not config:
        raise HTTPException(status_code=404, detail="Configuração de relatório não encontrada no sistema.")

    # 2. Tratamento da URL do ReportServer
    base_url = config['rs_url'].rstrip('/')
    if not base_url.endswith("reportserver"):
        base_url = f"{base_url}/reportserver"
    endpoint = f"{base_url}/reportserver/httpauthexport"

    # 3. Monta os parâmetros fixos
    rs_params = {
        "id": config['rs_report_id'],
        "format": "pdf",
        "apikey": config['api_key'],
        "user": "admin"
    }

    # 4. CAPTURA DINÂMICA: Pega tudo que o React mandou e injeta o prefixo 'p_'
    user_params = dict(request.query_params)
    for key, value in user_params.items():
        rs_params[f"p_{key}"] = value

    # 5. Conexão com o ReportServer (A nossa blindagem intacta)
    try:
        response = requests.get(endpoint, params=rs_params, timeout=120)
        content_type = response.headers.get("Content-Type", "")
        
        if "application/pdf" not in content_type:
            print("================ ERRO DO REPORTSERVER ================")
            print(f"A URL acessada foi: {response.url}")
            print(f"Resposta do Servidor:\n{response.text}")
            print("======================================================")
            raise HTTPException(status_code=400, detail="O ReportServer retornou um erro em vez do PDF. Verifique os parâmetros.")
            
        return StreamingResponse(
            io.BytesIO(response.content), 
            media_type="application/pdf"
        )
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=504, detail=f"Falha de conexão com o ReportServer: {str(e)}")