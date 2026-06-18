# RelatóriosSigplan

Plataforma SaaS agnóstica para geração e visualização de relatórios JasperReports via ReportServer. O sistema permite configurar múltiplos relatórios dinamicamente através de um banco de dados local, eliminando a necessidade de "hardcoding" no código-fonte.

## 🚀 Funcionalidades
* **Backend Agnóstico:** O motor em FastAPI processa dinamicamente qualquer parâmetro enviado pelo frontend.
* **Gestão de Templates:** Cadastro simplificado de relatórios via interface (URL, ID, API Key).
* **Interface Premium:** Design moderno com Glassmorphism, construído com React e Tailwind CSS.
* **Segurança:** Credenciais e chaves de API isoladas em banco de dados local (sqlite3).
* **Visualização Flexível:** Opção de visualizar o relatório no navegador ou abrir nativamente em uma nova aba.

## 🛠️ Tecnologias
* **Backend:** Python, FastAPI, SQLite, Requests.
* **Frontend:** React, Vite, Tailwind CSS.

## 📦 Como instalar e rodar

### 1. Pré-requisitos
* Node.js e Python instalados na sua máquina.

### 2. Backend
1. Navegue até a pasta `backend/`.
2. Instale as dependências:
   pip install fastapi uvicorn requests python-dotenv
3. Inicie o servidor:
   uvicorn main:app --reload

### 3. Frontend
1. Navegue até a pasta `frontend/`.
2. Instale as dependências:
   npm install
3. Inicie a aplicação:
   npm run dev

## ⚙️ Configuração (SaaS Admin)
Ao abrir a aplicação pela primeira vez:
1. Vá até a aba **Configurações**.
2. Cadastre o seu relatório informando:
   - **URL Base:** 
   - **ID do Relatório:** 
   - **API Key:** (Chave gerada no painel de usuário do ReportServer)
   - **Parâmetros:** - Separe por vírgula.
3. Após salvar, o relatório aparecerá automaticamente na aba **Gerador**.

## 🛡️ Segurança
* As senhas e API Keys são armazenadas localmente no arquivo `nexus_reports.db`.
* O arquivo `.db` e o ambiente de desenvolvimento não devem ser versionados no Git.
* O código não contém nenhuma referência a dados sensíveis de órgãos públicos.

---