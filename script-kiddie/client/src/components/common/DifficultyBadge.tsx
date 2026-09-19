import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "@/types";

const variantMap: Record<Difficulty, "easy" | "warning" | "danger"> = {
  easy: "easy",
  medium: "warning",
  hard: "danger",
};

const labelMap: Record<Difficulty, string> = {
  easy: "Script Kiddie",
  medium: "Experienced Coder",
  hard: "Senior Developer",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge variant={variantMap[difficulty]} className="font-sans normal-case tracking-normal">
      {labelMap[difficulty]}
    </Badge>
  );
}
