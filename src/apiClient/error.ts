import { BaseError } from '../error';

export class ApiClientError extends BaseError {

   name = 'ApiClientError';

   private constructor(message: string, public code: string) {
      super(message);
   }

   static GrowiUrlIsInvalid(): ApiClientError {
      return new ApiClientError('無効なGrowi Urlです.', this.name);
   }

   static ApiTokenIsInvalid(): ApiClientError {
      return new ApiClientError('無効なApi Tokenです.', this.name);
   }

   static PageIsNotFound(path: string): ApiClientError {
      return new ApiClientError(`${path} が見つかりません.`, this.name);
   }

   static PageHasMovedToTrash(path: string): ApiClientError {
      return new ApiClientError(`${path} は /trash${path} に移動しました.`, this.name);
   }

   static Other(message: string): ApiClientError {
      return new ApiClientError(message, this.name);
   }

}
