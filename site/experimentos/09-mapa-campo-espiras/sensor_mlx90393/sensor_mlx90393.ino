// MLX90393 (placa CJMCU-90393) na ESP32: campo nos eixos da caneta, bússola e calibração pelo campo da Terra.
//
// Alimentação: 3,3 V. O MLX90393 aceita de 2,2 a 3,6 V (máximo absoluto 4 V): 5 V queima o chip.
// Por isso ele vai na ESP32, que trabalha em 3,3 V, e não no Arduino Uno (5 V).
//
// Ligação (cabo de 4 vias da caneta, o mesmo da ponteira do DRV5053), pelos nomes impressos na ESP32:
//   3V3 -> 3V3      GND -> GND      SDA -> D32 (GPIO32)      SCL -> D33 (GPIO33)
// Na placa do sensor, ligue também CS ao 3V3: o datasheet pede CS em nível alto para o modo I2C.
//
// Biblioteca: "Adafruit MLX90393" (Gerenciador de Bibliotecas), versão 2.0.5.
// Placa na IDE: "ESP32 Dev Module" ou "DOIT ESP32 DEVKIT V1". Monitor serial a 115200.
//
// Eixos da caneta (as setas X, Y e Z estão impressas na placa do sensor, que vai com os componentes para cima
// e os furos para a ponta):
//   frente   = X da placa: ao longo da caneta, positivo para a ponta
//   esquerda = Y da placa: de lado, positivo para a esquerda de quem olha de cima com a ponta para longe
//   cima     = Z da placa: saindo da face do sensor, o lado aberto da ponteira
//
// Comandos pelo monitor serial:
//   m  medir (começa assim): frente, esquerda, cima e total em µT, com nomes; o Serial Plotter mostra cada
//      eixo com o nome na legenda
//   t  tabela: o mesmo em CSV (t_ms,frente_uT,esquerda_uT,cima_uT,total_uT), para colar na planilha
//   b  bússola: rumo da ponta (magnético e geográfico), inclinação e campo da Terra; segure a caneta nivelada
//   c  calibra pelo campo da Terra: gire a caneta devagar em todas as direções por 30 s, longe de ímã, ferro e
//      fio com corrente; o resultado fica gravado na placa
//   z  zera: as medidas passam a ser relativas ao campo de agora (zere com a corrente desligada); não vale na
//      bússola, que precisa do campo da Terra
//   f  faixa de campo fraco (fio, Terra): ±4,9 mT, 0,150 µT por unidade
//   F  faixa de campo forte (ímã): ±49 mT, 1,5 µT por unidade; o chip satura em 50 mT
//   ?  mostra os eixos, os comandos e o teste dos sinais
//
// Comandos para o software de coleta (mapa do campo com a impressora 3D):
//   s     silencioso: para de imprimir leituras sozinho e só responde aos comandos (m, t ou b voltam ao normal)
//   r16   mede 16 leituras (de 1 a 256; sem número, 16) e responde numa linha:
//         med,n,frente,esquerda,cima,s_frente,s_esquerda,s_cima
//         em µT, com a calibração aplicada e sem o zero do z; s_ é o desvio padrão das n leituras.
//         Com menos de duas leituras válidas (sem como estimar o desvio), responde "erro,leitura".
//
// As mensagens começam com "obs:" para o Serial Plotter não as desenhar. O fim do setup imprime "obs: pronto".

#include <Wire.h>
#include <Preferences.h>
#include <Adafruit_MLX90393.h>

const int PINO_SDA = 32;
const int PINO_SCL = 33;
const unsigned long INTERVALO_MS = 200;
const unsigned long DURACAO_CALIBRACAO_MS = 30000;
const int LEITURAS_POR_RUMO = 4;

// Campo da Terra em Piracicaba (IGRF-14, nov/2026): total 22,75 µT, horizontal 17,6 µT, vertical 14,4 µT para
// cima, inclinação -39,3° e declinação -21,7° (o norte magnético fica 21,7° a oeste do norte geográfico).
const float CAMPO_TERRA_UT = 22.75;
const float DECLINACAO_GRAUS = -21.7;

// Se um eixo sair com o sinal trocado no teste da ajuda ('?'), troque o sinal dele aqui.
// Placa do sensor montada de cabeça para baixo: esquerda e cima ficam -1.
const float SINAL_FRENTE = 1;    // X da placa
const float SINAL_ESQUERDA = 1;  // Y da placa
const float SINAL_CIMA = 1;      // Z da placa

