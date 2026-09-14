// Arduino Uno R3 / Nano classico (ATmega328P, 5 V).
// D8 -- resistor escolhido -- (+) capacitor; (-) capacitor -- GND.
// A0 no terminal (+). O mesmo resistor limita carga E descarga.
const byte DRIVE_PIN = 8;
const byte SENSOR_PIN = A0;
const unsigned long RESISTOR_OHM = 47000UL;  // Trocar por 56000UL ou 68000UL.
const unsigned long CAPACITOR_UF = 2200UL;
const unsigned long SAMPLE_MS = 20UL;
const unsigned long PHASE_MS = 5UL * RESISTOR_OHM * CAPACITOR_UF / 1000UL;

enum Phase { IDLE, CHARGING, DISCHARGING };
Phase phase = IDLE;
unsigned long phaseStart = 0;
unsigned long lastSample = 0;

void sample() {
  const unsigned long elapsed = millis() - phaseStart;
  const int adc = analogRead(SENSOR_PIN);
  Serial.print(phase == CHARGING ? F("carga,") : F("descarga,"));
  Serial.print(elapsed);
  Serial.print(',');
  Serial.print(adc);
  Serial.print(',');
  Serial.println(RESISTOR_OHM);
  lastSample = elapsed;
}

void startPhase(Phase next) {
  phase = next;
  digitalWrite(DRIVE_PIN, phase == CHARGING ? HIGH : LOW);
  phaseStart = millis();
  sample();
}

void setup() {
  digitalWrite(DRIVE_PIN, LOW);
  pinMode(DRIVE_PIN, OUTPUT);
  pinMode(SENSOR_PIN, INPUT);
  Serial.begin(115200);
  Serial.println(F("# pronto: i=iniciar par carga/descarga; x=interromper"));
}

void loop() {
  if (Serial.available()) {
    const char command = Serial.read();
    if (command == 'x') {
      phase = IDLE;
      digitalWrite(DRIVE_PIN, LOW);
      Serial.println(F("# interrompido"));
    } else if (command == 'i' && phase == IDLE) {
      if (analogRead(SENSOR_PIN) > 10) {
        Serial.println(F("# erro: descarregue o capacitor ate ADC <= 10 e tente de novo"));
      } else {
        Serial.println(F("fase,t_ms,adc,r_nominal_ohm"));
        startPhase(CHARGING);
      }
    }
  }
  if (phase == IDLE) return;

  const unsigned long elapsed = millis() - phaseStart;
  if (elapsed >= PHASE_MS) {
    if (elapsed > lastSample) sample();
    if (phase == CHARGING) {
      startPhase(DISCHARGING);
    } else {
      phase = IDLE;
      digitalWrite(DRIVE_PIN, LOW);
      Serial.println(F("# fim"));
    }
  } else if (elapsed - lastSample >= SAMPLE_MS) {
    sample();
  }
}
