import React, { useState, useEffect } from 'react';

function App() {
  // Controle de Abas
  const [activeTab, setActiveTab] = useState('gerador'); // 'gerador' ou 'admin'

  // =====================================================================
  // ESTADOS DO PAINEL GERADOR (Usuário Final)
  // =====================================================================
  const [relatoriosDisponiveis, setRelatoriosDisponiveis] = useState([]);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState('');
  const [parametrosDinamicos, setParametrosDinamicos] = useState({});
  const [relatorioUrl, setRelatorioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  // Busca a lista de relatórios cadastrados no banco ao abrir a tela
  const carregarRelatorios = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/admin/reports');
      const data = await res.json();
      setRelatoriosDisponiveis(data);
    } catch (err) {
      console.error("Erro ao buscar relatórios", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'gerador') carregarRelatorios();
  }, [activeTab]);

  // Atualiza os inputs na tela quando o usuário troca de relatório no Dropdown
  const handleSelectRelatorio = (id) => {
    setRelatorioSelecionado(id);
    setParametrosDinamicos({});
    setRelatorioUrl(null);
    setErro(null);
  };

  // Pega os parâmetros exigidos pelo relatório selecionado
  const relatorioAtual = relatoriosDisponiveis.find(r => r.id === parseInt(relatorioSelecionado));
  const listaParametros = relatorioAtual && relatorioAtual.parametros_exigidos 
    ? relatorioAtual.parametros_exigidos.split(',').map(p => p.trim()).filter(p => p !== '') 
    : [];

  const gerarRelatorio = async (e, acao = 'embutido') => {
    if (e) e.preventDefault();
    if (!relatorioSelecionado) {
      setErro("Selecione um relatório primeiro.");
      return;
    }

    // Valida se todos os parâmetros dinâmicos foram preenchidos
    for (let param of listaParametros) {
      if (!parametrosDinamicos[param]) {
        setErro(`Por favor, preencha o campo: ${param.toUpperCase()}`);
        return;
      }
    }

    setLoading(true);
    setErro(null);
    if (acao === 'embutido') setRelatorioUrl(null);

    let novaAba = null;
    if (acao === 'novaAba') {
      novaAba = window.open('', '_blank');
      novaAba.document.write('<html style="background:#020617; color:#a855f7; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;"><body><h2>Gerando relatório no ReportServer, aguarde...</h2></body></html>');
    }

    try {
      // Monta a URL dinâmica pegando todos os parâmetros do state
      const queryParams = new URLSearchParams(parametrosDinamicos).toString();
      const response = await fetch(`http://localhost:8000/api/v1/generate/${relatorioSelecionado}?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Não foi possível gerar o relatório. Verifique os dados ou o servidor.');
      }

      const blob = await response.blob();
      const urlLocal = URL.createObjectURL(blob);
      
      if (acao === 'embutido') {
        setRelatorioUrl(urlLocal);
      } else if (acao === 'novaAba') {
        novaAba.location.href = urlLocal;
      }
    } catch (err) {
      setErro(err.message);
      if (novaAba) novaAba.close();
    } finally {
      setLoading(false);
    }
  };

  // =====================================================================
  // ESTADOS DO PAINEL ADMIN (Configuração SaaS)
  // =====================================================================
  const [adminForm, setAdminForm] = useState({
    nome_exibicao: '',
    rs_url: '',
    rs_report_id: '',
    api_key: '',
    parametros_exigidos: ''
  });
  const [adminMsg, setAdminMsg] = useState({ tipo: '', texto: '' });

  const salvarConfiguracao = async (e) => {
    e.preventDefault();
    setAdminMsg({ tipo: '', texto: '' });
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminForm)
      });
      
      if (response.ok) {
        setAdminMsg({ tipo: 'sucesso', texto: 'Template de Relatório cadastrado com sucesso!' });
        setAdminForm({ nome_exibicao: '', rs_url: '', rs_report_id: '', api_key: '', parametros_exigidos: '' });
      } else {
        throw new Error('Erro ao salvar no banco de dados.');
      }
    } catch (err) {
      setAdminMsg({ tipo: 'erro', texto: err.message });
    }
  };

  // =====================================================================
  // INTERFACE PREMIUM
  // =====================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30 relative overflow-hidden">
      
      {/* Efeitos de Luz no Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-900/30 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-600/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

      {/* Topbar com Navegação */}
      <nav className="bg-slate-950/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-purple-600 to-amber-500 p-2 rounded-lg shadow-lg shadow-purple-900/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Relatórios<span className="font-light text-purple-400">Sigplan</span>
              </h1>
            </div>
            
            {/* Menu de Abas */}
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('gerador')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'gerador' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                Gerador
              </button>
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'admin' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Configurações
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* ===================================================================== */}
        {/* TELA 1: PAINEL GERADOR (DINÂMICO)                                     */}
        {/* ===================================================================== */}
        {activeTab === 'gerador' && (
          <div className="flex flex-col gap-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 lg:p-8">
              <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Extrator Universal</h2>
                  <p className="text-sm text-slate-400 mt-1">Selecione um template cadastrado para gerar o relatório dinamicamente.</p>
                </div>
                
                {/* Dropdown de Relatórios */}
                <div className="w-full md:w-96">
                  <label className="block text-sm font-medium text-amber-500/80 mb-1.5">Selecione o Relatório</label>
                  <select 
                    value={relatorioSelecionado}
                    onChange={(e) => handleSelectRelatorio(e.target.value)}
                    className="block w-full rounded-xl border border-purple-500/30 bg-slate-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Escolha um template --</option>
                    {relatoriosDisponiveis.map(rep => (
                      <option key={rep.id} value={rep.id}>{rep.nome_exibicao}</option>
                    ))}
                  </select>
                </div>
              </div>

              {relatorioSelecionado && (
                <form onSubmit={(e) => gerarRelatorio(e, 'embutido')} className="pt-6 border-t border-white/5">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">Parâmetros Obrigatórios</h3>
                  
                  {/* Geração Dinâmica de Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                    {listaParametros.map((parametro) => (
                      <div key={parametro}>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{parametro}</label>
                        <input 
                          type="text" 
                          value={parametrosDinamicos[parametro] || ''}
                          onChange={(e) => setParametrosDinamicos({...parametrosDinamicos, [parametro]: e.target.value})}
                          placeholder={`Digite o valor...`}
                          className="block w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-sm text-white placeholder-slate-600 transition-all focus:border-purple-500 focus:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Grupo de Botões */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      type="submit" disabled={loading}
                      className="h-[46px] px-6 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-900/40 disabled:bg-slate-800 disabled:text-slate-500 flex items-center justify-center gap-2 border border-purple-500/50 min-w-[160px]"
                    >
                      {loading ? 'Processando...' : 'Visualizar na Tela'}
                    </button>
                    <button 
                      type="button" onClick={(e) => gerarRelatorio(e, 'novaAba')} disabled={loading}
                      className="h-[46px] px-6 bg-transparent hover:bg-purple-900/30 active:bg-purple-900/50 text-purple-400 rounded-xl font-medium transition-all disabled:text-slate-600 flex items-center justify-center gap-2 border border-purple-500/30 hover:border-purple-500/60 min-w-[160px]"
                    >
                      Abrir em Nova Aba
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Mensagem de Erro */}
            {erro && (
              <div className="bg-red-950/50 border-l-4 border-red-500 p-4 rounded-r-xl border-y border-r border-y-white/5 border-r-white/5 shadow-lg flex items-start gap-3 backdrop-blur-sm">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div><h3 className="text-sm font-bold text-red-200">Falha</h3><p className="text-sm text-red-300/80 mt-1">{erro}</p></div>
              </div>
            )}

            {/* Stage do Relatório */}
            <div className={`relative bg-slate-900 rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 ${relatorioUrl ? 'shadow-2xl h-[800px] shadow-purple-900/20' : 'shadow-inner h-[400px] flex items-center justify-center'}`}>
              {!relatorioUrl && !loading && (
                <div className="text-center p-8 max-w-sm opacity-50">
                  <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h3 className="text-slate-200 font-semibold text-lg">Aguardando Execução</h3>
                </div>
              )}
              {relatorioUrl && <iframe src={`${relatorioUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full bg-slate-800 rounded-xl" title="Visualizador" />}
              {loading && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="bg-slate-900/90 border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-700 border-t-purple-500"></div>
                    <span className="text-sm font-semibold text-slate-200">Processando na nuvem...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TELA 2: PAINEL ADMIN (CADASTRO DE TEMPLATES)                          */}
        {/* ===================================================================== */}
        {activeTab === 'admin' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
              <div className="mb-8 border-b border-white/5 pb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="bg-purple-600/20 p-2 rounded-lg text-purple-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                  Cadastrar Template
                </h2>
                <p className="text-sm text-slate-400 mt-2">Configure os dados de acesso a um relatório específico do Jasper. Estas credenciais ficarão guardadas no banco de dados local.</p>
              </div>

              {adminMsg.texto && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${adminMsg.tipo === 'sucesso' ? 'bg-green-950/30 border-green-500/50 text-green-200' : 'bg-red-950/30 border-red-500/50 text-red-200'}`}>
                   <span>{adminMsg.texto}</span>
                </div>
              )}

              <form onSubmit={salvarConfiguracao} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nome de Exibição no Menu</label>
                  <input required type="text" value={adminForm.nome_exibicao} onChange={e => setAdminForm({...adminForm, nome_exibicao: e.target.value})} placeholder="Ex: Relatório Anual de Despesas" className="block w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">URL Base do ReportServer</label>
                    <input required type="text" value={adminForm.rs_url} onChange={e => setAdminForm({...adminForm, rs_url: e.target.value})} placeholder="Ex: http://localhost:81" className="block w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">ID Interno do Relatório</label>
                    <input required type="number" value={adminForm.rs_report_id} onChange={e => setAdminForm({...adminForm, rs_report_id: e.target.value})} placeholder="Ex: 7014" className="block w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Chave API (API Key)</label>
                  <input required type="password" value={adminForm.api_key} onChange={e => setAdminForm({...adminForm, api_key: e.target.value})} placeholder="Sua chave gerada no painel do administrador..." className="block w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none font-mono" />
                </div>

                <div className="p-4 bg-amber-900/10 border border-amber-500/20 rounded-xl">
                  <label className="block text-sm font-medium text-amber-500 mb-1.5">Parâmetros Exigidos pelo Relatório</label>
                  <input type="text" value={adminForm.parametros_exigidos} onChange={e => setAdminForm({...adminForm, parametros_exigidos: e.target.value})} placeholder="Ex: ppa, regiao, data_inicio" className="block w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" />
                  <p className="text-xs text-amber-500/60 mt-2">Separe os nomes dos parâmetros por vírgula. Não inclua o prefixo "p_", o sistema faz isso automaticamente.</p>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full h-[50px] bg-white text-slate-950 hover:bg-slate-200 rounded-xl font-bold transition-all shadow-lg">
                    Salvar no Banco de Dados
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;