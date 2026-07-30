# Mapa das Parcelas

Mapa das Parcelas é um simulador e uma biblioteca educativa estática para GitHub Pages. O site reúne SAC, Price, amortizações extras, correção monetária, custos mensais, gráficos, exportação em PDF, 12 guias e 6 simulações prontas em três idiomas.

O projeto usa HTML, CSS e JavaScript simples, com Eleventy apenas na etapa de geração estática. Não há framework de interface nem dependências externas via CDN. Todos os assets permanecem locais e com caminhos relativos.

## Funcionalidades

- Simulação SAC e Price.
- Taxa de juros mensal, anual efetiva ou anual nominal.
- Valor financiado, prazo, data da primeira parcela e custos extras mensais.
- Correção monetária:
  - sem correção;
  - percentual mensal fixo;
  - série mensal personalizada.
- Maior TR dos últimos 12 meses a partir do JSON local `assets/data/tr-bacen.json`.
- Taxas médias BCB por instituição para modalidades imobiliárias e veicular a partir do JSON local `assets/data/bcb-credit-rates.json`.
- Comparação financeira por banco usando as taxas médias BCB salvas localmente.
- Taxa de juros padrão anual efetiva baseada na mediana das taxas imobiliárias de mercado pós-fixadas em TR do BCB, com cache diário em `localStorage`.
- Amortizações extras pontuais ou recorrentes, com objetivo de reduzir prazo ou reduzir parcelas.
- Recálculo automático ao alterar campos.
- Persistência dos últimos valores preenchidos em `localStorage`.
- Reset do formulário preservando caches diários de TR/taxas médias BCB.
- Gráficos com Chart.js:
  - evolução do saldo devedor;
  - composição da parcela;
  - pagamento mensal;
  - custos acumulados.
- Exportação do relatório em PDF usando impressão nativa do navegador.
- Internacionalização em `pt-BR`, `en` e `es`, mantendo moeda em BRL.
- URLs públicas próprias por idioma, com `canonical`, `hreflang` e sitemap.
- Páginas institucionais de privacidade, sobre e contato para transparência e requisitos de publicação.
- Área Guias em PT-BR, inglês e espanhol, com busca local progressiva, filtros, sumários, fórmulas, tabelas e gráficos SVG acessíveis.
- Seis cenários prontos derivados no build pelo mesmo `FinanceSimulator`.
- Links de cenário `?sim=1.<base64url-json>` estritamente validados, sem resultados calculados no payload.
- Um cenário válido da URL prevalece visualmente sem apagar a simulação salva; a edição passa a ser o novo estado e há uma ação explícita para restaurar o anterior.

## Estrutura

- `src/pages/`: templates dos hubs e das páginas funcionais/institucionais.
- `src/content/guides/`: 36 Markdown localizados, organizados por idioma.
- `src/content/simulations/`: 18 Markdown de exemplos localizados.
- `src/_includes/`: layout HTML e componentes compartilhados de cabeçalho e rodapé.
- `src/_data/site.cjs`: domínio, idiomas, rotas, metadados, datas e dados estruturados.
- `src/_data/contentRegistry.cjs`: catálogo canônico de `contentId`, categorias, ordens e slugs localizados.
- `src/_data/scenarios.cjs`: cenários calculados pelo motor financeiro durante o build.
- `src/_data/contentRender.cjs`: tabelas, indicadores, CTAs e SVGs editoriais.
- `src/sitemap.njk` e `src/robots.njk`: arquivos públicos gerados a partir dos dados do site.
- `eleventy.config.js`: configuração de build, filtros de URLs relativas e cópia dos arquivos públicos.
- `_site/`: saída local gerada e não versionada.
- `assets/css/styles.css`: estilos próprios e estilos de impressão.
- `assets/js/app.js`: integração da UI, validação, persistência, gráficos, TR/taxas médias BCB e PDF.
- `assets/js/comparison.js`: tela de comparação financeira por banco.
- `assets/js/finance.js`: motor financeiro SAC/Price.
- `assets/js/i18n.js`: traduções, formatação e parsing localizado.
- `assets/js/simulation-state.js`: contrato e validação dos links de cenário.
- `assets/js/content-index.js`: busca e filtros progressivos no hub.
- `assets/data/tr-bacen.json`: janela anual versionada da série oficial SGS 226, com início, fim e taxa de cada observação.
- `assets/data/bcb-credit-rates.json`: base local versionada com taxas médias BCB por instituição para modalidades imobiliárias e veicular.
- `assets/image/`: logo e favicons.
- `assets/vendor/bootstrap/`: Bootstrap 5.3.8 local.
- `assets/vendor/chartjs/`: Chart.js 4.5.1 local.
- `scripts/update-tr-bacen.mjs`: atualização da base local da TR.
- `scripts/update-bcb-credit-rates.mjs`: atualização da base local de taxas médias BCB.
- `tests/`: testes Node sem dependências externas.
- `contracts/style.md`: contrato visual do projeto.

## Executar localmente

