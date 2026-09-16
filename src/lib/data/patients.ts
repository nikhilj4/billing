import { Patient } from "../types";

const MALE_NAMES = [
  "Kempe", "Madhu", "Shivalinga", "Chethan", "Nandeesh", "Manjunath", "Rame", "Yogesh",
  "Basavaraju", "Shivaswamy", "Ningegowda", "Chandru", "Girish", "Lokesh", "Sidde",
  "Harish", "Bore", "Darshan", "Shivaraju", "Thimme", "Anand", "Prakash", "Ravikumar",
  "Somanna", "Mahadeva", "Puttaswamy", "Mallesh", "Jagadeesh", "Nanjegowda", "Vinay"
];

const FEMALE_NAMES = [
  "Gowramma", "Ningamma", "Channamma", "Bhagyamma", "Sowmya", "Shwetha", "Roopa",
  "Rathnamma", "Kavitha", "Manjula", "Sunitha", "Jayalakshmi", "Yashodha", "Mangala",
  "Vasantha", "Sahana", "Devamma", "Puttegowramma", "Shylaja", "Bharathi", "Mamatha",
  "Komala", "Rekha", "Pushpalatha", "Sumithra", "Shakunthala", "Prema", "Parvathamma",
  "Geetha", "Bhavya"
];

export const INITIAL_PATIENTS: Patient[] = [
  ...MALE_NAMES.map((name, index) => ({
    patientId: `PAT-M${String(index + 1).padStart(3, "0")}`,
    patientName: `${name} (Synthetic)`,
    gender: "Male" as const
  })),
  ...FEMALE_NAMES.map((name, index) => ({
    patientId: `PAT-F${String(index + 1).padStart(3, "0")}`,
    patientName: `${name} (Synthetic)`,
    gender: "Female" as const
  }))
];
