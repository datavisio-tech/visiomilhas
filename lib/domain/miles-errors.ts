export class InsufficientMilesBalanceError extends Error {
  constructor(message = "Insufficient miles balance") {
    super(message);
    this.name = "InsufficientMilesBalanceError";
  }
}

export class InvalidMilesOperationError extends Error {
  constructor(message = "Invalid miles operation") {
    super(message);
    this.name = "InvalidMilesOperationError";
  }
}

export class InvalidTransferError extends Error {
  constructor(message = "Invalid transfer") {
    super(message);
    this.name = "InvalidTransferError";
  }
}

export class InvalidCostCalculationError extends Error {
  constructor(message = "Invalid cost calculation") {
    super(message);
    this.name = "InvalidCostCalculationError";
  }
}
