import { Memento } from 'vscode';

type GlobalState = Memento & { setKeysForSync(keys: readonly string[]): void };

export class Store {

   constructor(private state: GlobalState) {
      state.setKeysForSync(['apiToken']);
   }

   /**
    * URLエンコード, 先頭/末尾のスペース除去済みのApi Token.
    * @remarks
    * チェックはしていないが, 通常末尾にイコール(=)がつく.
    */
   set apiToken(token: string | undefined) {
      if (token) token = encodeURI(token.trim());
      this.state.update('apiToken', token);
   }

   get apiToken(): string | undefined {
      return this.state.get('apiToken');
   }

}
