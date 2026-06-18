import React, { useState } from 'react';

function App() {
  const [relatorioUrl, setRelatorioUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  
  const [ppa, setPpa] = useState('');
  const [regiao, setRegiao] = useState('');

  // Adicionamos o parâmetro 'acao' para saber qual botão foi clicado
  const gerarRelatorio = async (e, acao = 'embutido') => {
    if (e) e.preventDefault();
    
    if (!ppa || !regiao) {
      setErro("Por favor, preencha o PPA e a Região para prosseguir.");
      return;
    }

    setLoading(true);
    setErro(null);
    
    if (acao === 'embutido') {
      setRelatorioUrl(null);
    }

    // O TRUQUE DO POP-UP: Abre a aba imediatamente antes do fetch começar
    let novaAba = null;
    if (acao === 'novaAba') {
      novaAba = window.open('', '_blank');
      // Adiciona uma mensagem temporária na aba enquanto o backend trabalha
      novaAba.document.write('<html style="background:#020617; color:#a855f7; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;"><body><h2>Gerando relatório no ReportServer, aguarde...</h2></body></html>');
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/relatorio/programa-tematico?ppa=${ppa}&regiao=${regiao}`);
      
      if (!response.ok) {
        throw new Error('Não foi possível gerar o relatório. Verifique os dados ou a conexão com o servidor.');
      }

      const blob = await response.blob();
      const urlLocal = URL.createObjectURL(blob);
      
      if (acao === 'embutido') {
        // Exibe no visualizador da própria tela
        setRelatorioUrl(urlLocal);
      } else if (acao === 'novaAba') {
        // Redireciona a aba que abrimos para o PDF nativo do Chrome
        novaAba.location.href = urlLocal;
      }

    } catch (err) {
      setErro(err.message);
      if (novaAba) novaAba.close(); // Se der erro, fecha a aba fantasma
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30 relative overflow-hidden">
      
      {/* Efeitos de Luz no Fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-900/30 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-600/10 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>

      {/* Topbar Elegante */}
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
                Relatório<span className="font-light text-purple-400">Sigplan</span>
              </h1>
            </div>
            <div className="text-sm font-medium text-amber-500/80">
              Teste geração de relatórios com JasperReports via ReportServer
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 relative z-10">
        
        {/* Card de Filtros */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 lg:p-8 transition-all hover:border-purple-500/30">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Parâmetros</h2>
            <p className="text-sm text-slate-400 mt-1">Defina os filtros abaixo para consultar o JasperReports via ReportServer.</p>
          </div>

          <form onSubmit={(e) => gerarRelatorio(e, 'embutido')} className="flex flex-col lg:flex-row gap-5 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">PPA</label>
              <input 
                type="number" 
                value={ppa}
                onChange={(e) => setPpa(e.target.value)}
                placeholder="Ex: 2024"
                className="block w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-purple-500 focus:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Região</label>
              <input 
                type="number" 
                value={regiao}
                onChange={(e) => setRegiao(e.target.value)}
                placeholder="Ex: 1"
                className="block w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-purple-500 focus:bg-slate-900 focus:ring-2 focus:ring-purple-500/20 outline-none"
              />
            </div>

            {/* Grupo de Botões */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Botão Embutido (Principal) */}
              <button 
                type="submit"
                disabled={loading}
                className="h-[46px] px-6 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-900/40 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none flex items-center justify-center gap-2 border border-purple-500/50 disabled:border-white/5 w-full sm:w-auto min-w-[160px]"
              >
                {loading ? 'Processando...' : 'Visualizar na Tela'}
              </button>

              {/* Botão Nova Aba (Secundário) */}
              <button 
                type="button"
                onClick={(e) => gerarRelatorio(e, 'novaAba')}
                disabled={loading}
                className="h-[46px] px-6 bg-transparent hover:bg-purple-900/30 active:bg-purple-900/50 text-purple-400 rounded-xl font-medium transition-all disabled:text-slate-600 flex items-center justify-center gap-2 border border-purple-500/30 hover:border-purple-500/60 disabled:border-white/5 w-full sm:w-auto min-w-[160px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir em Nova Aba
              </button>
            </div>
          </form>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="bg-red-950/50 border-l-4 border-red-500 p-4 rounded-r-xl border-y border-r border-y-white/5 border-r-white/5 shadow-lg flex items-start gap-3 backdrop-blur-sm">
             <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <div>
               <h3 className="text-sm font-bold text-red-200">Falha na Extração</h3>
               <p className="text-sm text-red-300/80 mt-1">{erro}</p>
             </div>
          </div>
        )}

        {/* Stage do Relatório (Continua igual) */}
        <div className={`relative bg-slate-900 rounded-2xl border border-white/10 overflow-hidden transition-all duration-500 ${relatorioUrl ? 'shadow-2xl h-[800px] shadow-purple-900/20' : 'shadow-inner h-[400px] flex items-center justify-center'}`}>
          
          {!relatorioUrl && !loading && !erro && (
            <div className="text-center p-8 max-w-sm">
              <div className="bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-slate-200 font-semibold text-lg">Área de Visualização</h3>
              <p className="text-slate-400 text-sm mt-2">O documento gerado será renderizado nativamente neste espaço, com total contraste.</p>
            </div>
          )}

          {relatorioUrl && (
            <iframe 
              src={`${relatorioUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="w-full h-full bg-slate-800 rounded-xl"
              title="Visualizador de Relatório"
            />
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-10">
               <div className="bg-slate-900/90 border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-700 border-t-purple-500"></div>
                  <span className="text-sm font-semibold text-slate-200 tracking-wide">Buscando no ReportServer...</span>
               </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;