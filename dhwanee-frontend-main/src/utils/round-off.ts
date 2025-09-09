export default function roundOff(n: number, p?: number): number {
    p = p === undefined ? 2 : p;
    return parseFloat(n.toFixed(p))
}