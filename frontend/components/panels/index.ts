/**
 * GYA-37 — Public barrel for panel primitives.
 *
 * Usage:
 *   import { Panel, PanelHeader, CollapsiblePanel } from "../panels";
 *
 * Example (Tonight panel migration):
 *   <CollapsiblePanel eyebrow="Tonight" heading="Observation brief" defaultOpen>
 *     <article className="brief-card">
 *       <h3>Conditions</h3>
 *       <ObservingConditionsCard ... />
 *     </article>
 *   </CollapsiblePanel>
 */

export { Panel } from "./Panel";
export type { PanelProps } from "./Panel";

export { PanelHeader } from "./PanelHeader";
export type { PanelHeaderProps } from "./PanelHeader";

export { CollapsiblePanel } from "./CollapsiblePanel";
export type { CollapsiblePanelProps } from "./CollapsiblePanel";
