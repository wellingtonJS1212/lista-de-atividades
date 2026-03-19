# Lista de Atividades

Aplicativo de tarefas com lembretes visuais, contagem regressiva e destaque de atividades que precisam de atencao.

## Recursos

- Criacao rapida de tarefas
- Tempo de lembrete personalizavel
- Contagem regressiva em tempo real
- Destaque visual quando a tarefa esta perto de expirar
- Aplicativo Android empacotado com Capacitor

## Arquivos principais

- App web: `index.html`, `style.css`, `scripts.js`
- Pagina de download: `download.html`
- Politica de privacidade: `privacy-policy.html`
- Guia de release: `RELEASE.md`
- Guia Play Store: `PLAY_STORE.md`

## Artefatos gerados

- APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- APK release assinado: `android/app/build/outputs/apk/release/app-release-signed.apk`
- AAB release assinado: `android/app/build/outputs/bundle/release/app-release.aab`

## Comandos uteis

```bash
npm install
npm run mobile:refresh
npm run android
npm run release:apk
npm run release:aab
```

## Publicacao fora da Play Store

Voce pode distribuir o app usando:

- GitHub Releases
- GitHub Pages com a pagina `download.html`
- Google Drive ou outro servico de hospedagem de arquivos

## Observacao

Guarde com seguranca a keystore e os dados de assinatura do app. Eles sao necessarios para futuras atualizacoes.
