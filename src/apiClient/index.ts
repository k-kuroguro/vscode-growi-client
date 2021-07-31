import axios from 'axios';
import * as utils from '../utils';
import { Setting, SettingsError, SettingName } from '../setting';
import { ApiClientError } from './error';
import { Page, PageBase } from './types';

export { ApiClientError } from './error';

export class ApiClient {

   constructor(private setting: Setting) { }

   /**
    * 指定パスのページを取得する.
    * @param path '/'で始まるが, 末尾にはつかない. e.g.'/a/b/c'
    * @throws {@link ApiClientError}<br>
    *    - GrowiUrlIsInvalid
    *    - ApiTokenIsInvalid
    *    - PageHasMovedToTrash
    *    - PageIsNotFound
    * @throws {@link SettingsError}<br>
    *    - UndefinedSettings
    */
   async getPage(path: string): Promise<Page> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      path = utils.path.normalize(path);
      const url = `${growiUrl}_api/pages.get?access_token=${apiToken}&path=${encodeURI(path)}`;
      const response = await axios.get(url).catch(e => this.handleError(e));
      if (!response.data.ok) this.handleError(response.data.error || response.data, path);
      if (response.data.page.redirectTo === `/trash${path}`) throw ApiClientError.PageHasMovedToTrash(path);
      return response.data.page as Page;
   }

   /**
    * ページの本文を更新する
    * @param path '/'で始まるが, 末尾にはつかない. e.g.'/a/b/c'
    * @param body
    * @throws {@link ApiClientError}<br>
    *    - GrowiUrlIsInvalid
    *    - ApiTokenIsInvalid
    *    - PageHasMovedToTrash
    *    - PageIsNotFound
    * @throws {@link SettingsError}<br>
    *    - UndefinedSettings
    */
   async updatePage(path: string, body: string): Promise<PageBase> {
      path = utils.path.normalize(path);
      const page = await this.getPage(path).catch(e => { throw e; });
      const [growiUrl, apiToken] = this.getUrlAndToken();
      const url = `${growiUrl}_api/pages.update`;
      const response = await axios.post(url, {
         access_token: apiToken,
         page_id: page.id,
         revision_id: page.revision._id,
         body
      }).catch(e => this.handleError(e));
      if (!response.data.ok) this.handleError(response.data.error || response.data, path);
      return response.data.page as Page;
   }

   //TODO: 引数に文字列の配列を許可.
   /**
    * ページの存在を確認する
    * @param path '/'で始まるが, 末尾にはつかない. e.g.'/a/b/c'
    * @throws {@link ApiClientError}<br>
    *    - GrowiUrlIsInvalid
    *    - ApiTokenIsInvalid
    * @throws {@link SettingsError}<br>
    *    - UndefinedSettings
    */
   async pageExists(path: string): Promise<boolean> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      path = utils.path.normalize(path);
      const pagePaths = encodeURI(`["${path}"]`);
      const url = `${growiUrl}_api/pages.exist?access_token=${apiToken}&pagePaths=${pagePaths}`;
      const response = await axios.get(url).catch(e => this.handleError(e));
      if (!response.data.ok) this.handleError(response.data.error || response.data, path);
      if (typeof response.data.pages[path] === 'boolean') return response.data.pages[path];
      return false;
   }

   /**
    * ページを新規作成する
    * @param path '/'で始まるが, 末尾にはつかない. e.g.'/a/b/c'
    * @param body
    * @throws {@link ApiClientError}<br>
    *    - GrowiUrlIsInvalid
    *    - ApiTokenIsInvalid
    *    - PageExists
    * @throws {@link SettingsError}<br>
    *    - UndefinedSettings
    */
   async createPage(path: string, body: string): Promise<Page> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      path = utils.path.normalize(path);
      const url = `${growiUrl}_api/v3/pages`;
      const response = await axios.post(url, {
         access_token: apiToken,
         path,
         body
      }, {
         validateStatus: (status: number): boolean => {
            return (status >= 200 && status < 300) || status === 500; //page_exists等のエラー発生時, 500が返るため許可.
         }
      }).catch(e => this.handleError(e));
      if (response.data.errors) this.handleError(response.data.errors[0].code || response.data.errors, path); //TODO: エラーを1つしか確認していない.
      return { ...response.data.data.page, revision: response.data.data.revision } as Page;
   }

   private getUrlAndToken(): [string, string] {
      const [growiUrl, apiToken] = [this.setting.growiUrl, this.setting.apiToken];

      if (growiUrl && apiToken) return [growiUrl, apiToken];

      const undefinedSettings: SettingName[] = [];
      if (!growiUrl) undefinedSettings.push('GrowiURL');
      if (!apiToken) undefinedSettings.push('ApiToken');
      throw SettingsError.UndefinedSettings(undefinedSettings);
   }

   private handleError(e: any, path?: string): never {
      if (typeof e === 'string') {
         if (e.match(/Error: Page '.*?' is not found or forbidden/g)) throw ApiClientError.PageIsNotFound(path);
         if (e === 'page_exists') throw ApiClientError.PageExists(path);
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
