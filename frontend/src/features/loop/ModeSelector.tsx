import { Switch } from "@/components/ui/switch"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { toast } from "@/hooks/use-toast"
import type { ModeSelectorProps } from "@/types/loop"

const ModeSelector = ({ loopEnabled, vocalsEnabled, onChange }: ModeSelectorProps) => {
  const handleLoopToggle = (checked: boolean) => {
    if (!checked && !vocalsEnabled) {
      toast({
        title: "At least one mode must be selected",
      })
      return
    }
    onChange(checked, vocalsEnabled)
  }

  const handleVocalsToggle = (checked: boolean) => {
    if (!checked && !loopEnabled) {
      toast({
        title: "At least one mode must be selected",
      })
      return
    }
    onChange(loopEnabled, checked)
  }

  return (
    <div className="flex flex-col gap-4">
      <Field orientation="horizontal" className="max-w-sm">
        <FieldContent>
          <FieldLabel htmlFor="switch-looping" className="text-xl">
            Looping
          </FieldLabel>
        </FieldContent>
        <Switch id="switch-looping" className="size-bg" checked={loopEnabled} onCheckedChange={handleLoopToggle} />
      </Field>
      <Field orientation="horizontal" className="flex  max-w-sm">
        <FieldContent className="flex flex-col">
          <FieldLabel htmlFor="switch-vocal-removal" className="text-xl">
            Vocal Removal
          </FieldLabel>
        </FieldContent>
        <Switch id="switch-vocal-removal" checked={vocalsEnabled} onCheckedChange={handleVocalsToggle} />
      </Field>
    </div>
  )
}

export default ModeSelector
