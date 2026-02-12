import type { PersonType } from "./person-type.vo.js";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCPF(digits: string): boolean {
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]!, 10) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== parseInt(digits[9]!, 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]!, 10) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== parseInt(digits[10]!, 10)) return false;
  return true;
}

function isValidCNPJ(digits: string): boolean {
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]!, 10) * weights1[i]!;
  let check = sum % 11;
  check = check < 2 ? 0 : 11 - check;
  if (check !== parseInt(digits[12]!, 10)) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]!, 10) * weights2[i]!;
  check = sum % 11;
  check = check < 2 ? 0 : 11 - check;
  if (check !== parseInt(digits[13]!, 10)) return false;
  return true;
}

export class Document {
  private constructor(
    public readonly value: string,
    public readonly personType: PersonType,
  ) {}

  static create(value: string, personType: PersonType): Document {
    const digits = digitsOnly(value);
    if (personType === "PF") {
      if (digits.length !== 11) throw new Error("CPF deve ter 11 dígitos");
      if (!isValidCPF(digits)) throw new Error("CPF inválido");
    } else {
      if (digits.length !== 14) throw new Error("CNPJ deve ter 14 dígitos");
      if (!isValidCNPJ(digits)) throw new Error("CNPJ inválido");
    }
    return new Document(digits, personType);
  }

  get raw(): string {
    return this.value;
  }
}
