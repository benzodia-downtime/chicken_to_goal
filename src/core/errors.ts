export class UnsolvableBoardError extends Error {
  constructor(message = "Failed to generate a solvable board layout.") {
    super(message);
    this.name = "UnsolvableBoardError";
  }
}
