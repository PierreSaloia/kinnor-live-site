# Kinnor Live — guia do site

Este é o site oficial do Kinnor Live. Tudo que vai para a internet fica em `public/`. A pasta `_material/` guarda imagens e fontes originais de referência; não altere essa pasta. Os instaladores ficam em `public/downloads/`.

## Ver no computador

Dê dois cliques em `VER-SITE.bat`. Ele escolhe uma porta livre, abre o navegador no endereço mostrado na janela preta e mantém o servidor local enquanto a janela estiver aberta. Não precisa instalar pacotes. Para parar, feche a janela.

## Trocar informações do site

Abra `public/assets/js/config.js` em um editor de texto. Esse é o lugar para mudar a versão, arquivos de download, links das lojas, Pix, link de cartão do Mercado Pago e canais de contato. Deixe um campo vazio quando ele ainda não existir: o site mostrará uma mensagem adequada. Use links completos começando com `https://` para as lojas, cartão e redes sociais. Para WhatsApp, informe o número com código do país, por exemplo `5511999999999`.

O domínio usado em SEO está no campo `site.url`. Depois de alterá-lo, dê dois cliques em `CONFIGURAR-DOMINIO.bat` para atualizar as URLs estáticas de todas as páginas, do mapa do site e do `robots.txt`.

Os arquivos HTML em `public/` são os originais editáveis do site. Edite o conteúdo diretamente neles. Não há gerador de páginas nem etapa de build na hospedagem.

## Ativar o Pix

Preencha `doacao.pix.chave`, `nome` e `cidade` no `config.js`. Dê dois cliques em `GERAR-PIX.bat`: ele cria `public/assets/img/pix-qr.svg`. O QR Code não tem valor fixo; o doador informa o valor no banco. O texto “copia e cola” no site inclui o valor escolhido. Ao trocar a chave ou os dados, execute o arquivo `.bat` novamente. O gerador usa o pacote `qrcode` já presente na pasta `desktop/node_modules` do projeto no computador original.

## Lançar uma nova versão

1. Copie os novos arquivos `.exe` e `.apk` para `public/downloads/`, com nomes `KinnorLive-Setup-X.Y.Z.exe` e `KinnorLive-Android-X.Y.Z.apk`.
2. Dê dois cliques em `ATUALIZAR-VERSAO.bat`. Ele identifica a versão mais recente e atualiza nome, tamanho em bytes, SHA-256 e data em `config.js`. Exige que as duas versões tenham o mesmo número. Também pode ser executado com `node ferramentas/atualizar-versao.js --data AAAA-MM-DD`.
3. Atualize o texto de novidades em `public/download.html`. Atualize também a versão no JSON-LD de `public/index.html` e os links de fallback dos instaladores nos arquivos HTML.
4. Teste com `VER-SITE.bat` e `node ferramentas/verificar-links.js` antes de publicar.

O script não apaga os arquivos antigos. Os botões usam os caminhos configurados no `config.js` quando o JavaScript carrega. Se o download ficar hospedado em outro serviço, coloque a URL completa no campo `arquivo` ou `apk` do `config.js`.
