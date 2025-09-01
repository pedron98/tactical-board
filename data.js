/* data.js — plantel principal + subtáticas + instruções
   Fontes: Transfermarkt, FotMob, FootballTransfers, Tribuna.
*/

/* Convenção:
   X: 0 = esquerda ... 100 = direita
   Y: 0 = nossa linha de gol (BOTTOM) ... 100 = gol adversário (TOP)
*/

/* Plantel principal (titulares + reservas imediatos) — 18 jogadores */
const squad = {
  "Agustín Rossi (GOL)": { role:'GK', base:[50,6], x:50, y:6 },
  "Dyogo Alves (GOL)": { role:'GK', base:[20,6], x:20, y:6 },

  "Emerson Royal (LD)": { role:'DEF', base:[78,28], x:78, y:28 },
  "Léo Pereira (ZAG)": { role:'DEF', base:[44,28], x:44, y:28 },
  "Léo Ortiz (ZAG)": { role:'DEF', base:[56,28], x:56, y:28 },
  "Ayrton Lucas (LE)": { role:'DEF', base:[22,28], x:22, y:28 },

  "Jorginho (VOL1)": { role:'MID', base:[46,46], x:46, y:46 },
  "Saúl Ñíguez (VOL2)": { role:'MID', base:[54,50], x:54, y:50 },
  "De Arrascaeta (CAM)": { role:'MID', base:[50,62], x:50, y:62 },

  "Samuel Lino (PE)": { role:'ATT', base:[28,82], x:28, y:82 },
  "Gonzalo Plata (PD)": { role:'ATT', base:[72,82], x:72, y:82 },
  "Pedro (CA)": { role:'ATT', base:[50,92], x:50, y:92 },

  /* reservas/imediatos */
  "Bruno Henrique (ATA)": { role:'ATT', base:[64,78], x:64, y:78 },
  "Luiz Araújo (ATA)": { role:'ATT', base:[36,78], x:36, y:78 },
  "Jorge Carrascal (MEI)": { role:'MID', base:[62,60], x:62, y:60 },
  "Victor Hugo (MEI)": { role:'MID', base:[40,60], x:40, y:60 },
  "Everton (ALA)": { role:'ATT', base:[18,74], x:18, y:74 },
  "Matheus Gonçalves (ALA)": { role:'ATT', base:[84,74], x:84, y:74 }
};

/* Subtáticas (posições por subtática) - 5 variações mapeadas */
const tactics = {
  principal: {
    name: "4-2-3-1",
    style: "Posse",
    mental: "Ofensivo",
    line: "Alta",
    players: JSON.parse(JSON.stringify(squad))
  },

  counter: {
    name: "4-2-3-1",
    style: "Contra-ataque Rápido",
    mental: "Ofensivo",
    line: "Média",
    players: {
      "Agustín Rossi (GOL)": { x:50,y:6 },
      "Emerson Royal (LD)": { x:80,y:30 },
      "Léo Pereira (ZAG)": { x:46,y:30 },
      "Léo Ortiz (ZAG)": { x:54,y:30 },
      "Ayrton Lucas (LE)": { x:20,y:30 },
      "Jorginho (VOL1)": { x:44,y:48 },
      "Saúl Ñíguez (VOL2)": { x:56,y:52 },
      "De Arrascaeta (CAM)": { x:50,y:66 },
      "Samuel Lino (PE)": { x:30,y:84 },
      "Gonzalo Plata (PD)": { x:70,y:84 },
      "Pedro (CA)": { x:50,y:92 }
    }
  },

  long: {
    name: "4-2-3-1",
    style: "Passe Longo",
    mental: "Equilibrado",
    line: "Baixa",
    players: {
      "Agustín Rossi (GOL)": { x:50,y:6 },
      "Emerson Royal (LD)": { x:76,y:30 },
      "Léo Pereira (ZAG)": { x:46,y:30 },
      "Léo Ortiz (ZAG)": { x:54,y:30 },
      "Ayrton Lucas (LE)": { x:24,y:30 },
      "Jorginho (VOL1)": { x:42,y:50 },
      "Saúl Ñíguez (VOL2)": { x:58,y:52 },
      "De Arrascaeta (CAM)": { x:50,y:60 },
      "Samuel Lino (PE)": { x:34,y:80 },
      "Gonzalo Plata (PD)": { x:66,y:80 },
      "Pedro (CA)": { x:52,y:92 }
    }
  },

  hold: {
    name: "4-2-3-1",
    style: "Recuado",
    mental: "Recuado",
    line: "Baixa",
    players: {
      "Agustín Rossi (GOL)": { x:50,y:6 },
      "Emerson Royal (LD)": { x:74,y:32 },
      "Léo Pereira (ZAG)": { x:46,y:32 },
      "Léo Ortiz (ZAG)": { x:54,y:32 },
      "Ayrton Lucas (LE)": { x:26,y:32 },
      "Jorginho (VOL1)": { x:44,y:52 },
      "Saúl Ñíguez (VOL2)": { x:56,y:54 },
      "De Arrascaeta (CAM)": { x:50,y:60 },
      "Samuel Lino (PE)": { x:36,y:78 },
      "Gonzalo Plata (PD)": { x:64,y:78 },
      "Pedro (CA)": { x:50,y:90 }
    }
  },

  ultra: {
    name: "3-4-3",
    style: "Contra-ataque/Posse",
    mental: "Ultraofensivo",
    line: "Alta",
    players: {
      "Agustín Rossi (GOL)": { x:50,y:6 },
      "Léo Pereira (ZAG)": { x:44,y:34 },
      "Léo Ortiz (ZAG)": { x:56,y:34 },
      "Ayrton Lucas (ZAG)": { x:30,y:34 },
      "Jorginho (MC)": { x:45,y:50 },
      "Saúl Ñíguez (MC)": { x:55,y:50 },
      "De Arrascaeta (MEI)": { x:50,y:62 },
      "Samuel Lino (PE)": { x:30,y:82 },
      "Gonzalo Plata (PD)": { x:70,y:82 },
      "Pedro (CA)": { x:50,y:92 }
    }
  }
};

/* instruções - mapeadas aos slots do eFootball */
const instructionSlots = {
  'Ataque 1': { option: 'Ofensiva', players: ['Samuel Lino (PE)', 'Luiz Araújo (ATA)'] },
  'Ataque 2': { option: 'Profundidade', players: ['Gonzalo Plata (PD)', 'Bruno Henrique (ATA)'] },
  'Defesa 1': { option: 'Marcação pressão', players: ['Pedro (CA)','Saúl Ñíguez (VOL2)'] },
  'Defesa 2': { option: 'Defesa recuada', players: ['Jorginho (VOL1)','Léo Pereira (ZAG)','Léo Ortiz (ZAG)'] }
};

