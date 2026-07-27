# Mapa das Parcelas

Mapa das Parcelas é um simulador estático de financiamento para GitHub Pages, com SAC, Price, amortizações extras, correção monetária, custos mensais, gráficos e exportação em PDF pelo navegador.

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

## Estrutura

- `src/pages/`: cinco templates de conteúdo para simulador, comparação, privacidade, sobre e contato.
- `src/_includes/`: layout HTML e componentes compartilhados de cabeçalho e rodapé.
- `src/_data/site.cjs`: domínio, idiomas, rotas, metadados, datas e dados estruturados.
- `src/sitemap.njk` e `src/robots.njk`: arquivos públicos gerados a partir dos dados do site.
- `eleventy.config.js`: configuração de build, filtros de URLs relativas e cópia dos arquivos públicos.
- `_site/`: saída local gerada e não versionada.
- `assets/css/styles.css`: estilos próprios e estilos de impressão.
- `assets/js/app.js`: integração da UI, validação, persistência, gráficos, TR/taxas médias BCB e PDF.
- `assets/js/comparison.js`: tela de comparação financeira por banco.
- `assets/js/finance.js`: motor financeiro SAC/Price.
- `assets/js/i18n.js`: traduções, formatação e parsing localizado.
- `assets/data/tr-bacen.json`: base local versionada com taxas TR mensais.
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

Ainda não há testes automatizados de browser/UI para layout, impressão, Chart.js, `localStorage`, cache TR/BCB no navegador ou fluxo visual de PDF. Esses pontos devem ser validados manualmente no navegador.

## Atualizar as bases locais de referência

O simulador não consulta a página externa da TR nem a API Olinda do BCB diretamente no navegador. A opção “Usar TR 12m” lê o arquivo local `assets/data/tr-bacen.json`, seleciona a maior TR dos últimos 12 meses disponíveis e preenche a correção mensal fixa. A taxa de juros padrão e o modal “Consultar taxas médias BCB” leem o arquivo local `assets/data/bcb-credit-rates.json`, que inclui taxas imobiliárias mensais e taxas veiculares diárias de aquisição de veículos.

Para atualizar manualmente:

```sh
node scripts/update-tr-bacen.mjs
node scripts/update-bcb-credit-rates.mjs
```

O workflow `.github/workflows/update-reference-rates.yml` executa as duas atualizações em dias úteis e também pode ser disparado manualmente pelo GitHub Actions. Se houver alteração em `assets/data/tr-bacen.json` ou `assets/data/bcb-credit-rates.json`, ele cria um commit automático e chama o workflow reutilizável de publicação para o SHA recém-criado.

## Publicação

O GitHub Pages usa o workflow `.github/workflows/deploy-pages.yml`:

1. instala as dependências com `npm ci`;
2. gera e testa `_site/` com `npm run check`;
3. envia `_site/` como artifact do Pages;
4. publica o artifact somente para `main`, execução manual ou chamada autorizada pelo atualizador de taxas.

Pull requests executam build e testes sem publicar. Nas configurações do repositório, a fonte do GitHub Pages deve ser **GitHub Actions**. O domínio personalizado continua definido por `CNAME` e pela configuração do Pages.
