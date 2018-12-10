export declare class InAppBrowserViewController extends UIViewController {
    private navigationBar;
    private webView;
    private _userContentController;
    private url;
    private static REMEMBER_KEY;
    private static DNI_KEY;
    private static USERCODE_KEY;
    private static NAME_KEY;
    private _hud;
    viewDidLoad(): void;
    loadUrl(url: NSURL): void;
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
