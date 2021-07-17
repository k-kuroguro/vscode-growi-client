import axios from 'axios';
import { Setting, SettingsError, SettingName } from '../setting';
import { ApiClientError } from './error';
import { Page, PageList } from './types';

export { ApiClientError } from './error';

export class ApiClient {

   constructor(private setting: Setting) { }

   /**
    * パス配下のページ一覧を取得する.
    * @param path 指定しない場合, ルート以下を取得する.
    * @throws {@link ApiClientError}
    * @throws {@link SettingsError}
    */
   async getPages(path?: string): Promise<PageList> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      const url = `${growiUrl}_api/pages.list?access_token=${apiToken}&path=${encodeURI(path ?? '/')}`;
      const response = await axios.get(url).catch(e => this.handleError(e));
      if (!response.data.ok) this.handleError(response.data.error || response.data);
      return response.data.pages as PageList;
   }

   /**
    * 指定パスのページを取得する.
    * @param path '/'で始まるが, 末尾にはつかない. e.g.'/a/b/c'
    * @throws {@link ApiClientError}
    * @throws {@link SettingsError}
    */
   async getPage(path: string): Promise<Page> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      const url = `${growiUrl}_api/pages.get?access_token=${apiToken}&path=${encodeURI(path)}`;
      const response = await axios.get(url).catch(e => this.handleError(e));
      if (!response.data.ok) this.handleError(response.data.error || response.data);
      if (response.data.page.redirectTo === `/trash${path}`) throw ApiClientError.PageHasMovedToTrash(path);
      return response.data.page as Page;
   }

   /**
    * ページの本文を更新する
    * @param path '/'で始まるが, 末尾にはつかない. e.g.'/a/b/c'
    * @param body
    * @throws {@link ApiClientError}
    * @throws {@link SettingsError}
    */
   async updatePage(path: string, body: string): Promise<Page> {
      const page = await this.getPage(path).catch(e => { throw e; });
      const [growiUrl, apiToken] = this.getUrlAndToken();
      const url = `${growiUrl}_api/pages.update`;
      const response = await axios.post(url, {
         access_token: apiToken,
         page_id: page.id,
         revision_id: page.revision._id,
         body
      }).catch(e => this.handleError(e));
      if (!response.data.ok) this.handleError(response.data.error || response.data);
      return response.data.page as Page;
   }

   //TODO: 引数に文字列の配列を許可.
   async pageExists(path: string): Promise<boolean> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      const pagePaths = encodeURI(`["${path}"]`);
      const url = `${growiUrl}_api/pages.exist?access_token=${apiToken}&pagePaths=${pagePaths}`;
      const response = await axios.get(url).catch(e => this.handleError(e));
      if (!response.data.ok) this.handleError(response.data.error || response.data);
      if (typeof response.data.pages[path] === 'boolean') return response.data.pages[path];
      return false;
   }

   private getUrlAndToken(): [string, string] {
      const [growiUrl, apiToken] = [this.setting.growiUrl, this.setting.apiToken];

      if (growiUrl && apiToken) return [growiUrl, apiToken];

      const undefinedSettings: SettingName[] = [];
      if (!growiUrl) undefinedSettings.push('Growi URL');
      if (!apiToken) undefinedSettings.push('Api Token');
      throw SettingsError.UndefinedSettings(undefinedSettings);
   }

   private handleError(e: any): never {
      if (typeof e === 'string') {
         let matchArray: RegExpMatchArray | null = [];
         //HACK: 以下の正規表現にパフォーマンス上の問題あり.
         if ((matchArray = e.match(/(?<=Error: Page ').*?(?=' is not found or forbidden)/g)) && matchArray.length) {
            throw ApiClientError.PageIsNotFound(matchArray[0]);
         }
         throw ApiClientError.Other(e);
      }
      if (axios.isAxiosError(e)) {
         if (e.code && ['ECONNREFUSED', 'ENOTFOUND'].includes(e.code)) {
            throw ApiClientError.GrowiUrlIsInvalid();
         }
         if (e.response) {
            switch (e.response.status) {
               case 404:
               case 400:
                  throw ApiClientError.GrowiUrlIsInvalid();
               case 403:
                  throw ApiClientError.ApiTokenIsInvalid();
            }
         }
      }
      throw e;
   }

}
