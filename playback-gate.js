/* A media event cannot start the clock without current, visible user intent. */
(function(root){
  'use strict';
  class PlaybackGate {
    constructor(hooks){this.hooks=hooks;this.generation=0;this.kind='video';this.status='idle';this.wanted=false;this.hidden=false;this.active=false}
    select(kind){this.close();this.active=true;this.kind=kind;this.status='ready';this.hidden=false;this.notify();return this.generation}
    notify(){this.hooks.change?.(this)}
    play(){
      if(!this.active||this.hidden)return;
      this.wanted=true;
      if(this.kind==='timer'){this.status='playing';this.hooks.start();this.notify();return}
      this.status='loading';this.notify();this.hooks.play();
    }
    pause(){if(!this.active)return;this.wanted=false;this.hooks.stop();this.status='paused';this.hooks.pause();this.notify()}
    visibility(hidden){this.hidden=hidden;if(hidden)this.pause()}
    event(name,generation=this.generation){
      if(!this.active||generation!==this.generation||this.kind!=='video')return false;
      if(name==='playing'){
        if(!this.wanted||this.hidden){this.hooks.pause();return false}
        this.status='playing';this.hooks.start();
      }else if(name==='buffering'){
        this.hooks.stop();if(this.wanted)this.status='buffering';
      }else if(name==='ended'){
        this.hooks.stop();if(this.wanted&&!this.hidden){this.status='loading';this.hooks.replay()}else this.status='paused';
      }else if(name==='paused'){
        this.hooks.stop();this.wanted=false;this.status='paused';
      }else if(name==='blocked'||name==='error'){
        this.hooks.stop();this.wanted=false;this.status=name;
      }else return false;
      this.notify();return true;
    }
    close(){this.wanted=false;this.active=false;this.generation++;this.hooks.stop();this.hooks.pause();this.status='idle'}
  }
  root.PlaybackGate=PlaybackGate;
  if(typeof module!=='undefined'&&module.exports)module.exports=PlaybackGate;
})(typeof globalThis!=='undefined'?globalThis:this);
