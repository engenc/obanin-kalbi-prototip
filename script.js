const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
canvas.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

const ui = {
  level: document.querySelector("#level"),
  food: document.querySelector("#food"),
  token: document.querySelector("#token"),
  honor: document.querySelector("#honor"),
  stamina: document.querySelector("#stamina"),
  mount: document.querySelector("#mount"),
  badge: document.querySelector("#badge"),
  message: document.querySelector("#message"),
  overlay: document.querySelector("#overlay"),
  startBtn: document.querySelector("#startBtn"),
  restartBtn: document.querySelector("#restartBtn"),
  musicBtn: document.querySelector("#musicBtn"),
  rewardPanel: document.querySelector("#rewardPanel"),
  chapterKicker: document.querySelector("#chapterKicker"),
  questTitle: document.querySelector("#questTitle"),
  questText: document.querySelector("#questText"),
  timeOfDay: document.querySelector("#timeOfDay"),
  wind: document.querySelector("#wind"),
  threat: document.querySelector("#threat"),
  objectives: document.querySelector("#objectives"),
  quizModal: document.querySelector("#quizModal"),
  quizQuestion: document.querySelector("#quizQuestion"),
  quizAnswers: document.querySelector("#quizAnswers"),
};

const keys = new Set();
let running = false;
let lastTime = 0;
let cameraX = 0;
let activeLevel = 0;
let audio = null;
let trackAudio = null;
let trackIndex = 0;
let musicOn = false;
let hudTick = 0;
let pendingQuizItem = null;
let feedbackFlash = 0;

const licensedTracks = [
  "https://cdn1.suno.ai/e44ed811-06e7-486b-a265-3af78050a292.mp3",
];

const quizQuestions = [
  {
    question: "Obaya gelen misafir için ilk yapılacak iş hangisidir?",
    answers: ["Kapıyı kapatmak", "Selam verip buyur etmek", "Yolunu kesmek"],
    correct: 1,
  },
  {
    question: "Emanet verilen bir şey nasıl korunur?",
    answers: ["Unutarak", "Başkasına danışmadan harcayarak", "Sözünde durarak"],
    correct: 2,
  },
  {
    question: "Büyüğün sözü dinlenirken hangi tavır yakışır?",
    answers: ["Saygıyla beklemek", "Sözünü kesmek", "Arkadan dönüp gitmek"],
    correct: 0,
  },
  {
    question: "Toy meydanında sofranın bereketi neyle artar?",
    answers: ["Saklamakla", "Paylaşmakla", "Yalnız yemekle"],
    correct: 1,
  },
  {
    question: "Yolda kalana el uzatmak hangi değeri gösterir?",
    answers: ["İnat", "Yardımlaşma", "Kıskançlık"],
    correct: 1,
  },
  {
    question: "Küçüğe sevgi göstermenin doğru yolu hangisidir?",
    answers: ["Korkutmak", "Görmezden gelmek", "Koruyup cesaretlendirmek"],
    correct: 2,
  },
];

const world = { width: 3600, height: 620, ground: 536 };
const player = { x: 80, y: 420, w: 42, h: 64, vx: 0, vy: 0, speed: 4.4, jump: 14.4, grounded: false, face: 1, poweredUntil: 0, mounted: false };
const progress = { food: 0, token: 0, helped: 0, honor: 50, stamina: 100, enemies: 0, finished: false };
const interactionRange = 170;
const atmosphere = {
  time: 0,
  birds: [
    { x: 520, y: 112, speed: 0.18, size: 1 },
    { x: 1740, y: 86, speed: 0.12, size: 0.78 },
    { x: 2880, y: 138, speed: 0.16, size: 0.92 },
  ],
  embers: Array.from({ length: 42 }, (_, index) => ({
    x: 120 + index * 83,
    y: 468 + (index % 7) * 7,
    drift: 0.4 + (index % 5) * 0.12,
    phase: index * 0.71,
  })),
  floatingText: [],
};

