# Lousa Tática — CR Flamengo (Filipe Luís)

Projeto: lousa tática multi-arquivo (HTML/CSS/JS) para planejamento e aplicação de offsets táticos (eFootball).  
Arquivos principais: `index.html`, `style.css`, `data.js`, `script.js`.

---

## Objetivo <!-- {{{1 --->
Ferramenta visual para desenhar formações/subtáticas, calcular offsets (`Δx`, `Δy`) entre uma **formação baseline 4-2-3-1 (padrão)** e as subtáticas do projeto, e converter esses offsets em **toques D-pad** para aplicar no Editor do eFootball (PS5).

---

## Estado atual (variáveis críticas) <!-- {{{1 --->
- `pitchRect` (screenshot 4K usado com `click-to-percent.html`):  
  ```js
  { left: 789, top: 87, width: 2262, height: 1782 }

