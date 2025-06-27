import { useEffect, useState } from "react"

const processingText: string[] = [
  "Processing your wonderful song choice...",
  "This usually takes around one and a half times the length of the song...",
  "Watch this cool animation, while the backend elves do their magic...",
  "Or maybe you can switch to another tab and come back later...",
  "Thank you for your patience, and damn your song choice is nice !!!"
]

const LoopingText: string[] = [
  "Looping your Processed song...",
  "This usually takes way less time than processing...",
  "Watch this cool animation, while the backend elves do the magic again...",
  "Or maybe you can switch to another tab and come back later...",
  "Thank you for your patience, and I'm sure you'll love your loop !!!"
]

const Processing = (props: { isLooping: boolean }) => {
  const [currentText, setCurrentText] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText(prev => (prev + 1) % (props.isLooping ? LoopingText.length : processingText.length))
      console.log(props.isLooping)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex h-[1300px] w-[1300px] items-center justify-center">
      <div className="spinner-circle-1" />
      <div className="spinner-circle-2" />
      <div className="spinner-circle-3" />
      <div className="spinner-circle-4" />
      <p
        key={currentText}
        className="animate-in fade-in duration-500 absolute max-w-2xl text-center text-4xl font-bold text-secondary"
      >
        {props.isLooping ? LoopingText[currentText] : processingText[currentText]}
      </p>
    </div>
  )
}

export default Processing
