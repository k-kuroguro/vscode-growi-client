import { Memento } from 'vscode';

type GlobalState = Memento & { setKeysForSync(keys: readonly string[]): void };

export class Store {

   constructor(private state: GlobalState) {
      state.setKeysForSync(['apiToken']);
   }

   set apiToken(token: string | undefined) {
      if (token) token = encodeURI(token.trim());
      this.state.update('apiToken', token);
   }

   get apiToken(): string | undefined {
      return this.state.get('apiToken');
   }

}
