import axios from 'axios';
import { Setting, SettingsError, SettingName } from '../setting';
import { ApiClientError } from './error';
import { Page, PageList, Sort } from './types';

export { ApiClientError } from './error';

export class ApiClient {

   constructor(private setting: Setting) { }

   /**
    * パス配下のページ一覧を取得する.
    * @param path 末尾に`/`をつけること
    * @param options
    * @throws {@link ApiClientError}<br>
    *    - GrowiUrlIsInvalid
    *    - ApiTokenIsInvalid
    * @throws {@link SettingsError}<br>
    *    - UndefinedSettings
    */
   async getPages(path: string, options?: { limit?: number, offset?: number }): Promise<PageList> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      let url = `${growiUrl}_api/pages.list?access_token=${apiToken}&path=${encodeURI(path)}`;
      if (options?.limit) url += `&limit=${options.limit}`;
      if (options?.offset) url += `&offset=${options.offset}`;
      const response = await axios.get(url).catch(e => this.handleError(e));
      if (!response.data.ok) this.handleError(response.data.error || response.data, path);
      return {
         pages: response.data.pages,
         totalCount: response.data.totalCount,
         limit: response.data.limit,
         offset: response.data.offset
      };
   }

   /**
    * lsxプラグインを使用して, パス配下のページ一覧を取得する.
    * @param path 末尾に`/`をつけること
    * @param options
    * @throws {@link ApiClientError}<br>
    *    - GrowiUrlIsInvalid
    *    - ApiTokenIsInvalid
    * @throws {@link SettingsError}<br>
    *    - UndefinedSettings
    */
   async getPagesByLsx(path: string, options?: {
      limit?: number,
      offset?: number,
      sort?: Sort,
      reverse?: boolean,
      filter?: string
   }): Promise<PageList> {
      const [growiUrl, apiToken] = this.getUrlAndToken();
      const encodedPath = encodeURI(path);
      const defaultLimit = 50;
      let url = `${growiUrl}_api/plugins/lsx?access_token=${apiToken}&pagePath=${encodedPath}`;
      let optionsQuery: {
         num: string,
         sort: Sort,
         reverse: 'true' | 'false',
         filter?: string
      } = { num: defaultLimit.toString(), sort: 'path', reverse: 'false' };
      if (options?.limit || options?.offset) {
         let num = defaultLimit.toString();
         if (options.limit && typeof options.offset === 'undefined') num = `${options.limit}`;
         if (options.offset && typeof options.limit === 'undefined') num = `${(options.offset + 1)}:${options.offset + defaultLimit}`;
         if (typeof options.offset !== 'undefined' && typeof options.limit !== 'undefined') num = `${options.offset + 1}:${options.offset + options.limit}`;
         optionsQuery.num = num;
      }
      if (options?.sort) optionsQuery.sort = options.sort;
      if (options?.reverse) optionsQuery.reverse = options.reverse ? 'true' : 'false';
      if (options?.filter) optionsQuery.filter = options.filter;
      url += '&options=' + encodeURI(JSON.stringify({ ...optionsQuery, [encodedPath.replace(/\/$/, '')]: true }));
      const response = await axios.get(url).catch(e => this.handleError(e));
      if (!response.data.ok) this.handleError(response.data.error || response.data, path);
      return {
         pages: response.data.pages,
         totalCount: (await this.getPages(path, { limit: 0 })).totalCount,
         limit: options?.limit || defaultLimit,
         offset: options?.offset || 0
      };
   }

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
