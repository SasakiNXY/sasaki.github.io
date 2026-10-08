# sasaki.github.io
# Kino der Toten — Browser Edition

Réécriture navigateur complète du mode Zombies de **Call of Duty: Black Ops 1**, carte **Kino der Toten**.
Stack 100% web : HTML, CSS, JavaScript, Three.js, Vite. Aucun asset propriétaire — tout est généré procéduralement, sons compris.

---

## Sommaire

- [Aperçu](#aperçu)
- [Installation](#installation)
- [Lancer le jeu](#lancer-le-jeu)
- [Contrôles](#contrôles)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Systèmes détaillés](#systèmes-détaillés)
- [Configuration](#configuration)
- [Sauvegarde](#sauvegarde)
- [Performance](#performance)
- [Compatibilité](#compatibilité)
- [Roadmap](#roadmap)
- [Contribuer](#contribuer)
- [Licence](#licence)

---

## Aperçu

Kino der Toten — Browser Edition recrée la boucle de gameplay iconique du mode Zombies de Black Ops 1 dans un navigateur moderne. Le joueur survit à des vagues de zombies dans un théâtre allemand abandonné, gagne des points en tuant et en réparant des barricades, ouvre progressivement la carte, achète des perks, utilise la Mystery Box, active le téléporteur et améliore ses armes au Pack-a-Punch.

Le projet cible une expérience jouable de bout en bout : spawn → manches → zombies → points → achats → perks → Mystery Box → téléporteur → Pack-a-Punch → chiens de l'enfer → mort → statistiques.

Aucune dépendance à un backend. Tout tourne côté client.

---

## Installation

Prérequis :
- **Node.js 18+**
- **npm** (fourni avec Node)

```bash
# Cloner le repo
git clone https://github.com/<ton-user>/kino-der-toten.git
cd kino-der-toten

# Installer les dépendances
npm install
