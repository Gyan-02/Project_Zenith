export type ZenithPanel =
  | "conditions"
  | "events"
  | "passes"
  | "iss"
  | "layers"
  | "object"
  | "snapshot"
  | "provenance";

export interface ShellAction {
  id: ZenithPanel;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}
