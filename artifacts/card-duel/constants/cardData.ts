import { Card } from "./gameTypes";

export const CARD_DATABASE: Card[] = [
  // ── FIRE ──────────────────────────────────────────────────────────
  {
    id: "fire_001", name: "Embercub", type: "fire", rarity: "common",
    attack: 40, defense: 30, hp: 60, maxHp: 60,
    description: "A tiny fire cub that sneezes sparks when excited.",
    abilities: [
      { name: "Ember Scratch", damage: 20, cost: 1, description: "A quick fire-infused scratch." },
      { name: "Flame Burst", damage: 40, cost: 2, description: "Concentrated burst of flame." },
    ], packId: "starter",
  },
  {
    id: "fire_002", name: "Flamewolf", type: "fire", rarity: "uncommon",
    attack: 60, defense: 40, hp: 80, maxHp: 80,
    description: "A wolf whose mane is an eternal flame.",
    abilities: [
      { name: "Fire Fang", damage: 40, cost: 1, description: "Bites with blazing jaws." },
      { name: "Inferno Howl", damage: 70, cost: 3, description: "A howl that ignites everything nearby." },
    ], packId: "starter",
  },
  {
    id: "fire_003", name: "Infernodrake", type: "fire", rarity: "rare",
    attack: 80, defense: 50, hp: 100, maxHp: 100,
    description: "A fierce drake born in volcanic craters.",
    abilities: [
      { name: "Claw Slash", damage: 50, cost: 1, description: "Razor claws coated in lava." },
      { name: "Volcano Breath", damage: 90, cost: 3, description: "Exhales a torrent of molten rock." },
    ], packId: "fire_pack",
  },
  {
    id: "fire_004", name: "Pyrocat", type: "fire", rarity: "common",
    attack: 35, defense: 35, hp: 60, maxHp: 60,
    description: "A mischievous cat that plays with fire.",
    abilities: [
      { name: "Spark Swipe", damage: 20, cost: 1, description: "Fast paw strike with sparks." },
      { name: "Fire Ball", damage: 35, cost: 2, description: "Hurls a small fireball." },
    ], packId: "starter",
  },
  {
    id: "fire_005", name: "Ashgolem", type: "fire", rarity: "epic",
    attack: 100, defense: 80, hp: 130, maxHp: 130,
    description: "A massive construct forged from volcanic ash and fire.",
    abilities: [
      { name: "Lava Slam", damage: 80, cost: 2, description: "Crushes with a burning fist." },
      { name: "Eruption", damage: 120, cost: 4, description: "Full volcanic eruption from its core." },
    ], packId: "epic_pack",
  },
  {
    id: "fire_006", name: "Magmabear", type: "fire", rarity: "legendary",
    attack: 130, defense: 90, hp: 160, maxHp: 160,
    description: "An ancient bear whose body flows with magma.",
    abilities: [
      { name: "Magma Crush", damage: 100, cost: 2, description: "Overwhelming smash of molten force." },
      { name: "Infernal Roar", damage: 150, cost: 4, description: "Unleashes a legendary wave of fire." },
    ], packId: "legendary_pack",
  },
  // ── WATER ─────────────────────────────────────────────────────────
  {
    id: "water_001", name: "Wavepup", type: "water", rarity: "common",
    attack: 35, defense: 40, hp: 60, maxHp: 60,
    description: "A cheerful pup who rides ocean waves.",
    abilities: [
      { name: "Water Splash", damage: 20, cost: 1, description: "Splashes the foe with chilly water." },
      { name: "Bubble Shot", damage: 35, cost: 2, description: "Fires pressurized bubbles." },
    ], packId: "starter",
  },
  {
    id: "water_002", name: "Tidalfin", type: "water", rarity: "uncommon",
    attack: 55, defense: 55, hp: 90, maxHp: 90,
    description: "A graceful fish that commands the tides.",
    abilities: [
      { name: "Tide Strike", damage: 40, cost: 1, description: "A powerful wave-backed strike." },
      { name: "Whirlpool", damage: 65, cost: 3, description: "Traps foe in a spinning vortex." },
    ], packId: "water_pack",
  },
  {
    id: "water_003", name: "Glacioshark", type: "water", rarity: "rare",
    attack: 85, defense: 60, hp: 100, maxHp: 100,
    description: "A shark encased in an icy aura.",
    abilities: [
      { name: "Ice Bite", damage: 55, cost: 1, description: "Bites with frozen teeth." },
      { name: "Blizzard Charge", damage: 90, cost: 3, description: "Charges through a blizzard storm." },
    ], packId: "water_pack",
  },
  {
    id: "water_004", name: "Mistwhale", type: "water", rarity: "epic",
    attack: 95, defense: 85, hp: 140, maxHp: 140,
    description: "A colossal whale wreathed in magical mist.",
    abilities: [
      { name: "Mist Veil", damage: 60, cost: 2, description: "Obscures with magical fog." },
      { name: "Tidal Crush", damage: 110, cost: 4, description: "The weight of the ocean itself." },
    ], packId: "epic_pack",
  },
  {
    id: "water_005", name: "Deepleviathan", type: "water", rarity: "legendary",
    attack: 140, defense: 100, hp: 170, maxHp: 170,
    description: "The king of the deep abyss, rarely seen.",
    abilities: [
      { name: "Abyss Pull", damage: 110, cost: 2, description: "Drags foe into the deep." },
      { name: "Tidal Wave", damage: 160, cost: 5, description: "An unstoppable wall of water." },
    ], packId: "legendary_pack",
  },
  {
    id: "water_006", name: "Bubbleturt", type: "water", rarity: "common",
    attack: 30, defense: 50, hp: 70, maxHp: 70,
    description: "A turtle that hides inside a bubble shell.",
    abilities: [
      { name: "Bubble Guard", damage: 15, cost: 1, description: "Protective bubble shield bash." },
      { name: "Water Jet", damage: 30, cost: 2, description: "Fires a jet of water." },
    ], packId: "starter",
  },
  // ── GRASS ─────────────────────────────────────────────────────────
  {
    id: "grass_001", name: "Thornbud", type: "grass", rarity: "common",
    attack: 30, defense: 45, hp: 65, maxHp: 65,
    description: "A budding plant that protects itself with sharp thorns.",
    abilities: [
      { name: "Thorn Stab", damage: 20, cost: 1, description: "Pokes with a sharp thorn." },
      { name: "Petal Blade", damage: 35, cost: 2, description: "Hurls razor-sharp petals." },
    ], packId: "starter",
  },
  {
    id: "grass_002", name: "Leafstag", type: "grass", rarity: "uncommon",
    attack: 60, defense: 55, hp: 90, maxHp: 90,
    description: "A majestic stag with antlers made of living branches.",
    abilities: [
      { name: "Branch Thrust", damage: 40, cost: 1, description: "Thrusts antler branches forward." },
      { name: "Forest Charge", damage: 65, cost: 3, description: "Charges with the force of the forest." },
    ], packId: "grass_pack",
  },
  {
    id: "grass_003", name: "Fernserpent", type: "grass", rarity: "rare",
    attack: 75, defense: 65, hp: 110, maxHp: 110,
    description: "A serpent that blends perfectly into jungle foliage.",
    abilities: [
      { name: "Vine Coil", damage: 50, cost: 1, description: "Constricts with powerful vines." },
      { name: "Thorn Shower", damage: 85, cost: 3, description: "Rains down a barrage of thorns." },
    ], packId: "grass_pack",
  },
  {
    id: "grass_004", name: "Ancienttree", type: "grass", rarity: "epic",
    attack: 90, defense: 100, hp: 150, maxHp: 150,
    description: "A tree spirit that has lived for ten thousand years.",
    abilities: [
      { name: "Root Bind", damage: 70, cost: 2, description: "Immobilizes with ancient roots." },
      { name: "Nature Wrath", damage: 100, cost: 4, description: "Channels the fury of nature." },
    ], packId: "epic_pack",
  },
  {
    id: "grass_005", name: "Vinecreep", type: "grass", rarity: "common",
    attack: 35, defense: 35, hp: 60, maxHp: 60,
    description: "A creeping vine creature that grabs unsuspecting prey.",
    abilities: [
      { name: "Grab", damage: 20, cost: 1, description: "Grabs with thin vines." },
      { name: "Poison Spore", damage: 35, cost: 2, description: "Releases toxic spores." },
    ], packId: "starter",
  },
  // ── ELECTRIC ──────────────────────────────────────────────────────
  {
    id: "elec_001", name: "Sparkrat", type: "electric", rarity: "common",
    attack: 40, defense: 30, hp: 55, maxHp: 55,
    description: "A tiny rodent crackling with static electricity.",
    abilities: [
      { name: "Zap", damage: 25, cost: 1, description: "Quick electric shock." },
      { name: "Thunder Bolt", damage: 45, cost: 2, description: "Small lightning strike." },
    ], packId: "starter",
  },
  {
    id: "elec_002", name: "Bolthawk", type: "electric", rarity: "uncommon",
    attack: 70, defense: 40, hp: 80, maxHp: 80,
    description: "A hawk that dives like a lightning bolt.",
    abilities: [
      { name: "Static Dive", damage: 45, cost: 1, description: "Electric-charged diving attack." },
      { name: "Thunder Strike", damage: 70, cost: 3, description: "Strikes with lightning speed." },
    ], packId: "elec_pack",
  },
  {
    id: "elec_003", name: "Thunderlion", type: "electric", rarity: "rare",
    attack: 90, defense: 55, hp: 100, maxHp: 100,
    description: "A lion whose roar triggers thunderstorms.",
    abilities: [
      { name: "Electric Claw", damage: 60, cost: 1, description: "Rakes with electrified claws." },
      { name: "Storm Roar", damage: 95, cost: 3, description: "Calls down a storm with its roar." },
    ], packId: "elec_pack",
  },
  {
    id: "elec_004", name: "Stormeagle", type: "electric", rarity: "epic",
    attack: 110, defense: 65, hp: 120, maxHp: 120,
    description: "Commands the storm clouds from high above.",
    abilities: [
      { name: "Wind Slash", damage: 80, cost: 2, description: "Cuts with electrified wind." },
      { name: "Supercell", damage: 120, cost: 4, description: "Summons a devastating supercell." },
    ], packId: "epic_pack",
  },
  {
    id: "elec_005", name: "Cosmicthunder", type: "electric", rarity: "legendary",
    attack: 145, defense: 80, hp: 150, maxHp: 150,
    description: "A cosmic being made entirely of pure electricity.",
    abilities: [
      { name: "Cosmic Zap", damage: 115, cost: 2, description: "Cosmic-powered lightning." },
      { name: "Galactic Storm", damage: 155, cost: 5, description: "A galactic-scale lightning storm." },
    ], packId: "legendary_pack",
  },
  {
    id: "elec_006", name: "Voltbeetle", type: "electric", rarity: "common",
    attack: 35, defense: 40, hp: 60, maxHp: 60,
    description: "A beetle with a glowing electric shell.",
    abilities: [
      { name: "Shell Shock", damage: 20, cost: 1, description: "Electric shell slam." },
      { name: "Volt Beam", damage: 35, cost: 2, description: "Fires a beam of voltage." },
    ], packId: "starter",
  },
  // ── DARK ──────────────────────────────────────────────────────────
  {
    id: "dark_001", name: "Shadowfox", type: "dark", rarity: "common",
    attack: 45, defense: 30, hp: 60, maxHp: 60,
    description: "A fox that moves through shadows unseen.",
    abilities: [
      { name: "Shadow Strike", damage: 25, cost: 1, description: "Attacks from the shadows." },
      { name: "Dark Bite", damage: 40, cost: 2, description: "Bites with dark energy." },
    ], packId: "starter",
  },
  {
    id: "dark_002", name: "Voidbat", type: "dark", rarity: "uncommon",
    attack: 60, defense: 45, hp: 80, maxHp: 80,
    description: "A bat from the void dimension.",
    abilities: [
      { name: "Void Screech", damage: 40, cost: 1, description: "A screech from another dimension." },
      { name: "Dark Pulse", damage: 65, cost: 3, description: "Emits a dark energy pulse." },
    ], packId: "dark_pack",
  },
  {
    id: "dark_003", name: "Duskwraith", type: "dark", rarity: "rare",
    attack: 80, defense: 60, hp: 95, maxHp: 95,
    description: "A wraith that appears at dusk to steal life force.",
    abilities: [
      { name: "Soul Drain", damage: 55, cost: 1, description: "Drains the opponent's vitality." },
      { name: "Shadow Realm", damage: 90, cost: 3, description: "Pulls foe into the shadow realm." },
    ], packId: "dark_pack",
  },
  {
    id: "dark_004", name: "Abyssking", type: "dark", rarity: "epic",
    attack: 105, defense: 75, hp: 130, maxHp: 130,
    description: "The ruler of the darkest depths.",
    abilities: [
      { name: "Abyss Crush", damage: 85, cost: 2, description: "Crushes with dark matter." },
      { name: "Void Annihilation", damage: 115, cost: 4, description: "Erases using dark energy." },
    ], packId: "epic_pack",
  },
  {
    id: "dark_005", name: "Gloomspider", type: "dark", rarity: "common",
    attack: 38, defense: 38, hp: 60, maxHp: 60,
    description: "A spider that weaves webs of shadow.",
    abilities: [
      { name: "Shadow Web", damage: 20, cost: 1, description: "Traps foe in a shadow web." },
      { name: "Venom Bite", damage: 35, cost: 2, description: "Bites with shadow venom." },
    ], packId: "starter",
  },
  // ── METAL ─────────────────────────────────────────────────────────
  {
    id: "metal_001", name: "Ironhog", type: "metal", rarity: "common",
    attack: 35, defense: 55, hp: 70, maxHp: 70,
    description: "A tough hog with iron-plate skin.",
    abilities: [
      { name: "Iron Tackle", damage: 20, cost: 1, description: "Slams with iron body." },
      { name: "Steel Charge", damage: 35, cost: 2, description: "Charges with full metal force." },
    ], packId: "starter",
  },
  {
    id: "metal_002", name: "Steelwing", type: "metal", rarity: "uncommon",
    attack: 65, defense: 65, hp: 90, maxHp: 90,
    description: "A bird with wings sharp as surgical steel.",
    abilities: [
      { name: "Steel Feather", damage: 45, cost: 1, description: "Launches razor steel feathers." },
      { name: "Iron Wing", damage: 65, cost: 3, description: "Slices with an iron wing." },
    ], packId: "metal_pack",
  },
  {
    id: "metal_003", name: "Chromadino", type: "metal", rarity: "rare",
    attack: 80, defense: 80, hp: 110, maxHp: 110,
    description: "A dinosaur with chrome-plated scales.",
    abilities: [
      { name: "Chrome Bite", damage: 55, cost: 1, description: "Bites with chrome teeth." },
      { name: "Metal Crush", damage: 85, cost: 3, description: "Crushing blow of pure metal." },
    ], packId: "metal_pack",
  },
  {
    id: "metal_004", name: "Titanium", type: "metal", rarity: "epic",
    attack: 95, defense: 110, hp: 150, maxHp: 150,
    description: "A living titan of pure titanium.",
    abilities: [
      { name: "Titan Smash", damage: 80, cost: 2, description: "Smashes with titanium fist." },
      { name: "Impenetrable", damage: 95, cost: 4, description: "Reflects damage back amplified." },
    ], packId: "epic_pack",
  },
  {
    id: "metal_005", name: "Forgegod", type: "metal", rarity: "legendary",
    attack: 135, defense: 120, hp: 175, maxHp: 175,
    description: "The divine smith who forged the universe's metals.",
    abilities: [
      { name: "Forge Strike", damage: 105, cost: 2, description: "Hammers with divine force." },
      { name: "Cosmic Forge", damage: 150, cost: 5, description: "The power that forged stars." },
    ], packId: "legendary_pack",
  },
  {
    id: "metal_006", name: "Copperhead", type: "metal", rarity: "common",
    attack: 38, defense: 42, hp: 65, maxHp: 65,
    description: "A snake with a gleaming copper head.",
    abilities: [
      { name: "Copper Coil", damage: 20, cost: 1, description: "Coils around foe with copper scales." },
      { name: "Metal Fang", damage: 35, cost: 2, description: "Bites with metal fangs." },
    ], packId: "starter",
  },
  // ── COLORLESS ─────────────────────────────────────────────────────
  {
    id: "cless_001", name: "Windspirit", type: "colorless", rarity: "uncommon",
    attack: 55, defense: 50, hp: 85, maxHp: 85,
    description: "A spirit made of pure wind energy.",
    abilities: [
      { name: "Gust", damage: 35, cost: 1, description: "Blows foe with wind force." },
      { name: "Tornado Spin", damage: 60, cost: 3, description: "Wraps foe in a cyclone." },
    ], packId: "starter",
  },
  {
    id: "cless_002", name: "Crystaldragon", type: "colorless", rarity: "legendary",
    attack: 125, defense: 110, hp: 165, maxHp: 165,
    description: "A dragon whose body is made of living crystal.",
    abilities: [
      { name: "Crystal Claw", damage: 100, cost: 2, description: "Slashes with crystal-sharp claws." },
      { name: "Prismatic Breath", damage: 145, cost: 5, description: "Breath weapon of pure crystal energy." },
    ], packId: "legendary_pack",
  },
];

