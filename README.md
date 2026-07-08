# 🏃 Gate Runner

Jeu web **3D low-poly** de type *army gate runner* (inspiré de *Last War* / *Count Masters*).
Fait avec **Three.js + Vite**, en JavaScript pur, sans aucun asset externe (tout en géométries).

Ton escouade court automatiquement : déplace-la de gauche à droite pour passer les
bonnes **portes** (multiplier / additionner tes soldiers), améliorer ton **arme**,
détruire les **obstacles**, écraser les **vagues d'ennemis** et battre le **boss** de fin de niveau.
Entre les niveaux, dépense tes **pièces** pour améliorer ton escouade (méta-progression sauvegardée).

## ▶️ Lancer le jeu

```bash
npm install
npm run dev
```

Puis ouvre l'URL affichée (par défaut http://localhost:5173).
Le jeu fonctionne sur **desktop** (souris / flèches ←→ ou A/D) et **mobile** (glisse le doigt).

Pour une build de production : `npm run build` puis `npm run preview`.

## 🎮 Contrôles

| Plateforme | Déplacement latéral |
|-----------|---------------------|
| PC souris | maintiens + glisse   |
| PC clavier | flèches ← → ou A / D |
| Mobile    | glisse le doigt      |

## 🧩 Architecture

```
src/
  main.js              point d'entrée, états (menu/jeu/fin), boucle de jeu
  core/
    Game.js            orchestrateur : scène, phases course→boss→fin
    Input.js           souris + tactile + clavier normalisés
    SaveManager.js     sauvegarde localStorage
    AudioManager.js    SFX WebAudio générés (désactivables)
  entities/
    Squad.js           escouade (InstancedMesh, formation, arme)
    Enemy.js  Boss.js  ennemis mobiles & boss
    Gate.js            porte (add/mul/sub/div/weapon)
    Obstacle.js        barrière avec HP
    Projectile.js      balle (poolée)
  systems/
    SpawnSystem.js     lit le niveau et fait apparaître les éléments
    CombatSystem.js    tir, collisions, dégâts, AoE
    CameraRig.js       caméra qui suit l'escouade (lerp)
    FX.js              particules, pop de chiffres, screen shake
  config/              *** DATA-DRIVEN : c'est ici qu'on ajoute du contenu ***
    weapons.js  enemies.js  levels.js  upgrades.js
  ui/
    HUD.js  Menus.js
```

Tout le contenu est **data-driven** : pas besoin de toucher au moteur pour ajouter
un niveau, une arme ou un monstre.

## ➕ Ajouter du contenu

### Un nouveau niveau — `src/config/levels.js`
Copie un bloc de `LEVELS` et ajuste-le. Helpers disponibles : `gate(z, gauche, droite)`,
`wave(z, type, count, spread)`, `wall(z, hp, lane)`, et `G(op, val)` pour une porte.

```js
{
  name: 'Mon niveau', length: 320, ground: 0x223344, sky: 0x557799, startSquad: 12,
  boss: { name: 'Titan', hp: 2500, color: 0x996633, size: 4.2, spawns: ['grunt'] },
  events: [
    gate(35, G('mul', 3), G('add', 40)),   // porte double à 35m
    wave(60, 'runner', 10),                 // vague de 10 coureurs
    wall(90, 200),                          // mur à 200 HP
    gate(120, G('weapon', 1), G('div', 2)), // arme +1 vs ÷2
  ],
}
```
`op` d'une porte ∈ `add | mul | sub | div | weapon`. `length` = distance avant le boss.

### Une nouvelle arme — `src/config/weapons.js`
Ajoute une entrée à `WEAPONS`, mets son id dans `WEAPON_ORDER`, et branche le `next`
de l'arme précédente. Champs : `damage`, `fireRate`, `range`, `pellets`, `spread`,
`aoe`, `bulletColor`, `bulletSize`, `tier`.

### Un nouveau monstre — `src/config/enemies.js`
Ajoute une entrée à `ENEMIES` : `hp`, `speed`, `damage`, `size`, `color`, `reward`.
Utilise ensuite son id dans un `wave(...)` d'un niveau, ou dans `boss.spawns`.

### Une nouvelle amélioration — `src/config/upgrades.js`
Ajoute une entrée à `UPGRADES` (`baseCost`, `costMult`, `maxLevel`, `value(lvl)`).
Les upgrades reconnus par le moteur : `squadSize`, `startWeapon`, `income`, `damage`, `fireRate`.

## 💾 Sauvegarde
Pièces, upgrades et progression sont stockés en `localStorage` (`gate-runner-save-v1`).
Pour repartir de zéro : vide le localStorage du site (ou `SaveManager.reset()` en console).

## ⚙️ Performance
L'escouade utilise **InstancedMesh** (bodies + armes) pour tenir ~60 FPS même avec de
grosses foules, et le nombre de balles à l'écran est plafonné tout en conservant le DPS réel.
