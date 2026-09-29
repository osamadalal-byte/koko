'use strict';
const assert=require('node:assert/strict');

// A real press spans a timer render. Replacing an SVG/text hit target between
// pointer-down and pointer-up can cancel the click, especially in WebKit.
module.exports=async function(page,checks){
  for(const target of ['icon','label']){
    assert.equal(await page.evaluate(()=>session.paused),true);
    await page.locator('#timer-toggle').click();
    await page.waitForFunction(()=>!session.paused);
    const button=page.locator('#timer-toggle');await button.scrollIntoViewIfNeeded();
    const box=await (target==='icon'?button.locator('svg'):button).boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
    await page.mouse.down();
    const stable=await page.evaluate(()=>{
      const b=document.querySelector('#timer-toggle'),nodes=[...b.childNodes];
      updateTimerUI();updateTimerUI();
      return nodes.every((node,i)=>node.isConnected&&b.childNodes[i]===node);
    });
    await page.waitForTimeout(350);
    await page.mouse.up();
    const stopped=await page.evaluate(()=>({paused:session.paused,wanted:workoutPlayback.wanted,status:workoutPlayback.status,remaining:session.remaining}));
    assert(stable&&stopped.paused&&!stopped.wanted,`Pause press across a timer render (${target}): ${JSON.stringify({stable,...stopped})}`);
    await page.waitForTimeout(450);
    assert.equal(await page.evaluate(()=>session.remaining),stopped.remaining,'A completed pause press must stop the real clock');
  }
  checks.push('Real pointer presses on pause icon and label across timer renders: stable hit targets, paused playback intent and stopped clock');
};
