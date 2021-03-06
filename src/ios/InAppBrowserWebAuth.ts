import { device } from 'tns-core-modules/platform/platform';

import { ControllerModalPresenter } from './controllerModalPresenter';
import { Credentials } from '../common/credentials';
import { Logger } from './logger';
import { ResponseType } from './responseType';
import { Telemetry } from './telemetry';
import { TransactionStore } from './transactionStore';
import { WebAuth } from './webAuth';
import { a0_encodeBase64URLSafe, invokeOnRunLoop, jsArrayToNSArray, nsArrayToJSArray } from './utils';
import { WebAuthError } from './webAuthError';
import { Result } from './result';
import { SafariAuthenticationSession } from './safariAuthenticationSession';
import { SafariSession } from './safariSession';
import { OAuth2Grant, PKCE, ImplicitGrant } from './oauth2Grant';
import { SafariAuthenticationSessionCallback } from './safariAuthenticationSessionCallback';
import { SilentSafariViewController } from './silentSafariViewController';
import { Auth0Authentication } from './auth0Authentication';
import { InAppBrowserViewController } from './InAppBrowserViewController';
import { AuthSession } from './authSession';
import {
    WebAuthOptions, CredentialsExtrasKey
} from './../auth0-common';

export class InAppBrowserWebAuth extends WebAuth {

    static NoBundleIdentifier = 'com.auth0.this-is-no-bundle-webview';

    public readonly clientId: string;
    public readonly url: NSURL;
    public telemetry: Telemetry;

    public readonly presenter: ControllerModalPresenter;
    public readonly storage: TransactionStore;
    public logger: Logger | undefined;
    public parameters: { [param: string]: string } = {};
    public universalLink = false;
    public responseType: ResponseType[] = [ResponseType.code];
    public nonce: string | undefined;
    private authenticationSession: boolean = true;
    private options: WebAuthOptions;


    public static init(clientId: string, url: NSURL, presenter: ControllerModalPresenter = new ControllerModalPresenter(), telemetry: Telemetry = new Telemetry()): InAppBrowserWebAuth {
        return new InAppBrowserWebAuth(clientId, url, presenter, TransactionStore.shared, telemetry, null);
    }

    public static initWithOptions(clientId: string, url: NSURL, options: WebAuthOptions): InAppBrowserWebAuth {
        let presenter: ControllerModalPresenter = new ControllerModalPresenter();
        let telemetry: Telemetry = new Telemetry();
        return new InAppBrowserWebAuth(clientId, url, presenter, TransactionStore.shared, telemetry, options);
    }

    constructor(clientId: string, url: NSURL, presenter: ControllerModalPresenter, storage: TransactionStore, telemetry: Telemetry, options: WebAuthOptions) {
        super();
        this.clientId = clientId;
        this.url = url;
        this.presenter = presenter;
        this.storage = storage;
        this.telemetry = telemetry;
        this.options=options;
    }

    public useUniversalLink(): this {
        this.universalLink = true;
        return this;
    }

    public setConnection(connection: string): this {
        this.parameters["connection"] = connection;
        return this;
    }

    public setScope(scope: string): this {
        this.parameters["scope"] = scope;
        return this;
    }

    public setConnectionScope(connectionScope: string): this {
        this.parameters["connection_scope"] = connectionScope;
        return this;
    }

    public setState(state: string): this {
        this.parameters["state"] = state;
        return this;
    }

    public setParameters(parameters: { [param: string]: string }): this {
        for (const key in parameters) {
            this.parameters[key] = parameters[key];
        }
        return this;
    }

    public setResponseType(responseType: ResponseType[]): this {
        this.responseType = responseType;
        return this;
    }

    public setNonce(nonce: string): this {
        this.nonce = nonce;
        return this;
    }

    public usingImplicitGrant(): this {
        return this.setResponseType([ResponseType.token]);
    }

    public setAudience(audience: string): this {
        this.parameters["audience"] = audience;
        return this;
    }

    public useLegacyAuthentication(): this {
        this.authenticationSession = false;
        return this;
    }

    public start(callback: (result: Result<Credentials>) => void) {
        const redirectURL = this.redirectURL;
        if (redirectURL == null || redirectURL.absoluteString.startsWith(InAppBrowserWebAuth.NoBundleIdentifier)) {
            return callback({
                failure: WebAuthError.noBundleIdentifierFound
            });
        }
        if (this.responseType.indexOf(ResponseType.idToken) > -1) {
            if (this.nonce == null) {
                return callback({
                    failure: WebAuthError.noNonceProvided
                });
            }
        }
        let handler = this.handler(redirectURL);
        let state = this.parameters["state"] || generateDefaultState();
        let authorizeURL = this.buildAuthorizeURL(redirectURL, handler.defaults, state);

        const { controller, finish } = this.newInAppBrowser(authorizeURL, callback);        
        const session = new AuthSession(redirectURL, state, handler, finish, this.logger);

        controller.loadUrl(authorizeURL);
        controller.setOptions(this.options);
        controller.init();
        controller.setRedirectUri(redirectURL.absoluteString);
        this.presenter.present(controller);

        this.storage.store(session);
    }

