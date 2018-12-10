import { TransactionStore } from './transactionStore';
import { AuthSession } from './authSession';

export class InAppBrowserViewController extends UIViewController {

    private navigationBar: UINavigationBar;
    private webView: WKWebView;
    private _userContentController: WKUserContentController;
    private url: NSURL;
    
    private static REMEMBER_KEY: string="REMEMBER";
    private static DNI_KEY: string="dni";
    private static USERCODE_KEY: string="usercode";
    private static NAME_KEY: string="name";

    private _hud: any;



    public viewDidLoad() {
        super.viewDidLoad();

        let statusBarHeight = UIApplication.sharedApplication.statusBarFrame.size.height;
        
        
        let barButtonItem = UINavigationItem.alloc().initWithTitle("Cargando....");

        let cancelButton = UIBarButtonItem.alloc().initWithTitleStyleTargetAction("Cancel", UIBarButtonItemStyle.Plain, this, "cancel");
        barButtonItem.leftBarButtonItem = cancelButton;        

        this.navigationBar = UINavigationBar.alloc().initWithFrame(CGRectMake(0, statusBarHeight, this.view.frame.size.width, 40));

        this.navigationBar.items = NSArray.arrayWithObject(barButtonItem);

        this.view.addSubview(this.navigationBar); 
        

        this._userContentController = WKUserContentController.new();

        this.includeInitJavascript(this._userContentController);
        

        
        //const frame = CGRectMake(0, statusBarHeight+this.navigationBar.frame.size.height, this.view.frame.size.width, this.view.frame.size.height-this.navigationBar.frame.size.height-statusBarHeight);

        const frame = CGRectMake(0, 20, this.view.frame.size.width, this.view.frame.size.height-statusBarHeight);
        const config = WKWebViewConfiguration.new();
        config.userContentController = this._userContentController;
        this.webView = WKWebView.alloc().initWithFrameConfiguration(frame, config);
        this.webView.loadRequest(NSURLRequest.alloc().initWithURL(this.url));
        
        this.webView.navigationDelegate = WKNavigationDelegateImpl.initWithOwner(new WeakRef(this));
        this.webView.allowsBackForwardNavigationGestures = true;
        this.view.addSubview(this.webView); 
        
        this.webView.hidden=true;

     }

    // ---------------------------------------------------
    // These methods need to be exposed otherwise the runtime wouldn't find them
    // ---------------------------------------------------

    public loadUrl(url:NSURL):void{
        this.url=url;
    }

    private includeInitJavascript(userContentController: WKUserContentController): void{
        if (NSUserDefaults.standardUserDefaults.boolForKey(InAppBrowserViewController.REMEMBER_KEY)!=null && NSUserDefaults.standardUserDefaults.boolForKey(InAppBrowserViewController.REMEMBER_KEY)){
            let scriptSource = `loadParameters({"${InAppBrowserViewController.DNI_KEY}": "${NSUserDefaults.standardUserDefaults.stringForKey(InAppBrowserViewController.DNI_KEY)}","${InAppBrowserViewController.USERCODE_KEY}": "${NSUserDefaults.standardUserDefaults.stringForKey(InAppBrowserViewController.USERCODE_KEY)}", "${InAppBrowserViewController.NAME_KEY}": "${NSUserDefaults.standardUserDefaults.stringForKey(InAppBrowserViewController.NAME_KEY)}"})`;

            let script = WKUserScript.alloc().initWithSourceInjectionTimeForMainFrameOnly(scriptSource, WKUserScriptInjectionTime.AtDocumentEnd, true);
            this._userContentController.addUserScript(script);
        }        
    }

    public setDefaults(remember: boolean, dni?:string , usercode?: string, name?:string): void {
        NSUserDefaults.standardUserDefaults.setBoolForKey(remember, InAppBrowserViewController.REMEMBER_KEY);
        if(remember){
            NSUserDefaults.standardUserDefaults.setObjectForKey(dni, InAppBrowserViewController.DNI_KEY);
            NSUserDefaults.standardUserDefaults.setObjectForKey(usercode, InAppBrowserViewController.USERCODE_KEY);
            NSUserDefaults.standardUserDefaults.setObjectForKey(name, InAppBrowserViewController.NAME_KEY);

        } else {
            NSUserDefaults.standardUserDefaults.removeObjectForKey(InAppBrowserViewController.DNI_KEY);
            NSUserDefaults.standardUserDefaults.removeObjectForKey(InAppBrowserViewController.USERCODE_KEY);
            NSUserDefaults.standardUserDefaults.removeObjectForKey(InAppBrowserViewController.NAME_KEY);
        }
    }

    public cancel(sender: UIButton): void {
        TransactionStore.shared.clear();
        this.dismissViewControllerAnimatedCompletion(true, null);
    }

    public authCancel(): void {
        TransactionStore.shared.clear();
        this.dismissViewControllerAnimatedCompletion(true, null);
    }

    public authOk(url:NSURL): void {
        TransactionStore.shared.resume(url, NSDictionary.dictionary());
    }

    public static ObjCExposedMethods = {
        "cancel": {returns: interop.types.void, params: [UIButton]}
    };

    public _onLoadFinished(url: string, error?: string) {
        this.webView.hidden=false;
        this.navigationBar.hidden=true;
    }


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

    webViewDidFinishNavigation(webView: WKWebView, navigation: WKNavigation): void {
        console.log("------------------- FINISH");
        if (webView.URL.absoluteString.indexOf("/login")!=-1){
            this._owner.get()._onLoadFinished(webView.URL.absoluteString);
        }
      }

    webViewDecidePolicyForNavigationActionDecisionHandler?(webView: WKWebView, navigationAction: WKNavigationAction, decisionHandler: (p1: WKNavigationActionPolicy) => void): void{
        console.log("------------------------- webViewDecidePolicyForNavigationActionDecisionHandler --------------------");
        if (navigationAction.request.URL.absoluteString.indexOf("callback?code=")!=-1){
            console.log("--------------------- CALLBACK CODE -----------------");
            let scriptSource:string="$('#remember-data').is(':checked') || !$('#greeting').hasClass('d-none')? $('#login-username').val()+'/'+$('#login-usercode').val() : null; ";
            webView.evaluateJavaScriptCompletionHandler(scriptSource, (result: string, error)=>{
                if (result!=null && result!="null"){
                    let arreglo: string[]=result.split("/");
                    this._owner.get().setDefaults(true, arreglo[0], arreglo[1], arreglo[0]);
                } else {
                    this._owner.get().setDefaults(false);
                } 
                decisionHandler(WKNavigationActionPolicy.Allow);               
                this._owner.get().authOk(navigationAction.request.URL);
                
            });                          
        } else if (navigationAction.request.URL.absoluteString.indexOf("naranja://webview.back")!=-1){ 
            decisionHandler(WKNavigationActionPolicy.Allow);               
            this._owner.get().authCancel();
        } else {
            decisionHandler(WKNavigationActionPolicy.Allow);
        }
        
    }


    
   
}