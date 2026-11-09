Levantamento feito em 09/11/2026 a partir dos e-mails de pedidos, da conversa com o técnico do
laboratório (Marcelo), dos grupos de professores de Física e da pasta de manuais do laboratório.

## Resumo

- Achei **dois** pedidos de sensores Hall, os dois no AliExpress em **18/09/2026**: 5 × **MLX90393**
  (magnetômetro digital de 3 eixos, Melexis) e 10 × **DRV5053VA** (Hall linear analógico, TI).
- **Nenhum** dos dois mede 50 a 200 mT. O MLX90393 começa a saturar em 50 mT e o DRV5053VA em 9 mT.
- Para os **µT do fio**, o **MLX90393** atende bem: ruído abaixo de 1 µT com conversões mais lentas.
- A compra de sensores Hall que o Marcelo teria feito no Mercado Livre **não aparece** em nenhuma fonte
  que consegui acessar (detalhes no fim do relatório).

## Tabela

| Produto | Onde | Data | Qtd. | CI | Faixa | Sensibilidade | Saída | Ímã em U (50–200 mT)? | µT do fio (10–60 µT)? | Fonte |
|---|---|---|---|---|---|---|---|---|---|---|
| "MLX90393 três sensor Hall digital po..." (título cortado no e-mail), variação "MLX90393, 5pcs" | AliExpress, pedido 8214725009626504, R$ 138,45 | Pedido 18/09/2026; **entregue 30/09/2026** | 5 | Melexis **MLX90393** (Triaxis, 3 eixos X/Y/Z + temperatura) | Faixa programável de **5 a 50 mT**. Saturação começa em **50 mT** nas opções -011 a -014 e em **25 mT** na opção -111. No ganho máximo a faixa é de pelo menos ±4,8 mT | XY de **0,150** a 6,009 µT/LSB; Z de 0,242 a 9,680 µT/LSB (Tabela 17, HALLCONF=0xC, 25 °C). Ruído RMS em XY com GAIN_SEL=7: cerca de **5 µT** (51 mG) na conversão mais rápida (~1 ms) e cerca de **0,2 µT** (2 mG) em ~200 ms, lido no gráfico da Fig. 2 | **Digital I2C/SPI**, 16 bits. Alimentação VDD de **2,2 a 3,6 V** (máximo absoluto 4 V) | **Só se o campo ficar abaixo de ~50 mT** (abaixo de 25 mT se for a opção -111). Não serve para 50 a 200 mT | **Sim**, é a melhor opção | Pedido: e-mails "order confirmed" (18/09) e "foi entregue" (30/09), conta pessoal. Especificações: datasheet MLX90393 rev. 012 (18/11/2025), Features, Tabela 9, Tabela 17, Fig. 2 e 3, nota 8 e Recommended Operating Conditions |
| "DRV5053VAQLPG DRV5053 ALVA TO-92 Sen...", variação "10PCS" | AliExpress, pedido 8214725009686504, R$ 100,68 | Pedido 18/09/2026; enviado 18/09, liberado na alfândega 25/09. **Não há e-mail de "entregue"**; em 04/10 chegou o pedido de avaliação | 10 | TI **DRV5053VA** em TO-92. "ALVA" é a marcação do CI na TI (+ALVA), o que confirma a variante VA | Linear entre ±B_SAT, com **B_SAT = 9 mT** típico. Fora disso a saída satura (0,2 V e 1,8 V) | **−90 mV/mT** típico (de −140 a −45 mV/mT, VCC = 3,3 V). Ruído referido à entrada de **0,49 mTpp** típico (0,40 a 0,79) na banda de 20 kHz | **Analógica**, 0,2 a 1,8 V, com **1 V em B = 0** (V_Q de 0,9 a 1,15 V). Alimentação de 2,5 a 38 V | **Não**: satura em 9 mT | **Marginal**: o ruído fica perto de 0,5 mTpp sem filtro. No ADC de 10 bits do Arduino a 5 V, cada passo vale cerca de 54 µT (cálculo: 4,88 mV ÷ 90 mV/mT). Só daria certo com filtro RC, muita média, ADC externo e calibração de cada peça. Serve bem para campos de mT (bobinas, solenoide, ímã a distância) | Pedido: e-mails "order confirmed/shipped" (18/09) e "how did it go?" (04/10), conta pessoal. Especificações: datasheet DRV5053, SLIS153D (rev. fev/2023), Features, seção 6.7 Magnetic Characteristics e Orderable Addendum (marcação) |
| Kit Arduino Mega "com vários sensores" (5 maletas; adesivo "DFLUX" na tampa) | Kit do laboratório (compra do campus) | Chegou em 27/08/2026, guardado na sala C11 | 5 maletas | **Nenhum CI Hall identificado** | — | — | — | Não | Não | Fotos do kit enviadas pelo Marcelo em 27/08 |
| Compra de sensores Hall pelo Marcelo no Mercado Livre | Mercado Livre | — | — | **Não encontrada** | — | — | — | — | — | Ver "O que não consegui verificar" |