export const STARTER_CARD_IDS = [
  "fire_001", "fire_001", "fire_002",
  "water_001", "water_001", "water_002",
  "elec_001", "elec_001", "elec_002",
  "grass_001", "grass_001", "grass_002",
  "dark_001", "metal_001", "cless_001",
];

export const PACK_DEFINITIONS = {
  starter: { name: "Starter Pack", cost: 0, cardCount: 5, packId: "starter" },
  basic: { name: "Basic Pack", cost: 100, cardCount: 5, packId: "basic" },
  fire_pack: { name: "Flame Pack", cost: 200, cardCount: 5, packId: "fire_pack" },
  water_pack: { name: "Ocean Pack", cost: 200, cardCount: 5, packId: "water_pack" },
  elec_pack: { name: "Storm Pack", cost: 200, cardCount: 5, packId: "elec_pack" },
  grass_pack: { name: "Nature Pack", cost: 200, cardCount: 5, packId: "grass_pack" },
  dark_pack: { name: "Shadow Pack", cost: 200, cardCount: 5, packId: "dark_pack" },
  metal_pack: { name: "Steel Pack", cost: 200, cardCount: 5, packId: "metal_pack" },
  epic_pack: { name: "Epic Pack", cost: 500, cardCount: 5, packId: "epic_pack" },
  legendary_pack: { name: "Legendary Pack", cost: 1200, cardCount: 3, packId: "legendary_pack" },
} as const;

