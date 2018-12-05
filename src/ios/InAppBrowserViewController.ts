import { TransactionStore } from './transactionStore';
import { AuthSession } from './authSession';

export class InAppBrowserViewController extends UIViewController {

    private navigationBar: UINavigationBar;
    private webView: WKWebView;
    private _userContentController: WKUserContentController;
    private url: NSURL;

    public viewDidLoad() {
        super.viewDidLoad();
        //this.view.backgroundColor = UIColor.orangeColor;        
        // Init Navigation-Bar
        let barButtonItem = UINavigationItem.alloc().initWithTitle("LOGIN");

        let cancelButton = UIBarButtonItem.alloc().initWithTitleStyleTargetAction("Cancel", UIBarButtonItemStyle.Plain, this, "cancel");
        barButtonItem.leftBarButtonItem = cancelButton;     
        let statusBarHeight = UIApplication.sharedApplication.statusBarFrame.size.height;

        this.navigationBar = UINavigationBar.alloc().initWithFrame(CGRectMake(0, statusBarHeight, this.view.frame.size.width, 40));
        
        //this.navigationBar.backgroundColor=UIColor.blueColor;

        this.navigationBar.items = NSArray.arrayWithObject(barButtonItem);

        this.view.addSubview(this.navigationBar);


        this._userContentController = WKUserContentController.new();
        const frame = CGRectMake(0, statusBarHeight+this.navigationBar.frame.size.height, this.view.frame.size.width, this.view.frame.size.height-this.navigationBar.frame.size.height-statusBarHeight);
        const config = WKWebViewConfiguration.new();
        config.userContentController = this._userContentController;
        this.webView = WKWebView.alloc().initWithFrameConfiguration(frame, config);
        this.webView.loadRequest(NSURLRequest.alloc().initWithURL(this.url));
        this.webView.navigationDelegate = WKNavigationDelegateImpl.initWithOwner(new WeakRef(this));
        this.view.addSubview(this.webView); 

     }



    // ---------------------------------------------------
    // These methods need to be exposed otherwise the runtime wouldn't find them
    // ---------------------------------------------------

    public loadUrl(url:NSURL):void{
        this.url=url;
    }

    public cancel(sender: UIButton): void {
        //console.log("NICOLLLLLLLAAAAAAAAA");
        TransactionStore.shared.clear();
        this.dismissViewControllerAnimatedCompletion(true, null);
    }

    public authOk(url:NSURL): void {
        TransactionStore.shared.resume(url, NSDictionary.dictionary());
    }

    public static ObjCExposedMethods = {
        "cancel": {returns: interop.types.void, params: [UIButton]}
    };

}

class WKNavigationDelegateImpl extends NSObject implements WKNavigationDelegate {
    static ObjCProtocols = [WKNavigationDelegate];
    private _owner: WeakRef<InAppBrowserViewController>;

    static initWithOwner(owner: WeakRef<InAppBrowserViewController>): WKNavigationDelegateImpl {
        const handler = <WKNavigationDelegateImpl>WKNavigationDelegateImpl.alloc().init();
        handler._owner = owner;
        return handler;
    }

    webViewDidStartProvisionalNavigation?(webView: WKWebView, navigation: WKNavigation): void{
        //this._owner.get().empezoACargar();
    }

    webViewDidReceiveServerRedirectForProvisionalNavigation?(webView: WKWebView, navigation: WKNavigation): void{
        /* console.log("VINO redirecciioooooooooonnnnnn");
        console.log(navigation); */
    } 

    webViewDecidePolicyForNavigationActionDecisionHandler?(webView: WKWebView, navigationAction: WKNavigationAction, decisionHandler: (p1: WKNavigationActionPolicy) => void): void{
        console.log("------------------------- webViewDecidePolicyForNavigationActionDecisionHandler --------------------");

        /* switch (navigationAction.navigationType) {
            case WKNavigationType.FormSubmitted:                
              console.log("-------- SE SUBMITEA --------");
              break;
        } */
        if (navigationAction.request.URL.absoluteString.indexOf("callback?code=")!=-1){
                this._owner.get().authOk(navigationAction.request.URL);
                decisionHandler(WKNavigationActionPolicy.Allow);            
        } else { 
            decisionHandler(WKNavigationActionPolicy.Allow);
        }
        
    }


    
   
}