### O que aparece na foto do kit Arduino Mega

A resolução da foto não deixa ler a serigrafia das placas, então a identificação é pela aparência.
Placa Mega 2560, LCD 16x2, protoboard, controle e receptor IR, PIR HC-SR501, módulo RTC com bateria
de moeda, sensor de nível de água, HC-SR04, relé, RFID RC522 com chaveiro, joystick, motor de passo
28BYJ-48 com driver, servo SG90, matriz de LED 8x8, display de 7 segmentos, teclado 4x4, DHT11,
potenciômetro, botões, LEDs, resistores e jumpers. Também há um módulo LED RGB e um módulo vermelho de
4 pinos com LM393, trimpot azul e um elemento redondo no centro, que parece **sensor de som**
(microfone).

**Não aparece** módulo Hall do tipo KY-024 (linear com 49E), KY-035 (49E analógico) ou KY-003 (A3144).
Mesmo que algum exista dentro das maletas, os módulos KY-003 e A3144 são chaves digitais liga/desliga
e não medem campo. Os KY-024 e KY-035 costumam usar um 49E (isso é de memória, não conferi). O
SS49E da Honeywell vai até ±65 mT garantidos (detalhe abaixo).

## Recomendação

**Campo no vão do ímã em U (esperado entre 50 e 200 mT, a confirmar):** nenhum dos sensores comprados
cobre essa faixa.

1. Antes de tudo, meça com o **MLX90393 no ganho mínimo** (GAIN_SEL=0, RES=3). Se a leitura ficar bem
   abaixo de ~45 mT e mudar suavemente com a posição, a medida vale. Se a leitura "achatar" perto de
   50 mT, o sensor saturou e o número não vale.
2. Se o vão passar de 50 mT, o caminho é a **"sonda Hall" antiga do laboratório**, que o Gustavo citou
   no áudio de 09/11 ("coloco aquela sonda Hall ali no meio para medir"). O modelo dela não aparece em
   nenhuma fonte; vale perguntar ao Marcelo onde está e qual é.
3. Se for preciso comprar (fica só como informação; não comprei nada):
   - **TI DRV5055A4**: 12,5 mV/mT, faixa de **±169 mT** a 5 V, saída analógica ratiométrica. É o
     único CI linear barato que cobre quase toda a faixa de 50 a 200 mT.
   - **Honeywell SS49E** (o CI dos módulos 49E): 1,4 mV/G típico (14 mV/mT), faixa de ±650 G
     (**65 mT**) garantidos e ±1000 G (100 mT) típicos, alimentação de 2,7 a 6,5 V. Cobre só a parte
     de baixo da faixa.

**Campo do fio (10 a 60 µT):** use o **MLX90393**.

- Configure o ganho máximo (GAIN_SEL=7, RES=0): 0,150 µT/LSB em X e Y, com faixa de pelo menos
  ±4,8 mT.
- Use conversões de 50 a 200 ms, que dão ruído RMS de cerca de 0,4 a 0,2 µT (leitura da Fig. 2).
- Alinhe o eixo X ou Y com a direção tangencial do campo, porque o eixo Z tem mais ruído.
- O campo da Terra, também da ordem de dezenas de µT, entra como um offset. Para tirá-lo, meça com a
  corrente ligada e desligada, ou inverta o sentido da corrente e use a metade da diferença.
