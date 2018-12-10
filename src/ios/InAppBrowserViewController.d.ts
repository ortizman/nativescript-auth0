import { WebAuthOptions } from './../auth0-common';
export declare class InAppBrowserViewController extends UIViewController {
    private navigationBar;
    private webView;
    private _userContentController;
    private url;
    private options;
    private _hud;
    viewDidLoad(): void;
    loadUrl(url: NSURL): void;
    setOptions(options: WebAuthOptions): void;
    private includeInitJavascript;
    setDefaults(remember: boolean, dni?: string, usercode?: string, name?: string): void;
    cancel(sender: UIButton): void;
    authCancel(): void;
    authOk(url: NSURL): void;
    static ObjCExposedMethods: {
        "cancel": {
            returns: interop.Type<void>;
            params: (typeof UIButton)[];
        };
    };
    _onLoadFinished(url: string, error?: string): void;
}