    public newInAppBrowser(authorizeURL: NSURL, callback: (result: Result<Credentials>) => void): { controller: InAppBrowserViewController, finish: (result: Result<Credentials>) => void } {
        let controller = new InAppBrowserViewController({coder: null});        

        let finish: (result: Result<Credentials>) => void = (result: Result<Credentials>) => {
            const presenting = (controller != null) ? controller.presentingViewController : undefined;
            if (presenting == null) {
                return callback({
                    failure: WebAuthError.cannotDismissWebAuthController
                });
            }

            if (result.failure != null && result.failure === WebAuthError.userCancelled) {
                invokeOnRunLoop(() => {
                    callback(result);
                });
            } else {
                invokeOnRunLoop(() => {
                    if (result.success){
                        let remember:boolean=NSUserDefaults.standardUserDefaults.boolForKey(CredentialsExtrasKey.REMEMBER);
                        result.success.extras={};
                        if (remember){
                            result.success.extras.remember="true";
                            result.success.extras.dni=NSUserDefaults.standardUserDefaults.stringForKey(CredentialsExtrasKey.DNI);
                            result.success.extras.usercode=NSUserDefaults.standardUserDefaults.stringForKey(CredentialsExtrasKey.USERCODE);
                            result.success.extras.username=NSUserDefaults.standardUserDefaults.stringForKey(CredentialsExtrasKey.USERNAME);
                        } else {
                            result.success.extras.remember="false";
                            result.success.extras.dni=null;
                            result.success.extras.usercode=null;
                            result.success.extras.username=null;
                        }                            
                    }
                    presenting.dismissViewControllerAnimatedCompletion(false, () => {                        
                        callback(result);
                        controller.dispose();
                    });
                });
            }
        };
        return { controller, finish };
    }

    public buildAuthorizeURL(redirectURL: NSURL, defaults: { [key: string]: string }, state: string | undefined): NSURL {
        const authorize = new NSURL({ string: "/authorize", relativeToURL: this.url });
        let components = new NSURLComponents({ URL: authorize, resolvingAgainstBaseURL: true });
        let items: NSURLQueryItem[] = [];
        let entries = defaults;
        entries["client_id"] = this.clientId;
        entries["redirect_uri"] = redirectURL.absoluteString;
        entries["scope"] = "openid";
        entries["state"] = state;
        entries["response_type"] = this.responseType.map((x) => x.label).join(" ");
        if (this.responseType.indexOf(ResponseType.idToken) > -1) {
            entries["nonce"] = this.nonce;
        }
        for (const key in this.parameters) {
            entries[key] = this.parameters[key];
        }

        for (const key in entries) {
            items.push(new NSURLQueryItem({ name: key, value: entries[key] }));
        }

        components.queryItems = jsArrayToNSArray(this.telemetry.queryItemsWithTelemetry(items));
        return components.URL;
    }

    public handler(redirectURL: NSURL): OAuth2Grant {
        if (this.responseType.indexOf(ResponseType.code) > -1) {
            const authentication = new Auth0Authentication(this.clientId, this.url, this.telemetry);
            authentication.logger = this.logger;
            return PKCE.init(authentication, redirectURL, this.responseType, this.nonce);
        } else {
            return new ImplicitGrant(this.responseType, this.nonce);
        }
    }

    public get redirectURL(): NSURL | undefined {
        const bundleIdentifier = NSBundle.mainBundle.bundleIdentifier || InAppBrowserWebAuth.NoBundleIdentifier;
        const components = new NSURLComponents({ URL: this.url, resolvingAgainstBaseURL: true });
        if (components != null && components.URL != null) {
        components.scheme = this.universalLink ? "https" : bundleIdentifier;
        return components.URL
            .URLByAppendingPathComponent("ios")
            .URLByAppendingPathComponent(bundleIdentifier)
            .URLByAppendingPathComponent("callback");
        } else {
            return undefined;
        }
    }

    public clearSession(federated: boolean, callback: (success: boolean) => void) {
        const logoutURL = federated
            ? new NSURL({ string: "/v2/logout?federated", relativeToURL: this.url })
            : new NSURL({ string: "/v2/logout", relativeToURL: this.url });
        if (Number(device.osVersion.split('.')[0]) >= 11.0 && this.authenticationSession) {
            const returnTo = new NSURLQueryItem({ name: "returnTo", value: (this.redirectURL != null) ? this.redirectURL.absoluteString : undefined });
            const clientId = new NSURLQueryItem({ name: "client_id", value: this.clientId });
            const components = new NSURLComponents({ URL: logoutURL, resolvingAgainstBaseURL: true });
            const queryItems = (components.queryItems != null) ? nsArrayToJSArray(components.queryItems) : [];
            components.queryItems = jsArrayToNSArray([...queryItems, returnTo, clientId]);
            const clearSessionURL = components.URL;
            const redirectURL = returnTo.value;
            if (clearSessionURL == null || redirectURL == null) {
                return callback(false);
            }
            const clearSession = new SafariAuthenticationSessionCallback(clearSessionURL, redirectURL, callback);
            this.storage.store(clearSession);
        } else {
            let controller = SilentSafariViewController.alloc().initWithURLCallback(logoutURL, (result) => callback(result));
            if (this.logger != null) {
                this.logger.trace(logoutURL, "Safari");
            }
            this.presenter.present(controller);
        }
    }
}

function generateDefaultState(): string | undefined {
    let data = new NSMutableData({ length: 32 });
    const result = SecRandomCopyBytes(kSecRandomDefault, data.length, data.mutableBytes);

    if (result !== 0) {
        return undefined;
    }
    return a0_encodeBase64URLSafe(data);
}