enum Modo { MEDIR, TABELA, BUSSOLA };

Adafruit_MLX90393 sensor;
Preferences memoria;
float offset[3] = {0, 0, 0};  // µT nos eixos da placa; vem do 'c' e fica gravado
float zero[3] = {0, 0, 0};    // µT nos eixos da caneta; vem do 'z' e vale até desligar
bool faixaForte = false;
Modo modo = MEDIR;
bool silencioso = false;

uint8_t procurarEndereco() {
  Serial.println("obs: procurando o sensor no I2C (D32 e D33)");
  uint8_t encontrado = 0;
  for (uint8_t endereco = 0x08; endereco < 0x78; endereco++) {
    Wire.beginTransmission(endereco);
    if (Wire.endTransmission() == 0) {
      Serial.printf("obs: resposta em 0x%02X\n", endereco);
      bool faixaDoMlx = endereco >= 0x0C && endereco <= 0x1B;
      if (faixaDoMlx && encontrado == 0) encontrado = endereco;
    }
  }
  return encontrado;
}

void ajuda() {
  Serial.println("obs: eixos da caneta (as setas X, Y e Z estão impressas na placa do sensor)");
  Serial.println("obs:   frente   = X: ao longo da caneta, positivo para a ponta");
  Serial.println("obs:   esquerda = Y: de lado, positivo para a esquerda de quem olha de cima com a ponta para longe");
  Serial.println("obs:   cima     = Z: saindo da face do sensor, o lado aberto da ponteira");
  Serial.println("obs: comandos: m medir, t tabela, b bússola, c calibrar, z zerar, f campo fraco, F campo forte, ? ajuda");
  Serial.println("obs: teste dos sinais, depois do c: aqui o campo da Terra aponta para cima com 14 µT");
  Serial.println("obs:   ponta para cima: frente perto de +14");
  Serial.println("obs:   caneta deitada com o sensor para cima: cima perto de +14");
  Serial.println("obs:   caneta deitada de lado com a esquerda para cima: esquerda perto de +14");
  Serial.println("obs:   se der perto de -14, troque o SINAL daquele eixo no começo do código");
}

void aplicarFaixa() {
  mlx90393_resolution resolucao = faixaForte ? MLX90393_RES_17 : MLX90393_RES_16;
  sensor.setGain(faixaForte ? MLX90393_GAIN_5X : MLX90393_GAIN_1X);
  sensor.setResolution(MLX90393_X, resolucao);
  sensor.setResolution(MLX90393_Y, resolucao);
  sensor.setResolution(MLX90393_Z, resolucao);
  sensor.setOversampling(MLX90393_OSR_3);  // menos ruído, conversão mais lenta
  sensor.setFilter(MLX90393_FILTER_5);
  zero[0] = zero[1] = zero[2] = 0;
  if (faixaForte) {
    Serial.println("obs: faixa de campo forte, até 49 mT, 1,5 µT por unidade");
  } else {
    Serial.println("obs: faixa de campo fraco, até 4,9 mT, 0,150 µT por unidade");
  }
}

// Média de n leituras, sem o offset da calibração, já nos eixos da caneta (frente, esquerda, cima).
bool lerCaneta(float caneta[3], int n) {
  float soma[3] = {0, 0, 0};
  int validas = 0;
  for (int k = 0; k < n; k++) {
    float placa[3];
    if (sensor.readData(&placa[0], &placa[1], &placa[2])) {
      for (int i = 0; i < 3; i++) soma[i] += placa[i] - offset[i];
      validas++;
    }
  }
  if (validas == 0) return false;
  caneta[0] = SINAL_FRENTE * soma[0] / validas;
  caneta[1] = SINAL_ESQUERDA * soma[1] / validas;
  caneta[2] = SINAL_CIMA * soma[2] / validas;
  return true;
}

void zerar() {
  if (modo == BUSSOLA) {
    Serial.println("obs: o zero não vale na bússola, que mede o próprio campo da Terra");
    return;
  }
  if (lerCaneta(zero, 10)) {
    Serial.printf("obs: zerado em frente=%.2f esquerda=%.2f cima=%.2f µT\n", zero[0], zero[1], zero[2]);
  }
}

