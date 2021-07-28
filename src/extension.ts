import { ExtensionContext, workspace } from 'vscode';
import { registerCommands } from './commands';
import { Setting } from './setting';
import { ApiClient } from './apiClient';
import { FsProvider } from './fsProvider';
import { PathUtil } from './pathUtil';

//TODO: trashの中身も表示・編集できる.
//TODO: 今はApi Tokenが必須になっているが, 必要ない処理もあるので要修正.

export async function activate(context: ExtensionContext) {
   const setting = new Setting(context.globalState);
   const apiClient = new ApiClient(setting);
   const fsProvider = new FsProvider(apiClient);

   context.subscriptions.push(
      setting,
      workspace.registerFileSystemProvider(PathUtil.scheme, fsProvider, { isCaseSensitive: true, isReadonly: false }),
      ...registerCommands(setting, apiClient)
   );

}

export function deactivate() { }
