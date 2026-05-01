export const readableContentStyle = {
  fontFamily: 'Georgia, "Times New Roman", serif',
};

export function renderInlineFormattedText(text: string, keyPrefix: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={`${keyPrefix}-bold-${index}`}
            className="font-semibold text-sky-100"
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      return <span key={`${keyPrefix}-text-${index}`}>{part}</span>;
    });
}

export function renderSkillDescription(description: string, skillId: number) {
  const blocks = description
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, blockIndex) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const isList = lines.every((line) => line.startsWith("* "));

    if (isList) {
      return (
        <ul key={`${skillId}-list-${blockIndex}`} className="space-y-2">
          {lines.map((line, lineIndex) => (
            <li
              key={`${skillId}-item-${blockIndex}-${lineIndex}`}
              className="flex gap-2"
            >
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
              <span>
                {renderInlineFormattedText(
                  line.slice(2),
                  `${skillId}-${blockIndex}-${lineIndex}`,
                )}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`${skillId}-paragraph-${blockIndex}`}>
        {renderInlineFormattedText(block, `${skillId}-${blockIndex}`)}
      </p>
    );
  });
}
