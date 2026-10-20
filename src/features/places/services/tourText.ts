/** TourAPI descriptions contain HTML. Display text without executing markup. */
export function tourText(value: string | null): string | null {
  if (!value) return null;
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };
  return (
    value
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<br\s*\/?\s*>|<\/(p|div|li)\s*>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity: string) => {
        if (!entity.startsWith('#')) return named[entity.toLowerCase()] ?? match;
        const point =
          entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
        return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
          ? String.fromCodePoint(point)
          : '';
      })
      .trim() || null
  );
}
