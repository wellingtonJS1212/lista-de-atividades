# Release do App

## Arquivos importantes

- APK debug gerado: `android/app/build/outputs/apk/debug/app-debug.apk`
- Configuracao de assinatura: `android/keystore.properties`
- Modelo de configuracao: `android/keystore.properties.example`

## Fluxo recomendado

1. Gere ou copie sua keystore de producao para `android/app/release/`.
2. Crie `android/keystore.properties` com base em `android/keystore.properties.example`.
3. Rode `npm run mobile:refresh`.
4. Gere o APK release com `npm run release:apk`.
5. Gere o AAB para Play Store com `npm run release:aab`.

## Observacoes

- `keystore.properties` e arquivos `.jks` ficaram fora do versionamento.
- Sem `keystore.properties`, a base continua pronta para testes locais, mas a publicacao exige assinatura real.
- No Windows, este projeto usa `android.overridePathCheck=true` porque o caminho atual contem caracteres nao ASCII.