Instale as dependências e inicie o servidor do Eleventy:

```sh
npm ci
npm run dev
```

Depois acesse:

```text
http://localhost:8080
```

Para gerar somente os arquivos estáticos:

```sh
npm run build
```

O resultado completo será escrito em `_site/`.

Rotas públicas principais:

```text
http://localhost:8080/
http://localhost:8080/en/
http://localhost:8080/es/
http://localhost:8080/comparar/
http://localhost:8080/en/compare/
http://localhost:8080/es/comparar/
http://localhost:8080/guias/
http://localhost:8080/en/guides/
http://localhost:8080/es/guias/
http://localhost:8080/privacidade.html
http://localhost:8080/en/privacy.html
http://localhost:8080/es/privacidad.html
http://localhost:8080/sobre/
http://localhost:8080/fale-conosco/
http://localhost:8080/en/about/
http://localhost:8080/en/contact/
http://localhost:8080/es/acerca-de/
http://localhost:8080/es/contacto/
```

O idioma é definido pela URL quando a rota é explícita. A preferência salva em `localStorage` só é usada quando a URL não define idioma, e o seletor de idioma navega para a página equivalente.

As páginas localizadas mantêm no próprio HTML o corpo pré-renderizado no idioma da rota. `assets/js/i18n.js` continua sendo a fonte canônica das traduções e atualiza os textos dinâmicos; o build usa os mesmos dicionários para que crawlers, previews e navegadores sem JavaScript não recebam fallbacks em português nas rotas `/en/` e `/es/`.

Os guias e exemplos são escritos em Markdown. Cada tradução compartilha um `contentId` e declara no front matter título, descrição, categoria ou cenário, revisão editorial, dependências de dados, limitações, fontes e relacionamentos. Não coloque números derivados na prosa: use o shortcode `scenarioModule`, que recalcula indicadores, tabelas, gráfico e link para o simulador.

## Validação

Com Node.js 20 e as dependências instaladas:

```sh
npm run check
git diff --check
```

`npm run check` recria `_site/` e executa todos os testes Node. Para validar somente uma parte, os arquivos em `tests/` também podem ser executados individualmente.

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
- parser e geração dos JSONs locais da TR e das taxas médias BCB;
- comparação financeira por banco, incluindo ordenação por total pago e uso das taxas anuais BCB.
- coerência entre páginas públicas, URLs canônicas, sitemap e robots.
- catálogo exato de 12 guias e 6 exemplos por idioma, metadados editoriais e relacionamentos;
- correspondência entre os números publicados, o `FinanceSimulator` e o cenário decodificado de cada CTA;
- round-trip e rejeição integral de versões, Base64, tipos, tamanhos, séries e amortizações inválidas;
- 72 páginas, canonicals, `hreflang`, JSON-LD `CollectionPage`/`ItemList`/`Article`/`BreadcrumbList` e sitemap.

Layout, impressão, Chart.js, foco, `localStorage` e comportamento visual em 390 px devem ser confirmados pelo smoke test no navegador antes da publicação.

## Atualizar as bases locais de referência

O navegador não consulta as APIs externas. A opção “Usar TR 12m” lê `assets/data/tr-bacen.json`, cuja origem é a série oficial SGS 226 do BCB, e seleciona a maior observação da janela móvel de doze meses. O simulador repete esse percentual como correção mensal fixa para uma estimativa conservadora; isso não é uma previsão e contratos podem usar datas e critérios diferentes. A taxa de juros padrão e o modal “Consultar taxas médias BCB” leem `assets/data/bcb-credit-rates.json`.

Para atualizar manualmente:

```sh
node scripts/update-tr-bacen.mjs
node scripts/update-bcb-credit-rates.mjs
```

O workflow `.github/workflows/update-reference-rates.yml` executa as duas atualizações em dias úteis e também pode ser disparado manualmente pelo GitHub Actions. Se houver alteração em `assets/data/tr-bacen.json` ou `assets/data/bcb-credit-rates.json`, ele cria um commit automático e chama o workflow reutilizável de publicação para o SHA recém-criado.

Os atualizadores comparam o conteúdo semântico e preservam `generatedAt` quando as observações não mudam. Assim, não produzem commits ou datas editoriais artificiais.

## Publicação

O GitHub Pages usa o workflow `.github/workflows/deploy-pages.yml`:

1. instala as dependências com `npm ci`;
2. gera e testa `_site/` com `npm run check`;
3. envia `_site/` como artifact do Pages;
4. publica o artifact somente para `main`, execução manual ou chamada autorizada pelo atualizador de taxas.

Pull requests executam build e testes sem publicar. Nas configurações do repositório, a fonte do GitHub Pages deve ser **GitHub Actions**. O domínio personalizado continua definido por `CNAME` e pela configuração do Pages.

O artifact contém exatamente 72 páginas HTML, além de `sitemap.xml`, `robots.txt`, `CNAME`, `ads.txt` e assets locais. `_site/` é gerado e não deve ser versionado.
