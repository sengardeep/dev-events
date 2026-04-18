'use client'

import Image from "next/image";
import Link from "next/link";

const ExportBtn = () => {
  return (
    <Link href="#events" id="explore-btn" className="mt-7 mx-auto">
      <span>Explore Events</span>
      <Image src="/icons/arrow-down.svg" alt="arrow-down" width={24} height={24} />
    </Link>
  )
}

export default ExportBtn