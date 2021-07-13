import axios from 'axios';
import { window } from 'vscode';
import { Config } from '../config';
import { Store } from '../store';

import { Page, PageList } from './types';

export class ApiController {

   constructor(private store: Store) { }

   async getPages(path?: string): Promise<PageList | undefined> {
      const [growiAddress, apiToken] = this.getAddressAndToken();
      if (!growiAddress || !apiToken) return;

      const url = `${growiAddress}_api/pages.list?access_token=${apiToken}&path=${encodeURI(path ?? '/')}`;
      const response = await axios.get(url).catch(e => {
         this.handleError(e);
         return undefined;
      });
      if (!response || !response.data.ok) return;
      return response.data as PageList;
   }

   async getPage(path: string): Promise<Page | undefined> {
      const [growiAddress, apiToken] = this.getAddressAndToken();
      if (!growiAddress || !apiToken) return;

      const url = `${growiAddress}_api/pages.get?access_token=${apiToken}&path=${encodeURI(path)}`;
      const response = await axios.get(url).catch(e => {
         this.handleError(e);
         return undefined;
      });
      if (!response || !response.data.ok) return;
      return response.data as Page;
   }

   async updatePage(path: string, body: string): Promise<Page | undefined> {
      const [growiAddress, apiToken] = this.getAddressAndToken();
      if (!growiAddress || !apiToken) return;

      const pageInfo = await this.getPage(path);
      if (!pageInfo || !pageInfo.page.id || !pageInfo.page.revision._id) return;

      const url = `${growiAddress}_api/pages.update`;
      const response = await axios.post(url, {
         access_token: apiToken,
         page_id: pageInfo.page.id,
         revision_id: pageInfo.page.revision._id,
         body
      }).catch(e => {
         this.handleError(e);
         return undefined;
      });
      if (!response || !response.data.ok) return;

      return response.data as Page;
   }

   private handleError(e: any): void {
      window.showErrorMessage(e.message ? e.message : e);
   }

   //TODO: 設定コマンドに飛ぶようにする
   private getAddressAndToken(): [string | undefined, string | undefined] {
      const [growiAddress, apiToken] = [Config.growiAddress, this.store.apiToken];
      if (!growiAddress) window.showErrorMessage('Growiのアドレスが設定されていません。');
      if (!apiToken) window.showErrorMessage('Api Tokenが設定されていません。');
      return [growiAddress, apiToken];
   }

}
