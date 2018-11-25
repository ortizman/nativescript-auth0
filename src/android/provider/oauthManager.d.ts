import Activity = android.app.Activity;
import { CustomTabsOptions } from './customTabsOptions';
import { AuthCallback } from './authCallback';
import { AuthorizeResult } from './authorizeResult';
import { Credentials } from '../../common/credentials';
import { PKCE } from './pkce';
import { Auth0 } from '../auth0';
export declare class OAuthManager {
    private static readonly TAG;
    static readonly KEY_RESPONSE_TYPE: string;
    static readonly KEY_STATE: string;
    static readonly KEY_NONCE: string;
    static readonly KEY_CONNECTION: string;
    static readonly RESPONSE_TYPE_ID_TOKEN: string;
    static readonly RESPONSE_TYPE_CODE: string;
    private static readonly ERROR_VALUE_ACCESS_DENIED;
    private static readonly ERROR_VALUE_UNAUTHORIZED;
    private static readonly ERROR_VALUE_LOGIN_REQUIRED;
    private static readonly METHOD_SHA_256;
    private static readonly KEY_CODE_CHALLENGE;
    private static readonly KEY_CODE_CHALLENGE_METHOD;
    private static readonly KEY_CLIENT_ID;
    private static readonly KEY_REDIRECT_URI;
    private static readonly KEY_TELEMETRY;
    private static readonly KEY_ERROR;
    private static readonly KEY_ERROR_DESCRIPTION;
    private static readonly KEY_ID_TOKEN;
    private static readonly KEY_ACCESS_TOKEN;
    private static readonly KEY_TOKEN_TYPE;
    private static readonly KEY_REFRESH_TOKEN;
    private static readonly KEY_EXPIRES_IN;
    private static readonly KEY_CODE;
    private static readonly KEY_SCOPE;
    private readonly account;
    private readonly callback;
    private readonly parameters;
    private requestCode;
    private pkce;
    private hostedPageParams;
    private currentTimeInMillis;
    private ctOptions;
    private useBrowser;
    constructor(account: Auth0, callback: AuthCallback, parameters: {
        [key: string]: string;
    });
    setCustomTabsOptions(options: CustomTabsOptions | undefined): void;
    setPKCE(pkce: PKCE): void;
    setHostedPageParams(pageParams: {
        [key: string]: string;
    }): void;
    withBrowser(withBrowser: boolean): void;
    startAuthorization(activity: Activity, redirectUri: string, requestCode: number): void;
    resumeAuthorization(data: AuthorizeResult): boolean;
    private getCurrentTimeInMillis;
    setCurrentTimeInMillis(currentTimeInMillis: number): void;
    private assertNoError;
    static assertValidState(requestState: string, responseState: string | undefined): void;
    static assertValidNonce(requestNonce: string, idToken: string): void;
    private buildAuthorizeUri;
    private addPKCEParameters;
    private addValidationParameters;
    private addClientParameters;
    private createPKCE;
    private shouldUsePKCE;
    customTabsOptions(): CustomTabsOptions;
    static mergeCredentials(urlCredentials: Credentials, codeCredentials: Credentials): Credentials;
    static getRandomString(defaultValue: string | undefined): string;
    private static secureRandomString;
    private logDebug;
}
