# Loan Calculator — calculadora de múltiplos empréstimos

Site estático, responsivo e sem dependências. Os cálculos acontecem no navegador, sem enviar os valores para um servidor. A interface começa em inglês, com dólar americano (USD) e todos os campos numéricos vazios. Novos empréstimos também começam vazios. Nenhum resultado é gerado antes do primeiro cálculo.

## Testar agora

1. Extraia o ZIP.
2. Abra `dist/index.html` no navegador.
3. Selecione Português, escolha a moeda e preencha seus empréstimos.

Não precisa instalar Node, usar terminal nem configurar uma API. Use números sem separadores de milhar: `260000`. Valores e taxas aceitam até duas casas decimais, com ponto ou vírgula: `3.2` ou `3,2`. Também são aceitos algarismos árabes, persas, devanágari e bengalis.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie **o conteúdo da pasta `dist`**, deixando `index.html`, `app.js`, `finance.js`, `i18n.js`, `style.css`, `pdf.js` e `favicon.svg` na raiz do repositório. Inclua `.nojekyll` se o seu método de upload mostrar arquivos ocultos.
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
- Dois espaços laterais de publicidade, reservados no desktop. Em telas pequenas (até 900 px), as laterais ficam ocultas e a área de publicidade aparece no topo, antes do formulário.

## Escolher o que calcular

O seletor **O que calcular** oferece seis opções. O campo desconhecido deixa de ser editável e é identificado como **Calculado**. Os valores são apresentados no resultado e não substituem os dados digitados nos outros modos.

| Calcular | Informações necessárias, por empréstimo |
| --- | --- |
| Mensalidade | Valor emprestado, duração e taxa |
| Duração | Valor emprestado e taxa de cada empréstimo, mensalidade geral |
| Taxa de juros | Valor emprestado e duração de cada empréstimo, mensalidade geral |
| Total de juros / custo do empréstimo | Valor emprestado, duração e taxa |
| Total a pagar | Valor emprestado, duração e taxa |
| Valor emprestado | Mensalidade geral, duração e taxa de cada empréstimo |

É possível adicionar vários empréstimos em todos os modos. Nos cálculos de prazo, taxa e valor emprestado existe um único campo **Mensalidade**, com a mesma aparência das outras variáveis e sem explicações abaixo. O resultado é conjunto, sem repetir a incógnita para cada empréstimo. Como uma parcela total não determina valores independentes para várias incógnitas, a seção recolhida **Como funciona o cálculo** documenta estas regras:

- Prazo: calcula um prazo comum, usando os valores e taxas de cada empréstimo. Distribui a mensalidade entre os contratos para que terminem juntos, com eventual última parcela reduzida.
- Taxa: calcula uma taxa comum, usando os valores e prazos de cada empréstimo.
- Valor emprestado: no plano normal, calcula o principal total e o divide igualmente entre os empréstimos. No lissage, divide a mensalidade igualmente entre os contratos ativos e redistribui a mensalidade à medida que eles terminam; calcula o principal de cada contrato pelo valor presente de suas parcelas, usando sua taxa e prazo. Assim, os valores emprestados podem diferir.

No plano normal, a mensalidade geral é o total enquanto todos os empréstimos estão ativos; cai quando algum termina. No lissage do valor emprestado, representa a mensalidade constante até o fim. No cálculo da taxa, representa o teto mensal. Taxa e valor oferecem ambos os planos; o prazo comum mantém a soma das parcelas constante até a última parcela. Nenhuma distribuição arbitrária de taxas ou valores individuais é apresentada como solução única.

O prazo calculado pode ser mostrado em meses ou em anos com os meses restantes. Exemplo: 233 meses = 19 anos e 5 meses. Como os pagamentos são mensais, uma duração teórica fracionada é arredondada para o mês seguinte, com redução da última parcela. Não se força um arredondamento para anos inteiros.

A taxa calculada pode ser exibida ao mês ou ao ano (nominal, 12 vezes a mensal). Ela é encontrada numericamente por bisseção, mantendo a precisão interna completa. O resultado é exibido com até seis casas decimais; a restrição de duas casas se aplica às taxas **digitadas**, não à solução numérica.

