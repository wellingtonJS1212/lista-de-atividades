# Manutencao e Atualizacao do App

## Como as atualizacoes funcionam hoje

Hoje o app esta sendo distribuido fora da Play Store, por APK e GitHub Releases.

Isso significa uma coisa importante:

- o aplicativo instalado no celular **nao atualiza sozinho**
- quando voce publicar uma nova versao, o usuario precisa **baixar e instalar o novo APK**

Ou seja, o fluxo atual e manual.

## Aviso de nova versao dentro do app

O aplicativo agora consulta um arquivo publico chamado `update.json`.

Quando esse arquivo recebe uma versao maior do que a instalada, o app mostra um aviso com botao para baixar a atualizacao.

Importante:

- o app ainda nao atualiza sozinho
- ele apenas avisa o usuario que existe versao nova
- o usuario continua precisando baixar e instalar o novo APK

## Regra principal

Sempre que voce mudar o app e quiser publicar uma nova versao, faca estes passos:

1. alterar o codigo
2. aumentar a versao do app
3. gerar novo APK e novo AAB
4. criar um novo release no GitHub
5. atualizar o `update.json`
6. atualizar o link da pagina de download, se necessario
7. avisar os usuarios para baixar a nova versao

## Onde alterar a versao

Arquivo:

- `android/app/build.gradle`

Campos importantes:

```gradle
versionCode 1
versionName "1.0.0"
```

## Como atualizar esses campos

### `versionCode`

- precisa sempre aumentar
- a Play Store e o Android usam esse numero para identificar uma versao mais nova
- exemplos:
  - versao atual: `1`
  - proxima: `2`
  - depois: `3`

### `versionName`

- e o numero visivel para voce e para o usuario
- use padrao semantico

Exemplos:

- correcao pequena: `1.0.1`
- nova funcionalidade: `1.1.0`
- mudanca grande: `2.0.0`

## Exemplo pratico de manutencao

Se hoje o app esta em:

```gradle
versionCode 1
versionName "1.0.0"
```

E voce corrigiu um bug pequeno, atualize para:

```gradle
versionCode 2
versionName "1.0.1"
```

## Passo a passo para publicar uma nova versao

### 1. Fazer as alteracoes no codigo

Arquivos principais:

- `index.html`
- `style.css`
- `scripts.js`

### 2. Atualizar a versao

Edite `android/app/build.gradle` e aumente:

- `versionCode`
- `versionName`

### 3. Atualizar os assets mobile

No terminal:

```bash
npm run mobile:refresh
```

Esse comando:

- atualiza assets
- sincroniza o projeto Android

### 4. Gerar os arquivos da nova versao

Para AAB:

```bash
npm run release:aab
```

Para APK:

Use o fluxo atual que ja funciona no projeto:

- gere o release
- se o APK direto falhar por cache do Gradle, use o APK assinado que voce ja estiver assinando manualmente com o mesmo processo atual

Arquivos esperados:

- `android/app/build/outputs/bundle/release/app-release.aab`
- `android/app/build/outputs/apk/release/app-release-signed.apk`

### 5. Subir o codigo para o GitHub

```bash
git add .
git commit -m "Atualiza app para a versao 1.0.1"
git push
```

### 6. Criar um novo release no GitHub

No GitHub:

- abra `Releases`
- clique em `Draft a new release`

Preencha assim:

- tag: `v1.0.1`
- titulo: `Lista de Atividades 1.0.1`

Anexe:

- novo `app-release-signed.apk`
- novo `app-release.aab`

### 7. Atualizar o link do download

Arquivo:

- `download.html`

Exemplo:

```html
https://github.com/wellingtonJS1212/lista-de-atividades/releases/download/v1.0.1/app-release-signed.apk
```

Depois disso:

```bash
git add .
git commit -m "Atualiza link de download para v1.0.1"
git push
```

### 8. Atualizar o aviso interno do app

Arquivo:

- `update.json`

Exemplo:

```json
{
  "version": "1.0.1",
  "download_url": "https://github.com/wellingtonJS1212/lista-de-atividades/releases/download/v1.0.1/app-release-signed.apk",
  "notes": "Correcoes e melhorias visuais."
}
```

Depois envie ao GitHub:

```bash
git add .
git commit -m "Atualiza aviso interno para a versao 1.0.1"
git push
```

## O que o usuario precisa fazer para atualizar

Como o app nao atualiza sozinho, o usuario deve:

1. abrir sua pagina de download
2. baixar o novo APK
3. instalar por cima da versao anterior

Se o app tiver sido assinado com a mesma keystore, o Android atualiza normalmente sem perder o identificador do aplicativo.

## Muito importante sobre a keystore

Voce **nao pode perder** estes itens:

- arquivo `.jks`
- `keyAlias`
- senha da keystore
- senha da chave

Sem isso, futuras atualizacoes nao poderao substituir o app ja instalado.

## Onde estao os arquivos sensiveis

- keystore: `android/app/release/lista-de-atividades-release.jks`
- configuracao: `android/keystore.properties`

Guarde backup desses arquivos em local seguro.

## Como saber quando usar cada tipo de versao

### `1.0.1`

Use quando:

- corrigir texto
- corrigir bug pequeno
- melhorar estilo
- ajustar comportamento sem mudar muito o app

### `1.1.0`

Use quando:

- adicionar nova funcionalidade
- mudar layout importante
- criar nova tela

### `2.0.0`

Use quando:

- mudar muito o funcionamento
- reestruturar o app
- quebrar compatibilidades antigas

## Como manter o historico organizado

Sempre escreva no release:

- o que mudou
- se houve correcao
- se houve nova funcionalidade
- se o usuario precisa reinstalar ou apenas atualizar

## Limite do modelo atual

Hoje o app depende de:

- GitHub Releases
- download manual do APK
- instalacao manual pelo usuario

Entao:

- nao existe atualizacao automatica em segundo plano
- nao existe push automatico de nova versao

## Se no futuro voce quiser atualizacao mais automatica

Voce pode migrar para um destes modelos:

1. Play Store
   - atualizacao automatica nativa

2. Loja alternativa com update manager
   - depende da plataforma usada

3. Implementar verificador de versao no app
   - o app consulta um arquivo online
   - informa ao usuario que existe versao nova
   - abre a pagina de download

Esse terceiro caminho e um bom meio-termo sem Play Store.

## Checklist rapido de manutencao

1. editar codigo
2. subir `versionCode`
3. subir `versionName`
4. rodar `npm run mobile:refresh`
5. gerar release
6. publicar no GitHub Releases
7. atualizar `update.json`
8. atualizar `download.html`
9. fazer `git push`
10. avisar os usuarios
