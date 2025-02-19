function injectScript(file) {
    const script = document.createElement("script");
    const scriptUrl = chrome.runtime.getURL(file);
    console.log("Injecting script at:", scriptUrl);  // Debug log
    script.src = scriptUrl;
    script.type = "text/javascript";
    script.async = false;
    document.documentElement.appendChild(script);
}

// Inject highlight.js into the page
injectScript("highlight.js");