const levelDefs = [
  {
    name: "Oba Uyanıyor",
    badge: "Misafir Dostu",
    theme: "day",
    timeOfDay: "Şafak",
    wind: "Serin",
    threat: "Taşlı geçit",
    quest: "Misafire azık götür, küçük çocuğa yardım et, büyüğün sözünü dinle.",
    intro: "Bölüm 1: Oba Uyanıyor. Misafire azık götür, küçük çocuğa yardım et, sancağa ulaş.",
    foodNeed: 5,
    tokenNeed: 3,
    platforms: [
      [0, 536, 3600, 84, "ground"], [340, 448, 170, 22], [650, 390, 190, 22], [980, 430, 190, 22],
      [1320, 360, 210, 22], [1660, 430, 190, 22], [1990, 372, 210, 22], [2350, 420, 220, 22],
      [2730, 360, 190, 22], [3070, 430, 210, 22],
    ],
    items: [
      ["food", 380, 404], ["food", 705, 344], ["food", 1038, 386], ["meat", 1510, 314], ["food", 1710, 386], ["food", 2400, 376], ["food", 3128, 386],
      ["token", 750, 326], ["token", 1376, 312], ["token", 2790, 314], ["token", 3230, 492],
    ],
    npcs: [
      ["guest", 900, 472, "#335b7c", "Yorgun Misafir", "Evladım, selamın gönlü ısıttı. Bir lokma azık paylaşırsan yol duası ederim."],
      ["child", 1510, 472, "#a83c30", "Küçük Çocuk", "Ağabey, oyuncağım yukarıda kaldı. Emaneti öğrenerek toplarsan ben de cesaretlenirim."],
      ["elder", 2190, 468, "#52723b", "Bilge Nine", "Gel yanıma yiğidim. Misafiri doyuran, küçüğü gözeten kişi obanın yüz akıdır."],
    ],
    enemies: [[1185, 486, 100], [2580, 486, 120]],
    horses: [[1980, 498]],
    hazards: [[1160, 512, 78, 24], [1870, 512, 88, 24], [2600, 512, 76, 24]],
    goal: [3420, 398, 72, 138],
  },
  {
    name: "Kervan Yolu",
    badge: "Yol Eri",
    theme: "road",
    timeOfDay: "Öğle",
    wind: "Tozlu",
    threat: "Kırık patika",
    quest: "Kervanın yükünü hafiflet, çırağı güvene al, dervişin nasihatini tamamla.",
    intro: "Bölüm 2: Kervan Yolu. Dağ geçitlerini aş, kervana yardım et, emaneti toy meydanına taşı.",
    foodNeed: 6,
    tokenNeed: 4,
    platforms: [
      [0, 536, 3800, 84, "ground"], [280, 455, 160, 22], [570, 385, 160, 22], [860, 325, 180, 22],
      [1180, 430, 190, 22], [1510, 365, 190, 22], [1830, 300, 160, 22], [2150, 410, 210, 22],
      [2510, 350, 170, 22], [2820, 285, 180, 22], [3130, 420, 220, 22], [3460, 360, 170, 22],
    ],
    items: [
      ["food", 320, 410], ["food", 610, 340], ["food", 910, 280], ["meat", 1210, 386], ["food", 1560, 320], ["food", 2195, 366], ["food", 3190, 376],
      ["token", 930, 268], ["token", 1870, 254], ["token", 2860, 240], ["token", 3505, 314],
    ],
    npcs: [
      ["guest", 1250, 472, "#77543b", "Kervancı", "Teker kırıldı yiğidim. Bir avuç azık, bir de omuz verirsen kervan yolda kalmaz."],
      ["child", 2060, 472, "#a83c30", "Çırak", "Ustamı kaybettim sanıp korktum. Emaneti bulursan yolumuzu işaretleriz."],
      ["elder", 3030, 468, "#52723b", "Derviş", "Yol uzun, gönül dar olmasın. Yolda kalana el uzatmak törenin canıdır."],
    ],
    enemies: [[1365, 486, 110], [2350, 486, 130], [3000, 486, 100]],
    horses: [[2475, 498]],
    hazards: [[700, 512, 90, 24], [1370, 512, 95, 24], [2365, 512, 95, 24], [3020, 512, 82, 24]],
    goal: [3650, 398, 72, 138],
  },
  {
    name: "Toy Meydanı",
    badge: "Obanın Kalbi",
    theme: "dusk",
    timeOfDay: "Akşam",
    wind: "Ateş başı",
    threat: "Dar geçit",
    quest: "Toydan önce sofrayı tamamla, çocuğu meydana getir, Toy Beyi'nin sözünü yerine getir.",
    intro: "Bölüm 3: Toy Meydanı. Son emanetleri topla, büyüklerin huzurunda sözü tamamla ve obanın kalbini kazan.",
    foodNeed: 7,
    tokenNeed: 5,
    platforms: [
      [0, 536, 4100, 84, "ground"], [310, 442, 180, 22], [640, 360, 180, 22], [990, 428, 220, 22],
      [1340, 340, 200, 22], [1690, 420, 220, 22], [2050, 330, 200, 22], [2400, 430, 190, 22],
      [2740, 355, 210, 22], [3100, 290, 180, 22], [3420, 395, 220, 22], [3740, 340, 180, 22],
    ],
    items: [
      ["food", 350, 398], ["food", 690, 316], ["food", 1050, 384], ["meat", 1375, 296], ["food", 1400, 296], ["food", 1740, 376], ["food", 2460, 386], ["food", 3485, 350],
      ["token", 735, 306], ["token", 1450, 286], ["token", 2100, 286], ["token", 3145, 244], ["token", 3790, 294],
    ],
    npcs: [
      ["guest", 930, 472, "#335b7c", "Misafir Bey", "Toydan önce sofra kurulur evlat. Herkes aynı ekmeğe uzanırsa oba birlik olur."],
      ["child", 2320, 472, "#a83c30", "Oba Çocuğu", "Ben de toyda büyüklerin sözünü duymak isterim. Emanetleri bul, beraber yürüyelim."],
      ["elder", 3330, 468, "#52723b", "Toy Beyi", "Bugün söz sende alp. Sevgi küçüğe, saygı büyüğe, ikram misafire yakışır."],
    ],
    enemies: [[1210, 486, 120], [1930, 486, 100], [2630, 486, 140], [3320, 486, 100]],
    horses: [[2830, 498]],
    hazards: [[1220, 512, 90, 24], [1940, 512, 90, 24], [2640, 512, 90, 24], [3330, 512, 90, 24]],
    goal: [3940, 398, 72, 138],
  },
];

let level = hydrateLevel(levelDefs[activeLevel]);

function hydrateLevel(def) {
  world.width = def.platforms[0][2];
  return {
    ...def,
    platforms: def.platforms.map(([x, y, w, h, type]) => ({ x, y, w, h, type })),
    items: def.items.map(([kind, x, y], index) => ({ kind, x, y, taken: false, quizIndex: (activeLevel * 3 + index) % quizQuestions.length, retryAt: 0 })),
    npcs: def.npcs.map(([id, x, y, color, name, line]) => ({ id, x, y, color, name, line, helped: false })),
    enemies: def.enemies.map(([x, y, patrol], index) => ({ x, baseX: x, y, w: 42, h: 50, patrol, vx: index % 2 ? -1.15 : 1.15, defeated: false })),
    horses: def.horses.map(([x, y]) => ({ x, y, w: 108, h: 58, mounted: false, unlocked: false })),
    hazards: def.hazards.map(([x, y, w, h]) => ({ x, y, w, h })),
    goal: { x: def.goal[0], y: def.goal[1], w: def.goal[2], h: def.goal[3] },
  };
}

function loadLevel(index) {
  activeLevel = index;
  level = hydrateLevel(levelDefs[activeLevel]);
  player.x = 80;
  player.y = 420;
  player.vx = 0;
  player.vy = 0;
  player.face = 1;
  player.poweredUntil = 0;
  player.mounted = false;
  cameraX = 0;
  progress.food = 0;
  progress.token = 0;
  progress.helped = 0;
  progress.honor = 50;
  progress.stamina = 100;
  progress.enemies = 0;
  progress.finished = false;
  pendingQuizItem = null;
  ui.quizModal.classList.add("hidden");
  ui.overlay.classList.remove("celebration");
  ui.rewardPanel.classList.add("hidden");
  ui.rewardPanel.innerHTML = "";
  setMessage(level.intro);
  updateHud();
}

