import axios from 'axios';
import { window } from 'vscode';
import { Config } from '../config';
import { Store } from '../store';

import { Page, PageList } from './types';

export class ApiController {

   constructor(private store: Store) { }

   async getPages(path?: string): Promise<PageList | undefined> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      if (!growiUrl || !apiToken) return;

      const url = `${growiUrl}_api/pages.list?access_token=${apiToken}&path=${encodeURI(path ?? '/')}`;
      const response = await axios.get(url).catch(e => {
         this.handleError(e);
         return undefined;
      });
      if (!response || !response.data.ok) return;
      return response.data as PageList;
   }

   async getPage(path: string): Promise<Page | undefined> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      if (!growiUrl || !apiToken) return;

      const url = `${growiUrl}_api/pages.get?access_token=${apiToken}&path=${encodeURI(path)}`;
      const response = await axios.get(url).catch(e => {
         this.handleError(e);
         return undefined;
      });
      if (!response || !response.data.ok) return;
      return response.data as Page;
   }

   async updatePage(path: string, body: string): Promise<Page | undefined> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      if (!growiUrl || !apiToken) return;

      const pageInfo = await this.getPage(path);
      if (!pageInfo || !pageInfo.page.id || !pageInfo.page.revision._id) return;

      const url = `${growiUrl}_api/pages.update`;
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

   private getUrlAndToken(): [string | undefined, string | undefined] {
      const [growiUrl, apiToken] = [Config.growiUrl, this.store.apiToken];
      if (!growiUrl) window.showErrorMessage('GrowiのUrlが設定されていません。');
      if (!apiToken) window.showErrorMessage('Api Tokenが設定されていません。');
      return [growiUrl, apiToken];
   }

}
