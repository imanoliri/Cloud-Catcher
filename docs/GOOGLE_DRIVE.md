# Google Drive storage

`GoogleDriveStorageProvider` in `src/storage.js` is a future optional provider for the same logical atlas currently stored in IndexedDB. It stores one `cloud-catcher-library.json` file in Drive and can optionally target a specific folder ID. It is not wired into the MVP UI and nothing is uploaded automatically.

The provider intentionally does not own OAuth. A caller supplies a Google OAuth access token with Drive file permissions and may supply a folder ID:

```js
const provider = new GoogleDriveStorageProvider({ accessToken, folderId });
const library = await provider.loadLibrary();
await provider.saveLibrary(library);
```

This keeps authentication replaceable and prevents Cloud Catcher data from becoming coupled to Google. The portable JSON export remains the recovery path even when Drive sync is enabled.

A future UI integration should use Google Identity Services, explicit user consent and clear conflict handling. It must not display Drive and browser records as two independent or silently merged atlases. The browser copy should act as the offline cache for one logical user-owned library, with export remaining the recovery path.
