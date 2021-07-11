import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { Store } from './store';
import { ApiController } from './apiController';
import { PageExplorer } from './pageExplorer';

//TODO: ツリー,ページ内容のキャッシュ
//TODO: ViewWelcome

export async function activate(context: vscode.ExtensionContext) {
   const store = new Store(context.globalState);
   const apiController = new ApiController(store);

   context.subscriptions.push(
      new PageExplorer(apiController),
      ...registerCommands(store)
   );

}

export function deactivate() { }
