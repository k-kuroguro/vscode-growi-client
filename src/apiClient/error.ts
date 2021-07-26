import { BaseError } from '../error';

export class ApiClientError extends BaseError {

   name = 'ApiClientError';

   private constructor(message: string, public code: string) {
      super(message);
   }

   static GrowiUrlIsInvalid(): ApiClientError {
      return new ApiClientError('無効なGrowi Urlです.', 'GrowiUrlIsInvalid');
   }

   static ApiTokenIsInvalid(): ApiClientError {
      return new ApiClientError('無効なApi Tokenです.', 'ApiTokenIsInvalid');
   }

   static PageExists(path?: string): ApiClientError {
      if (path) return new ApiClientError(`${path} は既に存在します.`, 'PageExists');
      return new ApiClientError('ページは既に存在します.', 'PageExists');
   }

   static PageIsNotFound(path?: string): ApiClientError {
      if (path) return new ApiClientError(`${path} が見つかりません.`, 'PageIsNotFound');
      return new ApiClientError('ページが見つかりません.', 'PageIsNotFound');
   }

   static PageHasMovedToTrash(path: string): ApiClientError {
      return new ApiClientError(`${path} は /trash${path} に移動しました.`, 'PageHasMovedToTrash');
   }

   static Other(message: string): ApiClientError {
      return new ApiClientError(message, 'Other');
   }

}
