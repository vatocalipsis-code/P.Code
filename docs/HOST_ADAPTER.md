# Browser Host adapter

`host/browser-host.js` is reusable application glue. It downloads and parses an
SPL once per style key, verifies the SetLang identity, negotiates required
capabilities, and prepares a P.Code runtime. A failed download or identity
check is evicted from its cache so the next request can retry.

```js
import {PlaneCodeEngine} from './runtime/public-runtime.js';
import {parseSPL} from './editor/spl.js';
import {createPCodeHost} from './host/browser-host.js';

const host=createPCodeHost({engine:PlaneCodeEngine,parse:parseSPL});
const {parsed}=await host.load({
  key:'Main',path:'/skins/Main.SPL',expectedName:'next-product-main'
});
const {connection,runtime}=await host.prepare(parsed);
await runtime.setEventSink(event=>dispatchProductAction(event));
await runtime.mount(document.querySelector('#interface'));
await runtime.enableInteraction();
// On replacement or exit: await connection.close();
```

The application supplies authorization, API requests, SetData values, action
dispatch, navigation, and the installed skin catalog. The Host does not own
those decisions. A second application can use the adapter with different
names, endpoints, and actions; it does not import U.Cash code.
