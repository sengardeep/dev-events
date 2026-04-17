'use client'
const ExportBtn = () => {
  return (
    <button type="button" id="explore-btn" className="mt-7 mx-auto" onClick={()=>{console.log("Clicked");
    }}>
        <a href="#events">
            Explore Events
            <img src="/icons/arrow-down.svg" alt="arrow-down" width={24} height={24}/>
        </a>
        </button>
  )
}

export default ExportBtn