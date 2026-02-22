(function(){
    const PAGE_COUNT=604;
    const CACHE_NAME='kiuma-mushaf-1405-cache';
    const LAST_PAGE_KEY='mushaf1405_last_page';
    const DEFAULT_CONFIG={baseUrl:'./mushaf/1405/pages',ext:'webp',pad:3,prefix:'',suffix:''};

    function toAbsoluteUrl(url){
        try{
            return new URL(url, location.href).href;
        }catch(e){
            return url;
        }
    }

    function loadConfig(){
        try{
            const raw=localStorage.getItem('mushaf1405_config');
            if(!raw) return DEFAULT_CONFIG;
            const parsed=JSON.parse(raw);
            return {
                baseUrl:typeof parsed.baseUrl==='string'&&parsed.baseUrl?parsed.baseUrl:DEFAULT_CONFIG.baseUrl,
                ext:typeof parsed.ext==='string'&&parsed.ext?parsed.ext:DEFAULT_CONFIG.ext,
                pad:typeof parsed.pad==='number'&&parsed.pad?parsed.pad:DEFAULT_CONFIG.pad,
                prefix:typeof parsed.prefix==='string'?parsed.prefix:DEFAULT_CONFIG.prefix,
                suffix:typeof parsed.suffix==='string'?parsed.suffix:DEFAULT_CONFIG.suffix
            };
        }catch(e){
            return DEFAULT_CONFIG;
        }
    }

    function padNum(n,len){
        const s=String(n);
        return s.length>=len?s:'0'.repeat(len-s.length)+s;
    }

    function buildPageUrl(cfg,page){
        const file=cfg.prefix+padNum(page,cfg.pad)+cfg.suffix+'.'+cfg.ext;
        let base=cfg.baseUrl||'';
        if(base.endsWith('/')) base=base.slice(0,-1);
        return base+'/'+file;
    }

    function getInitialPage(){
        const qs=new URLSearchParams(location.search);
        const q=qs.get('page');
        const fromQuery=q?parseInt(q):NaN;
        if(fromQuery>=1&&fromQuery<=PAGE_COUNT) return fromQuery;
        const fromStorage=parseInt(localStorage.getItem(LAST_PAGE_KEY)||'1');
        if(fromStorage>=1&&fromStorage<=PAGE_COUNT) return fromStorage;
        return 1;
    }

    async function isPageCached(url){
        if(!('caches' in window)) return false;
        try{
            const cache=await caches.open(CACHE_NAME);
            const abs=toAbsoluteUrl(url);
            const match1=await cache.match(abs);
            if(match1) return true;
            const req=new Request(abs,{mode:'no-cors'});
            const match2=await cache.match(req);
            return !!match2;
        }catch(e){
            return false;
        }
    }

    async function showCachedPillIfNeeded(url){
        const pill=document.getElementById('offlinePill');
        if(!pill) return;
        const cached=await isPageCached(url);
        if(cached){
            pill.classList.add('show');
        }else{
            pill.classList.remove('show');
        }
    }

    function setDownloadUI(state){
        const progress=document.getElementById('downloadProgress');
        const label=document.getElementById('downloadLabel');
        const btn=document.getElementById('downloadBtn');
        if(progress){
            progress.classList.toggle('show',!!state.showProgress);
        }
        if(label){
            label.textContent=state.label||'';
        }
        if(btn){
            btn.disabled=!!state.disableButton;
            btn.style.opacity=btn.disabled?'0.7':'1';
        }
    }

    async function fetchAndCache(cache,url){
        const abs=toAbsoluteUrl(url);
        try{
            const req=new Request(abs,{cache:'no-store'});
            const res=await fetch(req);
            if(res && res.ok){
                await cache.put(req,res.clone());
                return true;
            }
            return false;
        }catch(e){
            try{
                const req=new Request(abs,{mode:'no-cors'});
                const res=await fetch(req);
                if(res){
                    await cache.put(req,res.clone());
                    return true;
                }
                return false;
            }catch(e2){
                return false;
            }
        }
    }

    async function getCachedPageSet(cfg){
        const set=new Set();
        if(!('caches' in window)) return set;
        const base=(cfg.baseUrl||'').replace(/\/+$/,'');
        const baseHref=base ? toAbsoluteUrl(base + '/') : '';
        try{
            const cache=await caches.open(CACHE_NAME);
            const keys=await cache.keys();
            keys.forEach(k=>{
                if(!k || !k.url) return;
                if(!baseHref) return;
                if(k.url.startsWith(baseHref)) set.add(k.url);
            });
        }catch(e){}
        return set;
    }

    async function downloadAllPages(cfg){
        if(!('caches' in window)){
            alert('Offline cache is not supported in this browser.');
            return;
        }

        const proceed=confirm('This will download all 604 Mushaf pages for offline use. It may use a lot of data and storage. Continue?');
        if(!proceed) return;

        const cache=await caches.open(CACHE_NAME);
        const cachedSet=await getCachedPageSet(cfg);

        const urls=[];
        for(let p=1;p<=PAGE_COUNT;p++){
            const url=buildPageUrl(cfg,p);
            if(!cachedSet.has(new URL(url,location.href).href)){
                urls.push(url);
            }
        }

        const total=urls.length;
        if(total===0){
            alert('All pages are already available offline.');
            return;
        }

        const bar=document.getElementById('downloadProgressBar');
        let done=0;
        const concurrency=3;
        const queue=urls.slice();
        let failed=0;

        setDownloadUI({showProgress:true,disableButton:true,label:'Downloading pages...'});
        if(bar) bar.style.width='0%';

        async function worker(){
            while(queue.length){
                const url=queue.shift();
                const ok=await fetchAndCache(cache,url);
                if(!ok) failed++;
                done++;
                if(bar){
                    bar.style.width=((done/total)*100).toFixed(1)+'%';
                }
                setDownloadUI({showProgress:true,disableButton:true,label:`Downloaded ${done}/${total}${failed?` (failed ${failed})`:''}`});
            }
        }

        const workers=[];
        for(let i=0;i<concurrency;i++) workers.push(worker());
        await Promise.all(workers);

        setDownloadUI({showProgress:false,disableButton:false,label:''});

        if(failed===0){
            alert('Mushaf pages downloaded for offline use.');
        }else{
            alert('Download finished with some failures. Check your connection or the image source path.');
        }
    }

    function init(){
        const cfg=loadConfig();
        const img=document.getElementById('mushafImg');
        const prev=document.getElementById('prevBtn');
        const next=document.getElementById('nextBtn');
        const input=document.getElementById('pageInput');
        const go=document.getElementById('goBtn');
        const download=document.getElementById('downloadBtn');
        const sub=document.getElementById('mushafSubTitle');

        let currentPage=getInitialPage();

        function updateButtons(){
            if(prev) prev.disabled=currentPage<=1;
            if(next) next.disabled=currentPage>=PAGE_COUNT;
            if(prev) prev.style.opacity=prev.disabled?'0.6':'1';
            if(next) next.style.opacity=next.disabled?'0.6':'1';
        }

        async function renderPage(page){
            currentPage=page;
            localStorage.setItem(LAST_PAGE_KEY,String(currentPage));
            if(input) input.value=String(currentPage);
            updateButtons();

            const url=buildPageUrl(cfg,currentPage);
            if(sub) sub.textContent=`Page ${currentPage} / ${PAGE_COUNT}`;

            if(img){
                img.src=url;
                img.onerror=function(){
                    img.removeAttribute('src');
                    img.alt='Mushaf page could not be loaded. Configure the Mushaf image source.';
                    const note=document.getElementById('cacheNote');
                    if(note){
                        note.textContent='Mushaf image source not found. Upload pages to ./mushaf/1405/pages/ (e.g., 001.webp ... 604.webp) or set localStorage key mushaf1405_config.';
                    }
                };
            }

            await showCachedPillIfNeeded(url);
        }

        if(prev){
            prev.addEventListener('click',function(){
                if(currentPage>1) renderPage(currentPage-1);
            });
        }
        if(next){
            next.addEventListener('click',function(){
                if(currentPage<PAGE_COUNT) renderPage(currentPage+1);
            });
        }
        if(go){
            go.addEventListener('click',function(){
                const v=input?parseInt(input.value):NaN;
                if(v>=1&&v<=PAGE_COUNT) renderPage(v);
            });
        }
        if(input){
            input.addEventListener('keydown',function(e){
                if(e.key==='Enter'){
                    const v=parseInt(input.value);
                    if(v>=1&&v<=PAGE_COUNT) renderPage(v);
                }
            });
        }
        if(download){
            download.addEventListener('click',function(){
                downloadAllPages(cfg);
            });
        }

        updateButtons();
        renderPage(currentPage);
    }

    if(document.readyState==='loading'){
        document.addEventListener('DOMContentLoaded',init);
    }else{
        init();
    }
})();
