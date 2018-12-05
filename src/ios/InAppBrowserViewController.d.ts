export declare class InAppBrowserViewController extends UIViewController {
    private navigationBar;
    private webView;
    private _userContentController;
    private url;
    viewDidLoad(): void;
    loadUrl(url: NSURL): void;
    cancel(sender: UIButton): void;
    authOk(url: NSURL): void;
    static ObjCExposedMethods: {
        "cancel": {
            returns: interop.Type<void>;
            params: (typeof UIButton)[];
        };
    };
}
