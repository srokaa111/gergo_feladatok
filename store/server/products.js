export const products = [
  // --- IMPLANTS (Cyberware) ---
  { id: 1, name: "Neural Link v2.1", category: "Implant", basePrice: 4500, currentPrice: 4500, stock: 5 },
  { id: 2, name: "Bionic Eye (Night Vision)", category: "Implant", basePrice: 3200, currentPrice: 3200, stock: 8 },
  { id: 3, name: "Mantis Blades (Arm Module)", category: "Implant", basePrice: 12500, currentPrice: 12500, stock: 3 },
  { id: 4, name: "Titanium Skeleton Reinforcement", category: "Implant", basePrice: 8900, currentPrice: 8900, stock: 4 },
  { id: 5, name: "Synthetic Lung v4", category: "Implant", basePrice: 6200, currentPrice: 6200, stock: 6 },
  { id: 6, name: "Subdermal Armor", category: "Implant", basePrice: 7500, currentPrice: 7500, stock: 5 },
  { id: 7, name: "Keratin Reflex Booster", category: "Implant", basePrice: 4100, currentPrice: 4100, stock: 9 },
  { id: 8, name: "Monowire Fiber", category: "Implant", basePrice: 11000, currentPrice: 11000, stock: 2 },
  { id: 9, name: "Gorilla Arms (Strength Module)", category: "Implant", basePrice: 13200, currentPrice: 13200, stock: 3 },
  { id: 10, name: "Adrenaline Forge (Heart Module)", category: "Implant", basePrice: 5800, currentPrice: 5800, stock: 7 },

  // --- SOFTWARE AND HACKER TOOLS (Netrunning) ---
  { id: 11, name: "ICEbreaker Malicious Code", category: "Software", basePrice: 800, currentPrice: 800, stock: 12 },
  { id: 12, name: "Hacker Deck (Sandevistan)", category: "Software", basePrice: 9500, currentPrice: 9500, stock: 3 },
  { id: 13, name: "Daemon: Black-Out v2", category: "Software", basePrice: 1200, currentPrice: 1200, stock: 15 },
  { id: 14, name: "Netwatch Firewall License", category: "Software", basePrice: 3500, currentPrice: 3500, stock: 6 },
  { id: 15, name: "Overheat Exploit Script", category: "Software", basePrice: 650, currentPrice: 650, stock: 20 },
  { id: 16, name: "Memory Wipe Protocol", category: "Software", basePrice: 1800, currentPrice: 1800, stock: 10 },
  { id: 17, name: "Cyberpsychosis Virus Strain", category: "Software", basePrice: 16500, currentPrice: 16500, stock: 1 },
  { id: 18, name: "Arasaka Base Layer Code", category: "Software", basePrice: 5200, currentPrice: 5200, stock: 4 },
  { id: 19, name: "Ping Network Scanner", category: "Software", basePrice: 300, currentPrice: 300, stock: 30 },
  { id: 20, name: "System Reset Trojan", category: "Software", basePrice: 2400, currentPrice: 2400, stock: 8 },

  // --- ILLEGAL DATA AND INFO (Data) ---
  { id: 21, name: "Military Data Drive", category: "Data", basePrice: 15000, currentPrice: 15000, stock: 2 },
  { id: 22, name: "Militech Prototype Blueprint", category: "Data", basePrice: 22000, currentPrice: 22000, stock: 1 },
  { id: 23, name: "Corporate Executive Blackmail Material", category: "Data", basePrice: 8500, currentPrice: 8500, stock: 4 },
  { id: 24, name: "Trauma Team Customer List", category: "Data", basePrice: 4300, currentPrice: 4300, stock: 7 },
  { id: 25, name: "Orbital Air Access Codes", category: "Data", basePrice: 11500, currentPrice: 11500, stock: 3 },
  { id: 26, name: "Fixer Network Contact List", category: "Data", basePrice: 2100, currentPrice: 2100, stock: 11 },
  { id: 27, name: "AI Core Code Fragment", category: "Data", basePrice: 31000, currentPrice: 31000, stock: 1 },

  // --- MEDICAL AND CHEMICAL ITEMS (Bioware / Chems) ---
  { id: 28, name: "Nano-Healing Serum", category: "Health", basePrice: 600, currentPrice: 600, stock: 25 },
  { id: 29, name: "MaxDoc Hypo Spray", category: "Health", basePrice: 250, currentPrice: 250, stock: 40 },
  { id: 30, name: "Reflex Booster (Glitter)", category: "Health", basePrice: 450, currentPrice: 450, stock: 18 },
  { id: 31, name: "Synthetic Blood Plasma", category: "Health", basePrice: 800, currentPrice: 800, stock: 14 },
  { id: 32, name: "Neuro-Stabilizer Tablet", category: "Health", basePrice: 150, currentPrice: 150, stock: 50 },
  { id: 33, name: "Immuno-Suppressant Cocktail", category: "Health", basePrice: 1100, currentPrice: 1100, stock: 10 },

  // --- HARDWARE AND WEAPONS (Gear) ---
  { id: 34, name: "Kang Tao Smart Pistol", category: "Weapon", basePrice: 5500, currentPrice: 5500, stock: 5 },
  { id: 35, name: "Malorian Arms Revolver", category: "Weapon", basePrice: 18500, currentPrice: 18500, stock: 2 },
  { id: 36, name: "EMG Electromagnetic Rifle", category: "Weapon", basePrice: 14000, currentPrice: 14000, stock: 3 },
  { id: 37, name: "Thermal Katana", category: "Weapon", basePrice: 6800, currentPrice: 6800, stock: 6 },
  { id: 38, name: "EMP Grenade Pack (5 pcs)", category: "Weapon", basePrice: 1200, currentPrice: 1200, stock: 12 },
  { id: 39, name: "Cyber-Disruptor Vest", category: "Weapon", basePrice: 4900, currentPrice: 4900, stock: 8 },

  // --- LUXURY AND VEHICLES (High-End) ---
  { id: 40, name: "Quadra Turbo-R Car", category: "Vehicle", basePrice: 58000, currentPrice: 58000, stock: 1 },
  { id: 41, name: "Yaiba Kusanagi Motorcycle", category: "Vehicle", basePrice: 24000, currentPrice: 24000, stock: 2 },
  { id: 42, name: "Brennan Apollo (Off-Road)", category: "Vehicle", basePrice: 16500, currentPrice: 16500, stock: 3 },
  { id: 43, name: "Militech Armored SUV", category: "Vehicle", basePrice: 85000, currentPrice: 85000, stock: 1 },
  { id: 44, name: "Corporate Suit (Bulletproof)", category: "Luxury", basePrice: 9000, currentPrice: 9000, stock: 4 },
  { id: 45, name: "Neon-Design Luxury Watch", category: "Luxury", basePrice: 3500, currentPrice: 3500, stock: 10 },
  { id: 46, name: "Premium Apartment Key (Watson)", category: "Luxury", basePrice: 75000, currentPrice: 75000, stock: 1 },
  { id: 47, name: "Trauma Team Platinum Card", category: "Luxury", basePrice: 45000, currentPrice: 45000, stock: 2 },
  { id: 48, name: "Synthetic Caviar Cans", category: "Luxury", basePrice: 1400, currentPrice: 1400, stock: 15 },
  { id: 49, name: "Gold-Plated Cyber Fingers", category: "Luxury", basePrice: 8000, currentPrice: 8000, stock: 3 },
  { id: 50, name: "Holographic Pet Projector", category: "Luxury", basePrice: 2800, currentPrice: 2800, stock: 8 }
];