// O campo da Terra é constante no lugar; girando o sensor em todas as direções, cada eixo vai de -F a +F.
// O centro de cada faixa é o offset do eixo; a meia faixa deve dar perto de F.
void calibrar() {
  if (faixaForte) {
    faixaForte = false;
    aplicarFaixa();
  }
  Serial.println("obs: calibração, gire a caneta devagar em todas as direções por 30 s");
  float minimo[3] = {1e9, 1e9, 1e9};
  float maximo[3] = {-1e9, -1e9, -1e9};
  int amostras = 0;
  unsigned long inicio = millis();
  while (millis() - inicio < DURACAO_CALIBRACAO_MS) {
    float placa[3];
    if (sensor.readData(&placa[0], &placa[1], &placa[2])) {
      for (int i = 0; i < 3; i++) {
        minimo[i] = min(minimo[i], placa[i]);
        maximo[i] = max(maximo[i], placa[i]);
      }
      amostras++;
    }
  }
  const char *nomes[3] = {"frente (X)", "esquerda (Y)", "cima (Z)"};
  bool confiavel = true;
  for (int i = 0; i < 3; i++) {
    offset[i] = (maximo[i] + minimo[i]) / 2;
    float meiaFaixa = (maximo[i] - minimo[i]) / 2;
    float razao = meiaFaixa / CAMPO_TERRA_UT;
    Serial.printf("obs: %s offset %.2f µT, meia faixa %.2f µT = %.0f%% do campo da Terra\n",
                  nomes[i], offset[i], meiaFaixa, 100 * razao);
    if (razao < 0.85 || razao > 1.15) confiavel = false;
  }
  Serial.printf("obs: %d amostras\n", amostras);
  if (!confiavel) {
    Serial.println("obs: AVISO, alguma meia faixa longe de 100%, faltou girar em alguma direção ou havia ferro ou ímã perto");
    Serial.println("obs: repita com c, mais longe da bancada de metal");
  }
  memoria.putFloat("ox", offset[0]);
  memoria.putFloat("oy", offset[1]);
  memoria.putFloat("oz", offset[2]);
  zero[0] = zero[1] = zero[2] = 0;
  Serial.println("obs: offsets gravados na placa, valem também depois de desligar");
}

void entrarNaBussola() {
  modo = BUSSOLA;
  if (faixaForte) {
    faixaForte = false;
    aplicarFaixa();
  }
  Serial.println("obs: bússola, segure a caneta nivelada com o sensor para cima");
  Serial.println("obs: rumo da ponta em graus: 0 norte, 90 leste, 180 sul, 270 oeste");
  Serial.println("obs: rumo_geo já desconta a declinação de -21,7 graus; inclinação negativa = campo para cima");
  if (offset[0] == 0 && offset[1] == 0 && offset[2] == 0) {
    Serial.println("obs: AVISO, sensor nunca calibrado, mande c antes, senão o rumo sai errado");
  }
}

float grausDe0a360(float graus) {
  float resultado = fmod(graus, 360.0);
  return resultado < 0 ? resultado + 360.0 : resultado;
}

void mostrarMedida() {
  float b[3];
  if (!lerCaneta(b, 1)) {
    Serial.println("obs: falha na leitura");
    return;
  }
  for (int i = 0; i < 3; i++) b[i] -= zero[i];
  float total = sqrt(b[0] * b[0] + b[1] * b[1] + b[2] * b[2]);
  if (modo == TABELA) {
    Serial.printf("%lu,%.2f,%.2f,%.2f,%.2f\n", millis(), b[0], b[1], b[2], total);
  } else {
    Serial.printf("frente_uT:%.2f esquerda_uT:%.2f cima_uT:%.2f total_uT:%.2f\n", b[0], b[1], b[2], total);
  }
}

// Com a caneta nivelada, o campo horizontal aponta para o norte magnético. Se a ponta aponta para o rumo R
// (contado a partir do norte, no sentido horário), o norte fica R graus à esquerda dela:
// frente = H cos R e esquerda = H sen R.
void mostrarBussola() {
  float b[3];
  if (!lerCaneta(b, LEITURAS_POR_RUMO)) {
    Serial.println("obs: falha na leitura");
    return;
  }
  float horizontal = sqrt(b[0] * b[0] + b[1] * b[1]);
  float total = sqrt(horizontal * horizontal + b[2] * b[2]);
  float rumoMagnetico = grausDe0a360(degrees(atan2(b[1], b[0])));
  float rumoGeografico = grausDe0a360(rumoMagnetico + DECLINACAO_GRAUS);
  float inclinacao = degrees(atan2(-b[2], horizontal));
  Serial.printf("rumo_mag:%.0f rumo_geo:%.0f inclinacao:%.1f horizontal_uT:%.1f vertical_uT:%.1f total_uT:%.1f\n",
                rumoMagnetico, rumoGeografico, inclinacao, horizontal, b[2], total);
}

