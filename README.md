# Loan Calculator — calculadora de múltiplos empréstimos

Site estático, responsivo e sem dependências. Os cálculos acontecem no navegador, sem enviar os valores para um servidor. A interface começa em inglês.

## Testar agora

1. Extraia o ZIP.
2. Abra `dist/index.html` no navegador.
3. Selecione Português, escolha a moeda e preencha seus empréstimos.

Não precisa instalar Node, usar terminal nem configurar uma API. Use números sem separadores de milhar: `260000`. Valores e taxas aceitam até duas casas decimais, com ponto ou vírgula: `3.2` ou `3,2`. Também são aceitos algarismos árabes, persas, devanágari e bengalis.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie **o conteúdo da pasta `dist`**, deixando `index.html`, `app.js`, `finance.js`, `i18n.js`, `style.css` e `favicon.svg` na raiz do repositório. Inclua `.nojekyll` se o seu método de upload mostrar arquivos ocultos.
3. No repositório, vá a **Settings → Pages**.
4. Em **Build and deployment → Source**, selecione **Deploy from a branch**.
5. Escolha a branch `main`, pasta **/(root)**, e salve.
6. Aguarde a publicação e abra o endereço que o GitHub apresentar.

Todos os caminhos de arquivos são relativos: o site funciona tanto em domínio próprio quanto em `usuario.github.io/repositorio/`.

Documentação oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## O que está incluído

- Onze idiomas: inglês, mandarim, hindi, espanhol, árabe, francês, bengali, português, indonésio, urdu e russo. Árabe e urdu usam escrita da direita para a esquerda.
- Trinta moedas, incluindo dólar, euro, libra, real, yuan, iene e rupia. Os nomes das moedas e a formatação dos resultados acompanham o idioma.
- Adição e remoção de empréstimos, cada um com valor, prazo e taxa independentes.
- Prazos inteiros em meses ou anos. Limite de proteção: 12.000 meses por empréstimo, incluindo o caso solicitado de 1.000 meses.
- Taxas mensais ou anuais, de 0% a 100%, com até duas casas decimais. Valores de empréstimo positivos até 1 trilhão de unidades da moeda selecionada.
- Pagamentos normais ou mensalidade total uniforme (lissage).
- Resumo por períodos, capital total, juros e custo total.
- Tabela de todos os meses, com parcelas por empréstimo, juros do mês, amortização e saldo agregado. Paginação de 100 linhas e botão para mostrar tudo.
- Dois espaços laterais de publicidade, reservados no desktop. Em telas pequenas, as laterais ficam ocultas para priorizar a calculadora.

## Escolher o que calcular

O seletor **O que calcular** oferece seis opções. O campo desconhecido deixa de ser editável e é identificado como **Calculado**. Os valores são apresentados no resultado e não substituem os dados digitados nos outros modos.

| Calcular | Informações necessárias, por empréstimo |
| --- | --- |
| Mensalidade | Valor emprestado, duração e taxa |
| Duração | Valor emprestado, taxa e mensalidade conhecida |
| Taxa de juros | Valor emprestado, duração e mensalidade conhecida |
| Total de juros / custo do empréstimo | Valor emprestado, duração e taxa |
| Total a pagar | Valor emprestado, duração e taxa |
| Valor emprestado | Mensalidade conhecida, duração e taxa |

É possível adicionar vários empréstimos em todos os modos. Cada cálculo inverso usa a mensalidade **individual** informada para aquele empréstimo, não uma parcela agregada que teria várias soluções. A duração e a taxa são mostradas por empréstimo; o valor emprestado também é somado no resumo. O prazo destacado para vários empréstimos corresponde ao último vencimento.

O prazo calculado pode ser mostrado em meses ou em anos com os meses restantes. Exemplo: 233 meses = 19 anos e 5 meses. Como os pagamentos são mensais, uma duração teórica fracionada é arredondada para o mês seguinte, com redução da última parcela. Não se força um arredondamento para anos inteiros.

A taxa calculada pode ser exibida ao mês ou ao ano (nominal, 12 vezes a mensal). Ela é encontrada numericamente por bisseção, mantendo a precisão interna completa. O resultado é exibido com até seis casas decimais; a restrição de duas casas se aplica às taxas **digitadas**, não à solução numérica.

A mensalidade uniforme continua disponível para calcular parcelas, juros totais e total a pagar. Os cálculos de prazo, taxa e valor emprestado utilizam prestações normais fixas, pois uma prestação global uniformizada não determina de maneira única os dados de cada contrato.

Combinações impossíveis são explicadas: parcela que não cobre juros mensais, parcela menor que o principal dividido pelo prazo ao buscar taxa não negativa, ou prazo superior a 12.000 meses.

### Exemplos dos novos cálculos

- €260.000 a 3,2% anuais nominais, com parcela de €1.500: **233 meses (19 anos e 5 meses)**; a última parcela é reduzida.
- €260.000 em 300 meses, com parcela de €1.500: **4,867963% ao ano**, equivalentes a **0,405664% ao mês** (exibição arredondada).
- €1.000 por mês durante 12 meses a 0%: **€12.000 emprestados**.

O custo do empréstimo é o total de juros calculado; não inclui seguros, impostos ou outras tarifas.

## Convenções financeiras

Todos os empréstimos começam juntos; as parcelas vencem no fim de cada mês. Não há carência, entradas, seguros, impostos, tarifas, datas de calendário ou pagamentos extras. As taxas são fixas. A moeda é uma unidade de cálculo comum a todos os empréstimos; **não há conversão cambial**.

A taxa anual é **nominal**, dividida por 12 para obter a taxa mensal. A taxa mensal informada é usada diretamente. Uma taxa anual efetiva exige outra conversão e não deve ser inserida como nominal sem ajuste.

