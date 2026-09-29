// CONFIGURAÇÃO DO SITE — edite só este arquivo.
// Depois de salvar, dê dois cliques em ATUALIZAR-SITE.bat (na pasta site\):
// ele copia estes dados para as páginas (versão, links, endereço do site).
// Deixe vazio ('') o que ainda não existe: o site mostra uma mensagem adequada.
export const KINNOR = {
  // Endereço público do site, sem barra no final.
  site: { url: 'https://kinnor-live.servidor-doacoes.workers.dev' },

  versao: '1.3.0',
  dataVersao: '2026-09-29',

  // Pasta de onde os botões baixam os instaladores. {versao} vira a versão acima.
  // No GitHub Releases o arquivo baixa direto, sem abrir o GitHub.
  // Vazio ('') = usar a pasta public/downloads do próprio site.
  downloads: 'https://github.com/PierreSaloia/kinnor-live-site/releases/download/v{versao}/',

  windows: {
    arquivo: 'KinnorLive-Setup-1.3.0.exe',
    tamanhoBytes: 186182549,
    requisitos: 'Windows 10 ou 11 (64 bits)'
  },
  android: {
    playStore: '', // Cole o link da Google Play quando o app for publicado.
    apk: 'KinnorLive-Android-1.3.0.apk',
    tamanhoBytes: 39741111,
    requisitos: 'Android 10 ou superior'
  },
  ios: {
    appStore: '', // Cole o link da App Store quando o app for publicado.
    // App de teste (sem assinatura), instalado pelo AltStore — só na página /instalar.
    ipa: 'KinnorLive-iPhone-1.3.0-sem-assinatura.ipa',
    tamanhoBytes: 7031829,
    requisitos: 'iOS 16 ou mais novo'
  },

  doacao: {
    // Página de doação do servidor do Mercado Pago (Pix e cartão, qualquer valor).
    pagina: 'https://kinnor-doacoes.servidor-doacoes.workers.dev/doar',
    pix: { chave: '', nome: '', cidade: '' }, // Opcional: Pix direto no site (rode GERAR-PIX.bat).
    linkCartao: '' // Opcional: link de pagamento avulso.
  },

  // Google: código do Search Console (só o valor de content da meta tag) e ID do
  // Google Analytics 4 (G-XXXXXXX). O Analytics só carrega se o visitante aceitar os cookies.
  google: { searchConsole: '', analytics: '' },

  // Canais que aparecem no Suporte, na Privacidade e no rodapé.
  // WhatsApp com código do país, ex.: '5511999999999'.
  contato: { email: '', whatsapp: '', instagram: '', youtube: '' }
};

// Endereço completo de um instalador, a partir dos campos acima.
export function linkDownload(arquivo, config = KINNOR) {
  if (/^https?:\/\//.test(arquivo) || arquivo.includes('/')) return arquivo;
  const pasta = config.downloads ? config.downloads.replaceAll('{versao}', config.versao) : 'downloads/';
  return pasta + arquivo;
}
