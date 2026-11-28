const vc=()=>{};var dr={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bc={SDK_VERSION:"${JSCORE_VERSION}"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bi=function(n,e){if(!n)throw Sc(e)},Sc=function(n){return new Error("Firebase Database ("+bc.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fo=function(n){const e=[];let t=0;for(let s=0;s<n.length;s++){let r=n.charCodeAt(s);r<128?e[t++]=r:r<2048?(e[t++]=r>>6|192,e[t++]=r&63|128):(r&64512)===55296&&s+1<n.length&&(n.charCodeAt(s+1)&64512)===56320?(r=65536+((r&1023)<<10)+(n.charCodeAt(++s)&1023),e[t++]=r>>18|240,e[t++]=r>>12&63|128,e[t++]=r>>6&63|128,e[t++]=r&63|128):(e[t++]=r>>12|224,e[t++]=r>>6&63|128,e[t++]=r&63|128)}return e},Ac=function(n){const e=[];let t=0,s=0;for(;t<n.length;){const r=n[t++];if(r<128)e[s++]=String.fromCharCode(r);else if(r>191&&r<224){const a=n[t++];e[s++]=String.fromCharCode((r&31)<<6|a&63)}else if(r>239&&r<365){const a=n[t++],l=n[t++],u=n[t++],f=((r&7)<<18|(a&63)<<12|(l&63)<<6|u&63)-65536;e[s++]=String.fromCharCode(55296+(f>>10)),e[s++]=String.fromCharCode(56320+(f&1023))}else{const a=n[t++],l=n[t++];e[s++]=String.fromCharCode((r&15)<<12|(a&63)<<6|l&63)}}return e.join("")},Fi={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,s=[];for(let r=0;r<n.length;r+=3){const a=n[r],l=r+1<n.length,u=l?n[r+1]:0,f=r+2<n.length,m=f?n[r+2]:0,b=a>>2,v=(a&3)<<4|u>>4;let A=(u&15)<<2|m>>6,O=m&63;f||(O=64,l||(A=64)),s.push(t[b],t[v],t[A],t[O])}return s.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(fo(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):Ac(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,s=[];for(let r=0;r<n.length;){const a=t[n.charAt(r++)],u=r<n.length?t[n.charAt(r)]:0;++r;const m=r<n.length?t[n.charAt(r)]:64;++r;const v=r<n.length?t[n.charAt(r)]:64;if(++r,a==null||u==null||m==null||v==null)throw new Cc;const A=a<<2|u>>4;if(s.push(A),m!==64){const O=u<<4&240|m>>2;if(s.push(O),v!==64){const M=m<<6&192|v;s.push(M)}}}return s},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class Cc extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Rc=function(n){const e=fo(n);return Fi.encodeByteArray(e,!0)},yn=function(n){return Rc(n).replace(/\./g,"")},po=function(n){try{return Fi.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ui(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kc=()=>Ui().__FIREBASE_DEFAULTS__,Oc=()=>{if(typeof process>"u"||typeof dr>"u")return;const n=dr.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Pc=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&po(n[1]);return e&&JSON.parse(e)},An=()=>{try{return vc()||kc()||Oc()||Pc()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},go=n=>{var e,t;return(t=(e=An())==null?void 0:e.emulatorHosts)==null?void 0:t[n]},eg=n=>{const e=go(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const s=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),s]:[e.substring(0,t),s]},mo=()=>{var n;return(n=An())==null?void 0:n.config},yo=n=>{var e;return(e=An())==null?void 0:e[`_${n}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,s)=>{t?this.reject(t):this.resolve(s),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,s))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function tg(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},s=e||"demo-project",r=n.iat||0,a=n.sub||n.user_id;if(!a)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const l={iss:`https://securetoken.google.com/${s}`,aud:s,iat:r,exp:r+3600,auth_time:r,sub:a,user_id:a,firebase:{sign_in_provider:"custom",identities:{}},...n};return[yn(JSON.stringify(t)),yn(JSON.stringify(l)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Z(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function Mc(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(Z())}function Nc(){var e;const n=(e=An())==null?void 0:e.forceEnvironment;if(n==="node")return!0;if(n==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function Dc(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Lc(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function xc(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function Fc(){const n=Z();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function ng(){return!Nc()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function Cn(){try{return typeof indexedDB=="object"}catch{return!1}}function Uc(){return new Promise((n,e)=>{try{let t=!0;const s="validate-browser-context-for-indexeddb-analytics-module",r=self.indexedDB.open(s);r.onsuccess=()=>{r.result.close(),t||self.indexedDB.deleteDatabase(s),n(!0)},r.onupgradeneeded=()=>{t=!1},r.onerror=()=>{var a;e(((a=r.error)==null?void 0:a.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $c="FirebaseError";class oe extends Error{constructor(e,t,s){super(t),this.code=e,this.customData=s,this.name=$c,Object.setPrototypeOf(this,oe.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,He.prototype.create)}}class He{constructor(e,t,s){this.service=e,this.serviceName=t,this.errors=s}create(e,...t){const s=t[0]||{},r=`${this.service}/${e}`,a=this.errors[e],l=a?Bc(a,s):"Error",u=`${this.serviceName}: ${l} (${r}).`;return new oe(r,u,s)}}function Bc(n,e){try{let t=0,s="";for(;t<n.length;){const r=n.indexOf("{$",t);if(r===-1){s+=n.substring(t);break}const a=n.indexOf("}",r+2);if(a===-1){s+=n.substring(t);break}const l=n.substring(r+2,a),u=e[l];s+=n.substring(t,r)+(u!=null?String(u):`<${l}?>`),t=a+1}return s}catch{return n}}function jc(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function tt(n,e){if(n===e)return!0;const t=Object.keys(n),s=Object.keys(e);for(const r of t){if(!s.includes(r))return!1;const a=n[r],l=e[r];if(pr(a)&&pr(l)){if(!tt(a,l))return!1}else if(a!==l)return!1}for(const r of s)if(!t.includes(r))return!1;return!0}function pr(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $t(n){const e=[];for(const[t,s]of Object.entries(n))Array.isArray(s)?s.forEach(r=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(r))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(s));return e.length?"&"+e.join("&"):""}function Hc(n,e){const t=new Vc(n,e);return t.subscribe.bind(t)}class Vc{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(s=>{this.error(s)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,s){let r;if(e===void 0&&t===void 0&&s===void 0)throw new Error("Missing Observer.");Gc(e,["next","error","complete"])?r=e:r={next:e,error:t,complete:s},r.next===void 0&&(r.next=oi),r.error===void 0&&(r.error=oi),r.complete===void 0&&(r.complete=oi);const a=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?r.error(this.finalError):r.complete()}catch{}}),this.observers.push(r),a}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(s){typeof console<"u"&&console.error&&console.error(s)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function Gc(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function oi(){}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zc=1e3,Wc=2,Kc=14400*1e3,qc=.5;function $i(n,e=zc,t=Wc){const s=e*Math.pow(t,n),r=Math.round(qc*s*(Math.random()-.5)*2);return Math.min(Kc,s+r)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function J(n){return n&&n._delegate?n._delegate:n}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bi(n){try{return(n.startsWith("http://")||n.startsWith("https://")?new URL(n).hostname:n).endsWith(".cloudworkstations.dev")}catch{return!1}}async function Jc(n){return(await fetch(n,{credentials:"include"})).ok}class re{constructor(e,t,s){this.name=e,this.instanceFactory=t,this.type=s,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ye="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yc{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const s=new Lt;if(this.instancesDeferred.set(t,s),this.isInitialized(t)||this.shouldAutoInitialize())try{const r=this.getOrInitializeService({instanceIdentifier:t});r&&s.resolve(r)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){const t=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),s=(e==null?void 0:e.optional)??!1;if(this.isInitialized(t)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:t})}catch(r){if(s)return null;throw r}else{if(s)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Qc(e))try{this.getOrInitializeService({instanceIdentifier:Ye})}catch{}for(const[t,s]of this.instancesDeferred.entries()){const r=this.normalizeInstanceIdentifier(t);try{const a=this.getOrInitializeService({instanceIdentifier:r});s.resolve(a)}catch{}}}}clearInstance(e=Ye){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=Ye){return this.instances.has(e)}getOptions(e=Ye){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,s=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(s))throw Error(`${this.name}(${s}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const r=this.getOrInitializeService({instanceIdentifier:s,options:t});for(const[a,l]of this.instancesDeferred.entries()){const u=this.normalizeInstanceIdentifier(a);s===u&&l.resolve(r)}return r}onInit(e,t){const s=this.normalizeInstanceIdentifier(t),r=this.onInitCallbacks.get(s)??new Set;r.add(e),this.onInitCallbacks.set(s,r);const a=this.instances.get(s);return a&&e(a,s),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){const s=this.onInitCallbacks.get(t);if(s)for(const r of s)try{r(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let s=this.instances.get(e);if(!s&&this.component&&(s=this.component.instanceFactory(this.container,{instanceIdentifier:Xc(e),options:t}),this.instances.set(e,s),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(s,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,s)}catch{}return s||null}normalizeInstanceIdentifier(e=Ye){return this.component?this.component.multipleInstances?e:Ye:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Xc(n){return n===Ye?void 0:n}function Qc(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zc{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new Yc(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var L;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(L||(L={}));const el={debug:L.DEBUG,verbose:L.VERBOSE,info:L.INFO,warn:L.WARN,error:L.ERROR,silent:L.SILENT},tl=L.INFO,nl={[L.DEBUG]:"log",[L.VERBOSE]:"log",[L.INFO]:"info",[L.WARN]:"warn",[L.ERROR]:"error"},il=(n,e,...t)=>{if(e<n.logLevel)return;const s=new Date().toISOString(),r=nl[e];if(r)console[r](`[${s}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class Bt{constructor(e){this.name=e,this._logLevel=tl,this._logHandler=il,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in L))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?el[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,L.DEBUG,...e),this._logHandler(this,L.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,L.VERBOSE,...e),this._logHandler(this,L.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,L.INFO,...e),this._logHandler(this,L.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,L.WARN,...e),this._logHandler(this,L.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,L.ERROR,...e),this._logHandler(this,L.ERROR,...e)}}const sl=(n,e)=>e.some(t=>n instanceof t);let gr,mr;function rl(){return gr||(gr=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function ol(){return mr||(mr=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const wo=new WeakMap,Si=new WeakMap,_o=new WeakMap,ai=new WeakMap,ji=new WeakMap;function al(n){const e=new Promise((t,s)=>{const r=()=>{n.removeEventListener("success",a),n.removeEventListener("error",l)},a=()=>{t($e(n.result)),r()},l=()=>{s(n.error),r()};n.addEventListener("success",a),n.addEventListener("error",l)});return e.then(t=>{t instanceof IDBCursor&&wo.set(t,n)}).catch(()=>{}),ji.set(e,n),e}function cl(n){if(Si.has(n))return;const e=new Promise((t,s)=>{const r=()=>{n.removeEventListener("complete",a),n.removeEventListener("error",l),n.removeEventListener("abort",l)},a=()=>{t(),r()},l=()=>{s(n.error||new DOMException("AbortError","AbortError")),r()};n.addEventListener("complete",a),n.addEventListener("error",l),n.addEventListener("abort",l)});Si.set(n,e)}let Ai={get(n,e,t){if(n instanceof IDBTransaction){if(e==="done")return Si.get(n);if(e==="objectStoreNames")return n.objectStoreNames||_o.get(n);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return $e(n[e])},set(n,e,t){return n[e]=t,!0},has(n,e){return n instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in n}};function ll(n){Ai=n(Ai)}function hl(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const s=n.call(ci(this),e,...t);return _o.set(s,e.sort?e.sort():[e]),$e(s)}:ol().includes(n)?function(...e){return n.apply(ci(this),e),$e(wo.get(this))}:function(...e){return $e(n.apply(ci(this),e))}}function ul(n){return typeof n=="function"?hl(n):(n instanceof IDBTransaction&&cl(n),sl(n,rl())?new Proxy(n,Ai):n)}function $e(n){if(n instanceof IDBRequest)return al(n);if(ai.has(n))return ai.get(n);const e=ul(n);return e!==n&&(ai.set(n,e),ji.set(e,n)),e}const ci=n=>ji.get(n);function Eo(n,e,{blocked:t,upgrade:s,blocking:r,terminated:a}={}){const l=indexedDB.open(n,e),u=$e(l);return s&&l.addEventListener("upgradeneeded",f=>{s($e(l.result),f.oldVersion,f.newVersion,$e(l.transaction),f)}),t&&l.addEventListener("blocked",f=>t(f.oldVersion,f.newVersion,f)),u.then(f=>{a&&f.addEventListener("close",()=>a()),r&&f.addEventListener("versionchange",m=>r(m.oldVersion,m.newVersion,m))}).catch(()=>{}),u}const fl=["get","getKey","getAll","getAllKeys","count"],dl=["put","add","delete","clear"],li=new Map;function yr(n,e){if(!(n instanceof IDBDatabase&&!(e in n)&&typeof e=="string"))return;if(li.get(e))return li.get(e);const t=e.replace(/FromIndex$/,""),s=e!==t,r=dl.includes(t);if(!(t in(s?IDBIndex:IDBObjectStore).prototype)||!(r||fl.includes(t)))return;const a=async function(l,...u){const f=this.transaction(l,r?"readwrite":"readonly");let m=f.store;return s&&(m=m.index(u.shift())),(await Promise.all([m[t](...u),r&&f.done]))[0]};return li.set(e,a),a}ll(n=>({...n,get:(e,t,s)=>yr(e,t)||n.get(e,t,s),has:(e,t)=>!!yr(e,t)||n.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pl{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(gl(t)){const s=t.getImmediate();return`${s.library}/${s.version}`}else return null}).filter(t=>t).join(" ")}}function gl(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const Ci="@firebase/app",wr="0.16.2";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Te=new Bt("@firebase/app"),ml="@firebase/app-compat",yl="@firebase/analytics-compat",wl="@firebase/analytics",_l="@firebase/app-check-compat",El="@firebase/app-check",Il="@firebase/auth",Tl="@firebase/auth-compat",vl="@firebase/database",bl="@firebase/data-connect",Sl="@firebase/database-compat",Al="@firebase/functions",Cl="@firebase/functions-compat",Rl="@firebase/installations",kl="@firebase/installations-compat",Ol="@firebase/messaging",Pl="@firebase/messaging-compat",Ml="@firebase/performance",Nl="@firebase/performance-compat",Dl="@firebase/remote-config",Ll="@firebase/remote-config-compat",xl="@firebase/storage",Fl="@firebase/storage-compat",Ul="@firebase/firestore",$l="@firebase/ai",Bl="@firebase/firestore-compat",jl="firebase",Hl="12.19.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ri="[DEFAULT]",Vl={[Ci]:"fire-core",[ml]:"fire-core-compat",[wl]:"fire-analytics",[yl]:"fire-analytics-compat",[El]:"fire-app-check",[_l]:"fire-app-check-compat",[Il]:"fire-auth",[Tl]:"fire-auth-compat",[vl]:"fire-rtdb",[bl]:"fire-data-connect",[Sl]:"fire-rtdb-compat",[Al]:"fire-fn",[Cl]:"fire-fn-compat",[Rl]:"fire-iid",[kl]:"fire-iid-compat",[Ol]:"fire-fcm",[Pl]:"fire-fcm-compat",[Ml]:"fire-perf",[Nl]:"fire-perf-compat",[Dl]:"fire-rc",[Ll]:"fire-rc-compat",[xl]:"fire-gcs",[Fl]:"fire-gcs-compat",[Ul]:"fire-fst",[Bl]:"fire-fst-compat",[$l]:"fire-vertex","fire-js":"fire-js",[jl]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nt=new Map,ki=new Map,Oi=new Map;function _r(n,e){try{n.container.addComponent(e)}catch(t){Te.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function fe(n){const e=n.name;if(Oi.has(e))return Te.debug(`There were multiple attempts to register component ${e}.`),!1;Oi.set(e,n);for(const t of nt.values())_r(t,n);for(const t of ki.values())_r(t,n);return!0}function Ve(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function le(n){return n==null?!1:n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gl={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different {$mismatchedParam}. Existing: '{$oldValue}'. New: '{$newValue}'.","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},_e=new He("app","Firebase",Gl);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zl{constructor(e,t,s){this._isDeleted=!1,this._options={...e},this._config={...t},this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=s,this.container.addComponent(new re("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw _e.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const it=Hl;function Wl(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const s={name:Ri,automaticDataCollectionEnabled:!0,...e},r=s.name;if(typeof r!="string"||!r)throw _e.create("bad-app-name",{appName:String(r)});if(t||(t=mo()),!t)throw _e.create("no-options");const a=nt.get(r);if(a)if(tt(t,a.options)){if(tt(s,a.config))return a;throw _e.create("duplicate-app",{appName:r,mismatchedParam:"config",oldValue:JSON.stringify(a.config),newValue:JSON.stringify(s)})}else throw _e.create("duplicate-app",{appName:r,mismatchedParam:"options",oldValue:JSON.stringify(a.options),newValue:JSON.stringify(t)});const l=new Zc(r);for(const f of Oi.values())l.addComponent(f);const u=new zl(t,s,l);return nt.set(r,u),u}function Rn(n=Ri){const e=nt.get(n);if(!e&&n===Ri&&mo())return Wl();if(!e)throw _e.create("no-app",{appName:n});return e}function ig(){return Array.from(nt.values())}async function sg(n){let e=!1;const t=n.name;nt.has(t)?(e=!0,nt.delete(t)):ki.has(t)&&n.decRefCount()<=0&&(ki.delete(t),e=!0),e&&(await Promise.all(n.container.getProviders().map(s=>s.delete())),n.isDeleted=!0)}function ie(n,e,t){let s=Vl[n]??n;t&&(s+=`-${t}`);const r=s.match(/\s|\//),a=e.match(/\s|\//);if(r||a){const l=[`Unable to register library "${s}" with version "${e}":`];r&&l.push(`library name "${s}" contains illegal characters (whitespace or "/")`),r&&a&&l.push("and"),a&&l.push(`version name "${e}" contains illegal characters (whitespace or "/")`),Te.warn(l.join(" "));return}fe(new re(`${s}-version`,()=>({library:s,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kl="firebase-heartbeat-database",ql=1,xt="firebase-heartbeat-store";let hi=null;function Io(){return hi||(hi=Eo(Kl,ql,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(xt)}catch(t){console.warn(t)}}}}).catch(n=>{throw _e.create("idb-open",{originalErrorMessage:n.message})})),hi}async function Jl(n){try{const t=(await Io()).transaction(xt),s=await t.objectStore(xt).get(To(n));return await t.done,s}catch(e){if(e instanceof oe)Te.warn(e.message);else{const t=_e.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});Te.warn(t.message)}}}async function Er(n,e){try{const s=(await Io()).transaction(xt,"readwrite");await s.objectStore(xt).put(e,To(n)),await s.done}catch(t){if(t instanceof oe)Te.warn(t.message);else{const s=_e.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});Te.warn(s.message)}}}function To(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yl=1024,Xl=30;class Ql{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new eh(t),this._heartbeatsCachePromise=this._storage.read().then(s=>(this._heartbeatsCache=s,s))}async triggerHeartbeat(){var e,t;try{const r=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),a=Ir();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===a||this._heartbeatsCache.heartbeats.some(l=>l.date===a))return;if(this._heartbeatsCache.heartbeats.push({date:a,agent:r}),this._heartbeatsCache.heartbeats.length>Xl){const l=th(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(l,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(s){Te.warn(s)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Ir(),{heartbeatsToSend:s,unsentEntries:r}=Zl(this._heartbeatsCache.heartbeats),a=yn(JSON.stringify({version:2,heartbeats:s}));return this._heartbeatsCache.lastSentHeartbeatDate=t,r.length>0?(this._heartbeatsCache.heartbeats=r,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),a}catch(t){return Te.warn(t),""}}}function Ir(){return new Date().toISOString().substring(0,10)}function Zl(n,e=Yl){const t=[];let s=n.slice();for(const r of n){const a=t.find(l=>l.agent===r.agent);if(a){if(a.dates.push(r.date),Tr(t)>e){a.dates.pop();break}}else if(t.push({agent:r.agent,dates:[r.date]}),Tr(t)>e){t.pop();break}s=s.slice(1)}return{heartbeatsToSend:t,unsentEntries:s}}class eh{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Cn()?Uc().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Jl(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return Er(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const s=await this.read();return Er(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??s.lastSentHeartbeatDate,heartbeats:[...s.heartbeats,...e.heartbeats]})}else return}}function Tr(n){return yn(JSON.stringify({version:2,heartbeats:n})).length}function th(n){if(n.length===0)return-1;let e=0,t=n[0].date;for(let s=1;s<n.length;s++)n[s].date<t&&(t=n[s].date,e=s);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function nh(n){fe(new re("platform-logger",e=>new pl(e),"PRIVATE")),fe(new re("heartbeat",e=>new Ql(e),"PRIVATE")),ie(Ci,wr,n),ie(Ci,wr,"esm2020"),ie("fire-js","")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */nh("");var ih="firebase",sh="12.19.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ie(ih,sh,"app");/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pi=new Map,vo={activated:!1,tokenObservers:[]},rh={initialized:!1,enabled:!1};function G(n){return Pi.get(n)||{...vo}}function oh(n,e){return Pi.set(n,e),Pi.get(n)}function kn(){return rh}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const bo="https://content-firebaseappcheck.googleapis.com/v1",ah="exchangeRecaptchaV3Token",ch="exchangeDebugToken",vr={RETRIAL_MIN_WAIT:30*1e3,RETRIAL_MAX_WAIT:960*1e3},lh=1440*60*1e3;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hh{constructor(e,t,s,r,a){if(this.operation=e,this.retryPolicy=t,this.getWaitDuration=s,this.lowerBound=r,this.upperBound=a,this.pending=null,this.nextErrorWaitInterval=r,r>a)throw new Error("Proactive refresh lower bound greater than upper bound!")}start(){this.nextErrorWaitInterval=this.lowerBound,this.process(!0).catch(()=>{})}stop(){this.pending&&(this.pending.reject("cancelled"),this.pending=null)}isRunning(){return!!this.pending}async process(e){this.stop();try{this.pending=new Lt,this.pending.promise.catch(t=>{}),await uh(this.getNextRun(e)),this.pending.resolve(),await this.pending.promise,this.pending=new Lt,this.pending.promise.catch(t=>{}),await this.operation(),this.pending.resolve(),await this.pending.promise,this.process(!0).catch(()=>{})}catch(t){this.retryPolicy(t)?this.process(!1).catch(()=>{}):this.stop()}}getNextRun(e){if(e)return this.nextErrorWaitInterval=this.lowerBound,this.getWaitDuration();{const t=this.nextErrorWaitInterval;return this.nextErrorWaitInterval*=2,this.nextErrorWaitInterval>this.upperBound&&(this.nextErrorWaitInterval=this.upperBound),t}}}function uh(n){return new Promise(e=>{setTimeout(e,n)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fh={"already-initialized":"You have already called initializeAppCheck() for FirebaseApp {$appName} with different options. To avoid this error, call initializeAppCheck() with the same options as when it was originally called. This will return the already initialized instance.","use-before-activation":"App Check is being used before initializeAppCheck() is called for FirebaseApp {$appName}. Call initializeAppCheck() before instantiating other Firebase services.","fetch-network-error":"Fetch failed to connect to a network. Check Internet connection. Original error: {$originalErrorMessage}.","fetch-parse-error":"Fetch client could not parse response. Original error: {$originalErrorMessage}.","fetch-status-error":"Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.","storage-open":"Error thrown when opening storage. Original error: {$originalErrorMessage}.","storage-get":"Error thrown when reading from storage. Original error: {$originalErrorMessage}.","storage-set":"Error thrown when writing to storage. Original error: {$originalErrorMessage}.","recaptcha-error":"ReCAPTCHA error.","initial-throttle":"{$httpStatus} error. Attempts allowed again after {$time}",throttled:"Requests throttled due to previous {$httpStatus} error. Attempts allowed again after {$time}"},te=new He("appCheck","AppCheck",fh);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function br(n=!1){var e;return n?(e=self.grecaptcha)==null?void 0:e.enterprise:self.grecaptcha}function Hi(n){if(!G(n).activated)throw te.create("use-before-activation",{appName:n.name})}function So(n){const e=Math.round(n/1e3),t=Math.floor(e/(3600*24)),s=Math.floor((e-t*3600*24)/3600),r=Math.floor((e-t*3600*24-s*3600)/60),a=e-t*3600*24-s*3600-r*60;let l="";return t&&(l+=on(t)+"d:"),s&&(l+=on(s)+"h:"),l+=on(r)+"m:"+on(a)+"s",l}function on(n){return n===0?"00":n>=10?n.toString():"0"+n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Vi({url:n,body:e},t){const s={"Content-Type":"application/json"},r=t.getImmediate({optional:!0});if(r){const v=await r.getHeartbeatsHeader();v&&(s["X-Firebase-Client"]=v)}const a={method:"POST",body:JSON.stringify(e),headers:s};let l;try{l=await fetch(n,a)}catch(v){throw te.create("fetch-network-error",{originalErrorMessage:v==null?void 0:v.message})}if(l.status!==200)throw te.create("fetch-status-error",{httpStatus:l.status});let u;try{u=await l.json()}catch(v){throw te.create("fetch-parse-error",{originalErrorMessage:v==null?void 0:v.message})}const f=u.ttl.match(/^([\d.]+)(s)$/);if(!f||!f[2]||isNaN(Number(f[1])))throw te.create("fetch-parse-error",{originalErrorMessage:`ttl field (timeToLive) is not in standard Protobuf Duration format: ${u.ttl}`});const m=Number(f[1])*1e3,b=Date.now();return{token:u.token,expireTimeMillis:b+m,issuedAtTimeMillis:b}}function dh(n,e){const{projectId:t,appId:s,apiKey:r}=n.options;return{url:`${bo}/projects/${t}/apps/${s}:${ah}?key=${r}`,body:{recaptcha_v3_token:e}}}function Ao(n,e){const{projectId:t,appId:s,apiKey:r}=n.options;return{url:`${bo}/projects/${t}/apps/${s}:${ch}?key=${r}`,body:{debug_token:e}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ph="firebase-app-check-database",gh=1,Ft="firebase-app-check-store",Co="debug-token";let an=null;function Ro(){return an||(an=new Promise((n,e)=>{try{const t=indexedDB.open(ph,gh);t.onsuccess=s=>{n(s.target.result)},t.onerror=s=>{var r;e(te.create("storage-open",{originalErrorMessage:(r=s.target.error)==null?void 0:r.message}))},t.onupgradeneeded=s=>{const r=s.target.result;switch(s.oldVersion){case 0:r.createObjectStore(Ft,{keyPath:"compositeKey"})}}}catch(t){e(te.create("storage-open",{originalErrorMessage:t==null?void 0:t.message}))}}),an)}function mh(n){return Oo(Po(n))}function yh(n,e){return ko(Po(n),e)}function wh(n){return ko(Co,n)}function _h(){return Oo(Co)}async function ko(n,e){const s=(await Ro()).transaction(Ft,"readwrite"),a=s.objectStore(Ft).put({compositeKey:n,value:e});return new Promise((l,u)=>{a.onsuccess=f=>{l()},s.onerror=f=>{var m;u(te.create("storage-set",{originalErrorMessage:(m=f.target.error)==null?void 0:m.message}))}})}async function Oo(n){const t=(await Ro()).transaction(Ft,"readonly"),r=t.objectStore(Ft).get(n);return new Promise((a,l)=>{r.onsuccess=u=>{const f=u.target.result;a(f?f.value:void 0)},t.onerror=u=>{var f;l(te.create("storage-get",{originalErrorMessage:(f=u.target.error)==null?void 0:f.message}))}})}function Po(n){return`${n.options.appId}-${n.name}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ue=new Bt("@firebase/app-check");/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Eh(n){if(Cn()){let e;try{e=await mh(n)}catch(t){Ue.warn(`Failed to read token from IndexedDB. Error: ${t}`)}return e}}function ui(n,e){return Cn()?yh(n,e).catch(t=>{Ue.warn(`Failed to write token to IndexedDB. Error: ${t}`)}):Promise.resolve()}async function Ih(n){let e;try{e=await _h()}catch{}if(e)return e;{const t=crypto.randomUUID();let s=`To use this token for app debugging, register it with your project.

Firebase App Check debug token: ${t}

`;const r=n==null?void 0:n.options.appId,a=n==null?void 0:n.options.projectId;return a&&r?s+=`You can do so in the Firebase Console:
https://console.firebase.google.com/project/${a}/appcheck/apps?selectedAppId=${r}

Or using the Firebase CLI:
firebase appcheck:debugtokens:create ${t} --project ${a} --app ${r}

`:s+=`You will need to add it to your app's App Check settings in the Firebase Console for it to work.

`,s+=`Note: To keep your project secure, please revoke and delete this token using the
Firebase Console or the CLI (\`firebase appcheck:debugtokens:delete\`) when you finish debugging.

Warning: This debug token is a secret and should not be shared or uploaded to source code.

Debug Token Guide: https://firebase.google.com/docs/app-check/web/debug-provider
Firebase CLI install instructions: https://firebase.google.com/docs/cli
`,console.log(s),wh(t).catch(l=>Ue.warn(`Failed to persist debug token to IndexedDB. Error: ${l}`)),t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gi(){return kn().enabled}async function zi(){const n=kn();if(n.enabled&&n.token)return n.token.promise;throw Error(`
            Can't get debug token in production mode.
        `)}function Th(n){const e=Ui(),t=kn();if(t.initialized=!0,typeof e.FIREBASE_APPCHECK_DEBUG_TOKEN!="string"&&e.FIREBASE_APPCHECK_DEBUG_TOKEN!==!0)return;t.enabled=!0;const s=new Lt;t.token=s,typeof e.FIREBASE_APPCHECK_DEBUG_TOKEN=="string"?s.resolve(e.FIREBASE_APPCHECK_DEBUG_TOKEN):s.resolve(Ih(n))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vh={error:"UNKNOWN_ERROR"};function bh(n){return Fi.encodeString(JSON.stringify(n),!1)}async function Mi(n,e=!1,t=!1){const s=n.app;Hi(s);const r=G(s);let a=r.token,l;if(a&&!ht(a)&&(r.token=void 0,a=void 0),!a){const m=await r.cachedTokenPromise;m&&(ht(m)?a=m:await ui(s,void 0))}if(!e&&a&&ht(a))return{token:a.token};let u=!1;if(Gi())try{const m=await zi();r.exchangeTokenPromise||(r.exchangeTokenPromise=Vi(Ao(s,m),n.heartbeatServiceProvider).finally(()=>{r.exchangeTokenPromise=void 0}),u=!0);const b=await r.exchangeTokenPromise;return await ui(s,b),r.token=b,{token:b.token}}catch(m){return m.code==="appCheck/throttled"||m.code==="appCheck/initial-throttle"?Ue.warn(m.message):t&&Ue.error(m),fi(m)}try{r.exchangeTokenPromise||(r.exchangeTokenPromise=r.provider.getToken().finally(()=>{r.exchangeTokenPromise=void 0}),u=!0),a=await G(s).exchangeTokenPromise}catch(m){m.code==="appCheck/throttled"||m.code==="appCheck/initial-throttle"?Ue.warn(m.message):t&&Ue.error(m),l=m}let f;return a?l?ht(a)?f={token:a.token,internalError:l}:f=fi(l):(f={token:a.token},r.token=a,await ui(s,a)):f=fi(l),u&&Do(s,f),f}async function Sh(n){const e=n.app;Hi(e);const{provider:t}=G(e);if(Gi()){const s=await zi(),r=Ao(e,s);r.body.limited_use=!0;const{token:a}=await Vi(r,n.heartbeatServiceProvider);return{token:a}}else{const{token:s}=await t.getToken(!0);return{token:s}}}function Mo(n,e,t,s){const{app:r}=n,a=G(r),l={next:t,error:s,type:e};if(a.tokenObservers=[...a.tokenObservers,l],a.token&&ht(a.token)){const u=a.token;Promise.resolve().then(()=>{t({token:u.token}),Sr(n)}).catch(()=>{})}a.cachedTokenPromise.then(()=>Sr(n))}function No(n,e){const t=G(n),s=t.tokenObservers.filter(r=>r.next!==e);s.length===0&&t.tokenRefresher&&t.tokenRefresher.isRunning()&&t.tokenRefresher.stop(),t.tokenObservers=s}function Sr(n){const{app:e}=n,t=G(e);let s=t.tokenRefresher;s||(s=Ah(n),t.tokenRefresher=s),!s.isRunning()&&t.isTokenAutoRefreshEnabled&&s.start()}function Ah(n){const{app:e}=n;return new hh(async()=>{const t=G(e);let s;if(t.token?s=await Mi(n,!0):s=await Mi(n),s.error)throw s.error;if(s.internalError)throw s.internalError},()=>!0,()=>{const t=G(e);if(t.token){let s=t.token.issuedAtTimeMillis+(t.token.expireTimeMillis-t.token.issuedAtTimeMillis)*.5+3e5;const r=t.token.expireTimeMillis-300*1e3;return s=Math.min(s,r),Math.max(0,s-Date.now())}else return 0},vr.RETRIAL_MIN_WAIT,vr.RETRIAL_MAX_WAIT)}function Do(n,e){const t=G(n).tokenObservers;for(const s of t)try{s.type==="EXTERNAL"&&e.error!=null?s.error(e.error):s.next(e)}catch{}}function ht(n){return n.expireTimeMillis-Date.now()>0}function fi(n){return{token:bh(vh),error:n}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ch{constructor(e,t){this.app=e,this.heartbeatServiceProvider=t}_delete(){const{tokenObservers:e}=G(this.app);for(const t of e)No(this.app,t.next);return Promise.resolve()}}function Rh(n,e){return new Ch(n,e)}function kh(n){return{getToken:e=>Mi(n,e),getLimitedUseToken:()=>Sh(n),addTokenListener:e=>Mo(n,"INTERNAL",e),removeTokenListener:e=>No(n.app,e)}}const Oh="@firebase/app-check",Ph="0.13.1";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mh="https://www.google.com/recaptcha/api.js";function Nh(n,e){const t=new Lt,s=G(n);s.reCAPTCHAState={initialized:t};const r=Dh(n),a=br(!1);return a?Ar(n,e,a,r,t):Fh(()=>{const l=br(!1);if(!l)throw new Error("no recaptcha");Ar(n,e,l,r,t)}),t.promise}function Ar(n,e,t,s,r){t.ready(()=>{xh(n,e,t,s),r.resolve(t)})}function Dh(n){const e=`fire_app_check_${n.name}`,t=document.createElement("div");return t.id=e,t.style.display="none",document.body.appendChild(t),e}async function Lh(n){Hi(n);const t=await G(n).reCAPTCHAState.initialized.promise;return new Promise((s,r)=>{const a=G(n).reCAPTCHAState;t.ready(()=>{s(t.execute(a.widgetId,{action:"fire_app_check"}))})})}function xh(n,e,t,s){const r=t.render(s,{sitekey:e,size:"invisible",callback:()=>{G(n).reCAPTCHAState.succeeded=!0},"error-callback":()=>{G(n).reCAPTCHAState.succeeded=!1}}),a=G(n);a.reCAPTCHAState={...a.reCAPTCHAState,widgetId:r}}function Fh(n){const e=document.createElement("script");e.src=Mh,e.onload=n,document.head.appendChild(e)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lo{constructor(e){this._siteKey=e,this._throttleData=null}async getToken(e=!1){var r,a,l;$h(this._throttleData);const t=await Lh(this._app).catch(u=>{throw te.create("recaptcha-error")});if(!((r=G(this._app).reCAPTCHAState)!=null&&r.succeeded))throw te.create("recaptcha-error");let s;try{const u=dh(this._app,t);e&&(u.body.limited_use=!0),s=await Vi(u,this._heartbeatServiceProvider)}catch(u){throw(a=u.code)!=null&&a.includes("fetch-status-error")?(this._throttleData=Uh(Number((l=u.customData)==null?void 0:l.httpStatus),this._throttleData),te.create("initial-throttle",{time:So(this._throttleData.allowRequestsAfter-Date.now()),httpStatus:this._throttleData.httpStatus})):u}return this._throttleData=null,s}initialize(e){this._app=e,this._heartbeatServiceProvider=Ve(e,"heartbeat"),Nh(e,this._siteKey).catch(()=>{})}isEqual(e){return e instanceof Lo?this._siteKey===e._siteKey:!1}}function Uh(n,e){if(n===404||n===403)return{backoffCount:1,allowRequestsAfter:Date.now()+lh,httpStatus:n};{const t=e?e.backoffCount:0,s=$i(t,1e3,2);return{backoffCount:t+1,allowRequestsAfter:Date.now()+s,httpStatus:n}}}function $h(n){if(n&&Date.now()-n.allowRequestsAfter<=0)throw te.create("throttled",{time:So(n.allowRequestsAfter-Date.now()),httpStatus:n.httpStatus})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rg(n=Rn(),e){var r;n=J(n);const t=Ve(n,"app-check");if(kn().initialized||Th(n),Gi()&&zi().then(a=>{console.log(`Firebase App Check debug token: ${a}`)}),t.isInitialized()){const a=t.getImmediate(),l=t.getOptions();if(l&&!!l.isTokenAutoRefreshEnabled==!!e.isTokenAutoRefreshEnabled&&((r=l.provider)!=null&&r.isEqual(e.provider)))return a;throw te.create("already-initialized",{appName:n.name})}const s=t.initialize({options:e});return Bh(n,e.provider,e.isTokenAutoRefreshEnabled),G(n).isTokenAutoRefreshEnabled&&Mo(s,"INTERNAL",()=>{}),s}function Bh(n,e,t=!1){const s=oh(n,{...vo});s.activated=!0,s.provider=e,s.cachedTokenPromise=Eh(n).then(r=>(r&&ht(r)&&(s.token=r,Do(n,{token:r.token})),r)),s.isTokenAutoRefreshEnabled=t&&n.automaticDataCollectionEnabled,!n.automaticDataCollectionEnabled&&t&&Ue.warn("`isTokenAutoRefreshEnabled` is true but `automaticDataCollectionEnabled` was set to false during `initializeApp()`. This blocks automatic token refresh."),s.provider.initialize(n)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jh="app-check",Cr="app-check-internal";function Hh(){fe(new re(jh,n=>{const e=n.getProvider("app").getImmediate(),t=n.getProvider("heartbeat");return Rh(e,t)},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((n,e,t)=>{n.getProvider(Cr).initialize()})),fe(new re(Cr,n=>{const e=n.getProvider("app-check").getImmediate();return kh(e)},"PUBLIC").setInstantiationMode("EXPLICIT")),ie(Oh,Ph)}Hh();const xo="@firebase/installations",Wi="0.6.24";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fo=1e4,Uo=`w:${Wi}`,$o="FIS_v2",Vh="https://firebaseinstallations.googleapis.com/v1",Gh=3600*1e3,zh="installations",Wh="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kh={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},st=new He(zh,Wh,Kh);function Bo(n){return n instanceof oe&&n.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function jo({projectId:n}){return`${Vh}/projects/${n}/installations`}function Ho(n){return{token:n.token,requestStatus:2,expiresIn:Jh(n.expiresIn),creationTime:Date.now()}}async function Vo(n,e){const s=(await e.json()).error;return st.create("request-failed",{requestName:n,serverCode:s.code,serverMessage:s.message,serverStatus:s.status})}function Go({apiKey:n}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":n})}function qh(n,{refreshToken:e}){const t=Go(n);return t.append("Authorization",Yh(e)),t}async function zo(n){const e=await n();return e.status>=500&&e.status<600?n():e}function Jh(n){return Number(n.replace("s","000"))}function Yh(n){return`${$o} ${n}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Xh({appConfig:n,heartbeatServiceProvider:e},{fid:t}){const s=jo(n),r=Go(n),a=e.getImmediate({optional:!0});if(a){const m=await a.getHeartbeatsHeader();m&&r.append("x-firebase-client",m)}const l={fid:t,authVersion:$o,appId:n.appId,sdkVersion:Uo},u={method:"POST",headers:r,body:JSON.stringify(l)},f=await zo(()=>fetch(s,u));if(f.ok){const m=await f.json();return{fid:m.fid||t,registrationStatus:2,refreshToken:m.refreshToken,authToken:Ho(m.authToken)}}else throw await Vo("Create Installation",f)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wo(n){return new Promise(e=>{setTimeout(e,n)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qh(n){return btoa(String.fromCharCode(...n)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zh=/^[cdef][\w-]{21}$/,Ni="";function eu(){try{const n=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(n),n[0]=112+n[0]%16;const t=tu(n);return Zh.test(t)?t:Ni}catch{return Ni}}function tu(n){return Qh(n).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function On(n){return`${n.appName}!${n.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ko=new Map;function qo(n,e){const t=On(n);Jo(t,e),nu(t,e)}function Jo(n,e){const t=Ko.get(n);if(t)for(const s of t)s(e)}function nu(n,e){const t=iu();t&&t.postMessage({key:n,fid:e}),su()}let Xe=null;function iu(){return!Xe&&"BroadcastChannel"in self&&(Xe=new BroadcastChannel("[Firebase] FID Change"),Xe.onmessage=n=>{Jo(n.data.key,n.data.fid)}),Xe}function su(){Ko.size===0&&Xe&&(Xe.close(),Xe=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ru="firebase-installations-database",ou=1,rt="firebase-installations-store";let di=null;function Ki(){return di||(di=Eo(ru,ou,{upgrade:(n,e)=>{switch(e){case 0:n.createObjectStore(rt)}}})),di}async function wn(n,e){const t=On(n),r=(await Ki()).transaction(rt,"readwrite"),a=r.objectStore(rt),l=await a.get(t);return await a.put(e,t),await r.done,(!l||l.fid!==e.fid)&&qo(n,e.fid),e}async function Yo(n){const e=On(n),s=(await Ki()).transaction(rt,"readwrite");await s.objectStore(rt).delete(e),await s.done}async function Pn(n,e){const t=On(n),r=(await Ki()).transaction(rt,"readwrite"),a=r.objectStore(rt),l=await a.get(t),u=e(l);return u===void 0?await a.delete(t):await a.put(u,t),await r.done,u&&(!l||l.fid!==u.fid)&&qo(n,u.fid),u}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qi(n){let e;const t=await Pn(n.appConfig,s=>{const r=au(s),a=cu(n,r);return e=a.registrationPromise,a.installationEntry});return t.fid===Ni?{installationEntry:await e}:{installationEntry:t,registrationPromise:e}}function au(n){const e=n||{fid:eu(),registrationStatus:0};return Xo(e)}function cu(n,e){if(e.registrationStatus===0){if(!navigator.onLine){const r=Promise.reject(st.create("app-offline"));return{installationEntry:e,registrationPromise:r}}const t={fid:e.fid,registrationStatus:1,registrationTime:Date.now()},s=lu(n,t);return{installationEntry:t,registrationPromise:s}}else return e.registrationStatus===1?{installationEntry:e,registrationPromise:hu(n)}:{installationEntry:e}}async function lu(n,e){try{const t=await Xh(n,e);return wn(n.appConfig,t)}catch(t){throw Bo(t)&&t.customData.serverCode===409?await Yo(n.appConfig):await wn(n.appConfig,{fid:e.fid,registrationStatus:0}),t}}async function hu(n){let e=await Rr(n.appConfig);for(;e.registrationStatus===1;)await Wo(100),e=await Rr(n.appConfig);if(e.registrationStatus===0){const{installationEntry:t,registrationPromise:s}=await qi(n);return s||t}return e}function Rr(n){return Pn(n,e=>{if(!e)throw st.create("installation-not-found");return Xo(e)})}function Xo(n){return uu(n)?{fid:n.fid,registrationStatus:0}:n}function uu(n){return n.registrationStatus===1&&n.registrationTime+Fo<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function fu({appConfig:n,heartbeatServiceProvider:e},t){const s=du(n,t),r=qh(n,t),a=e.getImmediate({optional:!0});if(a){const m=await a.getHeartbeatsHeader();m&&r.append("x-firebase-client",m)}const l={installation:{sdkVersion:Uo,appId:n.appId}},u={method:"POST",headers:r,body:JSON.stringify(l)},f=await zo(()=>fetch(s,u));if(f.ok){const m=await f.json();return Ho(m)}else throw await Vo("Generate Auth Token",f)}function du(n,{fid:e}){return`${jo(n)}/${e}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ji(n,e=!1){let t;const s=await Pn(n.appConfig,a=>{if(!Qo(a))throw st.create("not-registered");const l=a.authToken;if(!e&&mu(l))return a;if(l.requestStatus===1)return t=pu(n,e),a;{if(!navigator.onLine)throw st.create("app-offline");const u=wu(a);return t=gu(n,u),u}});return t?await t:s.authToken}async function pu(n,e){let t=await kr(n.appConfig);for(;t.authToken.requestStatus===1;)await Wo(100),t=await kr(n.appConfig);const s=t.authToken;return s.requestStatus===0?Ji(n,e):s}function kr(n){return Pn(n,e=>{if(!Qo(e))throw st.create("not-registered");const t=e.authToken;return _u(t)?{...e,authToken:{requestStatus:0}}:e})}async function gu(n,e){try{const t=await fu(n,e),s={...e,authToken:t};return await wn(n.appConfig,s),t}catch(t){if(Bo(t)&&(t.customData.serverCode===401||t.customData.serverCode===404))await Yo(n.appConfig);else{const s={...e,authToken:{requestStatus:0}};await wn(n.appConfig,s)}throw t}}function Qo(n){return n!==void 0&&n.registrationStatus===2}function mu(n){return n.requestStatus===2&&!yu(n)}function yu(n){const e=Date.now();return e<n.creationTime||n.creationTime+n.expiresIn<e+Gh}function wu(n){const e={requestStatus:1,requestTime:Date.now()};return{...n,authToken:e}}function _u(n){return n.requestStatus===1&&n.requestTime+Fo<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Eu(n){const e=n,{installationEntry:t,registrationPromise:s}=await qi(e);return s?s.catch(console.error):Ji(e).catch(console.error),t.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Iu(n,e=!1){const t=n;return await Tu(t),(await Ji(t,e)).token}async function Tu(n){const{registrationPromise:e}=await qi(n);e&&await e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vu(n){if(!n||!n.options)throw pi("App Configuration");if(!n.name)throw pi("App Name");const e=["projectId","apiKey","appId"];for(const t of e)if(!n.options[t])throw pi(t);return{appName:n.name,projectId:n.options.projectId,apiKey:n.options.apiKey,appId:n.options.appId}}function pi(n){return st.create("missing-app-config-values",{valueName:n})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zo="installations",bu="installations-internal",Su=n=>{const e=n.getProvider("app").getImmediate(),t=vu(e),s=Ve(e,"heartbeat");return{app:e,appConfig:t,heartbeatServiceProvider:s,_delete:()=>Promise.resolve()}},Au=n=>{const e=n.getProvider("app").getImmediate(),t=Ve(e,Zo).getImmediate();return{getId:()=>Eu(t),getToken:r=>Iu(t,r)}};function Cu(){fe(new re(Zo,Su,"PUBLIC")),fe(new re(bu,Au,"PRIVATE"))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Cu();ie(xo,Wi);ie(xo,Wi,"esm2020");const gi="@firebase/remote-config",Or="0.9.2";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ea{constructor(){this.listeners=[]}addEventListener(e){this.listeners.push(e)}abort(){this.listeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ta="remote-config",Pr=100;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ru={"already-initialized":"Remote Config already initialized","registration-window":"Undefined window object. This SDK only supports usage in a browser environment.","registration-project-id":"Undefined project identifier. Check Firebase app initialization.","registration-api-key":"Undefined API key. Check Firebase app initialization.","registration-app-id":"Undefined app identifier. Check Firebase app initialization.","storage-open":"Error thrown when opening storage. Original error: {$originalErrorMessage}.","storage-get":"Error thrown when reading from storage. Original error: {$originalErrorMessage}.","storage-set":"Error thrown when writing to storage. Original error: {$originalErrorMessage}.","storage-delete":"Error thrown when deleting from storage. Original error: {$originalErrorMessage}.","fetch-client-network":"Fetch client failed to connect to a network. Check Internet connection. Original error: {$originalErrorMessage}.","fetch-timeout":'The config fetch request timed out.  Configure timeout using "fetchTimeoutMillis" SDK setting.',"fetch-throttle":'The config fetch request timed out while in an exponential backoff state. Configure timeout using "fetchTimeoutMillis" SDK setting. Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.',"fetch-client-parse":"Fetch client could not parse response. Original error: {$originalErrorMessage}.","fetch-status":"Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.","indexed-db-unavailable":"Indexed DB is not supported by current browser","custom-signal-max-allowed-signals":"Setting more than {$maxSignals} custom signals is not supported.","stream-error":"The stream was not able to connect to the backend: {$originalErrorMessage}.","realtime-unavailable":"The Realtime service is unavailable: {$originalErrorMessage}","update-message-invalid":"The stream invalidation message was unparsable: {$originalErrorMessage}","update-not-fetched":"Unable to fetch the latest config: {$originalErrorMessage}","analytics-unavailable":"Connection to Firebase Analytics failed: {$originalErrorMessage}"},B=new He("remoteconfig","Remote Config",Ru);function ku(n,e){return n instanceof oe&&n.code.indexOf(e)!==-1}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ou=!1,Pu="",Mr=0,Mu=["1","true","t","yes","y","on"];class mi{constructor(e,t=Pu){this._source=e,this._value=t}asString(){return this._value}asBoolean(){return this._source==="static"?Ou:Mu.indexOf(this._value.toLowerCase())>=0}asNumber(){if(this._source==="static")return Mr;let e=Number(this._value);return isNaN(e)&&(e=Mr),e}getSource(){return this._source}}class Nu{constructor(e){this.storage=e._storage,this.logger=e._logger,this.analyticsProvider=e._analyticsProvider}async updateActiveExperiments(e){const t=await this.storage.getActiveExperiments()||new Set,s=this.createExperimentInfoMap(e);return this.addActiveExperiments(s),this.removeInactiveExperiments(t,s),this.storage.setActiveExperiments(new Set(s.keys()))}createExperimentInfoMap(e){const t=new Map;for(const s of e)t.set(s.experimentId,s);return t}addActiveExperiments(e){const t={};for(const[s,r]of e.entries())t[`firebase${s}`]=r.variantId;this.addExperimentToAnalytics(t)}removeInactiveExperiments(e,t){const s={};for(const r of e)t.has(r)||(s[`firebase${r}`]=null);this.addExperimentToAnalytics(s)}addExperimentToAnalytics(e){if(Object.keys(e).length!==0)try{const t=this.analyticsProvider.getImmediate({optional:!0});t?(t.setUserProperties(e),t.logEvent("set_firebase_experiment_state")):this.logger.warn("Analytics import failed. Verify if you have imported Firebase Analytics in your app code.")}catch(t){throw B.create("analytics-unavailable",{originalErrorMessage:t==null?void 0:t.message})}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function og(n=Rn(),e={}){var r,a;n=J(n);const t=Ve(n,ta);if(t.isInitialized()){const l=t.getOptions();if(tt(l,e))return t.getImmediate();throw B.create("already-initialized")}t.initialize({options:e});const s=t.getImmediate();return e.initialFetchResponse&&(s._initializePromise=Promise.all([s._storage.setLastSuccessfulFetchResponse(e.initialFetchResponse),s._storage.setActiveConfigEtag(((r=e.initialFetchResponse)==null?void 0:r.eTag)||""),s._storage.setActiveConfigTemplateVersion(e.initialFetchResponse.templateVersion||0),s._storageCache.setLastSuccessfulFetchTimestampMillis(Date.now()),s._storageCache.setLastFetchStatus("success"),s._storageCache.setActiveConfig(((a=e.initialFetchResponse)==null?void 0:a.config)||{})]).then(),s._isInitializationComplete=!0),s}async function Du(n){const e=J(n),[t,s]=await Promise.all([e._storage.getLastSuccessfulFetchResponse(),e._storage.getActiveConfigEtag()]);if(!t||!t.config||!t.eTag||!t.templateVersion||t.eTag===s)return!1;const a=new Nu(e).updateActiveExperiments(t.experiments||[]);return await Promise.all([e._storageCache.setActiveConfig(t.config),e._storage.setActiveConfigEtag(t.eTag),e._storage.setActiveConfigTemplateVersion(t.templateVersion),a]),!0}function Lu(n){const e=J(n);return e._initializePromise||(e._initializePromise=e._storageCache.loadFromStorage().then(()=>{e._isInitializationComplete=!0})),e._initializePromise}async function xu(n){const e=J(n),t=new ea;setTimeout(async()=>{t.abort()},e.settings.fetchTimeoutMillis);const s=e._storageCache.getCustomSignals();s&&e._logger.debug(`Fetching config with custom signals: ${JSON.stringify(s)}`);try{await e._client.fetch({cacheMaxAgeMillis:e.settings.minimumFetchIntervalMillis,signal:t,customSignals:s}),await e._storageCache.setLastFetchStatus("success")}catch(r){const a=ku(r,"fetch-throttle")?"throttle":"failure";throw await e._storageCache.setLastFetchStatus(a),r}}function ag(n,e){return na(J(n),e).asNumber()}function cg(n,e){return na(J(n),e).asString()}function na(n,e){const t=J(n);t._isInitializationComplete||t._logger.debug(`A value was requested for key "${e}" before SDK initialization completed. Await on ensureInitialized if the intent was to get a previously activated value.`);const s=t._storageCache.getActiveConfig();return s&&s[e]!==void 0?new mi("remote",s[e]):t.defaultConfig&&t.defaultConfig[e]!==void 0?new mi("default",String(t.defaultConfig[e])):(t._logger.debug(`Returning static value for key "${e}". Define a default or remote value if this is unintentional.`),new mi("static"))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fu{constructor(e,t,s,r){this.client=e,this.storage=t,this.storageCache=s,this.logger=r}isCachedDataFresh(e,t){if(!t)return this.logger.debug("Config fetch cache check. Cache unpopulated."),!1;const s=Date.now()-t,r=s<=e;return this.logger.debug(`Config fetch cache check. Cache age millis: ${s}. Cache max age millis (minimumFetchIntervalMillis setting): ${e}. Is cache hit: ${r}.`),r}async fetch(e){const[t,s]=await Promise.all([this.storage.getLastSuccessfulFetchTimestampMillis(),this.storage.getLastSuccessfulFetchResponse()]);if(s&&this.isCachedDataFresh(e.cacheMaxAgeMillis,t))return s;e.eTag=s&&s.eTag;const r=await this.client.fetch(e),a=[this.storageCache.setLastSuccessfulFetchTimestampMillis(Date.now())];return r.status===200&&a.push(this.storage.setLastSuccessfulFetchResponse(r)),await Promise.all(a),r}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Uu(n=navigator){return n.languages&&n.languages[0]||n.language}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class $u{constructor(e,t,s,r,a,l){this.firebaseInstallations=e,this.sdkVersion=t,this.namespace=s,this.projectId=r,this.apiKey=a,this.appId=l}async fetch(e){const[t,s]=await Promise.all([this.firebaseInstallations.getId(),this.firebaseInstallations.getToken()]),a=`${window.FIREBASE_REMOTE_CONFIG_URL_BASE||"https://firebaseremoteconfig.googleapis.com"}/v1/projects/${this.projectId}/namespaces/${this.namespace}:fetch?key=${this.apiKey}`,l={"Content-Type":"application/json","Content-Encoding":"gzip","If-None-Match":e.eTag||"*"},u={sdk_version:this.sdkVersion,app_instance_id:t,app_instance_id_token:s,app_id:this.appId,language_code:Uu(),custom_signals:e.customSignals},f={method:"POST",headers:l,body:JSON.stringify(u)},m=fetch(a,f),b=new Promise((F,z)=>{e.signal.addEventListener(()=>{const ae=new Error("The operation was aborted.");ae.name="AbortError",z(ae)})});let v;try{await Promise.race([m,b]),v=await m}catch(F){let z="fetch-client-network";throw(F==null?void 0:F.name)==="AbortError"&&(z="fetch-timeout"),B.create(z,{originalErrorMessage:F==null?void 0:F.message})}let A=v.status;const O=v.headers.get("ETag")||void 0;let M,D,C,j,Y;if(v.status===200){let F;try{F=await v.json()}catch(z){throw B.create("fetch-client-parse",{originalErrorMessage:z==null?void 0:z.message})}M=F.entries,D=F.state,C=F.templateVersion,j=F.experimentDescriptions,Y=F.rolloutMetadata}if(D==="INSTANCE_STATE_UNSPECIFIED"?A=500:D==="NO_CHANGE"?A=304:(D==="NO_TEMPLATE"||D==="EMPTY_CONFIG")&&(M={},j=[],Y=[]),A!==304&&A!==200)throw B.create("fetch-status",{httpStatus:A});return{status:A,eTag:O,config:M,templateVersion:C,experiments:j,rollouts:Y}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bu(n,e){return new Promise((t,s)=>{const r=Math.max(e-Date.now(),0),a=setTimeout(t,r);n.addEventListener(()=>{clearTimeout(a),s(B.create("fetch-throttle",{throttleEndTimeMillis:e}))})})}function ju(n){if(!(n instanceof oe)||!n.customData)return!1;const e=Number(n.customData.httpStatus);return e===429||e===500||e===503||e===504}class Hu{constructor(e,t){this.client=e,this.storage=t}async fetch(e){const t=await this.storage.getThrottleMetadata()||{backoffCount:0,throttleEndTimeMillis:Date.now()};return this.attemptFetch(e,t)}async attemptFetch(e,{throttleEndTimeMillis:t,backoffCount:s}){await Bu(e.signal,t);try{const r=await this.client.fetch(e);return await this.storage.deleteThrottleMetadata(),r}catch(r){if(!ju(r))throw r;const a={throttleEndTimeMillis:Date.now()+$i(s),backoffCount:s+1};return await this.storage.setThrottleMetadata(a),this.attemptFetch(e,a)}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vu=60*1e3,Gu=720*60*1e3;class zu{get fetchTimeMillis(){return this._storageCache.getLastSuccessfulFetchTimestampMillis()||-1}get lastFetchStatus(){return this._storageCache.getLastFetchStatus()||"no-fetch-yet"}constructor(e,t,s,r,a,l,u){this.app=e,this._client=t,this._storageCache=s,this._storage=r,this._logger=a,this._realtimeHandler=l,this._analyticsProvider=u,this._isInitializationComplete=!1,this.settings={fetchTimeoutMillis:Vu,minimumFetchIntervalMillis:Gu},this.defaultConfig={}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function un(n,e){const t=n.target.error||void 0;return B.create(e,{originalErrorMessage:t&&(t==null?void 0:t.message)})}const Me="app_namespace_store",Wu="firebase_remote_config",Ku=1;function qu(){return new Promise((n,e)=>{try{const t=indexedDB.open(Wu,Ku);t.onerror=s=>{e(un(s,"storage-open"))},t.onsuccess=s=>{n(s.target.result)},t.onupgradeneeded=s=>{const r=s.target.result;switch(s.oldVersion){case 0:r.createObjectStore(Me,{keyPath:"compositeKey"})}}}catch(t){e(B.create("storage-open",{originalErrorMessage:t==null?void 0:t.message}))}})}class ia{getLastFetchStatus(){return this.get("last_fetch_status")}setLastFetchStatus(e){return this.set("last_fetch_status",e)}getLastSuccessfulFetchTimestampMillis(){return this.get("last_successful_fetch_timestamp_millis")}setLastSuccessfulFetchTimestampMillis(e){return this.set("last_successful_fetch_timestamp_millis",e)}getLastSuccessfulFetchResponse(){return this.get("last_successful_fetch_response")}setLastSuccessfulFetchResponse(e){return this.set("last_successful_fetch_response",e)}getActiveConfig(){return this.get("active_config")}setActiveConfig(e){return this.set("active_config",e)}getActiveConfigEtag(){return this.get("active_config_etag")}setActiveConfigEtag(e){return this.set("active_config_etag",e)}getActiveExperiments(){return this.get("active_experiments")}setActiveExperiments(e){return this.set("active_experiments",e)}getThrottleMetadata(){return this.get("throttle_metadata")}setThrottleMetadata(e){return this.set("throttle_metadata",e)}deleteThrottleMetadata(){return this.delete("throttle_metadata")}getCustomSignals(){return this.get("custom_signals")}getRealtimeBackoffMetadata(){return this.get("realtime_backoff_metadata")}setRealtimeBackoffMetadata(e){return this.set("realtime_backoff_metadata",e)}getActiveConfigTemplateVersion(){return this.get("last_known_template_version")}setActiveConfigTemplateVersion(e){return this.set("last_known_template_version",e)}}class Ju extends ia{constructor(e,t,s,r=qu()){super(),this.appId=e,this.appName=t,this.namespace=s,this.openDbPromise=r}async setCustomSignals(e){const s=(await this.openDbPromise).transaction([Me],"readwrite"),r=await this.getWithTransaction("custom_signals",s),a=sa(e,r||{});return await this.setWithTransaction("custom_signals",a,s),a}async getWithTransaction(e,t){return new Promise((s,r)=>{const a=t.objectStore(Me),l=this.createCompositeKey(e);try{const u=a.get(l);u.onerror=f=>{r(un(f,"storage-get"))},u.onsuccess=f=>{const m=f.target.result;s(m?m.value:void 0)}}catch(u){r(B.create("storage-get",{originalErrorMessage:u==null?void 0:u.message}))}})}async setWithTransaction(e,t,s){return new Promise((r,a)=>{const l=s.objectStore(Me),u=this.createCompositeKey(e);try{const f=l.put({compositeKey:u,value:t});f.onerror=m=>{a(un(m,"storage-set"))},f.onsuccess=()=>{r()}}catch(f){a(B.create("storage-set",{originalErrorMessage:f==null?void 0:f.message}))}})}async get(e){const s=(await this.openDbPromise).transaction([Me],"readonly");return this.getWithTransaction(e,s)}async set(e,t){const r=(await this.openDbPromise).transaction([Me],"readwrite");return this.setWithTransaction(e,t,r)}async delete(e){const t=await this.openDbPromise;return new Promise((s,r)=>{const l=t.transaction([Me],"readwrite").objectStore(Me),u=this.createCompositeKey(e);try{const f=l.delete(u);f.onerror=m=>{r(un(m,"storage-delete"))},f.onsuccess=()=>{s()}}catch(f){r(B.create("storage-delete",{originalErrorMessage:f==null?void 0:f.message}))}})}createCompositeKey(e){return[this.appId,this.appName,this.namespace,e].join()}}class Yu extends ia{constructor(){super(...arguments),this.storage={}}async get(e){return Promise.resolve(this.storage[e])}async set(e,t){return this.storage[e]=t,Promise.resolve(void 0)}async delete(e){return this.storage[e]=void 0,Promise.resolve()}async setCustomSignals(e){const t=this.storage.custom_signals||{};return this.storage.custom_signals=sa(e,t),Promise.resolve(this.storage.custom_signals)}}function sa(n,e){const t={...e,...n},s=Object.fromEntries(Object.entries(t).filter(([r,a])=>a!==null).map(([r,a])=>typeof a=="number"?[r,a.toString()]:[r,a]));if(Object.keys(s).length>Pr)throw B.create("custom-signal-max-allowed-signals",{maxSignals:Pr});return s}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xu{constructor(e){this.storage=e}getLastFetchStatus(){return this.lastFetchStatus}getLastSuccessfulFetchTimestampMillis(){return this.lastSuccessfulFetchTimestampMillis}getActiveConfig(){return this.activeConfig}getCustomSignals(){return this.customSignals}async loadFromStorage(){const e=this.storage.getLastFetchStatus(),t=this.storage.getLastSuccessfulFetchTimestampMillis(),s=this.storage.getActiveConfig(),r=this.storage.getCustomSignals(),a=await e;a&&(this.lastFetchStatus=a);const l=await t;l&&(this.lastSuccessfulFetchTimestampMillis=l);const u=await s;u&&(this.activeConfig=u);const f=await r;f&&(this.customSignals=f)}setLastFetchStatus(e){return this.lastFetchStatus=e,this.storage.setLastFetchStatus(e)}setLastSuccessfulFetchTimestampMillis(e){return this.lastSuccessfulFetchTimestampMillis=e,this.storage.setLastSuccessfulFetchTimestampMillis(e)}setActiveConfig(e){return this.activeConfig=e,this.storage.setActiveConfig(e)}async setCustomSignals(e){this.customSignals=await this.storage.setCustomSignals(e)}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qu{constructor(e){this.allowedEvents_=e,this.listeners_={},bi(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const s=[...this.listeners_[e]];for(let r=0;r<s.length;r++)s[r].callback.apply(s[r].context,t)}}on(e,t,s){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:s});const r=this.getInitialEvent(e);r&&t.apply(s,r)}off(e,t,s){this.validateEventType_(e);const r=this.listeners_[e]||[];for(let a=0;a<r.length;a++)if(r[a].callback===t&&(!s||s===r[a].context)){r.splice(a,1);return}}validateEventType_(e){bi(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yi extends Qu{static getInstance(){return new Yi}constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const s=!document[e];s!==this.visible_&&(this.visible_=s,this.trigger("visible",s))},!1)}getInitialEvent(e){return bi(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zu="X-Goog-Api-Key",ef="X-Goog-Firebase-Installations-Auth",yi=8,Nr=3,Dr=-1,Lr=0,xr="featureDisabled",Fr="retryIntervalSeconds",Ur="latestTemplateVersionNumber",tf="_exp_rollout";class nf{constructor(e,t,s,r,a,l,u,f,m,b){this.firebaseInstallations=e,this.storage=t,this.sdkVersion=s,this.namespace=r,this.projectId=a,this.apiKey=l,this.appId=u,this.logger=f,this.storageCache=m,this.cachingClient=b,this.observers=new Set,this.isConnectionActive=!1,this.isRealtimeDisabled=!1,this.httpRetriesRemaining=yi,this.isInBackground=!1,this.decoder=new TextDecoder("utf-8"),this.isClosingConnection=!1,this.propagateError=v=>this.observers.forEach(A=>{var O;return(O=A.error)==null?void 0:O.call(A,v)}),this.isStatusCodeRetryable=v=>!v||[408,429,502,503,504].includes(v),this.setRetriesRemaining(),Yi.getInstance().on("visible",this.onVisibilityChange,this)}async setRetriesRemaining(){const e=await this.storage.getRealtimeBackoffMetadata(),t=(e==null?void 0:e.numFailedStreams)||0;this.httpRetriesRemaining=Math.max(yi-t,1)}async updateBackoffMetadataWithLastFailedStreamConnectionTime(e){var r;const t=(((r=await this.storage.getRealtimeBackoffMetadata())==null?void 0:r.numFailedStreams)||0)+1,s=$i(t,6e4,2);await this.storage.setRealtimeBackoffMetadata({backoffEndTimeMillis:new Date(e.getTime()+s),numFailedStreams:t})}async updateBackoffMetadataWithRetryInterval(e){const t=Date.now(),s=e*1e3,r=new Date(t+s);await this.storage.setRealtimeBackoffMetadata({backoffEndTimeMillis:r,numFailedStreams:0}),await this.retryHttpConnectionWhenBackoffEnds()}async closeRealtimeHttpConnection(){if(!this.isClosingConnection){this.isClosingConnection=!0;try{this.reader&&await this.reader.cancel()}catch{this.logger.debug("Failed to cancel the reader, connection was lost.")}finally{this.reader=void 0}this.controller&&(await this.controller.abort(),this.controller=void 0),this.isClosingConnection=!1}}async resetRealtimeBackoff(){await this.storage.setRealtimeBackoffMetadata({backoffEndTimeMillis:new Date(-1),numFailedStreams:0})}resetRetryCount(){this.httpRetriesRemaining=yi}async establishRealtimeConnection(e,t,s,r){const a=await this.storage.getActiveConfigEtag(),l=await this.storage.getActiveConfigTemplateVersion(),u={[Zu]:this.apiKey,[ef]:s,"Content-Type":"application/json",Accept:"application/json","If-None-Match":a||"*","Content-Encoding":"gzip"},f={project:this.projectId,namespace:this.namespace,lastKnownVersionNumber:l,appId:this.appId,sdkVersion:this.sdkVersion,appInstanceId:t};return await fetch(e,{method:"POST",headers:u,body:JSON.stringify(f),signal:r})}getRealtimeUrl(){const t=`${window.FIREBASE_REMOTE_CONFIG_URL_BASE||"https://firebaseremoteconfigrealtime.googleapis.com"}/v1/projects/${this.projectId}/namespaces/${this.namespace}:streamFetchInvalidations?key=${this.apiKey}`;return new URL(t)}async createRealtimeConnection(){const[e,t]=await Promise.all([this.firebaseInstallations.getId(),this.firebaseInstallations.getToken(!1)]);this.controller=new AbortController;const s=this.getRealtimeUrl();return await this.establishRealtimeConnection(s,e,t,this.controller.signal)}async retryHttpConnectionWhenBackoffEnds(){let e=await this.storage.getRealtimeBackoffMetadata();e||(e={backoffEndTimeMillis:new Date(Dr),numFailedStreams:Lr});const t=new Date(e.backoffEndTimeMillis).getTime(),s=Date.now(),r=Math.max(0,t-s);await this.makeRealtimeHttpConnection(r)}setIsHttpConnectionRunning(e){this.isConnectionActive=e}checkAndSetHttpConnectionFlagIfNotRunning(){const e=this.canEstablishStreamConnection();return e&&this.setIsHttpConnectionRunning(!0),e}fetchResponseIsUpToDate(e,t){return e.config!=null&&e.templateVersion?e.templateVersion>=t:this.storageCache.getLastFetchStatus()==="success"}parseAndValidateConfigUpdateMessage(e){const t=e.indexOf("{"),s=e.indexOf("}",t);return t<0||s<0||t>=s?"":e.substring(t,s+1)}isEventListenersEmpty(){return this.observers.size===0}getRandomInt(e){return Math.floor(Math.random()*e)}executeAllListenerCallbacks(e){this.observers.forEach(t=>t.next(e))}getChangedParams(e,t,s,r){const a=new Set,l=new Set(Object.keys(e||{})),u=new Set(Object.keys(t||{})),f=s.experiments||[],m=(r==null?void 0:r.experiments)||[],b=this.createExperimentsMap(f),v=this.createExperimentsMap(m),A=s.rollouts||[],O=(r==null?void 0:r.rollouts)||[],M=this.createRolloutsMap(A),D=this.createRolloutsMap(O);for(const C of l){if(!u.has(C)||e[C]!==t[C]){a.add(C);continue}if(b.has(C)!==v.has(C)){a.add(C);continue}const j=b.get(C),Y=v.get(C);if(j&&Y&&!this.areExperimentsEqual(j,Y)){a.add(C);continue}if(M.has(C)!==D.has(C)){a.add(C);continue}const F=M.get(C),z=D.get(C);F&&z&&!this.areRolloutsEqual(F,z)&&a.add(C)}for(const C of u)l.has(C)||a.add(C);return a}areExperimentsEqual(e,t){return e.experimentId===t.experimentId&&e.variantId===t.variantId&&e.timeToLiveMillis===t.timeToLiveMillis&&e.triggerTimeoutMillis===t.triggerTimeoutMillis}areRolloutsEqual(e,t){if(e.size!==t.size)return!1;for(const[s,r]of e)if(t.get(s)!==r)return!1;return!0}createExperimentsMap(e){const t=new Map;for(const s of e)if(!(!s.affectedParameterKeys||s.experimentId.startsWith(tf)))for(const r of s.affectedParameterKeys)t.set(r,s);return t}createRolloutsMap(e){const t=new Map;for(const s of e){const r=s.rolloutId,a=s.variantId,l=s.affectedParameterKeys||[];for(const u of l){let f=t.get(u);f||(f=new Map,t.set(u,f)),f.set(r,a)}}return t}async fetchLatestConfig(e,t){const s=e-1,r=Nr-s,a=this.storageCache.getCustomSignals();a&&this.logger.debug(`Fetching config with custom signals: ${JSON.stringify(a)}`);const l=new ea;try{const u={cacheMaxAgeMillis:0,signal:l,customSignals:a,fetchType:"REALTIME",fetchAttempt:r},f=await this.storage.getLastSuccessfulFetchResponse(),m=await this.cachingClient.fetch(u);let b=await this.storage.getActiveConfig();if(!this.fetchResponseIsUpToDate(m,t)){this.logger.debug("Fetched template version is the same as SDK's current version. Retrying fetch."),await this.autoFetch(s,t);return}if(m.config==null){this.logger.debug("The fetch succeeded, but the backend had no updates.");return}b==null&&(b={});const v=this.getChangedParams(m.config,b,m,f);if(v.size===0){this.logger.debug("Config was fetched, but no params changed.");return}const A={getUpdatedKeys(){return new Set(v)}};this.executeAllListenerCallbacks(A)}catch(u){const f=u instanceof Error?u.message:String(u),m=B.create("update-not-fetched",{originalErrorMessage:`Failed to auto-fetch config update: ${f}`});this.propagateError(m)}}async autoFetch(e,t){if(e===0){const a=B.create("update-not-fetched",{originalErrorMessage:"Unable to fetch the latest version of the template."});this.propagateError(a);return}const r=this.getRandomInt(4)*1e3;await new Promise(a=>setTimeout(a,r)),await this.fetchLatestConfig(e,t)}async handleNotifications(e){let t,s="";for(;;){const{done:r,value:a}=await e.read();if(r)break;if(t=this.decoder.decode(a,{stream:!0}),s+=t,t.includes("}")){if(s=this.parseAndValidateConfigUpdateMessage(s),s.length===0)continue;try{const l=JSON.parse(s);if(this.isEventListenersEmpty())break;if(xr in l&&l[xr]===!0){const u=B.create("realtime-unavailable",{originalErrorMessage:"The server is temporarily unavailable. Try again in a few minutes."});this.propagateError(u);break}if(Ur in l){const u=await this.storage.getActiveConfigTemplateVersion(),f=Number(l[Ur]);u&&f>u&&await this.autoFetch(Nr,f)}if(Fr in l){const u=Number(l[Fr]);await this.updateBackoffMetadataWithRetryInterval(u)}}catch(l){this.logger.debug("Unable to parse latest config update message.",l);const u=l instanceof Error?l.message:String(l);this.propagateError(B.create("update-message-invalid",{originalErrorMessage:u}))}s=""}}}async listenForNotifications(e){try{await this.handleNotifications(e)}catch{this.isInBackground||this.logger.debug("Real-time connection was closed due to an exception.")}}async prepareAndBeginRealtimeHttpStream(){if(!this.checkAndSetHttpConnectionFlagIfNotRunning())return;let e=await this.storage.getRealtimeBackoffMetadata();e||(e={backoffEndTimeMillis:new Date(Dr),numFailedStreams:Lr});const t=e.backoffEndTimeMillis.getTime();if(Date.now()<t){await this.retryHttpConnectionWhenBackoffEnds();return}let s,r;try{if(s=await this.createRealtimeConnection(),r=s.status,s.ok&&s.body){this.resetRetryCount(),await this.resetRealtimeBackoff();const a=s.body.getReader();this.reader=a,await this.listenForNotifications(a)}}catch(a){this.isInBackground?this.resetRetryCount():this.logger.debug("Exception connecting to real-time RC backend. Retrying the connection...:",a)}finally{await this.closeRealtimeHttpConnection(),this.setIsHttpConnectionRunning(!1);const a=!this.isInBackground&&(r===void 0||this.isStatusCodeRetryable(r));if(a&&await this.updateBackoffMetadataWithLastFailedStreamConnectionTime(new Date),a||s!=null&&s.ok)await this.retryHttpConnectionWhenBackoffEnds();else{const l=`Unable to connect to the server. HTTP status code: ${r}`,u=B.create("stream-error",{originalErrorMessage:l});this.propagateError(u)}}}canEstablishStreamConnection(){const e=this.observers.size>0,t=!this.isRealtimeDisabled,s=!this.isConnectionActive,r=!this.isInBackground;return e&&t&&s&&r}async makeRealtimeHttpConnection(e){if(this.canEstablishStreamConnection()){if(this.httpRetriesRemaining>0)this.httpRetriesRemaining--,await new Promise(t=>setTimeout(t,e)),this.prepareAndBeginRealtimeHttpStream();else if(!this.isInBackground){const t=B.create("stream-error",{originalErrorMessage:"Unable to connect to the server. Check your connection and try again."});this.propagateError(t)}}}async beginRealtime(){this.observers.size>0&&await this.makeRealtimeHttpConnection(0)}addObserver(e){this.observers.add(e),this.beginRealtime()}removeObserver(e){this.observers.has(e)&&this.observers.delete(e)}async onVisibilityChange(e){this.isInBackground=!e,e?e&&await this.beginRealtime():await this.closeRealtimeHttpConnection()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function sf(){fe(new re(ta,n,"PUBLIC").setMultipleInstances(!0)),ie(gi,Or),ie(gi,Or,"esm2020");function n(e,{options:t}){const s=e.getProvider("app").getImmediate(),r=e.getProvider("installations-internal").getImmediate(),a=e.getProvider("analytics-internal"),{projectId:l,apiKey:u,appId:f}=s.options;if(!l)throw B.create("registration-project-id");if(!u)throw B.create("registration-api-key");if(!f)throw B.create("registration-app-id");const m=(t==null?void 0:t.templateId)||"firebase",b=Cn()?new Ju(f,s.name,m):new Yu,v=new Xu(b),A=new Bt(gi);A.logLevel=L.ERROR;const O=new $u(r,it,m,l,u,f),M=new Hu(O,b),D=new Fu(M,b,v,A),C=new nf(r,b,it,m,l,u,f,A,v,D),j=new zu(s,D,v,b,A,C,a);return Lu(j),j}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function lg(n){return n=J(n),await xu(n),Du(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */sf();function ra(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const rf=ra,oa=new He("auth","Firebase",ra());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _n=new Bt("@firebase/auth");function fn(n,...e){_n.logLevel<=L.WARN&&_n.warn(`Auth (${it}): ${n}`,...e)}function dn(n,...e){_n.logLevel<=L.ERROR&&_n.error(`Auth (${it}): ${n}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ve(n,...e){throw Qi(n,...e)}function ge(n,...e){return Qi(n,...e)}function Xi(n,e,t){const s={...rf(),[e]:t};return new He("auth","Firebase",s).create(e,{appName:n.name})}function Be(n){return Xi(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Qi(n,...e){if(typeof n!="string"){const t=e[0],s=[...e.slice(1)];return s[0]&&(s[0].appName=n.name),n._errorFactory.create(t,...s)}return oa.create(n,...e)}function P(n,e,...t){if(!n)throw Qi(e,...t)}function Ee(n){const e="INTERNAL ASSERTION FAILED: "+n;throw dn(e),new Error(e)}function be(n,e){n||Ee(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Di(){var n;return typeof self<"u"&&((n=self.location)==null?void 0:n.href)||""}function of(){return $r()==="http:"||$r()==="https:"}function $r(){var n;return typeof self<"u"&&((n=self.location)==null?void 0:n.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function af(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(of()||Lc()||"connection"in navigator)?navigator.onLine:!0}function cf(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jt{constructor(e,t){this.shortDelay=e,this.longDelay=t,be(t>e,"Short delay should be less than long delay!"),this.isMobile=Mc()||xc()}get(){return af()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zi(n,e){be(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class aa{static initialize(e,t,s){this.fetchImpl=e,t&&(this.headersImpl=t),s&&(this.responseImpl=s)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;Ee("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;Ee("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;Ee("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const lf={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hf=["/v1/accounts:signInWithCustomToken","/v1/accounts:signInWithEmailLink","/v1/accounts:signInWithIdp","/v1/accounts:signInWithPassword","/v1/accounts:signInWithPhoneNumber","/v1/token"],uf=new jt(3e4,6e4);function Mn(n,e){return n.tenantId&&!e.tenantId?{...e,tenantId:n.tenantId}:e}async function gt(n,e,t,s,r={}){return ca(n,r,async()=>{let a={},l={};s&&(e==="GET"?l=s:a={body:JSON.stringify(s)});const u=$t({...l,key:n.config.apiKey}).slice(1),f=await n._getAdditionalHeaders();f["Content-Type"]="application/json",n.languageCode&&(f["X-Firebase-Locale"]=n.languageCode);const m={method:e,headers:f,...a};return Dc()||(m.referrerPolicy="strict-origin-when-cross-origin"),n.emulatorConfig&&Bi(n.emulatorConfig.host)&&(m.credentials="include"),aa.fetch()(await ha(n,n.config.apiHost,t,u),m)})}async function ca(n,e,t){n._canInitEmulator=!1;const s={...lf,...e};try{const r=new ff(n),a=await Promise.race([t(),r.promise]);r.clearNetworkTimeout();const l=await a.json();if("needConfirmation"in l)throw cn(n,"account-exists-with-different-credential",l);if(a.ok&&!("errorMessage"in l))return l;{const u=a.ok?l.errorMessage:l.error.message,[f,m]=u.split(" : ");if(f==="FEDERATED_USER_ID_ALREADY_LINKED")throw cn(n,"credential-already-in-use",l);if(f==="EMAIL_EXISTS")throw cn(n,"email-already-in-use",l);if(f==="USER_DISABLED")throw cn(n,"user-disabled",l);const b=s[f]||f.toLowerCase().replace(/[_\s]+/g,"-");if(m)throw Xi(n,b,m);ve(n,b)}}catch(r){if(r instanceof oe)throw r;ve(n,"network-request-failed",{message:String(r)})}}async function la(n,e,t,s,r={}){const a=await gt(n,e,t,s,r);return"mfaPendingCredential"in a&&ve(n,"multi-factor-auth-required",{_serverResponse:a}),a}async function ha(n,e,t,s){const r=`${e}${t}?${s}`,a=n,l=a.config.emulator?Zi(n.config,r):`${n.config.apiScheme}://${r}`;return hf.includes(t)&&(await a._persistenceManagerAvailable,a._getPersistenceType()==="COOKIE")?a._getPersistence()._getFinalTarget(l).toString():l}class ff{clearNetworkTimeout(){clearTimeout(this.timer)}constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,s)=>{this.timer=setTimeout(()=>s(ge(this.auth,"network-request-failed")),uf.get())})}}function cn(n,e,t){const s={appName:n.name};t.email&&(s.email=t.email),t.phoneNumber&&(s.phoneNumber=t.phoneNumber);const r=ge(n,e,s);return r.customData._tokenResponse=t,r}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function df(n,e){return gt(n,"POST","/v1/accounts:delete",e)}async function En(n,e){return gt(n,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Nt(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function pf(n,e=!1){const t=J(n),s=await t.getIdToken(e),r=es(s);P(r&&r.exp&&r.auth_time&&r.iat,t.auth,"internal-error");const a=typeof r.firebase=="object"?r.firebase:void 0,l=a==null?void 0:a.sign_in_provider;return{claims:r,token:s,authTime:Nt(wi(r.auth_time)),issuedAtTime:Nt(wi(r.iat)),expirationTime:Nt(wi(r.exp)),signInProvider:l||null,signInSecondFactor:(a==null?void 0:a.sign_in_second_factor)||null}}function wi(n){return Number(n)*1e3}function es(n){const[e,t,s]=n.split(".");if(e===void 0||t===void 0||s===void 0)return dn("JWT malformed, contained fewer than 3 sections"),null;try{const r=po(t);return r?JSON.parse(r):(dn("Failed to decode base64 JWT payload"),null)}catch(r){return dn("Caught error parsing JWT payload as JSON",r==null?void 0:r.toString()),null}}function Br(n){const e=es(n);return P(e,"internal-error"),P(typeof e.exp<"u","internal-error"),P(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ut(n,e,t=!1){if(t)return e;try{return await e}catch(s){throw s instanceof oe&&gf(s)&&n.auth.currentUser===n&&await n.auth.signOut(),s}}function gf({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mf{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){if(e){const t=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),t}else{this.errorBackoff=3e4;const s=(this.user.stsTokenManager.expirationTime??0)-Date.now()-3e5;return Math.max(0,s)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Li{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Nt(this.lastLoginAt),this.creationTime=Nt(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function In(n){var v;const e=n.auth,t=await n.getIdToken(),s=await Ut(n,En(e,{idToken:t}));P(s==null?void 0:s.users.length,e,"internal-error");const r=s.users[0];n._notifyReloadListener(r);const a=(v=r.providerUserInfo)!=null&&v.length?ua(r.providerUserInfo):[],l=wf(n.providerData,a),u=n.isAnonymous,f=!(n.email&&r.passwordHash)&&!(l!=null&&l.length),m=u?f:!1,b={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:l,metadata:new Li(r.createdAt,r.lastLoginAt),isAnonymous:m};Object.assign(n,b)}async function yf(n){const e=J(n);await In(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function wf(n,e){return[...n.filter(s=>!e.some(r=>r.providerId===s.providerId)),...e]}function ua(n){return n.map(({providerId:e,...t})=>({providerId:e,uid:t.rawId||"",displayName:t.displayName||null,email:t.email||null,phoneNumber:t.phoneNumber||null,photoURL:t.photoUrl||null}))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _f(n,e){const t=await ca(n,{},async()=>{const s=$t({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:r,apiKey:a}=n.config,l=await ha(n,r,"/v1/token",`key=${a}`),u=await n._getAdditionalHeaders();u["Content-Type"]="application/x-www-form-urlencoded";const f={method:"POST",headers:u,body:s};return n.emulatorConfig&&Bi(n.emulatorConfig.host)&&(f.credentials="include"),aa.fetch()(l,f)});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function Ef(n,e){return gt(n,"POST","/v2/accounts:revokeToken",Mn(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ft{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){P(e.idToken,"internal-error"),P(typeof e.idToken<"u","internal-error"),P(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Br(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){P(e.length!==0,"internal-error");const t=Br(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(P(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:s,refreshToken:r,expiresIn:a}=await _f(e,t);this.updateTokensAndExpiration(s,r,Number(a))}updateTokensAndExpiration(e,t,s){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+s*1e3}static fromJSON(e,t){const{refreshToken:s,accessToken:r,expirationTime:a}=t,l=new ft;return s&&(P(typeof s=="string","internal-error",{appName:e}),l.refreshToken=s),r&&(P(typeof r=="string","internal-error",{appName:e}),l.accessToken=r),a&&(P(typeof a=="number","internal-error",{appName:e}),l.expirationTime=a),l}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new ft,this.toJSON())}_performRefresh(){return Ee("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pe(n,e){P(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class he{constructor({uid:e,auth:t,stsTokenManager:s,...r}){this.providerId="firebase",this.proactiveRefresh=new mf(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=e,this.auth=t,this.stsTokenManager=s,this.accessToken=s.accessToken,this.displayName=r.displayName||null,this.email=r.email||null,this.emailVerified=r.emailVerified||!1,this.phoneNumber=r.phoneNumber||null,this.photoURL=r.photoURL||null,this.isAnonymous=r.isAnonymous||!1,this.tenantId=r.tenantId||null,this.providerData=r.providerData?[...r.providerData]:[],this.metadata=new Li(r.createdAt||void 0,r.lastLoginAt||void 0)}async getIdToken(e){const t=await Ut(this,this.stsTokenManager.getToken(this.auth,e));return P(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return pf(this,e)}reload(){return yf(this)}_assign(e){this!==e&&(P(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>({...t})),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new he({...this,auth:e,stsTokenManager:this.stsTokenManager._clone()});return t.metadata._copy(this.metadata),t}_onReload(e){P(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let s=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),s=!0),t&&await In(this),await this.auth._persistUserIfCurrent(this),s&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(le(this.auth.app))return Promise.reject(Be(this.auth));const e=await this.getIdToken();return await Ut(this,df(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return{uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>({...e})),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId,...this.metadata.toJSON(),apiKey:this.auth.config.apiKey,appName:this.auth.name}}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){const s=t.displayName??void 0,r=t.email??void 0,a=t.phoneNumber??void 0,l=t.photoURL??void 0,u=t.tenantId??void 0,f=t._redirectEventId??void 0,m=t.createdAt??void 0,b=t.lastLoginAt??void 0,{uid:v,emailVerified:A,isAnonymous:O,providerData:M,stsTokenManager:D}=t;P(v&&D,e,"internal-error");const C=ft.fromJSON(this.name,D);P(typeof v=="string",e,"internal-error"),Pe(s,e.name),Pe(r,e.name),P(typeof A=="boolean",e,"internal-error"),P(typeof O=="boolean",e,"internal-error"),Pe(a,e.name),Pe(l,e.name),Pe(u,e.name),Pe(f,e.name),Pe(m,e.name),Pe(b,e.name);const j=new he({uid:v,auth:e,email:r,emailVerified:A,displayName:s,isAnonymous:O,photoURL:l,phoneNumber:a,tenantId:u,stsTokenManager:C,createdAt:m,lastLoginAt:b});return M&&Array.isArray(M)&&(j.providerData=M.map(Y=>({...Y}))),f&&(j._redirectEventId=f),j}static async _fromIdTokenResponse(e,t,s=!1){const r=new ft;r.updateFromServerResponse(t);const a=new he({uid:t.localId,auth:e,stsTokenManager:r,isAnonymous:s});return await In(a),a}static async _fromGetAccountInfoResponse(e,t,s){const r=t.users[0];P(r.localId!==void 0,"internal-error");const a=r.providerUserInfo!==void 0?ua(r.providerUserInfo):[],l=!(r.email&&r.passwordHash)&&!(a!=null&&a.length),u=new ft;u.updateFromIdToken(s);const f=new he({uid:r.localId,auth:e,stsTokenManager:u,isAnonymous:l}),m={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:a,metadata:new Li(r.createdAt,r.lastLoginAt),isAnonymous:!(r.email&&r.passwordHash)&&!(a!=null&&a.length)};return Object.assign(f,m),f}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jr=new Map;function Ie(n){be(n instanceof Function,"Expected a class definition");let e=jr.get(n);return e?(be(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,jr.set(n,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fa{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}fa.type="NONE";const Hr=fa;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pn(n,e,t){return`firebase:${n}:${e}:${t}`}class Ze{constructor(e,t,s){this.persistence=e,this.auth=t,this.userKey=s;const{config:r,name:a}=this.auth;this.fullUserKey=pn(this.userKey,r.apiKey,a),this.fullPersistenceKey=pn("persistence",r.apiKey,a),this.boundEventHandler=t._onStorageEvent.bind(t);try{this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}catch{}}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);if(!e)return null;if(typeof e=="string"){const t=await En(this.auth,{idToken:e}).catch(()=>{});return t?he._fromGetAccountInfoResponse(this.auth,t,e):null}return he._fromJSON(this.auth,e)}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){try{this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}catch{}}static async create(e,t,s="authUser"){if(!t.length)return new Ze(Ie(Hr),e,s);const r=(await Promise.all(t.map(async m=>{try{if(await m._isAvailable())return m}catch{return}}))).filter(m=>m);let a=r[0]||Ie(Hr);const l=pn(s,e.config.apiKey,e.name);let u=null;for(const m of t)try{const b=await m._get(l);if(b){let v;if(typeof b=="string"){const A=await En(e,{idToken:b}).catch(()=>{});if(!A)break;v=await he._fromGetAccountInfoResponse(e,A,b)}else v=he._fromJSON(e,b);m!==a&&(u=v),a=m;break}}catch{}const f=r.filter(m=>m._shouldAllowMigration);return!a._shouldAllowMigration||!f.length?new Ze(a,e,s):(a=f[0],u&&await a._set(l,u.toJSON()),await Promise.all(t.map(async m=>{if(m!==a)try{await m._remove(l)}catch{}})),new Ze(a,e,s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vr(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(ma(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(da(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(wa(e))return"Blackberry";if(_a(e))return"Webos";if(pa(e))return"Safari";if((e.includes("chrome/")||ga(e))&&!e.includes("edge/"))return"Chrome";if(ya(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,s=n.match(t);if((s==null?void 0:s.length)===2)return s[1]}return"Other"}function da(n=Z()){return/firefox\//i.test(n)}function pa(n=Z()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function ga(n=Z()){return/crios\//i.test(n)}function ma(n=Z()){return/iemobile/i.test(n)}function ya(n=Z()){return/android/i.test(n)}function wa(n=Z()){return/blackberry/i.test(n)}function _a(n=Z()){return/webos/i.test(n)}function ts(n=Z()){return/iphone|ipad|ipod/i.test(n)||/macintosh/i.test(n)&&/mobile/i.test(n)}function If(n=Z()){var e;return ts(n)&&!!((e=window.navigator)!=null&&e.standalone)}function Tf(){return Fc()&&document.documentMode===10}function Ea(n=Z()){return ts(n)||ya(n)||_a(n)||wa(n)||/windows phone/i.test(n)||ma(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ia(n,e=[]){let t;switch(n){case"Browser":t=Vr(Z());break;case"Worker":t=`${Vr(Z())}-${n}`;break;default:t=n}const s=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${it}/${s}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vf{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const s=a=>new Promise((l,u)=>{try{const f=e(a);l(f)}catch(f){u(f)}});s.onAbort=t,this.queue.push(s);const r=this.queue.length-1;return()=>{this.queue[r]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const s of this.queue)await s(e),s.onAbort&&t.push(s.onAbort)}catch(s){t.reverse();for(const r of t)try{r()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:s==null?void 0:s.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function bf(n,e={}){return gt(n,"GET","/v2/passwordPolicy",Mn(n,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sf=6;class Af{constructor(e){var s;const t=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=t.minPasswordLength??Sf,t.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=t.maxPasswordLength),t.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=t.containsLowercaseCharacter),t.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=t.containsUppercaseCharacter),t.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=t.containsNumericCharacter),t.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=t.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=((s=e.allowedNonAlphanumericCharacters)==null?void 0:s.join(""))??"",this.forceUpgradeOnSignin=e.forceUpgradeOnSignin??!1,this.schemaVersion=e.schemaVersion}validatePassword(e){const t={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,t),this.validatePasswordCharacterOptions(e,t),t.isValid&&(t.isValid=t.meetsMinPasswordLength??!0),t.isValid&&(t.isValid=t.meetsMaxPasswordLength??!0),t.isValid&&(t.isValid=t.containsLowercaseLetter??!0),t.isValid&&(t.isValid=t.containsUppercaseLetter??!0),t.isValid&&(t.isValid=t.containsNumericCharacter??!0),t.isValid&&(t.isValid=t.containsNonAlphanumericCharacter??!0),t}validatePasswordLengthOptions(e,t){const s=this.customStrengthOptions.minPasswordLength,r=this.customStrengthOptions.maxPasswordLength;s&&(t.meetsMinPasswordLength=e.length>=s),r&&(t.meetsMaxPasswordLength=e.length<=r)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let s;for(let r=0;r<e.length;r++)s=e.charAt(r),this.updatePasswordCharacterOptionsStatuses(t,s>="a"&&s<="z",s>="A"&&s<="Z",s>="0"&&s<="9",this.allowedNonAlphanumericCharacters.includes(s))}updatePasswordCharacterOptionsStatuses(e,t,s,r,a){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=s)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=r)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=a))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cf{constructor(e,t,s,r){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=s,this.config=r,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Gr(this),this.idTokenSubscription=new Gr(this),this.beforeStateQueue=new vf(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=oa,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this._resolvePersistenceManagerAvailable=void 0,this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=r.sdkClientVersion,this._persistenceManagerAvailable=new Promise(a=>this._resolvePersistenceManagerAvailable=a)}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=Ie(t)),this._initializationPromise=this.queue(async()=>{var s,r,a;if(!this._deleted){try{this.persistenceManager=await Ze.create(this,e)}catch(l){fn(`Failed to initialize persistence: ${l}`),this.persistenceManager=await Ze.create(this,[])}finally{(s=this._resolvePersistenceManagerAvailable)==null||s.call(this)}if(!this._deleted){if((r=this._popupRedirectResolver)!=null&&r._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}try{await this.initializeCurrentUser(t)}catch(l){fn(`Failed to initialize current user: ${l}`),await this.directlySetCurrentUser(null).catch(()=>{})}this.lastNotifiedUid=((a=this.currentUser)==null?void 0:a.uid)||null,!this._deleted&&(this._isInitialized=!0)}}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await En(this,{idToken:e}),s=await he._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(s)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var a;if(le(this.app)){const l=this.app.settings.authIdToken;return l?new Promise(u=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(l).then(u,u))}):this.directlySetCurrentUser(null)}const t=await this.assertedPersistence.getCurrentUser();let s=t,r=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const l=(a=this.redirectUser)==null?void 0:a._redirectEventId,u=s==null?void 0:s._redirectEventId,f=await this.tryRedirectSignIn(e);(!l||l===u)&&(f!=null&&f.user)&&(s=f.user,r=!0)}if(!s)return this.directlySetCurrentUser(null);if(!s._redirectEventId){if(r)try{await this.beforeStateQueue.runMiddleware(s)}catch(l){s=t,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(l))}return s?this.reloadAndSetCurrentUserOrClear(s):this.directlySetCurrentUser(null)}return P(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===s._redirectEventId?this.directlySetCurrentUser(s):this.reloadAndSetCurrentUserOrClear(s)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await In(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=cf()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(le(this.app))return Promise.reject(Be(this));const t=e?J(e):null;return t&&P(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&P(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return le(this.app)?Promise.reject(Be(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return le(this.app)?Promise.reject(Be(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(Ie(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await bf(this),t=new Af(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistenceType(){return this.assertedPersistence.persistence.type}_getPersistence(){return this.assertedPersistence.persistence}_updateErrorMap(e){this._errorFactory=new He("auth","Firebase",e())}onAuthStateChanged(e,t,s){return this.registerStateListener(this.authStateSubscription,e,t,s)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,s){return this.registerStateListener(this.idTokenSubscription,e,t,s)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const s=this.onAuthStateChanged(()=>{s(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),s={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(s.tenantId=this.tenantId),await Ef(this,s)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)==null?void 0:e.toJSON()}}async _setRedirectUser(e,t){const s=await this.getOrInitRedirectPersistenceManager(t);return e===null?s.removeCurrentUser():s.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&Ie(e)||this._popupRedirectResolver;P(t,this,"argument-error"),this.redirectPersistenceManager=await Ze.create(this,[Ie(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,s;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)==null?void 0:t._redirectEventId)===e?this._currentUser:((s=this.redirectUser)==null?void 0:s._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const e=((t=this.currentUser)==null?void 0:t.uid)??null;this.lastNotifiedUid!==e&&(this.lastNotifiedUid=e,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,s,r){if(this._deleted)return()=>{};const a=typeof t=="function"?t:t.next.bind(t);let l=!1;const u=this._isInitialized?Promise.resolve():this._initializationPromise;if(P(u,this,"internal-error"),u.then(()=>{l||a(this.currentUser)}).catch(f=>{if(!l)if(typeof t!="function"&&t.error)t.error(f);else if(s)s(f);else throw f}),typeof t=="function"){const f=e.addObserver(t,s,r);return()=>{l=!0,f()}}else{const f=e.addObserver(t);return()=>{l=!0,f()}}}async directlySetCurrentUser(e){if(this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,this.persistenceManager)try{e?await this.persistenceManager.setCurrentUser(e):await this.persistenceManager.removeCurrentUser()}catch(t){const s=(t==null?void 0:t.message)||String(t),r=Xi(this,"internal-error",`An internal AuthError has occurred: ${s}`);throw r.customData={originalError:t},r}}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return P(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=Ia(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var r;const e={"X-Client-Version":this.clientVersion};this.app.options.appId&&(e["X-Firebase-gmpid"]=this.app.options.appId);const t=await((r=this.heartbeatServiceProvider.getImmediate({optional:!0}))==null?void 0:r.getHeartbeatsHeader());t&&(e["X-Firebase-Client"]=t);const s=await this._getAppCheckToken();return s&&(e["X-Firebase-AppCheck"]=s),e}async _getAppCheckToken(){var t;if(le(this.app)&&this.app.settings.appCheckToken)return this.app.settings.appCheckToken;const e=await((t=this.appCheckServiceProvider.getImmediate({optional:!0}))==null?void 0:t.getToken());return e!=null&&e.error&&fn(`Error while retrieving App Check token: ${e.error}`),e==null?void 0:e.token}}function Nn(n){return J(n)}class Gr{constructor(e){this.auth=e,this.observer=null,this.addObserver=Hc(t=>this.observer=t)}get next(){return P(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ns={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function Rf(n){ns=n}function kf(n){return ns.loadJS(n)}function Of(){return ns.gapiScript}function Pf(n){return`__${n}${Math.floor(Math.random()*1e6)}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Mf(n,e){const t=Ve(n,"auth");if(t.isInitialized()){const r=t.getImmediate(),a=t.getOptions();if(tt(a,e??{}))return r;ve(r,"already-initialized")}return t.initialize({options:e})}function Nf(n,e){const t=(e==null?void 0:e.persistence)||[],s=(Array.isArray(t)?t:[t]).map(Ie);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(s,e==null?void 0:e.popupRedirectResolver)}function Df(n,e,t){const s=Nn(n);P(/^https?:\/\//.test(e),s,"invalid-emulator-scheme");const r=!1,a=Ta(e),{host:l,port:u}=Lf(e),f=u===null?"":`:${u}`,m={url:`${a}//${l}${f}/`},b=Object.freeze({host:l,port:u,protocol:a.replace(":",""),options:Object.freeze({disableWarnings:r})});if(!s._canInitEmulator){P(s.config.emulator&&s.emulatorConfig,s,"emulator-config-failed"),P(tt(m,s.config.emulator)&&tt(b,s.emulatorConfig),s,"emulator-config-failed");return}s.config.emulator=m,s.emulatorConfig=b,s.settings.appVerificationDisabledForTesting=!0,Bi(l)?Jc(`${a}//${l}${f}`):xf()}function Ta(n){const e=n.indexOf(":");return e<0?"":n.substr(0,e+1)}function Lf(n){const e=Ta(n),t=/(\/\/)?([^?#/]+)/.exec(n.substr(e.length));if(!t)return{host:"",port:null};const s=t[2].split("@").pop()||"",r=/^(\[[^\]]+\])(:|$)/.exec(s);if(r){const a=r[1];return{host:a,port:zr(s.substr(a.length+1))}}else{const[a,l]=s.split(":");return{host:a,port:zr(l)}}}function zr(n){if(!n)return null;const e=Number(n);return isNaN(e)?null:e}function xf(){function n(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",n):n())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class va{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return Ee("not implemented")}_getIdTokenResponse(e){return Ee("not implemented")}_linkToIdToken(e,t){return Ee("not implemented")}_getReauthenticationResolver(e){return Ee("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function dt(n,e){return la(n,"POST","/v1/accounts:signInWithIdp",Mn(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ff="http://localhost";class ot extends va{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new ot(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):ve("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:s,signInMethod:r,...a}=t;if(!s||!r)return null;const l=new ot(s,r);return l.idToken=a.idToken||void 0,l.accessToken=a.accessToken||void 0,l.secret=a.secret,l.nonce=a.nonce,l.pendingToken=a.pendingToken||null,l}_getIdTokenResponse(e){const t=this.buildRequest();return dt(e,t)}_linkToIdToken(e,t){const s=this.buildRequest();return s.idToken=t,dt(e,s)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,dt(e,t)}buildRequest(){const e={requestUri:Ff,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=$t(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ba{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ht extends ba{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class De extends Ht{constructor(){super("facebook.com")}static credential(e){return ot._fromParams({providerId:De.PROVIDER_ID,signInMethod:De.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return De.credentialFromTaggedObject(e)}static credentialFromError(e){return De.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return De.credential(e.oauthAccessToken)}catch{return null}}}De.FACEBOOK_SIGN_IN_METHOD="facebook.com";De.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le extends Ht{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return ot._fromParams({providerId:Le.PROVIDER_ID,signInMethod:Le.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return Le.credentialFromTaggedObject(e)}static credentialFromError(e){return Le.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:s}=e;if(!t&&!s)return null;try{return Le.credential(t,s)}catch{return null}}}Le.GOOGLE_SIGN_IN_METHOD="google.com";Le.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xe extends Ht{constructor(){super("github.com")}static credential(e){return ot._fromParams({providerId:xe.PROVIDER_ID,signInMethod:xe.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return xe.credentialFromTaggedObject(e)}static credentialFromError(e){return xe.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return xe.credential(e.oauthAccessToken)}catch{return null}}}xe.GITHUB_SIGN_IN_METHOD="github.com";xe.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fe extends Ht{constructor(){super("twitter.com")}static credential(e,t){return ot._fromParams({providerId:Fe.PROVIDER_ID,signInMethod:Fe.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return Fe.credentialFromTaggedObject(e)}static credentialFromError(e){return Fe.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:s}=e;if(!t||!s)return null;try{return Fe.credential(t,s)}catch{return null}}}Fe.TWITTER_SIGN_IN_METHOD="twitter.com";Fe.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Uf(n,e){return la(n,"POST","/v1/accounts:signUp",Mn(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class je{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,s,r=!1){const a=await he._fromIdTokenResponse(e,s,r),l=Wr(s);return new je({user:a,providerId:l,_tokenResponse:s,operationType:t})}static async _forOperation(e,t,s){await e._updateTokensIfNecessary(s,!0);const r=Wr(s);return new je({user:e,providerId:r,_tokenResponse:s,operationType:t})}}function Wr(n){return n.providerId?n.providerId:"phoneNumber"in n?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function hg(n){var r;if(le(n.app))return Promise.reject(Be(n));const e=Nn(n);if(await e._initializationPromise,(r=e.currentUser)!=null&&r.isAnonymous)return new je({user:e.currentUser,providerId:null,operationType:"signIn"});const t=await Uf(e,{returnSecureToken:!0}),s=await je._fromIdTokenResponse(e,"signIn",t,!0);return await e._updateCurrentUser(s.user),s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Tn extends oe{constructor(e,t,s,r){super(t.code,t.message),this.operationType=s,this.user=r,Object.setPrototypeOf(this,Tn.prototype),this.customData={appName:e.name,tenantId:e.tenantId??void 0,_serverResponse:t.customData._serverResponse,operationType:s}}static _fromErrorAndOperation(e,t,s,r){return new Tn(e,t,s,r)}}function Sa(n,e,t,s){return(e==="reauthenticate"?t._getReauthenticationResolver(n):t._getIdTokenResponse(n)).catch(a=>{throw a.code==="auth/multi-factor-auth-required"?Tn._fromErrorAndOperation(n,a,e,s):a})}async function $f(n,e,t=!1){const s=await Ut(n,e._linkToIdToken(n.auth,await n.getIdToken()),t);return je._forOperation(n,"link",s)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Bf(n,e,t=!1){const{auth:s}=n;if(le(s.app))return Promise.reject(Be(s));const r="reauthenticate";try{const a=await Ut(n,Sa(s,r,e,n),t);P(a.idToken,s,"internal-error");const l=es(a.idToken);P(l,s,"internal-error");const{sub:u}=l;return P(n.uid===u,s,"user-mismatch"),je._forOperation(n,r,a)}catch(a){throw(a==null?void 0:a.code)==="auth/user-not-found"&&ve(s,"user-mismatch"),a}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function jf(n,e,t=!1){if(le(n.app))return Promise.reject(Be(n));const s="signIn",r=await Sa(n,s,e),a=await je._fromIdTokenResponse(n,s,r);return t||await n._updateCurrentUser(a.user),a}function Hf(n,e,t,s){return J(n).onIdTokenChanged(e,t,s)}function Vf(n,e,t){return J(n).beforeAuthStateChanged(e,t)}const vn="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Aa{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(vn,"1"),this.storage.removeItem(vn),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gf=1e3,zf=10;class Ca extends Aa{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Ea(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const s=this.storage.getItem(t),r=this.localCache[t];s!==r&&e(t,r,s)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((l,u,f)=>{this.notifyListeners(l,f)});return}const s=e.key;t?this.detachListener():this.stopPolling();const r=()=>{const l=this.storage.getItem(s);!t&&this.localCache[s]===l||this.notifyListeners(s,l)},a=this.storage.getItem(s);Tf()&&a!==e.newValue&&e.newValue!==e.oldValue?setTimeout(r,zf):r()}notifyListeners(e,t){this.localCache[e]=t;const s=this.listeners[e];if(s)for(const r of Array.from(s))r(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,s)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:s}),!0)})},Gf)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}Ca.type="LOCAL";const Wf=Ca;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ra extends Aa{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Ra.type="SESSION";const ka=Ra;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Kf(n){return Promise.all(n.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dn{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(r=>r.isListeningto(e));if(t)return t;const s=new Dn(e);return this.receivers.push(s),s}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:s,eventType:r,data:a}=t.data,l=this.handlersMap[r];if(!(l!=null&&l.size))return;t.ports[0].postMessage({status:"ack",eventId:s,eventType:r});const u=Array.from(l).map(async m=>m(t.origin,a)),f=await Kf(u);t.ports[0].postMessage({status:"done",eventId:s,eventType:r,response:f})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}Dn.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function is(n="",e=10){let t="";for(let s=0;s<e;s++)t+=Math.floor(Math.random()*10);return n+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qf{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,s=50){const r=typeof MessageChannel<"u"?new MessageChannel:null;if(!r)throw new Error("connection_unavailable");let a,l;return new Promise((u,f)=>{const m=is("",20);r.port1.start();const b=setTimeout(()=>{f(new Error("unsupported_event"))},s);l={messageChannel:r,onMessage(v){const A=v;if(A.data.eventId===m)switch(A.data.status){case"ack":clearTimeout(b),a=setTimeout(()=>{f(new Error("timeout"))},3e3);break;case"done":clearTimeout(a),u(A.data.response);break;default:clearTimeout(b),clearTimeout(a),f(new Error("invalid_response"));break}}},this.handlers.add(l),r.port1.addEventListener("message",l.onMessage),this.target.postMessage({eventType:e,eventId:m,data:t},[r.port2])}).finally(()=>{l&&this.removeMessageHandler(l)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function me(){return window}function Jf(n){me().location.href=n}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Oa(){return typeof me().WorkerGlobalScope<"u"&&typeof me().importScripts=="function"}async function Yf(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function Xf(){var n;return((n=navigator==null?void 0:navigator.serviceWorker)==null?void 0:n.controller)||null}function Qf(){return Oa()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pa="firebaseLocalStorageDb",Zf=1,bn="firebaseLocalStorage",Ma="fbase_key";class Vt{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function Ln(n,e){return n.transaction([bn],e?"readwrite":"readonly").objectStore(bn)}function ed(){const n=indexedDB.deleteDatabase(Pa);return new Vt(n).toPromise()}function Na(){const n=indexedDB.open(Pa,Zf);return new Promise((e,t)=>{n.addEventListener("error",()=>{t(n.error)}),n.addEventListener("upgradeneeded",()=>{const s=n.result;try{s.createObjectStore(bn,{keyPath:Ma})}catch(r){t(r)}}),n.addEventListener("success",async()=>{const s=n.result;s.objectStoreNames.contains(bn)?e(s):(s.close(),await ed(),e(await Na()))})})}async function Kr(n,e,t){const s=Ln(n,!0).put({[Ma]:e,value:t});return new Vt(s).toPromise()}async function td(n,e){const t=Ln(n,!1).get(e),s=await new Vt(t).toPromise();return s===void 0?null:s.value}function qr(n,e){const t=Ln(n,!0).delete(e);return new Vt(t).toPromise()}const nd=800,id=3;class Da{registerLifecycleListeners(){typeof window<"u"&&typeof window.addEventListener=="function"&&(window.addEventListener("pagehide",this.onPageHide),window.addEventListener("pageshow",this.onPageShow))}unregisterLifecycleListeners(){typeof window<"u"&&typeof window.removeEventListener=="function"&&(window.removeEventListener("pagehide",this.onPageHide),window.removeEventListener("pageshow",this.onPageShow))}constructor(){this.type="LOCAL",this.dbPromise=null,this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.isClosing=!1,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this.onPageHide=()=>{this.isClosing=!0,this.stopPolling(),this.dbPromise&&(this.dbPromise.then(e=>e.close()).catch(()=>{}),this.dbPromise=null)},this.onPageShow=()=>{this.isClosing&&(this.isClosing=!1,Object.keys(this.listeners).length>0&&this.startPolling())},this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.dbPromise?this.dbPromise:(this.dbPromise=Na(),this.dbPromise.catch(()=>{this.dbPromise=null}),this.dbPromise)}async _withRetries(e){let t=0;for(;;)try{const s=await this._openDb();return await e(s)}catch(s){if(t++>id)throw s;if(this.dbPromise){const r=this.dbPromise;this.dbPromise=null;try{(await r).close()}catch{}}}}async initializeServiceWorkerMessaging(){return Oa()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=Dn._getInstance(Qf()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var t,s;if(this.activeServiceWorker=await Yf(),!this.activeServiceWorker)return;this.sender=new qf(this.activeServiceWorker);const e=await this.sender._send("ping",{},800);e&&(t=e[0])!=null&&t.fulfilled&&(s=e[0])!=null&&s.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||Xf()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{return indexedDB?(await this._withRetries(async e=>{await Kr(e,vn,"1"),await qr(e,vn)}),!0):!1}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(s=>Kr(s,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(s=>td(s,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>qr(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){if(this.isClosing)return[];try{const e=await this._withRetries(r=>{const a=Ln(r,!1).getAll();return new Vt(a).toPromise()});if(this.isClosing)return[];if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],s=new Set;if(e.length!==0)for(const{fbase_key:r,value:a}of e)s.add(r),JSON.stringify(this.localCache[r])!==JSON.stringify(a)&&(this.notifyListeners(r,a),t.push(r));for(const r of Object.keys(this.localCache))this.localCache[r]&&!s.has(r)&&(this.notifyListeners(r,null),t.push(r));return t}catch(e){return this.isClosing||fn(`Firebase Auth cross-tab polling failed with error: ${e}`),[]}}notifyListeners(e,t){this.localCache[e]=t;const s=this.listeners[e];if(s)for(const r of Array.from(s))r(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),nd)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.startPolling(),this.registerLifecycleListeners()),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.stopPolling(),this.unregisterLifecycleListeners())}}Da.type="LOCAL";const sd=Da;new jt(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function rd(n,e){return e?Ie(e):(P(n._popupRedirectResolver,n,"argument-error"),n._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ss extends va{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return dt(e,this._buildIdpRequest())}_linkToIdToken(e,t){return dt(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return dt(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function od(n){return jf(n.auth,new ss(n),n.bypassAuthState)}function ad(n){const{auth:e,user:t}=n;return P(t,e,"internal-error"),Bf(t,new ss(n),n.bypassAuthState)}async function cd(n){const{auth:e,user:t}=n;return P(t,e,"internal-error"),$f(t,new ss(n),n.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class La{constructor(e,t,s,r,a=!1){this.auth=e,this.resolver=s,this.user=r,this.bypassAuthState=a,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(s){this.reject(s)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:s,postBody:r,tenantId:a,error:l,type:u}=e;if(l){this.reject(l);return}const f={auth:this.auth,requestUri:t,sessionId:s,tenantId:a||void 0,postBody:r||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(u)(f))}catch(m){this.reject(m)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return od;case"linkViaPopup":case"linkViaRedirect":return cd;case"reauthViaPopup":case"reauthViaRedirect":return ad;default:ve(this.auth,"internal-error")}}resolve(e){be(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){be(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ld=new jt(2e3,1e4);class ut extends La{constructor(e,t,s,r,a){super(e,t,r,a),this.provider=s,this.authWindow=null,this.pollId=null,ut.currentPopupAction&&ut.currentPopupAction.cancel(),ut.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return P(e,this.auth,"internal-error"),e}async onExecution(){be(this.filter.length===1,"Popup operations only handle one event");const e=is();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(ge(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)==null?void 0:e.associatedEvent)||null}cancel(){this.reject(ge(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,ut.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,s;if((s=(t=this.authWindow)==null?void 0:t.window)!=null&&s.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(ge(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,ld.get())};e()}}ut.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hd="pendingRedirect",gn=new Map;class ud extends La{constructor(e,t,s=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,s),this.eventId=null}async execute(){let e=gn.get(this.auth._key());if(!e){try{const s=await fd(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(s)}catch(t){e=()=>Promise.reject(t)}gn.set(this.auth._key(),e)}return this.bypassAuthState||gn.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function fd(n,e){const t=gd(e),s=pd(n);if(!await s._isAvailable())return!1;const r=await s._get(t)==="true";return await s._remove(t),r}function dd(n,e){gn.set(n._key(),e)}function pd(n){return Ie(n._redirectPersistence)}function gd(n){return pn(hd,n.config.apiKey,n.name)}async function md(n,e,t=!1){if(le(n.app))return Promise.reject(Be(n));const s=Nn(n),r=rd(s,e),l=await new ud(s,r,t).execute();return l&&!t&&(delete l.user._redirectEventId,await s._persistUserIfCurrent(l.user),await s._setRedirectUser(null,e)),l}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yd=600*1e3;class wd{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(s=>{this.isEventForConsumer(e,s)&&(t=!0,this.sendToConsumer(e,s),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!_d(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var s;if(e.error&&!xa(e)){const r=((s=e.error.code)==null?void 0:s.split("auth/")[1])||"internal-error";t.onError(ge(this.auth,r))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const s=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&s}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=yd&&this.cachedEventUids.clear(),this.cachedEventUids.has(Jr(e))}saveEventToCache(e){this.cachedEventUids.add(Jr(e)),this.lastProcessedEventTime=Date.now()}}function Jr(n){return[n.type,n.eventId,n.sessionId,n.tenantId].filter(e=>e).join("-")}function xa({type:n,error:e}){return n==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function _d(n){switch(n.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return xa(n);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Ed(n,e={}){return gt(n,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Id=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,Td=/^https?/;async function vd(n){if(n.config.emulator)return;const{authorizedDomains:e}=await Ed(n);for(const t of e)try{if(bd(t))return}catch{}ve(n,"unauthorized-domain")}function bd(n){const e=Di(),{protocol:t,hostname:s}=new URL(e);if(n.startsWith("chrome-extension://")){const l=new URL(n);return l.hostname===""&&s===""?t==="chrome-extension:"&&n.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&l.hostname===s}if(!Td.test(t))return!1;if(Id.test(n))return s===n;const r=n.replace(/\./g,"\\.");return new RegExp("^(.+\\."+r+"|"+r+")$","i").test(s)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Sd=new jt(3e4,6e4);function Yr(){const n=me().___jsl;if(n!=null&&n.H){for(const e of Object.keys(n.H))if(n.H[e].r=n.H[e].r||[],n.H[e].L=n.H[e].L||[],n.H[e].r=[...n.H[e].L],n.CP)for(let t=0;t<n.CP.length;t++)n.CP[t]=null}}function Ad(n){return new Promise((e,t)=>{var r,a,l;function s(){Yr(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Yr(),t(ge(n,"network-request-failed"))},timeout:Sd.get()})}if((a=(r=me().gapi)==null?void 0:r.iframes)!=null&&a.Iframe)e(gapi.iframes.getContext());else if((l=me().gapi)!=null&&l.load)s();else{const u=Pf("iframefcb");return me()[u]=()=>{gapi.load?s():t(ge(n,"network-request-failed"))},kf(`${Of()}?onload=${u}`).catch(f=>t(f))}}).catch(e=>{throw mn=null,e})}let mn=null;function Cd(n){return mn=mn||Ad(n),mn}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rd=new jt(5e3,15e3),kd="__/auth/iframe",Od="emulator/auth/iframe",Pd={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},Md=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function Nd(n){const e=n.config;P(e.authDomain,n,"auth-domain-config-required");const t=e.emulator?Zi(e,Od):`https://${n.config.authDomain}/${kd}`,s={apiKey:e.apiKey,appName:n.name,v:it},r=Md.get(n.config.apiHost);r&&(s.eid=r);const a=n._getFrameworks();return a.length&&(s.fw=a.join(",")),`${t}?${$t(s).slice(1)}`}async function Dd(n){const e=await Cd(n),t=me().gapi;return P(t,n,"internal-error"),e.open({where:document.body,url:Nd(n),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Pd,dontclear:!0},s=>new Promise(async(r,a)=>{await s.restyle({setHideOnLeave:!1});const l=ge(n,"network-request-failed"),u=me().setTimeout(()=>{a(l)},Rd.get());function f(){me().clearTimeout(u),r(s)}s.ping(f).then(f,()=>{a(l)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ld={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},xd=500,Fd=600,Ud="_blank",$d="http://localhost";class Xr{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function Bd(n,e,t,s=xd,r=Fd){const a=Math.max((window.screen.availHeight-r)/2,0).toString(),l=Math.max((window.screen.availWidth-s)/2,0).toString();let u="";const f={...Ld,width:s.toString(),height:r.toString(),top:a,left:l},m=Z().toLowerCase();t&&(u=ga(m)?Ud:t),da(m)&&(e=e||$d,f.scrollbars="yes");const b=Object.entries(f).reduce((A,[O,M])=>`${A}${O}=${M},`,"");if(If(m)&&u!=="_self")return jd(e||"",u),new Xr(null);const v=window.open(e||"",u,b);P(v,n,"popup-blocked");try{v.focus()}catch{}return new Xr(v)}function jd(n,e){const t=document.createElement("a");t.href=n,t.target=e;const s=document.createEvent("MouseEvent");s.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(s)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hd="__/auth/handler",Vd="emulator/auth/handler",Gd=encodeURIComponent("fac");async function Qr(n,e,t,s,r,a){P(n.config.authDomain,n,"auth-domain-config-required"),P(n.config.apiKey,n,"invalid-api-key");const l={apiKey:n.config.apiKey,appName:n.name,authType:t,redirectUrl:s,v:it,eventId:r};if(e instanceof ba){e.setDefaultLanguage(n.languageCode),l.providerId=e.providerId||"",jc(e.getCustomParameters())||(l.customParameters=JSON.stringify(e.getCustomParameters()));for(const[b,v]of Object.entries({}))l[b]=v}if(e instanceof Ht){const b=e.getScopes().filter(v=>v!=="");b.length>0&&(l.scopes=b.join(","))}n.tenantId&&(l.tid=n.tenantId);const u=l;for(const b of Object.keys(u))u[b]===void 0&&delete u[b];const f=await n._getAppCheckToken(),m=f?`#${Gd}=${encodeURIComponent(f)}`:"";return`${zd(n)}?${$t(u).slice(1)}${m}`}function zd({config:n}){return n.emulator?Zi(n,Vd):`https://${n.authDomain}/${Hd}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _i="webStorageSupport";class Wd{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=ka,this._completeRedirectFn=md,this._overrideRedirectResult=dd}async _openPopup(e,t,s,r){var l;be((l=this.eventManagers[e._key()])==null?void 0:l.manager,"_initialize() not called before _openPopup()");const a=await Qr(e,t,s,Di(),r);return Bd(e,a,is())}async _openRedirect(e,t,s,r){await this._originValidation(e);const a=await Qr(e,t,s,Di(),r);return Jf(a),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:r,promise:a}=this.eventManagers[t];return r?Promise.resolve(r):(be(a,"If manager is not set, promise should be"),a)}const s=this.initAndGetManager(e);return this.eventManagers[t]={promise:s},s.catch(()=>{delete this.eventManagers[t]}),s}async initAndGetManager(e){const t=await Dd(e),s=new wd(e);return t.register("authEvent",r=>(P(r==null?void 0:r.authEvent,e,"invalid-auth-event"),{status:s.onEvent(r.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:s},this.iframes[e._key()]=t,s}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(_i,{type:_i},r=>{var l;const a=(l=r==null?void 0:r[0])==null?void 0:l[_i];a!==void 0&&t(!!a),ve(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=vd(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return Ea()||pa()||ts()}}const Kd=Wd;var Zr="@firebase/auth",eo="1.13.6";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qd{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)==null?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(s=>{e((s==null?void 0:s.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){P(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Jd(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function Yd(n){fe(new re("auth",(e,{options:t})=>{const s=e.getProvider("app").getImmediate(),r=e.getProvider("heartbeat"),a=e.getProvider("app-check-internal"),{apiKey:l,authDomain:u}=s.options;P(l&&!l.includes(":"),"invalid-api-key",{appName:s.name});const f={apiKey:l,authDomain:u,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:Ia(n)},m=new Cf(s,r,a,f);return Nf(m,t),m},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,s)=>{e.getProvider("auth-internal").initialize()})),fe(new re("auth-internal",e=>{const t=Nn(e.getProvider("auth").getImmediate());return(s=>new qd(s))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),ie(Zr,eo,Jd(n)),ie(Zr,eo,"esm2020")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Xd=300,Qd=yo("authIdTokenMaxAge")||Xd;let to=null;const Zd=n=>async e=>{const t=e&&await e.getIdTokenResult(),s=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(s&&s>Qd)return;const r=t==null?void 0:t.token;to!==r&&(to=r,await fetch(n,{method:r?"POST":"DELETE",headers:r?{Authorization:`Bearer ${r}`}:{}}))};function ug(n=Rn()){const e=Ve(n,"auth");if(e.isInitialized())return e.getImmediate();const t=Mf(n,{popupRedirectResolver:Kd,persistence:[sd,Wf,ka]}),s=yo("authTokenSyncURL");if(s&&typeof isSecureContext=="boolean"&&isSecureContext){const a=new URL(s,location.origin);if(location.origin===a.origin){const l=Zd(a.toString());Vf(t,l,()=>l(t.currentUser)),Hf(t,u=>l(u))}}const r=go("auth");return r&&Df(t,`http://${r}`),t}function ep(){var n;return((n=document.getElementsByTagName("head"))==null?void 0:n[0])??document}Rf({loadJS(n){return new Promise((e,t)=>{const s=document.createElement("script");s.setAttribute("src",n),s.onload=e,s.onerror=r=>{const a=ge("internal-error");a.customData=r,t(a)},s.type="text/javascript",s.charset="UTF-8",ep().appendChild(s)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});Yd("Browser");var no=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var tp;(function(){var n;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(w,d){function g(){}g.prototype=d.prototype,w.F=d.prototype,w.prototype=new g,w.prototype.constructor=w,w.D=function(_,y,I){for(var p=Array(arguments.length-2),ee=2;ee<arguments.length;ee++)p[ee-2]=arguments[ee];return d.prototype[y].apply(_,p)}}function t(){this.blockSize=-1}function s(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(s,t),s.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function r(w,d,g){g||(g=0);const _=Array(16);if(typeof d=="string")for(var y=0;y<16;++y)_[y]=d.charCodeAt(g++)|d.charCodeAt(g++)<<8|d.charCodeAt(g++)<<16|d.charCodeAt(g++)<<24;else for(y=0;y<16;++y)_[y]=d[g++]|d[g++]<<8|d[g++]<<16|d[g++]<<24;d=w.g[0],g=w.g[1],y=w.g[2];let I=w.g[3],p;p=d+(I^g&(y^I))+_[0]+3614090360&4294967295,d=g+(p<<7&4294967295|p>>>25),p=I+(y^d&(g^y))+_[1]+3905402710&4294967295,I=d+(p<<12&4294967295|p>>>20),p=y+(g^I&(d^g))+_[2]+606105819&4294967295,y=I+(p<<17&4294967295|p>>>15),p=g+(d^y&(I^d))+_[3]+3250441966&4294967295,g=y+(p<<22&4294967295|p>>>10),p=d+(I^g&(y^I))+_[4]+4118548399&4294967295,d=g+(p<<7&4294967295|p>>>25),p=I+(y^d&(g^y))+_[5]+1200080426&4294967295,I=d+(p<<12&4294967295|p>>>20),p=y+(g^I&(d^g))+_[6]+2821735955&4294967295,y=I+(p<<17&4294967295|p>>>15),p=g+(d^y&(I^d))+_[7]+4249261313&4294967295,g=y+(p<<22&4294967295|p>>>10),p=d+(I^g&(y^I))+_[8]+1770035416&4294967295,d=g+(p<<7&4294967295|p>>>25),p=I+(y^d&(g^y))+_[9]+2336552879&4294967295,I=d+(p<<12&4294967295|p>>>20),p=y+(g^I&(d^g))+_[10]+4294925233&4294967295,y=I+(p<<17&4294967295|p>>>15),p=g+(d^y&(I^d))+_[11]+2304563134&4294967295,g=y+(p<<22&4294967295|p>>>10),p=d+(I^g&(y^I))+_[12]+1804603682&4294967295,d=g+(p<<7&4294967295|p>>>25),p=I+(y^d&(g^y))+_[13]+4254626195&4294967295,I=d+(p<<12&4294967295|p>>>20),p=y+(g^I&(d^g))+_[14]+2792965006&4294967295,y=I+(p<<17&4294967295|p>>>15),p=g+(d^y&(I^d))+_[15]+1236535329&4294967295,g=y+(p<<22&4294967295|p>>>10),p=d+(y^I&(g^y))+_[1]+4129170786&4294967295,d=g+(p<<5&4294967295|p>>>27),p=I+(g^y&(d^g))+_[6]+3225465664&4294967295,I=d+(p<<9&4294967295|p>>>23),p=y+(d^g&(I^d))+_[11]+643717713&4294967295,y=I+(p<<14&4294967295|p>>>18),p=g+(I^d&(y^I))+_[0]+3921069994&4294967295,g=y+(p<<20&4294967295|p>>>12),p=d+(y^I&(g^y))+_[5]+3593408605&4294967295,d=g+(p<<5&4294967295|p>>>27),p=I+(g^y&(d^g))+_[10]+38016083&4294967295,I=d+(p<<9&4294967295|p>>>23),p=y+(d^g&(I^d))+_[15]+3634488961&4294967295,y=I+(p<<14&4294967295|p>>>18),p=g+(I^d&(y^I))+_[4]+3889429448&4294967295,g=y+(p<<20&4294967295|p>>>12),p=d+(y^I&(g^y))+_[9]+568446438&4294967295,d=g+(p<<5&4294967295|p>>>27),p=I+(g^y&(d^g))+_[14]+3275163606&4294967295,I=d+(p<<9&4294967295|p>>>23),p=y+(d^g&(I^d))+_[3]+4107603335&4294967295,y=I+(p<<14&4294967295|p>>>18),p=g+(I^d&(y^I))+_[8]+1163531501&4294967295,g=y+(p<<20&4294967295|p>>>12),p=d+(y^I&(g^y))+_[13]+2850285829&4294967295,d=g+(p<<5&4294967295|p>>>27),p=I+(g^y&(d^g))+_[2]+4243563512&4294967295,I=d+(p<<9&4294967295|p>>>23),p=y+(d^g&(I^d))+_[7]+1735328473&4294967295,y=I+(p<<14&4294967295|p>>>18),p=g+(I^d&(y^I))+_[12]+2368359562&4294967295,g=y+(p<<20&4294967295|p>>>12),p=d+(g^y^I)+_[5]+4294588738&4294967295,d=g+(p<<4&4294967295|p>>>28),p=I+(d^g^y)+_[8]+2272392833&4294967295,I=d+(p<<11&4294967295|p>>>21),p=y+(I^d^g)+_[11]+1839030562&4294967295,y=I+(p<<16&4294967295|p>>>16),p=g+(y^I^d)+_[14]+4259657740&4294967295,g=y+(p<<23&4294967295|p>>>9),p=d+(g^y^I)+_[1]+2763975236&4294967295,d=g+(p<<4&4294967295|p>>>28),p=I+(d^g^y)+_[4]+1272893353&4294967295,I=d+(p<<11&4294967295|p>>>21),p=y+(I^d^g)+_[7]+4139469664&4294967295,y=I+(p<<16&4294967295|p>>>16),p=g+(y^I^d)+_[10]+3200236656&4294967295,g=y+(p<<23&4294967295|p>>>9),p=d+(g^y^I)+_[13]+681279174&4294967295,d=g+(p<<4&4294967295|p>>>28),p=I+(d^g^y)+_[0]+3936430074&4294967295,I=d+(p<<11&4294967295|p>>>21),p=y+(I^d^g)+_[3]+3572445317&4294967295,y=I+(p<<16&4294967295|p>>>16),p=g+(y^I^d)+_[6]+76029189&4294967295,g=y+(p<<23&4294967295|p>>>9),p=d+(g^y^I)+_[9]+3654602809&4294967295,d=g+(p<<4&4294967295|p>>>28),p=I+(d^g^y)+_[12]+3873151461&4294967295,I=d+(p<<11&4294967295|p>>>21),p=y+(I^d^g)+_[15]+530742520&4294967295,y=I+(p<<16&4294967295|p>>>16),p=g+(y^I^d)+_[2]+3299628645&4294967295,g=y+(p<<23&4294967295|p>>>9),p=d+(y^(g|~I))+_[0]+4096336452&4294967295,d=g+(p<<6&4294967295|p>>>26),p=I+(g^(d|~y))+_[7]+1126891415&4294967295,I=d+(p<<10&4294967295|p>>>22),p=y+(d^(I|~g))+_[14]+2878612391&4294967295,y=I+(p<<15&4294967295|p>>>17),p=g+(I^(y|~d))+_[5]+4237533241&4294967295,g=y+(p<<21&4294967295|p>>>11),p=d+(y^(g|~I))+_[12]+1700485571&4294967295,d=g+(p<<6&4294967295|p>>>26),p=I+(g^(d|~y))+_[3]+2399980690&4294967295,I=d+(p<<10&4294967295|p>>>22),p=y+(d^(I|~g))+_[10]+4293915773&4294967295,y=I+(p<<15&4294967295|p>>>17),p=g+(I^(y|~d))+_[1]+2240044497&4294967295,g=y+(p<<21&4294967295|p>>>11),p=d+(y^(g|~I))+_[8]+1873313359&4294967295,d=g+(p<<6&4294967295|p>>>26),p=I+(g^(d|~y))+_[15]+4264355552&4294967295,I=d+(p<<10&4294967295|p>>>22),p=y+(d^(I|~g))+_[6]+2734768916&4294967295,y=I+(p<<15&4294967295|p>>>17),p=g+(I^(y|~d))+_[13]+1309151649&4294967295,g=y+(p<<21&4294967295|p>>>11),p=d+(y^(g|~I))+_[4]+4149444226&4294967295,d=g+(p<<6&4294967295|p>>>26),p=I+(g^(d|~y))+_[11]+3174756917&4294967295,I=d+(p<<10&4294967295|p>>>22),p=y+(d^(I|~g))+_[2]+718787259&4294967295,y=I+(p<<15&4294967295|p>>>17),p=g+(I^(y|~d))+_[9]+3951481745&4294967295,w.g[0]=w.g[0]+d&4294967295,w.g[1]=w.g[1]+(y+(p<<21&4294967295|p>>>11))&4294967295,w.g[2]=w.g[2]+y&4294967295,w.g[3]=w.g[3]+I&4294967295}s.prototype.v=function(w,d){d===void 0&&(d=w.length);const g=d-this.blockSize,_=this.C;let y=this.h,I=0;for(;I<d;){if(y==0)for(;I<=g;)r(this,w,I),I+=this.blockSize;if(typeof w=="string"){for(;I<d;)if(_[y++]=w.charCodeAt(I++),y==this.blockSize){r(this,_),y=0;break}}else for(;I<d;)if(_[y++]=w[I++],y==this.blockSize){r(this,_),y=0;break}}this.h=y,this.o+=d},s.prototype.A=function(){var w=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);w[0]=128;for(var d=1;d<w.length-8;++d)w[d]=0;d=this.o*8;for(var g=w.length-8;g<w.length;++g)w[g]=d&255,d/=256;for(this.v(w),w=Array(16),d=0,g=0;g<4;++g)for(let _=0;_<32;_+=8)w[d++]=this.g[g]>>>_&255;return w};function a(w,d){var g=u;return Object.prototype.hasOwnProperty.call(g,w)?g[w]:g[w]=d(w)}function l(w,d){this.h=d;const g=[];let _=!0;for(let y=w.length-1;y>=0;y--){const I=w[y]|0;_&&I==d||(g[y]=I,_=!1)}this.g=g}var u={};function f(w){return-128<=w&&w<128?a(w,function(d){return new l([d|0],d<0?-1:0)}):new l([w|0],w<0?-1:0)}function m(w){if(isNaN(w)||!isFinite(w))return v;if(w<0)return C(m(-w));const d=[];let g=1;for(let _=0;w>=g;_++)d[_]=w/g|0,g*=4294967296;return new l(d,0)}function b(w,d){if(w.length==0)throw Error("number format error: empty string");if(d=d||10,d<2||36<d)throw Error("radix out of range: "+d);if(w.charAt(0)=="-")return C(b(w.substring(1),d));if(w.indexOf("-")>=0)throw Error('number format error: interior "-" character');const g=m(Math.pow(d,8));let _=v;for(let I=0;I<w.length;I+=8){var y=Math.min(8,w.length-I);const p=parseInt(w.substring(I,I+y),d);y<8?(y=m(Math.pow(d,y)),_=_.j(y).add(m(p))):(_=_.j(g),_=_.add(m(p)))}return _}var v=f(0),A=f(1),O=f(16777216);n=l.prototype,n.m=function(){if(D(this))return-C(this).m();let w=0,d=1;for(let g=0;g<this.g.length;g++){const _=this.i(g);w+=(_>=0?_:4294967296+_)*d,d*=4294967296}return w},n.toString=function(w){if(w=w||10,w<2||36<w)throw Error("radix out of range: "+w);if(M(this))return"0";if(D(this))return"-"+C(this).toString(w);const d=m(Math.pow(w,6));var g=this;let _="";for(;;){const y=z(g,d).g;g=j(g,y.j(d));let I=((g.g.length>0?g.g[0]:g.h)>>>0).toString(w);if(g=y,M(g))return I+_;for(;I.length<6;)I="0"+I;_=I+_}},n.i=function(w){return w<0?0:w<this.g.length?this.g[w]:this.h};function M(w){if(w.h!=0)return!1;for(let d=0;d<w.g.length;d++)if(w.g[d]!=0)return!1;return!0}function D(w){return w.h==-1}n.l=function(w){return w=j(this,w),D(w)?-1:M(w)?0:1};function C(w){const d=w.g.length,g=[];for(let _=0;_<d;_++)g[_]=~w.g[_];return new l(g,~w.h).add(A)}n.abs=function(){return D(this)?C(this):this},n.add=function(w){const d=Math.max(this.g.length,w.g.length),g=[];let _=0;for(let y=0;y<=d;y++){let I=_+(this.i(y)&65535)+(w.i(y)&65535),p=(I>>>16)+(this.i(y)>>>16)+(w.i(y)>>>16);_=p>>>16,I&=65535,p&=65535,g[y]=p<<16|I}return new l(g,g[g.length-1]&-2147483648?-1:0)};function j(w,d){return w.add(C(d))}n.j=function(w){if(M(this)||M(w))return v;if(D(this))return D(w)?C(this).j(C(w)):C(C(this).j(w));if(D(w))return C(this.j(C(w)));if(this.l(O)<0&&w.l(O)<0)return m(this.m()*w.m());const d=this.g.length+w.g.length,g=[];for(var _=0;_<2*d;_++)g[_]=0;for(_=0;_<this.g.length;_++)for(let y=0;y<w.g.length;y++){const I=this.i(_)>>>16,p=this.i(_)&65535,ee=w.i(y)>>>16,Ge=w.i(y)&65535;g[2*_+2*y]+=p*Ge,Y(g,2*_+2*y),g[2*_+2*y+1]+=I*Ge,Y(g,2*_+2*y+1),g[2*_+2*y+1]+=p*ee,Y(g,2*_+2*y+1),g[2*_+2*y+2]+=I*ee,Y(g,2*_+2*y+2)}for(w=0;w<d;w++)g[w]=g[2*w+1]<<16|g[2*w];for(w=d;w<2*d;w++)g[w]=0;return new l(g,0)};function Y(w,d){for(;(w[d]&65535)!=w[d];)w[d+1]+=w[d]>>>16,w[d]&=65535,d++}function F(w,d){this.g=w,this.h=d}function z(w,d){if(M(d))throw Error("division by zero");if(M(w))return new F(v,v);if(D(w))return d=z(C(w),d),new F(C(d.g),C(d.h));if(D(d))return d=z(w,C(d)),new F(C(d.g),d.h);if(w.g.length>30){if(D(w)||D(d))throw Error("slowDivide_ only works with positive integers.");for(var g=A,_=d;_.l(w)<=0;)g=ae(g),_=ae(_);var y=se(g,1),I=se(_,1);for(_=se(_,2),g=se(g,2);!M(_);){var p=I.add(_);p.l(w)<=0&&(y=y.add(g),I=p),_=se(_,1),g=se(g,1)}return d=j(w,y.j(d)),new F(y,d)}for(y=v;w.l(d)>=0;){for(g=Math.max(1,Math.floor(w.m()/d.m())),_=Math.ceil(Math.log(g)/Math.LN2),_=_<=48?1:Math.pow(2,_-48),I=m(g),p=I.j(d);D(p)||p.l(w)>0;)g-=_,I=m(g),p=I.j(d);M(I)&&(I=A),y=y.add(I),w=j(w,p)}return new F(y,w)}n.B=function(w){return z(this,w).h},n.and=function(w){const d=Math.max(this.g.length,w.g.length),g=[];for(let _=0;_<d;_++)g[_]=this.i(_)&w.i(_);return new l(g,this.h&w.h)},n.or=function(w){const d=Math.max(this.g.length,w.g.length),g=[];for(let _=0;_<d;_++)g[_]=this.i(_)|w.i(_);return new l(g,this.h|w.h)},n.xor=function(w){const d=Math.max(this.g.length,w.g.length),g=[];for(let _=0;_<d;_++)g[_]=this.i(_)^w.i(_);return new l(g,this.h^w.h)};function ae(w){const d=w.g.length+1,g=[];for(let _=0;_<d;_++)g[_]=w.i(_)<<1|w.i(_-1)>>>31;return new l(g,w.h)}function se(w,d){const g=d>>5;d%=32;const _=w.g.length-g,y=[];for(let I=0;I<_;I++)y[I]=d>0?w.i(I+g)>>>d|w.i(I+g+1)<<32-d:w.i(I+g);return new l(y,w.h)}s.prototype.digest=s.prototype.A,s.prototype.reset=s.prototype.u,s.prototype.update=s.prototype.v,l.prototype.add=l.prototype.add,l.prototype.multiply=l.prototype.j,l.prototype.modulo=l.prototype.B,l.prototype.compare=l.prototype.l,l.prototype.toNumber=l.prototype.m,l.prototype.toString=l.prototype.toString,l.prototype.getBits=l.prototype.i,l.fromNumber=m,l.fromString=b,tp=l}).apply(typeof no<"u"?no:typeof self<"u"?self:typeof window<"u"?window:{});var ln=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var np,ip,sp,rp,op,ap,cp,lp;(function(){var n,e=Object.defineProperty;function t(i){i=[typeof globalThis=="object"&&globalThis,i,typeof window=="object"&&window,typeof self=="object"&&self,typeof ln=="object"&&ln];for(var o=0;o<i.length;++o){var c=i[o];if(c&&c.Math==Math)return c}throw Error("Cannot find global object")}var s=t(this);function r(i,o){if(o)e:{var c=s;i=i.split(".");for(var h=0;h<i.length-1;h++){var E=i[h];if(!(E in c))break e;c=c[E]}i=i[i.length-1],h=c[i],o=o(h),o!=h&&o!=null&&e(c,i,{configurable:!0,writable:!0,value:o})}}r("Symbol.dispose",function(i){return i||Symbol("Symbol.dispose")}),r("Array.prototype.values",function(i){return i||function(){return this[Symbol.iterator]()}}),r("Object.entries",function(i){return i||function(o){var c=[],h;for(h in o)Object.prototype.hasOwnProperty.call(o,h)&&c.push([h,o[h]]);return c}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var a=a||{},l=this||self;function u(i){var o=typeof i;return o=="object"&&i!=null||o=="function"}function f(i,o,c){return i.call.apply(i.bind,arguments)}function m(i,o,c){return m=f,m.apply(null,arguments)}function b(i,o){var c=Array.prototype.slice.call(arguments,1);return function(){var h=c.slice();return h.push.apply(h,arguments),i.apply(this,h)}}function v(i,o){function c(){}c.prototype=o.prototype,i.Z=o.prototype,i.prototype=new c,i.prototype.constructor=i,i.Ob=function(h,E,T){for(var S=Array(arguments.length-2),N=2;N<arguments.length;N++)S[N-2]=arguments[N];return o.prototype[E].apply(h,S)}}var A=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?i=>i&&AsyncContext.Snapshot.wrap(i):i=>i;function O(i){const o=i.length;if(o>0){const c=Array(o);for(let h=0;h<o;h++)c[h]=i[h];return c}return[]}function M(i,o){for(let h=1;h<arguments.length;h++){const E=arguments[h];var c=typeof E;if(c=c!="object"?c:E?Array.isArray(E)?"array":c:"null",c=="array"||c=="object"&&typeof E.length=="number"){c=i.length||0;const T=E.length||0;i.length=c+T;for(let S=0;S<T;S++)i[c+S]=E[S]}else i.push(E)}}class D{constructor(o,c){this.i=o,this.j=c,this.h=0,this.g=null}get(){let o;return this.h>0?(this.h--,o=this.g,this.g=o.next,o.next=null):o=this.i(),o}}function C(i){l.setTimeout(()=>{throw i},0)}function j(){var i=w;let o=null;return i.g&&(o=i.g,i.g=i.g.next,i.g||(i.h=null),o.next=null),o}class Y{constructor(){this.h=this.g=null}add(o,c){const h=F.get();h.set(o,c),this.h?this.h.next=h:this.g=h,this.h=h}}var F=new D(()=>new z,i=>i.reset());class z{constructor(){this.next=this.g=this.h=null}set(o,c){this.h=o,this.g=c,this.next=null}reset(){this.next=this.g=this.h=null}}let ae,se=!1,w=new Y,d=()=>{const i=Promise.resolve(void 0);ae=()=>{i.then(g)}};function g(){for(var i;i=j();){try{i.h.call(i.g)}catch(c){C(c)}var o=F;o.j(i),o.h<100&&(o.h++,i.next=o.g,o.g=i)}se=!1}function _(){this.u=this.u,this.C=this.C}_.prototype.u=!1,_.prototype.dispose=function(){this.u||(this.u=!0,this.N())},_.prototype[Symbol.dispose]=function(){this.dispose()},_.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function y(i,o){this.type=i,this.g=this.target=o,this.defaultPrevented=!1}y.prototype.h=function(){this.defaultPrevented=!0};var I=(function(){if(!l.addEventListener||!Object.defineProperty)return!1;var i=!1,o=Object.defineProperty({},"passive",{get:function(){i=!0}});try{const c=()=>{};l.addEventListener("test",c,o),l.removeEventListener("test",c,o)}catch{}return i})();function p(i){return/^[\s\xa0]*$/.test(i)}function ee(i,o){y.call(this,i?i.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,i&&this.init(i,o)}v(ee,y),ee.prototype.init=function(i,o){const c=this.type=i.type,h=i.changedTouches&&i.changedTouches.length?i.changedTouches[0]:null;this.target=i.target||i.srcElement,this.g=o,o=i.relatedTarget,o||(c=="mouseover"?o=i.fromElement:c=="mouseout"&&(o=i.toElement)),this.relatedTarget=o,h?(this.clientX=h.clientX!==void 0?h.clientX:h.pageX,this.clientY=h.clientY!==void 0?h.clientY:h.pageY,this.screenX=h.screenX||0,this.screenY=h.screenY||0):(this.clientX=i.clientX!==void 0?i.clientX:i.pageX,this.clientY=i.clientY!==void 0?i.clientY:i.pageY,this.screenX=i.screenX||0,this.screenY=i.screenY||0),this.button=i.button,this.key=i.key||"",this.ctrlKey=i.ctrlKey,this.altKey=i.altKey,this.shiftKey=i.shiftKey,this.metaKey=i.metaKey,this.pointerId=i.pointerId||0,this.pointerType=i.pointerType,this.state=i.state,this.i=i,i.defaultPrevented&&ee.Z.h.call(this)},ee.prototype.h=function(){ee.Z.h.call(this);const i=this.i;i.preventDefault?i.preventDefault():i.returnValue=!1};var Ge="closure_listenable_"+(Math.random()*1e6|0),za=0;function Wa(i,o,c,h,E){this.listener=i,this.proxy=null,this.src=o,this.type=c,this.capture=!!h,this.ha=E,this.key=++za,this.da=this.fa=!1}function Gt(i){i.da=!0,i.listener=null,i.proxy=null,i.src=null,i.ha=null}function zt(i,o,c){for(const h in i)o.call(c,i[h],h,i)}function Ka(i,o){for(const c in i)o.call(void 0,i[c],c,i)}function fs(i){const o={};for(const c in i)o[c]=i[c];return o}const ds="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function ps(i,o){let c,h;for(let E=1;E<arguments.length;E++){h=arguments[E];for(c in h)i[c]=h[c];for(let T=0;T<ds.length;T++)c=ds[T],Object.prototype.hasOwnProperty.call(h,c)&&(i[c]=h[c])}}function Wt(i){this.src=i,this.g={},this.h=0}Wt.prototype.add=function(i,o,c,h,E){const T=i.toString();i=this.g[T],i||(i=this.g[T]=[],this.h++);const S=Fn(i,o,h,E);return S>-1?(o=i[S],c||(o.fa=!1)):(o=new Wa(o,this.src,T,!!h,E),o.fa=c,i.push(o)),o};function xn(i,o){const c=o.type;if(c in i.g){var h=i.g[c],E=Array.prototype.indexOf.call(h,o,void 0),T;(T=E>=0)&&Array.prototype.splice.call(h,E,1),T&&(Gt(o),i.g[c].length==0&&(delete i.g[c],i.h--))}}function Fn(i,o,c,h){for(let E=0;E<i.length;++E){const T=i[E];if(!T.da&&T.listener==o&&T.capture==!!c&&T.ha==h)return E}return-1}var Un="closure_lm_"+(Math.random()*1e6|0),$n={};function gs(i,o,c,h,E){if(Array.isArray(o)){for(let T=0;T<o.length;T++)gs(i,o[T],c,h,E);return null}return c=ws(c),i&&i[Ge]?i.J(o,c,u(h)?!!h.capture:!1,E):qa(i,o,c,!1,h,E)}function qa(i,o,c,h,E,T){if(!o)throw Error("Invalid event type");const S=u(E)?!!E.capture:!!E;let N=jn(i);if(N||(i[Un]=N=new Wt(i)),c=N.add(o,c,h,S,T),c.proxy)return c;if(h=Ja(),c.proxy=h,h.src=i,h.listener=c,i.addEventListener)I||(E=S),E===void 0&&(E=!1),i.addEventListener(o.toString(),h,E);else if(i.attachEvent)i.attachEvent(ys(o.toString()),h);else if(i.addListener&&i.removeListener)i.addListener(h);else throw Error("addEventListener and attachEvent are unavailable.");return c}function Ja(){function i(c){return o.call(i.src,i.listener,c)}const o=Ya;return i}function ms(i,o,c,h,E){if(Array.isArray(o))for(var T=0;T<o.length;T++)ms(i,o[T],c,h,E);else h=u(h)?!!h.capture:!!h,c=ws(c),i&&i[Ge]?(i=i.i,T=String(o).toString(),T in i.g&&(o=i.g[T],c=Fn(o,c,h,E),c>-1&&(Gt(o[c]),Array.prototype.splice.call(o,c,1),o.length==0&&(delete i.g[T],i.h--)))):i&&(i=jn(i))&&(o=i.g[o.toString()],i=-1,o&&(i=Fn(o,c,h,E)),(c=i>-1?o[i]:null)&&Bn(c))}function Bn(i){if(typeof i!="number"&&i&&!i.da){var o=i.src;if(o&&o[Ge])xn(o.i,i);else{var c=i.type,h=i.proxy;o.removeEventListener?o.removeEventListener(c,h,i.capture):o.detachEvent?o.detachEvent(ys(c),h):o.addListener&&o.removeListener&&o.removeListener(h),(c=jn(o))?(xn(c,i),c.h==0&&(c.src=null,o[Un]=null)):Gt(i)}}}function ys(i){return i in $n?$n[i]:$n[i]="on"+i}function Ya(i,o){if(i.da)i=!0;else{o=new ee(o,this);const c=i.listener,h=i.ha||i.src;i.fa&&Bn(i),i=c.call(h,o)}return i}function jn(i){return i=i[Un],i instanceof Wt?i:null}var Hn="__closure_events_fn_"+(Math.random()*1e9>>>0);function ws(i){return typeof i=="function"?i:(i[Hn]||(i[Hn]=function(o){return i.handleEvent(o)}),i[Hn])}function K(){_.call(this),this.i=new Wt(this),this.M=this,this.G=null}v(K,_),K.prototype[Ge]=!0,K.prototype.removeEventListener=function(i,o,c,h){ms(this,i,o,c,h)};function X(i,o){var c,h=i.G;if(h)for(c=[];h;h=h.G)c.push(h);if(i=i.M,h=o.type||o,typeof o=="string")o=new y(o,i);else if(o instanceof y)o.target=o.target||i;else{var E=o;o=new y(h,i),ps(o,E)}E=!0;let T,S;if(c)for(S=c.length-1;S>=0;S--)T=o.g=c[S],E=Kt(T,h,!0,o)&&E;if(T=o.g=i,E=Kt(T,h,!0,o)&&E,E=Kt(T,h,!1,o)&&E,c)for(S=0;S<c.length;S++)T=o.g=c[S],E=Kt(T,h,!1,o)&&E}K.prototype.N=function(){if(K.Z.N.call(this),this.i){var i=this.i;for(const o in i.g){const c=i.g[o];for(let h=0;h<c.length;h++)Gt(c[h]);delete i.g[o],i.h--}}this.G=null},K.prototype.J=function(i,o,c,h){return this.i.add(String(i),o,!1,c,h)},K.prototype.K=function(i,o,c,h){return this.i.add(String(i),o,!0,c,h)};function Kt(i,o,c,h){if(o=i.i.g[String(o)],!o)return!0;o=o.concat();let E=!0;for(let T=0;T<o.length;++T){const S=o[T];if(S&&!S.da&&S.capture==c){const N=S.listener,H=S.ha||S.src;S.fa&&xn(i.i,S),E=N.call(H,h)!==!1&&E}}return E&&!h.defaultPrevented}function Xa(i,o){if(typeof i!="function")if(i&&typeof i.handleEvent=="function")i=m(i.handleEvent,i);else throw Error("Invalid listener argument");return Number(o)>2147483647?-1:l.setTimeout(i,o||0)}function _s(i){i.g=Xa(()=>{i.g=null,i.i&&(i.i=!1,_s(i))},i.l);const o=i.h;i.h=null,i.m.apply(null,o)}class Qa extends _{constructor(o,c){super(),this.m=o,this.l=c,this.h=null,this.i=!1,this.g=null}j(o){this.h=arguments,this.g?this.i=!0:_s(this)}N(){super.N(),this.g&&(l.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function mt(i){_.call(this),this.h=i,this.g={}}v(mt,_);var Es=[];function Is(i){zt(i.g,function(o,c){this.g.hasOwnProperty(c)&&Bn(o)},i),i.g={}}mt.prototype.N=function(){mt.Z.N.call(this),Is(this)},mt.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Vn=l.JSON.stringify,Za=l.JSON.parse,ec=class{stringify(i){return l.JSON.stringify(i,void 0)}parse(i){return l.JSON.parse(i,void 0)}};function Ts(){}function vs(){}var yt={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Gn(){y.call(this,"d")}v(Gn,y);function zn(){y.call(this,"c")}v(zn,y);var ze={},bs=null;function qt(){return bs=bs||new K}ze.Ia="serverreachability";function Ss(i){y.call(this,ze.Ia,i)}v(Ss,y);function wt(i){const o=qt();X(o,new Ss(o))}ze.STAT_EVENT="statevent";function As(i,o){y.call(this,ze.STAT_EVENT,i),this.stat=o}v(As,y);function Q(i){const o=qt();X(o,new As(o,i))}ze.Ja="timingevent";function Cs(i,o){y.call(this,ze.Ja,i),this.size=o}v(Cs,y);function _t(i,o){if(typeof i!="function")throw Error("Fn must not be null and must be a function");return l.setTimeout(function(){i()},o)}function Et(){this.g=!0}Et.prototype.ua=function(){this.g=!1};function tc(i,o,c,h,E,T){i.info(function(){if(i.g)if(T){var S="",N=T.split("&");for(let x=0;x<N.length;x++){var H=N[x].split("=");if(H.length>1){const W=H[0];H=H[1];const pe=W.split("_");S=pe.length>=2&&pe[1]=="type"?S+(W+"="+H+"&"):S+(W+"=redacted&")}}}else S=null;else S=T;return"XMLHTTP REQ ("+h+") [attempt "+E+"]: "+o+`
`+c+`
`+S})}function nc(i,o,c,h,E,T,S){i.info(function(){return"XMLHTTP RESP ("+h+") [ attempt "+E+"]: "+o+`
`+c+`
`+T+" "+S})}function at(i,o,c,h){i.info(function(){return"XMLHTTP TEXT ("+o+"): "+sc(i,c)+(h?" "+h:"")})}function ic(i,o){i.info(function(){return"TIMEOUT: "+o})}Et.prototype.info=function(){};function sc(i,o){if(!i.g)return o;if(!o)return null;try{const T=JSON.parse(o);if(T){for(i=0;i<T.length;i++)if(Array.isArray(T[i])){var c=T[i];if(!(c.length<2)){var h=c[1];if(Array.isArray(h)&&!(h.length<1)){var E=h[0];if(E!="noop"&&E!="stop"&&E!="close")for(let S=1;S<h.length;S++)h[S]=""}}}}return Vn(T)}catch{return o}}var Jt={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},Rs={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},ks;function Wn(){}v(Wn,Ts),Wn.prototype.g=function(){return new XMLHttpRequest},ks=new Wn;function It(i){return encodeURIComponent(String(i))}function rc(i){var o=1;i=i.split(":");const c=[];for(;o>0&&i.length;)c.push(i.shift()),o--;return i.length&&c.push(i.join(":")),c}function Se(i,o,c,h){this.j=i,this.i=o,this.l=c,this.S=h||1,this.V=new mt(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new Os}function Os(){this.i=null,this.g="",this.h=!1}var Ps={},Kn={};function qn(i,o,c){i.M=1,i.A=Xt(de(o)),i.u=c,i.R=!0,Ms(i,null)}function Ms(i,o){i.F=Date.now(),Yt(i),i.B=de(i.A);var c=i.B,h=i.S;Array.isArray(h)||(h=[String(h)]),zs(c.i,"t",h),i.C=0,c=i.j.L,i.h=new Os,i.g=lr(i.j,c?o:null,!i.u),i.P>0&&(i.O=new Qa(m(i.Y,i,i.g),i.P)),o=i.V,c=i.g,h=i.ba;var E="readystatechange";Array.isArray(E)||(E&&(Es[0]=E.toString()),E=Es);for(let T=0;T<E.length;T++){const S=gs(c,E[T],h||o.handleEvent,!1,o.h||o);if(!S)break;o.g[S.key]=S}o=i.J?fs(i.J):{},i.u?(i.v||(i.v="POST"),o["Content-Type"]="application/x-www-form-urlencoded",i.g.ea(i.B,i.v,i.u,o)):(i.v="GET",i.g.ea(i.B,i.v,null,o)),wt(),tc(i.i,i.v,i.B,i.l,i.S,i.u)}Se.prototype.ba=function(i){i=i.target;const o=this.O;o&&Re(i)==3?o.j():this.Y(i)},Se.prototype.Y=function(i){try{if(i==this.g)e:{const N=Re(this.g),H=this.g.ya(),x=this.g.ca();if(!(N<3)&&(N!=3||this.g&&(this.h.h||this.g.la()||Qs(this.g)))){this.K||N!=4||H==7||(H==8||x<=0?wt(3):wt(2)),Jn(this);var o=this.g.ca();this.X=o;var c=oc(this);if(this.o=o==200,nc(this.i,this.v,this.B,this.l,this.S,N,o),this.o){if(this.U&&!this.L){t:{if(this.g){var h,E=this.g;if((h=E.g?E.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!p(h)){var T=h;break t}}T=null}if(i=T)at(this.i,this.l,i,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Yn(this,i);else{this.o=!1,this.m=3,Q(12),We(this),Tt(this);break e}}if(this.R){i=!0;let W;for(;!this.K&&this.C<c.length;)if(W=ac(this,c),W==Kn){N==4&&(this.m=4,Q(14),i=!1),at(this.i,this.l,null,"[Incomplete Response]");break}else if(W==Ps){this.m=4,Q(15),at(this.i,this.l,c,"[Invalid Chunk]"),i=!1;break}else at(this.i,this.l,W,null),Yn(this,W);if(Ns(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),N!=4||c.length!=0||this.h.h||(this.m=1,Q(16),i=!1),this.o=this.o&&i,!i)at(this.i,this.l,c,"[Invalid Chunked Response]"),We(this),Tt(this);else if(c.length>0&&!this.W){this.W=!0;var S=this.j;S.g==this&&S.aa&&!S.P&&(S.j.info("Great, no buffering proxy detected. Bytes received: "+c.length),si(S),S.P=!0,Q(11))}}else at(this.i,this.l,c,null),Yn(this,c);N==4&&We(this),this.o&&!this.K&&(N==4?rr(this.j,this):(this.o=!1,Yt(this)))}else Ic(this.g),o==400&&c.indexOf("Unknown SID")>0?(this.m=3,Q(12)):(this.m=0,Q(13)),We(this),Tt(this)}}}catch{}finally{}};function oc(i){if(!Ns(i))return i.g.la();const o=Qs(i.g);if(o==="")return"";let c="";const h=o.length,E=Re(i.g)==4;if(!i.h.i){if(typeof TextDecoder>"u")return We(i),Tt(i),"";i.h.i=new l.TextDecoder}for(let T=0;T<h;T++)i.h.h=!0,c+=i.h.i.decode(o[T],{stream:!(E&&T==h-1)});return o.length=0,i.h.g+=c,i.C=0,i.h.g}function Ns(i){return i.g?i.v=="GET"&&i.M!=2&&i.j.Aa:!1}function ac(i,o){var c=i.C,h=o.indexOf(`
`,c);return h==-1?Kn:(c=Number(o.substring(c,h)),isNaN(c)?Ps:(h+=1,h+c>o.length?Kn:(o=o.slice(h,h+c),i.C=h+c,o)))}Se.prototype.cancel=function(){this.K=!0,We(this)};function Yt(i){i.T=Date.now()+i.H,Ds(i,i.H)}function Ds(i,o){if(i.D!=null)throw Error("WatchDog timer not null");i.D=_t(m(i.aa,i),o)}function Jn(i){i.D&&(l.clearTimeout(i.D),i.D=null)}Se.prototype.aa=function(){this.D=null;const i=Date.now();i-this.T>=0?(ic(this.i,this.B),this.M!=2&&(wt(),Q(17)),We(this),this.m=2,Tt(this)):Ds(this,this.T-i)};function Tt(i){i.j.I==0||i.K||rr(i.j,i)}function We(i){Jn(i);var o=i.O;o&&typeof o.dispose=="function"&&o.dispose(),i.O=null,Is(i.V),i.g&&(o=i.g,i.g=null,o.abort(),o.dispose())}function Yn(i,o){try{var c=i.j;if(c.I!=0&&(c.g==i||Xn(c.h,i))){if(!i.L&&Xn(c.h,i)&&c.I==3){try{var h=c.Ba.g.parse(o)}catch{h=null}if(Array.isArray(h)&&h.length==3){var E=h;if(E[0]==0){e:if(!c.v){if(c.g)if(c.g.F+3e3<i.F)nn(c),en(c);else break e;ii(c),Q(18)}}else c.xa=E[1],0<c.xa-c.K&&E[2]<37500&&c.F&&c.A==0&&!c.C&&(c.C=_t(m(c.Va,c),6e3));Fs(c.h)<=1&&c.ta&&(c.ta=void 0)}else qe(c,11)}else if((i.L||c.g==i)&&nn(c),!p(o))for(E=c.Ba.g.parse(o),o=0;o<E.length;o++){let x=E[o];const W=x[0];if(!(W<=c.K))if(c.K=W,x=x[1],c.I==2)if(x[0]=="c"){c.M=x[1],c.ba=x[2];const pe=x[3];pe!=null&&(c.ka=pe,c.j.info("VER="+c.ka));const Je=x[4];Je!=null&&(c.za=Je,c.j.info("SVER="+c.za));const ke=x[5];ke!=null&&typeof ke=="number"&&ke>0&&(h=1.5*ke,c.O=h,c.j.info("backChannelRequestTimeoutMs_="+h)),h=c;const Oe=i.g;if(Oe){const rn=Oe.g?Oe.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(rn){var T=h.h;T.g||rn.indexOf("spdy")==-1&&rn.indexOf("quic")==-1&&rn.indexOf("h2")==-1||(T.j=T.l,T.g=new Set,T.h&&(Qn(T,T.h),T.h=null))}if(h.G){const ri=Oe.g?Oe.g.getResponseHeader("X-HTTP-Session-Id"):null;ri&&(h.wa=ri,U(h.J,h.G,ri))}}c.I=3,c.l&&c.l.ra(),c.aa&&(c.T=Date.now()-i.F,c.j.info("Handshake RTT: "+c.T+"ms")),h=c;var S=i;if(h.na=cr(h,h.L?h.ba:null,h.W),S.L){Us(h.h,S);var N=S,H=h.O;H&&(N.H=H),N.D&&(Jn(N),Yt(N)),h.g=S}else ir(h);c.i.length>0&&tn(c)}else x[0]!="stop"&&x[0]!="close"||qe(c,7);else c.I==3&&(x[0]=="stop"||x[0]=="close"?x[0]=="stop"?qe(c,7):ni(c):x[0]!="noop"&&c.l&&c.l.qa(x),c.A=0)}}wt(4)}catch{}}var cc=class{constructor(i,o){this.g=i,this.map=o}};function Ls(i){this.l=i||10,l.PerformanceNavigationTiming?(i=l.performance.getEntriesByType("navigation"),i=i.length>0&&(i[0].nextHopProtocol=="hq"||i[0].nextHopProtocol=="h2")):i=!!(l.chrome&&l.chrome.loadTimes&&l.chrome.loadTimes()&&l.chrome.loadTimes().wasFetchedViaSpdy),this.j=i?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function xs(i){return i.h?!0:i.g?i.g.size>=i.j:!1}function Fs(i){return i.h?1:i.g?i.g.size:0}function Xn(i,o){return i.h?i.h==o:i.g?i.g.has(o):!1}function Qn(i,o){i.g?i.g.add(o):i.h=o}function Us(i,o){i.h&&i.h==o?i.h=null:i.g&&i.g.has(o)&&i.g.delete(o)}Ls.prototype.cancel=function(){if(this.i=$s(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const i of this.g.values())i.cancel();this.g.clear()}};function $s(i){if(i.h!=null)return i.i.concat(i.h.G);if(i.g!=null&&i.g.size!==0){let o=i.i;for(const c of i.g.values())o=o.concat(c.G);return o}return O(i.i)}var Bs=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function lc(i,o){if(i){i=i.split("&");for(let c=0;c<i.length;c++){const h=i[c].indexOf("=");let E,T=null;h>=0?(E=i[c].substring(0,h),T=i[c].substring(h+1)):E=i[c],o(E,T?decodeURIComponent(T.replace(/\+/g," ")):"")}}}function Ae(i){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let o;i instanceof Ae?(this.l=i.l,vt(this,i.j),this.o=i.o,this.g=i.g,bt(this,i.u),this.h=i.h,Zn(this,Ws(i.i)),this.m=i.m):i&&(o=String(i).match(Bs))?(this.l=!1,vt(this,o[1]||"",!0),this.o=St(o[2]||""),this.g=St(o[3]||"",!0),bt(this,o[4]),this.h=St(o[5]||"",!0),Zn(this,o[6]||"",!0),this.m=St(o[7]||"")):(this.l=!1,this.i=new Ct(null,this.l))}Ae.prototype.toString=function(){const i=[];var o=this.j;o&&i.push(At(o,js,!0),":");var c=this.g;return(c||o=="file")&&(i.push("//"),(o=this.o)&&i.push(At(o,js,!0),"@"),i.push(It(c).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),c=this.u,c!=null&&i.push(":",String(c))),(c=this.h)&&(this.g&&c.charAt(0)!="/"&&i.push("/"),i.push(At(c,c.charAt(0)=="/"?fc:uc,!0))),(c=this.i.toString())&&i.push("?",c),(c=this.m)&&i.push("#",At(c,pc)),i.join("")},Ae.prototype.resolve=function(i){const o=de(this);let c=!!i.j;c?vt(o,i.j):c=!!i.o,c?o.o=i.o:c=!!i.g,c?o.g=i.g:c=i.u!=null;var h=i.h;if(c)bt(o,i.u);else if(c=!!i.h){if(h.charAt(0)!="/")if(this.g&&!this.h)h="/"+h;else{var E=o.h.lastIndexOf("/");E!=-1&&(h=o.h.slice(0,E+1)+h)}if(E=h,E==".."||E==".")h="";else if(E.indexOf("./")!=-1||E.indexOf("/.")!=-1){h=E.lastIndexOf("/",0)==0,E=E.split("/");const T=[];for(let S=0;S<E.length;){const N=E[S++];N=="."?h&&S==E.length&&T.push(""):N==".."?((T.length>1||T.length==1&&T[0]!="")&&T.pop(),h&&S==E.length&&T.push("")):(T.push(N),h=!0)}h=T.join("/")}else h=E}return c?o.h=h:c=i.i.toString()!=="",c?Zn(o,Ws(i.i)):c=!!i.m,c&&(o.m=i.m),o};function de(i){return new Ae(i)}function vt(i,o,c){i.j=c?St(o,!0):o,i.j&&(i.j=i.j.replace(/:$/,""))}function bt(i,o){if(o){if(o=Number(o),isNaN(o)||o<0)throw Error("Bad port number "+o);i.u=o}else i.u=null}function Zn(i,o,c){o instanceof Ct?(i.i=o,gc(i.i,i.l)):(c||(o=At(o,dc)),i.i=new Ct(o,i.l))}function U(i,o,c){i.i.set(o,c)}function Xt(i){return U(i,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),i}function St(i,o){return i?o?decodeURI(i.replace(/%25/g,"%2525")):decodeURIComponent(i):""}function At(i,o,c){return typeof i=="string"?(i=encodeURI(i).replace(o,hc),c&&(i=i.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),i):null}function hc(i){return i=i.charCodeAt(0),"%"+(i>>4&15).toString(16)+(i&15).toString(16)}var js=/[#\/\?@]/g,uc=/[#\?:]/g,fc=/[#\?]/g,dc=/[#\?@]/g,pc=/#/g;function Ct(i,o){this.h=this.g=null,this.i=i||null,this.j=!!o}function Ke(i){i.g||(i.g=new Map,i.h=0,i.i&&lc(i.i,function(o,c){i.add(decodeURIComponent(o.replace(/\+/g," ")),c)}))}n=Ct.prototype,n.add=function(i,o){Ke(this),this.i=null,i=ct(this,i);let c=this.g.get(i);return c||this.g.set(i,c=[]),c.push(o),this.h+=1,this};function Hs(i,o){Ke(i),o=ct(i,o),i.g.has(o)&&(i.i=null,i.h-=i.g.get(o).length,i.g.delete(o))}function Vs(i,o){return Ke(i),o=ct(i,o),i.g.has(o)}n.forEach=function(i,o){Ke(this),this.g.forEach(function(c,h){c.forEach(function(E){i.call(o,E,h,this)},this)},this)};function Gs(i,o){Ke(i);let c=[];if(typeof o=="string")Vs(i,o)&&(c=c.concat(i.g.get(ct(i,o))));else for(i=Array.from(i.g.values()),o=0;o<i.length;o++)c=c.concat(i[o]);return c}n.set=function(i,o){return Ke(this),this.i=null,i=ct(this,i),Vs(this,i)&&(this.h-=this.g.get(i).length),this.g.set(i,[o]),this.h+=1,this},n.get=function(i,o){return i?(i=Gs(this,i),i.length>0?String(i[0]):o):o};function zs(i,o,c){Hs(i,o),c.length>0&&(i.i=null,i.g.set(ct(i,o),O(c)),i.h+=c.length)}n.toString=function(){if(this.i)return this.i;if(!this.g)return"";const i=[],o=Array.from(this.g.keys());for(let h=0;h<o.length;h++){var c=o[h];const E=It(c);c=Gs(this,c);for(let T=0;T<c.length;T++){let S=E;c[T]!==""&&(S+="="+It(c[T])),i.push(S)}}return this.i=i.join("&")};function Ws(i){const o=new Ct;return o.i=i.i,i.g&&(o.g=new Map(i.g),o.h=i.h),o}function ct(i,o){return o=String(o),i.j&&(o=o.toLowerCase()),o}function gc(i,o){o&&!i.j&&(Ke(i),i.i=null,i.g.forEach(function(c,h){const E=h.toLowerCase();h!=E&&(Hs(this,h),zs(this,E,c))},i)),i.j=o}function mc(i,o){const c=new Et;if(l.Image){const h=new Image;h.onload=b(Ce,c,"TestLoadImage: loaded",!0,o,h),h.onerror=b(Ce,c,"TestLoadImage: error",!1,o,h),h.onabort=b(Ce,c,"TestLoadImage: abort",!1,o,h),h.ontimeout=b(Ce,c,"TestLoadImage: timeout",!1,o,h),l.setTimeout(function(){h.ontimeout&&h.ontimeout()},1e4),h.src=i}else o(!1)}function yc(i,o){const c=new Et,h=new AbortController,E=setTimeout(()=>{h.abort(),Ce(c,"TestPingServer: timeout",!1,o)},1e4);fetch(i,{signal:h.signal}).then(T=>{clearTimeout(E),T.ok?Ce(c,"TestPingServer: ok",!0,o):Ce(c,"TestPingServer: server error",!1,o)}).catch(()=>{clearTimeout(E),Ce(c,"TestPingServer: error",!1,o)})}function Ce(i,o,c,h,E){try{E&&(E.onload=null,E.onerror=null,E.onabort=null,E.ontimeout=null),h(c)}catch{}}function wc(){this.g=new ec}function ei(i){this.i=i.Sb||null,this.h=i.ab||!1}v(ei,Ts),ei.prototype.g=function(){return new Qt(this.i,this.h)};function Qt(i,o){K.call(this),this.H=i,this.o=o,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}v(Qt,K),n=Qt.prototype,n.open=function(i,o){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=i,this.D=o,this.readyState=1,kt(this)},n.send=function(i){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const o={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};i&&(o.body=i),(this.H||l).fetch(new Request(this.D,o)).then(this.Pa.bind(this),this.ga.bind(this))},n.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,Rt(this)),this.readyState=0},n.Pa=function(i){if(this.g&&(this.l=i,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=i.headers,this.readyState=2,kt(this)),this.g&&(this.readyState=3,kt(this),this.g)))if(this.responseType==="arraybuffer")i.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof l.ReadableStream<"u"&&"body"in i){if(this.j=i.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;Ks(this)}else i.text().then(this.Oa.bind(this),this.ga.bind(this))};function Ks(i){i.j.read().then(i.Ma.bind(i)).catch(i.ga.bind(i))}n.Ma=function(i){if(this.g){if(this.o&&i.value)this.response.push(i.value);else if(!this.o){var o=i.value?i.value:new Uint8Array(0);(o=this.B.decode(o,{stream:!i.done}))&&(this.response=this.responseText+=o)}i.done?Rt(this):kt(this),this.readyState==3&&Ks(this)}},n.Oa=function(i){this.g&&(this.response=this.responseText=i,Rt(this))},n.Na=function(i){this.g&&(this.response=i,Rt(this))},n.ga=function(){this.g&&Rt(this)};function Rt(i){i.readyState=4,i.l=null,i.j=null,i.B=null,kt(i)}n.setRequestHeader=function(i,o){this.A.append(i,o)},n.getResponseHeader=function(i){return this.h&&this.h.get(i.toLowerCase())||""},n.getAllResponseHeaders=function(){if(!this.h)return"";const i=[],o=this.h.entries();for(var c=o.next();!c.done;)c=c.value,i.push(c[0]+": "+c[1]),c=o.next();return i.join(`\r
`)};function kt(i){i.onreadystatechange&&i.onreadystatechange.call(i)}Object.defineProperty(Qt.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(i){this.m=i?"include":"same-origin"}});function qs(i){let o="";return zt(i,function(c,h){o+=h,o+=":",o+=c,o+=`\r
`}),o}function ti(i,o,c){e:{for(h in c){var h=!1;break e}h=!0}h||(c=qs(c),typeof i=="string"?c!=null&&It(c):U(i,o,c))}function $(i){K.call(this),this.headers=new Map,this.L=i||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}v($,K);var _c=/^https?$/i,Ec=["POST","PUT"];n=$.prototype,n.Fa=function(i){this.H=i},n.ea=function(i,o,c,h){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+i);o=o?o.toUpperCase():"GET",this.D=i,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():ks.g(),this.g.onreadystatechange=A(m(this.Ca,this));try{this.B=!0,this.g.open(o,String(i),!0),this.B=!1}catch(T){Js(this,T);return}if(i=c||"",c=new Map(this.headers),h)if(Object.getPrototypeOf(h)===Object.prototype)for(var E in h)c.set(E,h[E]);else if(typeof h.keys=="function"&&typeof h.get=="function")for(const T of h.keys())c.set(T,h.get(T));else throw Error("Unknown input type for opt_headers: "+String(h));h=Array.from(c.keys()).find(T=>T.toLowerCase()=="content-type"),E=l.FormData&&i instanceof l.FormData,!(Array.prototype.indexOf.call(Ec,o,void 0)>=0)||h||E||c.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[T,S]of c)this.g.setRequestHeader(T,S);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(i),this.v=!1}catch(T){Js(this,T)}};function Js(i,o){i.h=!1,i.g&&(i.j=!0,i.g.abort(),i.j=!1),i.l=o,i.o=5,Ys(i),Zt(i)}function Ys(i){i.A||(i.A=!0,X(i,"complete"),X(i,"error"))}n.abort=function(i){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=i||7,X(this,"complete"),X(this,"abort"),Zt(this))},n.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Zt(this,!0)),$.Z.N.call(this)},n.Ca=function(){this.u||(this.B||this.v||this.j?Xs(this):this.Xa())},n.Xa=function(){Xs(this)};function Xs(i){if(i.h&&typeof a<"u"){if(i.v&&Re(i)==4)setTimeout(i.Ca.bind(i),0);else if(X(i,"readystatechange"),Re(i)==4){i.h=!1;try{const T=i.ca();e:switch(T){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var o=!0;break e;default:o=!1}var c;if(!(c=o)){var h;if(h=T===0){let S=String(i.D).match(Bs)[1]||null;!S&&l.self&&l.self.location&&(S=l.self.location.protocol.slice(0,-1)),h=!_c.test(S?S.toLowerCase():"")}c=h}if(c)X(i,"complete"),X(i,"success");else{i.o=6;try{var E=Re(i)>2?i.g.statusText:""}catch{E=""}i.l=E+" ["+i.ca()+"]",Ys(i)}}finally{Zt(i)}}}}function Zt(i,o){if(i.g){i.m&&(clearTimeout(i.m),i.m=null);const c=i.g;i.g=null,o||X(i,"ready");try{c.onreadystatechange=null}catch{}}}n.isActive=function(){return!!this.g};function Re(i){return i.g?i.g.readyState:0}n.ca=function(){try{return Re(this)>2?this.g.status:-1}catch{return-1}},n.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},n.La=function(i){if(this.g){var o=this.g.responseText;return i&&o.indexOf(i)==0&&(o=o.substring(i.length)),Za(o)}};function Qs(i){try{if(!i.g)return null;if("response"in i.g)return i.g.response;switch(i.F){case"":case"text":return i.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in i.g)return i.g.mozResponseArrayBuffer}return null}catch{return null}}function Ic(i){const o={};i=(i.g&&Re(i)>=2&&i.g.getAllResponseHeaders()||"").split(`\r
`);for(let h=0;h<i.length;h++){if(p(i[h]))continue;var c=rc(i[h]);const E=c[0];if(c=c[1],typeof c!="string")continue;c=c.trim();const T=o[E]||[];o[E]=T,T.push(c)}Ka(o,function(h){return h.join(", ")})}n.ya=function(){return this.o},n.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function Ot(i,o,c){return c&&c.internalChannelParams&&c.internalChannelParams[i]||o}function Zs(i){this.za=0,this.i=[],this.j=new Et,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=Ot("failFast",!1,i),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=Ot("baseRetryDelayMs",5e3,i),this.Za=Ot("retryDelaySeedMs",1e4,i),this.Ta=Ot("forwardChannelMaxRetries",2,i),this.va=Ot("forwardChannelRequestTimeoutMs",2e4,i),this.ma=i&&i.xmlHttpFactory||void 0,this.Ua=i&&i.Rb||void 0,this.Aa=i&&i.useFetchStreams||!1,this.O=void 0,this.L=i&&i.supportsCrossDomainXhr||!1,this.M="",this.h=new Ls(i&&i.concurrentRequestLimit),this.Ba=new wc,this.S=i&&i.fastHandshake||!1,this.R=i&&i.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=i&&i.Pb||!1,i&&i.ua&&this.j.ua(),i&&i.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&i&&i.detectBufferingProxy||!1,this.ia=void 0,i&&i.longPollingTimeout&&i.longPollingTimeout>0&&(this.ia=i.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}n=Zs.prototype,n.ka=8,n.I=1,n.connect=function(i,o,c,h){Q(0),this.W=i,this.H=o||{},c&&h!==void 0&&(this.H.OSID=c,this.H.OAID=h),this.F=this.X,this.J=cr(this,null,this.W),tn(this)};function ni(i){if(er(i),i.I==3){var o=i.V++,c=de(i.J);if(U(c,"SID",i.M),U(c,"RID",o),U(c,"TYPE","terminate"),Pt(i,c),o=new Se(i,i.j,o),o.M=2,o.A=Xt(de(c)),c=!1,l.navigator&&l.navigator.sendBeacon)try{c=l.navigator.sendBeacon(o.A.toString(),"")}catch{}!c&&l.Image&&(new Image().src=o.A,c=!0),c||(o.g=lr(o.j,null),o.g.ea(o.A)),o.F=Date.now(),Yt(o)}ar(i)}function en(i){i.g&&(si(i),i.g.cancel(),i.g=null)}function er(i){en(i),i.v&&(l.clearTimeout(i.v),i.v=null),nn(i),i.h.cancel(),i.m&&(typeof i.m=="number"&&l.clearTimeout(i.m),i.m=null)}function tn(i){if(!xs(i.h)&&!i.m){i.m=!0;var o=i.Ea;ae||d(),se||(ae(),se=!0),w.add(o,i),i.D=0}}function Tc(i,o){return Fs(i.h)>=i.h.j-(i.m?1:0)?!1:i.m?(i.i=o.G.concat(i.i),!0):i.I==1||i.I==2||i.D>=(i.Sa?0:i.Ta)?!1:(i.m=_t(m(i.Ea,i,o),or(i,i.D)),i.D++,!0)}n.Ea=function(i){if(this.m)if(this.m=null,this.I==1){if(!i){this.V=Math.floor(Math.random()*1e5),i=this.V++;const E=new Se(this,this.j,i);let T=this.o;if(this.U&&(T?(T=fs(T),ps(T,this.U)):T=this.U),this.u!==null||this.R||(E.J=T,T=null),this.S)e:{for(var o=0,c=0;c<this.i.length;c++){t:{var h=this.i[c];if("__data__"in h.map&&(h=h.map.__data__,typeof h=="string")){h=h.length;break t}h=void 0}if(h===void 0)break;if(o+=h,o>4096){o=c;break e}if(o===4096||c===this.i.length-1){o=c+1;break e}}o=1e3}else o=1e3;o=nr(this,E,o),c=de(this.J),U(c,"RID",i),U(c,"CVER",22),this.G&&U(c,"X-HTTP-Session-Id",this.G),Pt(this,c),T&&(this.R?o="headers="+It(qs(T))+"&"+o:this.u&&ti(c,this.u,T)),Qn(this.h,E),this.Ra&&U(c,"TYPE","init"),this.S?(U(c,"$req",o),U(c,"SID","null"),E.U=!0,qn(E,c,null)):qn(E,c,o),this.I=2}}else this.I==3&&(i?tr(this,i):this.i.length==0||xs(this.h)||tr(this))};function tr(i,o){var c;o?c=o.l:c=i.V++;const h=de(i.J);U(h,"SID",i.M),U(h,"RID",c),U(h,"AID",i.K),Pt(i,h),i.u&&i.o&&ti(h,i.u,i.o),c=new Se(i,i.j,c,i.D+1),i.u===null&&(c.J=i.o),o&&(i.i=o.G.concat(i.i)),o=nr(i,c,1e3),c.H=Math.round(i.va*.5)+Math.round(i.va*.5*Math.random()),Qn(i.h,c),qn(c,h,o)}function Pt(i,o){i.H&&zt(i.H,function(c,h){U(o,h,c)}),i.l&&zt({},function(c,h){U(o,h,c)})}function nr(i,o,c){c=Math.min(i.i.length,c);const h=i.l?m(i.l.Ka,i.l,i):null;e:{var E=i.i;let N=-1;for(;;){const H=["count="+c];N==-1?c>0?(N=E[0].g,H.push("ofs="+N)):N=0:H.push("ofs="+N);let x=!0;for(let W=0;W<c;W++){var T=E[W].g;const pe=E[W].map;if(T-=N,T<0)N=Math.max(0,E[W].g-100),x=!1;else try{T="req"+T+"_"||"";try{var S=pe instanceof Map?pe:Object.entries(pe);for(const[Je,ke]of S){let Oe=ke;u(ke)&&(Oe=Vn(ke)),H.push(T+Je+"="+encodeURIComponent(Oe))}}catch(Je){throw H.push(T+"type="+encodeURIComponent("_badmap")),Je}}catch{h&&h(pe)}}if(x){S=H.join("&");break e}}S=void 0}return i=i.i.splice(0,c),o.G=i,S}function ir(i){if(!i.g&&!i.v){i.Y=1;var o=i.Da;ae||d(),se||(ae(),se=!0),w.add(o,i),i.A=0}}function ii(i){return i.g||i.v||i.A>=3?!1:(i.Y++,i.v=_t(m(i.Da,i),or(i,i.A)),i.A++,!0)}n.Da=function(){if(this.v=null,sr(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var i=4*this.T;this.j.info("BP detection timer enabled: "+i),this.B=_t(m(this.Wa,this),i)}},n.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,Q(10),en(this),sr(this))};function si(i){i.B!=null&&(l.clearTimeout(i.B),i.B=null)}function sr(i){i.g=new Se(i,i.j,"rpc",i.Y),i.u===null&&(i.g.J=i.o),i.g.P=0;var o=de(i.na);U(o,"RID","rpc"),U(o,"SID",i.M),U(o,"AID",i.K),U(o,"CI",i.F?"0":"1"),!i.F&&i.ia&&U(o,"TO",i.ia),U(o,"TYPE","xmlhttp"),Pt(i,o),i.u&&i.o&&ti(o,i.u,i.o),i.O&&(i.g.H=i.O);var c=i.g;i=i.ba,c.M=1,c.A=Xt(de(o)),c.u=null,c.R=!0,Ms(c,i)}n.Va=function(){this.C!=null&&(this.C=null,en(this),ii(this),Q(19))};function nn(i){i.C!=null&&(l.clearTimeout(i.C),i.C=null)}function rr(i,o){var c=null;if(i.g==o){nn(i),si(i),i.g=null;var h=2}else if(Xn(i.h,o))c=o.G,Us(i.h,o),h=1;else return;if(i.I!=0){if(o.o)if(h==1){c=o.u?o.u.length:0,o=Date.now()-o.F;var E=i.D;h=qt(),X(h,new Cs(h,c)),tn(i)}else ir(i);else if(E=o.m,E==3||E==0&&o.X>0||!(h==1&&Tc(i,o)||h==2&&ii(i)))switch(c&&c.length>0&&(o=i.h,o.i=o.i.concat(c)),E){case 1:qe(i,5);break;case 4:qe(i,10);break;case 3:qe(i,6);break;default:qe(i,2)}}}function or(i,o){let c=i.Qa+Math.floor(Math.random()*i.Za);return i.isActive()||(c*=2),c*o}function qe(i,o){if(i.j.info("Error code "+o),o==2){var c=m(i.bb,i),h=i.Ua;const E=!h;h=new Ae(h||"//www.google.com/images/cleardot.gif"),l.location&&l.location.protocol=="http"||vt(h,"https"),Xt(h),E?mc(h.toString(),c):yc(h.toString(),c)}else Q(2);i.I=0,i.l&&i.l.pa(o),ar(i),er(i)}n.bb=function(i){i?(this.j.info("Successfully pinged google.com"),Q(2)):(this.j.info("Failed to ping google.com"),Q(1))};function ar(i){if(i.I=0,i.ja=[],i.l){const o=$s(i.h);(o.length!=0||i.i.length!=0)&&(M(i.ja,o),M(i.ja,i.i),i.h.i.length=0,O(i.i),i.i.length=0),i.l.oa()}}function cr(i,o,c){var h=c instanceof Ae?de(c):new Ae(c);if(h.g!="")o&&(h.g=o+"."+h.g),bt(h,h.u);else{var E=l.location;h=E.protocol,o=o?o+"."+E.hostname:E.hostname,E=+E.port;const T=new Ae(null);h&&vt(T,h),o&&(T.g=o),E&&bt(T,E),c&&(T.h=c),h=T}return c=i.G,o=i.wa,c&&o&&U(h,c,o),U(h,"VER",i.ka),Pt(i,h),h}function lr(i,o,c){if(o&&!i.L)throw Error("Can't create secondary domain capable XhrIo object.");return o=i.Aa&&!i.ma?new $(new ei({ab:c})):new $(i.ma),o.Fa(i.L),o}n.isActive=function(){return!!this.l&&this.l.isActive(this)};function hr(){}n=hr.prototype,n.ra=function(){},n.qa=function(){},n.pa=function(){},n.oa=function(){},n.isActive=function(){return!0},n.Ka=function(){};function sn(){}sn.prototype.g=function(i,o){return new ne(i,o)};function ne(i,o){K.call(this),this.g=new Zs(o),this.l=i,this.h=o&&o.messageUrlParams||null,i=o&&o.messageHeaders||null,o&&o.clientProtocolHeaderRequired&&(i?i["X-Client-Protocol"]="webchannel":i={"X-Client-Protocol":"webchannel"}),this.g.o=i,i=o&&o.initMessageHeaders||null,o&&o.messageContentType&&(i?i["X-WebChannel-Content-Type"]=o.messageContentType:i={"X-WebChannel-Content-Type":o.messageContentType}),o&&o.sa&&(i?i["X-WebChannel-Client-Profile"]=o.sa:i={"X-WebChannel-Client-Profile":o.sa}),this.g.U=i,(i=o&&o.Qb)&&!p(i)&&(this.g.u=i),this.A=o&&o.supportsCrossDomainXhr||!1,this.v=o&&o.sendRawJson||!1,(o=o&&o.httpSessionIdParam)&&!p(o)&&(this.g.G=o,i=this.h,i!==null&&o in i&&(i=this.h,o in i&&delete i[o])),this.j=new lt(this)}v(ne,K),ne.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},ne.prototype.close=function(){ni(this.g)},ne.prototype.o=function(i){var o=this.g;if(typeof i=="string"){var c={};c.__data__=i,i=c}else this.v&&(c={},c.__data__=Vn(i),i=c);o.i.push(new cc(o.Ya++,i)),o.I==3&&tn(o)},ne.prototype.N=function(){this.g.l=null,delete this.j,ni(this.g),delete this.g,ne.Z.N.call(this)};function ur(i){Gn.call(this),i.__headers__&&(this.headers=i.__headers__,this.statusCode=i.__status__,delete i.__headers__,delete i.__status__);var o=i.__sm__;if(o){e:{for(const c in o){i=c;break e}i=void 0}(this.i=i)&&(i=this.i,o=o!==null&&i in o?o[i]:void 0),this.data=o}else this.data=i}v(ur,Gn);function fr(){zn.call(this),this.status=1}v(fr,zn);function lt(i){this.g=i}v(lt,hr),lt.prototype.ra=function(){X(this.g,"a")},lt.prototype.qa=function(i){X(this.g,new ur(i))},lt.prototype.pa=function(i){X(this.g,new fr)},lt.prototype.oa=function(){X(this.g,"b")},sn.prototype.createWebChannel=sn.prototype.g,ne.prototype.send=ne.prototype.o,ne.prototype.open=ne.prototype.m,ne.prototype.close=ne.prototype.close,lp=function(){return new sn},cp=function(){return qt()},ap=ze,op={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},Jt.NO_ERROR=0,Jt.TIMEOUT=8,Jt.HTTP_ERROR=6,rp=Jt,Rs.COMPLETE="complete",sp=Rs,vs.EventType=yt,yt.OPEN="a",yt.CLOSE="b",yt.ERROR="c",yt.MESSAGE="d",K.prototype.listen=K.prototype.J,ip=vs,$.prototype.listenOnce=$.prototype.K,$.prototype.getLastError=$.prototype.Ha,$.prototype.getLastErrorCode=$.prototype.ya,$.prototype.getStatus=$.prototype.ca,$.prototype.getResponseJson=$.prototype.La,$.prototype.getResponseText=$.prototype.la,$.prototype.send=$.prototype.ea,$.prototype.setWithCredentials=$.prototype.Fa,np=$}).apply(typeof ln<"u"?ln:typeof self<"u"?self:typeof window<"u"?window:{});var io="@firebase/ai",xi="2.16.0";/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const et="AI",hp="us-central1",up="global",fp="firebasevertexai.googleapis.com",pt="v1beta",so=xi,dp="gl-js",pp="hybrid",gp=180*1e3,mp="gemini-2.5-flash-lite";/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class k extends oe{constructor(e,t,s){const r=et,a=`${r}/${e}`,l=`${r}: ${t} (${a})`;super(e,l),this.code=e,this.customErrorData=s,Error.captureStackTrace&&Error.captureStackTrace(this,k),Object.setPrototypeOf(this,k.prototype),this.toString=()=>l}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ro=["user","model","function","system"],Fa={HARM_SEVERITY_UNSUPPORTED:"HARM_SEVERITY_UNSUPPORTED"},q={SAFETY:"SAFETY",RECITATION:"RECITATION",BLOCKLIST:"BLOCKLIST",PROHIBITED_CONTENT:"PROHIBITED_CONTENT",SPII:"SPII",MALFORMED_FUNCTION_CALL:"MALFORMED_FUNCTION_CALL",IMAGE_SAFETY:"IMAGE_SAFETY",IMAGE_PROHIBITED_CONTENT:"IMAGE_PROHIBITED_CONTENT",IMAGE_OTHER:"IMAGE_OTHER",NO_IMAGE:"NO_IMAGE",IMAGE_RECITATION:"IMAGE_RECITATION",LANGUAGE:"LANGUAGE",UNEXPECTED_TOOL_CALL:"UNEXPECTED_TOOL_CALL",TOO_MANY_TOOL_CALLS:"TOO_MANY_TOOL_CALLS",MISSING_THOUGHT_SIGNATURE:"MISSING_THOUGHT_SIGNATURE",MALFORMED_RESPONSE:"MALFORMED_RESPONSE"},ue={PREFER_ON_DEVICE:"prefer_on_device",ONLY_ON_DEVICE:"only_on_device",ONLY_IN_CLOUD:"only_in_cloud",PREFER_IN_CLOUD:"prefer_in_cloud"},Ne={ON_DEVICE:"on_device",IN_CLOUD:"in_cloud"};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const R={ERROR:"error",REQUEST_ERROR:"request-error",RESPONSE_ERROR:"response-error",FETCH_ERROR:"fetch-error",SESSION_CLOSED:"session-closed",INVALID_CONTENT:"invalid-content",API_NOT_ENABLED:"api-not-enabled",INVALID_SCHEMA:"invalid-schema",NO_API_KEY:"no-api-key",NO_APP_ID:"no-app-id",NO_MODEL:"no-model",NO_PROJECT_ID:"no-project-id",PARSE_FAILED:"parse-failed",UNSUPPORTED:"unsupported"};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ye={AGENT_PLATFORM:"AGENT_PLATFORM",VERTEX_AI:"VERTEX_AI",GOOGLE_AI:"GOOGLE_AI"};/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rs{constructor(e){this.backendType=e}}class os extends rs{constructor(){super(ye.GOOGLE_AI)}_getModelPath(e,t){return`/${pt}/projects/${e}/${t}`}_getTemplatePath(e,t){return`/${pt}/projects/${e}/templates/${t}`}}class as extends rs{constructor(e){super(ye.VERTEX_AI),this.location=hp,e&&(this.location=e)}_getModelPath(e,t){return`/${pt}/projects/${e}/locations/${this.location}/${t}`}_getTemplatePath(e,t){return`/${pt}/projects/${e}/locations/${this.location}/templates/${t}`}}class cs extends rs{constructor(e){super(ye.AGENT_PLATFORM),this.location=up,e&&(this.location=e)}_getModelPath(e,t){return`/${pt}/projects/${e}/locations/${this.location}/${t}`}_getTemplatePath(e,t){return`/${pt}/projects/${e}/locations/${this.location}/templates/${t}`}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function yp(n){if(n instanceof os)return`${et}/googleai`;if(n instanceof as)return`${et}/vertexai/${n.location}`;if(n instanceof cs)return`${et}/agentplatform/${n.location}`;throw new k(R.ERROR,`Invalid backend: ${JSON.stringify(n.backendType)}`)}function wp(n){const e=n.split("/");if(e[0]!==et)throw new k(R.ERROR,`Invalid instance identifier, unknown prefix '${e[0]}'`);switch(e[1]){case"vertexai":const s=e[2];if(!s)throw new k(R.ERROR,`Invalid instance identifier, unknown location '${n}'`);return new as(s);case"agentplatform":const r=e[2];if(!r)throw new k(R.ERROR,`Invalid instance identifier, unknown location '${n}'`);return new cs(r);case"googleai":return new os;default:throw new k(R.ERROR,`Invalid instance identifier string: '${n}'`)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const V=new Bt("@firebase/vertexai");var we;(function(n){n.UNAVAILABLE="unavailable",n.DOWNLOADABLE="downloadable",n.DOWNLOADING="downloading",n.AVAILABLE="available"})(we||(we={}));/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ua={type:"text",languages:["en"]},Ei=[Ua,{type:"image"}],Ii=[Ua];class ce{constructor(e,t,s){this.languageModelProvider=e,this.mode=t,this.downloadPromise=null,this.onDeviceParams={createOptions:{expectedInputs:Ei,expectedOutputs:Ii}},s&&(this.onDeviceParams=s,this.onDeviceParams.createOptions?(this.onDeviceParams.createOptions.expectedInputs||(this.onDeviceParams.createOptions.expectedInputs=Ei),this.onDeviceParams.createOptions.expectedOutputs||(this.onDeviceParams.createOptions.expectedOutputs=Ii)):this.onDeviceParams.createOptions={expectedInputs:Ei,expectedOutputs:Ii})}async isAvailable(e){var s;if(!this.mode)return V.debug("On-device inference unavailable because mode is undefined."),!1;if(this.mode===ue.ONLY_IN_CLOUD)return V.debug('On-device inference unavailable because mode is "only_in_cloud".'),!1;const t=await((s=this.languageModelProvider)==null?void 0:s.availability(this.onDeviceParams.createOptions));if(this.mode===ue.ONLY_ON_DEVICE){if(t===we.UNAVAILABLE)throw new k(R.API_NOT_ENABLED,"Local LanguageModel API not available in this environment.");if(t===we.DOWNLOADABLE||t===we.DOWNLOADING){V.debug("Waiting for download of LanguageModel to complete.");try{await this.downloadPromise}catch(r){throw new k(R.ERROR,r.message)}return!0}return!0}return t!==we.AVAILABLE?(V.debug(`On-device inference unavailable because availability is "${t}".`),!1):ce.isOnDeviceRequest(e)?!0:(V.debug("On-device inference unavailable because request is incompatible."),!1)}async generateContent(e){const t=await this.createSession(),s=await Promise.all(e.contents.map(ce.toLanguageModelMessage)),r=await t.prompt(s,this.onDeviceParams.promptOptions);return ce.toResponse(r)}async generateContentStream(e){const t=await this.createSession(),s=await Promise.all(e.contents.map(ce.toLanguageModelMessage)),r=t.promptStreaming(s,this.onDeviceParams.promptOptions);return ce.toStreamResponse(r)}async countTokens(e){throw new k(R.REQUEST_ERROR,"Count Tokens is not yet available for on-device model.")}static isOnDeviceRequest(e){if(e.contents.length===0)return V.debug("Empty prompt rejected for on-device inference."),!1;for(const t of e.contents){if(t.parts.some(s=>"functionResponse"in s))return V.debug("Content with a function response part rejected for on-device inference."),!1;for(const s of t.parts)if(s.inlineData&&ce.SUPPORTED_MIME_TYPES.indexOf(s.inlineData.mimeType)===-1)return V.debug(`Unsupported mime type "${s.inlineData.mimeType}" rejected for on-device inference.`),!1}return!0}async downloadIfAvailable(e){var s;const t=await((s=this.languageModelProvider)==null?void 0:s.availability(this.onDeviceParams.createOptions));return(t===we.DOWNLOADABLE||t===we.DOWNLOADING)&&this.download(e),t}download(e){var s;if(this.downloadPromise)return;const t={...this.onDeviceParams.createOptions};t&&!t.monitor&&e&&(t.monitor=r=>{r.addEventListener("downloadprogress",a=>{e(a.loaded)})}),this.downloadPromise=(s=this.languageModelProvider)==null?void 0:s.create(t).finally(()=>{this.downloadPromise=null})}static async toLanguageModelMessage(e){const t=await Promise.all(e.parts.map(ce.toLanguageModelMessageContent));return{role:ce.toLanguageModelMessageRole(e.role),content:t}}static async toLanguageModelMessageContent(e){if(e.text)return{type:"text",value:e.text};if(e.inlineData){const s=await(await fetch(`data:${e.inlineData.mimeType};base64,${e.inlineData.data}`)).blob();return{type:"image",value:await createImageBitmap(s)}}throw new k(R.REQUEST_ERROR,"Processing of this Part type is not currently supported.")}static toLanguageModelMessageRole(e){return e==="model"?"assistant":"user"}async createSession(){if(!this.languageModelProvider)throw new k(R.UNSUPPORTED,"Chrome AI requested for unsupported browser version.");const e=await this.languageModelProvider.create(this.onDeviceParams.createOptions);return this.oldSession&&this.oldSession.destroy(),this.oldSession=e,e}static toResponse(e){return{json:async()=>({candidates:[{content:{parts:[{text:e}]}}]})}}static toStreamResponse(e){const t=new TextEncoder;return{body:e.pipeThrough(new TransformStream({transform(s,r){const a=JSON.stringify({candidates:[{content:{role:"model",parts:[{text:s}]}}]});r.enqueue(t.encode(`data: ${a}

`))}}))}}}ce.SUPPORTED_MIME_TYPES=["image/jpeg","image/png"];function _p(n,e,t){const r=(e||Ui()).LanguageModel;if(r&&n)return new ce(r,n,t)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ep{constructor(e,t,s,r,a){this.app=e,this.backend=t,this.chromeAdapterFactory=a;const l=r==null?void 0:r.getImmediate({optional:!0}),u=s==null?void 0:s.getImmediate({optional:!0});this.auth=u||null,this.appCheck=l||null,t instanceof as||t instanceof cs?this.location=t.location:this.location=""}_delete(){return Promise.resolve()}set options(e){this._options=e}get options(){return this._options}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ip(n,{instanceIdentifier:e}){if(!e)throw new k(R.ERROR,"AIService instance identifier is undefined.");const t=wp(e),s=n.getProvider("app").getImmediate(),r=n.getProvider("auth-internal"),a=n.getProvider("app-check-internal");return new Ep(s,t,r,a,_p)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Tp(n){var t,s,r,a,l,u,f;if((s=(t=n.app)==null?void 0:t.options)!=null&&s.apiKey)if((a=(r=n.app)==null?void 0:r.options)!=null&&a.projectId){if(!((u=(l=n.app)==null?void 0:l.options)!=null&&u.appId))throw new k(R.NO_APP_ID,'The "appId" field is empty in the local Firebase config. Firebase AI requires this field to contain a valid app ID.')}else throw new k(R.NO_PROJECT_ID,'The "projectId" field is empty in the local Firebase config. Firebase AI requires this field to contain a valid project ID.');else throw new k(R.NO_API_KEY,'The "apiKey" field is empty in the local Firebase config. Firebase AI requires this field to contain a valid API key.');const e={apiKey:n.app.options.apiKey,project:n.app.options.projectId,appId:n.app.options.appId,automaticDataCollectionEnabled:n.app.automaticDataCollectionEnabled,location:n.location,backend:n.backend};if(le(n.app)&&n.app.settings.appCheckToken){const m=n.app.settings.appCheckToken;e.getAppCheckToken=()=>Promise.resolve({token:m})}else n.appCheck&&((f=n.options)!=null&&f.useLimitedUseAppCheckTokens?e.getAppCheckToken=()=>n.appCheck.getLimitedUseToken():e.getAppCheckToken=()=>n.appCheck.getToken());return n.auth&&(e.getAuthToken=()=>n.auth.getToken()),e}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dt{constructor(e,t){this._apiSettings=Tp(e),this.model=Dt.normalizeModelName(t,this._apiSettings.backend.backendType)}static normalizeModelName(e,t){return t===ye.GOOGLE_AI?Dt.normalizeGoogleAIModelName(e):Dt.normalizeVertexAIModelName(e)}static normalizeGoogleAIModelName(e){return`models/${e}`}static normalizeVertexAIModelName(e){let t;return e.includes("/")?e.startsWith("models/")?t=`publishers/google/${e}`:t=e:t=`publishers/google/models/${e}`,t}}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vp="Timeout has expired.",Ti="AbortError";class bp{constructor(e){this.params=e}toString(){const e=new URL(this.baseUrl);return e.pathname=this.pathname,e.search=this.queryParams.toString(),e.toString()}get pathname(){return this.params.templateId?`${this.params.apiSettings.backend._getTemplatePath(this.params.apiSettings.project,this.params.templateId)}:${this.params.task}`:`${this.params.apiSettings.backend._getModelPath(this.params.apiSettings.project,this.params.model)}:${this.params.task}`}get baseUrl(){var e;return((e=this.params.singleRequestOptions)==null?void 0:e.baseUrl)??`https://${fp}`}get queryParams(){const e=new URLSearchParams;return this.params.stream&&e.set("alt","sse"),e}}function Sp(n){const e=[];return e.push(`${dp}/${so}`),e.push(`fire/${so}`),(n.params.apiSettings.inferenceMode===ue.PREFER_ON_DEVICE||n.params.apiSettings.inferenceMode===ue.PREFER_IN_CLOUD)&&e.push(pp),e.join(" ")}async function Ap(n){const e=new Headers;if(e.append("Content-Type","application/json"),e.append("x-goog-api-client",Sp(n)),e.append("x-goog-api-key",n.params.apiSettings.apiKey),n.params.apiSettings.automaticDataCollectionEnabled&&e.append("X-Firebase-Appid",n.params.apiSettings.appId),n.params.apiSettings.getAppCheckToken){const t=await n.params.apiSettings.getAppCheckToken();t&&(e.append("X-Firebase-AppCheck",t.token),t.error&&V.warn(`Unable to obtain a valid App Check token: ${t.error.message}`))}if(n.params.apiSettings.getAuthToken){const t=await n.params.apiSettings.getAuthToken();t&&e.append("Authorization",`Firebase ${t.accessToken}`)}return e}async function ls(n,e){var m,b;const t=new bp(n);let s;const r=(m=n.singleRequestOptions)==null?void 0:m.signal,a=((b=n.singleRequestOptions)==null?void 0:b.timeout)!=null&&n.singleRequestOptions.timeout>=0?n.singleRequestOptions.timeout:gp,l=new AbortController,u=setTimeout(()=>{l.abort(new DOMException(vp,Ti)),V.debug(`Aborting request to ${t} due to timeout (${a}ms)`)},a),f=AbortSignal.any(r?[r,l.signal]:[l.signal]);if(r&&r.aborted)throw clearTimeout(u),new DOMException(r.reason??"Aborted externally before fetch",Ti);try{const v={method:"POST",headers:await Ap(t),signal:f,body:e};if(s=await fetch(t.toString(),v),!s.ok){let A="",O;try{const M=await s.json();A=M.error.message,M.error.details&&(A+=` ${JSON.stringify(M.error.details)}`,O=M.error.details)}catch{}throw s.status===403&&O&&O.some(M=>M.reason==="SERVICE_DISABLED")&&O.some(M=>{var D,C;return(C=(D=M.links)==null?void 0:D[0])==null?void 0:C.description.includes("Google developers console API activation")})?new k(R.API_NOT_ENABLED,`The Firebase AI SDK requires the Firebase AI API ('firebasevertexai.googleapis.com') to be enabled in your Firebase project. Enable this API by visiting the Firebase Console at https://console.firebase.google.com/project/${t.params.apiSettings.project}/ailogic/ and clicking "Get started". If you enabled this API recently, wait a few minutes for the action to propagate to our systems and then retry.`,{status:s.status,statusText:s.statusText,errorDetails:O}):new k(R.FETCH_ERROR,`Error fetching from ${t}: [${s.status} ${s.statusText}] ${A}`,{status:s.status,statusText:s.statusText,errorDetails:O})}}catch(v){let A=v;throw v.code!==R.FETCH_ERROR&&v.code!==R.API_NOT_ENABLED&&v instanceof Error&&v.name!==Ti&&(A=new k(R.ERROR,`Error fetching from ${t.toString()}: ${v.message}`),A.stack=v.stack),A}finally{clearTimeout(u)}return s}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function hn(n){if(n.candidates&&n.candidates.length>0){if(n.candidates.length>1&&V.warn(`This response had ${n.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),Ba(n.candidates[0]))throw new k(R.RESPONSE_ERROR,`Response error: ${Qe(n)}. Response body stored in error.response`,{response:n});return!0}else return!1}function Sn(n,e=Ne.IN_CLOUD){n.candidates&&!n.candidates[0].hasOwnProperty("index")&&(n.candidates[0].index=0);const t=Cp(n);return t.inferenceSource=e,t}function Cp(n){return n.text=()=>{if(hn(n))return oo(n,e=>!e.thought);if(n.promptFeedback)throw new k(R.RESPONSE_ERROR,`Text not available. ${Qe(n)}`,{response:n});return""},n.thoughtSummary=()=>{if(hn(n)){const e=oo(n,t=>!!t.thought);return e===""?void 0:e}else if(n.promptFeedback)throw new k(R.RESPONSE_ERROR,`Thought summary not available. ${Qe(n)}`,{response:n})},n.inlineDataParts=()=>{if(hn(n))return Rp(n);if(n.promptFeedback)throw new k(R.RESPONSE_ERROR,`Data not available. ${Qe(n)}`,{response:n})},n.functionCalls=()=>{if(hn(n))return $a(n);if(n.promptFeedback)throw new k(R.RESPONSE_ERROR,`Function call not available. ${Qe(n)}`,{response:n})},n}function oo(n,e){var s,r,a,l;const t=[];if((r=(s=n.candidates)==null?void 0:s[0].content)!=null&&r.parts)for(const u of(l=(a=n.candidates)==null?void 0:a[0].content)==null?void 0:l.parts)u.text&&e(u)&&t.push(u.text);return t.length>0?t.join(""):""}function $a(n){var t,s,r,a;if(!n)return;const e=[];if((s=(t=n.candidates)==null?void 0:t[0].content)!=null&&s.parts)for(const l of(a=(r=n.candidates)==null?void 0:r[0].content)==null?void 0:a.parts)l.functionCall&&e.push(l.functionCall);if(e.length>0)return e}function Rp(n){var t,s,r,a;const e=[];if((s=(t=n.candidates)==null?void 0:t[0].content)!=null&&s.parts)for(const l of(a=(r=n.candidates)==null?void 0:r[0].content)==null?void 0:a.parts)l.inlineData&&e.push(l);if(e.length>0)return e}const kp=[q.RECITATION,q.SAFETY,q.BLOCKLIST,q.PROHIBITED_CONTENT,q.SPII,q.MALFORMED_FUNCTION_CALL,q.IMAGE_SAFETY,q.IMAGE_PROHIBITED_CONTENT,q.IMAGE_OTHER,q.NO_IMAGE,q.IMAGE_RECITATION,q.LANGUAGE,q.UNEXPECTED_TOOL_CALL,q.TOO_MANY_TOOL_CALLS,q.MISSING_THOUGHT_SIGNATURE,q.MALFORMED_RESPONSE];function Ba(n){return!!n.finishReason&&kp.some(e=>e===n.finishReason)}function Qe(n){var t,s,r;let e="";if((!n.candidates||n.candidates.length===0)&&n.promptFeedback)e+="Response was blocked",(t=n.promptFeedback)!=null&&t.blockReason&&(e+=` due to ${n.promptFeedback.blockReason}`),(s=n.promptFeedback)!=null&&s.blockReasonMessage&&(e+=`: ${n.promptFeedback.blockReasonMessage}`);else if((r=n.candidates)!=null&&r[0]){const a=n.candidates[0];Ba(a)&&(e+=`Candidate was blocked due to ${a.finishReason}`,a.finishMessage&&(e+=`: ${a.finishMessage}`))}return e}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ja(n){var e,t;if((e=n.safetySettings)==null||e.forEach(s=>{if(s.method)throw new k(R.UNSUPPORTED,"SafetySetting.method is not supported in the the Gemini Developer API. Please remove this property.")}),(t=n.generationConfig)!=null&&t.topK){const s=Math.round(n.generationConfig.topK);s!==n.generationConfig.topK&&(V.warn("topK in GenerationConfig has been rounded to the nearest integer to match the format for requests to the Gemini Developer API."),n.generationConfig.topK=s)}return n}function hs(n){return{candidates:n.candidates?Pp(n.candidates):void 0,prompt:n.promptFeedback?Mp(n.promptFeedback):void 0,usageMetadata:n.usageMetadata}}function Op(n,e){return{generateContentRequest:{model:e,...n}}}function Pp(n){const e=[];let t;return e&&n.forEach(s=>{var l,u;let r;if(s.citationMetadata&&(r={citations:s.citationMetadata.citationSources}),s.safetyRatings&&(t=s.safetyRatings.map(f=>({...f,severity:f.severity??Fa.HARM_SEVERITY_UNSUPPORTED,probabilityScore:f.probabilityScore??0,severityScore:f.severityScore??0}))),(u=(l=s.content)==null?void 0:l.parts)!=null&&u.some(f=>f==null?void 0:f.videoMetadata))throw new k(R.UNSUPPORTED,"Part.videoMetadata is not supported in the Gemini Developer API. Please remove this property.");const a={index:s.index,content:s.content,finishReason:s.finishReason,finishMessage:s.finishMessage,safetyRatings:t,citationMetadata:r,groundingMetadata:s.groundingMetadata,urlContextMetadata:s.urlContextMetadata};e.push(a)}),e}function Mp(n){const e=[];return n.safetyRatings.forEach(s=>{e.push({category:s.category,probability:s.probability,severity:s.severity??Fa.HARM_SEVERITY_UNSUPPORTED,probabilityScore:s.probabilityScore??0,severityScore:s.severityScore??0,blocked:s.blocked})}),{blockReason:n.blockReason,safetyRatings:e,blockReasonMessage:n.blockReasonMessage}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ao=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;async function Np(n,e,t){const s=n.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),r=Fp(s),[a,l]=r.tee(),{response:u,firstValue:f}=await Dp(l,e,t);return{stream:xp(a,e,t),response:u,firstValue:f}}async function Dp(n,e,t){const[s,r]=n.tee(),a=s.getReader(),{value:l}=await a.read();return{firstValue:l,response:Lp(r,e,t)}}async function Lp(n,e,t){const s=[],r=n.getReader();for(;;){const{done:a,value:l}=await r.read();if(a){let u=Up(s);return e.backend.backendType===ye.GOOGLE_AI&&(u=hs(u)),Sn(u,t)}s.push(l)}}async function*xp(n,e,t){var r,a;const s=n.getReader();for(;;){const{value:l,done:u}=await s.read();if(u)break;let f;e.backend.backendType===ye.GOOGLE_AI?f=Sn(hs(l),t):f=Sn(l,t);const m=(r=f.candidates)==null?void 0:r[0];!((a=m==null?void 0:m.content)!=null&&a.parts)&&!(m!=null&&m.finishReason)&&!(m!=null&&m.citationMetadata)&&!(m!=null&&m.urlContextMetadata)||(yield f)}}function Fp(n){const e=n.getReader();return new ReadableStream({start(s){let r="";return a();function a(){return e.read().then(({value:l,done:u})=>{if(u){if(r.trim()){s.error(new k(R.PARSE_FAILED,"Failed to parse stream"));return}s.close();return}r+=l;let f=r.match(ao),m;for(;f;){try{m=JSON.parse(f[1])}catch{s.error(new k(R.PARSE_FAILED,`Error parsing JSON response: "${f[1]}`));return}s.enqueue(m),r=r.substring(f[0].length),f=r.match(ao)}return a()})}}})}function Up(n){const e=n[n.length-1],t={promptFeedback:e==null?void 0:e.promptFeedback};for(const s of n)if(s.candidates)for(const r of s.candidates){const a=r.index||0;t.candidates||(t.candidates=[]),t.candidates[a]||(t.candidates[a]={index:r.index}),t.candidates[a].citationMetadata=r.citationMetadata,t.candidates[a].finishReason=r.finishReason,t.candidates[a].finishMessage=r.finishMessage,t.candidates[a].safetyRatings=r.safetyRatings,t.candidates[a].groundingMetadata=r.groundingMetadata;const l=r.urlContextMetadata;if(typeof l=="object"&&l!==null&&Object.keys(l).length>0&&(t.candidates[a].urlContextMetadata=l),r.content){if(!r.content.parts)continue;t.candidates[a].content||(t.candidates[a].content={role:r.content.role||"user",parts:[]});for(const u of r.content.parts){const f={...u};u.text!==""&&Object.keys(f).length>0&&t.candidates[a].content.parts.push(f)}}}return t}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $p=[R.FETCH_ERROR,R.ERROR,R.API_NOT_ENABLED];async function Ha(n,e,t,s){if(!e)return{response:await s(),inferenceSource:Ne.IN_CLOUD};switch(e.mode){case ue.ONLY_ON_DEVICE:if(await e.isAvailable(n))return{response:await t(),inferenceSource:Ne.ON_DEVICE};throw new k(R.UNSUPPORTED,"Inference mode is ONLY_ON_DEVICE, but an on-device model is not available.");case ue.ONLY_IN_CLOUD:return{response:await s(),inferenceSource:Ne.IN_CLOUD};case ue.PREFER_IN_CLOUD:try{return{response:await s(),inferenceSource:Ne.IN_CLOUD}}catch(r){if(r instanceof k&&$p.includes(r.code)&&await e.isAvailable(n))return{response:await t(),inferenceSource:Ne.ON_DEVICE};throw r}case ue.PREFER_ON_DEVICE:return await e.isAvailable(n)?{response:await t(),inferenceSource:Ne.ON_DEVICE}:{response:await s(),inferenceSource:Ne.IN_CLOUD};default:throw new k(R.ERROR,`Unexpected infererence mode: ${e.mode}`)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Bp(n,e,t,s){return n.backend.backendType===ye.GOOGLE_AI&&(t=ja(t)),ls({task:"streamGenerateContent",model:e,apiSettings:n,stream:!0,singleRequestOptions:s},JSON.stringify(t))}async function Va(n,e,t,s,r){const a=await Ha(t,s,()=>s.generateContentStream(t),()=>Bp(n,e,t,r));return Np(a.response,n,a.inferenceSource)}async function jp(n,e,t,s){return n.backend.backendType===ye.GOOGLE_AI&&(t=ja(t)),ls({model:e,task:"generateContent",apiSettings:n,stream:!1,singleRequestOptions:s},JSON.stringify(t))}async function Ga(n,e,t,s,r){const a=await Ha(t,s,()=>s.generateContent(t),()=>jp(n,e,t,r)),l=await Hp(a.response,n);return{response:Sn(l,a.inferenceSource)}}async function Hp(n,e){const t=await n.json();return e.backend.backendType===ye.GOOGLE_AI?hs(t):t}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function us(n){if(n!=null){if(typeof n=="string")return{role:"system",parts:[{text:n}]};if(n.text)return{role:"system",parts:[n]};if(n.parts)return n.role?n:{role:"system",parts:n.parts}}}function Mt(n){let e=[];if(typeof n=="string")e=[{text:n}];else for(const t of n)typeof t=="string"?e.push({text:t}):e.push(t);return Vp(e)}function Vp(n){const e={role:"user",parts:[]};let t=!1,s=!1;for(const r of n)"functionResponse"in r?s=!0:t=!0,e.parts.push(r);if(t&&s)throw new k(R.INVALID_CONTENT,"Within a single message, FunctionResponse cannot be mixed with other type of Part in the request for sending chat message.");if(!t&&!s)throw new k(R.INVALID_CONTENT,"No Content is provided for sending chat message.");return e}function vi(n){let e;return n.contents?e=n:e={contents:[Mt(n)]},n.systemInstruction&&(e.systemInstruction=us(n.systemInstruction)),e}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const co="SILENT_ERROR",lo=10;class Gp{constructor(e,t,s){this.params=t,this.requestOptions=s,this._history=[],this._sendPromise=Promise.resolve(),this._apiSettings=e}async getHistory(){return await this._sendPromise,this._history}async _sendMessage(e,t){let s={};await this._sendPromise;const r=[];return this._sendPromise=this._sendPromise.then(async()=>{var f,m,b;let a,l=0;const u=((f=this.requestOptions)==null?void 0:f.maxSequentialFunctionCalls)??lo;do{let v;if(a){l++;const M=await this._callFunctionsAsNeeded(a);v=Mt(M)}else v=Mt(e);const A=this._formatRequest(v,[...r]);r.push(v);const O=await this._callGenerateContent(A,t);if(O)if(s=O,a=this._getCallableFunctionCalls(O.response),O.response.candidates&&O.response.candidates.length>0){const M={parts:((m=O.response.candidates)==null?void 0:m[0].content.parts)||[],role:((b=O.response.candidates)==null?void 0:b[0].content.role)||"model"};r.push(M)}else{const M=Qe(O.response);M&&V.warn(`sendMessage() was unsuccessful. ${M}. Inspect response object for details.`)}else a=void 0}while(a&&l<u);a&&l>=u&&V.warn(`Automatic function calling exceeded the limit of ${u} function calls. Returning last model response.`)}),await this._sendPromise,this._history=this._history.concat(r),s}async _sendMessageStream(e,t){await this._sendPromise;const s=[],a=(async()=>{var b;let l,u=0;const f=((b=this.requestOptions)==null?void 0:b.maxSequentialFunctionCalls)??lo;let m;do{let v;if(l){u++;const O=await this._callFunctionsAsNeeded(l);v=Mt(O)}else v=Mt(e);const A=this._formatRequest(v,[...s]);if(s.push(v),m=await this._callGenerateContentStream(A,t),l=this._getCallableFunctionCalls(m.firstValue),l&&m.firstValue&&m.firstValue.candidates&&m.firstValue.candidates.length>0){const O={...m.firstValue.candidates[0].content};O.role||(O.role="model"),s.push(O)}}while(l&&u<f);return l&&u>=f&&V.warn(`Automatic function calling exceeded the limit of ${f} function calls. Returning last model response.`),{stream:m.stream,response:m.response}})();return this._sendPromise=this._sendPromise.then(async()=>a).catch(l=>{throw new Error(co)}).then(l=>l.response).then(l=>{if(l.candidates&&l.candidates.length>0){this._history=this._history.concat(s);const u={...l.candidates[0].content};u.role||(u.role="model"),this._history.push(u)}else{const u=Qe(l);u&&V.warn(`sendMessageStream() was unsuccessful. ${u}. Inspect response object for details.`)}}).catch(l=>{l.message!==co&&l.name!=="AbortError"&&V.error(l)}),a}_getCallableFunctionCalls(e){var r,a,l;const t=(a=(r=this.params)==null?void 0:r.tools)==null?void 0:a.find(u=>u.functionDeclarations);if(!(t!=null&&t.functionDeclarations))return;const s=$a(e);if(s){for(const u of s)if(!((l=t.functionDeclarations)==null?void 0:l.some(m=>m.name===u.name&&typeof m.functionReference=="function")))return;return s}}async _callFunctionsAsNeeded(e){var a,l;const t=[],s=[],r=(l=(a=this.params)==null?void 0:a.tools)==null?void 0:l.find(u=>u.functionDeclarations);if(r&&r.functionDeclarations){for(const f of e){const m=r.functionDeclarations.find(b=>b.name===f.name);if(m!=null&&m.functionReference){const b=Promise.resolve(m.functionReference(f.args)).catch(v=>{const A=new k(R.ERROR,`Error in user-defined function "${m.name}": ${v.message}`);throw A.stack=v.stack,A});t.push({name:f.name,id:f.id,results:b}),s.push(b)}}await Promise.all(s);const u=[];for(const{name:f,id:m,results:b}of t){const v={name:f,response:await b};m&&(v.id=m),u.push({functionResponse:v})}return u}else throw new k(R.REQUEST_ERROR,'No function declarations were provided in "tools".')}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ho=["text","inlineData","functionCall","functionResponse","thought","thoughtSignature"],zp={user:["text","inlineData","functionResponse"],function:["functionResponse"],model:["text","functionCall","thought","thoughtSignature"],system:["text"]},uo={user:["model"],function:["model"],model:["user","function"],system:[]};function Wp(n){let e=null;for(const t of n){const{role:s,parts:r}=t;if(!e&&s!=="user")throw new k(R.INVALID_CONTENT,`First Content should be with role 'user', got ${s}`);if(!ro.includes(s))throw new k(R.INVALID_CONTENT,`Each item should include role field. Got ${s} but valid roles are: ${JSON.stringify(ro)}`);if(!Array.isArray(r))throw new k(R.INVALID_CONTENT,"Content should have 'parts' property with an array of Parts");if(r.length===0)throw new k(R.INVALID_CONTENT,"Each Content should have at least one part");const a={text:0,inlineData:0,functionCall:0,functionResponse:0,thought:0,thoughtSignature:0,executableCode:0,codeExecutionResult:0};for(const u of r)for(const f of ho)f in u&&(a[f]+=1);const l=zp[s];for(const u of ho)if(!l.includes(u)&&a[u]>0)throw new k(R.INVALID_CONTENT,`Content with role '${s}' can't contain '${u}' part`);if(e&&!uo[s].includes(e.role))throw new k(R.INVALID_CONTENT,`Content with role '${s}' can't follow '${e.role}'. Valid previous roles: ${JSON.stringify(uo)}`);e=t}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Kp extends Gp{constructor(e,t,s,r,a){var l;super(e,r,a),this.model=t,this.chromeAdapter=s,this.params=r,this.requestOptions=a,r!=null&&r.history&&(Wp(r.history),this._history=r.history),((l=this.params)==null?void 0:l.systemInstruction)!=null&&(this.params={...this.params,systemInstruction:us(this.params.systemInstruction)})}_formatRequest(e,t){var s,r,a,l,u;return{safetySettings:(s=this.params)==null?void 0:s.safetySettings,generationConfig:(r=this.params)==null?void 0:r.generationConfig,tools:(a=this.params)==null?void 0:a.tools,toolConfig:(l=this.params)==null?void 0:l.toolConfig,systemInstruction:(u=this.params)==null?void 0:u.systemInstruction,contents:[...this._history,...t,e]}}_callGenerateContent(e,t){return Ga(this._apiSettings,this.model,e,this.chromeAdapter,{...this.requestOptions,...t})}_callGenerateContentStream(e,t){return Va(this._apiSettings,this.model,e,this.chromeAdapter,{...this.requestOptions,...t})}async sendMessage(e,t){return this._sendMessage(e,t)}async sendMessageStream(e,t){return this._sendMessageStream(e,t)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function qp(n,e,t,s){let r="";if(n.backend.backendType===ye.GOOGLE_AI){const l=Op(t,e);r=JSON.stringify(l)}else r=JSON.stringify(t);return(await ls({model:e,task:"countTokens",apiSettings:n,stream:!1,singleRequestOptions:s},r)).json()}async function Jp(n,e,t,s,r){if((s==null?void 0:s.mode)===ue.ONLY_ON_DEVICE)throw new k(R.UNSUPPORTED,"countTokens() is not supported for on-device models.");return qp(n,e,t,r)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yp extends Dt{constructor(e,t,s,r){super(e,t.model),this.chromeAdapter=r,this.generationConfig=t.generationConfig||{},Xp(this.generationConfig),this.safetySettings=t.safetySettings||[],this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=us(t.systemInstruction),this.requestOptions=s||{}}async initializeDeviceModel(e){if(!this.chromeAdapter||this.chromeAdapter.mode===ue.ONLY_IN_CLOUD)return;if(await this.chromeAdapter.downloadIfAvailable(e)===we.UNAVAILABLE){const s=new k(R.API_NOT_ENABLED,"Local LanguageModel API not available in this environment.");if(this.chromeAdapter.mode===ue.ONLY_ON_DEVICE)throw s;V.debug(s.message)}await this.chromeAdapter.downloadPromise}async generateContent(e,t){const s=vi(e);return Ga(this._apiSettings,this.model,{generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,...s},this.chromeAdapter,{...this.requestOptions,...t})}async generateContentStream(e,t){const s=vi(e),{stream:r,response:a}=await Va(this._apiSettings,this.model,{generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,...s},this.chromeAdapter,{...this.requestOptions,...t});return{stream:r,response:a}}startChat(e){return new Kp(this._apiSettings,this.model,this.chromeAdapter,{tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,generationConfig:this.generationConfig,safetySettings:this.safetySettings,...e},this.requestOptions)}async countTokens(e,t){const s=vi(e);return Jp(this._apiSettings,this.model,s,this.chromeAdapter,{...this.requestOptions,...t})}}function Xp(n){var e,t;if(((e=n.thinkingConfig)==null?void 0:e.thinkingBudget)!=null&&((t=n.thinkingConfig)!=null&&t.thinkingLevel))throw new k(R.UNSUPPORTED,"Cannot set both thinkingBudget and thinkingLevel in a config.");if(n.responseSchema!=null&&n.responseJsonSchema!=null)throw new k(R.UNSUPPORTED,"Cannot set both responseSchema and responseJsonSchema in a config.");if((n.responseSchema!=null||n.responseJsonSchema!=null)&&n.responseMimeType!=="application/json"&&n.responseMimeType!=="text/x.enum")throw new k(R.UNSUPPORTED,'responseMimeType must be set to "application/json" or "text/x.enum" if responseSchema or responseJsonSchema are set.')}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fg(n=Rn(),e){n=J(n);const t=Ve(n,et),s=(e==null?void 0:e.backend)??new os,r={useLimitedUseAppCheckTokens:(e==null?void 0:e.useLimitedUseAppCheckTokens)??!1},a=yp(s),l=t.getImmediate({identifier:a});return l.options=r,l}const Qp=["mode","onDeviceParams","inCloudParams"];function dg(n,e,t){var u;const s=e;let r;if(s.mode){for(const f of Object.keys(e))Qp.includes(f)||V.warn(`When a hybrid inference mode is specified (mode is currently set to ${s.mode}), "${f}" cannot be configured at the top level. Configuration for in-cloud and on-device must be done separately in inCloudParams and onDeviceParams. Configuration values set outside of inCloudParams and onDeviceParams will be ignored.`);r=s.inCloudParams||{model:mp}}else r=e;if(!r.model)throw new k(R.NO_MODEL,"Must provide a model name. Example: getGenerativeModel({ model: 'my-model-name' })");const a=(u=n.chromeAdapterFactory)==null?void 0:u.call(n,s.mode,typeof window>"u"?void 0:window,s.onDeviceParams),l=new Yp(n,r,t,a);return l._apiSettings.inferenceMode=s.mode,l}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zp(){fe(new re(et,Ip,"PUBLIC").setMultipleInstances(!0)),ie(io,xi),ie(io,xi,"esm2020")}Zp();export{ug as A,hg as B,re as C,Ne as D,ap as E,oe as F,fg as G,os as H,tp as I,dg as J,ue as K,Bt as L,Lo as R,op as S,ip as W,np as X,le as _,L as a,Ve as b,eg as c,J as d,tt as e,tg as f,Rn as g,ng as h,Bi as i,Z as j,cp as k,sp as l,rp as m,lp as n,fe as o,Jc as p,it as q,ie as r,ig as s,sg as t,Wl as u,rg as v,og as w,lg as x,ag as y,cg as z};
