// Gera public/altstore.json: a "fonte" do Kinnor Live na AltStore.
// No iPhone: AltStore › Fontes › + › https://<site>/altstore.json (ou o botão "Adicionar na AltStore" da página /equipe).
// A AltStore confere versão, build, tamanho e permissões com o arquivo .ipa — por isso este script lê o próprio .ipa.
//
// Uso: node ferramentas/fonte-altstore.mjs <caminho do .ipa> [build]
//   build = CFBundleVersion do app (o CURRENT_PROJECT_VERSION do ios/project.yml).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { KINNOR, linkDownload } from '../public/assets/js/config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const ipa = process.argv[2];
const build = process.argv[3] || '1';
if (!ipa || !fs.existsSync(ipa)) {
  console.error('Informe o arquivo .ipa: node ferramentas/fonte-altstore.mjs INSTALADORES/KinnorLive-iPhone-X.ipa 6');
  process.exit(1);
}
const bytes = fs.readFileSync(ipa);
const site = KINNOR.site.url;
const versao = KINNOR.versao;

// Iguais ao Info.plist do app (ios/KinnorLive/App/Info.plist): a AltStore recusa se faltar alguma.
const privacy = {
  NSCameraUsageDescription: 'O Kinnor Live usa a câmera para filmar, tirar fotos, ler o QR Code do computador e enviar a imagem ao computador da mídia (modo Webcam).',
  NSMicrophoneUsageDescription: 'O microfone é usado só no modo Câmera, para gravar vídeos com o som do iPhone. Nos outros modos o som vem da mesa.',
  NSPhotoLibraryAddUsageDescription: 'Para salvar na galeria os vídeos e as fotos que você gravar.',
  NSPhotoLibraryUsageDescription: 'Para organizar seus vídeos e fotos no álbum "Kinnor Live".',
  NSLocalNetworkUsageDescription: 'Para encontrar e se conectar ao computador da mídia (Kinnor Live) no Wi-Fi da igreja: receber o som da mesa e enviar a imagem da câmera.',
};

const novidades = [
  'Câmera do stories: gravando com a mesa, a imagem também vai para a live. O computador mostra na prévia e o operador decide se coloca no ar.',
  'Selo "Você está na live" enquanto a imagem está no computador.',
  'Liga e desliga em Ajustes rápidos › Câmera do stories. O vídeo gravado no celular não muda.',
].join('\n');

const shots = fs.readdirSync(path.join(here, '../public/assets/img'))
  .filter((f) => /^iphone-\d+.*\.(jpg|png)$/.test(f)).sort()
  .map((f) => `${site}/assets/img/${f}`);

const fonte = {
  name: 'Kinnor Live',
  identifier: 'br.com.kinnorlive.fonte',
  subtitle: 'Mídia da igreja no celular',
  description: 'App do Kinnor Live para iPhone: câmera da transmissão, gravar com o som da mesa e ouvir a mesa no fone. Funciona junto com o programa Kinnor Live para Windows.',
  iconURL: `${site}/assets/img/icon-512.png`,
  headerURL: `${site}/assets/img/og-kinnor-live.png`,
  website: site,
  tintColor: '#3B82F6',
  featuredApps: ['br.com.kinnorlive.app'],
  apps: [
    {
      name: 'Kinnor Live',
      bundleIdentifier: 'br.com.kinnorlive.app',
      developerName: 'Kinnor Live',
      subtitle: 'Mídia da igreja no celular',
      localizedDescription: [
        'O Kinnor Live transforma os celulares da equipe em ferramentas da mídia da igreja, junto com o programa Kinnor Live para Windows.',
        '',
        '• GRAVAR COM A MESA: vídeos com o som limpo da mesa de som, prontos para stories e reels. A imagem também pode ir para a live.',
        '• WEBCAM: o iPhone vira uma câmera do computador da transmissão.',
        '• OUVIR A MESA: retorno do som da mesa no fone, com qualidade de música, mesmo com a tela bloqueada.',
        '• CÂMERA: fotos e vídeos com o som do próprio iPhone.',
        '',
        'Conecta pelo QR Code do programa. Nada é coletado: tudo fica na rede da igreja.',
      ].join('\n'),
      iconURL: `${site}/assets/img/icon-512.png`,
      tintColor: '#3B82F6',
      category: 'photo-video',
      screenshots: shots,
      versions: [
        {
          version: versao,
          buildVersion: String(build),
          date: KINNOR.dataVersao,
          localizedDescription: novidades,
          downloadURL: linkDownload(KINNOR.ios.ipa),
          size: bytes.length,
          sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
          minOSVersion: '16.0',
        },
      ],
      appPermissions: { entitlements: [], privacy },
    },
  ],
  news: [],
};

const out = path.join(here, '../public/altstore.json');
fs.writeFileSync(out, JSON.stringify(fonte, null, 2) + '\n');
console.log(`Fonte da AltStore: ${out}\n  versão ${versao} (build ${build}), ${bytes.length} bytes, ${shots.length} fotos de tela`);
