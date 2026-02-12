export type PersonType = "PF" | "PJ";

export const PERSON_TYPES: PersonType[] = ["PF", "PJ"];

export function isPersonType(value: string): value is PersonType {
  return PERSON_TYPES.includes(value as PersonType);
}
