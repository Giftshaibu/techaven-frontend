export const guestPromptKey = "techaven:guest-prompt:v1";
export const setupReturnKey = "techaven:setup-return:v1";
export function excludesShoppingPrompt(path: string) {
  return /^\/(auth|help|privacy|terms)(\/|$)/.test(path) || path.startsWith("/account");
}
export function safeShoppingDestination(value: string) {
  return value.startsWith("/") &&
    !value.startsWith("//") &&
    ![...value].some((character) => character === "\\" || character.charCodeAt(0) <= 32)
    ? value
    : "/";
}
