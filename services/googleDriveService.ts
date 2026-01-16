
// services/googleDriveService.ts

const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Ideally from env
const API_KEY = 'YOUR_GOOGLE_API_KEY';     // Ideally from env
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

/**
 * Initializes the GAPI client.
 */
async function initializeGapiClient() {
    await new Promise((resolve) => gapi.load('client', resolve));
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    });
    gapiInited = true;
}

/**
 * Initializes the Google Identity Services client.
 */
function initializeGisClient() {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined at request time
    });
    gisInited = true;
}

/**
 * Ensures Google libraries are loaded and initialized.
 */
async function ensureInit() {
    if (!gapiInited) await initializeGapiClient();
    if (!gisInited) initializeGisClient();
}

/**
 * Requests an access token from the user.
 */
async function getAccessToken(): Promise<string> {
    await ensureInit();
    return new Promise((resolve, reject) => {
        try {
            tokenClient.callback = (response: any) => {
                if (response.error !== undefined) {
                    reject(response);
                }
                resolve(response.access_token);
            };
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Opens the Google Picker to select a CSV file.
 */
export async function pickCsvFromDrive(): Promise<{ name: string; content: string } | null> {
    const token = await getAccessToken();
    
    return new Promise((resolve, reject) => {
        gapi.load('picker', () => {
            const picker = new (window as any).google.picker.PickerBuilder()
                .addView(new (window as any).google.picker.DocsView((window as any).google.picker.ViewId.DOCS)
                    .setMimeTypes('text/csv'))
                .setOAuthToken(token)
                .setDeveloperKey(API_KEY)
                .setCallback(async (data: any) => {
                    if (data.action === (window as any).google.picker.Action.PICKED) {
                        const fileId = data.docs[0].id;
                        const fileName = data.docs[0].name;
                        try {
                            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const content = await response.text();
                            resolve({ name: fileName, content });
                        } catch (e) {
                            reject(e);
                        }
                    } else if (data.action === (window as any).google.picker.Action.CANCEL) {
                        resolve(null);
                    }
                })
                .build();
            picker.setVisible(true);
        });
    });
}

/**
 * Uploads a string content as a CSV file to Google Drive.
 */
export async function uploadToDrive(fileName: string, content: string): Promise<boolean> {
    const token = await getAccessToken();
    
    const metadata = {
        name: fileName,
        mimeType: 'text/csv'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: 'text/csv' }));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
    });

    return response.ok;
}

// Global declaration for gapi and google
declare const gapi: any;
declare const google: any;
