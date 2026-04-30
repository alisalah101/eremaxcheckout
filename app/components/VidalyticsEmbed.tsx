"use client";

import { useEffect, useRef } from "react";

type VidalyticsEmbedProps = {
  embedKey: string;
  className?: string;
};

function hidePoweredByNodes(root: HTMLElement) {
  root.querySelectorAll("a[href]").forEach((el) => {
    const href = (el as HTMLAnchorElement).href.toLowerCase();
    if (
      href.includes("vidalytics.com/powered-by") ||
      href.includes("vidalytics.com/powered")
    ) {
      (el as HTMLElement).style.setProperty("display", "none", "important");
    }
  });
}

/** Same embed pattern as secure.buyfortivirmax.com (Vidalytics). */
export default function VidalyticsEmbed({
  embedKey,
  className = "",
}: VidalyticsEmbedProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mountId = `vidalytics_embed_${embedKey}`;
    root.innerHTML = "";
    const mount = document.createElement("div");
    mount.id = mountId;
    root.appendChild(mount);

    const script = document.createElement("script");
    script.textContent = `(function (v, i, d, a, l, y, t, c, s) {
    y='_'+d.toLowerCase();c=d+'L';if(!v[d]){v[d]={};}if(!v[c]){v[c]={};}if(!v[y]){v[y]={};}var vl='Loader',vli=v[y][vl],vsl=v[c][vl + 'Script'],vlf=v[c][vl + 'Loaded'],ve='Embed';
    if (!vsl){vsl=function(u,cb){
        if(t){cb();return;}s=i.createElement("script");s.type="text/javascript";s.async=1;s.src=u;
        if(s.readyState){s.onreadystatechange=function(){if(s.readyState==="loaded"||s.readyState==="complete"){s.onreadystatechange=null;vlf=1;cb();}};}else{s.onload=function(){vlf=1;cb();};}
        i.getElementsByTagName("head")[0].appendChild(s);
    };}
    vsl(l+'loader.min.js',function(){if(!vli){var vlc=v[c][vl];vli=new vlc();}vli.loadScript(l+'player.min.js',function(){var vec=v[d][ve];t=new vec();t.run(a);});});
})(window, document, 'Vidalytics', '${mountId}', 'https://fast.vidalytics.com/embeds/lY759UtN/${embedKey}/');`;
    root.appendChild(script);

    return () => {
      root.innerHTML = "";
    };
  }, [embedKey]);

  // Block default context menu on the embed (removes browser menu items such as
  // "Powered by Vidalytics" when the player is same-origin under this node).
  // Also hide any Vidalytics marketing links the player injects into the DOM.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const blockContextMenu = (e: Event) => {
      e.preventDefault();
    };
    root.addEventListener("contextmenu", blockContextMenu, true);

    const iframeBlock = (e: Event) => {
      e.preventDefault();
    };

    const attachIframeListeners = () => {
      root.querySelectorAll("iframe").forEach((fr) => {
        fr.removeEventListener("contextmenu", iframeBlock);
        fr.addEventListener("contextmenu", iframeBlock);
      });
    };

    const observer = new MutationObserver(() => {
      hidePoweredByNodes(root);
      attachIframeListeners();
    });
    observer.observe(root, { childList: true, subtree: true });
    hidePoweredByNodes(root);
    attachIframeListeners();

    const poll = window.setInterval(() => {
      hidePoweredByNodes(root);
      attachIframeListeners();
    }, 1500);

    return () => {
      root.removeEventListener("contextmenu", blockContextMenu, true);
      root.querySelectorAll("iframe").forEach((fr) => {
        fr.removeEventListener("contextmenu", iframeBlock);
      });
      observer.disconnect();
      window.clearInterval(poll);
    };
  }, [embedKey]);

  return (
    <div
      ref={rootRef}
      className={`vidalytics-embed-root rounded-[10px] overflow-hidden w-full [&_video]:rounded-[10px] ${className}`}
    />
  );
}
