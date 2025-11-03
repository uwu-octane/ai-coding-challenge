import { db } from "./sqlite";
import { Faqs } from "./schema";

export type FaqItem = { id: string; question: string; answer: string };

export type FaqJson = {
  technical: FaqItem[];
  billing: FaqItem[];
  general: FaqItem[];
};

export type FaqRow = {
  id: number;
  question: string;
  answer: string;
  tags: string | null;
  embedding: Buffer | Uint8Array | null;
};

export type RetrievedFaq = {
  id: number;
  question: string;
  answer: string;
  // category
  tags?: string | null;
  // similarity score
  score: number;
};

// Utils

// Float32Array -> Buffer
export function f32ToBuffer(f32: Float32Array): Buffer {
  return Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength);
}

export function toContent(q: string, a: string): string {
  return `Q: ${q}\n\nA: ${a}`;
}

// Buffer/Uint8Array -> Float32Array
export function toF32(vec: Buffer | Uint8Array): Float32Array {
  let u8: Uint8Array;
  if (vec instanceof Uint8Array && !Buffer.isBuffer(vec)) {
    u8 = vec;
  } else {
    const buff = vec as Buffer;
    u8 = new Uint8Array(buff.buffer, buff.byteOffset, buff.byteLength);
  }
  return new Float32Array(
    u8.buffer,
    u8.byteOffset,
    Math.floor(u8.byteLength / 4)
  );
}

// calculate cosine similarity
export function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = a.length;
  for (let i = 0; i < len; i++) {
    const ai = a[i];
    const bi = b[i];
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function getAllFaqs(): FaqRow[] {
  return db.select().from(Faqs).all() as FaqRow[];
}
