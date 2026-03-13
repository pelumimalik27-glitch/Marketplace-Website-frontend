import React from 'react'
import { useRef,useState } from 'react'

function Counter() {
    
    const [count, setCount] = useState(2);
    const ref = (6)
    const refCount = useRef(ref);
    const handleClick = ()=>{
        setCount(count + 1)
        refCount.current.focus()
        console.log("Ref count:",refCount.current)
    }
   return (
    <div>
       <h2 className='bg-red-500'>count:{count} </h2>
       <h2>useRef count</h2>
       <button onClick={()=>handleClick()} className='bg-red-700 w-[10%] h-20'>Counter Update</button>

    </div>
  )

    }
  

export default Counter