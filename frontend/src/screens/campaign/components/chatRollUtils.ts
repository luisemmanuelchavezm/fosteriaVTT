export interface RollMessageData {
  __type: "roll";
  title: string;
  expression?: string;
  diceValues: number[];
  modifier: number;
  total: number;
  struck?: boolean;
}

export function serializeRollMessage(
  title: string,
  diceValues: number[],
  modifier: number,
  total: number,
  struck?: boolean,
  expression?: string,
): string {
  const data: RollMessageData = {
    __type: "roll",
    title,
    diceValues,
    modifier,
    total,
  };
  if (struck) data.struck = true;
  if (expression) data.expression = expression;
  return JSON.stringify(data);
}

export function parseRollMessage(mensaje: string): RollMessageData | null {
  if (!mensaje.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(mensaje) as Partial<RollMessageData>;
    if (parsed.__type !== "roll") return null;
    if (typeof parsed.title !== "string") return null;
    if (!Array.isArray(parsed.diceValues)) return null;
    if (typeof parsed.modifier !== "number") return null;
    if (typeof parsed.total !== "number") return null;
    return {
      __type: "roll",
      title: parsed.title,
      expression:
        typeof parsed.expression === "string" ? parsed.expression : undefined,
      diceValues: parsed.diceValues as number[],
      modifier: parsed.modifier,
      total: parsed.total,
      struck: parsed.struck === true,
    };
  } catch {
    return null;
  }
}
