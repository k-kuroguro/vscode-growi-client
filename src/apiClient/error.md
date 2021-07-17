# 通常操作で発生しうるエラー

## GrowiのURLが間違っている `GrowiUrlIsInvalid`

 - Error: getaddrinfo ENOTFOUND ${growiUrl}

   ```ts
   e.code === 'ENOTFOUND'
   ```
 - Error: connect ECONNREFUSED ${growiUrl}

   ```ts
   e.code === 'ECONNREFUSED'
   ```
 - Request failed with status code 404

   ```ts
   e.response.status === 404
   ```
 - Request failed with status code 400

   ```ts
   e.response.status === 400
   ```

## Api Tokenが間違っている `ApiTokenIsInvalid`

 - Request failed with status code 403

   ```ts
   e.response.status === 403
   ```

## 読み込み/書き込み時にページが既に完全削除されている `PageIsNotFound`

 - Growiのレスポンス

   ```json
   {
      "ok": false,
      "error": "Error: Page '/path' is not found or forbidden"
   }
   ```

   上記のオブジェクトが返ると, 関数`ApiClient.getPage`内でエラーが投げられる.

## 読み込み/書き込み時にページが既に`/trash`へ移動されている `PageHasMovedToTrash`

 - `pages.get`した際, redirectToが`/trash/hoge`となっているか確認する.\
   (関数`ApiClient.getPage`内で確認)
