'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackMetaPageView } from '@/lib/meta-pixel';

type MetaPixelProps = {
    pixelId: string;
};

export function MetaPixel({ pixelId }: MetaPixelProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isFirstRender = useRef(true);
    const queryString = searchParams.toString();

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        trackMetaPageView();
    }, [pathname, queryString]);

    return (
        <Script id="meta-pixel" strategy="afterInteractive">
            {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
            `}
        </Script>
    );
}
