export interface DisplayState {fullscreen:boolean;fullscreenAvailable:boolean;installed:boolean;lockAvailable:boolean;landscapeLocked:boolean}
export class BrowserDisplay {
 private removers:Array<()=>void>=[];private modes:MediaQueryList[]=[];private locked=false;onChange?:()=>void;
 constructor(private notice:(message:string)=>void,private target:HTMLElement=document.documentElement){if(typeof matchMedia==='function')for(const mode of['standalone','minimal-ui','window-controls-overlay']){const q=matchMedia(`(display-mode: ${mode})`);this.modes.push(q);this.listen(q,'change',this.refresh);}this.listen(document,'fullscreenchange',this.changed);this.listen(document,'fullscreenerror',this.error);if(screen.orientation)this.listen(screen.orientation,'change',this.refresh);}
 get state():DisplayState{return{fullscreen:!!document.fullscreenElement,fullscreenAvailable:!!document.fullscreenEnabled&&typeof this.target.requestFullscreen==='function',installed:this.modes.some(q=>q.matches)||(navigator as Navigator&{standalone?:boolean}).standalone===true,lockAvailable:typeof(screen.orientation as ScreenOrientation&{lock?:unknown})?.lock==='function',landscapeLocked:this.locked};}
 private listen(t:EventTarget,n:string,f:EventListener){t.addEventListener(n,f);this.removers.push(()=>t.removeEventListener(n,f));}
 refresh=()=>this.onChange?.();private changed=()=>{if(!this.state.fullscreen&&this.locked){screen.orientation?.unlock?.();this.locked=false;}this.refresh();};private error=()=>{this.notice('Fullscreen is unavailable here. You can keep playing in this browser window.');this.refresh();};
 /** Called synchronously from the user's Create/Load gesture. Requests fullscreen first,
  * then locks landscape once the browser confirms fullscreen. Unsupported browsers degrade gracefully. */
 async enterGameplayDisplay():Promise<{fullscreen:boolean;landscape:boolean}>{
  let fullscreen=this.state.fullscreen;
  let landscape=this.locked;
  if(!fullscreen){
   if(!this.state.fullscreenAvailable){this.notice('Fullscreen is not available in this browser or HTTP origin. You can still play; use HTTPS for immersive mode.');}
   else{
    try{await this.target.requestFullscreen({navigationUI:'hide'});fullscreen=!!document.fullscreenElement;}
    catch(error){this.notice('The browser did not allow fullscreen. You can still play in this window.');}
   }
  }
  const orientation=screen.orientation as ScreenOrientation&{lock?:(mode:string)=>Promise<void>};
  if(fullscreen&&typeof orientation?.lock==='function'){
   try{await orientation.lock('landscape');this.locked=true;landscape=true;}
   catch(error){this.notice('Landscape could not be locked. Rotate your device manually; gameplay remains available.');}
  }
  this.refresh();
  return{fullscreen,landscape};
 }
 async toggleFullscreen(){if(!this.state.fullscreen&&!this.state.fullscreenAvailable){this.error();return false;}try{if(document.fullscreenElement)await document.exitFullscreen();else await this.target.requestFullscreen();this.refresh();return true;}catch(e){if(e instanceof DOMException||e instanceof TypeError){this.error();return false;}throw e;}}
 async toggleLandscape(){const o=screen.orientation as ScreenOrientation&{lock?:(mode:string)=>Promise<void>};if(this.locked){o?.unlock?.();this.locked=false;this.refresh();return true;}if(!this.state.lockAvailable){this.notice('This browser controls orientation. Portrait and landscape both remain available.');return false;}if(!this.state.fullscreen&&!this.state.installed){this.notice('Enter fullscreen first, then choose Lock landscape.');return false;}try{await o.lock!('landscape');this.locked=true;this.refresh();return true;}catch(e){if(e instanceof DOMException||e instanceof TypeError){this.notice('Landscape lock was not allowed. You can rotate the device or keep playing in portrait.');this.refresh();return false;}throw e;}}
 dispose(){if(this.locked)screen.orientation?.unlock?.();this.locked=false;for(const f of this.removers)f();this.removers=[];}
}
