export class BaseError implements Error {

   name = 'BaseError';

   constructor(public message: string) { }

   toString(): string {
      return `${this.name}:${this.message}`;
   }

}

export class SettingsError extends BaseError {

   name = 'SettingsError';

   private constructor(message: string, public code: string, private settings: string[]) {
      super(message);
   }

   hasError(setting: string): boolean {
      return this.settings.includes(setting);
   }

   //TODO: settingsをstringでなく, enumかunionにしたい.
   static UndefinedSettings(settings?: string[]): SettingsError {
      if (!settings || settings.length === 0) return new SettingsError('未定義の設定があります.', this.name, []);
      return new SettingsError(`${settings.join(', ')} が未定義です.`, this.name, settings);
   }

}
