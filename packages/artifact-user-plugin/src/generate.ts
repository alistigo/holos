import * as jdenticon from "jdenticon";
import type { User } from "./user.js";

const ADJECTIVES = [
  "Brave", "Bright", "Calm", "Clever", "Cool", "Daring", "Deft", "Epic",
  "Fast", "Fierce", "Frosty", "Gentle", "Grand", "Happy", "Keen", "Kind",
  "Lively", "Lucky", "Mighty", "Noble", "Quick", "Quiet", "Radiant", "Sharp",
  "Sleek", "Smart", "Solar", "Spry", "Swift", "Vivid", "Wild", "Wise",
];

const ANIMALS = [
  "Bear", "Bison", "Boar", "Crane", "Crow", "Deer", "Eagle", "Falcon",
  "Fox", "Hawk", "Heron", "Ibis", "Jaguar", "Kite", "Kiwi", "Lynx",
  "Mink", "Moose", "Orca", "Otter", "Panda", "Puma", "Raven", "Robin",
  "Seal", "Shark", "Skunk", "Swan", "Tiger", "Viper", "Wolf", "Wren",
];

function simpleHash(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    // djb2: h = ((h << 5) + h) ^ char
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h & 0x7fffffff; // keep positive 31-bit
  }
  return h;
}

export function generateAvatar(seed: string): string {
  const svg = jdenticon.toSvg(seed, 50);
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function generatePseudo(seed: string): string {
  const hash = simpleHash(seed);
  const adj = ADJECTIVES[hash % ADJECTIVES.length] ?? "Bold";
  const animal = ANIMALS[((hash >> 8) & 0x7fffffff) % ANIMALS.length] ?? "Fox";
  const num = String(((hash >> 16) & 0x7fffffff) % 90 + 10);
  return `${adj}${animal}${num}`;
}

export function generateDefaultUser(): User {
  const id = crypto.randomUUID();
  return {
    id,
    pseudo: generatePseudo(id),
    avatar: generateAvatar(id),
  };
}