A mensalidade uniforme está disponível para calcular parcelas, juros totais, total a pagar, taxa comum e valor total com distribuição de parcelas entre contratos ativos. Os cálculos inversos respeitam as regras declaradas acima.

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

Nenhum prazo é prorrogado. Todos os contratos podem ter parcelas ajustadas. O modelo usa etapas definidas pelos vencimentos originais e mantém a parcela individual constante em cada etapa. Um programa linear minimiza a amplitude (maior menos menor mensalidade total); entre soluções igualmente uniformes, minimiza o total pago. Esta é uma otimização dentro desse modelo por etapas, não de todo cronograma mensal arbitrário.

As restrições exigem pagamentos não negativos, o valor presente das parcelas igual ao principal de cada contrato e nenhum pagamento depois do vencimento. Os saldos são reconstruídos de trás para frente para evitar instabilidade numérica. Juros não pagos são capitalizados, com saldos individuais visíveis. Se a amplitude superar meio centavo, a interface e o PDF mostram a faixa de mensalidades e avisam que não é possível uma mensalidade constante no modelo por etapas.

No cálculo inverso de taxa, a mensalidade informada é um teto. Calcula-se a maior taxa comum que permite respeitá-lo sem ultrapassar nenhum vencimento e, nessa taxa, minimiza-se a amplitude das parcelas. A busca mantém todos os prazos originais.

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

Os espaços `#ad-left`, `#ad-right` e `#ad-mobile` são **reservas visuais**, sem anúncios ativos, IDs fictícios ou rastreamento. Eles aparecem em `app.js`, na função `ad`, e são estilizados por `.ad` em `style.css`.

Para ativar publicidade, será necessário usar o código e os identificadores reais fornecidos pela sua conta aprovada no AdSense. Insira o carregador no `index.html` e implemente as unidades nesses espaços. Como a interface é renderizada novamente ao trocar idioma ou recalcular, a integração deve preservar os contêineres de anúncios e inicializá-los uma única vez; não basta disparar o carregador a cada cálculo. O site entregue não inclui essa integração, conforme o pedido de reservar os espaços.

## Arquivos

```
dist/index.html   Entrada do site
dist/style.css    Layout, responsividade e acessibilidade visual
dist/i18n.js      Traduções, moedas e idiomas
dist/finance.js   Motor financeiro independente
dist/app.js       Interface, validação e tabela
dist/favicon.svg Ícone do site
dist/pdf.js      Geração local do relatório PDF
tests/finance.cjs Verificações financeiras reproduzíveis
tests/solver.cjs  Testes dos cálculos inversos
tests/global.cjs  Testes da mensalidade geral
```

Se quiser rodar os testes de desenvolvimento e já tiver Node.js, execute `node tests/finance.cjs`, `node tests/solver.cjs` e `node tests/global.cjs` na pasta do projeto. O site em si não depende de Node.

Há também uma integração opcional com WebMCP, ativada apenas em navegadores compatíveis: `calculate_current_loans` calcula os valores já preenchidos na interface. Navegadores comuns ignoram essa integração.

## Validação desta versão

Verificados: fórmula de referência, juros zero, equivalência de taxa mensal/anual nominal, quitação de cada empréstimo em seu prazo, soma de principal e juros, lissage, combinação inviável, entradas inválidas, cronogramas de 1.000 e 12.000 meses e presença de todas as traduções. Os testes incluem 9 cenários do motor original e 16 cronogramas inversos, com recuperação de taxas conhecidas, última parcela parcial e múltiplos empréstimos. No navegador foram testados os seis modos de cálculo, resultados por empréstimo, mensagens de erro, russo e os novos rótulos nos onze idiomas, além da integração WebMCP. A versão anterior também verificou inclusão/remoção, vírgula decimal, rejeição de três casas decimais, mudança de moeda/idioma e exibição de 1.000 linhas.

Os dados não persistem ao recarregar a página: a calculadora volta aos campos vazios, em inglês e USD.

## Correção do lissage — exemplo de regressão

