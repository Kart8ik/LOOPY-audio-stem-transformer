import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

const processingText: string[] = [
  "Processing your wonderful song choice...",
  "This usually takes around one and a half times the length of the song...",
  "Watch this cool animation, while the backend elves do their magic...",
  "Or maybe you can switch to another tab and come back later...",
  "Thank you for your patience, and damn your song choice is nice !!!"
]

const Processing = () => {
  const [currentText, setCurrentText] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText(prev => (prev + 1) % processingText.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <Card>
        <CardContent className="bg-secondary text-secondary-foreground items-center justify-center">
          <p>{processingText[currentText]}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Processing
