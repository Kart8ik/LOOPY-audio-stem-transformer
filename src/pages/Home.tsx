import loopy from '@/assets/loopy.png'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowDown } from 'lucide-react'
import { Link } from 'react-router-dom'

const Home = () => {

  return (
    <div className="flex flex-col w-full h-full bg-background text-foreground font-sans px-4 pb-4 overflow-x-hidden no-scrollbar">
      <div className="flex flex-row w-full h-full">
        <Card className="flex flex-col bg-secondary text-secondary-foreground rounded-xl w-2/3 h-full flex-wrap p-12">
          <CardContent className='px-2 h-full flex flex-col'>
            <p className="text-8xl font-extrabold">CREATE <br /> YOUR OWN BACKGROUND MUSIC</p>
            <p className="self-end text-lg mt-auto w-2/3 text-right">REMOVE VOCALS FROM YOUR FAVORITE SONGS,<br /> LOOP THEM, AND CREATE MUSIC TO STUDY TO</p>
          </CardContent>
        </Card>
        <div className="flex flex-col w-1/3 h-full">
          <img src={loopy} alt="Loopy" className=" aspect-square ml-4 rounded-xl" />
          <div className="flex flex-row mt-4 ml-4 w-full h-full justify-center items-center gap-4">
            <Link to="/loopy" className="flex flex-col w-full h-full bg-primary text-primary-foreground rounded-full p-4 justify-center items-center gap-4 w-1/2">  
              <p className="text-lg">CLICK TO TRY</p>
            </Link>
            <div className="flex flex-col bg-secondary h-full mr-4 aspect-square items-center justify-center bg-primary text-primary-foreground rounded-full p-4">
              <ArrowDown className="w-20 h-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