function startGame() {
  ui.overlay.classList.add("hidden");
  ui.overlay.classList.remove("celebration");
  ui.rewardPanel.classList.add("hidden");
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function resetGame() {
  loadLevel(0);
  ui.overlay.querySelector("h2").textContent = level.name;
  ui.overlay.querySelector("p").textContent = "Sis dağılırken oba senden iz bekliyor. Azığı tamamla, emaneti koru, sözün ağırlığını taşı ve sancağa temiz bir itibarla ulaş.";
  ui.overlay.classList.remove("celebration");
  ui.rewardPanel.classList.add("hidden");
  ui.rewardPanel.innerHTML = "";
  ui.startBtn.textContent = "Nöbete Başla";
  ui.overlay.classList.remove("hidden");
  draw();
}

function updateHud() {
  ui.level.textContent = `${activeLevel + 1}/${levelDefs.length}`;
  ui.food.textContent = `${progress.food}/${level.foodNeed}`;
  ui.token.textContent = `${progress.token}/${level.tokenNeed}`;
  ui.honor.textContent = progress.honor;
  ui.stamina.textContent = `${Math.round(progress.stamina)}`;
  ui.mount.textContent = player.mounted ? "Atlı" : player.poweredUntil > performance.now() ? "Güçlü" : "Yaya";
  const helpedAll = progress.helped >= level.npcs.length;
  ui.badge.textContent = progress.finished ? level.badge : helpedAll ? "Gönül Kapısı" : "Yok";
  ui.questTitle.textContent = level.name;
  ui.questText.textContent = level.quest;
  ui.timeOfDay.textContent = level.timeOfDay;
  ui.wind.textContent = level.wind;
  ui.threat.textContent = level.threat;
  ui.chapterKicker.textContent = `Bölüm ${activeLevel + 1}`;
  renderObjectives();
}

function renderObjectives() {
  const guestDone = level.npcs.some((npc) => npc.id === "guest" && npc.helped);
  const childDone = level.npcs.some((npc) => npc.id === "child" && npc.helped);
  const elderDone = level.npcs.some((npc) => npc.id === "elder" && npc.helped);
  const objectives = [
    { done: progress.food >= level.foodNeed, text: `Azığı tamamla: ${progress.food}/${level.foodNeed}` },
    { done: progress.token >= level.tokenNeed, text: `Emaneti topla: ${progress.token}/${level.tokenNeed}` },
    { done: progress.enemies >= level.enemies.length, text: `Yol kesenleri aş: ${progress.enemies}/${level.enemies.length}` },
    { done: guestDone, text: "Misafiri sofraya buyur et" },
    { done: childDone, text: "Küçüğe yardım et" },
    { done: elderDone, text: "Büyüğün sözünü al" },
  ];
  ui.objectives.innerHTML = objectives
    .map((objective) => `
      <li class="${objective.done ? "done" : ""}">
        <span class="objective-mark">${objective.done ? "✓" : "•"}</span>
        <span>${objective.text}</span>
      </li>
    `)
    .join("");
}

function setMessage(text) {
  ui.message.textContent = text;
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 16.67, 2);
  lastTime = time;
  if (!running) return;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  atmosphere.time += dt;
  const left = keys.has("ArrowLeft") || keys.has("a");
  const right = keys.has("ArrowRight") || keys.has("d");
  player.vx = 0;
  if (left) {
    player.vx = -currentSpeed();
    player.face = -1;
  }
  if (right) {
    player.vx = currentSpeed();
    player.face = 1;
  }
  updateStamina(Boolean(player.vx), dt);

  player.vy += 0.72 * dt;
  player.x += player.vx * dt;
  collideX();
  player.y += player.vy * dt;
  collideY();
  player.x = clamp(player.x, 0, world.width - player.w);

  if (player.y > world.height + 120) respawn("Geçit zordu. Yeniden dene; alp yolu sabır ister.");
  updateEnemies(dt);
  updateEffects(dt);
  collectItems();
  checkEnemies();
  unlockHorses();
  checkHazards();
  checkGoal();
  cameraX = clamp(player.x - canvas.width * 0.42, 0, world.width - canvas.width);
}

function updateEffects(dt) {
  feedbackFlash = Math.max(0, feedbackFlash - dt);
  atmosphere.floatingText.forEach((text) => {
    text.y -= 0.55 * dt;
    text.life -= dt;
  });
  atmosphere.floatingText = atmosphere.floatingText.filter((text) => text.life > 0);
}

function addFloatingText(x, y, text) {
  atmosphere.floatingText.push({ x, y, text, life: 58 });
}

function currentSpeed() {
  const powerBoost = player.poweredUntil > performance.now() ? 1.18 : 1;
  const mountBoost = player.mounted ? 1.45 : 1;
  const tired = progress.stamina < 18 ? 0.74 : 1;
  return player.speed * powerBoost * mountBoost * tired;
}

function updateStamina(moving, dt) {
  const drain = moving && !player.grounded ? 0.1 : moving ? 0.18 : -0.42;
  progress.stamina = clamp(progress.stamina - drain * dt, 0, 100);
  hudTick += dt;
  if (hudTick > 10) {
    hudTick = 0;
    updateHud();
  }
}

function jump() {
  if (running && player.grounded) {
    const powerBoost = player.poweredUntil > performance.now() ? 1.1 : 1;
    const mountBoost = player.mounted ? 0.92 : 1;
    player.vy = -player.jump * powerBoost * mountBoost;
    player.grounded = false;
  }
}

