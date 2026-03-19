# Publicacao na Play Console

## Dados tecnicos do app

- Nome do app: Lista de Atividades
- Pacote: `com.listaatividades.app`
- Versao atual: `1.0.0`
- Version code atual: `1`
- Artefato para envio: `android/app/build/outputs/bundle/release/app-release.aab`

## Checklist

1. Acesse a Play Console e crie um app novo.
2. Use o pacote `com.listaatividades.app`.
3. Envie o arquivo `app-release.aab`.
4. Preencha nome, descricao curta e descricao completa.
5. Adicione icone, banner e capturas de tela.
6. Preencha a ficha de seguranca de dados.
7. Informe que o app nao exige login.
8. Defina classificacao indicativa.
9. Revise paises, precificacao e distribuicao.
10. Envie para analise.

## Descricao curta

Organize tarefas com lembretes visuais e contagem regressiva.

## Descricao completa

Lista de Atividades ajuda voce a organizar o dia com uma interface simples, moderna e objetiva.

Crie tarefas rapidamente, defina em quantos minutos deseja ser lembrado e acompanhe uma contagem regressiva dentro de cada card.

Quando o tempo estiver acabando, o app destaca visualmente a tarefa para chamar sua atencao sem poluir a experiencia.

Recursos principais:

- Criacao rapida de tarefas
- Tempo de lembrete personalizavel
- Contagem regressiva em tempo real
- Destaque visual quando a tarefa esta perto de expirar
- Interface limpa e pensada para celular

Ideal para quem quer foco, praticidade e lembretes visuais sem complicacao.

## Politica de privacidade

Se voce for publicar, o ideal e ter uma politica simples mesmo que o app seja local.

Texto base:

Este aplicativo armazena informacoes apenas localmente no dispositivo do usuario para funcionamento da lista de tarefas e dos lembretes visuais. Nenhum dado pessoal e enviado para servidores externos pelo aplicativo.

## Seguranca de dados

Resposta sugerida, considerando o estado atual do app:

- O app nao coleta dados pessoais
- O app nao compartilha dados com terceiros
- Os dados ficam apenas no dispositivo
- O app nao exige criacao de conta
- O app nao usa localizacao, camera, microfone ou contatos

## Capturas recomendadas

Tire pelo menos estas telas:

1. Tela principal sem tarefas
2. Tela com varias tarefas criadas
3. Tela mostrando contagem regressiva
4. Tela com tarefa em destaque visual perto do fim

## Artes prontas no projeto

- Politica de privacidade base: `privacy-policy.html`
- Banner base da Play Store: `assets/store-feature-graphic.svg`
- Icone promocional 512x512 base: `assets/store-icon-512.svg`

Voce pode exportar os arquivos SVG para PNG usando Figma, Photopea, Inkscape ou outro editor visual.

## Proximos ajustes recomendados antes da publicacao

- Subir `versionCode` para cada nova versao
- Subir `versionName` quando houver release nova
- Criar icone promocional de 512x512 separado da arte adaptativa
- Criar banner da Play Store

## Regra para proximas versoes

- Sempre aumente `versionCode` a cada novo envio para a Play Store
- Use `versionName` em formato semantico, por exemplo `1.0.1`, `1.1.0`, `2.0.0`
- Para correcoes pequenas: suba o ultimo numero
- Para novas funcionalidades: suba o numero do meio
- Para mudancas grandes: suba o primeiro numero
