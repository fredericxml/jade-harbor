export interface LifecyclePort {suspend():Promise<unknown>;restore():void;release():void}
/** Suspension policy only; physical input adapters retain their own handlers. */
export class BrowserLifecycle {
 private removers:Array<()=>void>=[];private suspended=false;private saving:Promise<unknown>=Promise.resolve();private disposed=false;
 constructor(private port:LifecyclePort){this.listen(document,'visibilitychange',()=>{if(document.hidden)this.suspend();else this.restore();});this.listen(window,'blur',()=>this.suspend());this.listen(window,'focus',()=>{if(!document.hidden)this.restore();});this.listen(window,'pagehide',()=>{this.suspend();void this.saving.finally(()=>{if(!this.disposed)this.port.release();});});this.listen(window,'pageshow',e=>{if((e as PageTransitionEvent).persisted){this.suspend();this.restore();}});this.listen(document,'freeze',()=>this.suspend());this.listen(document,'resume',()=>this.restore());}
 private listen(t:EventTarget,n:string,f:EventListener){t.addEventListener(n,f);this.removers.push(()=>t.removeEventListener(n,f));}
 private suspend(){if(this.suspended||this.disposed)return;this.suspended=true;this.saving=this.port.suspend();}
 private restore(){if(this.disposed||!this.suspended)return;this.suspended=false;this.port.restore();}
 dispose(){if(this.disposed)return;this.disposed=true;for(const f of this.removers)f();this.removers=[];this.port.release();}get listenerCount(){return this.removers.length;}
}