R$260.000 por 300 meses a 14% anuais nominais + R$180.000 por 15 anos a 8% anuais nominais: mensalidade uniforme de **R$4.684,64** durante 300 meses. Nos meses 1–180, o primeiro recebe R$2.964,47 e o segundo R$1.720,17. O saldo do primeiro cresce até R$301.716,45 no mês 180; depois recebe a parcela inteira e é quitado no mês 300. Total calculado: R$1.405.393,13; juros totais: R$965.393,13. Os totais usam precisão completa, antes do arredondamento de exibição. Esse caso integra os testes, com verificação independente de cada saldo e vencimento.

## Download do estudo em PDF

Após um cálculo válido, o botão **Download PDF** gera um arquivo no navegador. O resultado procurado aparece em um quadro verde no topo, em negrito e com tipografia maior. O resumo usa linhas alternadas para facilitar a leitura. As notas metodológicas ficam em uma caixa na parte inferior da primeira página; notas excepcionalmente extensas continuam no rodapé de páginas adicionais, sem sobreposição.

O relatório inclui os dados usados, hipóteses, resultados, fases e todos os meses do cronograma — inclusive os que não estão na página atual da tabela. Nos cálculos de prazo, taxa e valor emprestado, mostra apenas o resultado conjunto e a tabela mensal consolidada: não repete resultados calculados por empréstimo. Os dados conhecidos de cada contrato continuam documentados separadamente, em outra página quando não couberem no resumo. Nos demais modos, mantém as tabelas individuais de parcelas e saldos. Publicidade e botões não são incluídos.

A exportação é offline, sem bibliotecas externas, impressora virtual ou envio de dados a servidores. O arquivo preserva o idioma selecionado por meio de páginas rasterizadas de alta resolução; o texto do PDF não é selecionável. Relatórios muito longos têm mais páginas e arquivos maiores. Depois da geração, o botão se torna um link para baixar novamente o mesmo estudo. Alterar os dados exige novo cálculo e gera outro relatório.

Validação adicional: 8 cenários de mensalidade geral com prazo/taxa comuns, principal igualmente distribuído, plano normal e lissage; um relatório de 1.000 meses renderizado e conferido visualmente.

Revisão visual do resumo: PDFs de duração, taxa e valor emprestado gerados com os dados reais da aplicação, renderizados e conferidos; verificado destaque da incógnita, notas no rodapé e ausência de resultados individuais nesses modos.

## Lissage flexível ao calcular o valor emprestado

A divisão igual do principal foi removida deste modo. Cada mês distribui o orçamento igualmente entre os contratos ainda ativos. O principal de cada contrato é o valor presente de suas parcelas, descontadas pela taxa mensal desse contrato. Não é uma otimização do maior crédito possível: é uma regra explícita para obter uma solução determinada a partir de uma mensalidade conjunta. Os modos com valores conhecidos usam a otimização por etapas descrita acima.

Exemplo: R$2.000 por mês; 12 meses a 12% ao ano, 24 meses a 8% e 36 meses a 4% (taxas nominais). Resultado conjunto: **R$66.580,62**. Total pago: **R$72.000,00**; juros: **R$5.419,38**. Nos primeiros 12 meses, cada contrato recebe um terço da mensalidade; nos 12 seguintes, cada um dos dois restantes recebe metade; nos últimos 12, o último recebe a mensalidade inteira. Diferenças de um centavo na soma visual decorrem do arredondamento de exibição. Todas as parcelas calculadas são não negativas e os três saldos são quitados nos seus respectivos vencimentos.


### Caso de 12, 24 e 36 anos
R$260.000 a 12%, R$180.000 a 8% e R$120.000 a 4% anuais nominais: R$3.874,90 por mês nos meses 1–288 e R$2.739,56 nos meses 289–432. Os contratos são quitados nos meses 144, 288 e 432. O plano prioriza o primeiro contrato, depois o segundo e por fim o terceiro, sem estender vencimentos. O aviso informa que se trata de mensalidade aproximada.
`node tests/smoothing.cjs` verifica limites matemáticos independentes do exemplo, 100 carteiras variadas, prazos originais, juros zero e altos, 1.000/12.000 meses e orçamento no cálculo inverso da taxa.

Avisos simplificados: o resultado mostra apenas o aviso de mensalidade aproximada. A descrição do método permanece na seção de detalhes. Publicidade móvel usa uma reserva de pelo menos 100 px de altura, exclusiva para telas de até 900 px.
