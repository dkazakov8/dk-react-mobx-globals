export function isDynamic(param: string): boolean {
  return param.startsWith(':');
}
