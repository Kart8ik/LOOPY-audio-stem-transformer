import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"

type LoopControlsProps = {
  loopDuration: number
  setLoopDuration: (value: number) => void
  disabled: boolean
}

const LoopControls = ({ loopDuration, setLoopDuration, disabled }: LoopControlsProps) => {
    const [isEditingDuration, setIsEditingDuration] = useState(false)
    const [durationInput, setDurationInput] = useState(loopDuration.toString())

    const handleEditDuration = () => {
        setDurationInput(loopDuration.toString())
        setIsEditingDuration(true)
    }

    const handleSaveDuration = () => {
        const value = parseInt(durationInput)
        if (value >= 1) {
            setLoopDuration(value)
        } else {
            setDurationInput(loopDuration.toString())
        }
        setIsEditingDuration(false)
    }

    const handleDurationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveDuration()
        } else if (e.key === 'Escape') {
            setIsEditingDuration(false)
        }
    }

    // Update input field when loopDuration changes
    useEffect(() => {
        if (!isEditingDuration) {
            setDurationInput(loopDuration.toString())
        }
    }, [loopDuration, isEditingDuration])

    return (
        <Card className={`flex-1 bg-secondary text-secondary-foreground flex-grow rounded-xl ${disabled ? 'opacity-50' : ''}`}>
            <CardContent className="flex flex-col items-center justify-center flex-grow h-full gap-4">
                <p className="text-4xl text-center font-bold">LOOP SECTION FOR</p>
                <div className="flex w-full flex-row items-center justify-center gap-8">
                    <Button 
                        onClick={() => setLoopDuration(Math.max(1, loopDuration - 1))}
                        disabled={disabled || loopDuration <= 1}
                        className="bg-primary text-primary-foreground rounded-full w-20 h-20 text-4xl font-bold hover:bg-primary/80"
                    >
                        -
                    </Button>
                    <div 
                        className="flex flex-col items-center gap-1 cursor-pointer h-fit"
                        onClick={handleEditDuration}
                    >
                        {isEditingDuration ? (
                            <Input
                                type="number"
                                min="1"
                                value={durationInput}
                                onChange={(e) => setDurationInput(e.target.value)}
                                onBlur={handleSaveDuration}
                                onKeyDown={handleDurationKeyDown}
                                autoFocus
                                className="text-6xl text-center text-primary font-bold w-32 p-0 border-0 bg-background h-fit leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                        ) : (
                            <>
                                <p className="text-7xl font-bold text-primary">{loopDuration}</p>
                            </>
                        )}
                        <p className="text-sm text-primary-foreground">MINUTES</p>
                    </div>
                    <Button 
                        onClick={() => setLoopDuration(loopDuration + 1)}
                        disabled={disabled}
                        className="bg-primary text-primary-foreground rounded-full w-20 h-20 text-4xl font-bold hover:bg-primary/80"
                    >
                        +
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default LoopControls
