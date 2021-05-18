## 2021-05-18
*Fixes*
- Implemented BasicCrawler instance instead of "Do-While" loop;


## 2021-05-17
*Fixes*
- fixed issue with 503 blocks instead of normal response with JSON info;
- Updated SDK to 1.2.0 (+ General fixes regarding new version);
- removed usage of deprecated "request-promise" library (using Apify.utils.requestAsBrowser() instead);
- implemented usage of proxy (auto configurations) by default;
