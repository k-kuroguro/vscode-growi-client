import * as vscode from 'vscode';
import { registerCommands } from './commands';
import { Store } from './store';
import { ApiController } from './apiController';
import { PageExplorer } from './pageExplorer';
import { initLogger } from './logger';

//TODO: ツリー,ページ内容のキャッシュ
//TODO: ViewWelcome
//TODO: ApiCOntrolerはエラーを投げるだけにする => 呼び出し元で色々する

export async function activate(context: vscode.ExtensionContext) {
   const store = new Store(context.globalState);
   const apiController = new ApiController(store);

   initLogger(context);

   context.subscriptions.push(
      new PageExplorer(apiController),
      ...registerCommands(store)
   );

}

export function deactivate() { }
