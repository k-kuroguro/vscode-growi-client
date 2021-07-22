import * as path from 'path';
import { commands, window, workspace, ConfigurationTarget, Memento, EventEmitter, Event, Disposable } from 'vscode';
import { BaseError } from './error';

type ConfigName = 'GrowiURL' | 'RootPath' | 'MaxPagePerTime';
type StateName = 'ApiToken';
export type SettingName = ConfigName | StateName;

type GlobalState = Memento & { setKeysForSync(keys: readonly string[]): void };

export class Setting {

   private _onDidChange: EventEmitter<SettingName> = new EventEmitter();
   readonly onDidChange: Event<SettingName> = this._onDidChange.event;

   private disposables: Disposable[] = [];

   constructor(private state: GlobalState) {
      state.setKeysForSync(['apiToken']);
      this.disposables.push(
         workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('growi-client.growiUrl')) this._onDidChange.fire('GrowiURL');
            if (e.affectsConfiguration('growi-client.pageExplorer.rootPath')) this._onDidChange.fire('RootPath');
            if (e.affectsConfiguration('growi-client.pageExplorer.maxPagePerTime')) this._onDidChange.fire('MaxPagePerTime');
         })
      );
      this.apiTokenIsUndefined = !this.apiToken;
   }

   dispose(): void {
      this.disposables.forEach(d => d.dispose());
   }

   //#region state

   /**
    * URLエンコード, 先頭/末尾のスペース除去済みのApi Token.
    * @remarks
    * チェックはしていないが, 通常末尾にイコール(=)がつく.
    */
   set apiToken(token: string | undefined) {
      if (token) token = encodeURI(token.trim());
      this.state.update('apiToken', token);
      this._onDidChange.fire('ApiToken');
      this.apiTokenIsUndefined = !token;
   }

   get apiToken(): string | undefined {
      return this.state.get('apiToken');
   }

   //#endregion

   //#region workspace configuration

   /**
      * エンコード, 先頭/末尾のスペース除去済みのURL
      *
      * @example
      * 末尾に'/'の付いたURL
      *  - 'https://demo.growi.org/'
      *  - 'http://127.0.0.1/'
      */
   get growiUrl(): string | undefined {
      return workspace.getConfiguration('growi-client').get<string>('growiUrl');
   }

   set growiUrl(url: string | undefined) {
      if (url) {
         url = url.trim();
         if (!url.endsWith('/')) url = url + '/';
         url = encodeURI(url);
      }
      workspace.getConfiguration('growi-client').update('growiUrl', url, ConfigurationTarget.Global);
      this._onDidChange.fire('GrowiURL');
   }

   //TODO: package.jsonにpattern追加
   get rootPath(): string {
      return workspace.getConfiguration('growi-client').get<string>('pageExplorer.rootPath') || '/';
   }

   set rootPath(rootPath: string | undefined) {
      if (rootPath === '') rootPath = undefined;
      if (rootPath) {
         //TODO: パスの正規化などをクラスに切り出す
         rootPath = path.normalize(rootPath.trim());
         if (!rootPath.startsWith('/')) rootPath = '/' + rootPath;
         if (rootPath.endsWith('/')) rootPath = rootPath.replace(/\/$/, '');
      }
      workspace.getConfiguration('growi-client').update('pageExplorer.rootPath', rootPath, ConfigurationTarget.Global);
      this._onDidChange.fire('RootPath');
   }

   get maxPagePerTime(): number {
      return workspace.getConfiguration('growi-client').get<number>('pageExplorer.maxPagePerTime') || 10;
   }

   set maxPagePerTime(number: number | undefined) {
      workspace.getConfiguration('growi-client').update('pageExplorer.maxPagePerTime', number, ConfigurationTarget.Global);
      this._onDidChange.fire('MaxPagePerTime');
   }

   //#endregion

   //#region context

   set apiTokenIsUndefined(isUndefined: boolean) {
      commands.executeCommand('setContext', 'growi-client.apiTokenIsUndefined', isUndefined);
   }

   //#endregion

}

export class SettingsError extends BaseError {

   name = 'SettingsError';

   private constructor(message: string, public code: string, private settings: string[]) {
      super(message);
   }

   static UndefinedSettings(settings?: SettingName[]): SettingsError {
      if (!settings || settings.length === 0) return new SettingsError('未定義の設定があります.', this.name, []);
      return new SettingsError(`${settings.join(', ')} が未定義です.`, this.name, settings);
   }

}

export class Util {

   static async showErrorAboutSettings(hasSetUrl: boolean, hasSetToken: boolean): Promise<void> {
      if (hasSetUrl && hasSetToken) return;
      if (!hasSetUrl && !hasSetToken) {
         const selected = await window.showErrorMessage('GrowiのURL, Api Tokenが設定されていません.', '設定');
         if (selected) commands.executeCommand('growi-client.setUrlAndToken');
         return;
      }
      if (hasSetToken) {
         const selected = await window.showErrorMessage('GrowiのURLが設定されていません.', '設定');
         if (selected) commands.executeCommand('growi-client.setGrowiUrl');
         return;
      }
      if (hasSetUrl) {
         const selected = await window.showErrorMessage('Api Tokenが設定されていません.', '設定');
         if (selected) commands.executeCommand('growi-client.setApiToken');
         return;
      }
   }

}
