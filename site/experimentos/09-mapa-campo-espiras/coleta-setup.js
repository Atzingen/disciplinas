// Configuração da montagem para a aba Coleta: medidas do sensor no cabeçote e da bobina na mesa, e o que sai
// delas (origem, área que o sensor alcança e um plano sugerido).
//
// Convenções (todas em mm, nos eixos da impressora):
// - X, Y e Z do Marlin são a posição da ponta do bico; depois do home, Z = 0 é o bico encostado na mesa.
// - dx e dy: onde fica o sensor em relação ao bico (sensor em X = bico + dx); dz: quanto o sensor fica ABAIXO
//   da ponta do bico (número positivo).
// - hb: altura do plano do fio da bobina acima da mesa; xc e yc: posição do centro da bobina na mesa, em
//   coordenadas da impressora.
// - Coordenadas da bobina (as do arquivo): origem no centro dela, z = altura do sensor acima do plano do fio.

export const SETUP_PADRAO = { dx: 0, dy: 0, dz: 25, hb: 100, xc: 120, yc: 125 };

export const NOMES_DO_SETUP = {
  dx: "sensor em X em relação ao bico (dx)",
  dy: "sensor em Y em relação ao bico (dy)",
  dz: "sensor abaixo do bico (dz)",
  hb: "altura do plano da bobina sobre a mesa (hb)",
  xc: "centro da bobina em X (xc)",
  yc: "centro da bobina em Y (yc)",
};

export function lerSetup(valores) {
  const setup = {};
  for (const chave of Object.keys(SETUP_PADRAO)) {
    const texto = String(valores[chave] ?? "").trim();
    const valor = Number(texto);
    if (texto === "" || !Number.isFinite(valor)) throw new Error(`Preencha "${NOMES_DO_SETUP[chave]}" com um número.`);
    setup[chave] = valor;
  }
  if (!(setup.dz > 0)) throw new Error("O sensor precisa ficar abaixo da ponta do bico (dz maior que zero), senão o bico bate antes.");
  if (!(setup.hb >= 0)) throw new Error("A altura da bobina sobre a mesa não pode ser negativa.");
  return setup;
}

// Origem no formato da varredura: com o bico em X0, Y0, o sensor fica sobre o centro da bobina; com o bico em
// Z0 + (z − h0), o sensor fica z acima do plano do fio.
export function calibracaoDoSetup({ dx, dy, dz, hb, xc, yc }) {
  return { X0: xc - dx, Y0: yc - dy, Z0: hb + dz, h0: 0 };
}

// Retângulo que o sensor alcança, em coordenadas da bobina, dado o curso do bico informado pelo firmware.
export function areaDoSensor(curso, setup) {
  const { X0, Y0, Z0, h0 } = calibracaoDoSetup(setup);
  return {
    x: { min: curso.min.x - X0, max: curso.max.x - X0 },
    y: { min: curso.min.y - Y0, max: curso.max.y - Y0 },
    z: { min: curso.min.z - Z0 + h0, max: curso.max.z - Z0 + h0 },
  };
}

// Plano inicial a partir da bobina: grade quadrada de ±(raio + margem), com passo de 10 % do diâmetro (5 a 20 mm),
// cortada para caber na área que o sensor alcança; alturas a partir de 20 mm, só as que cabem no curso em Z;
// referência no canto mais longe, na maior altura. O resultado sai no formato dos campos da tela (texto).
export function sugerirPlano({ dimensaoMm, setup, curso, alturaMinima = 20 }) {
  if (!(dimensaoMm > 0)) throw new Error("Informe o tamanho da bobina (diâmetro ou lado) para sugerir o plano.");
  const area = areaDoSensor(curso, setup);
  const raio = dimensaoMm / 2;
  const passo = Math.min(20, Math.max(5, Math.round(dimensaoMm / 10)));
  const meiaLargura = raio + Math.max(30, 0.5 * raio);
  // Faixa em múltiplos do passo a partir do centro, para a grade passar pelo centro da bobina.
  const faixa = ({ min, max }) => ({
    min: Math.max(-Math.floor(meiaLargura / passo) * passo, Math.ceil(min / passo) * passo),
    max: Math.min(Math.floor(meiaLargura / passo) * passo, Math.floor(max / passo) * passo),
  });
  const x = faixa(area.x);
  const y = faixa(area.y);
  if (x.min > 0 || x.max < 0 || y.min > 0 || y.max < 0) {
    throw new Error("O sensor não alcança o centro da bobina com este curso: confira o centro da bobina e dx, dy.");
  }
  const candidatas = [20, 30, 45, 65, 90, 130, 180].filter((z) => z >= alturaMinima);
  const alturas = candidatas.filter((z) => z >= area.z.min && z <= area.z.max);
  if (alturas.length === 0) {
    throw new Error("Nenhuma altura cabe no curso em Z: confira a altura da bobina (hb) e quanto o sensor fica abaixo do bico (dz).");
  }
  const zRef = alturas[alturas.length - 1];
  const longe = (faixaDoEixo) => (Math.abs(faixaDoEixo.min) >= Math.abs(faixaDoEixo.max) ? faixaDoEixo.min : faixaDoEixo.max);
  return {
    xMin: String(x.min), xMax: String(x.max), xPasso: String(passo),
    yMin: String(y.min), yMax: String(y.max), yPasso: String(passo),
    alturas: alturas.join(", "),
    refX: String(longe(x)), refY: String(longe(y)), refZ: String(zRef), refCada: "4",
  };
}

// Versão e máquina pelo M115 ("FIRMWARE_NAME:Marlin 2.1.3 (Mar 9 2022) SOURCE_CODE_URL:... MACHINE_TYPE:Tycoon Slim").
export function lerFirmware(linhas) {
  for (const linha of linhas) {
    const nome = /FIRMWARE_NAME:\s*(.+?)(?:\s+[A-Z_]+:|$)/.exec(linha);
    if (!nome) continue;
    const maquina = /MACHINE_TYPE:\s*(.+?)(?:\s+[A-Z_]+:|$)/.exec(linha);
    return { firmware: nome[1].trim(), maquina: maquina ? maquina[1].trim() : null };
  }
  return null;
}
