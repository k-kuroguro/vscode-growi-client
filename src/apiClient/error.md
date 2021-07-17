# 通常操作で発生しうるエラー

## GrowiのURLが間違っている GrowiUrlIsInvalid

 - Error: getaddrinfo ENOTFOUND ${growiUrl}

   ```
   e.code === 'ENOTFOUND'
   ```
 - Error: connect ECONNREFUSED ${growiUrl}

   ```
   e.code === 'ECONNREFUSED'
   ```
 - Request failed with status code 404

   ```
   e.response.status === 404
   ```
 - Request failed with status code 400

   ```
   e.response.status === 400
   ```

## Api Tokenが間違っている ApiTokenIsInvalid

 - Request failed with status code 403

   ```
   e.response.status === 403
   ```

## 書き込み時にページが既に削除されている PageIsNotFound

 - レスポンスで判別できないため, 書き込み前に確認する.

## 読み込み時にページが既に削除されている PageIsNotFound

 - bodyが'redirect /trash/path'となる, 読み込み前に確認する.
