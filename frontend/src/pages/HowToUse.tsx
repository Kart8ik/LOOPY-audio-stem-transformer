import { Card, CardContent, CardTitle } from "@/components/ui/card"
import image1 from "@/assets/image1.png"
import image2 from "@/assets/image2.png"
import image3 from "@/assets/image3.png"
import image4 from "@/assets/image4.png"
import image5 from "@/assets/image5.png"
import image6 from "@/assets/image6.png"
import image7 from "@/assets/image7.png"

const HowToUse = () => {
  const steps = [
    { header: "1. Start by adding your audio", text:"Upload a file or just paste a YouTube link", image: image1, alt: "image1" },
    { header: "2. Check the preview", text:"Make sure it's the right track by playing it, then hit Next to go to the next step", image: image2, alt: "image2" },
    { header: "3. Pick what you want to do", text:"You can Loop the audio for a given time, remove the vocals, or both", image: image3, alt: "image3" },
    { header: "4. Choose your section", text:"Select the part of the audio you want to loop with the handles", image: image4, alt: "image4" },
    { header: "5. Set the loop duration (if enabled)", text:"Decide how long you want the final loop to run by entering the value", image: image5, alt: "image5" },
    { header: "6. Hit Loop", text:"Give the application around 40-60 seconds to do its thing", image: image6, alt: "image6" },
    { header: "7. Preview and download  ", text:"Play your loop to try it out, go back or download it ", image: image7, alt: "image7" },
  ]

  const renderCard = (header:string, text: string, left: boolean) => (
    <Card className={`flex-2 bg-secondary text-secondary-foreground rounded-xl w-full h-auto ${left ? "items-start" : "items-end"} justify-center px-8`}>
      <CardTitle className="text-5xl font-bold">
        {header}
      </CardTitle>
      <CardContent className="text-xl">
        {text}
      </CardContent>
    </Card>
  )

  const renderImage = (src: string, alt: string) => (
    <div className="flex-1 w-full rounded-xl overflow-hidden">
      <img src={src} alt={alt} className="h-full w-full  object-cover" />
    </div>
  )

  return (
    <div className="flex flex-col px-4 gap-4">
      {steps.map((step, index) => (
        <div key={step.alt} className="flex gap-4">
          {index % 2 === 0 ? (
            <>
              {renderCard(step.header, step.text, true)}
              {renderImage(step.image, step.alt)}
            </>
          ) : (
            <>
              {renderImage(step.image, step.alt)}
              {renderCard(step.header, step.text, false)}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default HowToUse
