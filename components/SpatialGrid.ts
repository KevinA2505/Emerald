export interface SpatialItem {
  position: [number, number, number];
  radius: number;
}

export class SpatialGrid<T extends SpatialItem> {
  private cellSize: number;
  private cells: Map<string, T[]>;
  readonly maxItemRadius: number;

  constructor(items: T[], cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
    this.maxItemRadius = items.reduce((max, item) => Math.max(max, item.radius), 0);
    items.forEach((item) => this.insert(item));
  }

  private getCellCoords(x: number, z: number): [number, number] {
    return [Math.floor(x / this.cellSize), Math.floor(z / this.cellSize)];
  }

  private getCellKey(cellX: number, cellZ: number): string {
    return `${cellX},${cellZ}`;
  }

  private insert(item: T) {
    const [cellX, cellZ] = this.getCellCoords(item.position[0], item.position[2]);
    const key = this.getCellKey(cellX, cellZ);
    const bucket = this.cells.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      this.cells.set(key, [item]);
    }
  }

  query(x: number, z: number, radius: number): T[] {
    const searchRadius = radius + this.maxItemRadius;
    const minCellX = Math.floor((x - searchRadius) / this.cellSize);
    const maxCellX = Math.floor((x + searchRadius) / this.cellSize);
    const minCellZ = Math.floor((z - searchRadius) / this.cellSize);
    const maxCellZ = Math.floor((z + searchRadius) / this.cellSize);
    const results: T[] = [];

    for (let cx = minCellX; cx <= maxCellX; cx += 1) {
      for (let cz = minCellZ; cz <= maxCellZ; cz += 1) {
        const bucket = this.cells.get(this.getCellKey(cx, cz));
        if (bucket) results.push(...bucket);
      }
    }

    return results;
  }
}
