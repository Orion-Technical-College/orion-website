export class ConfigurationError extends Error {
  public readonly code = 'CONFIGURATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
