export const trimRequiredBookField = ({
  value: fieldInput,
}: {
  value: unknown;
}): unknown =>
  typeof fieldInput === 'string' ? fieldInput.trim() : fieldInput;

export const normalizeOptionalBookField = ({
  value: fieldInput,
}: {
  value: unknown;
}): unknown => {
  if (typeof fieldInput !== 'string') {
    return fieldInput;
  }
  const trimmedField = fieldInput.trim();
  return trimmedField || null;
};