function act() {
  if (!running || progress.finished) return;
  if (player.mounted) {
    const horse = level.horses.find((entry) => entry.mounted);
    if (horse) {
      horse.x = player.x + player.w / 2 - 54;
      horse.y = player.y + player.h + 4;
      horse.mounted = false;
    }
    player.mounted = false;
    setMessage("Attan indin. Dizgini yanında bıraktın; gerekirse yine E ile binebilirsin.");
    updateHud();
    return;
  }
  const horse = nearestHorse();
  if (horse) {
    if (!horse.unlocked) {
      setMessage("At ürkek duruyor. Önce yoldaki tehlikeyi bertaraf et ki sana güvenip yular versin.");
      return;
    }
    player.mounted = !player.mounted;
    horse.mounted = player.mounted;
    setMessage(player.mounted ? "Ata bindin. Dizgini yumuşak tut; hız yiğitliktir ama ölçü töredir." : "Attan indin. Yolun kalanında adımını kendin tartacaksın.");
    updateHud();
    return;
  }
  const near = nearestNpc();
  if (!near) {
    setMessage("Yardım etmek istediğin kişiye yaklaş. Artık tam hizalaman gerekmiyor; E en yakın kişiyi seçer.");
    return;
  }
  if (near.helped) {
    setMessage(`${near.name}: “Yolun açık olsun evladım. Gönül almayı bilenin izi yerde kalmaz.”`);
    return;
  }

  const need = npcNeed(near.id);
  if (!need.ready) {
    setMessage(`${near.name}: “${near.line}” ${need.message}`);
    return;
  }

  near.helped = true;
  progress.helped += 1;
  progress.honor = clamp(progress.honor + 8, 0, 100);
  const replies = {
    guest: "Misafir sofraya oturdu. Bir lokmayı paylaşınca hem karın doyar hem gönül.",
    child: "Küçüğün yüzü güldü. Alp olmak, zayıfı korkutmak değil, ona güven vermektir.",
    elder: "Büyüğün duası alındı. Söz kulağa değil, davranışa yazılınca töre yaşar.",
  };
  setMessage(`${near.name}: “Allah razı olsun evladım.” ${replies[near.id]}`);
  updateHud();
}

function nearestNpc() {
  const playerCenter = center(player);
  return level.npcs
    .map((npc) => ({ npc, distance: Math.abs(playerCenter.x - npc.x) }))
    .filter((entry) => entry.distance <= interactionRange)
    .sort((a, b) => a.distance - b.distance)[0]?.npc;
}

function nearestHorse() {
  const playerCenter = center(player);
  return level.horses
    .map((horse) => ({ horse, distance: Math.abs(playerCenter.x - (horse.x + horse.w / 2)) }))
    .filter((entry) => entry.distance <= interactionRange)
    .sort((a, b) => a.distance - b.distance)[0]?.horse;
}

function updateEnemies(dt) {
  level.enemies.forEach((enemy) => {
    if (enemy.defeated) return;
    enemy.x += enemy.vx * dt;
    if (enemy.x < enemy.baseX - enemy.patrol || enemy.x > enemy.baseX + enemy.patrol) {
      enemy.vx *= -1;
      enemy.x = clamp(enemy.x, enemy.baseX - enemy.patrol, enemy.baseX + enemy.patrol);
    }
  });
}

function checkEnemies() {
  level.enemies.forEach((enemy) => {
    if (enemy.defeated || !intersects(player, enemy)) return;
    const playerFeet = player.y + player.h;
    const landedOnEnemy = player.vy > 0 && playerFeet < enemy.y + 18;
    const hasUpperHand = player.poweredUntil > performance.now() || player.mounted;
    if (landedOnEnemy || hasUpperHand) {
      defeatEnemy(enemy, landedOnEnemy ? "Üstüne temiz bastın. Yol kesen dağıldı; cesaret kaba güç değil, doğru zamanda ölçüdür." : "Gücünü ölçülü kullandın. Yol açıldı, itibarın arttı.");
      if (landedOnEnemy) player.vy = -8.5;
      return;
    }
    respawn("Yol kesen hazırlıksız yakaladı. Pirzola güç verir, at cesaret ister; tekrar dene.");
  });
}

function defeatEnemy(enemy, text) {
  enemy.defeated = true;
  progress.enemies += 1;
  progress.honor = clamp(progress.honor + 6, 0, 100);
  addFloatingText(enemy.x + enemy.w / 2, enemy.y - 20, "+İtibar");
  setMessage(text);
  updateHud();
}

function unlockHorses() {
  const ready = progress.enemies > 0;
  level.horses.forEach((horse) => {
    if (horse.unlocked || !ready) return;
    horse.unlocked = true;
    setMessage("Yol güven verdi. At artık sana yakın duruyor; yanına gelince E ile binebilirsin.");
  });
}

function npcNeed(id) {
  if (id === "guest") {
    const needed = Math.ceil(level.foodNeed / 2);
    return {
      ready: progress.food >= needed,
      message: `Misafirin gönlü boş sözle değil, paylaşılan lokmayla ısınır. En az ${needed} azık getir.`,
    };
  }
  if (id === "child") {
    const needed = Math.ceil(level.tokenNeed / 2);
    return {
      ready: progress.token >= needed,
      message: `Küçükler emanetle büyür; onlara güven vermek için en az ${needed} emanet parçası öğrenerek topla.`,
    };
  }
  return {
    ready: level.npcs.some((npc) => npc.id === "guest" && npc.helped) && level.npcs.some((npc) => npc.id === "child" && npc.helped),
    message: "Önce sofrayı kur, sonra küçüğün gönlünü al. Büyüğün sözü o zaman tamam olur.",
  };
}

function collectItems() {
  level.items.forEach((item) => {
    if (item.taken) return;
    if (item.retryAt && performance.now() < item.retryAt) return;
    const box = { x: item.x - 18, y: item.y - 18, w: 36, h: 36 };
    if (!intersects(player, box)) return;
    if (item.kind === "token") {
      openQuiz(item);
      return;
    }
    if (item.kind === "meat") {
      item.taken = true;
      player.poweredUntil = performance.now() + 8500;
      progress.stamina = 100;
      progress.honor = clamp(progress.honor + 3, 0, 100);
      feedbackFlash = 18;
      addFloatingText(item.x, item.y - 18, "Güçlendi");
      setMessage("Pirzola alındı. Sofrada güç buldun; şimdi yol kesene karşı daha dirençlisin.");
      updateHud();
      return;
    }
    item.taken = true;
    progress[item.kind] += 1;
    progress.honor = clamp(progress.honor + (item.kind === "food" ? 1 : 2), 0, 100);
    setMessage(item.kind === "food" ? "Azık toplandı. Sofra paylaştıkça bereketlenir." : "Emanet parçası bulundu. Söz, dikkatle korunur.");
    updateHud();
  });
}

