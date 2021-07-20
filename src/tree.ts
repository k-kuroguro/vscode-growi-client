import * as vscode from 'vscode';
import * as path from 'path';
import { ApiClient, ApiClientError } from './apiClient';
import { Setting, SettingsError, Util as ConfigUtil } from './setting';
import { FsProvider } from './fsProvider';

const data = [
   {
      name: '1'
   }, {
      name: '2'
   }, {
      name: '3'
   }, {
      name: '4'
   }, {
      name: '5'
   }, {
      name: '6'
   }, {
      name: '7'
   }, {
      name: '8'
   }, {
      name: '9'
   }, {
      name: '10'
   }, {
      name: '11'
   }, {
      name: '12'
   }, {
      name: '13'
   }, {
      name: '14'
   }, {
      name: '15'
   }, {
      name: '16'
   }, {
      name: '17'
   }, {
      name: '18'
   }, {
      name: '19'
   }, {
      name: '20'
   }, {
      name: '21'
   }, {
      name: '22'
   }, {
      name: '23'
   }, {
      name: '24'
   }, {
      name: '25'
   }, {
      name: '26'
   }, {
      name: '27'
   }, {
      name: '28'
   }, {
      name: '29'
   }, {
      name: '30'
   }, {
      name: '31'
   }, {
      name: '32'
   }, {
      name: '33'
   }, {
      name: '34'
   }, {
      name: '35'
   }, {
      name: '36'
   }, {
      name: '37'
   }, {
      name: '38'
   }, {
      name: '39'
   }, {
      name: '40'
   }, {
      name: '41'
   }, {
      name: '42'
   }, {
      name: '43'
   }, {
      name: '44'
   }, {
      name: '45'
   }, {
      name: '46'
   }, {
      name: '47'
   }, {
      name: '48'
   }, {
      name: '49'
   }, {
      name: '50'
   }, {
      name: '51'
   }, {
      name: '52'
   }, {
      name: '53'
   }, {
      name: '54'
   }, {
      name: '55'
   }, {
      name: '56'
   }, {
      name: '57'
   }, {
      name: '58'
   }, {
      name: '59'
   }, {
      name: '60'
   }, {
      name: '61'
   }, {
      name: '62'
   }, {
      name: '63'
   }, {
      name: '64'
   }, {
      name: '65'
   }, {
      name: '66'
   }, {
      name: '67'
   }, {
      name: '68'
   }, {
      name: '69'
   }, {
      name: '70'
   }, {
      name: '71'
   }, {
      name: '72'
   },

];

const dataTotal = 71;

class Item extends vscode.TreeItem {

   constructor(public name: string) {
      super(name, vscode.TreeItemCollapsibleState.Collapsed);
   }

}

class TreeDataProvider implements vscode.TreeDataProvider<Item> {

   private _onDidChangeTreeData: vscode.EventEmitter<Item | undefined | void> = new vscode.EventEmitter<Item | undefined | void>();
   readonly onDidChangeTreeData: vscode.Event<Item | undefined | void> = this._onDidChangeTreeData.event;
   private root = new Item('root');
   constructor() {
      this.itemMap.set('root', { pending: true, children: [], nextOffset: 0, item: this.root });
   }

   private itemMap: Map<string, { item: Item, pending: boolean, children: Item[], nextOffset: number }> = new Map();

   async loadChildren(item: { item: Item, pending: boolean, children: Item[], nextOffset: number }, offset: number) {
      setTimeout(() => {
         const myData = [];
         let done: boolean = false;
         for (let i = offset; i < offset + 5; i++) {
            if (i > dataTotal) {
               done = true;
               break;
            }
            myData.push(data[i]);
         }
         const items = myData.map(e => new Item(e.name));
         this.itemMap.set(item.item.name, { item: item.item, pending: !done, children: [...item.children, ...items], nextOffset: offset + 5 });
         this._onDidChangeTreeData.fire(item.item);
         console.log('fre');
      }, 2000);
   }

   refresh(): void {
      this._onDidChangeTreeData.fire();
   }

   getTreeItem(element: Item): Item {
      return element;
   }

   async getChildren(element?: Item): Promise<Item[]> {
      console.log(element)
      if (!element) return [this.root];
      const item = this.itemMap.get(element.name);
      if (item) {
         if (!item.pending) return item.children;
         this.loadChildren(item, item.nextOffset);
         return item.children;
      } else {
      }
      return [];
   }
}

export class PageExplorer {

   private readonly treeView: vscode.TreeView<Item>;
   private readonly treeDataProvider: TreeDataProvider;
   private readonly disposables: vscode.Disposable[] = [];

   constructor(private readonly setting: Setting, private readonly apiClient: ApiClient) {
      this.treeDataProvider = new TreeDataProvider();
      this.treeView = vscode.window.createTreeView('growi-client.aaa', { treeDataProvider: this.treeDataProvider, canSelectMany: false, showCollapseAll: true });

      this.disposables.push(
         this.treeView,
      );
   }

   dispose(): void {
      this.disposables.forEach(d => d.dispose());
   }
}

