import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { selectedlanguage } from "./context/langContext";

export function LangSelect() {
    const {setLanguage} = selectedlanguage()
  return (
    <Select onValueChange={(value)=> setLanguage(value)}>
      <SelectTrigger className="w-full max-w-50">
        <SelectValue placeholder="Select a Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Languages</SelectLabel>
          <SelectItem value="en-US">English(US)</SelectItem>
          <SelectItem value="en-GB">English(UK)</SelectItem>
          <SelectItem value="hi-IN">Hindi</SelectItem>
          <SelectItem value="fr-FR">French</SelectItem>
          <SelectItem value="es-ES">Spanish</SelectItem>
          <SelectItem value="de-DE">German</SelectItem>
          <SelectItem value="ja-JP">Japanese</SelectItem>
          <SelectItem value="zh-CN">Chinese</SelectItem>
          <SelectItem value="ar-SA">Arabic</SelectItem>
          <SelectItem value="ko-KR">Korean</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
