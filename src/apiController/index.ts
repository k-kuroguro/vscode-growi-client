import axios from 'axios';
import { commands, window } from 'vscode';
import { Config } from '../config';
import { Store } from '../store';

import { Page, PageList } from './types';

export class ApiController {

   constructor(private store: Store) { }

   async getPages(path?: string): Promise<PageList | undefined> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      this.showErrorAboutSettings(!!growiUrl, !!apiToken);
      if (!growiUrl || !apiToken) return;

      const url = `${growiUrl}_api/pages.list?access_token=${apiToken}&path=${encodeURI(path ?? '/')}`;
      const response = await axios.get(url).catch(e => {
         this.handleError(e);
         return undefined;
      });
      if (response?.data?.error) window.showErrorMessage(response.data.error);
      if (!response || !response.data.ok) return;
      return response.data as PageList;
   }

   async getPage(path: string): Promise<Page | undefined> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      this.showErrorAboutSettings(!!growiUrl, !!apiToken);
      if (!growiUrl || !apiToken) return;

      const url = `${growiUrl}_api/pages.get?access_token=${apiToken}&path=${encodeURI(path)}`;
      const response = await axios.get(url).catch(e => {
         this.handleError(e);
         return undefined;
      });
      if (response?.data?.error) window.showErrorMessage(response.data.error);
      if (!response || !response.data.ok) return;
      return response.data as Page;
   }

   async updatePage(path: string, body: string): Promise<Page | undefined> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      this.showErrorAboutSettings(!!growiUrl, !!apiToken);
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
      if (response?.data?.error) window.showErrorMessage(response.data.error);
      if (!response || !response.data.ok) return;

      return response.data as Page;
   }

   private handleError(e: any): void {
      if (axios.isAxiosError(e)) {
         if (e.response) {
            window.showErrorMessage(e.response.data);
            window.showErrorMessage(e.response.status.toString() + e.response.statusText);
            window.showErrorMessage(e.response.headers);
         } else if (e.request) {
            window.showErrorMessage(e.request);
         } else {
            window.showErrorMessage('Error', e.message);
         }
         return;
      }
      window.showErrorMessage(e.message ? e.message : e);
   }

   private getUrlAndToken(): [string | undefined, string | undefined] {
      return [Config.growiUrl, this.store.apiToken];
   }

   private async showErrorAboutSettings(hasSetUrl: boolean, hasSetToken: boolean): Promise<void> {
      if (hasSetUrl && hasSetToken) return;
      if (!hasSetUrl && !hasSetToken) {
         window.showErrorMessage('GrowiのUrl, Api Tokenが設定されていません。');
         //TODO: multi step input
         return;
      }
      if (hasSetToken) {
         const selected = await window.showErrorMessage('GrowiのUrlが設定されていません。', '設定');
         if (selected) commands.executeCommand('growi-client.setGrowiUrl');
         return;
      }
      if (hasSetUrl) {
         const selected = await window.showErrorMessage('Api Tokenが設定されていません。', '設定');
         if (selected) commands.executeCommand('growi-client.setApiToken');
         return;
      }
   }

}
