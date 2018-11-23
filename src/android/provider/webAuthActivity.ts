import ProgressBar = android.widget.ProgressBar;
import WebView = android.webkit.WebView;
import View = android.view.View;
import TextView = android.widget.TextView;
import Button = android.widget.Button;
import Bundle = android.os.Bundle;
import Log = android.util.Log;
import Uri = android.net.Uri;
import Intent = android.content.Intent;
import Context = android.content.Context;
import WebChromeClient = android.webkit.WebChromeClient;
import WebViewClient = android.webkit.WebViewClient;
import Bitmap = android.graphics.Bitmap
import Build = android.os.Build;
import WebSettings = android.webkit.WebSettings;
import ConnectivityManager = android.net.ConnectivityManager;
import NetworkInfo = android.net.NetworkInfo;
import Window = android.view.Window;
import WindowManager = android.view.WindowManager;
import ActionBar = android.support.v7.app.ActionBar;
import ApplicationInfo = android.content.pm.ApplicationInfo;
import { EXTRA_PAGE_PARAMS } from "./authenticationActivity";

const TAG: string = 'WebAuthActivity';

export const KEY_REDIRECT_URI: string = "redirect_uri";
export const CONNECTION_NAME_EXTRA: string = "serviceName";
export const FULLSCREEN_EXTRA: string = "fullscreen";

@JavaProxy('org.nativescript.auth0.WebAuthActivity')
export class WebAuthActivity extends android.support.v7.app.AppCompatActivity {

    constructor() {
        super();
        return global.__native(this);
    }

    private webView: WebView;
    private progressBar: ProgressBar;
    private errorView: View;
    private errorMessage: TextView;

    public onCreate(savedInstanceState?: Bundle) {
        Log.d(TAG, "Creating a WebAuthActivity for navigating to " + this.getIntent().getData().toString());
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= 19) {
            if (0 != (this.getApplicationInfo().flags = ApplicationInfo.FLAG_DEBUGGABLE)) {
                WebView['setWebContentsDebuggingEnabled'](true);
            }
        }

        if (this.getIntent().getBooleanExtra(FULLSCREEN_EXTRA, false)) {
            this.setFullscreenMode();
        }

        let layout = this.getResources().getIdentifier("com_auth0_activity_web_auth", "layout", this.getPackageName())

        this.setContentView(layout);
        const bar: ActionBar = this.getSupportActionBar();

        if (bar != null) {
            let serviceName: string = this.getIntent().getStringExtra(CONNECTION_NAME_EXTRA);
            bar.setIcon(android.R.color.transparent);
            bar.setDisplayShowTitleEnabled(false);
            bar.setDisplayUseLogoEnabled(false);
            bar.setDisplayHomeAsUpEnabled(false);
            bar.setDisplayShowCustomEnabled(true);
            bar.setTitle(serviceName);
        }

        let lockView = this.getResources().getIdentifier("com_auth0_lock_webview", "id", this.getPackageName())
        let lockProgressBar = this.getResources().getIdentifier("com_auth0_lock_progressbar", "id", this.getPackageName())
        let lockError = this.getResources().getIdentifier("com_auth0_lock_error_view", "id", this.getPackageName())
        let lockText = this.getResources().getIdentifier("com_auth0_lock_text", "id", this.getPackageName())
        let lockRetry = this.getResources().getIdentifier("com_auth0_lock_retry", "id", this.getPackageName())


        this.webView = this.findViewById(lockView) as WebView;
        this.webView.setVisibility(View.INVISIBLE);

        this.progressBar = this.findViewById(lockProgressBar) as ProgressBar;
        this.progressBar.setIndeterminate(true);
        this.progressBar.setMax(100);
        this.errorView = this.findViewById(lockError);
        this.errorView.setVisibility(View.GONE);
        this.errorMessage = this.findViewById(lockText) as TextView;
        let retryButton: Button = this.findViewById(lockRetry) as Button;
        var thiz = this;

        @Interfaces([android.view.View.OnClickListener])
        class MyListener extends java.lang.Object implements View.OnClickListener {
            public onClick(v: View) {
                thiz.errorView.setVisibility(View.GONE);
                Log.v(TAG, 'Retrying to load failed URL');
                thiz.startUrlLoading();
            }
        }

        retryButton.setOnClickListener(new MyListener());

