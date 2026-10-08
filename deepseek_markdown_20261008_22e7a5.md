# Kino der Toten — Browser Edition

Recréation navigateur du mode Zombies de Call of Duty: Black Ops 1, carte Kino der Toten.
Stack : HTML / CSS / JavaScript / Three.js / Vite.

## Installation

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173. Clique sur la page pour capturer la souris.

## Contrôles

| Touche | Action |
|---|---|
| WASD | Déplacement |
| Souris | Visée |
| Clic gauche | Tir |
| Clic droit | Visée (ADS) |
| R | Recharger |
| E | Interagir (portes, achats, perks) |
| 1 / 2 | Changer d'arme |
| G | Grenade |
| V | Mêlée |
| Shift | Sprint |
| Ctrl | S'accroupir |
| Espace | Sauter |
| Échap | Pause |

## Structure

- `src/core` — boucle de jeu, input, physique
- `src/player` — joueur FPS, viewmodel
- `src/weapons` — armes, stats, gestion d'inventaire
- `src/zombies` — entité zombie, IA, spawner
- `src/map` — géométrie de Kino der Toten
- `src/systems` — rounds, interactions, barricades, bonus
- `src/ui` — HUD, menus
- `src/effects` — particules, impacts
- `src/audio` — sons synthétisés (Web Audio)
- `src/save` — localStorage

## Statut

Squelette complet et jouable : carte, joueur, zombies, rounds, points, portes, wall buys,
perks, mystery box, barricades, power-ups, téléporteur, Pack-a-Punch, pièges, HUD, menu,
sauvegarde.