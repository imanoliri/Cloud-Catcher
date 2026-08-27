# Google Drive storage

`GoogleDriveStorageProvider` in `src/storage.js` implements the same `loadLibrary()` and `saveLibrary()` contract as browser storage. It stores one `cloud-catcher-library.json` file in Drive and can optionally target a specific folder ID.

The provider intentionally does not own OAuth. A caller supplies a Google OAuth access token with Drive file permissions and may supply a folder ID:

```js
const provider = new GoogleDriveStorageProvider({ accessToken, folderId });
const library = await provider.loadLibrary();
await provider.saveLibrary(library);
```

This keeps authentication replaceable and prevents Cloud Catcher data from becoming coupled to Google. The portable JSON export remains the recovery path even when Drive sync is enabled.

A future UI integration should use Google Identity Services to obtain the token, remember only non-sensitive configuration, and provide explicit `Upload to Drive` / `Download from Drive` actions before automatic synchronization is considered.