### Parcelas normais

Para principal `P`, taxa mensal decimal `r` e prazo `n` em meses:

```
a(r, n) = (1 - (1+r)^(-n)) / r
parcela = P / a(r, n)
```

Quando `r = 0`, `a(0,n) = n` e a parcela é `P/n`. A soma das parcelas cai à medida que os contratos terminam.

### Mensalidade uniforme / lissage

É uma simulação de um empréstimo com parcelas em patamares, não uma média aritmética das parcelas originais.

O empréstimo de maior valor entre os que terminam por último é o **empréstimo ajustado**. Em empate de valor e prazo, usa-se o primeiro na lista. Os demais mantêm suas parcelas normais e seus prazos.

Se `P` e `r` pertencem ao empréstimo ajustado, `N` é o prazo máximo e `Aᵢ`, `nᵢ` são as parcelas e os prazos dos demais:

```
mensalidade total C = (P + Σ Aᵢ × a(r,nᵢ)) / a(r,N)
parcela ajustada no mês m = C - Σ parcelas dos outros empréstimos ativos em m
```

A parcela ajustada cresce quando os outros empréstimos terminam, mantendo o total constante e quitando o saldo no prazo original. Os juros são recalculados a partir dos saldos. Se o método exigir parcela negativa ou menor que os juros de um mês, a interface informa que a combinação não é suportada. Não há capitalização de juros não pagos. Outras formas de renegociação não são simuladas.

O cronograma precisa ser aceito pelo banco para corresponder a um contrato real.

Os cálculos usam precisão completa; os valores exibidos são arredondados conforme as casas decimais da moeda. Somar valores exibidos pode produzir pequenas diferenças em relação ao total, e contratos que arredondam cada lançamento podem ter alguns centavos de diferença. O saldo final calculado é zero.

### Exemplo verificado

- Empréstimo 1: €260.000, 300 meses, 2% anuais nominais.
- Empréstimo 2: €40.000, 240 meses, 1,5% anuais nominais.
- Normal: €1.295,04 nos meses 1–240 e €1.102,02 nos meses 241–300. Total: €376.930,74.
- Uniforme: €1.263,74 nos 300 meses. Total: €379.122,46.

## Idiomas e fontes

Os dez idiomas iniciais foram escolhidos por total de falantes (língua materna e segunda língua). A lista Ethnologue 2026, reproduzida na fonte abaixo, coloca o indonésio entre os dez primeiros e o russo em 11º. O russo foi incluído adicionalmente a pedido do usuário, totalizando onze idiomas. O rublo está disponível entre as moedas.

- https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers — reprodução consultada em 18/09/2026; o site original do Ethnologue retornou bloqueio de acesso na pesquisa.
- https://www.ethnologue.com/insights/ethnologue200/ — fonte original do ranking.
- https://e-immobilier.credit-agricole.fr/conseils/financement/lissage-pret — explicação bancária do lissage e seus efeitos sobre os juros.

As 30 moedas foram escolhidas para ampla cobertura geográfica e inclusão das solicitadas. Não são apresentadas como um ranking das 30 mais negociadas. As traduções estão incluídas localmente e não dependem de um serviço online; não houve revisão por tradutores nativos.

## Espaços para AdSense

Os espaços `#ad-left` e `#ad-right` são **reservas visuais**, sem anúncios ativos, IDs fictícios ou rastreamento. Eles aparecem em `app.js`, na função `ad`, e são estilizados por `.ad` em `style.css`.

Para ativar publicidade, será necessário usar o código e os identificadores reais fornecidos pela sua conta aprovada no AdSense. Insira o carregador no `index.html` e implemente as unidades nesses espaços. Como a interface é renderizada novamente ao trocar idioma ou recalcular, a integração deve preservar os contêineres de anúncios e inicializá-los uma única vez; não basta disparar o carregador a cada cálculo. O site entregue não inclui essa integração, conforme o pedido de reservar os espaços.

## Arquivos

```
dist/index.html   Entrada do site
dist/style.css    Layout, responsividade e acessibilidade visual
dist/i18n.js      Traduções, moedas e idiomas
dist/finance.js   Motor financeiro independente
dist/app.js       Interface, validação e tabela
dist/favicon.svg Ícone do site
tests/finance.cjs Verificações financeiras reproduzíveis
tests/solver.cjs  Testes dos cálculos inversos
```

Se quiser rodar os testes de desenvolvimento e já tiver Node.js, execute `node tests/finance.cjs` e `node tests/solver.cjs` na pasta do projeto. O site em si não depende de Node.

Há também uma integração opcional com WebMCP, ativada apenas em navegadores compatíveis: `calculate_current_loans` calcula os valores já preenchidos na interface. Navegadores comuns ignoram essa integração.

## Validação desta versão

Verificados: fórmula de referência, juros zero, equivalência de taxa mensal/anual nominal, quitação de cada empréstimo em seu prazo, soma de principal e juros, lissage, combinação inviável, entradas inválidas, cronogramas de 1.000 e 12.000 meses e presença de todas as traduções. Os testes incluem 9 cenários do motor original e 16 cronogramas inversos, com recuperação de taxas conhecidas, última parcela parcial e múltiplos empréstimos. No navegador foram testados os seis modos de cálculo, resultados por empréstimo, mensagens de erro, russo e os novos rótulos nos onze idiomas, além da integração WebMCP. A versão anterior também verificou inclusão/remoção, vírgula decimal, rejeição de três casas decimais, mudança de moeda/idioma e exibição de 1.000 linhas.

Os dados não persistem ao recarregar a página: a calculadora volta ao exemplo inicial.
