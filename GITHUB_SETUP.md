# Publicacao no GitHub

## 1. Criar o repositorio

No seu perfil `wellingtonJS1212`, crie um repositorio novo.

Nome recomendado:

- `lista-de-atividades`

## 2. Enviar o projeto

No terminal, dentro desta pasta do projeto:

```bash
git init
git add .
git commit -m "Primeira versao do app Lista de Atividades"
git branch -M main
git remote add origin https://github.com/wellingtonJS1212/lista-de-atividades.git
git push -u origin main
```

## 3. Criar um release no GitHub

Depois de subir o projeto:

1. Abra o repositorio no GitHub
2. Clique em `Releases`
3. Clique em `Draft a new release`
4. Tag recomendada: `v1.0.0`
5. Titulo recomendado: `Lista de Atividades 1.0.0`
6. Use o texto de `GITHUB_RELEASE_NOTES.md`
7. Anexe:
   - `android/app/build/outputs/apk/release/app-release-signed.apk`
   - `android/app/build/outputs/bundle/release/app-release.aab` se quiser guardar tambem

## 4. GitHub Pages

Para usar a pagina de download:

1. No repositorio, entre em `Settings`
2. Abra `Pages`
3. Em `Build and deployment`, escolha:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Salve

URL esperada da pagina:

`https://wellingtonJS1212.github.io/lista-de-atividades/download.html`

## 5. Ajustar o link do APK na pagina

Depois de criar o primeiro release, substitua o link do botao em `download.html` pelo link publico do asset do release.

Formato recomendado:

`https://github.com/wellingtonJS1212/lista-de-atividades/releases/download/v1.0.0/app-release-signed.apk`

## 6. Link final recomendado

Compartilhe esta pagina:

`https://wellingtonJS1212.github.io/lista-de-atividades/download.html`

Ela sera a sua central oficial de download.
