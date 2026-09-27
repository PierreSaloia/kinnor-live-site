# Publicar o site Kinnor Live

Publique **somente o conteúdo da pasta `public/`**. As pastas `_material/` e `ferramentas/` e os arquivos deste diretório são de trabalho local.

## Antes de enviar

Abra o site por `VER-SITE.bat`, confira as páginas e execute `node ferramentas/verificar-links.js`. Preencha no `public/assets/js/config.js` os links e contatos que já estiverem disponíveis. Os botões das lojas e de doação permanecem informativos enquanto os campos estiverem vazios.

## Tamanho dos instaladores

O instalador Windows tem cerca de 175 MB; o APK tem cerca de 38 MB. Vários serviços gratuitos limitam o tamanho de cada arquivo. Cloudflare Pages aceita no máximo 25 MB por arquivo e GitHub Pages, 100 MB. Portanto, esses arquivos não cabem nessas opções como parte do site.

**Recomendação:** publique o `.exe` e o `.apk` como anexos de uma Release no GitHub, ou em outro serviço que aceite arquivos grandes e forneça links diretos. Cole cada link completo em `windows.arquivo` e `android.apk` no `config.js`. Teste os dois downloads no site publicado. Hospedagem comum que aceite arquivos grandes também pode servir os instaladores dentro de `public/downloads/`.

## Opções de publicação

- **Netlify:** arraste a pasta `public/` para o painel de publicação. Para arquivos acima do limite da conta, hospede os instaladores separadamente. O arquivo `_headers` leva cabeçalhos de cache e download.
- **Cloudflare Pages:** crie um projeto de páginas estáticas e envie o conteúdo de `public/`. Hospede ambos os instaladores fora do Pages, pois ultrapassam o limite por arquivo. Use os links externos no `config.js`.
- **Hospedagem comum:** envie todo o conteúdo de `public/` para a pasta pública do servidor por FTP. Confira se o plano permite os arquivos grandes. O `.htaccess` configura tipos de arquivo, download e página 404 em servidores Apache.

## Domínio

No painel da hospedagem, adicione o domínio e siga as instruções de DNS do provedor. Depois, troque `site.url` no `config.js` pelo endereço definitivo, com `https://` e sem barra final. Execute `CONFIGURAR-DOMINIO.bat` para atualizar as tags de SEO estáticas, o JSON-LD, `robots.txt` e `sitemap.xml`.

Confirme que o site abre em HTTPS, que os downloads iniciam e que `privacidade.html` e `suporte.html` têm os endereços usados no cadastro das lojas.