function openQuiz(item) {
  if (pendingQuizItem) return;
  pendingQuizItem = item;
  running = false;
  keys.clear();
  player.vx = 0;
  const quiz = quizQuestions[item.quizIndex];
  ui.quizQuestion.textContent = quiz.question;
  ui.quizAnswers.innerHTML = quiz.answers
    .map((answer, index) => `<button type="button" data-answer="${index}">${index + 1}. ${answer}</button>`)
    .join("");
  ui.quizModal.classList.remove("hidden");
  setMessage("Emaneti almak için suali cevapla. Doğru cevap altını sana kazandırır.");
}

function answerQuiz(answerIndex) {
  if (!pendingQuizItem) return;
  const item = pendingQuizItem;
  const quiz = quizQuestions[item.quizIndex];
  const correct = answerIndex === quiz.correct;
  ui.quizModal.classList.add("hidden");
  pendingQuizItem = null;

  if (correct) {
    item.taken = true;
    progress.token += 1;
    progress.honor = clamp(progress.honor + 6, 0, 100);
    progress.stamina = clamp(progress.stamina + 12, 0, 100);
    feedbackFlash = 20;
    addFloatingText(item.x, item.y - 22, "+Emanet");
    setMessage("Doğru söyledin yiğidim. Emanet bilgiyle alınır, sözle korunur; oba sana biraz daha güvendi.");
    updateHud();
  } else {
    item.retryAt = performance.now() + 1200;
    progress.honor = clamp(progress.honor - 3, 0, 100);
    setMessage("Bu cevap içimize sinmedi. Töre ezber değil, gönül işidir; düşün, bir nefes sonra yine dene.");
    updateHud();
  }

  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function checkHazards() {
  level.hazards.forEach((hazard) => {
    if (!intersects(player, hazard)) return;
    if (player.mounted || player.poweredUntil > performance.now()) return;
    respawn("Taşlı geçide dikkat. Hız kadar ölçü de gerekir.");
  });
}

function checkGoal() {
  if (!intersects(player, level.goal) || progress.finished) return;
  if (progress.food >= level.foodNeed && progress.token >= level.tokenNeed && progress.helped >= level.npcs.length && progress.enemies >= level.enemies.length) {
    progress.finished = true;
    updateHud();
    if (activeLevel < levelDefs.length - 1) {
      running = false;
      const next = levelDefs[activeLevel + 1];
      showRewardCeremony({
        title: `${level.badge} Kazanıldı`,
        text: `Oba seni gördü, sözünü tuttuğunu bildi. Sıradaki yol açıldı: ${next.name}.`,
        final: false,
      });
      ui.startBtn.textContent = "Sonraki Bölüm";
      ui.overlay.classList.remove("hidden");
    } else {
      running = false;
      showRewardCeremony({
        title: "Obanın Kalbi Seninle Attı",
        text: "Üç yolu da tamamladın. Misafire ikram, küçüğe sevgi, büyüğe saygı ve emanete sadakat obayı ayakta tuttu.",
        final: true,
      });
      ui.startBtn.textContent = "Baştan Oyna";
      ui.overlay.classList.remove("hidden");
    }
    return;
  }
  setMessage("Sancağa geçmeden önce azığı, emaneti, yardımı ve yol güvenliğini tamamla.");
}

function showRewardCeremony({ title, text, final }) {
  const reward = calculateReward(final);
  ui.overlay.classList.add("celebration");
  ui.chapterKicker.textContent = final ? "Büyük Toy" : `Bölüm ${activeLevel + 1} Ödülü`;
  ui.overlay.querySelector("h2").textContent = title;
  ui.overlay.querySelector("p").textContent = text;
  ui.rewardPanel.innerHTML = `
    <div class="reward-seal">${final ? "OB" : activeLevel + 1}</div>
    <p class="reward-title">${reward.rank}</p>
    <div class="reward-stars" aria-label="${reward.stars} yıldız">${"★".repeat(reward.stars)}${"☆".repeat(5 - reward.stars)}</div>
    <div class="reward-grid">
      <div><span>Azık</span><strong>${progress.food}/${level.foodNeed}</strong></div>
      <div><span>Emanet</span><strong>${progress.token}/${level.tokenNeed}</strong></div>
      <div><span>Yardım</span><strong>${progress.helped}/${level.npcs.length}</strong></div>
      <div><span>Yol</span><strong>${progress.enemies}/${level.enemies.length}</strong></div>
    </div>
    <p class="reward-callout">${reward.callout}</p>
  `;
  ui.rewardPanel.classList.remove("hidden");
  feedbackFlash = 34;
}

function calculateReward(final) {
  const stars = clamp(
    1 +
      Number(progress.food >= level.foodNeed) +
      Number(progress.token >= level.tokenNeed) +
      Number(progress.helped >= level.npcs.length) +
      Number(progress.enemies >= level.enemies.length) +
      Number(progress.honor >= 80),
    1,
    5,
  );
  if (final) {
    return {
      stars,
      rank: stars >= 5 ? "Oba Beylerinin Takdirini Aldın" : "Obanın Kalbini Uyandırdın",
      callout: stars >= 5
        ? "Toy meydanında adın iyilikle anıldı. Bu başarı sadece bitirmek değil, gönül kazanmak demek."
        : "Oba seni bağrına bastı. Bir daha oynadığında daha yüksek itibarla büyük takdiri alabilirsin.",
    };
  }
  const ranks = ["Yol Adayı", "Sözünü Tutan Alp", "Gönül Alan Alp", "Obanın Güvendiği Alp", "Toyda Adı Okunan Alp"];
  return {
    stars,
    rank: ranks[stars - 1],
    callout: stars >= 5
      ? "Eksiksiz bir yolculuk oldu. Misafir doydu, çocuk güldü, yol güvene kavuştu."
      : "Güzel ilerledin. Daha yüksek yıldız için itibarını yükseltip yoldaki tüm iyilikleri tamamla.",
  };
}

function respawn(text) {
  player.x = Math.max(60, player.x - 210);
  player.y = 360;
  player.vy = 0;
  progress.honor = clamp(progress.honor - 6, 0, 100);
  progress.stamina = clamp(progress.stamina - 18, 0, 100);
  setMessage(text);
  updateHud();
}

function collideX() {
  level.platforms.forEach((platform) => {
    if (platform.type === "ground" || !intersects(player, platform)) return;
    if (player.vx > 0) player.x = platform.x - player.w;
    if (player.vx < 0) player.x = platform.x + platform.w;
  });
}

function collideY() {
  player.grounded = false;
  level.platforms.forEach((platform) => {
    if (!intersects(player, platform)) return;
    if (player.vy > 0) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.grounded = true;
    } else if (player.vy < 0 && platform.type !== "ground") {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-cameraX, 0);
  drawSky();
  drawAtmosphere();
  drawWorld();
  drawHorses();
  drawItems();
  drawEnemies();
  drawNpcs();
  drawGoal();
  drawPlayer();
  drawFloatingText();
  ctx.restore();
  drawScreenGrade();
}

function drawSky() {
  const palettes = {
    day: ["#7ec5df", "#f4c778", "#8dbb69"],
    road: ["#6bb1d3", "#e8b66b", "#9b9861"],
    dusk: ["#475a83", "#c4815e", "#756a86"],
  };
  const p = palettes[level.theme];
  const gradient = ctx.createLinearGradient(0, 0, 0, world.ground);
  gradient.addColorStop(0, p[0]);
  gradient.addColorStop(0.58, p[1]);
  gradient.addColorStop(1, p[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(cameraX, 0, canvas.width, world.ground);
  drawCircle(cameraX + 870, 82, 42, level.theme === "dusk" ? "#ffd2a1" : "#ffe49d");
  drawMountain(cameraX * 0.36 - 260, 418, "#8b9b8b", 0.36);
  drawMountain(cameraX * 0.55, 438, "#6f8878", 0.62);
  drawMountain(cameraX * 0.72 + 520, 446, "#55715e", 0.82);
  drawCloud(cameraX + 170, 95);
  drawCloud(cameraX + 675, 64);
}

function drawAtmosphere() {
  drawMistBand(0, 438, "rgba(255, 244, 220, 0.16)");
  drawBirds();
}

function drawWorld() {
  drawTrail();
  for (let x = 130; x < world.width - 250; x += 650) {
    drawTent(x, 420 + (x % 3) * 4, 170, 116, x % 2 ? "#cf9d62" : "#d8b47d");
    if (x % 1300 === 130) drawFire(x + 230, 495);
  }
  drawEmbers();

  level.platforms.forEach((platform) => {
    if (platform.type === "ground") {
      ctx.fillStyle = "#6f8f4f";
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = "#4f6f3d";
      ctx.fillRect(platform.x, platform.y + 18, platform.w, platform.h - 18);
      return;
    }
    ctx.fillStyle = "#7c5538";
    roundRect(platform.x, platform.y, platform.w, platform.h, 8);
    ctx.fill();
    ctx.fillStyle = "#d6b17b";
    ctx.fillRect(platform.x + 10, platform.y + 4, platform.w - 20, 4);
  });

  level.hazards.forEach((hazard) => {
    for (let i = 0; i < 4; i += 1) {
      drawCircle(hazard.x + 14 + i * 18, hazard.y + 16 - (i % 2) * 7, 14, "#6e6a61");
    }
  });
}

function drawTrail() {
  ctx.fillStyle = level.theme === "dusk" ? "#7d6546" : "#9e8b5a";
  ctx.beginPath();
  ctx.moveTo(-60, world.ground + 46);
  for (let x = -60; x <= world.width + 140; x += 180) {
    const y = world.ground + 34 + Math.sin(x / 190) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(world.width + 160, world.ground + 84);
  ctx.lineTo(-60, world.ground + 84);
  ctx.closePath();
  ctx.globalAlpha = 0.34;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawMistBand(x, y, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 9; i += 1) {
    const offset = ((atmosphere.time * 7 + i * 280) % (world.width + 320)) - 160;
    roundRect(x + offset, y + Math.sin(i) * 18, 260, 24 + (i % 3) * 8, 18);
    ctx.fill();
  }
}

function drawBirds() {
  ctx.strokeStyle = level.theme === "dusk" ? "rgba(28,28,35,0.58)" : "rgba(36,50,48,0.54)";
  ctx.lineWidth = 3;
  atmosphere.birds.forEach((bird) => {
    const x = (bird.x + atmosphere.time * bird.speed * 18) % world.width;
    const flap = Math.sin(atmosphere.time * 0.18 + bird.x) * 6;
    ctx.beginPath();
    ctx.moveTo(x - 12 * bird.size, bird.y);
    ctx.quadraticCurveTo(x - 3 * bird.size, bird.y - 8 * bird.size - flap, x, bird.y);
    ctx.quadraticCurveTo(x + 8 * bird.size, bird.y - 8 * bird.size + flap, x + 18 * bird.size, bird.y + 2);
    ctx.stroke();
  });
}

function drawEmbers() {
  atmosphere.embers.forEach((ember) => {
    const y = ember.y - ((atmosphere.time * ember.drift + ember.phase) % 74);
    const alpha = 0.15 + Math.sin(atmosphere.time * 0.08 + ember.phase) * 0.08;
    drawCircle(ember.x, y, 1.5 + (ember.phase % 2), `rgba(255, 185, 79, ${alpha})`);
  });
}

function drawScreenGrade() {
  const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.48, 140, canvas.width / 2, canvas.height * 0.5, canvas.width * 0.72);
  vignette.addColorStop(0, "rgba(255,255,255,0)");
  vignette.addColorStop(1, "rgba(6,10,12,0.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(255, 238, 198, 0.08)";
  ctx.fillRect(0, 0, canvas.width, 62);
  if (feedbackFlash > 0) {
    ctx.fillStyle = `rgba(255, 223, 138, ${feedbackFlash / 95})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawItems() {
  level.items.forEach((item) => {
    if (item.taken) return;
    const bob = Math.sin(performance.now() / 280 + item.x) * 5;
    if (item.kind === "food") drawBread(item.x, item.y + bob);
    else if (item.kind === "meat") drawMeat(item.x, item.y + bob);
    else drawToken(item.x, item.y + bob);
  });
}

function drawEnemies() {
  level.enemies.forEach((enemy) => {
    if (enemy.defeated) return;
    ctx.save();
    const face = enemy.vx < 0 ? -1 : 1;
    ctx.translate(enemy.x + enemy.w / 2, enemy.y + enemy.h);
    ctx.scale(face, 1);
    ctx.fillStyle = "rgba(20, 12, 10, 0.22)";
    roundRect(-24, 2, 48, 8, 5);
    ctx.fill();
    ctx.fillStyle = "#4d2d28";
    roundRect(-18, -44, 36, 38, 10);
    ctx.fill();
    drawCircle(0, -58, 15, "#c69572");
    ctx.fillStyle = "#2b1a16";
    ctx.fillRect(-16, -73, 32, 13);
    ctx.fillStyle = "#31201b";
    ctx.fillRect(-25, -28, 9, 24);
    ctx.fillRect(16, -28, 9, 24);
    ctx.fillStyle = "#c88734";
    ctx.fillRect(18, -46, 28, 5);
    ctx.restore();
  });
}

function drawHorses() {
  level.horses.forEach((horse) => {
    if (player.mounted && horse.mounted) return;
    drawHorse(horse.x, horse.y, horse.unlocked);
    if (Math.abs(center(player).x - (horse.x + horse.w / 2)) < interactionRange) {
      ctx.fillStyle = horse.unlocked ? "#d99235" : "#806f5c";
      roundRect(horse.x + 34, horse.y - 96, 42, 28, 8);
      ctx.fill();
      ctx.fillStyle = "#fffaf0";
      ctx.font = "900 15px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("E", horse.x + 55, horse.y - 77);
    }
  });
}

function drawFloatingText() {
  atmosphere.floatingText.forEach((text) => {
    ctx.globalAlpha = clamp(text.life / 58, 0, 1);
    ctx.fillStyle = "#fff2c8";
    ctx.font = "900 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(text.text, text.x, text.y);
    ctx.globalAlpha = 1;
  });
}

function drawNpcs() {
  level.npcs.forEach((npc) => {
    drawCharacter(npc.x, npc.y, npc.color, 1, npc.id === "elder");
    ctx.fillStyle = npc.helped ? "rgba(232,255,223,0.94)" : "rgba(255,250,240,0.94)";
    roundRect(npc.x - 62, npc.y - 90, 124, 32, 8);
    ctx.fill();
    ctx.fillStyle = "#261914";
    ctx.font = "800 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(npc.name, npc.x, npc.y - 69);
    if (!npc.helped && Math.abs(center(player).x - npc.x) < interactionRange) {
      ctx.fillStyle = "#d99235";
      roundRect(npc.x - 18, npc.y - 128, 36, 28, 8);
      ctx.fill();
      ctx.fillStyle = "#fffaf0";
      ctx.font = "900 16px system-ui";
      ctx.fillText("E", npc.x, npc.y - 109);
    }
  });
}

function drawGoal() {
  const goal = level.goal;
  ctx.fillStyle = "#5b3828";
  ctx.fillRect(goal.x + 28, goal.y, 8, 138);
  ctx.fillStyle = "#a83c30";
  ctx.beginPath();
  ctx.moveTo(goal.x + 36, goal.y + 8);
  ctx.lineTo(goal.x + 104, goal.y + 22);
  ctx.lineTo(goal.x + 76, goal.y + 54);
  ctx.lineTo(goal.x + 104, goal.y + 84);
  ctx.lineTo(goal.x + 36, goal.y + 96);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff2c8";
  ctx.font = "900 16px system-ui";
  ctx.fillText("KAYI", goal.x + 64, goal.y + 58);
}

function drawPlayer() {
  const color = player.poweredUntil > performance.now() ? "#2d8f78" : "#1e7772";
  if (player.mounted) {
    ctx.save();
    ctx.translate(player.x + player.w / 2 - 45, player.y + player.h + 4);
    ctx.scale(player.face, 1);
    drawHorse(-8, 0, true);
    drawCharacter(46, -33, color, 1, false);
    ctx.restore();
    return;
  }
  drawCharacter(player.x + player.w / 2, player.y + player.h, color, player.face, false);
}

function drawCharacter(x, feetY, color, face, elder) {
  ctx.save();
  ctx.translate(x, feetY);
  ctx.scale(face, 1);
  ctx.fillStyle = "#36231a";
  ctx.fillRect(-15, -4, 8, 16);
  ctx.fillRect(7, -4, 8, 16);
  ctx.fillStyle = color;
  roundRect(-18, -54, 36, 46, 10);
  ctx.fill();
  ctx.fillStyle = "#e8b98d";
  drawCircle(0, -70, 17, "#e8b98d");
  ctx.fillStyle = elder ? "#f3eee4" : "#3b241b";
  ctx.fillRect(-17, -84, 34, 14);
  drawCircle(6, -72, 2.2, "#23160f");
  ctx.fillStyle = "#5b3828";
  ctx.fillRect(-23, -48, 8, 28);
  ctx.fillRect(15, -48, 8, 28);
  ctx.restore();
}

function drawTent(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#a83c30";
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 18);
  ctx.lineTo(x + w * 0.68, y + h);
  ctx.lineTo(x + w * 0.32, y + h);
  ctx.closePath();
  ctx.fill();
}

function drawFire(x, y) {
  ctx.fillStyle = "#5b3828";
  ctx.fillRect(x - 30, y + 26, 62, 9);
  ctx.fillStyle = "#f08a29";
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.quadraticCurveTo(x + 26, y - 4, x + 5, y + 24);
  ctx.quadraticCurveTo(x - 30, y + 2, x, y - 34);
  ctx.fill();
  ctx.fillStyle = "#ffd867";
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 18);
  ctx.quadraticCurveTo(x + 15, y + 2, x, y + 20);
  ctx.quadraticCurveTo(x - 14, y + 2, x + 4, y - 18);
  ctx.fill();
}

function drawHorse(x, y, unlocked = true) {
  ctx.fillStyle = unlocked ? "#5a3625" : "#514640";
  roundRect(x, y - 38, 92, 38, 18);
  ctx.fill();
  drawCircle(x + 93, y - 52, 21, unlocked ? "#5a3625" : "#514640");
  ctx.fillStyle = "#2c1a13";
  ctx.fillRect(x + 16, y - 6, 8, 28);
  ctx.fillRect(x + 66, y - 6, 8, 28);
  ctx.fillStyle = "#d8b36d";
  ctx.fillRect(x + 22, y - 45, 42, 7);
}

function drawBread(x, y) {
  ctx.fillStyle = "#c98635";
  roundRect(x - 17, y - 11, 34, 22, 12);
  ctx.fill();
  ctx.strokeStyle = "#8c5a24";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 6);
  ctx.lineTo(x - 2, y + 4);
  ctx.moveTo(x + 5, y - 7);
  ctx.lineTo(x + 11, y + 3);
  ctx.stroke();
}

function drawMeat(x, y) {
  ctx.fillStyle = "#fff2d8";
  drawCircle(x - 18, y + 2, 9, "#fff2d8");
  drawCircle(x + 18, y + 2, 9, "#fff2d8");
  ctx.fillRect(x - 18, y - 2, 36, 8);
  ctx.fillStyle = "#b94a3b";
  roundRect(x - 18, y - 16, 36, 28, 16);
  ctx.fill();
  ctx.fillStyle = "#f0a36b";
  roundRect(x - 8, y - 9, 16, 13, 8);
  ctx.fill();
}

function drawToken(x, y) {
  drawCircle(x, y, 17, "#d99235");
  ctx.strokeStyle = "#fff2c8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 7, y);
  ctx.lineTo(x, y - 8);
  ctx.lineTo(x + 7, y);
  ctx.lineTo(x, y + 8);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "#5b3828";
  ctx.font = "900 13px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("?", x, y + 5);
}

function drawMountain(offset, base, color, alpha) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(offset - 120, base);
  ctx.lineTo(offset + 160, 145);
  ctx.lineTo(offset + 430, base);
  ctx.lineTo(offset + 710, 185);
  ctx.lineTo(offset + 1020, base);
  ctx.lineTo(offset + 1380, 170);
  ctx.lineTo(offset + 1680, base);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawCloud(x, y) {
  drawCircle(x, y, 22, "rgba(255,255,255,0.72)");
  drawCircle(x + 24, y - 8, 28, "rgba(255,255,255,0.72)");
  drawCircle(x + 55, y, 22, "rgba(255,255,255,0.72)");
}

function drawCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function center(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createMusic() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.075;
  master.connect(context.destination);
  const melody = [220, 246.94, 293.66, 329.63, 392, 329.63, 293.66, 246.94, 196, 220, 246.94, 293.66];
  let step = 0;

  function tone(freq, start, duration, type, volume) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function drum(start) {
    tone(88, start, 0.16, "sine", 0.9);
    tone(132, start + 0.01, 0.09, "square", 0.12);
  }

  function play() {
    if (!musicOn) return;
    const now = context.currentTime;
    tone(melody[step % melody.length], now, 0.72, "triangle", 0.55);
    tone(melody[(step + 4) % melody.length] / 2, now, 0.8, "sine", 0.28);
    if (step % 2 === 0) drum(now);
    step += 1;
    window.setTimeout(play, step % 4 === 0 ? 520 : 300);
  }

  return { context, play };
}

function shuffleTracks() {
  for (let i = licensedTracks.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [licensedTracks[i], licensedTracks[j]] = [licensedTracks[j], licensedTracks[i]];
  }
}

function playLicensedPlaylist() {
  if (!trackAudio) {
    shuffleTracks();
    trackAudio = new Audio();
    trackAudio.volume = 0.45;
    trackAudio.addEventListener("ended", () => {
      trackIndex = (trackIndex + 1) % licensedTracks.length;
      playLicensedPlaylist();
    });
    trackAudio.addEventListener("error", () => {
      if (!musicOn) return;
      if (!audio) audio = createMusic();
      audio.context.resume().then(() => audio.play());
      setMessage("Suno müziği yüklenemedi. Şimdilik özgün oyun müziği çalıyor.");
    });
  }
  trackAudio.src = licensedTracks[trackIndex];
  trackAudio.play().catch(() => {
    if (!audio) audio = createMusic();
    audio.context.resume().then(() => audio.play());
  });
}

ui.startBtn.addEventListener("click", () => {
  if (progress.finished && activeLevel < levelDefs.length - 1) {
    loadLevel(activeLevel + 1);
  } else if (progress.finished && activeLevel === levelDefs.length - 1) {
    loadLevel(0);
  }
  startGame();
});

ui.restartBtn.addEventListener("click", () => {
  loadLevel(activeLevel);
  ui.overlay.classList.add("hidden");
  if (!running) {
    running = true;
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
});

ui.musicBtn.addEventListener("click", async () => {
  musicOn = !musicOn;
  ui.musicBtn.textContent = musicOn ? "Müziği Durdur" : "Müziği Başlat";
  if (musicOn) {
    playLicensedPlaylist();
    return;
  }
  if (trackAudio) {
    trackAudio.pause();
  }
  if (audio?.context?.state === "running") {
    await audio.context.suspend();
  }
});

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (pendingQuizItem) {
    if (["1", "2", "3"].includes(key)) answerQuiz(Number(key) - 1);
    return;
  }
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w", "e"].includes(key)) event.preventDefault();
  keys.add(key);
  if (key === "ArrowUp" || key === "w" || key === " ") jump();
  if (key === "e") act();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});

document.querySelectorAll("[data-hold]").forEach((button) => {
  const key = button.dataset.hold === "left" ? "ArrowLeft" : "ArrowRight";
  const release = () => keys.delete(key);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    keys.add(key);
  });
  button.addEventListener("pointerup", (event) => {
    event.preventDefault();
    release();
  });
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("pointerleave", release);
});

document.querySelector("[data-tap='jump']").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  jump();
});
document.querySelector("[data-tap='act']").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  act();
});
ui.quizAnswers.addEventListener("click", (event) => {
  const button = event.target.closest("[data-answer]");
  if (!button) return;
  answerQuiz(Number(button.dataset.answer));
});

loadLevel(0);
draw();
