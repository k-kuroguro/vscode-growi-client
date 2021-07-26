import { ExtensionContext, workspace } from 'vscode';
import { registerCommands } from './commands';
import { Setting } from './setting';
import { ApiClient } from './apiClient';
import { PageExplorer } from './pageExplorer';
import { FsProvider } from './fsProvider';

//TODO: ツリー, ページ内容のキャッシュ.
//TODO: trashの中身も表示・編集できる.
//TODO: 今はApi Tokenが必須になっているが, 必要ない処理もあるので要修正.
//TODO: ページ新規作成時にbody入力用エディタを開く
//TODO: コマンドパレットから利用可能なnew page, open pageコマンド
//TODO: コンテキストメニュー整理

export async function activate(context: ExtensionContext) {
   const setting = new Setting(context.globalState);
   const apiClient = new ApiClient(setting);
   const fsProvider = new FsProvider(apiClient);

   context.subscriptions.push(
      setting,
      workspace.registerFileSystemProvider('growi', fsProvider, { isCaseSensitive: true, isReadonly: false }),
      new PageExplorer(setting, apiClient),
      ...registerCommands(setting)
   );

}

export function deactivate() { }
