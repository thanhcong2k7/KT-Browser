// js/components/colors.js

class Colors {
    constructor(webview) {
        this.webview = webview;
    }

    getForegroundColor(color) {
        var brightness = colorBrightness(color);
        if (brightness < 150) {
            return 'white';
        } else {
            return 'black';
        }
    }

    // New logic: Try Meta, Fallback to 'fallbackColor' (Favicon)
    getColor(fallbackColor, callback = null) {
        var t = this;
        if (this.webview != null) {
            // 1. Try to get <meta name="theme-color">
            t.webview.executeJavaScript("document.querySelector('meta[name=\"theme-color\"]')?.getAttribute('content')")
            .then(function (result) {
                var finalColor;

                if (result && result !== "") {
                    // Meta tag found! Use it.
                    finalColor = result;
                } else {
                    // No meta tag. Use the Favicon color (or white if that failed too)
                    finalColor = fallbackColor || "#ffffff";
                }

                if (typeof (callback) === 'function') {
                    callback({
                        foreground: t.getForegroundColor(finalColor),
                        background: finalColor
                    });
                }
            }).catch(err => {
                // If script fails (e.g. PDF), fallback to favicon
                if (typeof (callback) === 'function') {
                    callback({
                        foreground: t.getForegroundColor(fallbackColor || "#ffffff"),
                        background: fallbackColor || "#ffffff"
                    });
                }
            });
        }
    }
}