- Ordem de grandeza (cálculo, B = µ₀I/2πr): 5 A a 2 cm dão 50 µT, e 2 A a 1 cm dão 40 µT. A fonte do
  laboratório com alguns ampères basta. Isso é coerente com o que o Gustavo disse ao Marcelo: o
  resistor do kit novo esquenta, então é melhor usar a fonte do laboratório.
- Atenção: o MLX90393 aceita no máximo 3,6 V (máximo absoluto 4 V). Com Arduino de 5 V, só ligue
  direto se o módulo tiver regulador e conversão de nível. Uma alternativa é usar uma placa de 3,3 V
  (ESP32, Pico).

**DRV5053VA:** não serve para o vão nem é bom para µT. Use para campos de 0,5 a 9 mT, como os de
bobinas, solenoides e Helmholtz, ou para mostrar o decaimento do campo de um ímã a distância.

## O que não consegui verificar

- **Compra do Marcelo no Mercado Livre**: não encontrei nada sobre isso.
  - Nas mensagens de texto com ele (o histórico disponível começa em 11/08/2026) não há menção a Hall,
    sensor ou Mercado Livre ligada a isso.
  - Os áudios que ainda podem ser baixados não falam de sensores; os mais antigos não estão mais
    disponíveis.
  - O pedido não está nos e-mails do Mercado Livre das contas do Gustavo. A conta do Mercado Livre
    dele recebe e-mails no endereço do IFSP; revisei todas as compras de 2024 a 2026 e não há sensor.
    A compra pode ter sido feita na conta do Marcelo ou antes de 11/08/2026. Só perguntando a ele.
- **MLX90393, módulo ou CI solto?** O e-mail corta o título ("MLX90393 três sensor Hall digital
  po..."), e a página do pedido não pôde ser consultada. Por isso não sei se veio
  em placa (com ou sem regulador) nem qual é o código de opção: -0xx satura em 50 mT e -111 em 25 mT.
  Basta olhar as peças ou a página do pedido no AliExpress.
- **Entrega do DRV5053**: não há e-mail de "entregue". O último aviso de rastreio é "em trânsito
  novamente" (25/09), e o pedido de avaliação chegou em 04/10. É provável que tenha chegado, mas não
  está confirmado.
- **Sonda Hall antiga do laboratório**: o modelo e a faixa são desconhecidos.
  - A lista de compras novas do laboratório (descritivo dos itens, na pasta de manuais)
    não traz sonda Hall, teslâmetro nem gaussímetro, só bússola.
  - A pasta "Eletromagnetismo" tem 9 manuais, nenhum de teslâmetro.
- **Kit Arduino "DFLUX"**: não achei a lista oficial de componentes na web. A foto é de uma maleta só,
  e a apostila (QR code na maleta) não foi consultada.
- **Outras conversas**: nos dois grupos de professores de Física não há menção a sensores Hall.
- **Outras contas de e-mail**: não há outros pedidos de sensores Hall.

## Fontes

- E-mails do AliExpress de confirmação, envio, entrega e avaliação dos dois pedidos.
- Datasheets oficiais:
  - TI DRV5053, SLIS153D: https://www.ti.com/lit/ds/symlink/drv5053.pdf
  - Melexis MLX90393, rev. 012: https://www.melexis.com/-/media/files/documents/datasheets/mlx90393-datasheet-melexis.pdf
  - TI DRV5055, SBAS640C (rev. jun/2026): https://www.ti.com/lit/ds/symlink/drv5055.pdf
  - Honeywell SS39ET/SS49E/SS59ET, 005850-4-EN: https://prod-edam.honeywell.com/content/dam/honeywell-edam/sps/siot/ja/products/sensors/magnetic-sensors/linear-and-angle-sensor-ics/common/documents/sps-siot-ss39et-ss49e-ss59et-product-sheet-005850-3-en-ciid-50359.pdf
- Conversa com o técnico do laboratório (Marcelo), incluindo as fotos do kit Arduino de 27/08.
- Pasta de manuais do laboratório, compartilhada pelo Marcelo em 20/08/2026.
