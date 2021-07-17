export class BaseError implements Error {

   name = 'BaseError';

   constructor(public message: string) { }

   toString(): string {
      return `${this.name}:${this.message}`;
   }

}

export class SettingsError extends BaseError {

   name = 'SettingsError';

   private constructor(message: string, public configNames: string[]) {
      super(message);
   }

   static UndefinedSettings(configNames: string[]): SettingsError {
      if (configNames.length === 0) return new SettingsError('未定義の設定があります.', []);
      return new SettingsError(`${configNames.join(', ')} が未定義です.`, configNames);
   }

}
