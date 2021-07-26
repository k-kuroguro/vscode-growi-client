import { ExtensionContext, workspace } from 'vscode';
import { registerCommands } from './commands';
import { Setting } from './setting';
import { ApiClient } from './apiClient';
import { PageExplorer } from './pageExplorer';
import { FsProvider } from './fsProvider';

//TODO: ツリー, ページ内容のキャッシュ.
//TODO: trashの中身も表示・編集できる.
//TODO: 今はApi Tokenが必須になっているが, 必要ない処理もあるので要修正.
//TODO: コマンドパレットから利用可能なnew page, open pageコマンド
//TODO: コンテキストメニュー整理

export async function activate(context: ExtensionContext) {
   const setting = new Setting(context.globalState);
   const apiClient = new ApiClient(setting);
   const fsProvider = new FsProvider(apiClient);
   const pageExplorer = new PageExplorer(setting, apiClient);

   context.subscriptions.push(
      setting,
      pageExplorer,
      fsProvider.onDidChangeFile(e => {
         //TODO: 部分更新
         pageExplorer.refresh();
      }),
      workspace.registerFileSystemProvider('growi', fsProvider, { isCaseSensitive: true, isReadonly: false }),
      ...registerCommands(setting)
   );

}

export function deactivate() { }
