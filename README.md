# Mapa das Parcelas

Mapa das Parcelas é um simulador estático de financiamento para GitHub Pages, com SAC, Price, amortizações extras, correção monetária, custos mensais, gráficos e exportação em PDF pelo navegador.

O projeto usa HTML, CSS e JavaScript simples, sem etapa de build e sem dependências externas via CDN. Todos os assets devem permanecer locais e com caminhos relativos.

## Funcionalidades

- Simulação SAC e Price.
- Taxa de juros mensal, anual efetiva ou anual nominal.
- Valor financiado, prazo, data da primeira parcela e custos extras mensais.
- Correção monetária:
  - sem correção;
  - percentual mensal fixo;
  - série mensal personalizada.
- Maior TR dos últimos 12 meses a partir do JSON local `assets/data/tr-bacen.json`.
- Taxa Selic padrão carregada a partir do JSON local `assets/data/selic-bcb.json`, com cache diário em `localStorage`.
- Amortizações extras pontuais ou recorrentes, com objetivo de reduzir prazo ou reduzir parcelas.
- Recálculo automático ao alterar campos.
- Persistência dos últimos valores preenchidos em `localStorage`.
- Reset do formulário preservando caches diários de Selic/TR.
- Gráficos com Chart.js:
  - evolução do saldo devedor;
  - composição da parcela;
  - pagamento mensal;
  - custos acumulados.
- Exportação do relatório em PDF usando impressão nativa do navegador.
- Internacionalização em `pt-BR`, `en` e `es`, mantendo moeda em BRL.
- URLs públicas próprias por idioma, com `canonical`, `hreflang` e sitemap.
- Páginas institucionais de privacidade, sobre e contato para transparência e requisitos de publicação.

## Estrutura

- `index.html`: página principal da aplicação em `pt-BR`.
- `en/index.html`: página principal em inglês.
- `es/index.html`: página principal em espanhol.
- `privacidade.html`: política de privacidade em `pt-BR`.
- `en/privacy.html`: política de privacidade em inglês.
- `es/privacidad.html`: política de privacidade em espanhol.
- `sobre/index.html`: página sobre em `pt-BR`.
- `en/about/index.html`: página sobre em inglês.
- `es/acerca-de/index.html`: página sobre em espanhol.
- `fale-conosco/index.html`: página de contato em `pt-BR`.
- `en/contact/index.html`: página de contato em inglês.
- `es/contacto/index.html`: página de contato em espanhol.
- `assets/css/styles.css`: estilos próprios e estilos de impressão.
- `assets/js/app.js`: integração da UI, validação, persistência, gráficos, TR/Selic e PDF.
- `assets/js/finance.js`: motor financeiro SAC/Price.
- `assets/js/i18n.js`: traduções, formatação e parsing localizado.
- `assets/data/tr-bacen.json`: base local versionada com taxas TR mensais.
- `assets/data/selic-bcb.json`: base local versionada com a última Meta Selic.
- `assets/image/`: logo e favicons.
- `assets/vendor/bootstrap/`: Bootstrap 5.3.8 local.
- `assets/vendor/chartjs/`: Chart.js 4.5.1 local.
- `scripts/update-tr-bacen.mjs`: atualização da base local da TR.
- `scripts/update-selic-bcb.mjs`: atualização da base local da Selic.
- `tests/`: testes Node sem dependências externas.
- `contracts/style.md`: contrato visual do projeto.

## Executar localmente

Na raiz do projeto:

```sh
python3 -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

A aplicação não requer instalação de dependências nem etapa de compilação.

Rotas públicas principais:

```text
http://localhost:8000/
http://localhost:8000/en/
http://localhost:8000/es/
http://localhost:8000/privacidade.html
http://localhost:8000/en/privacy.html
http://localhost:8000/es/privacidad.html
http://localhost:8000/sobre/
http://localhost:8000/fale-conosco/
http://localhost:8000/en/about/
http://localhost:8000/en/contact/
http://localhost:8000/es/acerca-de/
http://localhost:8000/es/contacto/
```

O idioma é definido pela URL quando a rota é explícita. A preferência salva em `localStorage` só é usada quando a URL não define idioma, e o seletor de idioma navega para a página equivalente.

As páginas localizadas devem manter no próprio HTML o corpo pré-renderizado no idioma da rota. `assets/js/i18n.js` continua sendo a fonte canônica das traduções e atualiza os textos dinâmicos, mas crawlers, previews e navegadores sem JavaScript não devem receber fallbacks em português nas rotas `/en/` e `/es/`.

## Validação

Com Node.js disponível:

```sh
node --check assets/js/i18n.js
node --check assets/js/app.js
node --check assets/js/finance.js
node tests/localized-html.test.js
node tests/seo-files.test.js
node tests/i18n.test.js
node tests/finance.test.js
node tests/selic-bcb.test.js
node tests/tr-bacen.test.js
git diff --check
```

Os testes automatizados cobrem principalmente:

- motor financeiro SAC/Price;
- amortizações extras pontuais e recorrentes;
- redução de prazo e redução de parcela;
- correção monetária fixa e personalizada;
- repetição do último índice de correção quando a série é menor que o prazo;
- custos extras mensais;
- conversão de taxa anual efetiva e nominal;
- quitação sem saldo negativo;
- cenário reportado com correção monetária e amortização extra;
- dicionários e formatadores básicos de i18n;
- correspondência entre os corpos HTML pré-renderizados, os dicionários e os dados estruturados localizados;
- parser e geração dos JSONs locais da TR e da Selic.
- coerência entre páginas públicas, URLs canônicas, sitemap e robots.

Ainda não há testes automatizados de browser/UI para layout, impressão, Chart.js, `localStorage`, cache Selic/TR no navegador ou fluxo visual de PDF. Esses pontos devem ser validados manualmente no navegador.

## Atualizar as bases locais de referência

O simulador não consulta a página externa da TR nem a API do BCB diretamente no navegador. A opção “Usar TR 12m” lê o arquivo local `assets/data/tr-bacen.json`, seleciona a maior TR dos últimos 12 meses disponíveis e preenche a correção mensal fixa. A taxa Selic padrão lê o arquivo local `assets/data/selic-bcb.json`.

Para atualizar manualmente:

```sh
node scripts/update-tr-bacen.mjs
node scripts/update-selic-bcb.mjs
```

O workflow `.github/workflows/update-reference-rates.yml` executa as duas atualizações em dias úteis e também pode ser disparado manualmente pelo GitHub Actions. Se houver alteração em `assets/data/tr-bacen.json` ou `assets/data/selic-bcb.json`, ele cria um commit automático com a nova base.

## Publicação

O projeto é compatível com GitHub Pages porque:

- não exige build;
- não usa CDN para Bootstrap ou Chart.js;
- usa caminhos relativos para assets;
- mantém os dados auxiliares em arquivos versionados locais.
