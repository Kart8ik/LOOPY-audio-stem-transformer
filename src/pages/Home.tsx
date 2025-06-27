import loopy from '@/assets/loopy.png'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const Home = () => {

  return (
    <div className="flex flex-col w-full h-full bg-background text-foreground font-sans px-4 pb-4 overflow-x-hidden no-scrollbar">
      <div className="flex flex-row w-full h-full gap-4">
        <Card className="flex flex-col bg-secondary text-secondary-foreground rounded-xl flex-[2] p-12">
          <CardContent className='px-2 h-full flex flex-col'>
            <p className="text-8xl font-extrabold">CREATE <br /> YOUR OWN BACKGROUND MUSIC</p>
            <p className="self-end text-lg mt-auto w-2/3 text-right">REMOVE VOCALS FROM YOUR FAVORITE SONGS,<br /> LOOP THEM, AND CREATE MUSIC TO STUDY TO</p>
          </CardContent>
        </Card>
        <div className="flex flex-col flex-1 gap-4">
          <img src={loopy} alt="Loopy" className=" aspect-square rounded-xl" />
          <div className="flex flex-row items-stretch mt-auto gap-4">
            <Link to="/loop-lab" className="flex flex-1 justify-center items-center bg-primary text-primary-foreground rounded-full p-4">
              <p className="text-lg font-bold">CLICK TO TRY</p>
            </Link>
            <div className="flex aspect-square justify-center items-center bg-primary text-primary-foreground rounded-full p-4">
              <ArrowLeft className="w-20 h-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
