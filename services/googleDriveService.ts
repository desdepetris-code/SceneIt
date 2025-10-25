// services/googleDriveService.ts
import { GOOGLE_CLIENT_ID, DRIVE_SCOPES, DRIVE_DISCOVERY_DOCS, DRIVE_APP_FOLDER, DRIVE_FILE_NAME } from '../constants';
import { DriveUser } from '../types';

// gapi types are global after script load, so we need to declare them to satisfy TypeScript
declare const gapi: any;

let isGapiReady = false;

const loadGapiScript = (): Promise<void> => {
  return new Promise<void>((resolve) => {
    // Prevent loading the script multiple times
    if (document.getElementById('gapi-script')) {
        gapi.load('client:auth2', resolve);
        return;
    }
    const script = document.createElement('script');
    script.id = 'gapi-script';
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Load the specific gapi libraries we need
      gapi.load('client:auth2', resolve);
    };
    document.body.appendChild(script);
  });
};

export const initGoogleDriveClient = async (): Promise<void> => {
    if (isGapiReady) return;
    
    // Don't initialize if credentials are not provided
    if (GOOGLE_CLIENT_ID.startsWith('YOUR_')) {
        console.warn("Google Drive sync is disabled. Please provide a valid Client ID in constants.ts");
        throw new Error("Google Drive client not configured.");
    }

    await loadGapiScript();
    
    await new Promise<void>((resolve, reject) => {
        // FIX: The placeholder GOOGLE_API_KEY was causing the discovery document to fail loading.
        // For OAuth flows accessing user data, the apiKey is not required for initialization,
        // as the user's access token will authorize the API calls. Removing it resolves the error.
        gapi.client.init({
            clientId: GOOGLE_CLIENT_ID,
            discoveryDocs: DRIVE_DISCOVERY_DOCS,
            scope: DRIVE_SCOPES,
        }).then(() => {
            isGapiReady = true;
            resolve();
        }).catch((error: any) => {
            console.error("Error initializing gapi client:", error);
            reject(error);
        });
    });
};

export const getAuthInstance = (): any | null => {
    if (!isGapiReady) return null;
    return gapi.auth2.getAuthInstance();
}

export const signIn = async (): Promise<void> => {
    if (!isGapiReady) throw new Error("GAPI client not initialized");
    await gapi.auth2.getAuthInstance().signIn();
};

export const signOut = async (): Promise<void> => {
    if (!isGapiReady) throw new Error("GAPI client not initialized");
    await gapi.auth2.getAuthInstance().signOut();
};

const getFileId = async (): Promise<string | null> => {
    const response = await gapi.client.drive.files.list({
        spaces: DRIVE_APP_FOLDER,
        fields: 'files(id, name)',
        pageSize: 10
    });
    const file = response.result.files.find((f: any) => f.name === DRIVE_FILE_NAME);
    return file ? file.id : null;
};

export const uploadData = async (data: object): Promise<void> => {
    if (!isGapiReady || !getAuthInstance()?.isSignedIn.get()) throw new Error("Not signed in");

    const fileId = await getFileId();
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
        'name': DRIVE_FILE_NAME,
        'mimeType': 'application/json'
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(data) +
        close_delim;
    
    const request = gapi.client.request({
        'path': `/upload/drive/v3/files${fileId ? `/${fileId}` : ''}`,
        'method': fileId ? 'PATCH' : 'POST',
        'params': { 'uploadType': 'multipart', ...(fileId ? {} : { parents: [DRIVE_APP_FOLDER] }) },
        'headers': {
            'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody
    });

    await new Promise<void>((resolve, reject) => {
        request.execute((resp: any) => {
            if (resp && resp.error) {
                console.error("Google Drive Upload Error:", resp.error);
                reject(new Error(resp.error.message));
            } else {
                resolve();
            }
        });
    });
};

export const downloadData = async (): Promise<object | null> => {
    if (!isGapiReady || !getAuthInstance()?.isSignedIn.get()) throw new Error("Not signed in");

    const fileId = await getFileId();
    if (!fileId) {
        return null; // No file exists yet
    }

    const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    });

    return response.result;
};