// Média e desvio padrão de n leituras nos eixos da caneta (algoritmo de Welford), para o software de coleta.
void medirParaColeta(int n) {
  n = constrain(n <= 0 ? 16 : n, 1, 256);
  float media[3] = {0, 0, 0};
  float somaQuadrados[3] = {0, 0, 0};
  int validas = 0;
  for (int k = 0; k < n; k++) {
    float b[3];
    if (!lerCaneta(b, 1)) continue;
    validas++;
    for (int i = 0; i < 3; i++) {
      float diferenca = b[i] - media[i];
      media[i] += diferenca / validas;
      somaQuadrados[i] += diferenca * (b[i] - media[i]);
    }
  }
  if (validas < 2) {
    Serial.println("erro,leitura");
    return;
  }
  float desvio[3];
  for (int i = 0; i < 3; i++) desvio[i] = sqrt(somaQuadrados[i] / (validas - 1));
  Serial.printf("med,%d,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f\n", validas, media[0], media[1], media[2],
                desvio[0], desvio[1], desvio[2]);
}

// Número do comando r, lido só até o fim da linha. O parseInt() da biblioteca pula qualquer caractere
// que não seja dígito e engoliria o comando seguinte ("r\ns\n" viraria uma medida sem o "s").
int lerNumeroAteOFimDaLinha() {
  int numero = 0;
  unsigned long inicio = millis();
  while (millis() - inicio < 100) {
    if (!Serial.available()) continue;
    char c = Serial.peek();
    if (c >= '0' && c <= '9') {
      numero = numero * 10 + (Serial.read() - '0');
    } else {
      if (c == '\n' || c == '\r') Serial.read();
      break;
    }
  }
  return numero;
}

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("obs: MLX90393 na ESP32");
  Wire.begin(PINO_SDA, PINO_SCL);

  // Procura de novo a cada 2 s: dá para ligar o sensor com a placa já ligada, sem apertar o EN.
  uint8_t endereco = procurarEndereco();
  while (endereco == 0) {
    Serial.println("obs: MLX90393 não encontrado, confira 3V3, GND, SDA e SCL trocados e a ponte CS no 3V3");
    delay(2000);
    endereco = procurarEndereco();
  }
  if (!sensor.begin_I2C(endereco, &Wire)) {
    Serial.printf("obs: o dispositivo em 0x%02X não respondeu como MLX90393\n", endereco);
    while (true) delay(1000);
  }
  Serial.printf("obs: MLX90393 em 0x%02X\n", endereco);

  memoria.begin("mlx90393", false);
  offset[0] = memoria.getFloat("ox", 0);
  offset[1] = memoria.getFloat("oy", 0);
  offset[2] = memoria.getFloat("oz", 0);
  Serial.printf("obs: offsets gravados X=%.2f Y=%.2f Z=%.2f µT (todos 0 = nunca calibrado, mande c)\n",
                offset[0], offset[1], offset[2]);

  aplicarFaixa();
  ajuda();
  Serial.println("obs: modo medir");
  Serial.println("obs: pronto");
}

void loop() {
  while (Serial.available()) {
    char comando = Serial.read();
    if (comando == 's') { silencioso = true; Serial.println("obs: modo silencioso"); }
    if (comando == 'r') medirParaColeta(lerNumeroAteOFimDaLinha());
    if (comando == 'm' || comando == 't' || comando == 'b') silencioso = false;
    if (comando == 'm') { modo = MEDIR; Serial.println("obs: modo medir"); }
    if (comando == 't') { modo = TABELA; Serial.println("t_ms,frente_uT,esquerda_uT,cima_uT,total_uT"); }
    if (comando == 'b') entrarNaBussola();
    if (comando == 'c') calibrar();
    if (comando == 'z') zerar();
    if (comando == 'f') { faixaForte = false; aplicarFaixa(); }
    if (comando == 'F' && modo != BUSSOLA) { faixaForte = true; aplicarFaixa(); }
    if (comando == '?') ajuda();
  }

  if (silencioso) {
    delay(2);
  } else if (modo == BUSSOLA) {
    mostrarBussola();
    delay(100);
  } else {
    mostrarMedida();
    delay(INTERVALO_MS);
  }
}
