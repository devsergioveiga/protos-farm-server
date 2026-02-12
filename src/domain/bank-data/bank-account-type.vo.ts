export type BankAccountType =
  | "CONTA_CORRENTE"
  | "CONTA_POUPANCA"
  | "CONTA_INVESTIMENTO";

export const BANK_ACCOUNT_TYPES: BankAccountType[] = [
  "CONTA_CORRENTE",
  "CONTA_POUPANCA",
  "CONTA_INVESTIMENTO",
];

export function isBankAccountType(
  value: string,
): value is BankAccountType {
  return (
    BANK_ACCOUNT_TYPES as readonly string[]
  ).includes(value);
}