export function getCardById(id: string): Card | undefined {
  return CARD_DATABASE.find(c => c.id === id);
}

export function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    fire: "#FF6B35", water: "#3B82F6", grass: "#22C55E",
    electric: "#EAB308", dark: "#7C3AED", metal: "#9CA3AF", colorless: "#6B7280",
  };
  return map[type] ?? "#6B7280";
}

export function getRarityColor(rarity: string): string {
  const map: Record<string, string> = {
    common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6",
    epic: "#7C3AED", legendary: "#FFD700",
  };
  return map[rarity] ?? "#9CA3AF";
}

export function getRarityStars(rarity: string): number {
  const map: Record<string, number> = {
    common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5,
  };
  return map[rarity] ?? 1;
}

export function generatePack(packId: string, count = 5): Card[] {
  const pool = packId === "epic_pack"
    ? CARD_DATABASE.filter(c => ["epic", "legendary"].includes(c.rarity))
    : packId === "legendary_pack"
    ? CARD_DATABASE.filter(c => c.rarity === "legendary")
    : packId === "starter" || packId === "basic"
    ? CARD_DATABASE.filter(c => ["common", "uncommon"].includes(c.rarity))
    : CARD_DATABASE.filter(c => c.packId === packId || ["common", "uncommon"].includes(c.rarity));

  const safePool = pool.length > 0 ? pool : CARD_DATABASE;
  const result: Card[] = [];
  for (let i = 0; i < count; i++) {
    result.push(safePool[Math.floor(Math.random() * safePool.length)]);
  }
  return result;
}