        this.startUrlLoading();
    }


    public onWindowFocusChanged(hasFocus: boolean): void {
        super.onWindowFocusChanged(hasFocus);
        if (this.getIntent().getBooleanExtra(FULLSCREEN_EXTRA, false)) {
            this.setFullscreenMode();
        }
    }

    private startUrlLoading(): void {
        if (!this.isNetworkAvailable()) {
            this.renderLoadError('La conexión a internet no esta disponible');
            return;
        }

        const intent: Intent = this.getIntent();
        const uri: Uri = intent.getData();
        const redirectUrl: string = uri.getQueryParameter(KEY_REDIRECT_URI);

        let thiz = this;
        this.webView.setWebChromeClient(new class extends WebChromeClient {
            public onProgressChanged(view: WebView, newProgress: number): void {
                super.onProgressChanged(view, newProgress);
                if (newProgress > 0) {
                    thiz.progressBar.setIndeterminate(false);
                    thiz.progressBar.setProgress(newProgress);
                }
            }
        });

        this.webView.setWebViewClient(new class extends WebViewClient {

            public shouldOverrideUrlLoading(view: WebView, url: any): boolean {

                let urlString = url.getUrl ? url.getUrl().toString() : url.toString();
                if (urlString.startsWith(redirectUrl)) {
                    Log.v(TAG, "Redirect URL was called");
                    const intent: Intent = new Intent();
                    intent.setData(Uri.parse(urlString));
                    thiz.setResult(android.app.Activity.RESULT_OK, intent);
                    thiz.finish();
                    return true;
                }
                view.setVisibility(View.VISIBLE);
                return false;
            }


            public onPageFinished(view: WebView, url: string) {
                super.onPageFinished(view, url);
                thiz.progressBar.setProgress(0);
                thiz.progressBar.setIndeterminate(true);
                thiz.progressBar.setVisibility(View.GONE);
                const isShowingError: boolean = thiz.errorView.getVisibility() == View.VISIBLE;

                let params = thiz.getIntent().getStringExtra(EXTRA_PAGE_PARAMS);
                // load username and dni
                let functionInvoke = "loadParameters(" + params + ")";
                if (android.os.Build.VERSION.SDK_INT >= 19) {
                    view['evaluateJavascript'](functionInvoke, null);
                } else {
                    view.loadUrl(functionInvoke);
                }

                thiz.webView.setVisibility(isShowingError ? View.INVISIBLE : View.VISIBLE);
            }


            public onPageStarted(view: WebView, url: string, favicon: Bitmap) {
                super.onPageStarted(view, url, favicon);
                thiz.progressBar.setProgress(0);
                thiz.progressBar.setVisibility(View.VISIBLE);
            }

            public onReceivedError(view: WebView, errorCode: number, description, failingUrl?: string) {
                Log.w(TAG, 'Load error ' + errorCode + ' description: ' + description);
                let desc = description.getDescription ? description.getDescription() : description;
                thiz.renderLoadError(desc);
                super.onReceivedError(view, errorCode, desc, failingUrl);
            }

        });
        const settings: WebSettings = thiz.webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        thiz.webView.loadUrl(uri.toString());
    }

    private renderLoadError(description: string): void {
        this.errorMessage.setText(description);
        this.webView.setVisibility(View.INVISIBLE);
        this.errorView.setVisibility(View.VISIBLE);
    }

    private isNetworkAvailable(): boolean {
        let available: boolean = true;
        let connectivityManager: ConnectivityManager = this.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager;
        try {
            let activeNetworkInfo: NetworkInfo = connectivityManager.getActiveNetworkInfo();
            available = activeNetworkInfo != null && activeNetworkInfo.isConnectedOrConnecting();
            Log.v(TAG, "Is network available? " + available);
        } catch (e) {
            Log.w(TAG, "Could not check for Network status. Please, be sure to include the android.permission.ACCESS_NETWORK_STATE permission in the manifest");
        }

        return available;
    }

    private setFullscreenMode(): void {
        Log.d(TAG, "Activity in fullscreen mode");
        const window: Window = this.getWindow();
        if (Build.VERSION.SDK_INT >= 16) {
            let decorView: View = window.getDecorView();
            let uiOptions: number = View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;
            decorView.setSystemUiVisibility(uiOptions);
        } else {
            window.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        }
    }
}