import {expect,it,vi} from "vitest";
import {GpuTimer} from "../src/render/gpu-timer";

function fixture(){
 let disjoint=false;
 const queries:{available:boolean;result:number;deleted:boolean}[]=[];
 const gl={
  QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,
  getExtension:vi.fn(()=>({TIME_ELAPSED_EXT:3,GPU_DISJOINT_EXT:4})),
  createQuery:vi.fn(()=>{const q={available:false,result:2_500_000,deleted:false};queries.push(q);return q;}),
  beginQuery:vi.fn(),endQuery:vi.fn(),deleteQuery:vi.fn((q:{deleted:boolean})=>{q.deleted=true;}),
  getParameter:vi.fn(()=>disjoint),
  getQueryParameter:vi.fn((q:{available:boolean;result:number},key:number)=>key===1?q.available:q.result),
 };
 return {gl,queries,setDisjoint:(v:boolean)=>{disjoint=v;}};
}
it("samples asynchronously and reads a GPU result only after availability",()=>{
 const f=fixture(),timer=new GpuTimer(f.gl as unknown as WebGL2RenderingContext);expect(timer.supported).toBe(true);
 for(let i=0;i<3;i++)expect(timer.begin()).toBe(false);
 expect(timer.begin()).toBe(true);timer.end();
 expect(timer.poll(100)).toBeNull();expect(f.gl.getQueryParameter).toHaveBeenCalledWith(f.queries[0],1);
 f.queries[0].available=true;expect(timer.poll(116)).toEqual({timeMs:2.5,completedAt:116});
 expect(f.queries[0].deleted).toBe(true);
});
it("discards disjoint GPU timing results instead of reporting misleading values",()=>{
 const f=fixture(),timer=new GpuTimer(f.gl as unknown as WebGL2RenderingContext);
 for(let i=0;i<4;i++)timer.begin()&&timer.end();
 expect(f.queries).toHaveLength(1);f.queries[0].available=true;f.setDisjoint(true);
 expect(timer.poll(200)).toBeNull();expect(f.queries[0].deleted).toBe(true);
});
it("fails closed when the optional timer-query extension is unavailable",()=>{
 const gl={getExtension:vi.fn(()=>null)} as unknown as WebGL2RenderingContext,timer=new GpuTimer(gl);
 expect(timer.supported).toBe(false);expect(timer.begin()).toBe(false);expect(timer.poll(0)).toBeNull();
});
